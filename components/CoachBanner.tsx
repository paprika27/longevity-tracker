
import React from 'react';
import { AlertCircle, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { MetricConfig } from '../types';

interface CoachBannerProps {
  missingDailyMetrics: MetricConfig[];
  atRiskWeeklyMetrics: { config: MetricConfig; current: number; target: number }[];
}

export const CoachBanner: React.FC<CoachBannerProps> = ({ missingDailyMetrics, atRiskWeeklyMetrics }) => {
  const date = new Date();
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

  const allClear = missingDailyMetrics.length === 0 && atRiskWeeklyMetrics.length === 0;

  if (allClear) {
    return (
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-md mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">All Systems Nominal</h3>
            <p className="text-indigo-100">
              Incredible work. You've logged your daily metrics and your weekly targets are on track. 
              {isWeekend ? " Enjoy your active recovery weekend!" : " Keep maintaining this momentum."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden mb-8">
      <div className="bg-indigo-50/50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Coach's Briefing <span className="text-slate-400 font-normal text-sm">| {dayName}</span>
          </h3>
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Tasks */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-orange-500" /> Action Required Today
          </h4>
          {missingDailyMetrics.length > 0 ? (
            <ul className="space-y-2">
              {missingDailyMetrics.slice(0, 4).map(m => (
                <li key={m.id} className="flex items-center gap-2 text-sm text-slate-700 bg-orange-50/50 px-3 py-2 rounded-md border border-orange-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                  Log <strong>{m.name}</strong>
                </li>
              ))}
              {missingDailyMetrics.length > 4 && (
                <li className="text-xs text-slate-400 pl-4">+ {missingDailyMetrics.length - 4} more</li>
              )}
            </ul>
          ) : (
            <div className="text-sm text-green-600 flex items-center gap-2 bg-green-50 px-3 py-2 rounded-md">
              <CheckCircle2 className="w-4 h-4" /> Daily logs complete.
            </div>
          )}
        </div>

        {/* Weekly Focus */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Weekly Targets Focus
          </h4>
          {atRiskWeeklyMetrics.length > 0 ? (
            <ul className="space-y-3">
              {atRiskWeeklyMetrics.map(item => {
                const remaining = Math.max(0, item.target - item.current);
                const percent = Math.min(100, Math.round((item.current / (item.target || 1)) * 100));
                return (
                  <li key={item.config.id} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-700">{item.config.name}</span>
                      <span className="text-slate-500 text-xs">{item.current} / {item.target} {item.config.unit}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Need {Math.round(remaining * 10) / 10} more {item.config.unit} this week.
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-sm text-slate-500 italic py-2">
              No weekly targets at risk. You are on track!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};