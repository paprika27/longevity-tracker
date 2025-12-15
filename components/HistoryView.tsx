import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush, ReferenceArea } from 'recharts';
import { LogEntry, MetricConfig } from '../types';
import { XCircle } from 'lucide-react';

interface HistoryViewProps {
  entries: LogEntry[];
  metrics: MetricConfig[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ entries, metrics }) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['bmi']); 
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
      // Extract unique categories from active metrics
      const uniqueCats = Array.from(new Set(metrics.map(m => m.category)));
      setCategories(uniqueCats);
      // Validating selection to ensure we don't have dead metrics selected
      const validSelection = selectedMetrics.filter(id => metrics.find(m => m.id === id));
      if (validSelection.length !== selectedMetrics.length) {
         if (metrics.length > 0) {
             const bmi = metrics.find(m => m.id === 'bmi');
             setSelectedMetrics(bmi ? ['bmi'] : [metrics[0].id]);
         } else if (validSelection.length === 0) {
             setSelectedMetrics([]);
         } else {
             setSelectedMetrics(validSelection);
         }
      }
  }, [metrics, selectedMetrics]);

  // Sort entries by timestamp to ensure graph flows correctly
  const sortedEntries = useMemo(() => {
      return [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [entries]);

  // Prepare data with proper timestamps for XAxis type="number"
  const data = useMemo(() => {
    return sortedEntries.map(entry => {
        const point: any = {
            dateStr: new Date(entry.timestamp).toLocaleDateString(),
            timestamp: new Date(entry.timestamp).getTime()
        };
        metrics.forEach(m => {
            point[m.id] = entry.values[m.id];
        });
        return point;
    });
  }, [sortedEntries, metrics]);

  const toggleMetric = (id: string) => {
    if (selectedMetrics.includes(id)) {
        setSelectedMetrics(selectedMetrics.filter(m => m !== id));
    } else {
        setSelectedMetrics([...selectedMetrics, id]);
    }
  };

  const selectCategory = (cat: string) => {
      const ids = metrics.filter(m => m.category === cat).map(m => m.id);
      if (ids.length > 0) setSelectedMetrics(ids);
  };

  const clearSelection = () => {
      setSelectedMetrics([]);
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
            ) : (
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                    fontSize={12} 
                    tickFormatter={(unix) => new Date(unix).toLocaleDateString()}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={50}
                />
                <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                    width={60}
                    tickFormatter={(val) => commonUnit ? `${val} ${commonUnit}` : `${val}`}
                />
                <Tooltip 
                    labelFormatter={(unix) => new Date(unix).toLocaleDateString() + ' ' + new Date(unix).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number, name: string, item: any) => {
                        const m = metrics.find(met => met.id === item.dataKey);
                        return [`${value} ${m?.unit || ''}`, m?.name || name];
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
                    tickFormatter={(unix) => new Date(unix).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                />
            </LineChart>
            </ResponsiveContainer>
            )}
            
            {/* Range Label Overlay (for better visibility than ReferenceArea label which can be clipped) */}
            {showRange && singleMetric && (
                 <div className="absolute top-4 right-12 bg-green-50 text-green-700 text-[10px] px-2 py-1 rounded border border-green-100 shadow-sm pointer-events-none opacity-80">
                     Target: {singleMetric.range[0]} - {singleMetric.range[1]} {singleMetric.unit}
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
                Drag the bottom slider to zoom time. Drag the bottom-right corner of the chart area to resize height.
            </p>
        </div>
      </div>
    </div>
  );
};