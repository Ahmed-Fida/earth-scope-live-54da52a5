// Environmental data types and parameters for EnviroSense

export type ParameterType = 'NDVI' | 'Aerosol Index' | 'NO2' | 'SO2' | 'CO';

export interface ParameterConfig {
  name: string;
  unit: string;
  description: string;
  min: number;
  max: number;
  palette: string[];
  icon: string;
  endpoint: string;
  satellite: string;
}

export const PARAMETERS: Record<ParameterType, ParameterConfig> = {
  NDVI: {
    name: 'Normalized Difference Vegetation Index',
    unit: 'Index (-1 to 1)',
    description: 'Measures vegetation health and density using satellite imagery',
    min: -0.2,
    max: 0.9,
    palette: ['#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60', '#1a9850'],
    icon: 'Leaf',
    endpoint: 'get-ndvi',
    satellite: 'MODIS',
  },
  'Aerosol Index': {
    name: 'Aerosol Index',
    unit: 'AI',
    description: 'Indicates presence of absorbing aerosols like dust and smoke',
    min: -1,
    max: 5,
    palette: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#fee090', '#f46d43', '#d73027'],
    icon: 'Wind',
    endpoint: 'get-aerosol-index',
    satellite: 'Sentinel-5P',
  },
  NO2: {
    name: 'Nitrogen Dioxide',
    unit: 'mol/m²',
    description: 'Air pollutant from combustion, indicates traffic and industrial activity',
    min: 0,
    max: 0.0003,
    palette: ['#4575b4', '#91bfdb', '#e0f3f8', '#fee090', '#fc8d59', '#d73027'],
    icon: 'Factory',
    endpoint: 'get-no2',
    satellite: 'Sentinel-5P',
  },
  SO2: {
    name: 'Sulfur Dioxide',
    unit: 'mol/m²',
    description: 'Gas produced by volcanic activity and industrial processes',
    min: 0,
    max: 0.001,
    palette: ['#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#d9f0d3', '#a6dba0', '#5aae61'],
    icon: 'Flame',
    endpoint: 'get-so2',
    satellite: 'Sentinel-5P',
  },
  CO: {
    name: 'Carbon Monoxide',
    unit: 'mol/m²',
    description: 'Colorless gas from incomplete combustion',
    min: 0,
    max: 0.05,
    palette: ['#2166ac', '#67a9cf', '#d1e5f0', '#fddbc7', '#ef8a62', '#b2182b'],
    icon: 'CloudFog',
    endpoint: 'get-co',
    satellite: 'Sentinel-5P',
  },
};

export interface TimeSeriesPoint {
  date: string;
  value: number;
  min?: number;
  max?: number;
}

export interface AnalysisResult {
  parameter: ParameterType;
  timeSeries: TimeSeriesPoint[];
  stats: {
    mean: number;
    min: number;
    max: number;
    stdDev: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    trendPercent: number;
  };
  mapTileUrl?: string;
  insights: string[];
}

// Dynamic title mapping
export function getAnalysisTitle(param: ParameterType): string {
  const titles: Record<ParameterType, string> = {
    NDVI: 'Pakistan NDVI Analysis',
    'Aerosol Index': 'Pakistan Aerosol Index Analysis',
    NO2: 'Pakistan NO₂ Analysis',
    SO2: 'Pakistan SO₂ Analysis',
    CO: 'Pakistan CO Analysis',
  };
  return titles[param];
}

// Dynamic subtitle from backend response
export function getAnalysisSubtitle(satellite?: string, startYear?: number, endYear?: number): string {
  const sat = satellite || 'Satellite';
  const start = startYear || 2019;
  const end = endYear || 2025;
  return `${sat} Satellite Data (${start}–${end})`;
}

// Get the pakistan-range endpoint name for a parameter
export function getPakistanRangeEndpoint(param: ParameterType): string {
  const endpoints: Record<ParameterType, string> = {
    NDVI: 'get-ndvi-pakistan-range',
    'Aerosol Index': 'get-aerosol-pakistan-range',
    NO2: 'get-no2-pakistan-range',
    SO2: 'get-so2-pakistan-range',
    CO: 'get-co-pakistan-range',
  };
  return endpoints[param];
}
