
import React from 'react';
import { MetricConfig, MetricStatusData, AppSettings, LogEntry } from '../../types';
import { BiologicalAgeView } from './BiologicalAgeView';
import { CoachBanner } from './CoachBanner';
import { DataControls } from './DataControls';
import { FeedbackPanel } from './FeedbackPanel';
import { MetricsGrid } from './MetricsGrid';
import { Activity, Printer } from 'lucide-react';

interface DashboardViewProps {
    entries: LogEntry[];
    metrics: MetricConfig[];
    categories: string[];
    settings: AppSettings;
    dashboardState: Record<string, MetricStatusData>;
    coachingData: { missingDaily: MetricConfig[], weeklyMetrics: any[] };
    radarValues: Record<string, number | null>;
    onNavigateToEntry: () => void;
    onMetricClick: (id: string) => void;
    onImportComplete: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
    entries, metrics, categories, settings, 
    dashboardState, coachingData, radarValues,
    onNavigateToEntry, onMetricClick, onImportComplete 
}) => {
    
    const handlePrintReport = () => {
        window.print(); 
    };

    return (
        <div className="space-y-6 sm:space-y-8 print:space-y-4">
            {/* Top Bar - Buttons Hidden on Print */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:border-b-2 print:border-slate-800 print:pb-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Dashboard Report</h2>
                    <p className="text-slate-500 text-sm print:text-slate-700">Generated on {new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex w-full sm:w-auto gap-2 print:hidden">
                    <button onClick={handlePrintReport} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                        <Printer className="w-3 h-3" /> Report
                    </button>
                    <DataControls entries={entries} metrics={metrics} onImportComplete={onImportComplete} />
                </div>
            </div>

            {/* Daily Briefing Banner */}
            <CoachBanner 
                missingDailyMetrics={coachingData.missingDaily} 
                weeklyMetrics={coachingData.weeklyMetrics}
                onNavigateToEntry={onNavigateToEntry}
            />

            {entries.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 print:border-slate-400">
                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No data logged yet</h3>
                    <button onClick={onNavigateToEntry} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition mt-4 print:hidden">
                        Log First Entry
                    </button>
                </div>
            ) : (
                <>
                    {/* Top Section: Age/Radar vs Feedback */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 print:block">
                        <div className="lg:col-span-1 space-y-6 print:w-full print:mb-6">
                            <BiologicalAgeView values={radarValues} metrics={metrics} onNavigateToEntry={onNavigateToEntry} />
                        </div>
                        <div className="lg:col-span-2 print:hidden">
                            <FeedbackPanel metrics={metrics} dashboardState={dashboardState} />
                        </div>
                    </div>

                    {/* Bottom Section: Full Metrics Grid */}
                    <MetricsGrid 
                        metrics={metrics}
                        dashboardState={dashboardState}
                        categories={categories}
                        settings={settings}
                        onMetricClick={onMetricClick}
                    />
                </>
            )}
        </div>
    );
};
