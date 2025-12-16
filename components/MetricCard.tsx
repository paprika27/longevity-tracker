import React from 'react';
import { MetricConfig, StatusLevel } from '../types';
import { Smile, Meh, Frown, HelpCircle, Clock } from 'lucide-react';

interface MetricCardProps {
config: MetricConfig;
value: number | null;
status: StatusLevel;
timestamp?: string;
onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ config, value, status, timestamp, onClick }) => {
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
<div 
  onClick={onClick}
  className={`relative group p-4 rounded-xl border ${getBorderColor()} shadow-sm transition-all duration-200 hover:shadow-md hover:z-10 ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
>
{/* Tooltip Hover State */}
<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 backdrop-blur-sm">
    <p className="font-medium mb-1 leading-snug">{config.fact}</p>
    <p className="text-slate-400 italic font-light border-t border-slate-700 pt-1 mt-1">{config.citation}</p>
    {/* Tooltip Arrow */}
    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
</div>

<div className="flex justify-between items-start mb-2">
<div>
<h3 className="text-sm font-semibold text-slate-700">{config.name}</h3>
<p className="text-xs text-slate-500">Target: {config.range[0]} - {config.range[1]} {config.unit}</p>
</div>
<div>{getIcon()}</div>
</div>

<div className="mt-2">
<div className="flex items-baseline gap-2">
<span className="text-2xl font-bold text-slate-800">
{value !== null ? value : '--'}
</span>
<span className="text-xs text-slate-500">{config.unit}</span>

{/* Age Indicator */}
{timestamp && value !== null && (
<span className="ml-auto text-[10px] flex items-center gap-0.5 text-slate-400 bg-white/50 px-1.5 py-0.5 rounded-full border border-black/5" title={new Date(timestamp).toLocaleDateString()}>
<Clock className="w-2.5 h-2.5" />
{getRelativeTime(timestamp)}
</span>
)}
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