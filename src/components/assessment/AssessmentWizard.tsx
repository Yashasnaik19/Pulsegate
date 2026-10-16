/**
 * @license
 * PulseGate Guided Patient Assessment & Referral Wizard
 * Full End-to-End Workflow: Setup -> Symptoms -> Vitals -> Rules -> Matching -> Referral
 */

import React, { useState } from 'react';
import type {
  Assessment,
  PatientInfo,
  SymptomIntake,
  VitalSignsObservations,
  TriageEvaluation,
  Facility,
  FacilityMatchResult,
  Referral,
} from '../../types/index.ts';
import { SEEDED_SCENARIOS } from '../../data/seedScenarios.ts';
import { evaluateAssessment } from '../../rules/rulesEngine.ts';
import { matchAndRankFacilities } from '../../matching/facilityMatcher.ts';
import { store } from '../../services/storeService.ts';
import { SymptomIntakeWorkspace } from '../symptoms/SymptomIntakeWorkspace.tsx';
import { VitalSignsSimulator } from '../vitals/VitalSignsSimulator.tsx';
import { FacilitiesMap } from '../map/FacilitiesMap.tsx';
import { Triage3DVisualizer } from '../three/Triage3DVisualizer.tsx';
import { ClinicalHandoverSummary } from '../handover/ClinicalHandoverSummary.tsx';
import {
  UserCheck,
  Activity,
  FileCheck2,
  MapPin,
  Send,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface AssessmentWizardProps {
  initialAssessment?: Assessment;
  onFinish?: (assessment: Assessment, referral?: Referral) => void;
  onCancel?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export const AssessmentWizard: React.FC<AssessmentWizardProps> = ({
  initialAssessment,
  onFinish,
  onCancel,
}) => {
  const activeUser = store.getActiveUser();

  // Step 1: Patient Setup
  const [patient, setPatient] = useState<PatientInfo>(
    initialAssessment?.patient || {
      id: `PT-${Date.now().toString().slice(-4)}`,
      displayId: `PT-2026-${Date.now().toString().slice(-4)}`,
      name: 'Sunita Sharma (Synthetic)',
      age: 64,
      gender: 'FEMALE',
      ageBand: 'ADULT',
      preferredLanguage: 'en',
      clinicId: activeUser.clinicId,
      clinicName: activeUser.clinicName,
      allergies: ['Penicillin'],
      medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
      currentMedications: ['Amlodipine 5mg'],
      contactNumber: '+91 98450 11223',
    }
  );

  // Step 2: Symptoms
  const [symptoms, setSymptoms] = useState<SymptomIntake>(
    initialAssessment?.symptoms || {
      rawTranscript:
        'Patient was having breakfast when she suddenly noticed right-sided facial drooping, right arm weakness, and slurred speech.',
      transcriptLanguage: 'en',
      intakeMethod: 'TEXT_INPUT',
      primaryComplaint: 'Sudden right facial droop and right arm weakness',
      onset: '90 minutes ago',
      duration: '1.5 hours',
      severityScale: 9,
      symptoms: [
        {
          concept: 'facial_droop',
          label: 'Right Facial Droop',
          reportedStatus: 'present',
          evidenceText: 'right-sided facial drooping',
          confidence: 0.98,
        },
        {
          concept: 'arm_weakness',
          label: 'Right Arm Weakness',
          reportedStatus: 'present',
          evidenceText: 'right arm weakness',
          confidence: 0.96,
        },
        {
          concept: 'speech_slur',
          label: 'Slurred Speech',
          reportedStatus: 'present',
          evidenceText: 'slurred speech',
          confidence: 0.95,
        },
      ],
      reportedRedFlags: ['EMERG-STROKE-FAST'],
      uncertainItems: [],
      missingInformation: [],
      humanConfirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: activeUser.name,
    }
  );

  // Step 3: Observations
  const [observations, setObservations] = useState<VitalSignsObservations>(
    initialAssessment?.observations || {
      spo2: 97,
      heartRate: 84,
      temperature: 36.9,
      respiratoryRate: 16,
      systolicBp: 168,
      diastolicBp: 96,
      consciousness: 'ALERT',
      onSupplementalOxygen: false,
      oxygenScale: 1,
      dataSource: 'SIMULATED',
      signalQuality: 'OPTIMAL',
      measurementTimestamp: new Date().toISOString(),
      notes: 'Initial frontline assessment vitals.',
    }
  );

  // Step 4: Triage Evaluation
  const [evaluation, setEvaluation] = useState<TriageEvaluation | undefined>(
    initialAssessment?.evaluation
  );

  // Step 5: Facility Matching
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [matchResults, setMatchResults] = useState<FacilityMatchResult[]>([]);

  // Step 6: Referral
  const [createdReferral, setCreatedReferral] = useState<Referral | null>(null);
  const [showHandoverModal, setShowHandoverModal] = useState<boolean>(false);
  const [referralReason, setReferralReason] = useState<string>(
    'Emergency specialist escalation for time-critical stroke imaging & thrombolysis pathway.'
  );

  // Current Step
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Load a synthetic preset scenario
  const handleLoadScenario = (scenarioId: string) => {
    const sc = SEEDED_SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return;

    setPatient(sc.syntheticPatient);
    setSymptoms({
      rawTranscript: sc.syntheticSymptoms.rawTranscript,
      transcriptLanguage: sc.syntheticSymptoms.language,
      intakeMethod: 'PRESET_SCENARIO',
      primaryComplaint: sc.syntheticSymptoms.primaryComplaint,
      onset: sc.syntheticSymptoms.onset,
      duration: sc.syntheticSymptoms.duration,
      severityScale: sc.syntheticSymptoms.severity,
      symptoms: sc.syntheticSymptoms.symptoms,
      reportedRedFlags: sc.syntheticSymptoms.redFlags,
      uncertainItems: [],
      missingInformation: [],
      humanConfirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: activeUser.name,
    });
    setObservations(sc.syntheticObservations);
    setEvaluation(undefined);
    setSelectedFacility(null);
  };

  // Run Rules Engine
  const runEvaluation = () => {
    const assessmentId = initialAssessment?.id || `PG-2026-000${Math.floor(100 + Math.random() * 900)}`;
    const result = evaluateAssessment({
      assessmentId,
      patientAge: patient.age,
      symptoms,
      observations,
    });

    setEvaluation(result);

    // Run Facility Matching for this evaluation
    const facilities = store.getFacilities();
    const matches = matchAndRankFacilities(facilities, {
      requiredCapabilities: result.requiredFacilityCapabilities,
      patientUrgencyCategory: result.category,
    });

    setMatchResults(matches);
    const topEligible = matches.find((m) => m.isEligible);
    if (topEligible) {
      setSelectedFacility(topEligible.facility);
    }
  };

  // Save / Submit Referral
  const handleSubmitReferral = () => {
    if (!selectedFacility || !evaluation) return;

    const assessmentId = initialAssessment?.id || `PG-2026-000${Math.floor(100 + Math.random() * 900)}`;
    const referralId = `REF-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRef: Referral = {
      id: referralId,
      displayId: referralId,
      assessmentId,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      referringClinic: patient.clinicName,
      referringClinician: activeUser.name,
      destinationFacilityId: selectedFacility.id,
      destinationFacilityName: selectedFacility.name,
      priority: evaluation.category,
      status: 'SENT',
      reasonForReferral: referralReason,
      requiredCapabilities: evaluation.requiredFacilityCapabilities,
      provisionalSummary: symptoms.primaryComplaint,
      handoverSummaryText: `Referral to ${selectedFacility.name}. Urgency: ${evaluation.category}. Matched: ${evaluation.matchedRules.map((r) => r.ruleName).join(', ')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `EVT-${Date.now()}-1`,
          timestamp: new Date().toISOString(),
          status: 'DRAFT',
          actor: activeUser.name,
          role: activeUser.role,
          note: 'Referral draft created',
          isSimulated: true,
        },
        {
          id: `EVT-${Date.now()}-2`,
          timestamp: new Date().toISOString(),
          status: 'SENT',
          actor: activeUser.name,
          role: activeUser.role,
          note: `Referral submitted electronically to ${selectedFacility.name}`,
          isSimulated: true,
        },
      ],
    };

    const newAssessment: Assessment = {
      id: assessmentId,
      displayId: assessmentId,
      createdAt: initialAssessment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clinicId: patient.clinicId,
      clinicName: patient.clinicName,
      creatorName: activeUser.name,
      creatorRole: activeUser.role,
      workflowStatus: 'REFERRED',
      patient,
      symptoms,
      observations,
      evaluation,
      evaluationHistory: evaluation ? [evaluation] : [],
      referralId: newRef.id,
      dataProvenance: observations.dataSource,
      isSimulatedDemo: true,
    };

    store.saveAssessment(newAssessment);
    store.createReferral(newRef);
    setCreatedReferral(newRef);

    // Automatically trigger simulated acknowledgement after 4 seconds!
    setTimeout(() => {
      store.simulateAcknowledgement(newRef.id, true);
    }, 4000);

    if (onFinish) {
      onFinish(newAssessment, newRef);
    }
  };

  const stepsList = [
    { num: 1, label: 'Patient Setup' },
    { num: 2, label: 'Symptoms Intake' },
    { num: 3, label: 'Vitals & Observations' },
    { num: 4, label: 'Triage Rules' },
    { num: 5, label: 'Facility Match' },
    { num: 6, label: 'Referral & Handover' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Wizard Navigation Steps Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between overflow-x-auto pb-1 gap-2">
          {stepsList.map((st) => {
            const isActive = currentStep === st.num;
            const isCompleted = currentStep > st.num;

            return (
              <button
                key={st.num}
                onClick={() => {
                  if (st.num <= 3 || evaluation) {
                    setCurrentStep(st.num as WizardStep);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    isActive ? 'bg-white text-teal-700' : isCompleted ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isCompleted ? '✓' : st.num}
                </span>
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Patient Setup & Scenario Selection */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Step 1: Patient Demographic & Scenario Initialization
              </h2>
              <p className="text-xs text-slate-500">
                Choose a synthetic patient scenario or enter details manually. Fully software-only.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Referring Facility:</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                {patient.clinicName}
              </span>
            </div>
          </div>

          {/* Quick Scenario Picker Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Load Pre-Configured Synthetic Case Scenarios:</span>
              </span>
              <span className="text-[11px] text-slate-500">14 clinical scenarios available</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {SEEDED_SCENARIOS.slice(0, 6).map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleLoadScenario(sc.id)}
                  className="p-2.5 rounded-lg text-left bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 transition-all space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {sc.code}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        sc.expectedTriageCategory === 'RED'
                          ? 'bg-rose-100 text-rose-800'
                          : sc.expectedTriageCategory === 'AMBER'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {sc.expectedTriageCategory}
                    </span>
                  </div>
                  <strong className="text-xs font-semibold text-slate-900 block truncate">
                    {sc.title}
                  </strong>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{sc.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Patient Details Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Patient Name</label>
              <input
                type="text"
                value={patient.name}
                onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Age (Years)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={patient.age}
                onChange={(e) =>
                  setPatient({
                    ...patient,
                    age: parseInt(e.target.value, 10) || 0,
                    ageBand: (parseInt(e.target.value, 10) || 0) < 16 ? 'PEDIATRIC' : 'ADULT',
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Gender</label>
              <select
                value={patient.gender}
                onChange={(e) => setPatient({ ...patient, gender: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Preferred Language</label>
              <select
                value={patient.preferredLanguage}
                onChange={(e) => setPatient({ ...patient, preferredLanguage: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Continue to Symptoms Intake</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Symptoms Intake */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <SymptomIntakeWorkspace symptoms={symptoms} onChange={setSymptoms} />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Patient Info</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Continue to Vital Signs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Vitals & Observations */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <VitalSignsSimulator observations={observations} onChange={setObservations} />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Symptoms</span>
            </button>

            <button
              type="button"
              onClick={() => {
                runEvaluation();
                setCurrentStep(4);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <span>Evaluate Triage Rules</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Deterministic Triage Rule Evaluation & 3D Anatomy Visualizer */}
      {currentStep === 4 && evaluation && (
        <div className="space-y-6">
          {/* Urgency Status Banner */}
          <div
            className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
              evaluation.category === 'RED'
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : evaluation.category === 'AMBER'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : evaluation.category === 'GREEN'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-slate-100 border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg uppercase tracking-tight">
                    {evaluation.categoryLabel}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/80 border font-bold">
                    {evaluation.ruleSetVersion}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{evaluation.clinicalActionSummary}</p>
                <div className="text-xs font-bold text-slate-900 pt-1">
                  Required Action: {evaluation.escalationRequirement}
                </div>
              </div>
            </div>

            {evaluation.news2Score !== null && (
              <div className="bg-white/90 p-3 rounded-xl border border-slate-200 text-center shrink-0">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">NEWS2 Total</span>
                <span className="text-2xl font-mono font-extrabold text-slate-900">{evaluation.news2Score}</span>
                <span className="text-[10px] text-slate-500 block">Risk: {evaluation.news2RiskLevel}</span>
              </div>
            )}
          </div>

          {/* 3D Anatomy & Organ Heatmap Visualizer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Interactive 3D Anatomical Digital Twin & Triage Focus
              </h3>
              <span className="text-xs text-slate-500">
                Pulse coupled to patient heart rate ({observations.heartRate || 80} bpm)
              </span>
            </div>

            <Triage3DVisualizer
              urgencyCategory={evaluation.category}
              primaryCondition={
                evaluation.matchedRules.some((r) => r.ruleId.includes('STROKE'))
                  ? 'NEURO_STROKE'
                  : evaluation.matchedRules.some((r) => r.ruleId.includes('CARDIAC'))
                  ? 'CARDIAC'
                  : evaluation.matchedRules.some((r) => r.ruleId.includes('RESP'))
                  ? 'RESPIRATORY'
                  : 'GENERAL'
              }
              patientHeartRate={observations.heartRate || 80}
              className="h-[440px]"
            />
          </div>

          {/* Matched Rules Breakdown Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Deterministic Rule Matches & Clinical Rationale
            </h4>

            {evaluation.matchedRules.length === 0 ? (
              <p className="text-xs text-slate-500">No emergency red flags triggered. Standard baseline assessment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evaluation.matchedRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">[{rule.ruleId}]</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        {rule.severity}
                      </span>
                    </div>
                    <strong className="text-slate-800 block">{rule.ruleName}</strong>
                    <p className="text-slate-600">{rule.explanation}</p>
                    <p className="text-slate-500 italic text-[11px] pt-1 border-t border-slate-200/80">
                      Rationale: {rule.rationale}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Vitals</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Match Healthcare Facilities</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Facility Matching & Interactive Map */}
      {currentStep === 5 && evaluation && (
        <div className="space-y-6">
          {/* Required Capabilities Notice */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm text-xs">
            <div>
              <span className="text-teal-400 font-bold block text-[11px] uppercase tracking-wider">
                Mandatory Capabilities Required for this Referral
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {evaluation.requiredFacilityCapabilities.map((cap, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-medium flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    <span>{cap}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right text-slate-400 text-[11px]">
              Strict Eligibility Rule:<br />
              Proximity does NOT compensate for missing capabilities.
            </div>
          </div>

          {/* Interactive Facilities Map */}
          <FacilitiesMap
            facilities={store.getFacilities()}
            matchResults={matchResults}
            selectedFacilityId={selectedFacility?.id}
            onSelectFacility={(fac) => setSelectedFacility(fac)}
          />

          {/* Top Ranked Candidate Details */}
          {selectedFacility && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-700">Selected Receiving Destination:</span>
                  <h3 className="text-base font-bold text-slate-900">{selectedFacility.name}</h3>
                  <p className="text-xs text-slate-500">{selectedFacility.address}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">
                    ~{selectedFacility.estimatedDriveMinutes} mins ({selectedFacility.distanceKm} km)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Census updated: {selectedFacility.dataFreshnessMinutes}m ago
                  </span>
                </div>
              </div>

              {/* Department Beds breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                {selectedFacility.departments.map((dept, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 text-[11px] block">{dept.name}</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {dept.availableBeds} / {dept.totalBeds} Beds Available
                    </strong>
                    <span
                      className={`text-[10px] font-bold block ${
                        dept.availableBeds > 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      Status: {dept.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Triage Rules</span>
            </button>

            <button
              type="button"
              disabled={!selectedFacility}
              onClick={() => setCurrentStep(6)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Prepare Referral & Handover</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Referral Confirmation & Handover Document */}
      {currentStep === 6 && evaluation && selectedFacility && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-heading">
                  Step 6: Referral Handover & Electronic Dispatch
                </h3>
                <p className="text-xs text-slate-500">
                  Review structured clinical handover and transmit referral to {selectedFacility.name}
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                Destination: {selectedFacility.displayId}
              </span>
            </div>

            <div>
              <label className="font-semibold text-xs text-slate-700 block mb-1">
                Clinical Referral Justification
              </label>
              <textarea
                rows={2}
                value={referralReason}
                onChange={(e) => setReferralReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 font-sans"
              />
            </div>

            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 text-xs space-y-2">
              <div className="font-bold text-teal-950">Referral Verification Checklist:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Confirmed symptoms documented</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>NEWS2 & Red flag evaluation complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Mandatory capabilities satisfied by destination</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Simulated acknowledgement engine ready</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowHandoverModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Preview Handover Summary (SBAR)
              </button>

              <button
                type="button"
                onClick={handleSubmitReferral}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Submit Referral to Receiving Facility</span>
              </button>
            </div>
          </div>

          {/* Embedded Handover Summary Document */}
          <div className="mt-6">
            <ClinicalHandoverSummary
              assessment={{
                id: initialAssessment?.id || 'PG-2026-000100',
                displayId: initialAssessment?.displayId || 'PG-2026-000100',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                clinicId: patient.clinicId,
                clinicName: patient.clinicName,
                creatorName: activeUser.name,
                creatorRole: activeUser.role,
                workflowStatus: 'REFERRAL_DRAFT',
                patient,
                symptoms,
                observations,
                evaluation,
                evaluationHistory: evaluation ? [evaluation] : [],
                dataProvenance: observations.dataSource,
                isSimulatedDemo: true,
              }}
              referral={
                createdReferral || {
                  id: 'REF-2026-PENDING',
                  displayId: 'REF-2026-PENDING',
                  assessmentId: 'PG-2026-000100',
                  patientId: patient.id,
                  patientName: patient.name,
                  patientAge: patient.age,
                  referringClinic: patient.clinicName,
                  referringClinician: activeUser.name,
                  destinationFacilityId: selectedFacility.id,
                  destinationFacilityName: selectedFacility.name,
                  priority: evaluation.category,
                  status: 'DRAFT',
                  reasonForReferral: referralReason,
                  requiredCapabilities: evaluation.requiredFacilityCapabilities,
                  provisionalSummary: symptoms.primaryComplaint,
                  handoverSummaryText: 'Draft Handover',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  timeline: [],
                }
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};
