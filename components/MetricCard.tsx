import React from 'react';
import { MetricConfig, StatusLevel } from '../types';
import { Smile, Meh, Frown, HelpCircle } from 'lucide-react';

interface MetricCardProps {
  config: MetricConfig;
  value: number | null;
  status: StatusLevel;
}

export const MetricCard: React.FC<MetricCardProps> = ({ config, value, status }) => {
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

  // Calculate percentage for visualization bar
  // Center is optimal. 
  let percentage = 0;
  if (value !== null) {
      const mid = (config.range[0] + config.range[1]) / 2;
      const span = config.range[1] - config.range[0];
      // Normalize loosely around 50% being the middle of the range
      if (span > 0) {
        // Display range is roughly double the target range
        const displayMin = config.range[0] - (span * 0.5); 
        const displayMax = config.range[1] + (span * 0.5);
        const displaySpan = displayMax - displayMin;
        
        percentage = ((value - displayMin) / displaySpan) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
      } else {
        percentage = 50;
      }
  }

  return (
    <div className={`p-4 rounded-xl border ${getBorderColor()} shadow-sm transition-all duration-200 hover:shadow-md`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">{config.name}</h3>
          <p className="text-xs text-slate-500">Target: {config.range[0]} - {config.range[1]} {config.unit}</p>
        </div>
        <div>{getIcon()}</div>
      </div>

      <div className="mt-2">
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">
            {value !== null ? value : '--'}
            </span>
            <span className="text-xs text-slate-500">{config.unit}</span>
        </div>
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
    </div>
  );
};