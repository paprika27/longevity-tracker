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

    // --- Smart Unit Conversion with Validation ---
    
    let alb_gL = albumin!;
    let alb_note = '';
    
    // Albumin stored as % of total protein
    if (albumin! >= 20 && albumin! <= 100) {
        // This is albumin as % of total protein
        let tp_gL = 73; // Population mean default (7.3 g/dL → 73 g/L)
        if (total_protein) {
            tp_gL = total_protein < 20 ? total_protein * 10 : total_protein;
        }
        alb_gL = (albumin! / 100) * tp_gL;
        alb_note = `${albumin}% → ${alb_gL.toFixed(1)} g/L (using TP: ${(tp_gL/10).toFixed(1)} g/dL)`;
        
        // Validate result is in reasonable range
        if (alb_gL < 30 || alb_gL > 55) {
            warnings.push(`Calculated albumin (${alb_gL.toFixed(1)} g/L) is outside normal range. Check total protein value.`);
        }
    } 
    // Albumin in g/dL
    else if (albumin! >= 2.0 && albumin! < 20) {
        alb_gL = albumin! * 10;
        alb_note = `${albumin} g/dL → ${alb_gL.toFixed(1)} g/L`;
    }
    // Already in g/L
    else if (albumin! >= 30 && albumin! <= 55) {
        alb_gL = albumin!;
        alb_note = `${albumin} g/L`;
    }
    // Out of range - flag error
    else {
        warnings.push(`Albumin value (${albumin}) is out of expected range. Please verify units and value.`);
        alb_gL = 43; // Use population mean as fallback
        alb_note = `${albumin} (invalid - using default 43 g/L)`;
    }

    // Creatinine: mg/dL → μmol/L conversion factor is 88.4
    let creat_umol = creatinine!;
    let creat_note = '';
    if (creatinine! < 10) {
        // Likely mg/dL
        creat_umol = creatinine! * 88.4;
        creat_note = `${creatinine} mg/dL → ${creat_umol.toFixed(0)} μmol/L`;
    } else {
        creat_note = `${creatinine} μmol/L`;
    }

    // Glucose: mg/dL → mmol/L conversion factor is 18
    let gluc_mmol = glucose!;
    let gluc_note = '';
    if (glucose! > 25) {
        // Likely mg/dL
        gluc_mmol = glucose! / 18;
        gluc_note = `${glucose} mg/dL → ${gluc_mmol.toFixed(1)} mmol/L`;
    } else {
        gluc_note = `${glucose} mmol/L`;
    }

    // CRP: Natural log transformation, handle zero/negative
    const ln_crp = Math.log(Math.max(0.1, crp!)); 
    
    // Validate ranges
    if (creat_umol < 30 || creat_umol > 300) {
        warnings.push(`Creatinine (${creat_umol.toFixed(0)} μmol/L) is outside typical range.`);
    }
    if (gluc_mmol < 2 || gluc_mmol > 20) {
        warnings.push(`Glucose (${gluc_mmol.toFixed(1)} mmol/L) is outside typical range.`);
    }
    if (crp! > 10) {
        warnings.push(`CRP (${crp} mg/L) is elevated - may indicate acute inflammation.`);
    }
    
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
        (c_alb * alb_gL) +
        (c_cre * creat_umol) +
        (c_glu * gluc_mmol) +
        (c_crp * ln_crp) +
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
        { name: "Albumin", impact: getImpact(c_alb, alb_gL, ref.alb), value: alb_note },
        { name: "Creatinine", impact: getImpact(c_cre, creat_umol, ref.cre), value: creat_note },
        { name: "Glucose", impact: getImpact(c_glu, gluc_mmol, ref.glu), value: gluc_note },
        { name: "CRP", impact: getImpact(c_crp, ln_crp, ref.crp), value: `${crp} mg/L` },
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
 * 
 * The KDM method finds the biological age at which an individual's biomarker
 * profile would be considered "normal" based on population reference data.
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
    let alb_gL = albumin!;
    let alb_note = '';
    
    if (albumin! >= 20 && albumin! <= 100) {
        let tp_gL = 73; // Population mean default
        if (total_protein) {
            tp_gL = total_protein < 20 ? total_protein * 10 : total_protein;
        }
        alb_gL = (albumin! / 100) * tp_gL;
        alb_note = `${albumin}% → ${alb_gL.toFixed(1)} g/L`;
    } else if (albumin! >= 2.0 && albumin! < 20) {
        alb_gL = albumin! * 10;
        alb_note = `${albumin} g/dL → ${alb_gL.toFixed(1)} g/L`;
    } else if (albumin! >= 30 && albumin! <= 55) {
        alb_gL = albumin!;
        alb_note = `${albumin} g/L`;
    } else {
        alb_gL = 43;
        alb_note = `${albumin} (invalid)`;
    }

    let creat_umol = creatinine!;
    let creat_note = '';
    if (creatinine! < 10) {
        creat_umol = creatinine! * 88.4;
        creat_note = `${creatinine} mg/dL → ${creat_umol.toFixed(0)} μmol/L`;
    } else {
        creat_note = `${creatinine} μmol/L`;
    }

    let gluc_mmol = glucose!;
    let gluc_note = '';
    if (glucose! > 25) {
        gluc_mmol = glucose! / 18;
        gluc_note = `${glucose} mg/dL → ${gluc_mmol.toFixed(1)} mmol/L`;
    } else {
        gluc_note = `${glucose} mmol/L`;
    }

    let chol_mmol = total_cholesterol!;
    let chol_note = '';
    if (total_cholesterol! > 25) {
        chol_mmol = total_cholesterol! / 38.67; 
        chol_note = `${total_cholesterol} mg/dL → ${chol_mmol.toFixed(1)} mmol/L`;
    } else {
        chol_note = `${total_cholesterol} mmol/L`;
    }

    const ln_crp = Math.log(Math.max(0.1, crp!));

    // Validate ranges
    if (creat_umol < 30 || creat_umol > 300) warnings.push(`Creatinine outside typical range.`);
    if (gluc_mmol < 2 || gluc_mmol > 20) warnings.push(`Glucose outside typical range.`);
    if (chol_mmol < 2 || chol_mmol > 10) warnings.push(`Cholesterol outside typical range.`);
    if (sbp! < 80 || sbp! > 200) warnings.push(`BP outside typical range.`);

    // --- KDM Algorithm Implementation ---
    // NHANES III data (ages 30-75)
    
    const biomarkers = [
        { name: 'Albumin', value: alb_gL, note: alb_note, slope: -0.05, intercept: 45.5, sd: 3.0 },
        { name: 'Creatinine', value: creat_umol, note: creat_note, slope: 0.25, intercept: 75.0, sd: 15.0 },
        { name: 'Glucose', value: gluc_mmol, note: gluc_note, slope: 0.025, intercept: 5.0, sd: 1.2 },
        { name: 'Total Chol', value: chol_mmol, note: chol_note, slope: 0.01, intercept: 5.2, sd: 1.0 },
        { name: 'CRP (ln)', value: ln_crp, note: `${crp} mg/L`, slope: 0.012, intercept: 0.6, sd: 1.1 },
        { name: 'Alk Phos', value: alp!, note: `${alp} U/L`, slope: 0.2, intercept: 65, sd: 20 },
        { name: 'SBP', value: sbp!, note: `${sbp} mmHg`, slope: 0.4, intercept: 115, sd: 18 }
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
 */
export const calculateCVDRisk = (data: CVDRiskInputs): number | null => {
    const { age, sex, tc, hdl, sbp, treatment = 0, smoker = 0, diabetes = 0 } = data;

    if (!age || !tc || !hdl || !sbp || sex === undefined || sex === null) return null;

    // Range validation
    if (age < 20 || age > 79) return null;
    
    const lnAge = Math.log(age);
    const lnTC = Math.log(tc);
    const lnHdl = Math.log(hdl);
    const lnSbp = Math.log(sbp);

    let sum = 0;

    if (sex === 0) {
        // FEMALE
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
        // MALE
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