
import { MetricConfig, AppSettings } from './types';

export const DEFAULT_REGIMEN = `## Systems Engineering Approach

Treating the body as a biological system. Optimization of output (performance/longevity) while minimizing temporal input (Minimum Effective Dose).

### Weekly Schedule

*   **Monday**: Exercise Snacking + Active Recovery (Low)
*   **Tuesday**: Session A: Concept2 Intervals (High)
*   **Wednesday**: Session B: Ring Strength & Structure (Med)
*   **Thursday**: Exercise Snacking + 15 min Yoga (Low)
*   **Friday**: Session C: Run / Fartlek (20-30m) (Med)
*   **Weekend**: Family Active Recovery (Zone 2) (Rec)

### Exercise Snacking (3-5x Daily)

1.  **The Hang**: 30-60s on Rings. Decompresses spine, builds grip.
2.  **Goblet Squat**: 10 slow reps @ 7.5kg. Hip mobility.
3.  **Ring Support Hold**: 10-20s top of dip. Core stabilization.

### System Notes

*   **Cardiorespiratory**: Addressed via VO2max intervals (Concept2).
*   **Sarcopenia**: Addressed via Ring Training. Unstable loads force higher recruitment.
*   **Fueling**: High Leucine source immediately after sessions A & B to trigger mTOR.`;

export const DEFAULT_CATEGORIES = ['daily', 'inputs', 'weekly', 'clinical'];

export const DEFAULT_SETTINGS: AppSettings = {
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h'
};

export const DEFAULT_METRICS: MetricConfig[] = [
  // DAILY METRICS
  {
    id: "sleep",
    name: "Sleep",
    range: [7, 8],
    unit: "hours",
    fact: "7–8 hours of sleep/night minimizes mortality risk.",
    citation: "Gallicchio, 2009",
    step: 0.5,
    category: 'daily',
    active: true,
    includeInSpider: true,
    isTimeBased: true
  },
  {
    id: "rhr",
    name: "Resting HR",
    range: [45, 60],
    unit: "bpm",
    fact: "Lower RHR (within limits) correlates with higher longevity.",
    citation: "Jensen, 2013",
    step: 1,
    category: 'daily',
    active: true,
    includeInSpider: true
  },
  {
    id: "snacks",
    name: "Exercise Snacks",
    range: [3, 5],
    unit: "snacks/day",
    fact: "Frequent movement breaks improve metabolic flexibility.",
    citation: "Biological Systems Eng",
    step: 1,
    category: 'daily',
    active: true,
    includeInSpider: false
  },
  {
    id: "protein",
    name: "Protein Intake",
    range: [120, 180],
    unit: "g/day",
    fact: "Adequate leucine is the bottleneck for muscle repair in your 30s.",
    citation: "Nutritional Systems",
    step: 5,
    category: 'daily',
    active: true,
    includeInSpider: true
  },
  {
    id: "coffee",
    name: "Coffee",
    range: [100, 400],
    unit: "mg caff",
    fact: "100–400 mg caffeine/day reduces mortality by 10–15%.",
    citation: "Freedman, 2012",
    step: 10,
    category: 'daily',
    active: true,
    includeInSpider: false
  },
  {
    id: "alcohol",
    name: "Alcohol",
    range: [0, 3],
    unit: "drinks/week",
    fact: "0–7 drinks/week minimizes risk, with 0–3 being ideal.",
    citation: "Wood, 2018",
    step: 1,
    category: 'daily',
    active: true,
    includeInSpider: false
  },

  // INPUTS (Logs that feed into calculated metrics)
  {
    id: "rowing",
    name: "Rowing Session",
    range: [0, 60],
    unit: "min",
    fact: "Log duration of rowing session.",
    citation: "Input",
    step: 1,
    category: 'inputs',
    active: true,
    includeInSpider: false,
    isTimeBased: true
  },
  {
    id: "running",
    name: "Running Session",
    range: [0, 120],
    unit: "min",
    fact: "Log duration of running session.",
    citation: "Input",
    step: 1,
    category: 'inputs',
    active: true,
    includeInSpider: false,
    isTimeBased: true
  },
  {
    id: "strength",
    name: "Ring Training",
    range: [0, 1],
    unit: "session",
    fact: "Log 1 for session completed.",
    citation: "Input",
    step: 1,
    category: 'inputs',
    active: true,
    includeInSpider: false
  },
  {
    id: "social",
    name: "Social Interaction",
    range: [0, 5],
    unit: "count",
    fact: "Log count of meaningful interactions.",
    citation: "Input",
    step: 1,
    category: 'inputs',
    active: true,
    includeInSpider: false
  },

  // WEEKLY METRICS (Calculated Counters)
  {
    id: "rowing_weekly",
    name: "Rowing Volume",
    range: [30, 90],
    unit: "min/week",
    fact: "High intensity intervals on the rower drive VO2 max expansion.",
    citation: "System A: The Engine",
    step: 5,
    category: 'weekly',
    active: true,
    includeInSpider: true,
    isCalculated: true,
    formula: "lib.sum('rowing', 'week')"
  },
  {
    id: "running_weekly",
    name: "Running Volume",
    range: [60, 120],
    unit: "min/week",
    fact: "Impact loading is crucial for maintaining bone density.",
    citation: "System C: Hybrid",
    step: 5,
    category: 'weekly',
    active: true,
    includeInSpider: true,
    isCalculated: true,
    formula: "lib.sum('running', 'week')"
  },
  {
    id: "strength_weekly",
    name: "Strength Frequency",
    range: [2, 3],
    unit: "sessions/week",
    fact: "Ring instability creates higher systemic load for neuromuscular control.",
    citation: "System B: Structure",
    step: 1,
    category: 'weekly',
    active: true,
    includeInSpider: true,
    isCalculated: true,
    formula: "lib.sum('strength', 'week')"
  },
  {
    id: "social_weekly",
    name: "Social Frequency",
    range: [3, 5],
    unit: "per week",
    fact: "3–5 meaningful social interactions/week cut mortality risk by ~50%.",
    citation: "Holt-Lunstad, 2010",
    step: 1,
    category: 'weekly',
    active: true,
    includeInSpider: true,
    isCalculated: true,
    formula: "lib.sum('social', 'week')"
  },

  // CLINICAL / PERIODIC METRICS
  {
    id: "age",
    name: "Age",
    range: [20, 100],
    unit: "years",
    fact: "Primary factor in all risk models.",
    citation: "General",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: false
  },
  {
    id: "sex",
    name: "Biological Sex",
    range: [0, 1], // 0=Female, 1=Male
    unit: "",
    fact: "0 = Female, 1 = Male. Affects risk algorithm coefficients.",
    citation: "Genetics",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: false
  },
  {
    id: "weight",
    name: "Weight",
    range: [50, 100],
    unit: "kg",
    fact: "Maintenance of healthy body composition.",
    citation: "General",
    step: 0.1,
    category: 'clinical',
    active: true,
    includeInSpider: false
  },
  {
    id: "height",
    name: "Height",
    range: [150, 200],
    unit: "cm",
    fact: "Used for BMI calculation.",
    citation: "General",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: false
  },
  {
    id: "waist",
    name: "Waist Circ.",
    range: [70, 94],
    unit: "cm",
    fact: "Waist circumference is a key marker of visceral fat.",
    citation: "IDF Consensus",
    step: 0.5,
    category: 'clinical',
    active: true,
    includeInSpider: false
  },
  {
    id: "bp_systolic",
    name: "Systolic BP",
    range: [90, 120],
    unit: "mmHg",
    fact: "Blood pressure <120/80 mmHg cuts cardiovascular mortality by 25%.",
    citation: "SPRINT, 2015",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: true
  },
  {
    id: "triglycerides",
    name: "Triglycerides",
    range: [40, 150],
    unit: "mg/dL",
    fact: "Low triglycerides (<150 mg/dL) indicate good metabolic health.",
    citation: "AHA Guidelines",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: false
  },
  {
    id: "ldl",
    name: "LDL Cholesterol",
    range: [0, 100],
    unit: "mg/dL",
    fact: "LDL <100 mg/dL reduces cardiovascular risk by 20–30%.",
    citation: "Silverman, 2017",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: true
  },
  {
    id: "hdl",
    name: "HDL Cholesterol",
    range: [40, 100],
    unit: "mg/dL",
    fact: "HDL >40 mg/dL supports heart health.",
    citation: "Silverman, 2017",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: true
  },
  {
    id: "glucose",
    name: "Fasting Glucose",
    range: [70, 100],
    unit: "mg/dL",
    fact: "Glucose <100 mg/dL lowers diabetes and heart risk by 15–20%.",
    citation: "Selvin, 2010",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: true
  },
  {
    id: "egfr",
    name: "eGFR",
    range: [90, 120],
    unit: "mL/min",
    fact: "Kidney function (eGFR) predicts CVD and mortality independently.",
    citation: "Matsushita, 2010",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: true
  },
  {
    id: "smoking",
    name: "Current Smoker",
    range: [0, 1],
    unit: "",
    fact: "0 = No, 1 = Yes. Smoking doubles 10-year CVD risk.",
    citation: "Surgeon General",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: false
  },
  {
    id: "diabetes",
    name: "Diabetes",
    range: [0, 1],
    unit: "",
    fact: "0 = No, 1 = Yes. Diabetes is a risk equivalent to prior CVD.",
    citation: "ADA",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: false
  },
  {
    id: "bp_meds",
    name: "BP Meds",
    range: [0, 1],
    unit: "",
    fact: "0 = No, 1 = Yes. Being treated for BP increases risk calc weighting.",
    citation: "PCE",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: false
  },
  {
    id: "statin",
    name: "On Statin",
    range: [0, 1],
    unit: "",
    fact: "0 = No, 1 = Yes. Used in PREVENT algorithm.",
    citation: "AHA",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: false
  },

  // Calculated Metrics
  {
    id: "bmi",
    name: "BMI",
    range: [18.5, 24.9],
    unit: "",
    fact: "Keeping BMI 18.5–24.9 lowers mortality risk by up to 30%.",
    citation: "Di Angelantonio, 2016",
    step: 0.1,
    category: 'clinical',
    active: true,
    includeInSpider: true,
    isCalculated: true,
    formula: "weight / ((height/100) * (height/100))"
  },
  {
    id: "whtr",
    name: "Waist/Height Ratio",
    range: [0.4, 0.5],
    unit: "",
    fact: "WHtR < 0.5 prevents central obesity and metabolic syndrome.",
    citation: "Ashwell, 2012",
    step: 0.01,
    category: 'clinical',
    active: true,
    includeInSpider: true,
    isCalculated: true,
    formula: "waist / height"
  },
  {
    id: "tyg",
    name: "TyG Index",
    range: [7.0, 8.5],
    unit: "",
    fact: "TyG < 8.5 indicates high insulin sensitivity. Superior to HOMA-IR.",
    citation: "Guerrero-Romero, 2010",
    step: 0.01,
    category: 'clinical',
    active: true,
    includeInSpider: true,
    isCalculated: true,
    formula: "Math.log((triglycerides * glucose) / 2)"
  },
  {
    id: "total_cholesterol",
    name: "Total Cholesterol",
    range: [150, 200],
    unit: "mg/dL",
    fact: "Calculated: LDL + HDL + (Trigs/5).",
    citation: "Friedewald",
    step: 1,
    category: 'clinical',
    active: true,
    includeInSpider: false,
    isCalculated: true,
    formula: "ldl + hdl + (triglycerides / 5)"
  },
  {
    id: "cvd_risk_score",
    name: "10y CVD Risk (PCE)",
    range: [0, 5],
    unit: "%",
    fact: "Est. 10-year risk of heart attack or stroke. <5% is optimal. (Using 2013 PCE model)",
    citation: "ACC/AHA",
    step: 0.1,
    category: 'clinical',
    active: true,
    includeInSpider: true,
    isCalculated: true,
    formula: "lib.calculateCVDRisk(vals)"
  }
];
