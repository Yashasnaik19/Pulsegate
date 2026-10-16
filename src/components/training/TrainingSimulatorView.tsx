/**
 * @license
 * PulseGate Training Simulator & Scenario Library (Module 20)
 * 14 Fully Reproducible Synthetic Clinical Cases for Hackathon Judges & Frontline Staff
 */

import React, { useState } from 'react';
import { SEEDED_SCENARIOS } from '../../data/seedScenarios.ts';
import type { TrainingScenario } from '../../types/index.ts';
import { Sparkles, Play, ShieldAlert, CheckCircle2, AlertTriangle, BookOpen, Filter } from 'lucide-react';

interface TrainingSimulatorViewProps {
  onLoadScenario: (scenario: TrainingScenario) => void;
}

export const TrainingSimulatorView: React.FC<TrainingSimulatorViewProps> = ({ onLoadScenario }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeScenario, setActiveScenario] = useState<TrainingScenario>(SEEDED_SCENARIOS[0]);

  const filtered = SEEDED_SCENARIOS.filter((s) => {
    if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
              TRAINING MODE • SYNTHETIC DATA
            </span>
            <span className="text-xs text-slate-400">14 Verified Clinical & Operational Test Scenarios</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight font-heading">
            Scenario Simulator & Triage Testing Lab
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Explore diverse clinical cases: hyperacute stroke, STEMI with Kannada intake, asthma with Hindi voice,
            septic shock, and boundary edge cases (pediatric scope guard, missing vitals, and stale facility census).
          </p>
        </div>

        <button
          type="button"
          onClick={() => onLoadScenario(activeScenario)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Launch Selected Scenario</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-semibold mr-1">Filter Domain:</span>
        {['ALL', 'CARDIOLOGY', 'NEUROLOGY', 'RESPIRATORY', 'SEPSIS', 'TRAUMA', 'EDGE_CASE'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg font-medium transition-colors border ${
              selectedCategory === cat
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Two Column Layout: Scenario List on Left, Active Scenario Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scenarios List */}
        <div className="space-y-3 lg:col-span-1">
          {filtered.map((sc) => {
            const isSelected = sc.id === activeScenario.id;

            return (
              <div
                key={sc.id}
                onClick={() => setActiveScenario(sc)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'bg-teal-50 border-teal-300 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
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
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Expected {sc.expectedTriageCategory}
                  </span>
                </div>

                <strong className="text-xs font-semibold text-slate-900 block">{sc.title}</strong>
                <p className="text-[11px] text-slate-500 line-clamp-2">{sc.description}</p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Scenario Deep Dive */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-teal-700 block">
                {activeScenario.code} • {activeScenario.category}
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-heading">{activeScenario.title}</h3>
            </div>

            <button
              type="button"
              onClick={() => onLoadScenario(activeScenario)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Load into Assessment</span>
            </button>
          </div>

          {/* Description & Objective */}
          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Clinical Case Presentation:</span>
              <p className="text-slate-800 leading-relaxed">{activeScenario.description}</p>
            </div>

            <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200">
              <span className="font-bold text-teal-950 block mb-1">Learning & Testing Objective:</span>
              <p className="text-teal-900 leading-relaxed">{activeScenario.learningObjective}</p>
              {activeScenario.edgeCaseNote && (
                <div className="mt-2 text-amber-900 font-semibold text-[11px]">
                  ⚠️ Note: {activeScenario.edgeCaseNote}
                </div>
              )}
            </div>
          </div>

          {/* Transcript & Language */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">
              Sample Multilingual Transcript ({activeScenario.syntheticSymptoms.language.toUpperCase()}):
            </span>
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs leading-relaxed">
              "{activeScenario.syntheticSymptoms.rawTranscript}"
            </div>
          </div>

          {/* Synthetic Vitals Preview */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">Synthetic Physiological Observations:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <div className="p-2.5 bg-slate-50 rounded-lg border text-center">
                <span className="text-[10px] text-slate-500 block">SpO₂</span>
                <strong className="text-xs font-mono">
                  {activeScenario.syntheticObservations.spo2 !== null
                    ? `${activeScenario.syntheticObservations.spo2}%`
                    : 'MISSING'}
                </strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border text-center">
                <span className="text-[10px] text-slate-500 block">Pulse</span>
                <strong className="text-xs font-mono">
                  {activeScenario.syntheticObservations.heartRate ?? 'MISSING'} bpm
                </strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border text-center">
                <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
                <strong className="text-xs font-mono">
                  {activeScenario.syntheticObservations.systolicBp ?? 'MISSING'} mmHg
                </strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border text-center">
                <span className="text-[10px] text-slate-500 block">Resp. Rate</span>
                <strong className="text-xs font-mono">
                  {activeScenario.syntheticObservations.respiratoryRate ?? 'MISSING'}/min
                </strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border text-center">
                <span className="text-[10px] text-slate-500 block">Temp</span>
                <strong className="text-xs font-mono">
                  {activeScenario.syntheticObservations.temperature ?? 'MISSING'} °C
                </strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border text-center">
                <span className="text-[10px] text-slate-500 block">ACVPU</span>
                <strong className="text-xs">
                  {activeScenario.syntheticObservations.consciousness ?? 'MISSING'}
                </strong>
              </div>
            </div>
          </div>

          {/* Mandatory Capabilities Required */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">
              Mandatory Hospital Capabilities to Match:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeScenario.expectedMandatoryCapabilities.map((cap, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium border border-slate-200"
                >
                  ✓ {cap}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
