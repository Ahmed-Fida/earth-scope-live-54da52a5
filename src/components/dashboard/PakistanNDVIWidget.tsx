import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ParameterType, getPakistanRangeEndpoint, getAnalysisTitle } from '@/lib/mockData';

interface YearlyData {
  year: string;
  value: number;
}

interface PakistanNDVIWidgetProps {
  selectedParameter?: ParameterType;
}

export function PakistanNDVIWidget({ selectedParameter = 'NDVI' }: PakistanNDVIWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [stats, setStats] = useState<{ mean: number; min: number; max: number } | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [satellite, setSatellite] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [selectedParameter]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = getPakistanRangeEndpoint(selectedParameter);
      const { data, error: fnError } = await supabase.functions.invoke(endpoint, {
        body: {},
      });

      if (fnError) throw new Error(fnError.message || 'Failed to fetch data');
      if (data.error) throw new Error(data.error);

      setSatellite(data.satellite || '');

      // For NDVI, use yearlyAverages; for others, compute from nationalTimeSeries
      if (data.yearlyAverages) {
        const chartData = Object.entries(data.yearlyAverages).map(([year, value]) => ({
          year,
          value: value as number,
        }));
        setYearlyData(chartData);
      } else if (data.nationalTimeSeries) {
        // Group by year and average
        const yearMap: Record<string, number[]> = {};
        for (const point of data.nationalTimeSeries) {
          const year = point.date.substring(0, 4);
          if (!yearMap[year]) yearMap[year] = [];
          yearMap[year].push(Number(point.value));
        }
        const chartData = Object.entries(yearMap).map(([year, values]) => ({
          year,
          value: Number((values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(4)),
        }));
        setYearlyData(chartData);
      }

      setStats(data.stats);
      setInsights(data.insights || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = () => {
    if (yearlyData.length < 2) return <Minus className="w-4 h-4 text-muted-foreground" />;
    const firstValue = yearlyData[0].value;
    const lastValue = yearlyData[yearlyData.length - 1].value;
    const change = ((lastValue - firstValue) / Math.abs(firstValue || 1)) * 100;
    
    if (change > 2) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < -2) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const formatValue = (value: number) => {
    if (value === 0) return '0';
    if (Math.abs(value) < 0.001) return value.toExponential(2);
    if (Math.abs(value) < 1) return value.toFixed(4);
    if (Math.abs(value) < 100) return value.toFixed(2);
    return Math.round(value).toString();
  };

  if (isLoading) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading {selectedParameter}...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="py-4">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const title = getAnalysisTitle(selectedParameter);

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>🇵🇰 {title.replace('Pakistan ', '')} (2019-2025)</span>
          {getTrendIcon()}
        </CardTitle>
        {satellite && (
          <p className="text-xs text-muted-foreground">{satellite} Satellite Data</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 10 }}
                width={40}
                className="text-muted-foreground"
                tickFormatter={formatValue}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [formatValue(value), selectedParameter]}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-background/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Mean</p>
              <p className="text-sm font-semibold text-primary">{formatValue(stats.mean)}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Min</p>
              <p className="text-sm font-semibold">{formatValue(stats.min)}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Max</p>
              <p className="text-sm font-semibold">{formatValue(stats.max)}</p>
            </div>
          </div>
        )}

        {insights.length > 0 && (
          <p className="text-xs text-muted-foreground italic">
            {insights[0]}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
