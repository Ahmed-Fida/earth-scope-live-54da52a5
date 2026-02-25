import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  MapPin,
  Loader2,
  Save,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  PARAMETERS,
  ParameterType,
  getAnalysisTitle,
  getAnalysisSubtitle,
} from '@/lib/mockData';
import { PAKISTAN_DISTRICTS, PakistanDistrict } from '@/lib/pakistanDistricts';
import { DrawnShape } from './LeafletMap';
import { AnalysisResults } from './AnalysisResults';
import { PakistanNDVIWidget } from './PakistanNDVIWidget';
import { useToast } from '@/hooks/use-toast';
import { useAnalysisHistory } from '@/hooks/useAnalysisHistory';
import { supabase } from '@/integrations/supabase/client';

const parameterList = Object.entries(PARAMETERS).map(([id, config]) => ({
  id: id as ParameterType,
  name: config.name,
  unit: config.unit,
  color: config.palette[Math.floor(config.palette.length / 2)],
}));

const PAKISTAN_BOUNDS = {
  minLat: 23.5,
  maxLat: 37.1,
  minLon: 60.9,
  maxLon: 77.5,
};

function isInsidePakistan(lat: number, lon: number): boolean {
  return (
    lat >= PAKISTAN_BOUNDS.minLat &&
    lat <= PAKISTAN_BOUNDS.maxLat &&
    lon >= PAKISTAN_BOUNDS.minLon &&
    lon <= PAKISTAN_BOUNDS.maxLon
  );
}

interface ControlPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  drawnShape: DrawnShape | null;
}

export function ControlPanel({ isOpen, onToggle, drawnShape }: ControlPanelProps) {
  const { toast } = useToast();
  const { addAnalysis } = useAnalysisHistory();
  const [selectedParameter, setSelectedParameter] = useState<ParameterType | ''>('');
  const [startDate, setStartDate] = useState<Date>(new Date('2019-01-01'));
  const [endDate, setEndDate] = useState<Date>(new Date('2025-12-31'));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Coordinate input mode — removed 'bbox'
  const [inputMode, setInputMode] = useState<'draw' | 'coordinates' | 'district'>('coordinates');
  const [coordLat, setCoordLat] = useState('30.3753');
  const [coordLng, setCoordLng] = useState('69.3451');
  
  // District selector
  const [selectedDistrict, setSelectedDistrict] = useState<PakistanDistrict | null>(null);
  const [districtSearch, setDistrictSearch] = useState('');

  const filteredDistricts = PAKISTAN_DISTRICTS.filter(d =>
    d.name.toLowerCase().includes(districtSearch.toLowerCase()) ||
    d.province.toLowerCase().includes(districtSearch.toLowerCase())
  );

  // Validate coordinates when they change
  useEffect(() => {
    if (inputMode === 'coordinates' && coordLat && coordLng) {
      const lat = parseFloat(coordLat);
      const lon = parseFloat(coordLng);
      if (!isNaN(lat) && !isNaN(lon)) {
        if (!isInsidePakistan(lat, lon)) {
          setValidationError('Location is outside Pakistan. Please enter coordinates within Pakistan (Lat: 23.5-37.1, Lon: 60.9-77.5)');
        } else {
          setValidationError(null);
        }
      }
    } else {
      setValidationError(null);
    }
  }, [inputMode, coordLat, coordLng]);

  const handleAnalyze = async () => {
    if (!selectedParameter) {
      toast({
        title: 'No indicator selected',
        description: 'Please select an environmental parameter first.',
        variant: 'destructive',
      });
      return;
    }

    let hasValidArea = false;
    let geometry: unknown = null;
    let geometryType = '';
    let lat: number | null = null;
    let lon: number | null = null;
    
    if (inputMode === 'draw' && drawnShape) {
      hasValidArea = true;
      geometry = drawnShape.geoJSON?.geometry;
      geometryType = drawnShape.type;
      if (drawnShape.geoJSON?.geometry) {
        const coords = drawnShape.geoJSON.geometry as any;
        if (coords.type === 'Point') {
          lon = coords.coordinates[0];
          lat = coords.coordinates[1];
        } else if (coords.type === 'Polygon' && coords.coordinates?.[0]) {
          const points = coords.coordinates[0];
          lat = points.reduce((sum: number, p: number[]) => sum + p[1], 0) / points.length;
          lon = points.reduce((sum: number, p: number[]) => sum + p[0], 0) / points.length;
        }
      }
    } else if (inputMode === 'coordinates' && coordLat && coordLng) {
      lat = parseFloat(coordLat);
      lon = parseFloat(coordLng);
      if (!isNaN(lat) && !isNaN(lon)) {
        hasValidArea = true;
        geometry = { type: 'Point', coordinates: [lon, lat] };
        geometryType = 'point';
        (window as any).leafletMapMethods?.addMarker(lat, lon);
      }
    } else if (inputMode === 'district' && selectedDistrict) {
      lat = selectedDistrict.lat;
      lon = selectedDistrict.lon;
      hasValidArea = true;
      geometry = { type: 'Point', coordinates: [lon, lat] };
      geometryType = 'district';
      (window as any).leafletMapMethods?.addMarker(lat, lon);
    }

    if (!hasValidArea || lat === null || lon === null) {
      toast({
        title: 'No area selected',
        description: 'Please draw a shape, enter coordinates, or select a district.',
        variant: 'destructive',
      });
      return;
    }

    if (!isInsidePakistan(lat, lon)) {
      toast({
        title: 'Location outside Pakistan',
        description: 'This service only provides data for locations within Pakistan.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      const paramConfig = PARAMETERS[selectedParameter];

      const { data, error } = await supabase.functions.invoke(paramConfig.endpoint, {
        body: { lat, lon, startYear, endYear },
      });

      if (error) {
        throw new Error(error.message || `Failed to fetch ${selectedParameter} data`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const result = {
        parameter: {
          id: selectedParameter,
          name: paramConfig.name,
          fullName: paramConfig.name,
          unit: paramConfig.unit,
          color: paramConfig.palette[Math.floor(paramConfig.palette.length / 2)],
        },
        timeSeries: data.timeSeries,
        stats: {
          mean: data.stats.mean,
          min: data.stats.min,
          max: data.stats.max,
          stdDev: data.stats.stdDev || 0,
          trend: data.stats.trendPercent || 0,
        },
        insights: data.insights,
        startDate: format(startDate, 'MMM d, yyyy'),
        endDate: format(endDate, 'MMM d, yyyy'),
        geometry,
        geometryType,
        source: data.source,
        satellite: data.satellite || paramConfig.satellite,
      };

      setAnalysisResult(result);
      toast({
        title: 'Analysis complete',
        description: `${paramConfig.name} data retrieved from ${data.source || paramConfig.satellite}.`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Failed to fetch data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisResult) return;
    
    setIsSaving(true);
    await addAnalysis({
      parameter: analysisResult.parameter.id,
      geometry: analysisResult.geometry,
      geometryType: analysisResult.geometryType,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      results: {
        timeSeries: analysisResult.timeSeries,
        stats: analysisResult.stats,
        insights: analysisResult.insights,
      },
    });
    setIsSaving(false);
  };

  const handleExport = (formatId: string) => {
    if (!analysisResult) return;

    const { parameter, timeSeries, stats } = analysisResult;
    let content = '';
    let filename = `${parameter.id}_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}`;

    if (formatId === 'csv') {
      content = 'Date,Value\n' + timeSeries.map((d: any) => `${d.date},${d.value}`).join('\n');
      filename += '.csv';
      downloadFile(content, filename, 'text/csv');
    } else if (formatId === 'geojson') {
      const geoJSON = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { parameter: parameter.id, stats, timeSeries },
          geometry: drawnShape?.geoJSON?.geometry || { type: 'Point', coordinates: [0, 0] },
        }],
      };
      content = JSON.stringify(geoJSON, null, 2);
      filename += '.geojson';
      downloadFile(content, filename, 'application/geo+json');
    } else if (formatId === 'shapefile') {
      toast({
        title: 'Shapefile Export',
        description: 'Shapefile export requires server-side processing. Coming soon!',
      });
      return;
    }

    toast({ title: 'Export successful', description: `Data exported as ${formatId.toUpperCase()}.` });
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const panelTitle = selectedParameter ? getAnalysisTitle(selectedParameter as ParameterType) : 'Pakistan Environmental Analysis';
  const panelSubtitle = analysisResult
    ? getAnalysisSubtitle(analysisResult.satellite, startDate.getFullYear(), endDate.getFullYear())
    : selectedParameter ? getAnalysisSubtitle(PARAMETERS[selectedParameter as ParameterType].satellite, startDate.getFullYear(), endDate.getFullYear()) : 'Select an indicator to begin';

  return (
    <>
      <button
        onClick={onToggle}
        className={cn(
          'fixed top-1/2 -translate-y-1/2 z-30 bg-card border border-border rounded-l-lg p-2 shadow-lg transition-all',
          isOpen ? 'right-[400px]' : 'right-0'
        )}
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-screen w-[400px] bg-card border-l border-border shadow-2xl z-20 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">{panelTitle}</h2>
              <p className="text-sm text-muted-foreground">{panelSubtitle}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Pakistan-wide Widget */}
              {selectedParameter && <PakistanNDVIWidget selectedParameter={selectedParameter as ParameterType} />}

              {/* Parameter Selection */}
              <div className="space-y-2">
                <Label>Environmental Parameter</Label>
                <Select value={selectedParameter} onValueChange={(v) => setSelectedParameter(v as ParameterType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select indicator..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {parameterList.map(param => (
                      <SelectItem key={param.id} value={param.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: param.color }} />
                          <span>{param.id}</span>
                          <span className="text-muted-foreground text-xs">({param.unit})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Area Input Mode — removed bbox */}
              <div className="space-y-3">
                <Label>Area Selection Method</Label>
                <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="draw">Draw</TabsTrigger>
                    <TabsTrigger value="coordinates">Point</TabsTrigger>
                    <TabsTrigger value="district">District</TabsTrigger>
                  </TabsList>

                  <TabsContent value="draw" className="mt-3">
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{drawnShape ? `${drawnShape.type} selected` : 'Draw on map'}</p>
                        <p className="text-xs text-muted-foreground">Use the drawing tools on the map</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="coordinates" className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Latitude (23.5 - 37.1)</Label>
                        <Input 
                          type="number" 
                          step="any" 
                          placeholder="e.g., 30.3753" 
                          value={coordLat} 
                          onChange={(e) => setCoordLat(e.target.value)}
                          min={23.5}
                          max={37.1}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Longitude (60.9 - 77.5)</Label>
                        <Input 
                          type="number" 
                          step="any" 
                          placeholder="e.g., 69.3451" 
                          value={coordLng} 
                          onChange={(e) => setCoordLng(e.target.value)}
                          min={60.9}
                          max={77.5}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter coordinates within Pakistan only
                    </p>
                  </TabsContent>

                  <TabsContent value="district" className="mt-3 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search districts..."
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-1">
                      {filteredDistricts.slice(0, 50).map((district) => (
                        <button
                          key={`${district.name}-${district.province}`}
                          onClick={() => {
                            setSelectedDistrict(district);
                            setDistrictSearch('');
                            (window as any).leafletMapMethods?.addMarker(district.lat, district.lon);
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded text-sm hover:bg-muted/50 transition-colors',
                            selectedDistrict?.name === district.name && selectedDistrict?.province === district.province
                              ? 'bg-primary/10 text-primary font-medium'
                              : ''
                          )}
                        >
                          <span>{district.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({district.province})</span>
                        </button>
                      ))}
                      {filteredDistricts.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No districts found</p>
                      )}
                    </div>
                    {selectedDistrict && (
                      <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-medium">{selectedDistrict.name}</span>
                        <span className="text-xs text-muted-foreground">({selectedDistrict.province})</span>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                
                {/* Validation Error */}
                {validationError && (
                  <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className="space-y-3">
                <Label>Date Range (2019-2025)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(startDate, 'MMM d, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <CalendarComponent 
                        mode="single" 
                        selected={startDate} 
                        onSelect={(d) => d && setStartDate(d)} 
                        initialFocus 
                        className="pointer-events-auto"
                        fromDate={new Date('2019-01-01')}
                        toDate={new Date('2025-12-31')}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(endDate, 'MMM d, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <CalendarComponent 
                        mode="single" 
                        selected={endDate} 
                        onSelect={(d) => d && setEndDate(d)} 
                        initialFocus 
                        className="pointer-events-auto"
                        fromDate={new Date('2019-01-01')}
                        toDate={new Date('2025-12-31')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Analyze Button */}
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !!validationError} 
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isAnalyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing...</> : 'Analyze Area'}
              </Button>

              {/* Results */}
              {analysisResult && (
                <>
                  <AnalysisResults result={analysisResult} onExport={handleExport} />
                  <Button 
                    onClick={handleSaveAnalysis} 
                    disabled={isSaving}
                    variant="outline" 
                    className="w-full"
                  >
                    {isSaving ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" />Save to History</>
                    )}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
