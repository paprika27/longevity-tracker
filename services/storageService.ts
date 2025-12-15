import { LogEntry, MetricValues } from '../types';

const STORAGE_KEY = 'longevity_tracker_entries';

export const getEntries = (): LogEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
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
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  return newEntry;
};

export const getLatestEntry = (): LogEntry | null => {
  const entries = getEntries();
  if (entries.length === 0) return null;
  return entries[entries.length - 1];
};

export const clearHistory = (): void => {
    localStorage.removeItem(STORAGE_KEY);
}