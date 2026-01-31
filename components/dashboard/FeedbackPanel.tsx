
import React, { useState, useEffect, useMemo } from 'react';
import { MetricConfig, MetricStatusData, StatusLevel } from '../../types';
import { Quote, CheckCircle2, Eye, Pin, X } from 'lucide-react';
import * as engine from '../../services/engine';

interface FeedbackPanelProps {
    metrics: MetricConfig[];
    dashboardState: Record<string, MetricStatusData>;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ metrics, dashboardState }) => {
    // Feedback State
    const [pinnedFeedback, setPinnedFeedback] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('lt_pinned_feedback') || '[]'); } catch { return []; }
    });
    const [dismissedFeedback, setDismissedFeedback] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('lt_dismissed_feedback') || '[]'); } catch { return []; }
    });
    const [statusFilter, setStatusFilter] = useState<'all' | 'good' | 'fair' | 'poor'>('all');

    // Persistence
    useEffect(() => { localStorage.setItem('lt_pinned_feedback', JSON.stringify(pinnedFeedback)); }, [pinnedFeedback]);
    useEffect(() => { localStorage.setItem('lt_dismissed_feedback', JSON.stringify(dismissedFeedback)); }, [dismissedFeedback]);

    // Generate & Filter
    const displayedFeedback = useMemo(() => {
        const rawItems = engine.generateFeedback(dashboardState, metrics, dismissedFeedback);
        
        const filtered = rawItems.filter(item => {
             if (statusFilter !== 'all' && item.status.toLowerCase() !== statusFilter) return false;
             return true;
        });

        return filtered.sort((a, b) => {
            const aPinned = pinnedFeedback.includes(a.metricId) ? 1 : 0;
            const bPinned = pinnedFeedback.includes(b.metricId) ? 1 : 0;
            if (aPinned !== bPinned) return bPinned - aPinned;
            const score = (s: StatusLevel) => s === StatusLevel.POOR ? 0 : s === StatusLevel.FAIR ? 1 : 2;
            return score(a.status) - score(b.status);
        });
    }, [dashboardState, metrics, dismissedFeedback, statusFilter, pinnedFeedback]);

    // Handlers
    const togglePin = (id: string) => setPinnedFeedback(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const dismiss = (id: string) => setDismissedFeedback(prev => [...prev, id]);
    const restore = () => setDismissedFeedback([]);
    
    const dismissAllVisible = () => {
        const toDismiss = displayedFeedback.filter(item => !pinnedFeedback.includes(item.metricId)).map(item => item.metricId);
        if (toDismiss.length > 0 && confirm(`Dismiss ${toDismiss.length} items?`)) {
            setDismissedFeedback(prev => [...prev, ...toDismiss]);
        }
    };

    return (
        <div className="space-y-4 print:hidden">
            <div className="flex flex-wrap justify-between items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                    <Quote className="w-5 h-5 text-indigo-500" /> Analysis & Evidence
                </h3>
                <div className="flex items-center gap-2">
                        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
                        {['all', 'good', 'fair', 'poor'].map(s => (
                            <button 
                                key={s}
                                onClick={() => setStatusFilter(s as any)}
                                className={`px-2 py-1 text-xs rounded-md font-medium transition-colors capitalize ${statusFilter === s ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {s}
                            </button>
                        ))}
                        </div>
                        <button onClick={dismissAllVisible} className="text-xs bg-white border border-slate-200 text-slate-500 hover:text-red-600 px-2 py-1.5 rounded-lg flex items-center gap-1 shadow-sm" title="Dismiss All Visible">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        {dismissedFeedback.length > 0 && (
                            <button onClick={restore} className="text-xs text-slate-400 hover:text-indigo-600 px-2" title="Restore Dismissed"><Eye className="w-3 h-3" /></button>
                        )}
                </div>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {displayedFeedback.length === 0 && (
                    <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg border border-slate-100">
                        No feedback available for current filter.
                    </div>
                )}
                {displayedFeedback.map(item => (
                    <div key={item.metricId} className={`relative p-4 rounded-lg border-l-4 group transition-all ${item.status === StatusLevel.GOOD ? 'border-green-500 bg-green-50' : item.status === StatusLevel.FAIR ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'}`}>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => togglePin(item.metricId)} className={`p-1 rounded hover:bg-black/5 ${pinnedFeedback.includes(item.metricId) ? 'text-slate-800' : 'text-slate-400'}`}>
                                <Pin className={`w-3.5 h-3.5 ${pinnedFeedback.includes(item.metricId) ? 'fill-current' : ''}`} />
                            </button>
                            <button onClick={() => dismiss(item.metricId)} className="p-1 rounded hover:bg-black/5 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                            </div>
                            <div className="flex justify-between items-start pr-8">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                {pinnedFeedback.includes(item.metricId) && <Pin className="w-3 h-3 text-slate-500 fill-slate-500" />} {item.metricName}
                            </h4>
                            <span className="text-xs font-mono bg-white/50 px-2 py-0.5 rounded text-slate-600">{item.displayValue || item.value}</span>
                            </div>
                            <p className="text-sm text-slate-700 mt-1">{item.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
