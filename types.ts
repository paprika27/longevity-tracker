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
  status: StatusLevel;
  message: string;
  citation: string;
}
export interface RegimenData {
  text: string;
}
