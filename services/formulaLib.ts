import { LogEntry } from '../types';

/**
 * Sums the values of a specific metric over a defined time period relative to a reference date.
 * 
 * @param entries The full list of historical entries
 * @param metricId The ID of the metric to sum (e.g., 'rowing')
 * @param period 'week' (current week mon-sun), 'month' (current month), or number (last N days)
 * @param refDateStr The reference date string (ISO) to calculate relative to
 */
export const sum = (entries: LogEntry[], metricId: string, period: string | number, refDateStr: string): number => {
    const refDate = new Date(refDateStr);
    let startDate = new Date(refDate);

    if (period === 'week') {
        // Start of week (Monday) relative to refDate
        // refDate.getDay(): 0=Sun, 1=Mon ... 6=Sat
        const day = refDate.getDay();
        // If Sunday (0), we go back 6 days to Monday. If Mon (1), go back 0.
        const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
        // Start of current month
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
    } else if (typeof period === 'number') {
        // Last N days (inclusive of today)
        // e.g. period=7 -> [today-6, today]
        startDate.setDate(startDate.getDate() - (period - 1)); 
        startDate.setHours(0, 0, 0, 0);
    }

    // Filter entries between startDate and refDate (inclusive)
    // Note: We scan the raw entries. 
    return entries.reduce((acc, entry) => {
        const d = new Date(entry.timestamp);
        // Compare timestamps
        if (d >= startDate && d <= refDate) {
            const val = entry.values[metricId];
            if (typeof val === 'number') {
                return acc + val;
            }
        }
        return acc;
    }, 0);
};