
import React, { useState } from 'react';
import { Activity, ListChecks, TrendingUp, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { MetricConfig } from '../../types';
import { formatDuration } from '../shared/FormattedInputs';

interface CoachBannerProps {
  missingDailyMetrics: MetricConfig[];
  weeklyMetrics: { config: MetricConfig; current: number; target: number; isAtRisk?: boolean }[];
  onNavigateToEntry: () => void;
}

export const CoachBanner: React.FC<CoachBannerProps> = ({ missingDailyMetrics, weeklyMetrics, onNavigateToEntry }) => {
  const [showAllDaily, setShowAllDaily] = useState(false);
  const date = new Date();
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

  // Display top 5 or all depending on state
  const visibleDaily = showAllDaily ? missingDailyMetrics : missingDailyMetrics.slice(0, 5);
  const hiddenCount = missingDailyMetrics.length - visibleDaily.length;

  return (
    <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden mb-8 print:border-slate-300 print:shadow-none print:mb-4">
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center print:bg-none print:border-b-2 print:border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600 print:text-slate-800" />
            Coach's Daily Briefing
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide font-semibold">{dayName}</p>
        </div>
      </div>
      
      <div className="p-0 sm:p-6 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-indigo-50 print:block print:divide-none">
        
        {/* LEFT: DAILY INPUTS - HIDDEN ON PRINT */}
        <div className="p-6 sm:p-0 sm:pr-6 print:hidden">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-orange-500" /> 
            Log These Today
          </h4>
          
          {missingDailyMetrics.length > 0 ? (
            <div className="space-y-3">
              {visibleDaily.map(m => (
                <button 
                  key={m.id} 
                  onClick={onNavigateToEntry}
                  className="flex items-center justify-between group w-full text-left hover:bg-slate-50 p-1.5 -mx-1.5 rounded transition-colors"
                  title="Click to Log"
                >
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors border-b border-dotted border-slate-300 pb-0.5">{m.name}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-white group-hover:shadow-sm">Log Now &rarr;</span>
                </button>
              ))}
              
              {!showAllDaily && hiddenCount > 0 && (
                <button 
                  onClick={() => setShowAllDaily(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 mt-2"
                >
                  <ChevronDown className="w-3 h-3" /> Show {hiddenCount} more
                </button>
              )}
              {showAllDaily && missingDailyMetrics.length > 5 && (
                 <button 
                  onClick={() => setShowAllDaily(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1 mt-2"
                >
                  <ChevronUp className="w-3 h-3" /> Show Less
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 bg-green-50 rounded-lg border border-green-100 text-green-700">
                <CheckCircle2 className="w-6 h-6 mb-1 opacity-80" />
                <span className="text-sm font-medium">All daily logs complete!</span>
            </div>
          )}
        </div>

        {/* RIGHT: WEEKLY ACCUMULATION - VISIBLE ON PRINT */}
        <div className="p-6 sm:p-0 sm:pl-6 print:p-0 print:pl-0 print:w-full">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2 print:text-slate-700 print:mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500 print:text-slate-700" /> 
            Weekly Accumulation
          </h4>
          
          {weeklyMetrics.length > 0 ? (
            <div className="space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2 print:max-h-none print:overflow-visible">
              {weeklyMetrics.map(item => {
                const pct = Math.min(100, Math.round((item.current / item.target) * 100));
                
                // Colors based on risk and progress
                let barColor = 'bg-blue-500';
                if (item.isAtRisk) barColor = 'bg-orange-400';
                if (pct >= 100) barColor = 'bg-green-500';

                const formattedCurrent = item.config.isTimeBased ? formatDuration(item.current) : item.current;
                const formattedTarget = item.config.isTimeBased ? formatDuration(item.target) : item.target;

                return (
                  <div key={item.config.id} className="print:break-inside-avoid">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{item.config.name}</span>
                      <span className={`font-mono text-xs ${item.isAtRisk ? 'text-orange-600 font-bold' : 'text-slate-500'} print:text-slate-700`}>
                        {formattedCurrent} / {formattedTarget} {item.config.unit.split('/')[0]}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden print:bg-slate-200">
                      <div 
                        className={`h-full rounded-full ${barColor} transition-all duration-500 print:print-color-adjust-exact`} 
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 bg-slate-50 rounded-lg border border-slate-200 text-slate-400">
                 <span className="text-sm">No weekly metrics tracked.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
