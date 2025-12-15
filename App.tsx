import React, { useState, useEffect, useMemo } from 'react';
import { METRICS } from './constants';
import { MetricValues, LogEntry, StatusLevel, FeedbackItem } from './types';
import * as db from './services/storageService';
import { MetricCard } from './components/MetricCard';
import { RadarView } from './components/RadarView';
import { HistoryView } from './components/HistoryView';
import { RegimenView } from './components/RegimenView';
import { DataControls } from './components/DataControls';
import { Activity, PlusCircle, LayoutDashboard, History, Save, Quote, ClipboardList } from 'lucide-react';

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
  const [view, setView] = useState<'dashboard' | 'regimen' | 'entry' | 'history'>('dashboard');
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [newEntryValues, setNewEntryValues] = useState<MetricValues>({});
  
  // Form Categories
  const [activeFormCategory, setActiveFormCategory] = useState<'daily' | 'weekly' | 'clinical'>('daily');

  // Load data on mount
  useEffect(() => {
    setEntries(db.getEntries());
  }, []);

  const refreshData = () => {
    setEntries(db.getEntries());
  };

  // Derived state
  const latestEntry = useMemo(() => entries.length > 0 ? entries[entries.length - 1] : null, [entries]);
  
  // Feedback Logic
  const feedback: FeedbackItem[] = useMemo(() => {
    if (!latestEntry) return [];
    const items: FeedbackItem[] = [];
    METRICS.forEach(m => {
        const val = latestEntry.values[m.id];
        if (val !== null && val !== undefined) {
            const status = getStatus(val, m.range);
            let msg = "";
            if (status === StatusLevel.GOOD) {
                msg = `Great job! Your ${m.name} (${val} ${m.unit}) is in the optimal range.`;
            } else if (status === StatusLevel.FAIR) {
                msg = `Close! Your ${m.name} (${val} ${m.unit}) is near the target range.`;
            } else {
                msg = `Your ${m.name} (${val} ${m.unit}) is outside the target range.`;
            }
            items.push({
                metricId: m.id,
                metricName: m.name,
                value: val,
                status,
                message: msg,
                citation: m.fact + " [" + m.citation + "]"
            });
        }
    });
    // Sort by priority: Poor -> Fair -> Good
    return items.sort((a, b) => {
        const score = (s: StatusLevel) => s === StatusLevel.POOR ? 0 : s === StatusLevel.FAIR ? 1 : 2;
        return score(a.status) - score(b.status);
    });
  }, [latestEntry]);

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
                <div className="flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4"/> Dashboard</div>
             </button>
             <button 
                onClick={() => setView('regimen')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'regimen' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <div className="flex items-center gap-1.5"><ClipboardList className="w-4 h-4"/> Regimen</div>
             </button>
             <button 
                onClick={() => setView('history')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <div className="flex items-center gap-1.5"><History className="w-4 h-4"/> Trends</div>
             </button>
             <button 
                onClick={() => setView('entry')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'entry' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <div className="flex items-center gap-1.5"><PlusCircle className="w-4 h-4"/> Log Data</div>
             </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW: DASHBOARD */}
        {view === 'dashboard' && (
            <div className="space-y-8">
                <div className="flex justify-end">
                    <DataControls entries={entries} onImportComplete={refreshData} />
                </div>

                {!latestEntry ? (
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
                                <RadarView metrics={METRICS} values={latestEntry.values} />
                             </div>
                             
                             {/* Facts & Feedback */}
                             <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                                    <Quote className="w-5 h-5 text-indigo-500" />
                                    Analysis & Evidence
                                </h3>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {feedback.map(item => (
                                        <div key={item.metricId} className={`p-4 rounded-lg border-l-4 ${
                                            item.status === StatusLevel.GOOD ? 'border-green-500 bg-green-50' : 
                                            item.status === StatusLevel.FAIR ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'
                                        }`}>
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold text-slate-800">{item.metricName}</h4>
                                                <span className="text-xs font-mono bg-white/50 px-2 py-0.5 rounded text-slate-600">{item.value}</span>
                                            </div>
                                            <p className="text-sm text-slate-700 mt-1">{item.message}</p>
                                            <p className="text-xs text-slate-500 mt-2 italic border-t border-black/5 pt-2">"{item.citation}"</p>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>

                        {/* Metric Cards Grid */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-4">Detailed Metrics</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {METRICS.map(m => (
                                    <MetricCard 
                                        key={m.id} 
                                        config={m} 
                                        value={latestEntry.values[m.id] ?? null} 
                                        status={latestEntry.values[m.id] !== undefined && latestEntry.values[m.id] !== null ? getStatus(latestEntry.values[m.id]!, m.range) : StatusLevel.UNKNOWN}
                                    />
                                ))}
                            </div>
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
                        <h2 className="text-xl font-bold text-slate-900">Log Metrics</h2>
                        <div className="flex space-x-1 sm:space-x-4 mt-4 overflow-x-auto">
                            {(['daily', 'weekly', 'clinical'] as const).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveFormCategory(cat)}
                                    className={`text-sm font-medium px-3 py-2 border-b-2 transition-colors capitalize whitespace-nowrap ${
                                        activeFormCategory === cat 
                                        ? 'border-indigo-600 text-indigo-600' 
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                                >
                                    {cat} Check
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="p-6 sm:p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                            {METRICS.filter(m => m.category === activeFormCategory).map(m => (
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
                        
                        {METRICS.filter(m => m.category === activeFormCategory).length === 0 && (
                            <p className="text-center text-slate-500 py-8 italic">No metrics defined for this category yet.</p>
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
                                Save {activeFormCategory.charAt(0).toUpperCase() + activeFormCategory.slice(1)} Log
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
                <HistoryView entries={entries} metrics={METRICS} />
            </div>
        )}
      </main>
    </div>
  );
};

export default App;