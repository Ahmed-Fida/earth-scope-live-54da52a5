import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface DrawnShape {
  type: 'polygon' | 'rectangle' | 'marker';
  coordinates: number[][] | number[];
  geoJSON: any;
}

interface LeafletMapProps {
  onShapeDrawn?: (shape: DrawnShape | null) => void;
}

// Pakistan bounding box for validation
const PAKISTAN_BOUNDS_OBJ = { minLat: 23.5, maxLat: 37.1, minLon: 60.9, maxLon: 77.5 };

function isPointInsidePakistan(lat: number, lon: number): boolean {
  return (
    lat >= PAKISTAN_BOUNDS_OBJ.minLat &&
    lat <= PAKISTAN_BOUNDS_OBJ.maxLat &&
    lon >= PAKISTAN_BOUNDS_OBJ.minLon &&
    lon <= PAKISTAN_BOUNDS_OBJ.maxLon
  );
}

function isShapeInsidePakistan(layer: any, layerType: string): boolean {
  if (layerType === 'marker') {
    const latlng = layer.getLatLng();
    return isPointInsidePakistan(latlng.lat, latlng.lng);
  }
  // For polygons/rectangles, check all vertices
  const latlngs = layer.getLatLngs()[0] || layer.getLatLngs();
  for (const latlng of latlngs) {
    if (!isPointInsidePakistan(latlng.lat, latlng.lng)) {
      return false;
    }
  }
  return true;
}

export function LeafletMap({ onShapeDrawn }: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const toastRef = useRef<((msg: string) => void) | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const pakistanBounds = L.latLngBounds(
      L.latLng(23.5, 60.9),
      L.latLng(37.1, 77.5)
    );

    const map = L.map(mapContainer.current, {
      center: [30.3753, 69.3451],
      zoom: 5,
      zoomControl: false,
      maxBounds: pakistanBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 5,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    map.fitBounds(pakistanBounds, { padding: [20, 20] });

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    const drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        polyline: false,
        circle: false,
        circlemarker: false,
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2, weight: 2 },
        },
        rectangle: false,
        marker: false,
      },
      edit: { featureGroup: drawnItems, remove: true },
    });
    map.addControl(drawControl);

    // Show toast for outside-Pakistan drawing
    const showToast = (msg: string) => {
      // Create a temporary notification on the map
      const notification = L.DomUtil.create('div', '');
      notification.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:9999;background:hsl(0 84% 60%);color:white;padding:12px 24px;border-radius:8px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
      notification.textContent = 'Please choose within the boundaries of Pakistan.';
      document.body.appendChild(notification);
      setTimeout(() => {
        if (notification.parentNode) notification.parentNode.removeChild(notification);
      }, 3000);
    };

    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;

      // Check if shape is inside Pakistan
      if (!isShapeInsidePakistan(layer, e.layerType)) {
        showToast('Please select a location within Pakistan');
        return; // Don't add the shape
      }

      drawnItems.clearLayers();
      drawnItems.addLayer(layer);

      const geoJSON = layer.toGeoJSON();
      let shape: DrawnShape;

      if (e.layerType === 'polygon' || e.layerType === 'rectangle') {
        const coords = layer.getLatLngs()[0].map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);
        shape = { type: e.layerType, coordinates: coords, geoJSON };
      } else {
        const latlng = layer.getLatLng();
        shape = { type: 'marker', coordinates: [latlng.lat, latlng.lng], geoJSON };
      }

      onShapeDrawn?.(shape);
    });

    map.on(L.Draw.Event.DELETED, () => onShapeDrawn?.(null));

    mapRef.current = map;

    (window as any).leafletMapMethods = {
      addMarker: (lat: number, lng: number) => {
        drawnItems.clearLayers();
        const marker = L.marker([lat, lng]);
        drawnItems.addLayer(marker);
        map.setView([lat, lng], 10);
        onShapeDrawn?.({ type: 'marker', coordinates: [lat, lng], geoJSON: marker.toGeoJSON() });
      },
      addShapeFromCoords: (coords: { lat: number; lng: number }[], type: 'polygon' | 'rectangle') => {
        drawnItems.clearLayers();
        const latLngs = coords.map(c => L.latLng(c.lat, c.lng));
        const polygon = L.polygon(latLngs, { color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2, weight: 2 });
        drawnItems.addLayer(polygon);
        map.fitBounds(polygon.getBounds(), { padding: [50, 50] });
        onShapeDrawn?.({ type, coordinates: coords.map(c => [c.lat, c.lng]), geoJSON: polygon.toGeoJSON() });
      },
    };

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onShapeDrawn]);

  return <div ref={mapContainer} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />;
}
