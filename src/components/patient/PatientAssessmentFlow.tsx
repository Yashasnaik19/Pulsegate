/**
 * @license
 * PulseGate Patient Guided Triage Assessment (Module 6)
 * Step-by-step intake with Immediate Emergency Warning Guard
 */

import React, { useState } from 'react';
import type {
  Assessment,
  PatientInfo,
  SymptomIntake,
  VitalSignsObservations,
  TriageEvaluation,
  LanguageCode,
  ExtractedSymptom,
} from '../../types/index.ts';
import { evaluateAssessment } from '../../rules/rulesEngine.ts';
import { extractSymptomsWithAI } from '../../services/aiSymptomService.ts';
import { VitalSignsSimulator } from '../vitals/VitalSignsSimulator.tsx';
import {
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Mic,
  MicOff,
  Check,
  Plus,
  Trash2,
  PhoneCall,
  Activity,
  Heart,
  Wind,
  Brain,
  Thermometer,
  ShieldCheck,
} from 'lucide-react';

interface PatientAssessmentFlowProps {
  initialLanguage?: LanguageCode;
  onComplete: (assessment: Assessment, evaluation: TriageEvaluation) => void;
  onCancel: () => void;
}

// Common symptom cards with descriptions and red-flag classification
const SYMPTOM_CHOICES: Array<{
  id: string;
  concept: string;
  label: string;
  description: string;
  icon: string;
  isRedFlag: boolean;
  redFlagId?: string;
  category: 'NEURO' | 'CARDIAC' | 'RESPIRATORY' | 'GENERAL';
}> = [
  {
    id: 'FAST_STROKE',
    concept: 'facial_droop',
    label: 'Face Droop / Arm Weakness / Slurred Speech',
    description: 'Sudden weakness on one side, crooked smile, or difficulty speaking clearly (FAST signs)',
    icon: 'Brain',
    isRedFlag: true,
    redFlagId: 'EMERG-STROKE-FAST',
    category: 'NEURO',
  },
  {
    id: 'CHEST_PAIN',
    concept: 'chest_pain',
    label: 'Crushing Chest Pain / Pressure',
    description: 'Tightness or heavy pressure in the center of the chest, radiating to jaw or left arm',
    icon: 'Heart',
    isRedFlag: true,
    redFlagId: 'EMERG-CARDIAC-ACS',
    category: 'CARDIAC',
  },
  {
    id: 'DIAPHORIC_SWEAT',
    concept: 'diaphoresis',
    label: 'Profuse Cold Sweating / Clamminess',
    description: 'Sudden cold sweat or extreme perspiration accompanying chest or abdominal distress',
    icon: 'Activity',
    isRedFlag: true,
    redFlagId: 'EMERG-CARDIAC-ACS',
    category: 'CARDIAC',
  },
  {
    id: 'SEVERE_DYSPNEA',
    concept: 'dyspnea',
    label: 'Severe Shortness of Breath',
    description: 'Struggling to breathe, gasping, or unable to speak full sentences in one breath',
    icon: 'Wind',
    isRedFlag: true,
    redFlagId: 'EMERG-RESP-CRITICAL',
    category: 'RESPIRATORY',
  },
  {
    id: 'HIGH_FEVER',
    concept: 'fever',
    label: 'High Fever & Shivering (Rigors)',
    description: 'High body temperature above 38.5°C with severe chills or shivering',
    icon: 'Thermometer',
    isRedFlag: false,
    category: 'GENERAL',
  },
  {
    id: 'ACUTE_CONFUSION',
    concept: 'altered_mental_status',
    label: 'New Confusion or Drowsiness',
    description: 'Difficulty staying awake, unusual disorientation, or sudden memory lapse',
    icon: 'Brain',
    isRedFlag: true,
    redFlagId: 'EMERG-SHOCK-HYPOTENSION',
    category: 'NEURO',
  },
  {
    id: 'ABDOMINAL_PAIN',
    concept: 'abdominal_pain',
    label: 'Severe Abdominal Cramps or Pain',
    description: 'Persistent sharp or cramping pain in the belly area',
    icon: 'Activity',
    isRedFlag: false,
    category: 'GENERAL',
  },
  {
    id: 'HEADACHE',
    concept: 'headache',
    label: 'Persistent Headache',
    description: 'Throbbing, pressure, or band-like discomfort across forehead or temples',
    icon: 'Activity',
    isRedFlag: false,
    category: 'GENERAL',
  },
];

export const PatientAssessmentFlow: React.FC<PatientAssessmentFlowProps> = ({
  initialLanguage = 'en',
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Initial Info
  const [age, setAge] = useState<number>(56);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(initialLanguage);

  // Step 2: Symptoms
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [freeTextTranscript, setFreeTextTranscript] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Emergency Red Flag Immediate Alert Modal State
  const [emergencyAlertTriggered, setEmergencyAlertTriggered] = useState<boolean>(false);
  const [triggeredRedFlagName, setTriggeredRedFlagName] = useState<string>('');

  // Step 3: Additional Details
  const [onset, setOnset] = useState<string>('About 1 hour ago');
  const [duration, setDuration] = useState<string>('60 minutes');
  const [severity, setSeverity] = useState<number>(8);
  const [knownConditions, setKnownConditions] = useState<string[]>([
    'Hypertension',
  ]);
  const [knownAllergies, setKnownAllergies] = useState<string>('No known allergies');

  // Optional Vital Signs (can be simulated or entered)
  const [includeVitals, setIncludeVitals] = useState<boolean>(true);
  const [vitals, setVitals] = useState<VitalSignsObservations>({
    spo2: 96,
    heartRate: 88,
    temperature: 36.8,
    respiratoryRate: 18,
    systolicBp: 140,
    diastolicBp: 85,
    consciousness: 'ALERT',
    onSupplementalOxygen: false,
    oxygenScale: 1,
    dataSource: 'SIMULATED',
    signalQuality: 'OPTIMAL',
    measurementTimestamp: new Date().toISOString(),
  });

  // Toggle Symptom Card Selection with immediate red-flag check
  const handleToggleSymptom = (symptomItem: typeof SYMPTOM_CHOICES[0]) => {
    const isAlreadySelected = selectedSymptomIds.includes(symptomItem.id);
    let newSelected: string[];

    if (isAlreadySelected) {
      newSelected = selectedSymptomIds.filter((id) => id !== symptomItem.id);
    } else {
      newSelected = [...selectedSymptomIds, symptomItem.id];

      // Immediate Emergency Guard (Section 6)
      if (symptomItem.isRedFlag) {
        setTriggeredRedFlagName(symptomItem.label);
        setEmergencyAlertTriggered(true);
      }
    }

    setSelectedSymptomIds(newSelected);
  };

  // Run AI Extraction on text / transcript
  const handleExtractText = async () => {
    if (!freeTextTranscript.trim()) return;
    setIsExtracting(true);
    try {
      const result = await extractSymptomsWithAI(freeTextTranscript);
      // Map extracted concepts to choices if found
      const matchedChoiceIds: string[] = [...selectedSymptomIds];
      for (const extracted of result.symptoms) {
        const choice = SYMPTOM_CHOICES.find((c) => c.concept === extracted.concept);
        if (choice && !matchedChoiceIds.includes(choice.id)) {
          matchedChoiceIds.push(choice.id);
          if (choice.isRedFlag) {
            setTriggeredRedFlagName(choice.label);
            setEmergencyAlertTriggered(true);
          }
        }
      }
      setSelectedSymptomIds(matchedChoiceIds);
      if (result.onset) setOnset(result.onset);
      if (result.duration) setDuration(result.duration);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExtracting(false);
    }
  };

  // Browser speech recognition
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your symptoms.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      if (preferredLanguage === 'kn') recognition.lang = 'kn-IN';
      else if (preferredLanguage === 'hi') recognition.lang = 'hi-IN';
      else recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setFreeTextTranscript((prev) => (prev ? `${prev} ${text}` : text));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Compile full assessment & run deterministic rules
  const handleFinalSubmit = () => {
    const assessmentId = `PG-2026-${Math.floor(100 + Math.random() * 900)}`;

    // Build structured extracted symptoms
    const structuredSymptoms: ExtractedSymptom[] = selectedSymptomIds.map((id) => {
      const choice = SYMPTOM_CHOICES.find((c) => c.id === id)!;
      return {
        concept: choice.concept,
        label: choice.label,
        reportedStatus: 'present',
        evidenceText: choice.description,
        confidence: 0.99,
      };
    });

    const reportedRedFlags: string[] = [];
    selectedSymptomIds.forEach((id) => {
      const choice = SYMPTOM_CHOICES.find((c) => c.id === id);
      if (choice?.isRedFlag && choice.redFlagId) {
        reportedRedFlags.push(choice.redFlagId);
      }
    });

    const primaryComplaint =
      structuredSymptoms.length > 0
        ? structuredSymptoms[0].label
        : freeTextTranscript.slice(0, 60) || 'Unspecified symptoms';

    const symptomIntake: SymptomIntake = {
      rawTranscript: freeTextTranscript || primaryComplaint,
      transcriptLanguage: preferredLanguage,
      intakeMethod: freeTextTranscript ? 'TEXT_INPUT' : 'PRESET_SCENARIO',
      primaryComplaint,
      onset,
      duration,
      severityScale: severity,
      symptoms: structuredSymptoms,
      reportedRedFlags,
      uncertainItems: [],
      missingInformation: [],
      humanConfirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: 'Patient Self-Intake',
    };

    const patientInfo: PatientInfo = {
      id: `PT-${Date.now().toString().slice(-4)}`,
      displayId: `PT-2026-${Date.now().toString().slice(-4)}`,
      name: 'Self-Assessed Patient',
      age,
      gender,
      ageBand: age < 16 ? 'PEDIATRIC' : age >= 65 ? 'GERIATRIC' : 'ADULT',
      preferredLanguage,
      clinicId: 'SELF-INTAKE',
      clinicName: 'Patient Self-Service Portal',
      allergies: knownAllergies ? [knownAllergies] : [],
      medicalHistory: knownConditions,
      currentMedications: [],
    };

    // Run deterministic rules engine
    const evaluation = evaluateAssessment({
      assessmentId,
      patientAge: age,
      symptoms: symptomIntake,
      observations: vitals,
    });

    const fullAssessment: Assessment = {
      id: assessmentId,
      displayId: assessmentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clinicId: patientInfo.clinicId,
      clinicName: patientInfo.clinicName,
      creatorName: 'Self-Assessed Patient',
      creatorRole: 'Patient Portal',
      workflowStatus: 'EVALUATION_COMPLETED',
      patient: patientInfo,
      symptoms: symptomIntake,
      observations: vitals,
      evaluation,
      evaluationHistory: [evaluation],
      dataProvenance: vitals.dataSource,
      isSimulatedDemo: true,
    };

    onComplete(fullAssessment, evaluation);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Step Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    currentStep === stepNum
                      ? 'bg-[#0f766e] text-white shadow-xs'
                      : currentStep > stepNum
                      ? 'bg-teal-100 text-[#0f766e]'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {currentStep > stepNum ? '✓' : stepNum}
                </div>
                {stepNum < 4 && <div className="w-8 sm:w-16 h-0.5 bg-slate-200" />}
              </React.Fragment>
            ))}
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500">
              Step {currentStep} of 4:
            </span>
            <span className="text-xs font-bold text-slate-800 ml-1.5">
              {currentStep === 1
                ? 'Initial Info'
                : currentStep === 2
                ? 'Your Symptoms'
                : currentStep === 3
                ? 'Additional Details'
                : 'Review & Guidance'}
            </span>
          </div>
        </div>
      </div>

      {/* Immediate Emergency Warning Modal (Section 6) */}
      {emergencyAlertTriggered && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-rose-500 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-rose-100 text-rose-800 inline-block font-mono">
                CRITICAL WARNING DETECTED
              </span>
              <h3 className="text-2xl font-extrabold text-[#12304a] font-heading">
                Potential Life-Threatening Emergency
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                You reported symptoms of <strong>{triggeredRedFlagName}</strong>. This can indicate an
                immediate medical emergency (such as an acute stroke, heart attack, or critical airway issue).
              </p>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-left text-xs space-y-1.5 text-rose-950">
              <strong>Emergency Guidance:</strong>
              <p>
                1. <strong>Do not wait</strong> to complete remaining questions if you feel endangered.
              </p>
              <p>
                2. Call <strong>112 / 108</strong> immediately for an emergency ambulance with life-support.
              </p>
              <p>
                3. Go directly to a hospital equipped with 24/7 emergency resuscitation capabilities.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEmergencyAlertTriggered(false);
                  // Fast-track directly to final evaluation & destination options!
                  handleFinalSubmit();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <span>Find Emergency Hospitals Right Now &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => setEmergencyAlertTriggered(false)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Continue Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Initial Information */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-[#12304a] font-heading">
              Tell us a little about who this assessment is for
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Age and basic details help us apply the appropriate clinical safety guidelines. We never collect names or sensitive IDs here.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            {/* Age */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Age of Patient (Years)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
                className="health-input w-full p-3 text-sm font-semibold"
                placeholder="e.g. 56"
              />
              <span className="text-[11px] text-slate-400">
                {age < 16 ? '⚠️ Pediatric guidance scope applies' : 'Adult physiological protocol'}
              </span>
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="health-input w-full p-3 text-sm font-semibold"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Preferred Language
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as any)}
                className="health-input w-full p-3 text-sm font-semibold"
              >
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f766e] hover:bg-[#0d9488] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <span>Continue to Symptoms</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Symptoms Selection */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-[#12304a] font-heading">
              Select symptoms you or the patient are experiencing
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tap the cards below that match how you feel, or type / speak your description in the box.
            </p>
          </div>

          {/* Quick Voice / Text Input Box */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                rows={2}
                placeholder={
                  preferredLanguage === 'kn'
                    ? 'ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಧ್ವನಿ ಬಳಸಿ...'
                    : preferredLanguage === 'hi'
                    ? 'अपने लक्षण यहाँ लिखें या बोलकर बताएं...'
                    : 'Optionally describe your symptoms in your own words (e.g. sudden chest tightness and cold sweat)...'
                }
                value={freeTextTranscript}
                onChange={(e) => setFreeTextTranscript(e.target.value)}
                className="health-input w-full p-3 text-xs pr-24"
              />
              <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  title="Speak symptoms"
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-teal-600" />}
                  <span>{isListening ? 'Listening' : 'Speak'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExtractText}
                  disabled={!freeTextTranscript.trim() || isExtracting}
                  className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-semibold"
                >
                  {isExtracting ? 'Extracting...' : 'Parse'}
                </button>
              </div>
            </div>
          </div>

          {/* Symptom Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SYMPTOM_CHOICES.map((item) => {
              const isSelected = selectedSymptomIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleSymptom(item)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-1.5 select-none ${
                    isSelected
                      ? item.isRedFlag
                        ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs'
                        : 'bg-teal-50 border-teal-500 text-teal-950 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold block">{item.label}</strong>
                    {item.isRedFlag && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                        Urgent Flag
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={selectedSymptomIds.length === 0 && !freeTextTranscript.trim()}
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f766e] hover:bg-[#0d9488] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <span>Continue to Additional Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Additional Details & Optional Vitals */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-[#12304a] font-heading">
              Additional Details & Timing
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Time elapsed since symptom onset is vital for emergency conditions like stroke and heart attacks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">When did it start? (Onset)</label>
              <input
                type="text"
                value={onset}
                onChange={(e) => setOnset(e.target.value)}
                className="health-input w-full p-2.5"
                placeholder="e.g. 45 minutes ago"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Symptom Severity (1 to 10)</label>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value, 10))}
                  className="w-full accent-teal-600"
                />
                <span className="font-mono text-sm font-bold text-teal-800 w-8 text-right">
                  {severity}/10
                </span>
              </div>
            </div>
          </div>

          {/* Optional Vitals Simulation Toggle */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-xs font-semibold text-slate-800 block">
                  Physiological Vital Signs (NEWS2 Scoring)
                </strong>
                <p className="text-[11px] text-slate-500">
                  Simulate or enter vital measurements. If unavailable, PulseGate safely identifies missing data.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-teal-800">
                <input
                  type="checkbox"
                  checked={includeVitals}
                  onChange={(e) => setIncludeVitals(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Include Vitals</span>
              </label>
            </div>

            {includeVitals && (
              <VitalSignsSimulator observations={vitals} onChange={setVitals} />
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f766e] hover:bg-[#0d9488] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <span>Review Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review and Submit */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-[#12304a] font-heading">
              Review Your Information Before Evaluating
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify your reported symptoms and details. Our deterministic rules engine will evaluate care urgency.
            </p>
          </div>

          {/* Summary Box */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Patient Age</span>
                <strong className="text-slate-900">{age} years ({gender})</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Onset</span>
                <strong className="text-slate-900">{onset}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Severity</span>
                <strong className="text-slate-900">{severity} / 10</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Language</span>
                <strong className="text-slate-900">{preferredLanguage.toUpperCase()}</strong>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] mb-1">Reported Symptoms:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedSymptomIds.map((id) => {
                  const choice = SYMPTOM_CHOICES.find((c) => c.id === id);
                  if (!choice) return null;
                  return (
                    <span
                      key={id}
                      className={`px-2.5 py-1 rounded-md font-medium border text-xs ${
                        choice.isRedFlag
                          ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                          : 'bg-white text-slate-800 border-slate-200'
                      }`}
                    >
                      {choice.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleFinalSubmit}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#0f766e] hover:bg-[#0d9488] text-white text-xs font-bold shadow-md transition-colors"
            >
              <span>Evaluate Guidance & Find Destinations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
