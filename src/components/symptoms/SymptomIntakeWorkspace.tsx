/**
 * @license
 * PulseGate Multilingual Symptom Intake Workspace
 * Module 10 - Speech-to-Text, Multilingual Intake (EN, KN, HI), AI Extraction & Clinician Confirmation
 */

import React, { useState } from 'react';
import type { SymptomIntake, LanguageCode, ExtractedSymptom } from '../../types/index.ts';
import { extractSymptomsWithAI } from '../../services/aiSymptomService.ts';
import { Mic, MicOff, Sparkles, CheckCircle2, AlertCircle, Globe2, Plus, Trash2 } from 'lucide-react';

interface SymptomIntakeWorkspaceProps {
  symptoms: SymptomIntake;
  onChange: (updated: SymptomIntake) => void;
  className?: string;
}

export const SymptomIntakeWorkspace: React.FC<SymptomIntakeWorkspaceProps> = ({
  symptoms,
  onChange,
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeLang, setActiveLang] = useState<LanguageCode>(symptoms.transcriptLanguage || 'en');

  // Quick preset voice transcripts for rapid demonstration
  const DEMO_TRANSCRIPTS = [
    {
      lang: 'en' as const,
      label: 'Stroke (EN)',
      text: 'Patient was having breakfast when she suddenly had right-sided facial drooping, right arm weakness, and slurred speech.',
    },
    {
      lang: 'kn' as const,
      label: 'STEMI (KN)',
      text: 'ರೋಗಿಗೆ ಸುಮಾರು 45 ನಿಮಿಷಗಳಿಂದ ತೀವ್ರ ಎದೆ ನೋವು ಪ್ರಾರಂಭವಾಗಿದೆ. ನೋವು ಎಡ ಭುಜಕ್ಕೆ ಹರಡುತ್ತಿದೆ ಮತ್ತು ವಿಪರೀತ ಬೆವರು ಬರುತ್ತಿದೆ.',
    },
    {
      lang: 'hi' as const,
      label: 'Asthma (HI)',
      text: 'मुझे पिछले दो घंटे से सांस लेने में बहुत ज्यादा तकलीफ हो रही है और छाती में तेज सीटी जैसी आवाज हो रही है।',
    },
    {
      lang: 'en' as const,
      label: 'Sepsis (EN)',
      text: 'Patient became increasingly drowsy and confused since morning, shivering with high grade fever and dusky lips.',
    },
  ];

  // Browser Speech Recognition (Web Speech API)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setSpeechError('Web Speech API is not supported in this browser. Please use text entry.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      setSpeechError(null);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Map language code to BCP-47
      if (activeLang === 'kn') recognition.lang = 'kn-IN';
      else if (activeLang === 'hi') recognition.lang = 'hi-IN';
      else recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onChange({
          ...symptoms,
          rawTranscript: symptoms.rawTranscript ? `${symptoms.rawTranscript} ${transcript}` : transcript,
          intakeMethod: 'SPEECH_RECOGNITION',
          humanConfirmed: false,
        });
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        setSpeechError(`Speech recognition error: ${event.error}. Please type manually.`);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsRecording(false);
      setSpeechError(err.message || 'Microphone access denied or unavailable.');
    }
  };

  // Run AI / Local Extraction
  const handleExtract = async () => {
    if (!symptoms.rawTranscript.trim()) return;
    setIsExtracting(true);
    try {
      const res = await extractSymptomsWithAI(symptoms.rawTranscript);
      onChange({
        ...symptoms,
        transcriptLanguage: res.languageDetected,
        primaryComplaint: res.primaryComplaint,
        onset: res.onset,
        duration: res.duration,
        severityScale: res.severityScale,
        symptoms: res.symptoms,
        reportedRedFlags: res.reportedRedFlags,
        missingInformation: res.missingInformation,
        humanConfirmed: false, // Must be explicitly confirmed by clinician!
      });
      setActiveLang(res.languageDetected);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmSymptoms = () => {
    onChange({
      ...symptoms,
      humanConfirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: 'Frontline Healthcare Worker',
    });
  };

  const addManualSymptom = () => {
    const newSymp: ExtractedSymptom = {
      concept: 'custom_symptom',
      label: 'New Symptom',
      reportedStatus: 'present',
      evidenceText: 'Clinician entered',
      confidence: 1.0,
    };
    onChange({
      ...symptoms,
      symptoms: [...symptoms.symptoms, newSymp],
      humanConfirmed: false,
    });
  };

  const removeSymptom = (index: number) => {
    const updated = [...symptoms.symptoms];
    updated.splice(index, 1);
    onChange({
      ...symptoms,
      symptoms: updated,
      humanConfirmed: false,
    });
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5 ${className}`}>
      {/* Header and Language Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Multilingual Symptom Intake & AI Extraction</h3>
          <p className="text-xs text-slate-500">Record voice or text in English, Kannada, or Hindi with explainable concept extraction</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <Globe2 className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          <button
            type="button"
            onClick={() => setActiveLang('en')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeLang === 'en' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('kn')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeLang === 'kn' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kannada (KN)
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('hi')}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeLang === 'hi' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hindi (HI)
          </button>
        </div>
      </div>

      {/* Preset Transcripts Quick Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-medium">Quick Demo Transcripts:</span>
        {DEMO_TRANSCRIPTS.map((demo, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setActiveLang(demo.lang);
              onChange({
                ...symptoms,
                rawTranscript: demo.text,
                transcriptLanguage: demo.lang,
                intakeMethod: 'PRESET_SCENARIO',
                humanConfirmed: false,
              });
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors border border-slate-200"
          >
            {demo.label}
          </button>
        ))}
      </div>

      {/* Text Area & Voice Input */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            rows={3}
            placeholder={
              activeLang === 'kn'
                ? 'ರೋಗಿಯ ಲಕ್ಷಣಗಳನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಧ್ವನಿ ಮೂಲಕ ಹೇಳಿ...'
                : activeLang === 'hi'
                ? 'मरीज के लक्षण यहाँ लिखें या बोलकर दर्ज करें...'
                : 'Enter patient presenting symptoms, onset, and duration, or click Speak...'
            }
            value={symptoms.rawTranscript}
            onChange={(e) =>
              onChange({
                ...symptoms,
                rawTranscript: e.target.value,
                transcriptLanguage: activeLang,
                humanConfirmed: false,
              })
            }
            className="w-full bg-slate-50/70 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 font-sans"
          />

          {/* Voice Record Button */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
              }`}
              title={isRecording ? 'Stop Recording' : 'Start Speech Recognition'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-teal-600" />}
              <span>{isRecording ? 'Listening...' : 'Speak'}</span>
            </button>
          </div>
        </div>

        {speechError && (
          <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{speechError}</span>
          </div>
        )}
      </div>

      {/* Action: Trigger AI Extraction */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="button"
          disabled={!symptoms.rawTranscript.trim() || isExtracting}
          onClick={handleExtract}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isExtracting ? 'Extracting Clinical Concepts...' : 'Extract Symptoms with AI'}</span>
        </button>

        <span className="text-[11px] text-slate-500">
          Extraction never assigns clinical triage; mandatory clinician confirmation required.
        </span>
      </div>

      {/* Extracted Structured Symptoms & Human Confirmation Box */}
      {symptoms.symptoms.length > 0 && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Extracted Concepts & Warning Signs</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                {symptoms.symptoms.length} Symptoms Extracted
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addManualSymptom}
                className="flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-900 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Symptom</span>
              </button>
            </div>
          </div>

          {/* Primary Complaint & Onset fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-[11px] text-slate-500">Primary Complaint:</span>
              <input
                type="text"
                value={symptoms.primaryComplaint}
                onChange={(e) => onChange({ ...symptoms, primaryComplaint: e.target.value, humanConfirmed: false })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Onset:</span>
              <input
                type="text"
                value={symptoms.onset}
                onChange={(e) => onChange({ ...symptoms, onset: e.target.value, humanConfirmed: false })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Duration:</span>
              <input
                type="text"
                value={symptoms.duration}
                onChange={(e) => onChange({ ...symptoms, duration: e.target.value, humanConfirmed: false })}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Extracted Symptoms Table */}
          <div className="space-y-1.5 pt-2">
            {symptoms.symptoms.map((symp, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  <input
                    type="text"
                    value={symp.label}
                    onChange={(e) => {
                      const updated = [...symptoms.symptoms];
                      updated[idx].label = e.target.value;
                      onChange({ ...symptoms, symptoms: updated, humanConfirmed: false });
                    }}
                    className="font-medium text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">({symp.concept})</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={symp.reportedStatus}
                    onChange={(e) => {
                      const updated = [...symptoms.symptoms];
                      updated[idx].reportedStatus = e.target.value as any;
                      onChange({ ...symptoms, symptoms: updated, humanConfirmed: false });
                    }}
                    className="text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="unknown">Uncertain</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => removeSymptom(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Human Confirmation Button */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                  symptoms.humanConfirmed
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {symptoms.humanConfirmed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{symptoms.humanConfirmed ? 'Clinician Confirmed' : 'Pending Confirmation'}</span>
              </span>
              {symptoms.humanConfirmed && symptoms.confirmedAt && (
                <span className="text-[11px] text-slate-500">
                  Confirmed by {symptoms.confirmedBy} at {new Date(symptoms.confirmedAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            {!symptoms.humanConfirmed && (
              <button
                type="button"
                onClick={handleConfirmSymptoms}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Symptoms for Triage Engine</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
