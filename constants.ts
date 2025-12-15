import { MetricConfig } from './types';

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

export const DEFAULT_CATEGORIES = ['daily', 'weekly', 'clinical'];

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
    includeInSpider: true
  },
  {
    id: "rhr",
    name: "Resting HR",
    range: [50, 70],
    unit: "bpm",
    fact: "RHR 50–70 bpm minimizes mortality risk.",
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

  // WEEKLY METRICS
  {
    id: "rowing",
    name: "Rowing",
    range: [30, 90],
    unit: "min/week",
    fact: "High intensity intervals on the rower drive VO2 max expansion.",
    citation: "System A: The Engine",
    step: 5,
    category: 'weekly',
    active: true,
    includeInSpider: true
  },
  {
    id: "running",
    name: "Running",
    range: [60, 120],
    unit: "min/week",
    fact: "Impact loading is crucial for maintaining bone density.",
    citation: "System C: Hybrid",
    step: 5,
    category: 'weekly',
    active: true,
    includeInSpider: true
  },
  {
    id: "strength",
    name: "Ring Training",
    range: [2, 3],
    unit: "sessions/week",
    fact: "Ring instability creates higher systemic load for neuromuscular control.",
    citation: "System B: Structure",
    step: 1,
    category: 'weekly',
    active: true,
    includeInSpider: true
  },
  {
    id: "social",
    name: "Social Interactions",
    range: [3, 5],
    unit: "per week",
    fact: "3–5 meaningful social interactions/week cut mortality risk by ~50%.",
    citation: "Holt-Lunstad, 2010",
    step: 1,
    category: 'weekly',
    active: true,
    includeInSpider: true
  },

  // CLINICAL / PERIODIC METRICS
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
  // Calculated Metrics (Not in inputs)
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
    isCalculated: true
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
  }
];
