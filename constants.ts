

import { MetricConfig, AppSettings } from './types';

export const DEFAULT_REGIMEN = `## 🔬 The Integrated Longevity Operating System (LOS)

### I. Enhanced Weekly Schedule (Programming the Software)

| Day | Activity Focus (Hardware) | Longevity Programming (Software) | Goal State |
| :--- | :--- | :--- | :--- |
| **Monday** | Exercise Snacking (Rings/Squats) | **Social Connection 1** (Schedule a call/virtual meeting) | 1/5 Social Interactions |
| **Tuesday** | Session A: Concept2 Intervals | **Cognitive:** Finish coffee by 2 PM. Log $VO_{2}max$ data. | Caffeine Limit & Timing |
| **Wednesday** | Session B: Ring Strength & Structure | **Social Connection 2** (Connect with a colleague or friend) | 2/5 Social Interactions |
| **Thursday** | Exercise Snacking + Yoga | **Mindfulness:** 15 min focused breathwork (Physiological Sigh practice) | Vagal Tone / HRR Practice |
| **Friday** | Session C: Run / Fartlek | **Social Connection 3** (Call home/check in with family) | 3/5 Social Interactions |
| **Weekend** | Family Active Recovery (Zone 2) | **Social Connection 4 & 5** (Family activity + Group run/meetup) | 5/5 Social Interactions |

### II. Core System Notes & Longevity Bottlenecks

| Factor | Primary Protocol | Key Metric / Bottleneck | **Drift Mitigation Strategy** |
| :--- | :--- | :--- | :--- |
| **Cardio / $VO_{2}max$** | Concept2 Intervals (4x4 min) | HR Recovery (HRR): >30 bpm drop | Long exhale **Physiological Sigh** post-interval. |
| **Sarcopenia / Strength** | Ring Training (Unstable Load) | Max Ring Support Hold (s) | Progression Algorithm: Increase **Time Under Tension (TUT)** (4s down/1s pause). |
| **Metabolic / Fueling** | High Leucine Post-Workout | Saturated Fat (<10% Cal), Fasting Glucose (<100) | **Leucine-rich shake** post A/B session. Quarterly check of Saturated Fat via Cronometer. |
| **Cognitive / Stress** | Low Coffee Dose, Social Connection | RHR (Low 48-55) & Sleep (7-8 hours) | Use **Tasks.org reminder** at 2 PM for coffee cutoff and 8:30 PM for work shutdown. |
| **Psychosocial** | **3-5 Meaningful Social Connections/Week** | Social Interaction Tally (Weekly) | **Proactive scheduling:** Allocate specific days (M/W/F) for connection signals. |

### III. The Integrated Longevity Dashboard (KPIs & Thresholds)

| System / Frequency | KPI (Key Performance Indicator) | Target / Optimal Range | **Action Trigger (Alert!)** |
| :--- | :--- | :--- | :--- |
| **Daily** | Resting Heart Rate (RHR) | 45 - 55 bpm | RHR consistently **>58 bpm** (Check sleep/stress/iron) |
| **Daily** | Coffee Intake / Timing | **1-2 Espressos, MUST stop by 2 PM** | Consumption **>4 Espressos** OR **after 2 PM** |
| **Weekly** | Social Connections | **3 - 5 Meaningful Interactions** | **<3 Interactions** (Need to proactively schedule) |
| **Weekly** | Strength Volume (Sets) | 6-9 sets per muscle group | **<4 Strength sets** (Risking Sarcopenia) |
| **Monthly** | Heart Rate Recovery (HRR) | **>30 bpm drop at 1 min** | **<28 bpm drop** (Focus on Vagal/Breathwork training) |
| **Monthly** | Alcohol Consumption | **0 - 3 Drinks** (You are near 0) | **>7 Drinks total** OR **>4 Drinks/occasion** |
| **Annual** | LDL Cholesterol | **<100 mg/dL** | **>130 mg/dL** (Re-assess vegetarian fat quality) |
| **Annual** | Waist/Height Ratio | **<0.5** (Yours ~0.44) | **>0.5** (Focus on diet adherence) |
`;

export const DEFAULT_CATEGORIES = [
  "daily",
  "weekly",
  "performance",
  "metabolic",
  "Lipids",
  "CBC",
  "clinical",
  "shape"
];

export const DEFAULT_SETTINGS: AppSettings = {
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h'
};

export const DEFAULT_METRICS: MetricConfig[] = [
    // --- DAILY LOGGING (Inputs) ---
    {
      "id": "sleep",
      "name": "Sleep",
      "range": [
        7,
        8
      ],
      "unit": "hours",
      "fact": "7-8 hours of sleep minimizes mortality risk by 14-34%. Sleep regularity may be more important than duration.",
      "citation": "Gu et al. 2024; Windred et al. 2024",
      "step": 0.5,
      "category": "daily",
      "active": true,
      "includeInSpider": true,
      "isTimeBased": true
    },
    {
      "id": "rhr",
      "name": "Resting HR",
      "range": [
        50,
        70
      ],
      "unit": "bpm",
      "fact": "RHR 60-70 bpm associated with lowest mortality. Each 10 bpm increase above 70 raises mortality risk 9%.",
      "citation": "Zhang et al. 2016; Reimers et al. 2021",
      "step": 1,
      "category": "daily",
      "active": true,
      "includeInSpider": true
    },
    {
      "id": "hrr",
      "name": "HR recovery",
      "range": [
        30,
        40
      ],
      "unit": "bpm/min",
      "fact": "Heart rate recovery (HRR) is the measure of how quickly your heart rate returns to its normal resting level after exercise.",
      "citation": "onepeloton, whoop",
      "step": 1,
      "category": "daily",
      "active": true,
      "includeInSpider": true
    },
    {
      "id": "snacks",
      "name": "Exercise Snacks",
      "range": [
        3,
        5
      ],
      "unit": "snacks/day",
      "fact": "Brief activity breaks throughout the day improve metabolic flexibility and glucose control.",
      "citation": "Physical Activity Guidelines 2018",
      "step": 1,
      "category": "daily",
      "active": true,
      "includeInSpider": true
    },
    {
      "id": "protein",
      "name": "Protein Intake",
      "range": [
        120,
        170
      ],
      "unit": "g/day",
      "fact": "1.6-2.2 g/kg/day for active males in 30s. Target 2.5-3g leucine per meal for optimal muscle protein synthesis.",
      "citation": "ISSN Position Stand 2017; Morton et al. 2018",
      "step": 5,
      "category": "daily",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "coffee",
      "name": "Coffee",
      "range": [
        100,
        400
      ],
      "unit": "mg caff",
      "fact": "100-400 mg caffeine/day associated with 12-14% reduced mortality risk.",
      "citation": "Freedman et al. 2012; Gunter et al. 2017",
      "step": 10,
      "category": "daily",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "alcohol",
      "name": "Alcohol",
      "range": [
        0,
        3
      ],
      "unit": "drinks/day",
      "fact": "No safe level of alcohol. 0-3 drinks/week minimizes harm but 0 is optimal.",
      "citation": "Wood et al. 2018; Global Burden Study 2018",
      "step": 1,
      "category": "daily",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "rowing_duration",
      "name": "Rowing Duration",
      "range": [
        20,
        90
      ],
      "unit": "min/day",
      "fact": "High intensity intervals drive VO2 max improvements. 75-150 min/week vigorous activity optimal.",
      "citation": "WHO Physical Activity Guidelines 2020",
      "step": 5,
      "category": "daily",
      "active": true,
      "includeInSpider": false,
      "isTimeBased": true
    },
    {
      "id": "running_duration",
      "name": "Running Duration",
      "range": [
        20,
        120
      ],
      "unit": "min/day",
      "fact": "Impact loading crucial for bone density. Running reduces mortality by 25-40%.",
      "citation": "Lee et al. 2014; Pedisic et al. 2020",
      "step": 5,
      "category": "daily",
      "active": true,
      "includeInSpider": false,
      "isTimeBased": true
    },
    {
        "id": "social_daily",
        "name": "Social Connect",
        "range": [0, 1],
        "unit": "count",
        "fact": "Log count of meaningful social interactions today.",
        "citation": "Regimen",
        "step": 1,
        "category": "daily",
        "active": true,
        "includeInSpider": false
    },

    // --- WEEKLY CALCULATED COUNTERS (Summative) ---
    {
        "id": "rowing_volume",
        "name": "Rowing Volume",
        "range": [75, 150],
        "unit": "min/week",
        "fact": "Weekly accumulation of rowing intervals.",
        "citation": "Calculated",
        "step": 5,
        "category": "weekly",
        "active": true,
        "includeInSpider": true,
        "isCalculated": true,
        "formula": "lib.sum('rowing_duration', 'week')"
    },
    {
        "id": "running_volume",
        "name": "Running Volume",
        "range": [30, 90],
        "unit": "min/week",
        "fact": "Weekly accumulation of running.",
        "citation": "Calculated",
        "step": 5,
        "category": "weekly",
        "active": true,
        "includeInSpider": true,
        "isCalculated": true,
        "formula": "lib.sum('running_duration', 'week')"
    },
    {
      "id": "social_weekly",
      "name": "Social Score",
      "range": [
        3,
        5
      ],
      "unit": "per week",
      "fact": "Strong social connections reduce mortality risk by 50%.",
      "citation": "Holt-Lunstad et al. 2010",
      "step": 1,
      "category": "weekly",
      "active": true,
      "includeInSpider": true,
      "isCalculated": true,
      "formula": "lib.sum('social_daily', 'week')"
    },

    // --- CLINICAL / SHAPE / PERFORMANCE ---
    {
      "id": "weight",
      "name": "Weight",
      "range": [
        50,
        100
      ],
      "unit": "kg",
      "fact": "Body weight for BMI calculation and body composition tracking.",
      "citation": "Clinical Standard",
      "step": 0.1,
      "category": "shape",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "height",
      "name": "Height",
      "range": [
        150,
        200
      ],
      "unit": "cm",
      "fact": "Height for BMI and body surface area calculations.",
      "citation": "Clinical Standard",
      "step": 1,
      "category": "shape",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "bmi",
      "name": "BMI",
      "range": [
        20,
        25
      ],
      "unit": "",
      "fact": "BMI 20-25 associated with lowest mortality. BMI >25 increases risk linearly.",
      "citation": "Di Angelantonio et al. 2016; Aune et al. 2016",
      "step": 0.1,
      "category": "shape",
      "active": true,
      "includeInSpider": false,
      "isCalculated": true,
      "formula": "weight / Math.pow(height/100, 2)"
    },
    {
      "id": "bp_systolic",
      "name": "Systolic BP",
      "range": [
        90,
        120
      ],
      "unit": "mmHg",
      "fact": "Systolic BP <120 mmHg reduces cardiovascular mortality by 25-30%.",
      "citation": "SPRINT 2015; Lewington et al. 2016",
      "step": 1,
      "category": "clinical",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "bp_diastolic",
      "name": "Diastolic BP",
      "range": [
        60,
        80
      ],
      "unit": "mmHg",
      "fact": "Diastolic blood pressure <80 mmHg normal.",
      "citation": "Harvard, NIH",
      "step": 1,
      "category": "clinical",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "map",
      "name": "Mean Arterial Pressure",
      "range": [70, 100],
      "unit": "mmHg",
      "fact": "The average pressure in arteries during one cardiac cycle. Better indicator of perfusion to vital organs than simple BP.",
      "citation": "American Heart Association",
      "step": 0.1,
      "category": "clinical",
      "active": true,
      "includeInSpider": false,
      "isCalculated": true,
      "formula": "(bp_systolic + 2 * bp_diastolic) / 3"
    },
    {
      "id": "ldl",
      "name": "LDL Cholesterol",
      "range": [
        50,
        100
      ],
      "unit": "mg/dL",
      "fact": "LDL <70 mg/dL optimal for CVD prevention.",
      "citation": "Silverman et al. 2016; CTT Collaboration 2010",
      "step": 1,
      "category": "Lipids",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "hdl",
      "name": "HDL Cholesterol",
      "range": [
        40,
        80
      ],
      "unit": "mg/dL",
      "fact": "HDL >40 mg/dL protective. Optimal 50-80 mg/dL.",
      "citation": "Madsen et al. 2017",
      "step": 1,
      "category": "Lipids",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "total_cholesterol",
      "name": "Total Cholesterol",
      "range": [150, 200],
      "unit": "mg/dL",
      "fact": "Total cholesterol < 200 mg/dL is desirable. Used in KDM Biological Age.",
      "citation": "AHA",
      "step": 1,
      "category": "Lipids",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "glucose",
      "name": "Fasting Glucose",
      "range": [
        70,
        100
      ],
      "unit": "mg/dL",
      "fact": "Fasting glucose 70-100 mg/dL optimal.",
      "citation": "Selvin et al. 2010",
      "step": 1,
      "category": "metabolic",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "Triglycerides",
      "name": "Triglycerides",
      "range": [
        0,
        150
      ],
      "unit": "mg/dL",
      "fact": "Triglycerides <150 mg/dL normal, <100 optimal.",
      "citation": "AHA/ACC Guidelines 2019",
      "step": 5,
      "category": "Lipids",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "trig_hdl_ratio",
      "name": "Trig/HDL Ratio",
      "range": [0, 2],
      "unit": "ratio",
      "fact": "A strong predictor of insulin resistance and the presence of small, dense LDL particles. Target < 2.0.",
      "citation": "Gaziano et al. 1997",
      "step": 0.01,
      "category": "Lipids",
      "active": true,
      "includeInSpider": false,
      "isCalculated": true,
      "formula": "Triglycerides / hdl"
    },
    {
      "id": "waist",
      "name": "Waist Circ.",
      "range": [
        70,
        94
      ],
      "unit": "cm",
      "fact": "Waist circumference is a key marker of visceral fat.",
      "citation": "IDF Consensus",
      "step": 0.5,
      "category": "shape",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "smoking",
      "name": "Current Smoker",
      "range": [
        0,
        1
      ],
      "unit": "",
      "fact": "0 = No, 1 = Yes.",
      "citation": "Surgeon General",
      "step": 1,
      "category": "clinical",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "diabetes",
      "name": "Diabetes",
      "range": [
        0,
        1
      ],
      "unit": "",
      "fact": "0 = No, 1 = Yes.",
      "citation": "ADA",
      "step": 1,
      "category": "clinical",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "bp_meds",
      "name": "BP Meds",
      "range": [
        0,
        1
      ],
      "unit": "",
      "fact": "0 = No, 1 = Yes.",
      "citation": "PCE",
      "step": 1,
      "category": "clinical",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "age",
      "name": "Chronological Age",
      "range": [
        20,
        100
      ],
      "unit": "years",
      "fact": "Primary factor in all risk models.",
      "citation": "General",
      "step": 1,
      "category": "clinical",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "sex",
      "name": "Biological Sex",
      "range": [
        0,
        1
      ],
      "unit": "",
      "fact": "0 = Female, 1 = Male.",
      "citation": "Genetics",
      "step": 1,
      "category": "clinical",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "cvd_risk_score",
      "name": "10y CVD Risk (PCE)",
      "range": [
        0,
        5
      ],
      "unit": "%",
      "fact": "Est. 10-year risk of heart attack or stroke. <5% is optimal.",
      "citation": "ACC/AHA",
      "step": 0.1,
      "category": "clinical",
      "active": true,
      "includeInSpider": false,
      "isCalculated": true,
      "formula": "lib.calculateCVDRisk({ age: vals.age, sex: vals.sex, tc: vals.total_cholesterol, hdl: vals.hdl, sbp: vals.bp_systolic, smoker: vals.smoking, diabetes: vals.diabetes, treatment: vals.bp_meds })"
    },
    {
      "id": "whtr",
      "name": "Waist/Height Ratio",
      "range": [
        0.4,
        0.5
      ],
      "unit": "",
      "fact": "WHtR < 0.5 prevents central obesity and metabolic syndrome.",
      "citation": "Ashwell, 2012",
      "step": 0.01,
      "category": "clinical",
      "active": true,
      "includeInSpider": false,
      "isCalculated": true,
      "formula": "waist / height"
    },
    {
      "id": "tyg",
      "name": "TyG Index",
      "range": [
        7,
        8.5
      ],
      "unit": "",
      "fact": "TyG < 8.5 indicates high insulin sensitivity. Superior to HOMA-IR.",
      "citation": "Guerrero-Romero, 2010",
      "step": 0.01,
      "category": "clinical",
      "active": true,
      "includeInSpider": false,
      "isCalculated": true,
      "formula": "Math.log((Triglycerides * glucose) / 2)"
    },
    {
      "id": "5k_run_time",
      "name": "5K Run Time",
      "range": [
        18,
        23
      ],
      "unit": "min",
      "fact": "Men age 30-39 average 25-26 min for 5K. Sub-20 min is top 5%.",
      "citation": "Outside Online 2024",
      "step": 0.5,
      "category": "performance",
      "active": true,
      "includeInSpider": true,
      "isCalculated": false,
      "isTimeBased": true
    },
    {
      "id": "hang_time",
      "name": "Dead Hang Time",
      "range": [
        60,
        120
      ],
      "unit": "s",
      "fact": "60+ seconds indicates good grip strength.",
      "citation": "Galpin 2023",
      "step": 5,
      "category": "performance",
      "active": true,
      "includeInSpider": true,
      "isCalculated": false,
      "isTimeBased": false
    },
    {
      "id": "2k_row_time",
      "name": "2K Row Time",
      "range": [
        6.5,
        7.5
      ],
      "unit": "min",
      "fact": "Sub-7 min for 2K row indicates excellent aerobic fitness.",
      "citation": "Concept2 Standards",
      "step": 0.25,
      "category": "performance",
      "active": true,
      "includeInSpider": true,
      "isCalculated": false,
      "isTimeBased": true
    },
    {
      "id": "ring_hold_time",
      "name": "Ring Support Hold Time",
      "range": [
        30,
        60
      ],
      "unit": "s",
      "fact": "30-60s indicates strong neuromuscular control.",
      "citation": "Gymnastics Strength Standards",
      "step": 5,
      "category": "performance",
      "active": true,
      "includeInSpider": true,
      "isCalculated": false,
      "isTimeBased": false
    },
    {
      "id": "hr_reserve",
      "name": "Heart Rate Reserve",
      "range": [100, 150],
      "unit": "bpm",
      "fact": "The difference between your max heart rate and resting heart rate. Indicates cardiovascular potential and autonomic health.",
      "citation": "Karvonen Method 1957",
      "step": 1,
      "category": "performance",
      "active": true,
      "includeInSpider": false,
      "isCalculated": true,
      "formula": "(220 - age) - rhr"
    },
    {
      "id": "vo2max_rhr",
      "name": "VO2max (RHR-based)",
      "range": [40, 60],
      "unit": "ml/kg/min",
      "fact": "Estimated using the Uth-Sørensen-Overgaard-Pedersen formula. Higher max-to-rest heart rate ratio correlates with higher aerobic capacity.",
      "citation": "Uth et al. 2004",
      "step": 0.1,
      "category": "performance",
      "active": true,
      "includeInSpider": false,
      "isCalculated": true,
      "formula": "15.3 * ((220 - age) / rhr)"
    },
    {
      "id": "vo2max_row",
      "name": "VO2max (2K Row)",
      "range": [40, 60],
      "unit": "ml/kg/min",
      "fact": "Estimated from 2K rowing performance using Concept2's power-to-VO2 equations. Reflects high-intensity work capacity.",
      "citation": "Concept2 / McArdle et al.",
      "step": 0.1,
      "category": "performance",
      "active": true,
      "includeInSpider": false,
      "isCalculated": true,
      "formula": "((2.8 / Math.pow(vals['2k_row_time'] * 0.03, 3)) * 14.4 + 300) / weight"
    },
    {
      "id": "vo2max_run",
      "name": "VO2max (5K Run)",
      "range": [40, 60],
      "unit": "ml/kg/min",
      "fact": "Estimated from 5K race pace using the Daniels-Gilbert (VDOT) formula. Considered a gold standard for field-test estimation.",
      "citation": "Daniels & Gilbert 1979",
      "step": 0.1,
      "category": "performance",
      "active": true,
      "includeInSpider": true,
      "isCalculated": true,
      "formula": "-4.6 + (0.1822 * (5000 / vals['5k_run_time'])) + (0.000104 * Math.pow(5000 / vals['5k_run_time'], 2))"
    },
    {
      "id": "kdm_bio_age",
      "name": "KDM Biological Age",
      "range": [20, 90],
      "unit": "years",
      "fact": "Biological age estimated using the Klemera-Doubal Method (KDM) with clinical biomarkers. Considered a gold standard.",
      "citation": "Klemera & Doubal 2006",
      "step": 0.1,
      "category": "performance",
      "active": true,
      "includeInSpider": true,
      "isCalculated": true,
      "formula": "lib.calculateKDMBioAge({ age: vals.age, sex: vals.sex, albumin: vals.Albumin, creatinine: vals.Kreatinin, total_cholesterol: vals.total_cholesterol, glucose: vals.glucose, crp: vals.CRP, alp: vals['Alkalische Phosphatase (AP)'], sbp: vals.bp_systolic, bmi: vals.bmi, total_protein: vals['Total Protein'] })?.biologicalAge"
    },
    {
      "id": "pheno_age",
      "name": "PhenoAge",
      "range": [20, 90],
      "unit": "years",
      "fact": "Biological age estimated from 9 clinical blood markers.",
      "citation": "Levine et al. 2018",
      "step": 0.1,
      "category": "clinical",
      "active": true,
      "includeInSpider": false,
      "isCalculated": true,
      "formula": "lib.calculatePhenoAge({ age: vals.age, albumin: vals.Albumin, creatinine: vals.Kreatinin, glucose: vals.glucose, crp: vals.CRP, lymphocyte_pct: vals.lymphocyte_pct, lymphocyte_abs: vals.Lymphozyten, mcv: vals.MCV, rdw: vals.RDW, alp: vals['Alkalische Phosphatase (AP)'], wbc: vals.Leukozyten, total_protein: vals['Total Protein'] })?.biologicalAge"
    },
    {
      "id": "neck_circ",
      "name": "Neck Circumference",
      "range": [
        35,
        40
      ],
      "unit": "cm",
      "fact": "Neck circumference <40cm for men reduces cardiovascular risk.",
      "citation": "Framingham Heart Study 2021",
      "step": 0.5,
      "category": "shape",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "chest_circ",
      "name": "Chest Circumference",
      "range": [
        95,
        110
      ],
      "unit": "cm",
      "fact": "Typical for healthy males.",
      "citation": "Anthropometric Standards",
      "step": 0.5,
      "category": "shape",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "hips_circ",
      "name": "Hip Circumference",
      "range": [
        90,
        105
      ],
      "unit": "cm",
      "fact": "Used for waist-to-hip ratio.",
      "citation": "WHO",
      "step": 0.5,
      "category": "shape",
      "active": true,
      "includeInSpider": false
    },
    
    // --- PHENOAGE MARKERS (Inactive by default) ---
    {
      "id": "Albumin",
      "name": "Albumin",
      "range": [
        55.8,
        66.1
      ],
      "unit": "%",
      "fact": "Serum albumin 40-50 g/L indicates adequate protein status and liver function. If % is used, it will be converted using Total Protein.",
      "citation": "Arnaud et al. 2010; Clinical Chemistry",
      "step": 0.1,
      "category": "metabolic",
      "active": true,
      "includeInSpider": false
    },
    {
      "id": "Total Protein",
      "name": "Total Protein",
      "range": [
        6,
        8.3
      ],
      "unit": "g/dL",
      "fact": "Total protein in serum. Used to convert Albumin % to g/L for PhenoAge.",
      "citation": "Clinical",
      "step": 0.1,
      "category": "metabolic",
      "active": true,
      "includeInSpider": false
    },
    {
        "id": "Kreatinin",
        "name": "Creatinine",
        "range": [0.7, 1.3],
        "unit": "mg/dL",
        "fact": "Kidney function marker used in PhenoAge.",
        "citation": "Levine et al. 2018",
        "step": 0.01,
        "category": "clinical",
        "active": false,
        "includeInSpider": false
    },
    {
        "id": "CRP",
        "name": "C-Reactive Protein (hs)",
        "range": [0, 1],
        "unit": "mg/L",
        "fact": "Inflammation marker. Lower is better for PhenoAge.",
        "citation": "Levine et al. 2018",
        "step": 0.1,
        "category": "clinical",
        "active": false,
        "includeInSpider": false
    },
    {
        "id": "Lymphozyten",
        "name": "Lymphocytes (Abs)",
        "range": [1, 4],
        "unit": "g/L",
        "fact": "Absolute lymphocyte count. Used to calculate percentage if needed.",
        "citation": "Clinical",
        "step": 0.01,
        "category": "CBC",
        "active": false,
        "includeInSpider": false
    },
    {
        "id": "MCV",
        "name": "Mean Cell Volume",
        "range": [80, 100],
        "unit": "fL",
        "fact": "Red blood cell size. High MCV correlates with aging.",
        "citation": "Levine et al. 2018",
        "step": 0.1,
        "category": "CBC",
        "active": false,
        "includeInSpider": false
    },
    {
        "id": "RDW",
        "name": "RDW",
        "range": [11, 15],
        "unit": "%",
        "fact": "Red Cell Distribution Width. Variation in cell size increases with age.",
        "citation": "Levine et al. 2018",
        "step": 0.1,
        "category": "CBC",
        "active": false,
        "includeInSpider": false
    },
    {
        "id": "Alkalische Phosphatase (AP)",
        "name": "Alkaline Phosphatase",
        "range": [44, 147],
        "unit": "IU/L",
        "fact": "Liver/Bone enzyme used in PhenoAge.",
        "citation": "Levine et al. 2018",
        "step": 1,
        "category": "clinical",
        "active": false,
        "includeInSpider": false
    },
    {
        "id": "Leukozyten",
        "name": "White Blood Cells",
        "range": [4.5, 11],
        "unit": "k/cumm",
        "fact": "Immune system marker for PhenoAge.",
        "citation": "Levine et al. 2018",
        "step": 0.1,
        "category": "CBC",
        "active": false,
        "includeInSpider": false
    }
];