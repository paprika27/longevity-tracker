import React, { useState, useEffect, useMemo } from 'react';
import { MetricValues, LogEntry, StatusLevel, FeedbackItem, MetricConfig } from './types';
import * as db from './services/storageService';
import { MetricCard } from './components/MetricCard';
import { RadarView } from './components/RadarView';
import { HistoryView } from './components/HistoryView';
import { RegimenView } from './components/RegimenView';
import { DataControls } from './components/DataControls';
import { MetricManager } from './components/MetricManager';
import { Activity, PlusCircle, LayoutDashboard, History, Save, Quote, ClipboardList, Settings, Edit3, Pin, X, Eye, Filter, ArrowUpDown } from 'lucide-react';

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

const App: React.FC = () => {
const [view, setView] = useState<'dashboard' | 'regimen' | 'entry' | 'history' | 'settings'>('dashboard');
const [entries, setEntries] = useState<LogEntry[]>([]);
const [metrics, setMetrics] = useState<MetricConfig[]>([]);
const [categories, setCategories] = useState<string[]>([]);
const [newEntryValues, setNewEntryValues] = useState<MetricValues>({});

// Feedback State
const [pinnedFeedback, setPinnedFeedback] = useState<string[]>(() => {
try { return JSON.parse(localStorage.getItem('lt_pinned_feedback') || '[]'); } catch { return []; }
});
const [dismissedFeedback, setDismissedFeedback] = useState<string[]>(() => {
try { return JSON.parse(localStorage.getItem('lt_dismissed_feedback') || '[]'); } catch { return []; }
});

// Metrics Grid State
const [metricSort, setMetricSort] = useState<'default' | 'name' | 'status' | 'recency'>('default');
const [metricFilter, setMetricFilter] = useState<'all' | 'good' | 'fair' | 'poor'>('all');

// Form Categories
const [activeFormCategory, setActiveFormCategory] = useState<string>('daily');

// Load data on mount
useEffect(() => {
setEntries(db.getEntries());
setMetrics(db.getMetrics());
const cats = db.getCategories();
setCategories(cats);
if (cats.length > 0) setActiveFormCategory(cats[0]);
}, []);

// Persist feedback preferences
useEffect(() => { localStorage.setItem('lt_pinned_feedback', JSON.stringify(pinnedFeedback)); }, [pinnedFeedback]);
useEffect(() => { localStorage.setItem('lt_dismissed_feedback', JSON.stringify(dismissedFeedback)); }, [dismissedFeedback]);

const refreshData = () => {
setEntries(db.getEntries());
setMetrics(db.getMetrics());
setCategories(db.getCategories());
};

const handleMetricsUpdate = (updatedMetrics: MetricConfig[]) => {
setMetrics(updatedMetrics);
};

const handleMetricRename = (oldId: string, newId: string, newConfig: MetricConfig): boolean => {
// 1. Check if newId exists (Merge scenario)
const targetMetric = metrics.find(m => m.id === newId && m.id !== oldId);

if (targetMetric) {
if (!window.confirm(`Metric ID '${newId}' already exists. Do you want to merge data from '${oldId}' into '${newId}'? This cannot be undone.`)) {
return false;
}

// MERGE STRATEGY
const updatedEntries = entries.map(entry => {
const val = entry.values[oldId];
if (val !== undefined && val !== null) {
// Check if target already has data
if (entry.values[newId] === undefined || entry.values[newId] === null) {
// Move data
const newValues = { ...entry.values, [newId]: val };
delete newValues[oldId];
return { ...entry, values: newValues };
} else {
// Target exists, just remove old
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
// SIMPLE RENAME
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
if (window.confirm("⚠ FACTORY RESET WARNING ⚠\n\nThis will DELETE ALL DATA including your history, custom metrics, and settings.\n\nThis action cannot be undone. Are you sure?")) {
db.factoryReset();
window.location.reload();
}
};

// --- DERIVED STATE ---

// 1. Calculate Derived Metrics (Formulas) with Forward Fill
const processedEntries = useMemo(() => {
const calculatedMetrics = metrics.filter(m => m.isCalculated && m.formula);
if (calculatedMetrics.length === 0) return entries;

const sortedEntries = [...entries].sort((a, b) =>
new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
);

const runningValues: MetricValues = {};

return sortedEntries.map(entry => {
Object.entries(entry.values).forEach(([key, val]) => {
if (val !== null && val !== undefined) {
runningValues[key] = val;
}
});

const context = { ...runningValues };
const newValues = { ...entry.values };

calculatedMetrics.forEach(m => {
if (!m.formula) return;
try {
const func = new Function('vals', `
with(vals) {
try {
return ${m.formula};
} catch(e) { return null; }
}
`);

const result = func(context);
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

// 2. Compute "Current State" for Dashboard (Aggregating latest value for EVERY metric)
const dashboardState = useMemo(() => {
const state: Record<string, { value: number, timestamp: string }> = {};

// Iterate chronologically so later entries overwrite earlier ones
processedEntries.forEach(entry => {
Object.entries(entry.values).forEach(([key, val]) => {
if (val !== null && val !== undefined) {
state[key] = { value: val, timestamp: entry.timestamp };
}
});
});
return state;
}, [processedEntries]);

// 3. Feedback Logic
const feedback: FeedbackItem[] = useMemo(() => {
if (Object.keys(dashboardState).length === 0) return [];

const items: FeedbackItem[] = [];
metrics.filter(m => m.active).forEach(m => {
const data = dashboardState[m.id];
if (data) {
const status = getStatus(data.value, m.range);
let msg = "";
if (status === StatusLevel.GOOD) {
msg = `Great job! Your ${m.name} (${data.value} ${m.unit}) is in the optimal range.`;
} else if (status === StatusLevel.FAIR) {
msg = `Close! Your ${m.name} (${data.value} ${m.unit}) is near the target range.`;
} else {
msg = `Your ${m.name} (${data.value} ${m.unit}) is outside the target range.`;
}
items.push({
metricId: m.id,
metricName: m.name,
value: data.value,
status,
message: msg,
citation: m.fact + " [" + m.citation + "]"
});
}
});

// Filtering dismissed
const visible = items.filter(i => !dismissedFeedback.includes(i.metricId));

// Sorting: Pinned -> Priority (Poor -> Fair -> Good)
return visible.sort((a, b) => {
const aPinned = pinnedFeedback.includes(a.metricId) ? 1 : 0;
const bPinned = pinnedFeedback.includes(b.metricId) ? 1 : 0;
if (aPinned !== bPinned) return bPinned - aPinned;

const score = (s: StatusLevel) => s === StatusLevel.POOR ? 0 : s === StatusLevel.FAIR ? 1 : 2;
return score(a.status) - score(b.status);
});
}, [dashboardState, metrics, pinnedFeedback, dismissedFeedback]);

// 4. Sorted & Filtered Metrics for Grid
const gridMetrics = useMemo(() => {
let result = metrics.filter(m => m.active);

// Filter
if (metricFilter !== 'all') {
result = result.filter(m => {
const data = dashboardState[m.id];
if (!data) return false; // Hide unknown if filtering
const status = getStatus(data.value, m.range);
return status.toLowerCase() === metricFilter;
});
}

// Sort
result.sort((a, b) => {
if (metricSort === 'name') return a.name.localeCompare(b.name);

if (metricSort === 'recency') {
const dateA = dashboardState[a.id] ? new Date(dashboardState[a.id].timestamp).getTime() : 0;
const dateB = dashboardState[b.id] ? new Date(dashboardState[b.id].timestamp).getTime() : 0;
return dateB - dateA;
}

if (metricSort === 'status') {
const statusScore = (m: MetricConfig) => {
const d = dashboardState[m.id];
if (!d) return 3;
const s = getStatus(d.value, m.range);
return s === StatusLevel.POOR ? 0 : s === StatusLevel.FAIR ? 1 : 2;
};
return statusScore(a) - statusScore(b);
}

// Default: Category then defined order
if (a.category !== b.category) return a.category.localeCompare(b.category);
return 0;
});

return result;
}, [metrics, metricFilter, metricSort, dashboardState]);


// --- HANDLERS ---

const handleSave = (e: React.FormEvent) => {
e.preventDefault();
const cleanValues: MetricValues = {};
// Remove NaN or empty strings
Object.keys(newEntryValues).forEach(k => {
if (newEntryValues[k] !== null && newEntryValues[k] !== undefined && !isNaN(newEntryValues[k] as number)) {
cleanValues[k] = newEntryValues[k];
}
});

if (Object.keys(cleanValues).length === 0) return;

db.saveEntry(cleanValues);
setEntries(db.getEntries());
setNewEntryValues({});
setView('dashboard');
};

const handleInputChange = (id: string, val: string) => {
setNewEntryValues(prev => ({
...prev,
[id]: val === '' ? null : parseFloat(val)
}));
};

const toggleFeedbackPin = (id: string) => {
setPinnedFeedback(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
};

const dismissFeedback = (id: string) => {
setDismissedFeedback(prev => [...prev, id]);
};

const restoreFeedback = () => {
setDismissedFeedback([]);
};

// Helper for Radar Chart data
const radarValues = useMemo(() => {
const vals: MetricValues = {};
Object.entries(dashboardState).forEach(([k, v]) => vals[k] = v.value);
return vals;
}, [dashboardState]);

return (
<div className="min-h-screen pb-12 bg-slate-50">
{/* Header */}
<header className="bg-white border-b border-slate-200 sticky top-0 z-10">
<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
<div className="flex items-center gap-2 text-indigo-600">
<Activity className="w-6 h-6" />
<h1 className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">Longevity<span className="text-indigo-600">Tracker</span></h1>
</div>
<nav className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
<button
onClick={() => setView('dashboard')}
className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
>
<div className="flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4"/> <span className="hidden xs:inline">Dashboard</span></div>
</button>
<button
onClick={() => setView('regimen')}
className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'regimen' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
>
<div className="flex items-center gap-1.5"><ClipboardList className="w-4 h-4"/> <span className="hidden xs:inline">Regimen</span></div>
</button>
<button
onClick={() => setView('history')}
className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
>
<div className="flex items-center gap-1.5"><History className="w-4 h-4"/> <span className="hidden xs:inline">Trends</span></div>
</button>
<button
onClick={() => setView('entry')}
className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'entry' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
>
<div className="flex items-center gap-1.5"><PlusCircle className="w-4 h-4"/> <span className="hidden xs:inline">Log Data</span></div>
</button>
<button
onClick={() => setView('settings')}
className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
>
<div className="flex items-center gap-1.5"><Settings className="w-4 h-4"/> <span className="hidden xs:inline">Settings</span></div>
</button>
</nav>
</div>
</header>

<main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

{/* VIEW: DASHBOARD */}
{view === 'dashboard' && (
<div className="space-y-8">
<div className="flex justify-end">
<DataControls entries={entries} metrics={metrics} onImportComplete={refreshData} />
</div>

{processedEntries.length === 0 ? (
<div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
<Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
<h3 className="text-lg font-medium text-slate-900">No data logged yet</h3>
<p className="text-slate-500 mb-6">Start tracking your metrics to see your longevity analysis.</p>
<button onClick={() => setView('entry')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
Log First Entry
</button>
</div>
) : (
<>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
{/* Spider Diagram */}
<div className="lg:col-span-1">
<RadarView metrics={metrics} values={radarValues} />
</div>

{/* Facts & Feedback */}
<div className="lg:col-span-2 space-y-4">
<div className="flex justify-between items-center">
<h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
<Quote className="w-5 h-5 text-indigo-500" />
Analysis & Evidence
</h3>
{dismissedFeedback.length > 0 && (
<button onClick={restoreFeedback} className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1">
<Eye className="w-3 h-3" /> Show Dismissed ({dismissedFeedback.length})
</button>
)}
</div>
<div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
{feedback.length === 0 ? (
<p className="text-slate-400 italic">No feedback available. Add more metrics to your Spider Graph or restore dismissed items.</p>
) : (
feedback.map(item => (
<div key={item.metricId} className={`relative p-4 rounded-lg border-l-4 group transition-all ${
item.status === StatusLevel.GOOD ? 'border-green-500 bg-green-50' :
item.status === StatusLevel.FAIR ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'
}`}>
<div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
<button
onClick={() => toggleFeedbackPin(item.metricId)}
className={`p-1 rounded hover:bg-black/5 ${pinnedFeedback.includes(item.metricId) ? 'text-slate-800' : 'text-slate-400'}`}
title="Pin to top"
>
<Pin className={`w-3.5 h-3.5 ${pinnedFeedback.includes(item.metricId) ? 'fill-current' : ''}`} />
</button>
<button
onClick={() => dismissFeedback(item.metricId)}
className="p-1 rounded hover:bg-black/5 text-slate-400 hover:text-slate-600"
title="Dismiss"
>
<X className="w-3.5 h-3.5" />
</button>
</div>

<div className="flex justify-between items-start pr-8">
<h4 className="font-semibold text-slate-800 flex items-center gap-2">
{pinnedFeedback.includes(item.metricId) && <Pin className="w-3 h-3 text-slate-500 fill-slate-500" />}
{item.metricName}
</h4>
<span className="text-xs font-mono bg-white/50 px-2 py-0.5 rounded text-slate-600">{item.value}</span>
</div>
<p className="text-sm text-slate-700 mt-1">{item.message}</p>
<p className="text-xs text-slate-500 mt-2 italic border-t border-black/5 pt-2">"{item.citation}"</p>
</div>
))
)}
</div>
</div>
</div>

{/* Metric Cards Grid */}
<div>
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
<h3 className="text-lg font-semibold text-slate-700">Detailed Metrics</h3>
<div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
{/* Sort Dropdown */}
<div className="relative flex items-center border-r border-slate-100 pr-2 mr-1">
<ArrowUpDown className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
<select
value={metricSort}
onChange={(e) => setMetricSort(e.target.value as any)}
className="pl-7 pr-2 py-1 text-xs border-none bg-transparent focus:ring-0 text-slate-600 font-medium cursor-pointer"
>
<option value="default">Default Sort</option>
<option value="name">Name</option>
<option value="recency">Recently Updated</option>
<option value="status">Status Priority</option>
</select>
</div>

{/* Filter Dropdown */}
<div className="relative flex items-center">
<Filter className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
<select
value={metricFilter}
onChange={(e) => setMetricFilter(e.target.value as any)}
className="pl-7 pr-2 py-1 text-xs border-none bg-transparent focus:ring-0 text-slate-600 font-medium cursor-pointer"
>
<option value="all">All Statuses</option>
<option value="good">Good Only</option>
<option value="fair">Fair Only</option>
<option value="poor">Poor Only</option>
</select>
</div>
</div>
</div>

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
{gridMetrics.map(m => {
const data = dashboardState[m.id];
const value = data ? data.value : null;
const timestamp = data ? data.timestamp : undefined;
const status = value !== null ? getStatus(value, m.range) : StatusLevel.UNKNOWN;

return (
<MetricCard
key={m.id}
config={m}
value={value}
status={status}
timestamp={timestamp}
/>
);
})}
</div>
{gridMetrics.length === 0 && (
<div className="text-center py-10 text-slate-400">
No metrics match your filters.
</div>
)}
</div>
</>
)}
</div>
)}

{/* VIEW: REGIMEN */}
{view === 'regimen' && (
<RegimenView />
)}

{/* VIEW: ENTRY FORM */}
{view === 'entry' && (
<div className="max-w-3xl mx-auto">
<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
<div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
<div className="flex justify-between items-center">
<h2 className="text-xl font-bold text-slate-900">Log Metrics</h2>
<button
onClick={() => setView('settings')}
className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
>
<Edit3 className="w-3 h-3" /> Customize
</button>
</div>
<div className="flex space-x-1 sm:space-x-4 mt-4 overflow-x-auto pb-2 sm:pb-0">
{categories.map(cat => (
<button
key={cat}
onClick={() => setActiveFormCategory(cat)}
className={`text-sm font-medium px-3 py-2 border-b-2 transition-colors capitalize whitespace-nowrap ${
activeFormCategory === cat
? 'border-indigo-600 text-indigo-600'
: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
}`}
>
{cat}
</button>
))}
</div>
</div>

<form onSubmit={handleSave} className="p-6 sm:p-8">
<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
{metrics.filter(m => m.category === activeFormCategory && m.active && !m.isCalculated).map(m => (
<div key={m.id}>
<label htmlFor={m.id} className="block text-sm font-semibold text-slate-800 mb-1.5">
{m.name} <span className="text-slate-500 font-normal">({m.unit})</span>
</label>
<input
type="number"
id={m.id}
step={m.step}
placeholder={`${m.range[0]} - ${m.range[1]}`}
className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2.5 border bg-white text-slate-900 font-medium placeholder:font-normal placeholder:text-slate-400"
value={newEntryValues[m.id] !== undefined && newEntryValues[m.id] !== null ? newEntryValues[m.id]! : ''}
onChange={(e) => handleInputChange(m.id, e.target.value)}
/>
</div>
))}
</div>

{metrics.filter(m => m.category === activeFormCategory && m.active && !m.isCalculated).length === 0 && (
<div className="text-center py-8">
<p className="text-slate-500 italic mb-4">No active metrics found for this form.</p>
<button
type="button"
onClick={() => setView('settings')}
className="text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
>
Select Metrics for {activeFormCategory}
</button>
</div>
)}

<div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-100 mt-8">
<button
type="button"
onClick={() => setView('dashboard')}
className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
>
Cancel
</button>
<button
type="submit"
className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
>
<Save className="w-4 h-4" />
Save Entry
</button>
</div>
</form>
</div>
</div>
)}

{/* VIEW: HISTORY */}
{view === 'history' && (
<div className="space-y-6">
<div className="flex justify-between items-center">
<h2 className="text-2xl font-bold text-slate-900">Progress History</h2>
</div>
<HistoryView entries={processedEntries} metrics={metrics.filter(m => m.active)} />
</div>
)}

{/* VIEW: SETTINGS */}
{view === 'settings' && (
<div className="space-y-6">
<div className="flex justify-between items-center">
<h2 className="text-2xl font-bold text-slate-900">Settings & Metrics</h2>
</div>
<MetricManager
metrics={metrics}
onUpdate={handleMetricsUpdate}
onRename={handleMetricRename}
onFactoryReset={handleFactoryReset}
/>
</div>
)}
</main>
</div>
);
};

export default App;