
import React, { useState, useMemo } from 'react';
import { MetricConfig, MetricStatusData, AppSettings, StatusLevel } from '../../types';
import { Search } from 'lucide-react';
import { MetricCard } from '../shared/MetricCard';

interface MetricsGridProps {
    metrics: MetricConfig[];
    dashboardState: Record<string, MetricStatusData>;
    categories: string[];
    settings: AppSettings;
    onMetricClick: (id: string) => void;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics, dashboardState, categories, settings, onMetricClick }) => {
    // Local Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [metricSort, setMetricSort] = useState<'default' | 'name' | 'status' | 'recency' | 'streak'>('default');
    const [statusFilter, setStatusFilter] = useState<'all' | 'good' | 'fair' | 'poor' | 'unknown'>('all');

    const gridMetrics = useMemo(() => {
        let result = metrics.filter(m => m.active);
        
        if (searchTerm) result = result.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (categoryFilter !== 'all') result = result.filter(m => m.category === categoryFilter);
        
        if (statusFilter !== 'all') {
            result = result.filter(m => {
                const data = dashboardState[m.id];
                if (statusFilter === 'unknown') return !data || data.value === null;
                if (!data) return false;
                return data.status.toLowerCase() === statusFilter;
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
    }, [metrics, statusFilter, metricSort, dashboardState, searchTerm, categoryFilter]);

    return (
        <div>
            {/* Controls Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <h3 className="text-lg font-semibold text-slate-700 whitespace-nowrap">Detailed Metrics</h3>
                <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[140px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border-slate-200 focus:border-indigo-500 bg-white shadow-sm" />
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="flex-1 sm:flex-none pl-2 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg bg-white shadow-sm cursor-pointer min-w-[100px]">
                            <option value="all">All Cats</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="flex-1 sm:flex-none pl-2 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg bg-white shadow-sm cursor-pointer min-w-[110px]">
                            <option value="all">All Status</option>
                            <option value="good">Good (Green)</option>
                            <option value="fair">Fair (Yellow)</option>
                            <option value="poor">Poor (Red)</option>
                            <option value="unknown">No Data</option>
                        </select>
                        <select value={metricSort} onChange={(e) => setMetricSort(e.target.value as any)} className="flex-1 sm:flex-none pl-2 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg bg-white shadow-sm cursor-pointer min-w-[110px]">
                            <option value="default">Default</option>
                            <option value="name">Name</option>
                            <option value="status">Status</option>
                            <option value="recency">Updated Recently</option>
                            <option value="streak">Streak Length</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* The Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gridMetrics.map(m => (
                    <MetricCard
                        key={m.id}
                        config={m}
                        data={dashboardState[m.id]}
                        onClick={() => onMetricClick(m.id)}
                        dateFormat={settings.dateFormat}
                    />
                ))}
            </div>
            {gridMetrics.length === 0 && (
                <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No metrics match your filters.
                </div>
            )}
        </div>
    );
};
