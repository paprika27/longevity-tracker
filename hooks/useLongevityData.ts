
import { useState, useEffect, useCallback } from 'react';
import { LogEntry, MetricConfig, AppSettings, MetricValues } from '../types';
import * as db from '../services/storageService';
import { DEFAULT_SETTINGS } from '../constants';

export const useLongevityData = () => {
    const [entries, setEntries] = useState<LogEntry[]>([]);
    const [metrics, setMetrics] = useState<MetricConfig[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    const refreshData = useCallback(() => {
        setEntries(db.getEntries());
        setMetrics(db.getMetrics());
        setCategories(db.getCategories());
        setSettings(db.getSettings());
    }, []);

    // Initial Load
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const saveEntry = (values: MetricValues, timestamp: string) => {
        db.saveEntry(values, timestamp);
        setEntries(db.getEntries()); // update local state
    };

    const updateMetrics = (newMetrics: MetricConfig[]) => {
        setMetrics(newMetrics);
        db.saveMetrics(newMetrics);
    };

    const updateSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
        db.saveSettings(newSettings);
    };

    return {
        entries,
        setEntries, // Exposed for special cases (imports/re-writes)
        metrics,
        categories,
        settings,
        refreshData,
        saveEntry,
        updateMetrics,
        updateSettings
    };
};
