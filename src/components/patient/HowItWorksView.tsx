/**
 * @license
 * PulseGate How It Works (Module 5 & 20)
 * Transparent clinical reasoning, hardware-independence, and decision-support architecture
 */

import React from 'react';
import {
  ShieldCheck,
  Cpu,
  HeartPulse,
  Building2,
  Lock,
  Mic,
  ArrowRight,
  FileText,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Flame,
  Activity,
  Layers,
} from 'lucide-react';

interface HowItWorksViewProps {
  onStartAssessment: () => void;
  onExploreDirectory: () => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({
  onStartAssessment,
  onExploreDirectory,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16 font-sans">
      {/* 1. Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold tracking-wide border border-teal-200">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>TRANSPARENT CLINICAL REASONING</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#12304a] tracking-tight font-heading">
          The Right Care. The Right Place. Sooner.
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          PulseGate replaces guesswork and arbitrary transit decisions with deterministic clinical decision support,
          standardized physiological scoring (NEWS2), and two-stage hospital capability matching.
        </p>
      </div>

      {/* 2. Step by Step Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-extrabold font-heading text-lg">
            01
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-heading">
            Multilingual Symptom Intake
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Report symptoms via browser voice recognition or guided cards in English, Kannada, or Hindi.
            Immediate safety checks detect stroke (FAST), heart attack, or critical airway red flags on first touch.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 font-mono">
            Feature: Instant emergency banner trigger before continuing.
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-extrabold font-heading text-lg">
            02
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-heading">
            NEWS2 Scoring & Red Flags
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The application executes the Royal College of Physicians National Early Warning Score (NEWS2) algorithm.
            Seven physiological parameters are evaluated deterministically to assign clinical urgency categories: RED, AMBER, GREEN, or GRAY.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 font-mono">
            Rule: 100% auditable; zero opaque black-box hallucination.
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-extrabold font-heading text-lg">
            03
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-heading">
            Two-Stage Care Navigation
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Stage A enforces strict mandatory clinical capability filters (e.g. Cath Lab, Stroke Unit, 24/7 CT).
            Stage B ranks verified facilities by live travel time, confirmed bed availability, and data freshness.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 font-mono">
            Safety: Nearby clinics lacking needed emergency services are strictly excluded.
          </div>
        </div>
      </div>

      {/* 3. Clinical Architecture Deep Dive */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase text-teal-700 tracking-wider">System Specifications</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#12304a] font-heading">
            Clinical Safety & Architectural Principles
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Designed specifically for frontline health clinics, community triage posts, and smart referral corridors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Card A: Hardware Independence */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900">100% Software Independence</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                PulseGate eliminates expensive biometric kiosks, custom sensors, or proprietary medical hardware that frequently
                fail in real-world clinic deployments. All vital sign inputs support manual entry, automated bounds checking,
                or synthetic simulation presets.
              </p>
            </div>
          </div>

          {/* Card B: Deterministic Rules Engine */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900">Deterministic Safety Guardrails</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Triage categories and clinical warnings are calculated using deterministic TypeScript logic.
                Generative AI is strictly restricted to multilingual language extraction and natural voice transcription.
                Clinical rules never depend on generative model hallucination.
              </p>
            </div>
          </div>

          {/* Card C: Strict Capability Verification */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900">Proximity Never Overrules Capability</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                A nearby hospital without a functional cardiac catheterization laboratory or acute stroke team is
                explicitly excluded when an acute coronary syndrome or stroke is identified, preventing catastrophic transit delays.
              </p>
            </div>
          </div>

          {/* Card D: SBAR Handover Documentation */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900">Standardized SBAR Handover</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every completed triage generates an audit-ready, print-optimized Situation, Background, Assessment,
                and Recommendation (SBAR) clinical handover summary. Both receiving emergency physicians and ambulance paramedics
                receive structured handover data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. NEWS2 Matrix Explanation */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase text-teal-400">Standardized Clinical Triage</span>
          <h2 className="text-2xl font-bold font-heading">
            Royal College of Physicians NEWS2 Thresholds
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            PulseGate evaluates seven vital sign parameters according to internationally validated acute deterioration benchmarks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-400">RED • EMERGENCY</span>
              <span className="text-[10px] font-mono bg-rose-900/80 px-2 py-0.5 rounded text-white">Score ≥ 7 or Single 3</span>
            </div>
            <p className="text-xs text-slate-300">
              Extreme physiological deviation or immediate red flag (stroke, ACS, anaphylaxis, severe shock). Immediate resuscitation required.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-400">AMBER • URGENT</span>
              <span className="text-[10px] font-mono bg-amber-900/80 px-2 py-0.5 rounded text-white">Score 5 – 6</span>
            </div>
            <p className="text-xs text-slate-300">
              Significant physiological deterioration. Prompt medical review within 2 to 4 hours at an acute or secondary care hospital.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-400">GREEN • ROUTINE</span>
              <span className="text-[10px] font-mono bg-emerald-900/80 px-2 py-0.5 rounded text-white">Score 0 – 4</span>
            </div>
            <p className="text-xs text-slate-300">
              Stable vitals without emergency warning triggers. Safe for local primary health care clinic evaluation or monitored self-care.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300">GRAY • INCOMPLETE</span>
              <span className="text-[10px] font-mono bg-slate-700 px-2 py-0.5 rounded text-white">Missing Vitals</span>
            </div>
            <p className="text-xs text-slate-300">
              Incomplete physiological data cannot safely be categorized as green. Requires vital signs completion or in-person evaluation.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Call to Action */}
      <div className="text-center space-y-4 pt-4">
        <h3 className="text-2xl font-extrabold text-[#12304a] font-heading">
          Ready to experience PulseGate?
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Start a guided symptom check, or explore our interactive hospital directory with live bed capacity.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onStartAssessment}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold shadow-md transition-all"
          >
            <span>Start Health Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onExploreDirectory}
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
          >
            Explore Healthcare Directory
          </button>
        </div>
      </div>
    </div>
  );
};
