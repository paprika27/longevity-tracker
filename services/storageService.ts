
import { LogEntry, MetricConfig, MetricValues, AppSettings } from '../types';
import { DEFAULT_METRICS, DEFAULT_REGIMEN, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../constants';

const ENTRIES_KEY = 'longevity_tracker_entries';
const METRICS_KEY = 'longevity_tracker_metrics';
const REGIMEN_KEY = 'longevity_tracker_regimen';
const CATEGORIES_KEY = 'longevity_tracker_categories';
const SETTINGS_KEY = 'longevity_tracker_settings';

export const getEntries = (): LogEntry[] => {
  try {
    const data = localStorage.getItem(ENTRIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load entries", e);
    return [];
  }
};

export const saveEntry = (values: MetricValues, customTimestamp?: string): LogEntry => {
  const entries = getEntries();
  const newEntry: LogEntry = {
    id: Date.now().toString() + Math.random().toString().slice(2, 5),
    timestamp: customTimestamp || new Date().toISOString(),
    values
  };
  
  // Sort by date ascending
  const updatedEntries = [...entries, newEntry].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(updatedEntries));
  return newEntry;
};

export const saveAllEntries = (entries: LogEntry[]): void => {
  // Ensure sorted
  const sorted = [...entries].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(sorted));
};

export const getLatestEntry = (): LogEntry | null => {
  const entries = getEntries();
  if (entries.length === 0) return null;
  return entries[entries.length - 1];
};

export const clearHistory = (): void => {
    localStorage.removeItem(ENTRIES_KEY);
};

// --- METRICS ---

export const getMetrics = (): MetricConfig[] => {
  try {
    const data = localStorage.getItem(METRICS_KEY);
    return data ? JSON.parse(data) : DEFAULT_METRICS;
  } catch (e) {
    console.error("Failed to load metrics", e);
    return DEFAULT_METRICS;
  }
};

export const saveMetrics = (metrics: MetricConfig[]): void => {
  localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
};

export const resetMetrics = (): MetricConfig[] => {
  localStorage.removeItem(METRICS_KEY);
  return DEFAULT_METRICS;
};

// --- CATEGORIES ---

export const getCategories = (): string[] => {
    try {
        const data = localStorage.getItem(CATEGORIES_KEY);
        return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch (e) {
        return DEFAULT_CATEGORIES;
    }
};

export const saveCategories = (categories: string[]): void => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const resetCategories = (): string[] => {
    localStorage.removeItem(CATEGORIES_KEY);
    return DEFAULT_CATEGORIES;
};

// --- REGIMEN ---

export const getRegimen = (): string => {
  try {
    const data = localStorage.getItem(REGIMEN_KEY);
    return data || DEFAULT_REGIMEN;
  } catch (e) {
    return DEFAULT_REGIMEN;
  }
};

export const saveRegimen = (text: string): void => {
  localStorage.setItem(REGIMEN_KEY, text);
};

// --- SETTINGS ---

export const getSettings = (): AppSettings => {
    try {
        const data = localStorage.getItem(SETTINGS_KEY);
        return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
};

export const saveSettings = (settings: AppSettings): void => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// --- SYSTEM ---

export const factoryReset = (): void => {
    localStorage.removeItem(ENTRIES_KEY);
    localStorage.removeItem(METRICS_KEY);
    localStorage.removeItem(REGIMEN_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
    localStorage.removeItem(SETTINGS_KEY);
};

// --- SYNC HELPERS ---

export interface FullState {
  entries: LogEntry[];
  metrics: MetricConfig[];
  categories: string[];
  regimen: string;
  settings: AppSettings;
}

export const getFullState = (): FullState => ({
  entries: getEntries(),
  metrics: getMetrics(),
  categories: getCategories(),
  regimen: getRegimen(),
  settings: getSettings()
});

export const restoreFullState = (state: FullState) => {
  if (state.entries) saveAllEntries(state.entries);
  if (state.metrics) saveMetrics(state.metrics);
  if (state.categories) saveCategories(state.categories);
  if (state.regimen) saveRegimen(state.regimen);
  if (state.settings) saveSettings(state.settings);
};
