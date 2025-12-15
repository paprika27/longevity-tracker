import { MetricConfig } from './types';

export const METRICS: MetricConfig[] = [
  // DAILY METRICS
  {
    id: "sleep",
    name: "Sleep",
    range: [7, 8],
    unit: "hours",
    fact: "7–8 hours of sleep/night minimizes mortality risk.",
    citation: "Gallicchio, 2009",
    step: 0.5,
    category: 'daily'
  },
  {
    id: "rhr",
    name: "Resting HR",
    range: [50, 70],
    unit: "bpm",
    fact: "RHR 50–70 bpm minimizes mortality risk.",
    citation: "Jensen, 2013",
    step: 1,
    category: 'daily'
  },
  {
    id: "snacks",
    name: "Exercise Snacks",
    range: [3, 5],
    unit: "snacks/day",
    fact: "Frequent movement breaks improve metabolic flexibility.",
    citation: "Biological Systems Eng",
    step: 1,
    category: 'daily'
  },
  {
    id: "protein",
    name: "Protein Intake",
    range: [120, 180],
    unit: "g/day",
    fact: "Adequate leucine is the bottleneck for muscle repair in your 30s.",
    citation: "Nutritional Systems",
    step: 5,
    category: 'daily'
  },
  {
    id: "coffee",
    name: "Coffee",
    range: [100, 400],
    unit: "mg caff",
    fact: "100–400 mg caffeine/day reduces mortality by 10–15%.",
    citation: "Freedman, 2012",
    step: 10,
    category: 'daily'
  },
  {
    id: "alcohol",
    name: "Alcohol",
    range: [0, 3],
    unit: "drinks/week",
    fact: "0–7 drinks/week minimizes risk, with 0–3 being ideal.",
    citation: "Wood, 2018",
    step: 1,
    category: 'daily'
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
    category: 'weekly'
  },
  {
    id: "running",
    name: "Running",
    range: [60, 120],
    unit: "min/week",
    fact: "Impact loading is crucial for maintaining bone density.",
    citation: "System C: Hybrid",
    step: 5,
    category: 'weekly'
  },
  {
    id: "strength",
    name: "Ring Training",
    range: [2, 3],
    unit: "sessions/week",
    fact: "Ring instability creates higher systemic load for neuromuscular control.",
    citation: "System B: Structure",
    step: 1,
    category: 'weekly'
  },
  {
    id: "social",
    name: "Social Interactions",
    range: [3, 5],
    unit: "per week",
    fact: "3–5 meaningful social interactions/week cut mortality risk by ~50%.",
    citation: "Holt-Lunstad, 2010",
    step: 1,
    category: 'weekly'
  },

  // CLINICAL / PERIODIC METRICS
  {
    id: "bmi",
    name: "BMI",
    range: [18.5, 24.9],
    unit: "",
    fact: "Keeping BMI 18.5–24.9 lowers mortality risk by up to 30%.",
    citation: "Di Angelantonio, 2016",
    step: 0.1,
    category: 'clinical'
  },
  {
    id: "bp_systolic",
    name: "Systolic BP",
    range: [90, 120],
    unit: "mmHg",
    fact: "Blood pressure <120/80 mmHg cuts cardiovascular mortality by 25%.",
    citation: "SPRINT, 2015",
    step: 1,
    category: 'clinical'
  },
  {
    id: "ldl",
    name: "LDL Cholesterol",
    range: [0, 100],
    unit: "mg/dL",
    fact: "LDL <100 mg/dL reduces cardiovascular risk by 20–30%.",
    citation: "Silverman, 2017",
    step: 1,
    category: 'clinical'
  },
  {
    id: "hdl",
    name: "HDL Cholesterol",
    range: [40, 100],
    unit: "mg/dL",
    fact: "HDL >40 mg/dL supports heart health.",
    citation: "Silverman, 2017",
    step: 1,
    category: 'clinical'
  },
  {
    id: "glucose",
    name: "Fasting Glucose",
    range: [70, 100],
    unit: "mg/dL",
    fact: "Glucose <100 mg/dL lowers diabetes and heart risk by 15–20%.",
    citation: "Selvin, 2010",
    step: 1,
    category: 'clinical'
  }
];