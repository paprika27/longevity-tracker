
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush, ReferenceArea } from 'recharts';
import { LogEntry, MetricConfig, AppSettings } from '../../types';
import { XCircle } from 'lucide-react';
import { formatDuration } from '../shared/FormattedInputs';

interface HistoryViewProps {
  entries: LogEntry[];
  metrics: MetricConfig[];
  selectedMetrics: string[];
  onSelectionChange: (metrics: string[]) => void;
  settings: AppSettings;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ entries, metrics, selectedMetrics, onSelectionChange, settings }) => {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
      // Extract unique categories from active metrics
      const uniqueCats = Array.from(new Set(metrics.map(m => m.category)));
      setCategories(uniqueCats);
      
      // Validating selection to ensure we don't have dead metrics selected
      const validSelection = selectedMetrics.filter(id => metrics.find(m => m.id === id));
      
      // If validation fails, correct it via parent callback
      if (validSelection.length !== selectedMetrics.length || (selectedMetrics.length === 0 && metrics.length > 0)) {
         if (metrics.length > 0 && validSelection.length === 0) {
             const bmi = metrics.find(m => m.id === 'bmi');
             const defaultSelection = bmi ? ['bmi'] : [metrics[0].id];
             // Prevent infinite loops by checking if different
             if (defaultSelection[0] !== selectedMetrics[0]) {
                 onSelectionChange(defaultSelection);
             }
         } else if (validSelection.length !== selectedMetrics.length) {
             onSelectionChange(validSelection);
         }
      }
  }, [metrics, selectedMetrics, onSelectionChange]);

  // Sort entries by timestamp to ensure graph flows correctly
  const sortedEntries = useMemo(() => {
      return [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [entries]);

  // Prepare data with proper timestamps for XAxis type="number"
  const data = useMemo(() => {
    // 1. Filter entries: Only keep entries where at least one SELECTED metric has a valid value.
    const relevantEntries = sortedEntries.filter(entry => {
        if (selectedMetrics.length === 0) return true;
        
        return selectedMetrics.some(id => {
            const val = entry.values[id];
            return val !== null && val !== undefined;
        });
    });

    // 2. Map to chart format
    return relevantEntries.map(entry => {
        const point: any = {
            dateStr: new Date(entry.timestamp).toLocaleDateString(),
            timestamp: new Date(entry.timestamp).getTime()
        };
        metrics.forEach(m => {
            point[m.id] = entry.values[m.id];
        });
        return point;
    });
  }, [sortedEntries, metrics, selectedMetrics]);

  // Determine span of data to allow smart date formatting
  const timeSpanData = useMemo(() => {
     if (data.length === 0) return { min: 0, max: 0, spanDays: 0 };
     const min = data[0].timestamp;
     const max = data[data.length - 1].timestamp;
     const spanDays = (max - min) / (1000 * 60 * 60 * 24);
     return { min, max, spanDays };
  }, [data]);

  const toggleMetric = (id: string) => {
    if (selectedMetrics.includes(id)) {
        onSelectionChange(selectedMetrics.filter(m => m !== id));
    } else {
        onSelectionChange([...selectedMetrics, id]);
    }
  };

  const selectCategory = (cat: string) => {
      const ids = metrics.filter(m => m.category === cat).map(m => m.id);
      if (ids.length > 0) onSelectionChange(ids);
  };

  const clearSelection = () => {
      onSelectionChange([]);
  };

  // Helper for Date Formatting on X Axis (Short/Compact for Mobile)
  const formatTickDate = (unix: number) => {
      const date = new Date(unix);
      const span = timeSpanData.spanDays;
      
      // If data spans more than a year, prioritize showing the Year
      if (span > 365) {
          // '23, '24
          return `'${String(date.getFullYear()).slice(-2)}`;
      }
      // If data spans more than 3 months, show Month/Year
      if (span > 90) {
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const y = String(date.getFullYear()).slice(-2);
          return `${m}/${y}`;
      }
      
      // Default: Day/Month
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      return `${d}/${m}`;
  };

  const formatTooltipLabel = (unix: number) => {
      const date = new Date(unix);
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      
      let dateStr = `${y}-${m}-${d}`;
      if (settings.dateFormat === 'DD.MM.YYYY') dateStr = `${d}.${m}.${y}`;
      if (settings.dateFormat === 'MM/DD/YYYY') dateStr = `${m}/${d}/${y}`;

      const timeOpts: Intl.DateTimeFormatOptions = settings.timeFormat === '12h' 
        ? { hour: 'numeric', minute: '2-digit', hour12: true } 
        : { hour: '2-digit', minute: '2-digit', hour12: false };
      
      return `${dateStr} ${date.toLocaleTimeString([], timeOpts)}`;
  };

  // Generate colors
  const colors = [
    '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', 
    '#6366f1', '#ec4899', '#f97316', '#14b8a6', '#84cc16'
  ];

  if (entries.length < 2) {
      return (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl">
              Add at least two entries to see history trends.
          </div>
      )
  }

  const activeMetricConfigs = metrics.filter(m => selectedMetrics.includes(m.id));
  
  // Determine common unit
  const uniqueUnits = Array.from(new Set(activeMetricConfigs.map(m => m.unit)));
  const commonUnit = uniqueUnits.length === 1 ? uniqueUnits[0] : null;

  // Determine if we should show range shading (only if 1 metric selected)
  const showRange = selectedMetrics.length === 1;
  const singleMetric = showRange ? metrics.find(m => m.id === selectedMetrics[0]) : null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        
        {/* Quick Select Buttons */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-100 items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-2">Quick Select:</span>
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => selectCategory(cat)}
                    className="px-3 py-1 text-xs rounded-md bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors capitalize font-medium"
                >
                    {cat}
                </button>
            ))}
            <div className="w-px h-4 bg-slate-300 mx-2"></div>
            <button
                onClick={clearSelection}
                className="px-2 py-1 text-xs rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
                title="Clear Selection"
            >
                <XCircle className="w-3 h-3" /> None
            </button>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex flex-wrap gap-2 mb-6 max-h-[120px] overflow-y-auto custom-scrollbar">
            {metrics.map(m => (
                <button
                    key={m.id}
                    onClick={() => toggleMetric(m.id)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors flex items-center gap-1 ${
                        selectedMetrics.includes(m.id)
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <span className={`w-2 h-2 rounded-full ${selectedMetrics.includes(m.id) ? 'bg-white' : 'bg-slate-300'}`}></span>
                    {m.name}
                </button>
            ))}
        </div>

        {/* Chart Area - Resizable */}
        <div className="min-h-[300px] h-[500px] w-full bg-slate-50/30 rounded-lg p-2 resize-y overflow-hidden relative border border-slate-100 group">
            {selectedMetrics.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    <p>Select metrics above to visualize data.</p>
                </div>
            ) : data.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    <p>No data recorded for the selected metrics.</p>
                </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                
                {/* Reference Area MUST be before Lines to be in background */}
                {showRange && singleMetric && (
                    <ReferenceArea 
                        y1={singleMetric.range[0]} 
                        y2={singleMetric.range[1]} 
                        fill="#22c55e" 
                        fillOpacity={0.15} 
                        ifOverflow="extendDomain"
                    />
                )}

                <XAxis 
                    dataKey="timestamp" 
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']} 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickFormatter={formatTickDate}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={80} // Increased gap for mobile readability
                    tickCount={8}   // Limit total ticks
                />
                <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                    width={40}
                    tickFormatter={(val) => {
                        // If single metric and it's time based, format Y axis as time
                        if (activeMetricConfigs.length === 1 && activeMetricConfigs[0].isTimeBased) {
                            return formatDuration(val);
                        }
                        return commonUnit ? `${val}` : `${val}`;
                    }}
                />
                <Tooltip 
                    labelFormatter={formatTooltipLabel}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number, name: string, item: any) => {
                        const m = metrics.find(met => met.id === item.dataKey);
                        const formatted = m?.isTimeBased ? formatDuration(value) : value;
                        return [`${formatted} ${m?.unit || ''}`, m?.name || name];
                    }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }}/>

                {selectedMetrics.map((mid, idx) => (
                    <Line 
                        key={mid}
                        dataKey={mid} 
                        name={metrics.find(m => m.id === mid)?.name}
                        type="monotone" 
                        stroke={colors[idx % colors.length]} 
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: colors[idx % colors.length] }}
                        activeDot={{ r: 6 }}
                        connectNulls
                        animationDuration={500}
                    />
                ))}
                
                <Brush 
                    dataKey="timestamp" 
                    height={30} 
                    stroke="#cbd5e1" 
                    fill="#f8fafc" 
                    tickFormatter={(unix) => {
                        const date = new Date(unix);
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        const y = String(date.getFullYear()).slice(-2);
                        return `${m}/${y}`;
                    }}
                />
            </LineChart>
            </ResponsiveContainer>
            )}
            
            {/* Range Label Overlay */}
            {showRange && singleMetric && (
                 <div className="absolute top-4 right-8 bg-green-50 text-green-700 text-[10px] px-2 py-1 rounded border border-green-100 shadow-sm pointer-events-none opacity-80">
                     Target: {singleMetric.isTimeBased ? formatDuration(singleMetric.range[0]) : singleMetric.range[0]} - {singleMetric.isTimeBased ? formatDuration(singleMetric.range[1]) : singleMetric.range[1]} {singleMetric.unit}
                 </div>
            )}
            
            {/* Resize handle visual hint */}
            <div className="absolute bottom-1 right-1 pointer-events-none text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M12 12H0L12 0V12Z" />
                 </svg>
            </div>
        </div>
        <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-slate-400">
                Drag the bottom slider to zoom time. Drag the bottom-right corner to resize.
            </p>
        </div>
      </div>
    </div>
  );
};
