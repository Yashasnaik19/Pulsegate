import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNews2Scores,
  evaluateAssessment,
  evaluateEmergencyRedFlags,
  CURRENT_RULESET_VERSION,
} from './rulesEngine.ts';
import type { SymptomIntake, VitalSignsObservations } from '../types/index.ts';

const baselineSymptomTemplate: SymptomIntake = {
  rawTranscript: 'Patient complaining of mild cough for two days.',
  transcriptLanguage: 'en',
  intakeMethod: 'TEXT_INPUT',
  primaryComplaint: 'Mild cough',
  onset: '2 days ago',
  duration: '48 hours',
  severityScale: 2,
  symptoms: [
    {
      concept: 'cough',
      label: 'Cough',
      reportedStatus: 'present',
      evidenceText: 'mild cough',
      confidence: 0.95,
    },
  ],
  reportedRedFlags: [],
  uncertainItems: [],
  missingInformation: [],
  humanConfirmed: true,
};

const normalVitalSigns: VitalSignsObservations = {
  spo2: 98,
  heartRate: 72,
  temperature: 36.8,
  respiratoryRate: 14,
  systolicBp: 120,
  diastolicBp: 80,
  consciousness: 'ALERT',
  onSupplementalOxygen: false,
  oxygenScale: 1,
  dataSource: 'SIMULATED',
  signalQuality: 'OPTIMAL',
  measurementTimestamp: new Date().toISOString(),
};

test('NEWS2 calculation: Normal physiological vitals score zero (0)', () => {
  const result = calculateNews2Scores(normalVitalSigns);
  assert.equal(result.totalScore, 0);
  assert.equal(result.missingFields.length, 0);
  assert.equal(result.invalidFields.length, 0);
  assert.equal(result.breakdown.respiratoryRate, 0);
  assert.equal(result.breakdown.spo2, 0);
  assert.equal(result.breakdown.systolicBp, 0);
  assert.equal(result.breakdown.heartRate, 0);
  assert.equal(result.breakdown.consciousness, 0);
  assert.equal(result.breakdown.temperature, 0);
});

test('NEWS2 calculation: Extreme physiological deviations score correctly', () => {
  const severeVitals: VitalSignsObservations = {
    ...normalVitalSigns,
    respiratoryRate: 26, // 3 pts
    spo2: 89, // 3 pts
    onSupplementalOxygen: true, // 2 pts
    systolicBp: 88, // 3 pts
    heartRate: 135, // 3 pts
    consciousness: 'CONFUSION_NEW', // 3 pts
    temperature: 34.8, // 3 pts
  };
  const result = calculateNews2Scores(severeVitals);
  assert.equal(result.breakdown.respiratoryRate, 3);
  assert.equal(result.breakdown.spo2, 3);
  assert.equal(result.breakdown.supplementalOxygen, 2);
  assert.equal(result.breakdown.systolicBp, 3);
  assert.equal(result.breakdown.heartRate, 3);
  assert.equal(result.breakdown.consciousness, 3);
  assert.equal(result.breakdown.temperature, 3);
  // Total: 3+3+2+3+3+3+3 = 20
  assert.equal(result.totalScore, 20);
});

test('Safety rule: Incomplete vital signs return null totalScore and list missing fields', () => {
  const incompleteVitals: VitalSignsObservations = {
    ...normalVitalSigns,
    spo2: null,
    temperature: null,
  };
  const result = calculateNews2Scores(incompleteVitals);
  assert.equal(result.totalScore, null);
  assert.ok(result.missingFields.includes('spo2'));
  assert.ok(result.missingFields.includes('temperature'));
});

test('Emergency red flag: FAST Stroke triggers immediate RED category even with normal vitals', () => {
  const strokeSymptoms: SymptomIntake = {
    ...baselineSymptomTemplate,
    rawTranscript: 'Patient has sudden right-sided facial droop and slurred speech.',
    primaryComplaint: 'Facial droop and speech difficulty',
  };

  const evaluation = evaluateAssessment({
    assessmentId: 'TEST-001',
    patientAge: 62,
    symptoms: strokeSymptoms,
    observations: normalVitalSigns,
  });

  assert.equal(evaluation.category, 'RED');
  assert.ok(evaluation.matchedRules.some((r) => r.ruleId === 'EMERG-STROKE-FAST'));
  assert.ok(evaluation.requiredFacilityCapabilities.includes('Acute Stroke Unit'));
  assert.ok(evaluation.requiredFacilityCapabilities.includes('24/7 CT / Neuro-Imaging'));
  assert.equal(evaluation.ruleSetVersion, CURRENT_RULESET_VERSION);
});

test('Emergency red flag: Multilingual Kannada / Hindi keywords detected', () => {
  const kannadaCardiacSymptoms: SymptomIntake = {
    ...baselineSymptomTemplate,
    rawTranscript: 'ರೋಗಿಗೆ ತೀವ್ರ ಎದೆ ನೋವು ಮತ್ತು ಬೆವರು ಬರುತ್ತಿದೆ', // severe chest pain and sweating
    primaryComplaint: 'ಎದೆ ನೋವು (Chest pain)',
  };

  const flags = evaluateEmergencyRedFlags(kannadaCardiacSymptoms, normalVitalSigns);
  assert.ok(flags.some((f) => f.ruleId === 'EMERG-CARDIAC-ACS'));
});

test('Evaluation of incomplete dataset produces GRAY urgency category with missing fields', () => {
  const incompleteVitals: VitalSignsObservations = {
    ...normalVitalSigns,
    respiratoryRate: null,
    systolicBp: null,
  };

  const evaluation = evaluateAssessment({
    assessmentId: 'TEST-002',
    patientAge: 45,
    symptoms: baselineSymptomTemplate,
    observations: incompleteVitals,
  });

  assert.equal(evaluation.category, 'GRAY');
  assert.equal(evaluation.news2Score, null);
  assert.ok(evaluation.missingRequiredObservations.includes('respiratoryRate'));
  assert.ok(evaluation.missingRequiredObservations.includes('systolicBp'));
});

test('Pediatric population check flags appropriate caveat', () => {
  const evaluation = evaluateAssessment({
    assessmentId: 'TEST-003',
    patientAge: 8,
    symptoms: baselineSymptomTemplate,
    observations: normalVitalSigns,
  });

  assert.ok(evaluation.matchedRules.some((r) => r.ruleId === 'CAVEAT-PEDIATRIC-SCOPE'));
});
