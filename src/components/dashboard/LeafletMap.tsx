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

export function LeafletMap({ onShapeDrawn }: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: [20, 0],
      zoom: 3,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

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
        rectangle: {
          shapeOptions: { color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2, weight: 2 },
        },
        marker: {},
      },
      edit: { featureGroup: drawnItems, remove: true },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
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

    // Expose methods globally
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
