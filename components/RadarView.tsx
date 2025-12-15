import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { MetricConfig, MetricValues } from '../types';

interface RadarViewProps {
  metrics: MetricConfig[];
  values: MetricValues;
}

export const RadarView: React.FC<RadarViewProps> = ({ metrics, values }) => {
  const data = metrics.map(m => {
    const val = values[m.id];
    let score = 0; // 0 to 100 where 100 is perfect
    
    if (val !== null && val !== undefined) {
        // Simple normalization logic
        const [min, max] = m.range;
        const mid = (min + max) / 2;
        
        if (val >= min && val <= max) {
            // Inside range: 80-100 score
            // Closer to mid is better
            const distFromMid = Math.abs(val - mid);
            const maxDist = (max - min) / 2;
            const purity = 1 - (distFromMid / maxDist); // 1 is perfect center, 0 is at edge
            score = 80 + (purity * 20);
        } else {
            // Outside range
            // Determine distance from nearest edge relative to range size
            const dist = val < min ? min - val : val - max;
            const rangeSize = max - min || 1; // prevent divide by zero
            // Allow up to 1x range size deviation before hitting 0
            const penalty = Math.min((dist / rangeSize) * 80, 80); 
            score = 80 - penalty;
        }
    }

    return {
      subject: m.name,
      score: Math.round(score),
      fullMark: 100,
    };
  });

  return (
    <div className="w-full h-[400px] bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h3 className="text-lg font-semibold text-slate-700 text-center mb-4">Holistic Balance</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#0ea5e9"
            strokeWidth={2}
            fill="#0ea5e9"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};