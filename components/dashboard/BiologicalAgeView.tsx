
import React, { useState, useMemo } from 'react';
import { MetricValues, BioAgeResult, MetricConfig } from '../../types';
import * as calculators from '../../services/riskCalculators';
import { RadarView } from './RadarView'; 
import { Activity, Dna, Info, AlertCircle, ChevronRight, ChevronDown, ChevronUp, AlertTriangle, Radar } from 'lucide-react';

interface BiologicalAgeViewProps {
  values: MetricValues;
  metrics: MetricConfig[]; 
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

  // --- Calculate Ages (Always calculate both for printing) ---
  const phenoData = useMemo(() => calculators.calculatePhenoAge({
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
  }), [values]);

  const kdmData = useMemo(() => calculators.calculateKDMBioAge({
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
  }), [values]);

  // --- Helper: Get User-Defined Name ---
  const getDisplayName = (factorName: string) => {
      const id = FACTOR_ID_MAP[factorName];
      if (id) {
          const config = metrics.find(m => m.id === id);
          if (config) return config.name;
      }
      return factorName;
  };

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

  // --- Render Component for Age Details ---
  const renderAgeDetails = (ageData: BioAgeResult | null, title: string) => {
      if (!values['age']) return null; // Handled in main view logic usually

      const isMissing = ageData?.missingMetrics && ageData.missingMetrics.length > 0;
      const visibleFactors = isExpanded ? ageData?.factors : ageData?.factors.slice(0, 5);

      return (
        <div className="flex flex-col pt-4">
             {/* Print Title */}
             <h3 className="hidden print:block text-lg font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1">{title} Analysis</h3>

             {!isMissing && ageData ? (
                <div className="flex flex-col items-center animation-fade-in pb-4">
                    <div className="relative mb-6 shrink-0 print:mb-2">
                        {/* Circle Graphic - Hidden on print to save ink/space, just show text */}
                        <div className="w-48 h-24 overflow-hidden relative print:hidden">
                            <div className="w-48 h-48 rounded-full border-[12px] border-slate-100 border-t-slate-200 absolute top-0 left-0"></div>
                        </div>
                        <div className="absolute top-8 left-0 right-0 text-center print:static print:text-left print:flex print:items-baseline print:gap-4">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wide print:hidden">Biological Age</span>
                            <div className={`text-5xl font-bold tracking-tight mt-1 ${getDiffColor(ageData.ageDiff)} print:text-3xl`}>
                                {ageData.biologicalAge} <span className="text-sm text-slate-500 font-normal">years (Bio)</span>
                            </div>
                            <div className="text-sm font-medium text-slate-500 mt-1 print:mt-0">
                                Chronological: {ageData.chronologicalAge}
                            </div>
                        </div>
                    </div>

                    <div className={`px-4 py-2 rounded-full font-bold text-sm mb-6 ${getBarColor(ageData.ageDiff)} text-white shrink-0 print:border print:border-slate-300 print:text-slate-800 print:bg-transparent print:px-0 print:mb-4`}>
                        {ageData.ageDiff > 0 ? `+${ageData.ageDiff} Years (Accelerated)` : `${ageData.ageDiff} Years (Youthful)`}
                    </div>

                    {/* Warnings */}
                    {ageData.warnings && ageData.warnings.length > 0 && (
                        <div className="w-full mb-6 text-center shrink-0 print:text-left">
                            <div className="inline-block bg-orange-50 border border-orange-100 rounded-lg p-3 text-left max-w-sm w-full print:border-slate-200 print:bg-transparent print:p-0">
                                <h5 className="flex items-center gap-1.5 text-xs font-bold text-orange-700 mb-1 print:text-slate-700">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Algorithm Warnings
                                </h5>
                                <ul className="list-disc list-inside text-[10px] text-orange-800 space-y-0.5 print:text-slate-600">
                                    {ageData.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Factors */}
                    <div className="w-full shrink-0">
                        <div className="flex justify-between items-end mb-3 border-b border-slate-100 pb-1">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Drivers</h4>
                            <span className="text-[10px] text-slate-400 italic">Impact</span>
                        </div>
                        <div className="space-y-2 print:grid print:grid-cols-2 print:gap-x-8 print:gap-y-1 print:space-y-0">
                            {(visibleFactors || []).map((factor, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${factor.impact < 0 ? 'bg-green-500' : 'bg-red-500'} print:hidden`}></div>
                                        <div className="flex flex-col">
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
                    </div>
                </div>
             ) : (
                <div className="text-center py-8">
                     <p className="text-sm text-slate-500">Missing required biomarkers for {title}.</p>
                     <div className="text-xs text-slate-400 mt-2">
                        Missing: {ageData?.missingMetrics.map(m => getDisplayName(m)).join(', ')}
                     </div>
                </div>
             )}
        </div>
      );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none">
        {/* Header Tabs - Hidden on Print */}
        <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0 bg-white z-10 print:hidden">
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

        {/* Content Area */}
        <div className="p-6 print:p-0">
            
            {/* RADAR: Visible if Active OR Print */}
            <div className={`${activeTab === 'radar' ? 'block' : 'hidden'} print:block print:mb-8 print:break-inside-avoid`}>
                <div className="flex flex-col h-[400px] print:h-[300px]">
                    <h3 className="hidden print:block text-lg font-bold text-slate-800 mb-2">Holistic Balance</h3>
                    <p className="text-xs text-slate-500 mb-4 text-center shrink-0 print:text-left">
                        Visualization of active metrics normalized to their target ranges.
                    </p>
                    <div className="flex-1">
                        <RadarView metrics={metrics} values={values} />
                    </div>
                </div>
            </div>

            {/* KDM: Visible if Active OR Print */}
            <div className={`${activeTab === 'kdm' ? 'block' : 'hidden'} print:block print:mb-8 print:break-inside-avoid`}>
                 {renderAgeDetails(kdmData, 'KDM Biological Age')}
            </div>

            {/* PHENO: Visible if Active OR Print */}
            <div className={`${activeTab === 'pheno' ? 'block' : 'hidden'} print:block print:mb-8 print:break-inside-avoid`}>
                 {renderAgeDetails(phenoData, 'PhenoAge (Levine)')}
            </div>

             {/* Common Empty State (Only show if not printing and no age logged) */}
            {!values['age'] && (
                 <div className="h-[300px] flex flex-col items-center justify-center text-center p-4 print:hidden">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Age Required</h3>
                    <p className="text-slate-500 mb-4">Please log your chronological age to enable these algorithms.</p>
                    <button onClick={onNavigateToEntry} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Go to Log</button>
                </div>
            )}

            {/* Expand Toggle (Hidden on Print) */}
            {(activeTab === 'kdm' || activeTab === 'pheno') && (
                 <div className="mt-4 pt-2 text-center border-t border-slate-100 print:hidden">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center gap-1 mx-auto"
                    >
                        {isExpanded ? (
                            <>Show Less <ChevronUp className="w-3 h-3" /></>
                        ) : (
                            <>Show All Factors <ChevronDown className="w-3 h-3" /></>
                        )}
                    </button>
                </div>
            )}

        </div>
    </div>
  );
};
