/**
 * @license
 * PulseGate Patient Guidance & Healthcare Destination Results (Modules 6 & 13)
 * Clear next-step guidance, ranked hospital destinations & handover document access
 */

import React, { useState } from 'react';
import type { Assessment, TriageEvaluation, FacilityMatchResult } from '../../types/index.ts';
import { matchAndRankFacilities } from '../../matching/facilityMatcher.ts';
import { store } from '../../services/storeService.ts';
import { ClinicalHandoverSummary } from '../handover/ClinicalHandoverSummary.tsx';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  MapPin,
  Clock,
  PhoneCall,
  Bed,
  Building2,
  FileText,
  Share2,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Navigation,
  Info,
} from 'lucide-react';

interface PatientGuidanceViewProps {
  assessment: Assessment;
  evaluation: TriageEvaluation;
  onStartNewAssessment: () => void;
  onSwitchToProviderView: (assessment: Assessment) => void;
}

export const PatientGuidanceView: React.FC<PatientGuidanceViewProps> = ({
  assessment,
  evaluation,
  onStartNewAssessment,
  onSwitchToProviderView,
}) => {
  const [showHandoverModal, setShowHandoverModal] = useState<boolean>(false);
  const [copiedShareCode, setCopiedShareCode] = useState<boolean>(false);

  const allFacilities = store.getFacilities();

  // Match facilities deterministically using the criteria expected by matchAndRankFacilities
  const matchResults: FacilityMatchResult[] = matchAndRankFacilities(allFacilities, {
    requiredCapabilities: evaluation.requiredFacilityCapabilities || [],
    patientUrgencyCategory: evaluation.category,
    preferredDepartmentType:
      evaluation.category === 'RED' ? 'EMERGENCY_BAY' : undefined,
  });

  const eligibleMatches = matchResults.filter((r) => r.isEligible);
  const topMatches = eligibleMatches.length > 0 ? eligibleMatches : matchResults;

  const getUrgencyConfig = (category: string) => {
    switch (category) {
      case 'RED':
        return {
          title: 'Immediate Emergency Care Required',
          badgeText: 'CATEGORY RED • IMMEDIATE',
          bgBanner: 'bg-rose-600 text-white',
          borderBox: 'border-rose-200 bg-rose-50/70',
          textColor: 'text-rose-900',
          actionText: 'Proceed immediately to an Emergency Department or call an ambulance (112 / 108). Do not delay.',
          icon: ShieldAlert,
        };
      case 'AMBER':
        return {
          title: 'Urgent Same-Day Medical Evaluation Needed',
          badgeText: 'CATEGORY AMBER • HIGH URGENCY',
          bgBanner: 'bg-amber-600 text-white',
          borderBox: 'border-amber-200 bg-amber-50/70',
          textColor: 'text-amber-900',
          actionText: 'Seek prompt medical attention at an Urgent Care or Secondary Hospital within 2 to 4 hours.',
          icon: AlertTriangle,
        };
      case 'GREEN':
        return {
          title: 'Routine Care or Primary Healthcare Clinic',
          badgeText: 'CATEGORY GREEN • ROUTINE CARE',
          bgBanner: 'bg-emerald-600 text-white',
          borderBox: 'border-emerald-200 bg-emerald-50/70',
          textColor: 'text-emerald-900',
          actionText: 'Consult your local primary care physician or health centre during standard clinic hours.',
          icon: CheckCircle2,
        };
      default:
        return {
          title: 'Incomplete Assessment Data',
          badgeText: 'CATEGORY GRAY • DATA INCOMPLETE',
          bgBanner: 'bg-slate-700 text-white',
          borderBox: 'border-slate-200 bg-slate-50',
          textColor: 'text-slate-900',
          actionText: 'Critical observations are missing. Please complete clinical vital signs or consult in-person.',
          icon: HelpCircle,
        };
    }
  };

  const config = getUrgencyConfig(evaluation.category);
  const IconComp = config.icon;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText?.(assessment.displayId);
    setCopiedShareCode(true);
    setTimeout(() => setCopiedShareCode(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* 1. Urgency Banner */}
      <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200">
        <div className={`p-6 sm:p-8 ${config.bgBanner} flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <IconComp className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-1">
              <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-white/25 text-white">
                {config.badgeText}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
                {config.title}
              </h1>
              <p className="text-sm sm:text-base text-white/90 font-medium">
                {config.actionText}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
            <button
              type="button"
              onClick={() => setShowHandoverModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-teal-700" />
              <span>Clinical Handover Document</span>
            </button>
            <span className="text-[11px] text-white/80 font-mono hidden sm:inline">
              Ref: {assessment.displayId}
            </span>
          </div>
        </div>

        {/* Explainability Bar */}
        <div className="bg-white p-5 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-100 pb-2">
            <span>CLINICAL EXPLANATION & DETERMINISTIC REASONING</span>
            <span className="font-mono text-[11px] text-slate-400">Ruleset: {evaluation.ruleSetVersion}</span>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed font-medium">
            {evaluation.clinicalActionSummary}
          </p>

          {evaluation.matchedRules && evaluation.matchedRules.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <strong className="block font-bold">Triggered Clinical Rules & Red Flags:</strong>
              {evaluation.matchedRules.map((rf, idx) => (
                <div key={idx} className="flex items-start gap-2 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1 shrink-0" />
                  <span><strong>{rf.ruleName}</strong> &mdash; {rf.explanation} ({rf.rationale})</span>
                </div>
              ))}
            </div>
          )}

          {evaluation.news2Score !== null && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
              <div className="px-2.5 py-1 rounded-lg bg-slate-100 border font-mono">
                NEWS2 Aggregate: <strong className="text-slate-900 font-bold">{evaluation.news2Score}</strong> / 20 ({evaluation.news2RiskLevel} RISK)
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-slate-100 border">
                Systolic BP: <strong>{assessment.observations.systolicBp || 'N/A'} mmHg</strong>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-slate-100 border">
                SpO2: <strong>{assessment.observations.spo2 || 'N/A'}%</strong>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-slate-100 border">
                Heart Rate: <strong>{assessment.observations.heartRate || 'N/A'} bpm</strong>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-slate-100 border">
                Consciousness: <strong>{assessment.observations.consciousness || 'N/A'}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Recommended Healthcare Destinations */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-[#12304a] font-heading flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-700" />
              <span>Recommended Healthcare Destinations</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ranked deterministically by mandatory clinical capabilities, driving time, and live bed availability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{copiedShareCode ? 'Code Copied!' : `Share Ref: ${assessment.displayId}`}</span>
            </button>
          </div>
        </div>

        {/* Facility Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topMatches.slice(0, 4).map((match, index) => {
            const f = match.facility;
            const isTopMatch = index === 0 && match.isEligible;
            return (
              <div
                key={f.id}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-2xs space-y-4 relative ${
                  isTopMatch ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-sm' : 'border-slate-200'
                }`}
              >
                {isTopMatch && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold tracking-wide uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>Top Match ({match.matchScore} pts)</span>
                  </div>
                )}

                <div>
                  <div className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                    {f.type.replace(/_/g, ' ')} • {f.city}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {f.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{f.address}</span>
                  </p>
                </div>

                {/* Key Metrics: Drive time, Beds, Distance */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Travel Time</span>
                    <strong className="text-slate-900 font-extrabold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-teal-600" />
                      <span>{f.estimatedDriveMinutes} mins</span>
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Bed Status</span>
                    <strong className="text-slate-900 font-extrabold flex items-center gap-1">
                      <Bed className="w-3 h-3 text-teal-600" />
                      <span>
                        {match.availabilityState === 'CONFIRMED_BED' ? 'Available' : 'Limited'}
                      </span>
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Distance</span>
                    <strong className="text-slate-900 font-extrabold">
                      {f.distanceKm} km
                    </strong>
                  </div>
                </div>

                {/* Capability Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {f.capabilities.slice(0, 4).map((cap: string) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                    >
                      {cap.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {f.capabilities.length > 4 && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px]">
                      +{f.capabilities.length - 4} more
                    </span>
                  )}
                </div>

                {/* Matching Rationale */}
                <div className="text-[11px] text-slate-600 bg-teal-50/60 p-2.5 rounded-lg border border-teal-100">
                  <span className="font-semibold text-teal-900">Routing Rationale: </span>
                  <span>{match.rankingRationale || 'Verified clinical specialty and shortest transit corridor.'}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <a
                    href={`tel:${f.contactPhone}`}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-teal-700" />
                    <span>{f.contactPhone}</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${f.name} ${f.city}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Directions</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Next Steps & Provider Handoff Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
            <Info className="w-3.5 h-3.5" />
            <span>Assisted Referral Workspace</span>
          </div>
          <h3 className="text-xl font-bold font-heading">
            Are you at a clinic or with health workers?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Frontline clinicians can manage formal hospital pre-notification, electronic SBAR handover,
            and inter-facility ambulance dispatch in the Provider Workspace.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={onStartNewAssessment}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>New Assessment</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchToProviderView(assessment)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>Open in Staff Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Handover Modal */}
      {showHandoverModal && (
        <ClinicalHandoverSummary
          assessment={assessment}
          onClose={() => setShowHandoverModal(false)}
        />
      )}
    </div>
  );
};
