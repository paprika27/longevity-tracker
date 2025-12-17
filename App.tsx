
import React, { useState, useEffect, useMemo } from 'react';
import { MetricValues, LogEntry, StatusLevel, FeedbackItem, MetricConfig, AppSettings, MetricStatusData } from './types';
import * as db from './services/storageService';
import * as calculators from './services/riskCalculators';
import * as formulaLib from './services/formulaLib';
import { MetricCard } from './components/MetricCard';
import { RadarView } from './components/RadarView';
import { HistoryView } from './components/HistoryView';
import { RegimenView } from './components/RegimenView';
import { DataControls } from './components/DataControls';
import { MetricManager } from './components/MetricManager';
import { CoachBanner } from './components/CoachBanner';
import { AuthWidget } from './components/AuthWidget';
import { FormattedDateInput, FormattedTimeInput, FormattedDurationInput, formatDuration } from './components/FormattedInputs';
import { Activity, PlusCircle, LayoutDashboard, History, Save, Quote, ClipboardList, Settings, Edit3, Pin, X, Eye, Filter, ArrowUpDown, Trash2, CheckCircle2, Printer, Search, Calendar, Clock, RotateCcw } from 'lucide-react';
import { DEFAULT_SETTINGS } from './constants';

// Helper to determine status
const getStatus = (val: number, range: [number, number]): StatusLevel => {
    const [min, max] = range;
    if (val >= min && val <= max) return StatusLevel.GOOD;

    // Within 10% tolerance?
    const span = max - min || 1;
    const tolerance = span * 0.2; // Let's be generous for "Fair"
    if (val >= min - tolerance && val <= max + tolerance) return StatusLevel.FAIR;

    return StatusLevel.POOR;
};

// Helper: Get ISO Date String (YYYY-MM-DD)
const toIsoDate = (d: Date) => d.toISOString().split('T')[0];

const App: React.FC = () => {
    const [view, setView] = useState<'dashboard' | 'regimen' | 'entry' | 'history' | 'settings'>('dashboard');
    const [entries, setEntries] = useState<LogEntry[]>([]);
    const [metrics, setMetrics] = useState<MetricConfig[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [newEntryValues, setNewEntryValues] = useState<MetricValues>({});
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    // Entry Date/Time State
    const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [entryTime, setEntryTime] = useState(() => new Date().toTimeString().slice(0, 5));

    // History State
    const [historySelectedMetrics, setHistorySelectedMetrics] = useState<string[]>(['bmi']);

    // Feedback State
    const [pinnedFeedback, setPinnedFeedback] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('lt_pinned_feedback') || '[]'); } catch { return []; }
    });
    const [dismissedFeedback, setDismissedFeedback] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('lt_dismissed_feedback') || '[]'); } catch { return []; }
    });
    const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<'all' | 'good' | 'fair' | 'poor'>('all');

    // Metrics Grid State
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [metricSort, setMetricSort] = useState<'default' | 'name' | 'status' | 'recency' | 'streak'>('default');
    const [metricFilter, setMetricFilter] = useState<'all' | 'good' | 'fair' | 'poor' | 'unknown'>('all');

    // Form Categories
    const [activeFormCategory, setActiveFormCategory] = useState<string>('daily');

    // Load data on mount
    useEffect(() => {
        refreshData();
    }, []);

    // Persist feedback preferences
    useEffect(() => { localStorage.setItem('lt_pinned_feedback', JSON.stringify(pinnedFeedback)); }, [pinnedFeedback]);
    useEffect(() => { localStorage.setItem('lt_dismissed_feedback', JSON.stringify(dismissedFeedback)); }, [dismissedFeedback]);

    const refreshData = () => {
        setEntries(db.getEntries());
        setMetrics(db.getMetrics());
        const cats = db.getCategories();
        setCategories(cats);
        setAppSettings(db.getSettings());
        
        // Reset active form category if needed
        if (cats.length > 0 && (!activeFormCategory || !cats.includes(activeFormCategory))) {
             if (cats.includes('inputs')) setActiveFormCategory('inputs');
             else setActiveFormCategory(cats[0]);
        }
    };

    const handleMetricsUpdate = (updatedMetrics: MetricConfig[]) => {
        setMetrics(updatedMetrics);
    };

    const handleSettingsUpdate = (newSettings: AppSettings) => {
        setAppSettings(newSettings);
        db.saveSettings(newSettings);
    };

    const handleMetricRename = (oldId: string, newId: string, newConfig: MetricConfig): boolean => {
        const targetMetric = metrics.find(m => m.id === newId && m.id !== oldId);
        if (targetMetric) {
            if (!window.confirm(`Metric ID '${newId}' already exists. Merge?`)) return false;
            const updatedEntries = entries.map(entry => {
                const val = entry.values[oldId];
                if (val !== undefined && val !== null) {
                    if (entry.values[newId] === undefined) {
                        const newValues = { ...entry.values, [newId]: val };
                        delete newValues[oldId];
                        return { ...entry, values: newValues };
                    } else {
                        const newValues = { ...entry.values };
                        delete newValues[oldId];
                        return { ...entry, values: newValues };
                    }
                }
                return entry;
            });
            db.saveAllEntries(updatedEntries);
            setEntries(updatedEntries);
            const updatedMetrics = metrics.filter(m => m.id !== oldId);
            db.saveMetrics(updatedMetrics);
            setMetrics(updatedMetrics);
            return true;
        } else {
            const updatedEntries = entries.map(entry => {
                if (entry.values[oldId] !== undefined) {
                    const newValues = { ...entry.values, [newId]: entry.values[oldId] };
                    delete newValues[oldId];
                    return { ...entry, values: newValues };
                }
                return entry;
            });
            db.saveAllEntries(updatedEntries);
            setEntries(updatedEntries);
            const updatedMetrics = metrics.map(m => m.id === oldId ? { ...newConfig, id: newId } : m);
            db.saveMetrics(updatedMetrics);
            setMetrics(updatedMetrics);
            return true;
        }
    };

    const handleFactoryReset = () => {
        if (window.confirm("⚠ FACTORY RESET WARNING ⚠\n\nThis will DELETE ALL DATA.\nAre you sure?")) {
            db.factoryReset();
            window.location.reload();
        }
    };

    // --- DERIVED STATE ---

    const processedEntries = useMemo(() => {
        const calculatedMetrics = metrics.filter(m => m.isCalculated && m.formula);
        const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const runningValues: MetricValues = {};

        return sortedEntries.map(entry => {
            Object.entries(entry.values).forEach(([key, val]) => {
                if (val !== null && val !== undefined) runningValues[key] = val;
            });
            const context = { ...runningValues };
            const newValues = { ...entry.values };

            const lib = {
                ...calculators,
                sum: (id: string, period: string | number) => formulaLib.sum(sortedEntries, id, period, entry.timestamp)
            };

            calculatedMetrics.forEach(m => {
                if (!m.formula) return;
                try {
                    const func = new Function('vals', 'lib', `with(vals) { try { return ${m.formula}; } catch(e) { return null; } }`);
                    const result = func(context, lib);
                    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                        const finalVal = parseFloat(result.toFixed(2));
                        newValues[m.id] = finalVal;
                        runningValues[m.id] = finalVal;
                    }
                } catch (e) { }
            });
            return { ...entry, values: newValues };
        });
    }, [entries, metrics]);

    const dashboardState = useMemo(() => {
        const state: Record<string, MetricStatusData> = {};
        const latestValues: Record<string, {val: number, ts: string}> = {};
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

            let computedStatus = StatusLevel.UNKNOWN;
            if (latest) {
                if (m.category === 'weekly') {
                     const dayOfWeek = (new Date().getDay() + 6) % 7 + 1;
                     const expected = (m.range[0] / 7) * dayOfWeek;
                     if (latest.val >= expected) computedStatus = StatusLevel.GOOD;
                     else if (latest.val >= expected * 0.7) computedStatus = StatusLevel.FAIR;
                     else computedStatus = StatusLevel.POOR;
                } else {
                    computedStatus = getStatus(latest.val, m.range);
                }
            }

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
    }, [processedEntries, metrics]);

    const coachingData = useMemo(() => {
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
    }, [metrics, dashboardState]);

    const displayedFeedback = useMemo(() => {
        const items: FeedbackItem[] = [];
        metrics.filter(m => m.active).forEach(m => {
            const data = dashboardState[m.id];
            if (data && data.value !== null) {
                if (dismissedFeedback.includes(m.id)) return;
                
                const status = data.status;
                if (feedbackStatusFilter !== 'all' && status.toLowerCase() !== feedbackStatusFilter) return;

                // Format the value for display (handles time based e.g. 7.5 -> 7:30)
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
                    displayValue: valStr, // Use the formatted string
                    status,
                    message: msg,
                    citation: m.fact
                });
            }
        });
        
        return items.sort((a, b) => {
            const aPinned = pinnedFeedback.includes(a.metricId) ? 1 : 0;
            const bPinned = pinnedFeedback.includes(b.metricId) ? 1 : 0;
            if (aPinned !== bPinned) return bPinned - aPinned;
            const score = (s: StatusLevel) => s === StatusLevel.POOR ? 0 : s === StatusLevel.FAIR ? 1 : 2;
            return score(a.status) - score(b.status);
        });
    }, [dashboardState, metrics, dismissedFeedback, feedbackStatusFilter, pinnedFeedback]);

    const gridMetrics = useMemo(() => {
        let result = metrics.filter(m => m.active);
        if (searchTerm) result = result.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (categoryFilter !== 'all') result = result.filter(m => m.category === categoryFilter);
        
        // Status Filter Logic
        if (metricFilter !== 'all') {
            result = result.filter(m => {
                const data = dashboardState[m.id];
                if (metricFilter === 'unknown') return !data || data.value === null;
                if (!data) return false;
                return data.status.toLowerCase() === metricFilter;
            });
        }
        
        result.sort((a, b) => {
            if (metricSort === 'name') return a.name.localeCompare(b.name);
            if (metricSort === 'recency') {
                const dateA = dashboardState[a.id]?.timestamp ? new Date(dashboardState[a.id].timestamp!).getTime() : 0;
                const dateB = dashboardState[b.id]?.timestamp ? new Date(dashboardState[b.id].timestamp!).getTime() : 0;
                return dateB - dateA;
            }
            if (metricSort === 'status') {
                const getScore = (id: string) => {
                    const s = dashboardState[id]?.status || StatusLevel.UNKNOWN;
                    return s === StatusLevel.POOR ? 0 : s === StatusLevel.FAIR ? 1 : s === StatusLevel.GOOD ? 2 : 3;
                }
                return getScore(a.id) - getScore(b.id);
            }
            if (metricSort === 'streak') {
                const streakA = dashboardState[a.id]?.streak || 0;
                const streakB = dashboardState[b.id]?.streak || 0;
                return streakB - streakA;
            }
            if (a.category !== b.category) return a.category.localeCompare(b.category);
            return 0;
        });
        return result;
    }, [metrics, metricFilter, metricSort, dashboardState, searchTerm, categoryFilter]);

    // ... handlers ...
    const setNow = () => {
        const now = new Date();
        setEntryDate(toIsoDate(now));
        setEntryTime(now.toTimeString().slice(0, 5));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanValues: MetricValues = {};
        Object.keys(newEntryValues).forEach(k => {
            if (newEntryValues[k] !== null && newEntryValues[k] !== undefined && !isNaN(newEntryValues[k] as number)) {
                cleanValues[k] = newEntryValues[k];
            }
        });
        if (Object.keys(cleanValues).length === 0) return;

        let timestampStr = new Date().toISOString();
        try {
            const combined = new Date(`${entryDate}T${entryTime}`);
            if (!isNaN(combined.getTime())) timestampStr = combined.toISOString();
        } catch (e) {}

        db.saveEntry(cleanValues, timestampStr);
        setEntries(db.getEntries());
        setNewEntryValues({});
        alert("Data saved successfully!");
    };

    const handleInputChange = (id: string, val: string | number | null) => {
        setNewEntryValues(prev => ({
            ...prev,
            [id]: val === '' ? null : (typeof val === 'string' ? parseFloat(val) : val)
        }));
    };

    const toggleFeedbackPin = (id: string) => setPinnedFeedback(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const dismissFeedback = (id: string) => setDismissedFeedback(prev => [...prev, id]);
    const restoreFeedback = () => setDismissedFeedback([]);
    
    const handleDismissAllVisible = () => {
        const toDismiss = displayedFeedback.filter(item => !pinnedFeedback.includes(item.metricId)).map(item => item.metricId);
        if (toDismiss.length > 0) {
            if (confirm(`Dismiss ${toDismiss.length} items?`)) setDismissedFeedback(prev => [...prev, ...toDismiss]);
        }
    };

    const handleMetricClick = (id: string) => {
        setHistorySelectedMetrics([id]);
        setView('history');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const radarValues = useMemo(() => {
        const vals: MetricValues = {};
        Object.entries(dashboardState).forEach(([k, v]) => vals[k] = v.value);
        return vals;
    }, [dashboardState]);

    const handlePrintReport = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Longevity Report - ${new Date().toLocaleDateString()}</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="p-8 bg-white text-slate-900">
                <h1 class="text-2xl font-bold mb-2">Longevity Tracker Report</h1>
                <p class="text-slate-500 mb-8">Generated on ${new Date().toLocaleString()}</p>
                <h2 class="text-xl font-bold border-b pb-2 mb-4">Current Status</h2>
                <div class="grid grid-cols-4 gap-4 mb-8">
                    ${gridMetrics.map(m => {
                        const d = dashboardState[m.id];
                        const val = d?.value;
                        const formatted = m.isTimeBased ? formatDuration(val) : val;
                        return `
                        <div class="border p-4 rounded-lg">
                            <h3 class="font-bold text-sm">${m.name}</h3>
                            <p class="text-2xl">${val !== null ? formatted : '--'} <span class="text-xs text-slate-500">${m.unit}</span></p>
                            <p class="text-xs text-slate-400 mt-1">${d?.status || 'Unknown'}</p>
                        </div>
                        `;
                    }).join('')}
                </div>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="min-h-screen pb-12 bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-600">
                        <Activity className="w-6 h-6" />
                        <h1 className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">Longevity<span className="text-indigo-600">Tracker</span></h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <nav className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto hidden sm:flex">
                            {['dashboard', 'regimen', 'history', 'entry', 'settings'].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v as any)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap capitalize ${view === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {v}
                                </button>
                            ))}
                        </nav>
                        
                        <AuthWidget onSyncComplete={refreshData} />
                    </div>
                </div>
                {/* Mobile Nav */}
                <div className="sm:hidden border-t border-slate-100 px-4 py-2 overflow-x-auto">
                    <div className="flex gap-2">
                        {['dashboard', 'regimen', 'history', 'entry', 'settings'].map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v as any)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap capitalize ${view === v ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-500 bg-white border border-slate-200'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {view === 'dashboard' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
                                <p className="text-slate-500 text-sm">Overview of your biological status.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handlePrintReport} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                                    <Printer className="w-3 h-3" /> Report
                                </button>
                                <DataControls entries={entries} metrics={metrics} onImportComplete={refreshData} />
                            </div>
                        </div>

                        <CoachBanner 
                            missingDailyMetrics={coachingData.missingDaily} 
                            weeklyMetrics={coachingData.weeklyMetrics}
                            onNavigateToEntry={() => setView('entry')}
                        />

                        {processedEntries.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">No data logged yet</h3>
                                <button onClick={() => setView('entry')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition mt-4">
                                    Log First Entry
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-1">
                                        <RadarView metrics={metrics} values={radarValues} />
                                    </div>
                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="flex flex-wrap justify-between items-center gap-3">
                                            <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                                                <Quote className="w-5 h-5 text-indigo-500" /> Analysis & Evidence
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                 <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
                                                    {['all', 'good', 'fair', 'poor'].map(s => (
                                                        <button 
                                                            key={s}
                                                            onClick={() => setFeedbackStatusFilter(s as any)}
                                                            className={`px-2 py-1 text-xs rounded-md font-medium transition-colors capitalize ${feedbackStatusFilter === s ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                 </div>
                                                 <button onClick={handleDismissAllVisible} className="text-xs bg-white border border-slate-200 text-slate-500 hover:text-red-600 px-2 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                                                     <CheckCircle2 className="w-3.5 h-3.5" /> Dismiss
                                                 </button>
                                                 {dismissedFeedback.length > 0 && (
                                                     <button onClick={restoreFeedback} className="text-xs text-slate-400 hover:text-indigo-600 px-2"><Eye className="w-3 h-3" /></button>
                                                 )}
                                            </div>
                                        </div>
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {displayedFeedback.map(item => (
                                                <div key={item.metricId} className={`relative p-4 rounded-lg border-l-4 group transition-all ${item.status === StatusLevel.GOOD ? 'border-green-500 bg-green-50' : item.status === StatusLevel.FAIR ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'}`}>
                                                     <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => toggleFeedbackPin(item.metricId)} className={`p-1 rounded hover:bg-black/5 ${pinnedFeedback.includes(item.metricId) ? 'text-slate-800' : 'text-slate-400'}`}>
                                                            <Pin className={`w-3.5 h-3.5 ${pinnedFeedback.includes(item.metricId) ? 'fill-current' : ''}`} />
                                                        </button>
                                                        <button onClick={() => dismissFeedback(item.metricId)} className="p-1 rounded hover:bg-black/5 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                                                     </div>
                                                     <div className="flex justify-between items-start pr-8">
                                                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                                            {pinnedFeedback.includes(item.metricId) && <Pin className="w-3 h-3 text-slate-500 fill-slate-500" />} {item.metricName}
                                                        </h4>
                                                        {/* FIXED: Uses displayValue for proper time formatting */}
                                                        <span className="text-xs font-mono bg-white/50 px-2 py-0.5 rounded text-slate-600">{item.displayValue || item.value}</span>
                                                     </div>
                                                     <p className="text-sm text-slate-700 mt-1">{item.message}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                                        <h3 className="text-lg font-semibold text-slate-700 whitespace-nowrap">Detailed Metrics</h3>
                                        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2 flex-wrap">
                                            <div className="relative flex-1 min-w-[140px]">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border-slate-200 focus:border-indigo-500 bg-white shadow-sm" />
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap">
                                                {/* Category Filter */}
                                                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="pl-2 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg bg-white shadow-sm cursor-pointer min-w-[100px]">
                                                    <option value="all">All Cats</option>
                                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>

                                                {/* Status Filter - Restored/Ensured */}
                                                <select value={metricFilter} onChange={(e) => setMetricFilter(e.target.value as any)} className="pl-2 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg bg-white shadow-sm cursor-pointer min-w-[110px]">
                                                    <option value="all">All Status</option>
                                                    <option value="good">Good (Green)</option>
                                                    <option value="fair">Fair (Yellow)</option>
                                                    <option value="poor">Poor (Red)</option>
                                                    <option value="unknown">No Data</option>
                                                </select>

                                                {/* Sorting Dropdown - Updated Recently / Streak Added */}
                                                <select value={metricSort} onChange={(e) => setMetricSort(e.target.value as any)} className="pl-2 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg bg-white shadow-sm cursor-pointer min-w-[110px]">
                                                    <option value="default">Default</option>
                                                    <option value="name">Name</option>
                                                    <option value="status">Status</option>
                                                    <option value="recency">Updated Recently</option>
                                                    <option value="streak">Streak Length</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {gridMetrics.map(m => (
                                            <MetricCard
                                                key={m.id}
                                                config={m}
                                                data={dashboardState[m.id]}
                                                onClick={() => handleMetricClick(m.id)}
                                                dateFormat={appSettings.dateFormat}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
                
                {view === 'regimen' && <RegimenView />}
                {view === 'history' && <HistoryView entries={processedEntries} metrics={metrics.filter(m => m.active)} selectedMetrics={historySelectedMetrics} onSelectionChange={setHistorySelectedMetrics} settings={appSettings} />}
                {view === 'settings' && <MetricManager metrics={metrics} onUpdate={handleMetricsUpdate} onRename={handleMetricRename} onFactoryReset={handleFactoryReset} settings={appSettings} onSettingsChange={handleSettingsUpdate} />}
                
                {view === 'entry' && (
                     <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                            <h2 className="text-xl font-bold text-slate-900">Log Metrics</h2>
                            <div className="flex space-x-1 sm:space-x-4 mt-4 overflow-x-auto">
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setActiveFormCategory(cat)} className={`text-sm font-medium px-3 py-2 border-b-2 capitalize ${activeFormCategory === cat ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>{cat}</button>
                                ))}
                            </div>
                        </div>
                        <form onSubmit={handleSave} className="p-6 sm:p-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 pb-8 border-b border-slate-100">
                                <FormattedDateInput value={entryDate} onChange={setEntryDate} format={appSettings.dateFormat} />
                                <div className="flex gap-2">
                                    <FormattedTimeInput value={entryTime} onChange={setEntryTime} format={appSettings.timeFormat} />
                                    <button type="button" onClick={setNow} className="px-3 py-2 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"><RotateCcw className="w-3 h-3 text-slate-600"/></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                {metrics.filter(m => m.category === activeFormCategory && m.active && !m.isCalculated).map(m => {
                                    const isBool = m.range[0] === 0 && m.range[1] === 1 && m.step === 1;
                                    const isTime = m.isTimeBased !== undefined ? m.isTimeBased : (m.unit && m.unit.includes('hour'));
                                    return (
                                        <div key={m.id}>
                                            <label className="block text-sm font-semibold text-slate-800 mb-1">{m.name} <span className="text-slate-500 font-normal">({m.unit})</span></label>
                                            {isBool ? (
                                                <select className="w-full rounded-md border-slate-300 shadow-sm px-4 py-2 border bg-white text-slate-900 font-medium" value={newEntryValues[m.id] ?? ''} onChange={e => handleInputChange(m.id, e.target.value)}>
                                                    <option value="" disabled>Select...</option>
                                                    <option value="0">No / Low</option>
                                                    <option value="1">Yes / High</option>
                                                </select>
                                            ) : isTime ? (
                                                <FormattedDurationInput value={newEntryValues[m.id] as number} onChange={val => handleInputChange(m.id, val)} unit={m.unit} />
                                            ) : (
                                                <input type="number" step={m.step} className="w-full rounded-md border-slate-300 shadow-sm px-4 py-2 border bg-white text-slate-900 font-medium" value={newEntryValues[m.id] ?? ''} onChange={e => handleInputChange(m.id, e.target.value)} />
                                            )}
                                        </div>
                                    );
                                })}
                                {metrics.filter(m => m.category === activeFormCategory && m.active && !m.isCalculated).length === 0 && (
                                    <div className="col-span-2 text-center text-slate-400 italic py-4">No input metrics in this category.</div>
                                )}
                            </div>
                            <div className="pt-6 flex justify-end gap-3 mt-8 border-t border-slate-100">
                                <button type="button" onClick={() => setView('dashboard')} className="px-4 py-2 text-sm border rounded-lg bg-white text-slate-700 hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">Save Entry</button>
                            </div>
                        </form>
                     </div>
                )}
            </main>
        </div>
    );
};

export default App;
