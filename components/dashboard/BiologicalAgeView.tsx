
import React, { useState, useMemo } from 'react';
import { MetricValues, BioAgeResult, MetricConfig } from '../../types';
import * as calculators from '../../services/riskCalculators';
import { RadarView } from './RadarView'; 
import { Activity, Dna, Info, AlertCircle, ChevronRight, ChevronDown, ChevronUp, AlertTriangle, Radar } from 'lucide-react';

interface BiologicalAgeViewProps {
  values: MetricValues;
  metrics: MetricConfig[]; // Added to look up user-defined names
  onNavigateToEntry: () => void;
}

// Mapping from Calculator Factor Names (riskCalculators.ts) to Default Metric IDs (constants.ts)
const FACTOR_ID_MAP: Record<string, string> = {
    "Albumin": "Albumin",
    "Creatinine": "Kreatinin",
    "Glucose": "glucose",
    "CRP": "CRP",
    "CRP (ln)": "CRP",
    "Lymphocytes": "Lymphozyten",
    "MCV": "MCV",
    "RDW": "RDW",
    "Alk. Phos.": "Alkalische Phosphatase (AP)",
    "Alk Phos": "Alkalische Phosphatase (AP)",
    "WBC": "Leukozyten",
    "Total Chol": "total_cholesterol",
    "SBP": "bp_systolic",
    "BMI": "bmi"
};

export const BiologicalAgeView: React.FC<BiologicalAgeViewProps> = ({ values, metrics, onNavigateToEntry }) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'kdm' | 'pheno'>('radar');
  const [isExpanded, setIsExpanded] = useState(false);

  // --- Calculate Ages ---
  const ageData: BioAgeResult | null = useMemo(() => {
      if (activeTab === 'pheno') {
          return calculators.calculatePhenoAge({
              age: values['age']!,
              albumin: values['Albumin'],
              creatinine: values['Kreatinin'],
              glucose: values['glucose'],
              crp: values['CRP'],
              lymphocyte_pct: values['lymphocyte_pct'],
              lymphocyte_abs: values['Lymphozyten'],
              mcv: values['MCV'],
              rdw: values['RDW'],
              alp: values['Alkalische Phosphatase (AP)'],
              wbc: values['Leukozyten'],
              total_protein: values['Total Protein']
          });
      } else if (activeTab === 'kdm') {
          return calculators.calculateKDMBioAge({
              age: values['age']!,
              sex: values['sex'] || 1,
              albumin: values['Albumin'],
              creatinine: values['Kreatinin'],
              total_cholesterol: values['total_cholesterol'],
              glucose: values['glucose'],
              crp: values['CRP'],
              alp: values['Alkalische Phosphatase (AP)'],
              sbp: values['bp_systolic'],
              bmi: values['bmi'],
              total_protein: values['Total Protein']
          });
      }
      return null;
  }, [values, activeTab]);

  // --- Helper: Get User-Defined Name ---
  const getDisplayName = (factorName: string) => {
      const id = FACTOR_ID_MAP[factorName];
      if (id) {
          const config = metrics.find(m => m.id === id);
          if (config) return config.name;
      }
      return factorName;
  };

  const isMissing = ageData?.missingMetrics && ageData.missingMetrics.length > 0;

  const getDiffColor = (diff: number) => {
      if (diff <= -3) return 'text-green-600';
      if (diff < 0) return 'text-green-500';
      if (diff === 0) return 'text-slate-600';
      if (diff < 3) return 'text-orange-500';
      return 'text-red-500';
  };
  
  const getBarColor = (diff: number) => {
       if (diff <= -3) return 'bg-green-500';
       if (diff < 0) return 'bg-green-400';
       if (diff === 0) return 'bg-slate-400';
       if (diff < 3) return 'bg-orange-400';
       return 'bg-red-500';
  };

  const visibleFactors = isExpanded ? ageData?.factors : ageData?.factors.slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header Tabs - Fixed Height, No Shrink */}
        <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0 bg-white z-10">
            <button 
                onClick={() => { setActiveTab('radar'); setIsExpanded(false); }}
                className={`flex-1 py-3 px-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'radar' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Radar className="w-4 h-4" /> Holistic
            </button>
            <button 
                onClick={() => { setActiveTab('kdm'); setIsExpanded(false); }}
                className={`flex-1 py-3 px-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'kdm' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Activity className="w-4 h-4" /> KDM Age
            </button>
            <button 
                onClick={() => { setActiveTab('pheno'); setIsExpanded(false); }}
                className={`flex-1 py-3 px-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'pheno' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Dna className="w-4 h-4" /> PhenoAge
            </button>
        </div>

        {/* Content Area - No Scrollbar, expands naturally */}
        <div className="p-6">
            
            {/* --- TAB CONTENT: RADAR --- */}
            {activeTab === 'radar' && (
                <div className="flex flex-col h-[400px]">
                    <p className="text-xs text-slate-500 mb-4 text-center shrink-0">
                        Visualizes the balance of your active metrics normalized to their target ranges. 100% means perfect optimization.
                    </p>
                    <div className="flex-1">
                        <RadarView metrics={metrics} values={values} />
                    </div>
                </div>
            )}

            {/* --- TAB CONTENT: BIO AGE (KDM / PHENO) --- */}
            {(activeTab === 'kdm' || activeTab === 'pheno') && (
                <div className="flex flex-col">
                    {/* Check for Chronological Age */}
                    {!values['age'] ? (
                        <div className="h-[300px] flex flex-col items-center justify-center text-center p-4">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Age Required</h3>
                            <p className="text-slate-500 mb-4">Please log your chronological age to enable these algorithms.</p>
                            <button onClick={onNavigateToEntry} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Go to Log</button>
                        </div>
                    ) : (
                        <>
                            {/* Description */}
                            <div className="mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 shrink-0">
                                <div className="flex gap-2 items-start">
                                    <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                    <p>
                                        {activeTab === 'kdm' 
                                        ? "KDM calculates biological age by comparing markers to a healthy reference population. 'Impact' is the weighted contribution to your Age Gap." 
                                        : "PhenoAge calculates mortality risk based on blood markers and converts it into an equivalent biological age."}
                                    </p>
                                </div>
                            </div>

                            {/* Main Result Display */}
                            {!isMissing && ageData ? (
                                <div className="flex flex-col items-center animation-fade-in pb-4">
                                    <div className="relative mb-6 shrink-0">
                                        <div className="w-48 h-24 overflow-hidden relative">
                                            <div className="w-48 h-48 rounded-full border-[12px] border-slate-100 border-t-slate-200 absolute top-0 left-0"></div>
                                        </div>
                                        <div className="absolute top-8 left-0 right-0 text-center">
                                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wide">Biological Age</span>
                                            <div className={`text-5xl font-bold tracking-tight mt-1 ${getDiffColor(ageData.ageDiff)}`}>
                                                {ageData.biologicalAge}
                                            </div>
                                            <div className="text-sm font-medium text-slate-500 mt-1">
                                                Chronological: {ageData.chronologicalAge}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`px-4 py-2 rounded-full font-bold text-sm mb-6 ${getBarColor(ageData.ageDiff)} text-white shrink-0`}>
                                        {ageData.ageDiff > 0 ? `+${ageData.ageDiff} Years (Accelerated)` : `${ageData.ageDiff} Years (Youthful)`}
                                    </div>

                                    {/* Confidence & Warnings */}
                                    {ageData.warnings && ageData.warnings.length > 0 && (
                                        <div className="w-full mb-6 text-center shrink-0">
                                            <div className="inline-block bg-orange-50 border border-orange-100 rounded-lg p-3 text-left max-w-sm">
                                                <h5 className="flex items-center gap-1.5 text-xs font-bold text-orange-700 mb-1">
                                                    <AlertTriangle className="w-3.5 h-3.5" /> Algorithm Warnings
                                                </h5>
                                                <ul className="list-disc list-inside text-[10px] text-orange-800 space-y-0.5">
                                                    {ageData.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* Top Contributors */}
                                    <div className="w-full shrink-0">
                                        <div className="flex justify-between items-end mb-3">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Drivers</h4>
                                            <span className="text-[10px] text-slate-400 italic">Impact on Age Gap</span>
                                        </div>
                                        <div className="space-y-3">
                                            {visibleFactors?.map((factor, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${factor.impact < 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                        <div className="flex flex-col">
                                                            {/* Use getDisplayName to show user-configured name */}
                                                            <span className="text-slate-700 font-medium leading-none">{getDisplayName(factor.name)}</span>
                                                            <span className="text-slate-400 text-[10px] mt-0.5">{factor.value}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`font-mono font-medium ${factor.impact < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {factor.impact > 0 ? '+' : ''}{Math.abs(factor.impact).toFixed(2)} y
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Expand/Collapse Button */}
                                        {ageData.factors.length > 5 && (
                                            <div className="mt-4 pt-2 text-center border-t border-slate-100">
                                                <button 
                                                    onClick={() => setIsExpanded(!isExpanded)}
                                                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center gap-1 mx-auto"
                                                >
                                                    {isExpanded ? (
                                                        <>Show Less <ChevronUp className="w-3 h-3" /></>
                                                    ) : (
                                                        <>Show All {ageData.factors.length} Factors <ChevronDown className="w-3 h-3" /></>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="bg-orange-50 border border-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 text-orange-500">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 mb-2">Missing Data</h3>
                                    <p className="text-sm text-slate-500 mb-6 px-4">
                                        To calculate your {activeTab === 'kdm' ? 'KDM Biological Age' : 'PhenoAge'}, we need more data points:
                                    </p>
                                    
                                    <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 text-left mb-6 mx-auto max-w-sm">
                                        {ageData?.missingMetrics.map(m => (
                                            <div key={m} className="px-4 py-2 text-sm text-slate-600 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {getDisplayName(m)}
                                            </div>
                                        ))}
                                    </div>

                                    <button onClick={onNavigateToEntry} className="text-indigo-600 font-medium text-sm flex items-center justify-center gap-1 hover:underline">
                                        Log Metrics Now <ChevronRight className="w-4 h-4"/>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
