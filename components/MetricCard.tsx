
import React from 'react';
import { MetricConfig, StatusLevel, DateFormat, MetricStatusData } from '../types';
import { Smile, Meh, Frown, HelpCircle, Clock, Flame, Target } from 'lucide-react';
import { formatDuration } from './FormattedInputs';

interface MetricCardProps {
  config: MetricConfig;
  data: MetricStatusData | undefined; // Changed from simple value/status to object
  onClick?: () => void;
  dateFormat?: DateFormat;
}

export const MetricCard: React.FC<MetricCardProps> = ({ config, data, onClick, dateFormat = 'YYYY-MM-DD' }) => {
  const value = data?.value ?? null;
  const status = data?.status ?? StatusLevel.UNKNOWN;
  const timestamp = data?.timestamp;
  
  // Weekly Mode Check: If category is weekly, we assume it's an accumulator/progress type
  const isWeeklyAccumulator = config.category === 'weekly' && !!data?.weeklyProgress;
  const streak = data?.streak || 0;

  const getIcon = () => {
    switch (status) {
      case StatusLevel.GOOD: return <Smile className="w-6 h-6 text-green-500" />;
      case StatusLevel.FAIR: return <Meh className="w-6 h-6 text-yellow-500" />;
      case StatusLevel.POOR: return <Frown className="w-6 h-6 text-red-500" />;
      default: return <HelpCircle className="w-6 h-6 text-slate-300" />;
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case StatusLevel.GOOD: return 'border-green-200 bg-green-50/50';
      case StatusLevel.FAIR: return 'border-yellow-200 bg-yellow-50/50';
      case StatusLevel.POOR: return 'border-red-200 bg-red-50/50';
      default: return 'border-slate-100 bg-white';
    }
  };

  // Time format helper
  const getRelativeTime = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  const getFormattedDate = (ts: string) => {
      const date = new Date(ts);
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();

      if (dateFormat === 'DD.MM.YYYY') return `${d}.${m}.${y}`;
      if (dateFormat === 'MM/DD/YYYY') return `${m}/${d}/${y}`;
      return `${y}-${m}-${d}`;
  };

  // Calculate percentage for visualization bar
  let percentage = 0;
  
  if (isWeeklyAccumulator && data?.weeklyProgress) {
      // Weekly Progress Bar logic (0 to Target)
      percentage = Math.min(100, (data.weeklyProgress.current / data.weeklyProgress.target) * 100);
  } else if (value !== null) {
      // Standard Range Logic
      const mid = (config.range[0] + config.range[1]) / 2;
      const span = config.range[1] - config.range[0];
      if (span > 0) {
          const displayMin = config.range[0] - (span * 0.5);
          const displayMax = config.range[1] + (span * 0.5);
          const displaySpan = displayMax - displayMin;
          percentage = ((value - displayMin) / displaySpan) * 100;
          percentage = Math.max(0, Math.min(100, percentage));
      } else {
          percentage = 50;
      }
  }

  // FORMAT VALUES IF TIME-BASED
  const formatVal = (v: number) => config.isTimeBased ? formatDuration(v) : v;

  const displayValue = value !== null ? formatVal(value) : '--';
  const displayRangeMin = formatVal(config.range[0]);
  const displayRangeMax = formatVal(config.range[1]);

  // WEEKLY DISPLAY VALUES
  const weeklyCurrent = isWeeklyAccumulator ? formatVal(data?.weeklyProgress?.current || 0) : 0;
  const weeklyTarget = isWeeklyAccumulator ? formatVal(data?.weeklyProgress?.target || 0) : 0;

  return (
    <div 
      onClick={onClick}
      className={`relative group p-4 rounded-xl border ${getBorderColor()} shadow-sm transition-all duration-200 hover:shadow-md hover:z-10 ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
    >
      {/* Tooltip Hover State */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 backdrop-blur-sm">
          <p className="font-medium mb-1 leading-snug">{config.fact}</p>
          <p className="text-slate-400 italic font-light border-t border-slate-700 pt-1 mt-1">{config.citation}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
              {config.name}
              {isWeeklyAccumulator && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded uppercase">Week</span>}
          </h3>
          <p className="text-xs text-slate-500">
              {isWeeklyAccumulator ? 'Weekly Goal:' : 'Target:'} {displayRangeMin} - {displayRangeMax} {config.unit}
          </p>
        </div>
        <div className="flex items-center gap-1">
             {/* Streak Indicator (Only for daily snapshots) */}
             {!isWeeklyAccumulator && streak > 1 && (
                 <div className="flex items-center text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-100 text-[10px] font-bold" title={`${streak} day streak!`}>
                     <Flame className="w-3 h-3 fill-current" /> {streak}
                 </div>
             )}
            {getIcon()}
        </div>
      </div>

      <div className="mt-2">
        {isWeeklyAccumulator ? (
             // WEEKLY ACCUMULATOR DISPLAY
             <div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-800">{weeklyCurrent}</span>
                    <span className="text-xs text-slate-500">/ {weeklyTarget} {config.unit}</span>
                </div>
                {/* Weekly Progress Bar */}
                <div className="mt-3 h-2 w-full bg-slate-200 rounded-full overflow-hidden relative">
                    <div
                        className={`absolute h-full rounded-full transition-all duration-500 ${
                            percentage >= 100 ? 'bg-green-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="flex justify-between mt-1">
                     <span className="text-[10px] text-slate-400">Mon</span>
                     <span className="text-[10px] text-slate-400">Sun</span>
                </div>
             </div>
        ) : (
             // STANDARD DAILY DISPLAY
             <>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-800">
                        {displayValue}
                    </span>
                    <span className="text-xs text-slate-500">{config.unit}</span>

                    {/* Age Indicator */}
                    {timestamp && value !== null && (
                        <span className="ml-auto text-[10px] flex items-center gap-0.5 text-slate-400 bg-white/50 px-1.5 py-0.5 rounded-full border border-black/5" title={getFormattedDate(timestamp)}>
                            <Clock className="w-2.5 h-2.5" />
                            {getRelativeTime(timestamp)}
                        </span>
                    )}
                </div>

                {/* Visual Indicator Bar */}
                <div className="mt-3 h-2 w-full bg-slate-200 rounded-full overflow-hidden relative">
                    {/* Target Zone Marker */}
                    <div
                        className="absolute h-full bg-green-200/50 top-0"
                        style={{
                            left: '25%',
                            width: '50%'
                        }}
                    />
                    {value !== null && (
                        <div
                            className={`absolute h-full rounded-full transition-all duration-500 ${
                                status === StatusLevel.GOOD ? 'bg-green-500' :
                                status === StatusLevel.FAIR ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{
                                width: '6px',
                                left: `calc(${percentage}% - 3px)`
                            }}
                        />
                    )}
                </div>
             </>
        )}
      </div>
    </div>
  );
};