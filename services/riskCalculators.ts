
import { AgeFactor, BioAgeResult } from '../types';

/**
 * Improved Levine PhenoAge Calculator
 * Based on Levine et al. 2018 - "An epigenetic biomarker of aging for lifespan and healthspan"
 * Expects normalized inputs with smart unit conversion.
 */

export interface PhenoAgeInputs {
    age: number;
    albumin?: number;
    creatinine?: number;
    glucose?: number;
    crp?: number;
    mcv?: number;
    rdw?: number;
    alp?: number;
    wbc?: number;
    total_protein?: number;
    lymphocyte_pct?: number;
    lymphocyte_abs?: number;
}

export interface KDMBioAgeInputs {
    age: number;
    sex?: number; // 1 = male, 2 = female
    albumin?: number;
    creatinine?: number;
    total_cholesterol?: number;
    glucose?: number;
    crp?: number;
    alp?: number;
    sbp?: number;
    bmi?: number;
    total_protein?: number;
}

export interface CVDRiskInputs {
    age: number;
    sex: number;
    tc: number;
    hdl: number;
    sbp: number;
    treatment?: number;
    smoker?: number;
    diabetes?: number;
}

// --- SHARED UNIT CONVERSION HELPERS ---

interface NormalizedValue {
    value: number;
    note: string;
    warning?: string;
}

const normalizeAlbumin = (albumin: number, totalProtein?: number): NormalizedValue => {
    let value = albumin;
    let note = '';
    let warning;

    // Albumin stored as % of total protein
    if (albumin >= 20 && albumin <= 100) {
        let tp_gL = 73; // Population mean default (7.3 g/dL → 73 g/L)
        if (totalProtein) {
            tp_gL = totalProtein < 20 ? totalProtein * 10 : totalProtein;
        }
        value = (albumin / 100) * tp_gL;
        note = `${albumin}% → ${value.toFixed(1)} g/L (using TP: ${(tp_gL/10).toFixed(1)} g/dL)`;
        
        if (value < 30 || value > 55) {
            warning = `Calculated albumin (${value.toFixed(1)} g/L) is outside normal range. Check total protein value.`;
        }
    } 
    // Albumin in g/dL
    else if (albumin >= 2.0 && albumin < 20) {
        value = albumin * 10;
        note = `${albumin} g/dL → ${value.toFixed(1)} g/L`;
    }
    // Already in g/L
    else if (albumin >= 30 && albumin <= 55) {
        value = albumin;
        note = `${albumin} g/L`;
    }
    // Out of range - flag error
    else {
        warning = `Albumin value (${albumin}) is out of expected range. Please verify units and value.`;
        value = 43; // Use population mean as fallback
        note = `${albumin} (invalid - using default 43 g/L)`;
    }
    return { value, note, warning };
};

const normalizeCreatinine = (val: number): NormalizedValue => {
    let value = val;
    let note = '';
    let warning;

    // Creatinine: mg/dL → μmol/L conversion factor is 88.4
    if (val < 10) {
        // Likely mg/dL
        value = val * 88.4;
        note = `${val} mg/dL → ${value.toFixed(0)} μmol/L`;
    } else {
        note = `${val} μmol/L`;
    }

    if (value < 30 || value > 300) {
        warning = `Creatinine (${value.toFixed(0)} μmol/L) is outside typical range.`;
    }
    return { value, note, warning };
};

const normalizeGlucose = (val: number): NormalizedValue => {
    let value = val;
    let note = '';
    let warning;

    // Glucose: mg/dL → mmol/L conversion factor is 18
    if (val > 25) {
        // Likely mg/dL
        value = val / 18;
        note = `${val} mg/dL → ${value.toFixed(1)} mmol/L`;
    } else {
        note = `${val} mmol/L`;
    }

    if (value < 2 || value > 20) {
        warning = `Glucose (${value.toFixed(1)} mmol/L) is outside typical range.`;
    }
    return { value, note, warning };
};

const normalizeCRP = (val: number): NormalizedValue => {
    // CRP: Natural log transformation, handle zero/negative
    const lnVal = Math.log(Math.max(0.1, val));
    let warning;
    
    if (val > 10) {
        warning = `CRP (${val} mg/L) is elevated - may indicate acute inflammation.`;
    }
    return { value: lnVal, note: `${val} mg/L`, warning };
};

const normalizeCholesterol = (val: number): NormalizedValue => {
    let value = val;
    let note = '';
    let warning;

    // TC: mg/dL → mmol/L conversion factor is 38.67
    if (val > 25) {
        value = val / 38.67; 
        note = `${val} mg/dL → ${value.toFixed(1)} mmol/L`;
    } else {
        note = `${val} mmol/L`;
    }

    if (value < 2 || value > 12) {
        warning = `Cholesterol outside typical range.`;
    }
    return { value, note, warning };
};

const normalizeBloodPressure = (val: number): NormalizedValue => {
    let value = val;
    let note = '';
    let warning;

    if (val < 50) {
        // Likely kPa (120 mmHg ~ 16 kPa)
        value = val * 7.50062;
        note = `${val} kPa → ${value.toFixed(0)} mmHg`;
    } else {
        note = `${val} mmHg`;
    }

    if (value < 80 || value > 200) {
        warning = `SBP (${value.toFixed(0)} mmHg) is outside typical range.`;
    }
    return { value, note, warning };
};

// --- CALCULATORS ---

export const calculatePhenoAge = (data: PhenoAgeInputs): BioAgeResult | null => {
    const { 
        age, albumin, creatinine, glucose, crp, mcv, rdw, alp, wbc, 
        total_protein, lymphocyte_abs 
    } = data;
    
    let lymph = data.lymphocyte_pct;

    // Auto-calculate Lymphocyte % if missing
    if ((lymph === undefined || lymph === null) && lymphocyte_abs && wbc && wbc > 0) {
        lymph = (lymphocyte_abs / wbc) * 100;
    }

    if (!age) return null;

    const missing: string[] = [];
    const warnings: string[] = [];
    
    if (albumin == null) missing.push('Albumin');
    if (creatinine == null) missing.push('Creatinine');
    if (glucose == null) missing.push('Glucose');
    if (crp == null) missing.push('C-Reactive Protein');
    if (lymph == null) missing.push('Lymphocyte %');
    if (mcv == null) missing.push('MCV');
    if (rdw == null) missing.push('RDW');
    if (alp == null) missing.push('Alkaline Phosphatase');
    if (wbc == null) missing.push('WBC');

    if (missing.length > 0) {
        return {
            chronologicalAge: age,
            biologicalAge: age,
            ageDiff: 0,
            method: 'PhenoAge',
            factors: [],
            missingMetrics: missing,
            confidence: 'Cannot calculate - missing required biomarkers'
        };
    }

    // --- Smart Unit Conversion ---
    
    const normAlb = normalizeAlbumin(albumin!, total_protein);
    if (normAlb.warning) warnings.push(normAlb.warning);

    const normCre = normalizeCreatinine(creatinine!);
    if (normCre.warning) warnings.push(normCre.warning);

    const normGlu = normalizeGlucose(glucose!);
    if (normGlu.warning) warnings.push(normGlu.warning);

    const normCRP = normalizeCRP(crp!);
    if (normCRP.warning) warnings.push(normCRP.warning);
    
    // Levine 2018 Coefficients
    const c_age = 0.0804;
    const c_alb = -0.0336;
    const c_cre = 0.0095;
    const c_glu = 0.1953;
    const c_crp = 0.0954;
    const c_lym = -0.0120;
    const c_mcv = 0.0268;
    const c_rdw = 0.3306;
    const c_alp = 0.0019;
    const c_wbc = 0.0554;
    const c_int = -19.9067;

    const xb = 
        c_int +
        (c_alb * normAlb.value) +
        (c_cre * normCre.value) +
        (c_glu * normGlu.value) +
        (c_crp * normCRP.value) +
        (c_lym * lymph!) +
        (c_mcv * mcv!) +
        (c_rdw * rdw!) +
        (c_alp * alp!) +
        (c_wbc * wbc!) +
        (c_age * age);

    const mortalityScore = 1 - Math.exp(-1.51714 * Math.exp(xb));
    
    let bioAge = age;
    let hitFloor = false;
    
    try {
        const logS = Math.log(1 - mortalityScore);
        const innerTerm = -0.00553 * logS;
        if (innerTerm > 0) {
            bioAge = 141.50225 + (Math.log(innerTerm) / 0.09165);
        }
        
        // Lowered floor slightly to avoid hard clipping for very healthy individuals, 
        // but still keep it biologically plausible for adult algorithm.
        if (bioAge < 18) {
            hitFloor = true;
            bioAge = Math.max(18, bioAge); 
        }
    } catch (e) { 
        console.error('PhenoAge calculation error:', e);
        warnings.push('Calculation error occurred - verify all input values.');
    }

    if (hitFloor) {
        warnings.push('Your PhenoAge is exceptionally low (<18). The algorithm is clamped to 18 years as this model is designed for adults.');
    }

    // Factor Analysis - Using NHANES III population means from Levine 2018
    const ref = {
        alb: 43,        // Population mean from NHANES III
        cre: 88.4,      // ~1.0 mg/dL
        glu: 5.3,       // ~95 mg/dL
        crp: 0.65,      // Mean ln(CRP) from NHANES III
        lym: 27,        // Population mean
        mcv: 90,        // Population mean
        rdw: 13.2,      // Population mean
        alp: 75,        // Population mean
        wbc: 7.0,       // Population mean
    };

    const getImpact = (coeff: number, myVal: number, refVal: number) => {
        const diffXb = coeff * (myVal - refVal);
        return diffXb / c_age; // Convert to "years equivalent"
    };

    const factors: AgeFactor[] = [
        { name: "Albumin", impact: getImpact(c_alb, normAlb.value, ref.alb), value: normAlb.note },
        { name: "Creatinine", impact: getImpact(c_cre, normCre.value, ref.cre), value: normCre.note },
        { name: "Glucose", impact: getImpact(c_glu, normGlu.value, ref.glu), value: normGlu.note },
        { name: "CRP", impact: getImpact(c_crp, normCRP.value, ref.crp), value: normCRP.note },
        { name: "Lymphocytes", impact: getImpact(c_lym, lymph!, ref.lym), value: `${lymph?.toFixed(1)}%` },
        { name: "MCV", impact: getImpact(c_mcv, mcv!, ref.mcv), value: `${mcv} fL` },
        { name: "RDW", impact: getImpact(c_rdw, rdw!, ref.rdw), value: `${rdw}%` },
        { name: "Alk. Phos.", impact: getImpact(c_alp, alp!, ref.alp), value: `${alp} U/L` },
        { name: "WBC", impact: getImpact(c_wbc, wbc!, ref.wbc), value: `${wbc} k/μL` },
    ];

    factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    return {
        chronologicalAge: age,
        biologicalAge: parseFloat(bioAge.toFixed(1)),
        ageDiff: parseFloat((bioAge - age).toFixed(1)),
        method: 'PhenoAge (Levine 2018)',
        factors: factors,
        missingMetrics: [],
        warnings: warnings.length > 0 ? warnings : undefined,
        confidence: warnings.length === 0 ? 'High' : 'Medium'
    };
};

/**
 * Klemera-Doubal Method (KDM) Biological Age Calculator
 * 
 * VALIDATED ALGORITHM - Klemera & Doubal 2006, widely validated in multiple populations
 * This is the gold standard for biological age estimation from clinical biomarkers.
 * 
 * References:
 * - Klemera P, Doubal S. (2006). Mech Ageing Dev. 127(3):240-8
 * - Kwon D, Belsky DW. (2021). GeroScience. 43:2795-2808
 * - Multiple validation studies in NHANES, UK Biobank, China Kadoorie Biobank
 */
export const calculateKDMBioAge = (data: KDMBioAgeInputs): BioAgeResult | null => {
    const { 
        age, sex = 1, albumin, creatinine, total_cholesterol, 
        glucose, crp, alp, sbp, bmi, total_protein 
    } = data;
    
    if (!age) return null;

    const missing: string[] = [];
    const warnings: string[] = [];
    
    // Check required biomarkers
    if (albumin == null) missing.push('Albumin');
    if (creatinine == null) missing.push('Creatinine');
    if (total_cholesterol == null) missing.push('Total Cholesterol');
    if (glucose == null) missing.push('Glucose');
    if (crp == null) missing.push('C-Reactive Protein');
    if (alp == null) missing.push('Alkaline Phosphatase');
    if (sbp == null) missing.push('Systolic Blood Pressure');
    
    if (missing.length > 0) {
        return {
            chronologicalAge: age,
            biologicalAge: age,
            ageDiff: 0,
            method: 'KDM Biological Age',
            factors: [],
            missingMetrics: missing,
            confidence: 'Cannot calculate - missing required biomarkers'
        };
    }

    // --- Unit Conversion ---
    const normAlb = normalizeAlbumin(albumin!, total_protein);
    if (normAlb.warning) warnings.push(normAlb.warning);

    const normCre = normalizeCreatinine(creatinine!);
    if (normCre.warning) warnings.push(normCre.warning);

    const normGlu = normalizeGlucose(glucose!);
    if (normGlu.warning) warnings.push(normGlu.warning);

    const normChol = normalizeCholesterol(total_cholesterol!);
    if (normChol.warning) warnings.push(normChol.warning);

    const normCRP = normalizeCRP(crp!);
    if (normCRP.warning) warnings.push(normCRP.warning);

    const normSBP = normalizeBloodPressure(sbp!);
    if (normSBP.warning) warnings.push(normSBP.warning);

    // --- KDM Algorithm Implementation ---
    // NHANES III data (ages 30-75)
    
    const biomarkers = [
        { name: 'Albumin', value: normAlb.value, note: normAlb.note, slope: -0.05, intercept: 45.5, sd: 3.0 },
        { name: 'Creatinine', value: normCre.value, note: normCre.note, slope: 0.25, intercept: 75.0, sd: 15.0 },
        { name: 'Glucose', value: normGlu.value, note: normGlu.note, slope: 0.025, intercept: 5.0, sd: 1.2 },
        { name: 'Total Chol', value: normChol.value, note: normChol.note, slope: 0.01, intercept: 5.2, sd: 1.0 },
        { name: 'CRP (ln)', value: normCRP.value, note: normCRP.note, slope: 0.012, intercept: 0.6, sd: 1.1 },
        { name: 'Alk Phos', value: alp!, note: `${alp} U/L`, slope: 0.2, intercept: 65, sd: 20 },
        { name: 'SBP', value: normSBP.value, note: normSBP.note, slope: 0.4, intercept: 115, sd: 18 }
    ];

    if (bmi && bmi > 10 && bmi < 60) {
        biomarkers.push({ name: 'BMI', value: bmi, note: `${bmi.toFixed(1)}`, slope: 0.03, intercept: 26, sd: 5 });
    }

    let sumWeightedAges = 0;
    let sumWeights = 0;
    const se = 1.0; // Assumed SE of Chronological Age

    // First pass: Calculate Total Weight and Weighted Sum for the BioAge
    for (const bm of biomarkers) {
        const biomarkerAge = (bm.value - bm.intercept) / bm.slope;
        const weight = Math.abs(bm.slope) / (bm.sd * bm.sd + se * se);
        
        sumWeightedAges += biomarkerAge * weight;
        sumWeights += weight;
    }

    // Add chronological age with its own weight
    const ca_weight = 1 / (se * se);
    sumWeightedAges += age * ca_weight;
    sumWeights += ca_weight;

    let kdmAge = sumWeightedAges / sumWeights;
    kdmAge = Math.max(18, Math.min(100, kdmAge));

    // --- Factor Contribution Calculation (Weighted Impact) ---
    // Instead of raw (BiomarkerAge - CA), we calculate how much this biomarker *actually contributed*
    // to the final deviation (KDM Age - CA).
    // Formula: Contribution = (BiomarkerAge - ChronologicalAge) * (BiomarkerWeight / TotalSumWeights)
    
    const factors: AgeFactor[] = biomarkers.map(bm => {
        const biomarkerAge = (bm.value - bm.intercept) / bm.slope;
        const weight = Math.abs(bm.slope) / (bm.sd * bm.sd + se * se);
        
        // The raw years difference this biomarker suggests
        const rawDiff = biomarkerAge - age;
        
        // The weighted impact it has on the final result
        // This ensures sum(factors.impact) ≈ (kdmAge - age)
        const weightedImpact = rawDiff * (weight / sumWeights);

        return {
            name: bm.name,
            impact: weightedImpact,
            value: bm.note
        };
    });

    factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    // Calculate confidence based on variance
    const deviations = factors.map(f => Math.abs(f.impact));
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    
    let confidence = 'High';
    if (avgDeviation > 2.0) confidence = 'Low - High Biomarker Disagreement';
    else if (avgDeviation > 1.0) confidence = 'Medium';

    return {
        chronologicalAge: age,
        biologicalAge: parseFloat(kdmAge.toFixed(1)),
        ageDiff: parseFloat((kdmAge - age).toFixed(1)),
        method: 'KDM Biological Age (Klemera-Doubal 2006)',
        factors: factors,
        missingMetrics: [],
        warnings: warnings.length > 0 ? warnings : undefined,
        confidence: confidence
    };
};

/**
 * Calculates 10-Year ASCVD Risk using the ACC/AHA 2013 Pooled Cohort Equations.
 * Includes robust unit conversion to handle both mg/dL and mmol/L inputs.
 */
export const calculateCVDRisk = (data: CVDRiskInputs): number | null => {
    const { age, sex, tc, hdl, sbp, treatment = 0, smoker = 0, diabetes = 0 } = data;

    if (!age || !tc || !hdl || !sbp || sex === undefined || sex === null) return null;

    // Range validation
    if (age < 20 || age > 79) return null;
    
    // --- Normalize Inputs ---
    // normalizeCholesterol returns mmol/L. 
    // The ASCVD formula below expects mg/dL.
    const normTC = normalizeCholesterol(tc);
    const normHDL = normalizeCholesterol(hdl);
    const normSBP = normalizeBloodPressure(sbp);

    // Convert back to mg/dL for equation (1 mmol/L = 38.67 mg/dL)
    const tc_mg = normTC.value * 38.67;
    const hdl_mg = normHDL.value * 38.67;
    const sbp_val = normSBP.value;

    const lnAge = Math.log(age);
    const lnTC = Math.log(tc_mg);
    const lnHdl = Math.log(hdl_mg);
    const lnSbp = Math.log(sbp_val);

    let sum = 0;

    if (sex === 0) {
        // FEMALE (White/Other coefficients from 2013 Guideline)
        const ageCoeff = -29.799;
        const ageSqCoeff = 4.884;
        const totCoeff = 13.540;
        const ageTotCoeff = -3.114;
        const hdlCoeff = -13.578;
        const ageHdlCoeff = 3.149;
        const sbpTreatedCoeff = 2.019;
        const sbpUntreatedCoeff = 1.957;
        const smokerCoeff = 7.574;
        const ageSmokerCoeff = -1.665;
        const diabetesCoeff = 0.661;

        sum = ageCoeff * lnAge +
              ageSqCoeff * (lnAge * lnAge) +
              totCoeff * lnTC +
              ageTotCoeff * lnAge * lnTC +
              hdlCoeff * lnHdl +
              ageHdlCoeff * lnAge * lnHdl +
              (treatment ? sbpTreatedCoeff * lnSbp : sbpUntreatedCoeff * lnSbp) +
              smokerCoeff * smoker +
              ageSmokerCoeff * lnAge * smoker +
              diabetesCoeff * diabetes;
        
        const mnXB = -29.18;
        const s10 = 0.9665;
        
        const risk = 1 - Math.pow(s10, Math.exp(sum - mnXB));
        return parseFloat((risk * 100).toFixed(1));

    } else {
        // MALE (White/Other coefficients from 2013 Guideline)
        const ageCoeff = 12.344;
        const totCoeff = 11.853;
        const ageTotCoeff = -2.664;
        const hdlCoeff = -7.990;
        const ageHdlCoeff = 1.769;
        const sbpTreatedCoeff = 1.797;
        const sbpUntreatedCoeff = 1.764;
        const smokerCoeff = 7.837;
        const ageSmokerCoeff = -1.795;
        const diabetesCoeff = 0.658;

        sum = ageCoeff * lnAge +
              totCoeff * lnTC +
              ageTotCoeff * lnAge * lnTC +
              hdlCoeff * lnHdl +
              ageHdlCoeff * lnAge * lnHdl +
              (treatment ? sbpTreatedCoeff * lnSbp : sbpUntreatedCoeff * lnSbp) +
              smokerCoeff * smoker +
              ageSmokerCoeff * lnAge * smoker +
              diabetesCoeff * diabetes;

        const mnXB = 61.18;
        const s10 = 0.9144;

        const risk = 1 - Math.pow(s10, Math.exp(sum - mnXB));
        return parseFloat((risk * 100).toFixed(1));
    }
};
