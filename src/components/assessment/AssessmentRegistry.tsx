/**
 * @license
 * PulseGate Assessment Registry & Clinical Review View (Modules 21 & 43)
 * Searchable Registry, Detailed Patient Review, Clinical Second Opinion & Authorized Overrides
 */

import React, { useState } from 'react';
import type { Assessment, UrgencyCategory } from '../../types/index.ts';
import { store } from '../../services/storeService.ts';
import { ClinicalHandoverSummary } from '../handover/ClinicalHandoverSummary.tsx';
import {
  Search,
  Filter,
  ShieldAlert,
  Edit2,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface AssessmentRegistryProps {
  assessments: Assessment[];
  onStartNewAssessment: () => void;
  onInitiateReferral: (assessment: Assessment) => void;
}

export const AssessmentRegistry: React.FC<AssessmentRegistryProps> = ({
  assessments,
  onStartNewAssessment,
  onInitiateReferral,
}) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(
    assessments[0] || null
  );

  // Clinical Override Form State
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideCategory, setOverrideCategory] = useState<UrgencyCategory>('AMBER');
  const [overrideReason, setOverrideReason] = useState('');

  const [handoverModalAssessment, setHandoverModalAssessment] = useState<Assessment | null>(null);

  const activeUser = store.getActiveUser();

  const filtered = assessments.filter((a) => {
    if (filterCategory !== 'ALL' && a.evaluation?.category !== filterCategory) return false;
    if (
      search &&
      !a.patient.name.toLowerCase().includes(search.toLowerCase()) &&
      !a.displayId.toLowerCase().includes(search.toLowerCase()) &&
      !a.symptoms.primaryComplaint.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleApplyOverride = () => {
    if (!selectedAssessment || !overrideReason.trim()) return;
    const updated = store.overrideTriage(
      selectedAssessment.id,
      overrideCategory,
      overrideReason,
      activeUser.name
    );
    if (updated) {
      setSelectedAssessment({ ...updated });
      setIsOverriding(false);
      setOverrideReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono">
              REGISTRY & SECOND OPINION
            </span>
            <span className="text-xs text-slate-500">Historical Patient Records & Oversight</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
            Assessment Registry & Clinical Review
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Examine patient symptom evidence, physiological vitals, and decision-support rationale. Senior clinicians can document structured overrides.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNewAssessment}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
        >
          <span>Start Assessment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by patient, ID, or symptom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="RED">RED (Emergency)</option>
            <option value="AMBER">AMBER (Urgent Review)</option>
            <option value="GREEN">GREEN (Routine)</option>
            <option value="GRAY">GRAY (Incomplete)</option>
          </select>
        </div>

        <span className="text-slate-500 font-medium">
          Showing {filtered.length} of {assessments.length} assessments
        </span>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assessment Cards List */}
        <div className="space-y-3 lg:col-span-1 max-h-[640px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
              No matching assessments found.
            </div>
          ) : (
            filtered.map((a) => {
              const isSelected = a.id === selectedAssessment?.id;
              const cat = a.evaluation?.category || 'GRAY';

              return (
                <div
                  key={a.id}
                  onClick={() => {
                    setSelectedAssessment(a);
                    setIsOverriding(false);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-300 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-700">
                      {a.displayId}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        cat === 'RED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : cat === 'AMBER'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : cat === 'GREEN'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cat} {a.evaluation?.news2Score !== null ? `(NEWS2: ${a.evaluation?.news2Score})` : ''}
                    </span>
                  </div>

                  <div>
                    <strong className="text-xs font-semibold text-slate-900 block">{a.patient.name}</strong>
                    <span className="text-[11px] text-slate-500">
                      {a.patient.age}y • {a.patient.gender} • {a.clinicName}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 line-clamp-1 italic">
                    {a.symptoms.primaryComplaint}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    <span>Status: {a.workflowStatus.replace('_', ' ')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Deep Inspection & Clinical Override Center */}
        {selectedAssessment && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-700">
                    {selectedAssessment.displayId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      selectedAssessment.evaluation?.category === 'RED'
                        ? 'bg-rose-100 text-rose-800'
                        : selectedAssessment.evaluation?.category === 'AMBER'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedAssessment.evaluation?.categoryLabel}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading mt-1">
                  {selectedAssessment.patient.name} ({selectedAssessment.patient.age}y / {selectedAssessment.patient.gender})
                </h3>
                <p className="text-xs text-slate-500">
                  Intake at {selectedAssessment.clinicName} by {selectedAssessment.creatorName} ({selectedAssessment.creatorRole})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHandoverModalAssessment(selectedAssessment)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>SBAR Summary</span>
                </button>

                <button
                  type="button"
                  onClick={() => onInitiateReferral(selectedAssessment)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Refer to Hospital</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Clinical Second-Opinion & Override Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-teal-700" />
                  <span>Clinical Lead Review & Authorized Override:</span>
                </span>
                {!isOverriding ? (
                  <button
                    type="button"
                    onClick={() => setIsOverriding(true)}
                    className="flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold text-xs"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Record Clinical Override</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsOverriding(false)}
                    className="text-slate-500 hover:text-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {isOverriding ? (
                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700">Override Category To:</span>
                    <div className="flex items-center gap-2">
                      {(['RED', 'AMBER', 'GREEN'] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setOverrideCategory(c)}
                          className={`px-3 py-1 rounded-md font-bold transition-all ${
                            overrideCategory === c
                              ? 'bg-slate-900 text-white'
                              : 'bg-white border text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Mandatory Clinical Rationale & Justification:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Reviewed ECG and troponin; patient stabilizing with resolution of acute symptoms..."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-teal-500 font-sans"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!overrideReason.trim()}
                    onClick={handleApplyOverride}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    Sign & Apply Clinical Override
                  </button>
                </div>
              ) : selectedAssessment.evaluation?.isHumanOverridden ? (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs space-y-1">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Clinician Override Applied</span>
                  </div>
                  <p className="text-amber-900">
                    Reason: <em>{selectedAssessment.evaluation.overrideReason}</em>
                  </p>
                  <span className="text-[11px] text-amber-800 block">
                    By {selectedAssessment.evaluation.overrideBy} at{' '}
                    {new Date(selectedAssessment.evaluation.overrideTimestamp!).toLocaleString()}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Automated deterministic rules remain active. No manual clinical override currently recorded.
                </p>
              )}
            </div>

            {/* Physiological Observations Grid */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Physiological Vitals at Intake
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border text-center">
                  <span className="text-[10px] text-slate-500 block">SpO₂</span>
                  <strong className="text-sm font-mono">{selectedAssessment.observations.spo2}%</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border text-center">
                  <span className="text-[10px] text-slate-500 block">Heart Rate</span>
                  <strong className="text-sm font-mono">{selectedAssessment.observations.heartRate} bpm</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border text-center">
                  <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
                  <strong className="text-sm font-mono">
                    {selectedAssessment.observations.systolicBp}/{selectedAssessment.observations.diastolicBp || '-'}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border text-center">
                  <span className="text-[10px] text-slate-500 block">Resp. Rate</span>
                  <strong className="text-sm font-mono">{selectedAssessment.observations.respiratoryRate}/min</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border text-center">
                  <span className="text-[10px] text-slate-500 block">Temperature</span>
                  <strong className="text-sm font-mono">{selectedAssessment.observations.temperature} °C</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border text-center">
                  <span className="text-[10px] text-slate-500 block">Consciousness</span>
                  <strong className="text-xs font-semibold">{selectedAssessment.observations.consciousness}</strong>
                </div>
              </div>
            </div>

            {/* Matched Rules List */}
            {selectedAssessment.evaluation && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-500">
                  Decision Rules Evaluated ({selectedAssessment.evaluation.ruleSetVersion})
                </h4>
                <div className="space-y-2">
                  {selectedAssessment.evaluation.matchedRules.map((rule, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border rounded-lg space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>[{rule.ruleId}] {rule.ruleName}</span>
                        <span className="text-[10px] font-bold text-rose-700">{rule.severity}</span>
                      </div>
                      <p className="text-slate-600">{rule.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SBAR Modal */}
      {handoverModalAssessment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <ClinicalHandoverSummary
            assessment={handoverModalAssessment}
            onClose={() => setHandoverModalAssessment(null)}
          />
        </div>
      )}
    </div>
  );
};
