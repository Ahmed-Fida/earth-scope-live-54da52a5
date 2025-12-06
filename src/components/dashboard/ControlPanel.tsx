import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  MapPin,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Map,
  FileJson,
  Lightbulb,
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
  environmentalParameters,
  generateTimeSeriesData,
  generateStatistics,
  generateInsights,
} from '@/lib/mockData';
import { DrawnShape } from './LeafletMap';
import { AnalysisResults } from './AnalysisResults';
import { useToast } from '@/hooks/use-toast';

interface ControlPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  drawnShape: DrawnShape | null;
}

export function ControlPanel({ isOpen, onToggle, drawnShape }: ControlPanelProps) {
  const { toast } = useToast();
  const [selectedParameter, setSelectedParameter] = useState('NDVI');
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 90));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // Coordinate input mode
  const [inputMode, setInputMode] = useState<'draw' | 'coordinates' | 'bbox'>('draw');
  const [coordLat, setCoordLat] = useState('');
  const [coordLng, setCoordLng] = useState('');
  const [bboxNorth, setBboxNorth] = useState('');
  const [bboxSouth, setBboxSouth] = useState('');
  const [bboxEast, setBboxEast] = useState('');
  const [bboxWest, setBboxWest] = useState('');

  const handleAnalyze = async () => {
    let hasValidArea = false;
    
    if (inputMode === 'draw' && drawnShape) {
      hasValidArea = true;
    } else if (inputMode === 'coordinates' && coordLat && coordLng) {
      hasValidArea = true;
      // Add marker via global method
      (window as any).leafletMapMethods?.addMarker(parseFloat(coordLat), parseFloat(coordLng));
    } else if (inputMode === 'bbox' && bboxNorth && bboxSouth && bboxEast && bboxWest) {
      hasValidArea = true;
      // Add rectangle via global method
      const coords = [
        { lat: parseFloat(bboxNorth), lng: parseFloat(bboxWest) },
        { lat: parseFloat(bboxNorth), lng: parseFloat(bboxEast) },
        { lat: parseFloat(bboxSouth), lng: parseFloat(bboxEast) },
        { lat: parseFloat(bboxSouth), lng: parseFloat(bboxWest) },
      ];
      (window as any).leafletMapMethods?.addShapeFromCoords(coords, 'rectangle');
    }

    if (!hasValidArea) {
      toast({
        title: 'No area selected',
        description: 'Please draw a shape on the map or enter coordinates.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const timeSeries = generateTimeSeriesData(selectedParameter, startDate, endDate);
    const stats = generateStatistics(selectedParameter);
    const insights = generateInsights(selectedParameter, stats);
    const param = environmentalParameters.find(p => p.id === selectedParameter);

    setAnalysisResult({
      parameter: param,
      timeSeries,
      stats,
      insights,
      startDate: format(startDate, 'MMM d, yyyy'),
      endDate: format(endDate, 'MMM d, yyyy'),
    });

    setIsAnalyzing(false);
    toast({
      title: 'Analysis complete',
      description: `${param?.fullName} data retrieved successfully.`,
    });
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
          properties: {
            parameter: parameter.id,
            stats,
            timeSeries,
          },
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

    toast({
      title: 'Export successful',
      description: `Data exported as ${formatId.toUpperCase()}.`,
    });
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

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={cn(
          'fixed top-1/2 -translate-y-1/2 z-30 bg-card border border-border rounded-l-lg p-2 shadow-lg transition-all',
          isOpen ? 'right-[400px]' : 'right-0'
        )}
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      {/* Panel */}
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
              <h2 className="text-lg font-semibold">Analysis Controls</h2>
              <p className="text-sm text-muted-foreground">Configure and run environmental analysis</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Parameter Selection */}
              <div className="space-y-2">
                <Label>Environmental Parameter</Label>
                <Select value={selectedParameter} onValueChange={setSelectedParameter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {environmentalParameters.map(param => (
                      <SelectItem key={param.id} value={param.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: param.color }}
                          />
                          <span>{param.name}</span>
                          <span className="text-muted-foreground text-xs">({param.unit})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Area Input Mode */}
              <div className="space-y-3">
                <Label>Area Selection Method</Label>
                <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="draw">Draw</TabsTrigger>
                    <TabsTrigger value="coordinates">Point</TabsTrigger>
                    <TabsTrigger value="bbox">Bbox</TabsTrigger>
                  </TabsList>

                  <TabsContent value="draw" className="mt-3">
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">
                          {drawnShape ? `${drawnShape.type} selected` : 'Draw on map'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Use the drawing tools on the map
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="coordinates" className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Latitude</Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="e.g., 40.7128"
                          value={coordLat}
                          onChange={(e) => setCoordLat(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Longitude</Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="e.g., -74.0060"
                          value={coordLng}
                          onChange={(e) => setCoordLng(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="bbox" className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">North</Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="Max Lat"
                          value={bboxNorth}
                          onChange={(e) => setBboxNorth(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">South</Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="Min Lat"
                          value={bboxSouth}
                          onChange={(e) => setBboxSouth(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">East</Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="Max Lng"
                          value={bboxEast}
                          onChange={(e) => setBboxEast(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">West</Label>
                        <Input
                          type="number"
                          step="any"
                          placeholder="Min Lng"
                          value={bboxWest}
                          onChange={(e) => setBboxWest(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Date Range */}
              <div className="space-y-3">
                <Label>Date Range</Label>
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Area'
                )}
              </Button>

              {/* Results */}
              {analysisResult && (
                <AnalysisResults result={analysisResult} onExport={handleExport} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
