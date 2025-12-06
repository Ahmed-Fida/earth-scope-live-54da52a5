import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Download,
  FileSpreadsheet,
  Map,
  FileJson,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface AnalysisResultsProps {
  result: {
    parameter: {
      id: string;
      name: string;
      fullName: string;
      unit: string;
      color: string;
    };
    timeSeries: { date: string; value: number }[];
    stats: {
      mean: number;
      min: number;
      max: number;
      stdDev: number;
      trend: number;
    };
    insights: string[];
    startDate: string;
    endDate: string;
  };
  onExport: (format: string) => void;
}

export function AnalysisResults({ result, onExport }: AnalysisResultsProps) {
  const { parameter, timeSeries, stats, insights, startDate, endDate } = result;

  const formatValue = (value: number) => {
    if (value < 0.001) return value.toExponential(2);
    if (value < 1) return value.toFixed(4);
    if (value < 100) return value.toFixed(2);
    return Math.round(value).toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{parameter.fullName}</h3>
          <p className="text-xs text-muted-foreground">
            {startDate} - {endDate}
          </p>
        </div>
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: parameter.color }}
        />
      </div>

      {/* Chart */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={parameter.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={parameter.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => value.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={formatValue}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(value: number) => [formatValue(value), parameter.name]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={parameter.color}
              fillOpacity={1}
              fill="url(#colorValue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Mean</p>
          <p className="text-lg font-semibold">{formatValue(stats.mean)}</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Std Dev</p>
          <p className="text-lg font-semibold">±{formatValue(stats.stdDev)}</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Min</p>
          <p className="text-lg font-semibold">{formatValue(stats.min)}</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Max</p>
          <p className="text-lg font-semibold">{formatValue(stats.max)}</p>
        </div>
        <div className="col-span-2 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Trend</p>
            <p className="text-lg font-semibold">
              {stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(1)}%
            </p>
          </div>
          {stats.trend >= 0 ? (
            <TrendingUp className="w-6 h-6 text-primary" />
          ) : (
            <TrendingDown className="w-6 h-6 text-destructive" />
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-medium">Insights</h4>
        </div>
        <ul className="space-y-2">
          {insights.map((insight, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-sm text-muted-foreground flex items-start gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              {insight}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Export Options */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('csv')}
            className="flex items-center gap-1"
          >
            <FileSpreadsheet className="w-4 h-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('shapefile')}
            className="flex items-center gap-1"
          >
            <Map className="w-4 h-4" />
            SHP
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('geojson')}
            className="flex items-center gap-1"
          >
            <FileJson className="w-4 h-4" />
            JSON
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
