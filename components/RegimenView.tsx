import React from 'react';
import { Dumbbell, Wind, Timer, Utensils, Zap, Calendar } from 'lucide-react';

export const RegimenView: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Systems Engineering Approach</h2>
        <p className="text-slate-300 leading-relaxed max-w-3xl">
          Treating the body as a biological system. Optimization of output (performance/longevity) 
          while minimizing temporal input (Minimum Effective Dose).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* The Protocol */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Weekly Schedule
          </h3>
          <div className="space-y-4">
            {[
              { day: "Monday", activity: "Exercise Snacking + Active Recovery", type: "Low" },
              { day: "Tuesday", activity: "Session A: Concept2 Intervals", type: "High" },
              { day: "Wednesday", activity: "Session B: Ring Strength & Structure", type: "Med" },
              { day: "Thursday", activity: "Exercise Snacking + 15 min Yoga", type: "Low" },
              { day: "Friday", activity: "Session C: Run / Fartlek (20-30m)", type: "Med" },
              { day: "Weekend", activity: "Family Active Recovery (Zone 2)", type: "Rec" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                <span className="font-medium text-slate-700 w-24">{item.day}</span>
                <span className="text-sm text-slate-600 flex-1">{item.activity}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium
                  ${item.type === 'High' ? 'bg-red-100 text-red-700' : 
                    item.type === 'Med' ? 'bg-indigo-100 text-indigo-700' : 
                    'bg-green-100 text-green-700'}`}>
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* The Snacks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Exercise Snacking
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Perform 3-5 times daily. "Grease the Groove"—frequent, non-fatiguing activation.
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><Dumbbell className="w-4 h-4" /></div>
              <div>
                <h4 className="font-semibold text-slate-700">The Hang</h4>
                <p className="text-xs text-slate-500">30-60s on Rings. Decompresses spine, builds grip.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><Timer className="w-4 h-4" /></div>
              <div>
                <h4 className="font-semibold text-slate-700">Goblet Squat</h4>
                <p className="text-xs text-slate-500">10 slow reps @ 7.5kg. Hip mobility.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><Wind className="w-4 h-4" /></div>
              <div>
                <h4 className="font-semibold text-slate-700">Ring Support Hold</h4>
                <p className="text-xs text-slate-500">10-20s top of dip. Core stabilization.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Systems Engineering Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
           <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
             <Wind className="w-4 h-4 text-blue-500"/> Cardiorespiratory
           </h4>
           <p className="text-xs text-slate-600">
             Addressed via VO2max intervals (Concept2). The "Ceiling" of your longevity.
           </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
           <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
             <Dumbbell className="w-4 h-4 text-purple-500"/> Sarcopenia
           </h4>
           <p className="text-xs text-slate-600">
             Addressed via Ring Training. Unstable loads force higher recruitment than machines.
           </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
           <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
             <Utensils className="w-4 h-4 text-green-500"/> Fueling
           </h4>
           <p className="text-xs text-slate-600">
             Vegetarian optimization: High Leucine source immediately after sessions A & B to trigger mTOR.
           </p>
        </div>
      </div>
    </div>
  );
};