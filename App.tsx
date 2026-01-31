
import React, { useState, useMemo } from 'react';
import { MetricConfig, MetricValues } from './types';
import * as db from './services/storageService';
import * as engine from './services/engine';

// Components
import { DashboardView } from './components/dashboard/DashboardView';
import { HistoryView } from './components/history/HistoryView';
import { RegimenView } from './components/regimen/RegimenView';
import { MetricManager } from './components/settings/MetricManager';
import { AuthWidget } from './components/shared/AuthWidget';
import { EntryForm } from './components/entry/EntryForm';

// Hooks
import { useLongevityData } from './hooks/useLongevityData';

// Icons
import { Activity, PlusCircle, LayoutDashboard, History, Settings, FileText } from 'lucide-react';

const App: React.FC = () => {
    const [view, setView] = useState<'dashboard' | 'regimen' | 'entry' | 'history' | 'settings'>('dashboard');
    const [historySelectedMetrics, setHistorySelectedMetrics] = useState<string[]>(['bmi']);
    
    // Data Hook (Loads and Persists raw data)
    const { entries, metrics, categories, settings, refreshData, saveEntry, updateMetrics, updateSettings } = useLongevityData();

    // Derived Logic (Processed by Engine)
    const processedEntries = useMemo(() => engine.processEntries(entries, metrics), [entries, metrics]);
    const dashboardState = useMemo(() => engine.calculateDashboardState(processedEntries, metrics), [processedEntries, metrics]);
    const coachingData = useMemo(() => engine.getCoachingData(dashboardState, metrics), [metrics, dashboardState]);
    
    // Radar Logic
    const radarValues = useMemo(() => {
        const vals: MetricValues = {};
        Object.entries(dashboardState).forEach(([k, v]) => vals[k] = v.value);
        return vals;
    }, [dashboardState]);

    // Handlers
    const handleMetricRename = (oldId: string, newId: string, newConfig: MetricConfig): boolean => {
        const targetMetric = metrics.find(m => m.id === newId && m.id !== oldId);
        if (targetMetric) {
            if (!window.confirm(`Metric ID '${newId}' already exists. Merge?`)) return false;
            // Logic to merge entries (kept inside App for now as it involves complex DB manipulations)
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
            refreshData();
            return true;
        } else {
             // Rename logic
            const updatedEntries = entries.map(entry => {
                if (entry.values[oldId] !== undefined) {
                    const newValues = { ...entry.values, [newId]: entry.values[oldId] };
                    delete newValues[oldId];
                    return { ...entry, values: newValues };
                }
                return entry;
            });
            db.saveAllEntries(updatedEntries);
            const updatedMetrics = metrics.map(m => m.id === oldId ? { ...newConfig, id: newId } : m);
            updateMetrics(updatedMetrics);
            refreshData();
            return true;
        }
    };

    const handleFactoryReset = () => {
        if (window.confirm("⚠ FACTORY RESET WARNING ⚠\n\nThis will DELETE ALL DATA.\nAre you sure?")) {
            db.factoryReset();
            window.location.reload();
        }
    };

    const handleMetricClick = (id: string) => {
        setHistorySelectedMetrics([id]);
        setView('history');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const NavButton = ({ id, label, icon: Icon }: { id: typeof view, label: string, icon: any }) => (
        <button
            onClick={() => setView(id)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                view === id 
                ? 'text-indigo-600 bg-indigo-50/50' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
        >
            <Icon className={`w-6 h-6 mb-1 ${view === id ? 'stroke-2' : 'stroke-1.5'}`} />
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen pb-24 sm:pb-12 bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 safe-pt">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-600">
                        <Activity className="w-6 h-6" />
                        <h1 className="font-bold text-xl tracking-tight text-slate-900 block">Longevity<span className="text-indigo-600">Tracker</span></h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <nav className="hidden sm:flex gap-1 bg-slate-100 p-1 rounded-lg">
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
            </header>

            {/* Main View Area */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {view === 'dashboard' && (
                    <DashboardView 
                        entries={entries}
                        metrics={metrics}
                        categories={categories}
                        settings={settings}
                        dashboardState={dashboardState}
                        coachingData={coachingData}
                        radarValues={radarValues}
                        onNavigateToEntry={() => setView('entry')}
                        onMetricClick={handleMetricClick}
                        onImportComplete={refreshData}
                    />
                )}
                
                {view === 'regimen' && <RegimenView />}
                
                {view === 'history' && (
                    <HistoryView 
                        entries={processedEntries} 
                        metrics={metrics.filter(m => m.active)} 
                        selectedMetrics={historySelectedMetrics} 
                        onSelectionChange={setHistorySelectedMetrics} 
                        settings={settings} 
                    />
                )}
                
                {view === 'settings' && (
                    <MetricManager 
                        metrics={metrics} 
                        onUpdate={updateMetrics} 
                        onRename={handleMetricRename} 
                        onFactoryReset={handleFactoryReset} 
                        settings={settings} 
                        onSettingsChange={updateSettings} 
                    />
                )}
                
                {view === 'entry' && (
                    <EntryForm 
                        metrics={metrics}
                        categories={categories}
                        settings={settings}
                        onSave={saveEntry}
                        onCancel={() => setView('dashboard')}
                    />
                )}
            </main>

            {/* Mobile Nav */}
            <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)] z-50">
                <div className="grid grid-cols-5 h-16 safe-pb">
                    <NavButton id="dashboard" label="Home" icon={LayoutDashboard} />
                    <NavButton id="entry" label="Log" icon={PlusCircle} />
                    <NavButton id="history" label="Trends" icon={History} />
                    <NavButton id="regimen" label="Protocol" icon={FileText} />
                    <NavButton id="settings" label="Settings" icon={Settings} />
                </div>
            </nav>
        </div>
    );
};

export default App;
