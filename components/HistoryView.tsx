import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LogEntry, MetricConfig } from '../types';

interface HistoryViewProps {
  entries: LogEntry[];
  metrics: MetricConfig[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ entries, metrics }) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['bmi']); // Default to BMI

  // Prepare data
  const data = entries.map(entry => {
    const point: any = {
      date: new Date(entry.timestamp).toLocaleDateString(),
      timestamp: new Date(entry.timestamp).getTime()
    };
    metrics.forEach(m => {
        point[m.id] = entry.values[m.id];
    });
    return point;
  });

  const toggleMetric = (id: string) => {
    if (selectedMetrics.includes(id)) {
        // Prevent deselecting last one
        if (selectedMetrics.length > 1) {
            setSelectedMetrics(selectedMetrics.filter(m => m !== id));
        }
    } else {
        if (selectedMetrics.length < 3) { // Limit to 3 for readability
            setSelectedMetrics([...selectedMetrics, id]);
        }
    }
  };

  const colors = ['#0ea5e9', '#8b5cf6', '#f59e0b'];

  if (entries.length < 2) {
      return (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl">
              Add at least two entries to see history trends.
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Metric Trends</h3>
        
        {/* Metric Selector Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
            {metrics.map(m => (
                <button
                    key={m.id}
                    onClick={() => toggleMetric(m.id)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        selectedMetrics.includes(m.id)
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                >
                    {m.name}
                </button>
            ))}
        </div>

        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                {selectedMetrics.map((mid, idx) => (
                    <Line 
                        key={mid}
                        type="monotone" 
                        dataKey={mid} 
                        name={metrics.find(m => m.id === mid)?.name}
                        stroke={colors[idx % colors.length]} 
                        strokeWidth={3}
                        dot={{ r: 4, fill: colors[idx % colors.length] }}
                        activeDot={{ r: 6 }}
                    />
                ))}
            </LineChart>
            </ResponsiveContainer>
        </div>
        <p className="text-xs text-center text-slate-400 mt-4">Select up to 3 metrics to compare over time.</p>
      </div>
    </div>
  );
};