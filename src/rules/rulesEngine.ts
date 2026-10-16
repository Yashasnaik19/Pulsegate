/**
 * @license
 * PulseGate Deterministic Clinical Decision Support Engine
 * Implementation of Royal College of Physicians NEWS2 + Emergency Red Flag Protocol
 * Specification Version: PulseGate-Clinical-Ruleset-v2.4.1
 */

import type {
  VitalSignsObservations,
  SymptomIntake,
  TriageEvaluation,
  MatchedRule,
  UrgencyCategory,
} from '../types/index.ts';

export const CURRENT_RULESET_VERSION = 'PulseGate-Clinical-Ruleset-v2.4.1';
export const CURRENT_RULESET_ID = 'RCP-NEWS2-RED-FLAGS-v2';

export interface EvaluationInput {
  assessmentId: string;
  patientAge: number;
  symptoms: SymptomIntake;
  observations: VitalSignsObservations;
}

/**
 * Calculates NEWS2 sub-scores deterministically based on standard NHS / RCP tables.
 */
export function calculateNews2Scores(obs: VitalSignsObservations): {
  totalScore: number | null;
  breakdown: Record<string, number>;
  missingFields: string[];
  invalidFields: string[];
} {
  const breakdown: Record<string, number> = {};
  const missingFields: string[] = [];
  const invalidFields: string[] = [];

  // 1. Respiration Rate
  if (obs.respiratoryRate === null || obs.respiratoryRate === undefined) {
    missingFields.push('respiratoryRate');
  } else if (obs.respiratoryRate <= 0 || obs.respiratoryRate > 80) {
    invalidFields.push('respiratoryRate');
  } else {
    const rr = obs.respiratoryRate;
    if (rr <= 8) breakdown.respiratoryRate = 3;
    else if (rr >= 9 && rr <= 11) breakdown.respiratoryRate = 1;
    else if (rr >= 12 && rr <= 20) breakdown.respiratoryRate = 0;
    else if (rr >= 21 && rr <= 24) breakdown.respiratoryRate = 2;
    else breakdown.respiratoryRate = 3; // >= 25
  }

  // 2. Oxygen Saturation (SpO2)
  if (obs.spo2 === null || obs.spo2 === undefined) {
    missingFields.push('spo2');
  } else if (obs.spo2 < 40 || obs.spo2 > 100) {
    invalidFields.push('spo2');
  } else {
    const spo2 = obs.spo2;
    if (obs.oxygenScale === 2) {
      // Scale 2 (Hypercapnic risk / COPD)
      if (spo2 <= 83) breakdown.spo2 = 3;
      else if (spo2 >= 84 && spo2 <= 85) breakdown.spo2 = 2;
      else if (spo2 >= 86 && spo2 <= 87) breakdown.spo2 = 1;
      else if (spo2 >= 88 && spo2 <= 92) breakdown.spo2 = 0;
      else if (obs.onSupplementalOxygen) {
        if (spo2 >= 93 && spo2 <= 94) breakdown.spo2 = 1;
        else if (spo2 >= 95 && spo2 <= 96) breakdown.spo2 = 2;
        else breakdown.spo2 = 3; // >= 97 on O2
      } else {
        breakdown.spo2 = 0; // >= 93 on air
      }
    } else {
      // Scale 1 (Standard)
      if (spo2 <= 91) breakdown.spo2 = 3;
      else if (spo2 >= 92 && spo2 <= 93) breakdown.spo2 = 2;
      else if (spo2 >= 94 && spo2 <= 95) breakdown.spo2 = 1;
      else breakdown.spo2 = 0; // >= 96
    }
  }

  // 3. Supplemental Oxygen
  if (obs.onSupplementalOxygen === null || obs.onSupplementalOxygen === undefined) {
    missingFields.push('onSupplementalOxygen');
  } else {
    breakdown.supplementalOxygen = obs.onSupplementalOxygen ? 2 : 0;
  }

  // 4. Systolic Blood Pressure
  if (obs.systolicBp === null || obs.systolicBp === undefined) {
    missingFields.push('systolicBp');
  } else if (obs.systolicBp < 40 || obs.systolicBp > 300) {
    invalidFields.push('systolicBp');
  } else {
    const sbp = obs.systolicBp;
    if (sbp <= 90) breakdown.systolicBp = 3;
    else if (sbp >= 91 && sbp <= 100) breakdown.systolicBp = 2;
    else if (sbp >= 101 && sbp <= 110) breakdown.systolicBp = 1;
    else if (sbp >= 111 && sbp <= 219) breakdown.systolicBp = 0;
    else breakdown.systolicBp = 3; // >= 220
  }

  // 5. Heart Rate (Pulse)
  if (obs.heartRate === null || obs.heartRate === undefined) {
    missingFields.push('heartRate');
  } else if (obs.heartRate < 20 || obs.heartRate > 260) {
    invalidFields.push('heartRate');
  } else {
    const hr = obs.heartRate;
    if (hr <= 40) breakdown.heartRate = 3;
    else if (hr >= 41 && hr <= 50) breakdown.heartRate = 1;
    else if (hr >= 51 && hr <= 90) breakdown.heartRate = 0;
    else if (hr >= 91 && hr <= 110) breakdown.heartRate = 1;
    else if (hr >= 111 && hr <= 130) breakdown.heartRate = 2;
    else breakdown.heartRate = 3; // >= 131
  }

  // 6. Consciousness (ACVPU)
  if (!obs.consciousness) {
    missingFields.push('consciousness');
  } else {
    breakdown.consciousness = obs.consciousness === 'ALERT' ? 0 : 3;
  }

  // 7. Temperature
  if (obs.temperature === null || obs.temperature === undefined) {
    missingFields.push('temperature');
  } else if (obs.temperature < 30 || obs.temperature > 45) {
    invalidFields.push('temperature');
  } else {
    const temp = obs.temperature;
    if (temp <= 35.0) breakdown.temperature = 3;
    else if (temp >= 35.1 && temp <= 36.0) breakdown.temperature = 1;
    else if (temp >= 36.1 && temp <= 38.0) breakdown.temperature = 0;
    else if (temp >= 38.1 && temp <= 39.0) breakdown.temperature = 1;
    else breakdown.temperature = 2; // >= 39.1
  }

  // Check completeness: NEWS2 requires all 7 physiological parameters
  const isComplete = missingFields.length === 0 && invalidFields.length === 0;
  const totalScore = isComplete
    ? Object.values(breakdown).reduce((sum, val) => sum + val, 0)
    : null;

  return { totalScore, breakdown, missingFields, invalidFields };
}

/**
 * Checks for clinical Emergency Red Flags that trigger immediate RED escalation
 * regardless of numerical vital scores.
 */
export function evaluateEmergencyRedFlags(
  symptoms: SymptomIntake,
  obs: VitalSignsObservations
): MatchedRule[] {
  const matched: MatchedRule[] = [];
  const textCorpus = [
    symptoms.primaryComplaint,
    symptoms.rawTranscript,
    ...(symptoms.reportedRedFlags || []),
    ...symptoms.symptoms.filter((s) => s.reportedStatus === 'present').map((s) => s.label + ' ' + s.concept),
  ]
    .join(' ')
    .toLowerCase();

  // 1. Acute Stroke Signs (FAST)
  const strokeKeywords = [
    'stroke',
    'facial droop',
    'face droop',
    'arm weakness',
    'one-sided weakness',
    'hemiplegia',
    'slurred speech',
    'aphasia',
    'sudden loss of speech',
    'ಮುಖದ ವಕ್ರತೆ', // Kannada
    'ಲಕ್ವ',
    'लकवा', // Hindi
    'चेहरे का टेढ़ापन',
  ];
  if (strokeKeywords.some((kw) => textCorpus.includes(kw))) {
    matched.push({
      ruleId: 'EMERG-STROKE-FAST',
      ruleName: 'Suspected Acute Stroke / Cerebrovascular Event (FAST Positive)',
      severity: 'RED',
      category: 'EMERGENCY_RED_FLAG',
      explanation: 'Reported facial droop, unilateral limb weakness, or acute speech impediment.',
      rationale: 'Time-critical cerebral ischemia requires immediate neuro-imaging (CT/MRI) and thrombolysis or thrombectomy window verification.',
      sourceGuideline: 'AHA/ASA Stroke Guidelines & National Stroke Protocol',
    });
  }

  // 2. Acute Coronary Syndrome / Suspected STEMI
  const cardiacKeywords = [
    'chest pain',
    'crushing chest pain',
    'retrosternal',
    'radiating to jaw',
    'radiating to left arm',
    'heart attack',
    'ಎದೆ ನೋವು', // Kannada
    'सीने में दर्द', // Hindi
  ];
  const hasDiaphoresis = textCorpus.includes('sweating') || textCorpus.includes('diaphoresis') || textCorpus.includes('ಘಾಮ');
  if (cardiacKeywords.some((kw) => textCorpus.includes(kw))) {
    matched.push({
      ruleId: 'EMERG-CARDIAC-ACS',
      ruleName: 'Suspected Acute Coronary Syndrome (ACS / STEMI)',
      severity: 'RED',
      category: 'EMERGENCY_RED_FLAG',
      explanation: 'Acute central chest pain / pressure radiating to arm/jaw or associated with diaphoresis.',
      rationale: 'High mortality risk from myocardial necrosis or malignant arrhythmias. Mandates 12-lead ECG and 24/7 Percutaneous Coronary Intervention (PCI) access.',
      sourceGuideline: 'ESC/ACC Acute Myocardial Infarction Clinical Guidance',
    });
  }

  // 3. Impending Airway Compromise or Critical Hypoxia
  if (
    (obs.spo2 !== null && obs.spo2 < 85) ||
    textCorpus.includes('stridor') ||
    textCorpus.includes('cyanosis') ||
    textCorpus.includes('unable to speak')
  ) {
    matched.push({
      ruleId: 'EMERG-RESP-CRITICAL',
      ruleName: 'Severe Respiratory Failure / Airway Compromise',
      severity: 'RED',
      category: 'EMERGENCY_RED_FLAG',
      explanation: `Critical hypoxemia (SpO2 ${obs.spo2 ? obs.spo2 + '%' : '<85%'}) or signs of airway obstruction.`,
      rationale: 'Risk of imminent respiratory arrest. Requires immediate airway stabilization, advanced oxygen delivery, and critical care standby.',
      sourceGuideline: 'BTS Emergency Oxygen & Airway Resuscitation Standards',
    });
  }

  // 4. Refractory Shock / Severe Hypotension
  if (
    (obs.systolicBp !== null && obs.systolicBp < 80) ||
    (obs.systolicBp !== null && obs.systolicBp < 90 && obs.heartRate !== null && obs.heartRate > 120)
  ) {
    matched.push({
      ruleId: 'EMERG-SHOCK-HYPOTENSION',
      ruleName: 'Profound Circulatory Shock',
      severity: 'RED',
      category: 'EMERGENCY_RED_FLAG',
      explanation: `Profound hypotension (Systolic BP ${obs.systolicBp} mmHg) indicative of circulatory failure.`,
      rationale: 'Critical end-organ hypoperfusion secondary to cardiogenic, septic, or hypovolemic shock. Requires invasive hemodynamic monitoring and ICU.',
      sourceGuideline: 'Surviving Sepsis & Shock Management Guidelines',
    });
  }

  // 5. Unresponsive / Severe Neurological Depression
  if (obs.consciousness === 'UNRESPONSIVE' || obs.consciousness === 'PAIN') {
    matched.push({
      ruleId: 'EMERG-NEURO-DEPRESSION',
      ruleName: 'Severe Depressed Level of Consciousness',
      severity: 'RED',
      category: 'EMERGENCY_RED_FLAG',
      explanation: `Patient only responds to painful stimuli or is completely unresponsive (${obs.consciousness}).`,
      rationale: 'Inability to maintain airway protective reflexes and high risk of cerebral edema or intracranial hemorrhage.',
      sourceGuideline: 'Advanced Trauma Life Support (ATLS) / GCS Standards',
    });
  }

  return matched;
}

/**
 * Determines required hospital capabilities for the matched condition
 */
export function determineRequiredCapabilities(
  category: UrgencyCategory,
  redFlags: MatchedRule[],
  news2Score: number | null
): string[] {
  const capabilities = new Set<string>();

  // Baseline triage capabilities
  capabilities.add('24/7 Emergency Department');

  for (const flag of redFlags) {
    if (flag.ruleId === 'EMERG-STROKE-FAST') {
      capabilities.add('Acute Stroke Unit');
      capabilities.add('24/7 CT / Neuro-Imaging');
      capabilities.add('Thrombolysis / Thrombectomy');
      capabilities.add('Neurology Specialist on-call');
    }
    if (flag.ruleId === 'EMERG-CARDIAC-ACS') {
      capabilities.add('24/7 Cardiac Catheterization Lab (Cath Lab)');
      capabilities.add('Cardiac Care Unit (CCU)');
      capabilities.add('Interventional Cardiology');
      capabilities.add('Primary PCI Capability');
    }
    if (flag.ruleId === 'EMERG-RESP-CRITICAL') {
      capabilities.add('Intensive Care Unit (ICU)');
      capabilities.add('High Flow Nasal Cannula / Mechanical Ventilation');
      capabilities.add('Pulmonology Specialist');
    }
    if (flag.ruleId === 'EMERG-SHOCK-HYPOTENSION') {
      capabilities.add('Intensive Care Unit (ICU)');
      capabilities.add('Blood Bank / Transfusion Service');
      capabilities.add('Invasive Arterial Monitoring');
    }
    if (flag.ruleId === 'EMERG-NEURO-DEPRESSION') {
      capabilities.add('Intensive Care Unit (ICU)');
      capabilities.add('24/7 CT / Neuro-Imaging');
      capabilities.add('Neurosurgical Coverage');
    }
  }

  // High NEWS2 without specific single organ red flag still needs ICU
  if (news2Score !== null && news2Score >= 7) {
    capabilities.add('Intensive Care Unit (ICU)');
    capabilities.add('High Dependency Unit (HDU)');
    capabilities.add('24/7 Diagnostic Pathology');
  } else if (news2Score !== null && news2Score >= 5) {
    capabilities.add('High Dependency Unit (HDU)');
    capabilities.add('Emergency Observation Ward');
  }

  return Array.from(capabilities);
}

/**
 * Main evaluation orchestrator: Evaluates symptoms, vitals, calculates NEWS2,
 * enforces safety rules, checks for missing data, and outputs an explainable decision.
 */
export function evaluateAssessment(input: EvaluationInput): TriageEvaluation {
  const { assessmentId, patientAge, symptoms, observations } = input;
  const evaluationId = `EVAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Evaluate Emergency Red Flags first
  const redFlagMatches = evaluateEmergencyRedFlags(symptoms, observations);

  // Evaluate Physiological NEWS2
  const news2 = calculateNews2Scores(observations);

  // Collect matched rules
  const allMatchedRules: MatchedRule[] = [...redFlagMatches];

  // Population caveat: Pediatric check (NEWS2 is standardized for >= 16 years)
  if (patientAge < 16) {
    allMatchedRules.push({
      ruleId: 'CAVEAT-PEDIATRIC-SCOPE',
      ruleName: 'Pediatric Population Scope Notice',
      severity: 'AMBER',
      category: 'CLINICAL_PROTOCOL',
      explanation: `Patient is ${patientAge} years old. Royal College of Physicians NEWS2 protocol is clinically validated for patients aged 16 and older.`,
      rationale: 'Pediatric vital physiological ranges differ markedly from adults. Mandatory senior medical doctor clinical review required.',
      sourceGuideline: 'RCP NEWS2 Age Guidance & PEWS Standards',
    });
  }

  // Check individual NEWS2 parameter red flag: any single score of 3 triggers AMBER / RED
  let singleParameterScore3Triggered = false;
  if (news2.breakdown) {
    for (const [param, score] of Object.entries(news2.breakdown)) {
      if (score === 3) {
        singleParameterScore3Triggered = true;
        allMatchedRules.push({
          ruleId: `NEWS2-EXTREME-${param.toUpperCase()}`,
          ruleName: `Extreme Physiological Deviation: ${param}`,
          severity: 'AMBER',
          category: 'NEWS2_PHYSIOLOGICAL',
          explanation: `The parameter '${param}' scored the maximum individual risk value of 3 in NEWS2.`,
          rationale: 'A single score of 3 indicates extreme deviation and warrants urgent clinician review regardless of aggregate score.',
          sourceGuideline: 'RCP NEWS2 Escalation Protocol',
        });
      }
    }
  }

  // Determine overall category
  let category: UrgencyCategory = 'GREEN';
  let categoryLabel = 'Low Clinical Urgency (Routine Review)';
  let riskLevel: 'LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'HIGH' | 'INCOMPLETE' = 'LOW';
  let escalationRequirement = 'Routine assessment and standard clinic care pathway.';
  let clinicalActionSummary = 'Patient does not currently exhibit physiological distress or emergency warning signs. Continue local management and standard observation.';

  // Priority 1: Emergency Red Flag -> Immediate RED
  if (redFlagMatches.length > 0) {
    category = 'RED';
    categoryLabel = 'CRITICAL EMERGENCY: Immediate Escalation Required';
    riskLevel = 'HIGH';
    escalationRequirement = 'IMMEDIATE medical review. Expedite blue-light / emergency transfer to a specialized hospital with matching capabilities.';
    clinicalActionSummary = `Emergency red flags identified (${redFlagMatches.map((r) => r.ruleName).join('; ')}). Do not delay transfer for administrative tasks.`;
  } else if (news2.totalScore !== null) {
    // Priority 2: Complete NEWS2 score
    if (news2.totalScore >= 7) {
      category = 'RED';
      categoryLabel = 'HIGH CLINICAL RISK (NEWS2 >= 7)';
      riskLevel = 'HIGH';
      escalationRequirement = 'Immediate clinical assessment by senior emergency team. Continuous monitoring and urgent ICU/HDU referral.';
      clinicalActionSummary = `Composite NEWS2 score is ${news2.totalScore} (High Risk). Patient is at critical risk of physiological collapse.`;
      allMatchedRules.push({
        ruleId: 'NEWS2-TOTAL-HIGH',
        ruleName: `Aggregate NEWS2 Score: ${news2.totalScore} (High)`,
        severity: 'RED',
        category: 'NEWS2_PHYSIOLOGICAL',
        explanation: `Total score of ${news2.totalScore} meets or exceeds high-risk threshold (>= 7).`,
        rationale: 'Associated with high 24-hour mortality and acute ICU admission rate.',
        sourceGuideline: 'RCP NEWS2 National Clinical Guideline',
      });
    } else if (news2.totalScore >= 5 || singleParameterScore3Triggered) {
      category = 'AMBER';
      categoryLabel = singleParameterScore3Triggered
        ? 'MEDIUM CLINICAL RISK (Single Parameter 3)'
        : `MEDIUM CLINICAL RISK (NEWS2 ${news2.totalScore})`;
      riskLevel = news2.totalScore >= 5 ? 'MEDIUM' : 'LOW_MEDIUM';
      escalationRequirement = 'Urgent clinical review within 30 minutes by clinical lead. Prepare for potential facility transfer if no improvement.';
      clinicalActionSummary = `Patient is clinically unstable with NEWS2 score of ${news2.totalScore}${singleParameterScore3Triggered ? ' and an extreme individual physiological parameter' : ''}. Frequent vital signs monitoring (every 15-30 min).`;
      allMatchedRules.push({
        ruleId: 'NEWS2-TOTAL-MEDIUM',
        ruleName: `Aggregate NEWS2 Score: ${news2.totalScore} (Medium / Trigger 3)`,
        severity: 'AMBER',
        category: 'NEWS2_PHYSIOLOGICAL',
        explanation: `Score ${news2.totalScore} meets medium risk criteria (5-6) or single score of 3.`,
        rationale: 'Signals moderate risk of rapid deterioration. Requires active senior clinician oversight.',
        sourceGuideline: 'RCP NEWS2 National Clinical Guideline',
      });
    } else {
      category = 'GREEN';
      categoryLabel = `LOW CLINICAL RISK (NEWS2 ${news2.totalScore})`;
      riskLevel = 'LOW';
      escalationRequirement = 'Standard vital signs monitoring (minimum every 4-6 hours). Follow local treatment protocol.';
      clinicalActionSummary = `NEWS2 score is ${news2.totalScore}. Patient demonstrates physiological stability at present assessment.`;
    }
  } else {
    // Incomplete observations: Cannot calculate standard NEWS2
    // If there were no red flags, we must flag this as GRAY (Incomplete)
    category = 'GRAY';
    categoryLabel = 'INSUFFICIENT OBSERVATION DATA';
    riskLevel = 'INCOMPLETE';
    escalationRequirement = 'Obtain missing vital sign measurements immediately to complete risk assessment.';
    clinicalActionSummary = `Missing critical observations: ${news2.missingFields.join(', ')}. Complete physiological assessment is required before low-risk can be confirmed.`;
    allMatchedRules.push({
      ruleId: 'DATA-INCOMPLETE-WARNING',
      ruleName: 'Incomplete Vital Sign Dataset',
      severity: 'GRAY',
      category: 'CLINICAL_PROTOCOL',
      explanation: `Missing required parameters: ${news2.missingFields.join(', ')}.`,
      rationale: 'Safety rule: Clinical decision support cannot assume unmeasured parameters are normal.',
      sourceGuideline: 'PulseGate Clinical Safety Governance Standards',
    });
  }

  const requiredCapabilities = determineRequiredCapabilities(
    category,
    redFlagMatches,
    news2.totalScore
  );

  return {
    id: evaluationId,
    assessmentId,
    ruleSetId: CURRENT_RULESET_ID,
    ruleSetVersion: CURRENT_RULESET_VERSION,
    evaluationTimestamp: new Date().toISOString(),
    category,
    categoryLabel,
    news2Score: news2.totalScore,
    news2RiskLevel: riskLevel,
    news2Breakdown: news2.breakdown,
    matchedRules: allMatchedRules,
    missingRequiredObservations: news2.missingFields,
    invalidObservations: news2.invalidFields,
    escalationRequirement,
    clinicalActionSummary,
    requiredFacilityCapabilities: requiredCapabilities,
  };
}
