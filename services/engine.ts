
import { LogEntry, MetricConfig, MetricValues, StatusLevel, MetricStatusData, FeedbackItem } from '../types';
import * as calculators from './riskCalculators';
import * as formulaLib from './formulaLib';
import { formatDuration } from '../components/shared/FormattedInputs';

// Helper to determine status
export const getStatus = (val: number, range: [number, number]): StatusLevel => {
    const [min, max] = range;
    if (val >= min && val <= max) return StatusLevel.GOOD;

    // Within 20% tolerance of range span?
    const span = max - min || 1;
    const tolerance = span * 0.2; 
    if (val >= min - tolerance && val <= max + tolerance) return StatusLevel.FAIR;

    return StatusLevel.POOR;
};

// Helper: Get ISO Date String (YYYY-MM-DD)
export const toIsoDate = (d: Date) => d.toISOString().split('T')[0];

/**
 * Process raw entries to calculate derived metrics (formulas)
 */
export const processEntries = (entries: LogEntry[], metrics: MetricConfig[]): LogEntry[] => {
    // Sort calculated metrics to ensure dependencies (e.g., VO2max) run before Age calculations
    const calculatedMetrics = metrics.filter(m => m.isCalculated && m.formula).sort((a, b) => {
         const aIsAge = a.id.includes('age');
         const bIsAge = b.id.includes('age');
         if (aIsAge && !bIsAge) return 1;
         if (!aIsAge && bIsAge) return -1;
         return 0;
    });

    const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const runningValues: MetricValues = {};

    return sortedEntries.map(entry => {
        // Update running context with existing values
        Object.entries(entry.values).forEach(([key, val]) => {
            if (val !== null && val !== undefined) runningValues[key] = val;
        });
        
        const context = { ...runningValues };
        const newValues: MetricValues = { ...entry.values };

        const lib = {
            ...calculators,
            sum: (id: string, period: string | number) => formulaLib.sum(sortedEntries, id, period, entry.timestamp)
        };

        calculatedMetrics.forEach(m => {
            if (!m.formula) return;
            try {
                // Safe evaluation of formula
                const func = new Function('vals', 'lib', `with(vals) { try { return ${m.formula}; } catch(e) { return null; } }`);
                const result = func(context, lib) as any;
                
                if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                    const finalVal = parseFloat(result.toFixed(2));
                    newValues[m.id] = finalVal;
                    runningValues[m.id] = finalVal; // Update context for subsequent formulas in same iteration
                }
            } catch (e) { }
        });
        return { ...entry, values: newValues };
    });
};

/**
 * Generate current status state for the dashboard
 */
export const calculateDashboardState = (processedEntries: LogEntry[], metrics: MetricConfig[]): Record<string, MetricStatusData> => {
    const state: Record<string, MetricStatusData> = {};
    const latestValues: Record<string, {val: number, ts: string}> = {};
    
    // Find latest value for every metric
    processedEntries.forEach(entry => {
        Object.entries(entry.values).forEach(([key, val]) => {
            if (val !== null && val !== undefined) {
                latestValues[key] = { val, ts: entry.timestamp };
            }
        });
    });

    metrics.forEach(m => {
        if (!m.active) return;
        const latest = latestValues[m.id];
        
        // Calculate Streak (Daily Only)
        let streak = 0;
        if (m.category === 'daily') {
            const dailyMap: Record<string, number> = {};
            processedEntries.forEach(e => {
                 const dateStr = toIsoDate(new Date(e.timestamp));
                 if (e.values[m.id] !== undefined && e.values[m.id] !== null) {
                     dailyMap[dateStr] = e.values[m.id]!;
                 }
            });
            
            const checkDate = new Date();
            const todayStr = toIsoDate(checkDate);
            let currentCheck = new Date(checkDate);
            
            // Allow streak to continue if today is missing but yesterday exists
            if (!dailyMap[todayStr]) {
                currentCheck.setDate(currentCheck.getDate() - 1);
            }

            for (let i = 0; i < 365; i++) {
                 const dStr = toIsoDate(currentCheck);
                 const val = dailyMap[dStr];
                 if (val !== undefined) {
                     const s = getStatus(val, m.range);
                     if (s === StatusLevel.GOOD || s === StatusLevel.FAIR) streak++;
                     else break;
                 } else break;
                 currentCheck.setDate(currentCheck.getDate() - 1);
            }
        }

        // Determine Status
        let computedStatus = StatusLevel.UNKNOWN;
        if (latest) {
            if (m.category === 'weekly') {
                 const dayOfWeek = (new Date().getDay() + 6) % 7 + 1; // Mon=1
                 const expected = (m.range[0] / 7) * dayOfWeek;
                 if (latest.val >= expected) computedStatus = StatusLevel.GOOD;
                 else if (latest.val >= expected * 0.7) computedStatus = StatusLevel.FAIR;
                 else computedStatus = StatusLevel.POOR;
            } else {
                computedStatus = getStatus(latest.val, m.range);
            }
        }

        // Weekly Progress Data
        let weeklyProgress = undefined;
        if (m.category === 'weekly' && latest) {
            weeklyProgress = {
                current: latest.val,
                target: m.range[0],
                percent: Math.min(100, (latest.val / m.range[0]) * 100)
            };
        }

        state[m.id] = {
            value: latest ? latest.val : null,
            timestamp: latest ? latest.ts : undefined,
            status: computedStatus,
            streak: streak,
            weeklyProgress
        };
    });

    return state;
};

/**
 * Generate Coaching/Feedback items
 */
export const generateFeedback = (
    dashboardState: Record<string, MetricStatusData>, 
    metrics: MetricConfig[],
    dismissedIds: string[] = []
): FeedbackItem[] => {
    const items: FeedbackItem[] = [];
    
    metrics.filter(m => m.active).forEach(m => {
        const data = dashboardState[m.id];
        if (data && data.value !== null) {
            if (dismissedIds.includes(m.id)) return;
            
            const status = data.status;
            const valStr = m.isTimeBased ? formatDuration(data.value) : data.value;
            let msg = "";
            
            if (m.category === 'weekly' && data.weeklyProgress) {
                 const pct = Math.round(data.weeklyProgress.percent);
                 if (status === StatusLevel.GOOD) msg = `Excellent! You are at ${pct}% of your weekly target (${formatDuration(data.weeklyProgress.current)}/${formatDuration(data.weeklyProgress.target)} ${m.unit}).`;
                 else if (status === StatusLevel.FAIR) msg = `Keep pushing. You are at ${pct}% of your weekly target.`;
                 else msg = `You are behind schedule (${pct}%). Try to squeeze in a session.`;
            } else {
                if (status === StatusLevel.GOOD) msg = `Great job! Your ${m.name} is in the optimal range.`;
                else if (status === StatusLevel.FAIR) msg = `Close! Your ${m.name} is near the target range.`;
                else msg = `Your ${m.name} is outside the target range.`;
            }

            items.push({
                metricId: m.id,
                metricName: m.name,
                value: data.value,
                displayValue: valStr,
                status,
                message: msg,
                citation: m.fact
            });
        }
    });
    return items;
};

/**
 * Extract Coaching Banner Data (Missing Daily & Weekly Risk)
 */
export const getCoachingData = (dashboardState: Record<string, MetricStatusData>, metrics: MetricConfig[]) => {
    const todayStr = toIsoDate(new Date());
    
    const missingDaily = metrics.filter(m => 
        m.active && m.category === 'daily' && !m.isCalculated &&
        (!dashboardState[m.id].timestamp || !dashboardState[m.id].timestamp!.startsWith(todayStr))
    );

    const weeklyMetrics = metrics
        .filter(m => m.active && m.category === 'weekly' && dashboardState[m.id].weeklyProgress)
        .map(m => {
            const prog = dashboardState[m.id].weeklyProgress!;
            const dayOfWeek = (new Date().getDay() + 6) % 7 + 1;
            const expected = (prog.target / 7) * dayOfWeek;
            const isAtRisk = prog.current < expected * 0.8;
            return { config: m, current: prog.current, target: prog.target, isAtRisk };
        });

    return { missingDaily, weeklyMetrics };
};
