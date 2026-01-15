

export interface MetricConfig {
  id: string;
  name: string;
  range: [number, number]; // [min, max]
  unit: string;
  fact: string;
  citation: string;
  step: number; // For input validation/UI
  category: string; // Changed from enum to string to allow custom categories
  active: boolean;
  includeInSpider: boolean;
  isCalculated?: boolean; // New flag for metrics like BMI that are derived
  formula?: string; // JavaScript expression using metric IDs as variables
  isTimeBased?: boolean; // If true, input uses FormattedDurationInput (HH:MM -> decimal)
}

// Map of metric ID to value (number) or null if not recorded
export interface MetricValues {
  [key: string]: number | null;
}

export interface LogEntry {
  id: string;
  timestamp: string; // ISO string
  values: MetricValues;
}

export enum StatusLevel {
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  UNKNOWN = 'UNKNOWN'
}

export interface FeedbackItem {
  metricId: string;
  metricName: string;
  value: number;
  displayValue?: string | number;
  status: StatusLevel;
  message: string;
  citation: string;
}
export interface RegimenData {
  text: string;
}

export type DateFormat = 'YYYY-MM-DD' | 'DD.MM.YYYY' | 'MM/DD/YYYY';
export type TimeFormat = '24h' | '12h';

export interface AppSettings {
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
}

export interface MetricStatusData {
  value: number | null;
  timestamp?: string;
  status: StatusLevel;
  streak?: number;
  weeklyProgress?: {
    current: number;
    target: number;
    percent: number;
  };
}

export interface AgeFactor {
    name: string;
    impact: number; // Negative = makes you younger, Positive = older
    value: string;
}

export interface BioAgeResult {
    chronologicalAge: number;
    biologicalAge: number;
    ageDiff: number;
    method: string;
    factors: AgeFactor[];
    missingMetrics: string[];
    warnings?: string[];
    confidence?: string;
}