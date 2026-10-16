/**
 * @license
 * PulseGate Patient Landing Page (Module 5)
 * "Know where to go before you travel."
 */

import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  HeartPulse,
  Activity,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Stethoscope,
  Building2,
  CheckCircle2,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { SEEDED_SCENARIOS } from '../../data/seedScenarios.ts';
import type { TrainingScenario } from '../../types/index.ts';

interface LandingPageProps {
  onStartAssessment: () => void;
  onExploreHowItWorks: () => void;
  onFindCare: () => void;
  onSelectDemoScenario: (scenario: TrainingScenario) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAssessment,
  onExploreHowItWorks,
  onFindCare,
  onSelectDemoScenario,
}) => {
  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* 1. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ddf4f1] text-[#0f766e] text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#0f766e]" />
              <span>AI-ASSISTED TRIAGE & SMART CARE ROUTING</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#12304a] tracking-tight leading-[1.1] font-heading">
              Know where to go <br className="hidden sm:inline" />
              <span className="text-[#0f766e]">before you travel.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              PulseGate helps you understand the urgency of your symptoms and explore appropriate
              healthcare options before you begin your journey.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onStartAssessment}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0f766e] hover:bg-[#0d9488] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                <span>Start Health Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onExploreHowItWorks}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-200 transition-colors shadow-2xs"
              >
                <span>Explore How It Works</span>
              </button>
            </div>

            {/* Privacy & Medical Reassurance Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-200/80">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0f766e]" />
                <span>No signup required • 100% private</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#0f766e]" />
                <span>Deterministic clinical rules (NEWS2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-[#0f766e]" />
                <span>Hardware-free software simulator</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Route & Care Navigation Visual Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xl space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Live Care Routing Flow
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800">
                  PulseGate AI
                </span>
              </div>

              {/* Sample patient journey card */}
              <div className="space-y-3 text-xs">
                {/* Step 1 Preview */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-100 text-[#0f766e] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-slate-900 block font-semibold">Reported Symptoms</strong>
                    <p className="text-slate-500 text-[11px]">
                      "Sudden facial droop and right arm weakness since 90 minutes ago."
                    </p>
                  </div>
                </div>

                {/* Step 2 Preview: Triage Analysis */}
                <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-rose-950 font-bold">EMERGENCY RED: FAST Positive</strong>
                    </div>
                    <p className="text-rose-800 text-[11px]">
                      Hyperacute stroke protocol activated. Requires 24/7 CT imaging & Acute Stroke Unit.
                    </p>
                  </div>
                </div>

                {/* Step 3 Preview: Destination Match */}
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <strong className="text-emerald-950 font-bold block">
                      Recommended Destination: NIMHANS Stroke Center
                    </strong>
                    <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-1">
                      <span>🚗 24 min transit (11.5 km)</span>
                      <span className="font-semibold">3 Stroke Beds Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick action button inside card */}
              <button
                type="button"
                onClick={onStartAssessment}
                className="w-full py-2.5 rounded-xl bg-[#12304a] hover:bg-[#1e4566] text-white text-xs font-semibold text-center transition-colors shadow-xs"
              >
                Assess Your Symptoms Now &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Hackathon Judges Demo Mode Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#12304a] to-[#1e3a5f] rounded-2xl p-6 text-white shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="font-bold text-sm text-white font-heading">
                  Judge & Evaluator Demonstration Mode
                </h3>
                <p className="text-xs text-slate-300">
                  Test the complete care navigation pipeline with one click using pre-configured synthetic cases.
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
              ZERO HARDWARE REQUIRED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {SEEDED_SCENARIOS.slice(0, 4).map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => onSelectDemoScenario(sc)}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-teal-300 font-bold">{sc.code}</span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                      sc.expectedTriageCategory === 'RED'
                        ? 'bg-rose-500/30 text-rose-300'
                        : 'bg-amber-500/30 text-amber-300'
                    }`}
                  >
                    {sc.expectedTriageCategory}
                  </span>
                </div>
                <strong className="text-white block font-semibold truncate">{sc.title}</strong>
                <p className="text-slate-400 text-[11px] line-clamp-1">{sc.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. The 3-Step Simple Explanation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0f766e]">
            Transparent 3-Step Care Path
          </span>
          <h2 className="text-3xl font-extrabold text-[#12304a] tracking-tight font-heading">
            How PulseGate Works For You
          </h2>
          <p className="text-sm text-slate-600">
            A clear, explainable healthcare navigation assistant that puts safety and clinical logic first.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#ddf4f1] text-[#0f766e] flex items-center justify-center font-bold text-base">
              1
            </div>
            <h3 className="font-bold text-base text-[#12304a] font-heading">1. Share Your Symptoms</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Describe what you feel using simple terms or voice input in English, Kannada, or Hindi.
              We extract only factual clinical concepts without making an autonomous diagnosis.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#ddf4f1] text-[#0f766e] flex items-center justify-center font-bold text-base">
              2
            </div>
            <h3 className="font-bold text-base text-[#12304a] font-heading">
              2. Understand Next Steps
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our deterministic clinical rules engine (NEWS2 + Emergency Red Flag protocols) calculates
              urgency. If emergency warning signs are present, critical guidance appears immediately.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#ddf4f1] text-[#0f766e] flex items-center justify-center font-bold text-base">
              3
            </div>
            <h3 className="font-bold text-base text-[#12304a] font-heading">
              3. Explore Suitable Options
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Find hospitals equipped with the specific clinical capabilities your condition demands.
              Compare travel times, bed availability, and generate a printable handover summary.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Why Care Navigation Matters (The Problem PulseGate Solves) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f766e]">
              Healthcare Navigation Challenge
            </span>
            <h2 className="text-2xl font-bold text-[#12304a] font-heading">
              Why Knowing Where to Go Saves Critical Time
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              When someone experiences acute symptoms, they often rush to the nearest clinic or hospital
              without knowing if that facility has the specialized resources needed for their condition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
              <strong className="text-slate-900 block font-semibold text-sm">
                ❌ The Fragmented Referral Problem
              </strong>
              <p className="text-slate-600 leading-relaxed">
                A patient experiencing an acute heart attack may reach a community clinic 10 minutes away,
                only to discover it lacks a 24/7 Cardiac Catheterization Lab (Cath Lab). By the time an
                inter-hospital transfer is arranged, critical myocardial tissue is irreversibly damaged.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
              <strong className="text-[#0f766e] block font-semibold text-sm">
                ✓ The PulseGate Capability-First Solution
              </strong>
              <p className="text-slate-600 leading-relaxed">
                PulseGate enforces strict eligibility filtering before ranking distance: facilities lacking
                mandatory clinical capabilities (such as Primary PCI or Acute Stroke Units) are filtered out,
                directing patients to the right receiving facility on the very first journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Bottom Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-6">
        <div className="bg-[#12304a] text-white rounded-3xl p-8 sm:p-12 space-y-6 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
              Ready to check your symptoms?
            </h2>
            <p className="text-slate-300 text-sm">
              Takes less than 3 minutes. No account or credit card needed. Completely free and hardware-independent.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onStartAssessment}
              className="px-8 py-3.5 rounded-xl bg-[#0f766e] hover:bg-[#0d9488] text-white text-sm font-bold shadow-md transition-all"
            >
              Start Free Symptom Assessment
            </button>
            <button
              type="button"
              onClick={onFindCare}
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 transition-colors"
            >
              Explore Healthcare Facilities Directory
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
