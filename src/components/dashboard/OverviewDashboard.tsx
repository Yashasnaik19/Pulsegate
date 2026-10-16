/**
 * @license
 * PulseGate Overview Dashboard (Module 8 & 58)
 * Professional Clinical Workspace with Live Metrics & Operational Actions
 */

import React, { useState } from 'react';
import type { Assessment, Referral, Facility } from '../../types/index.ts';
import {
  Activity,
  Users,
  Send,
  AlertTriangle,
  PlusCircle,
  Eye,
  MapPin,
  Clock,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Search,
} from 'lucide-react';

interface OverviewDashboardProps {
  assessments: Assessment[];
  referrals: Referral[];
  facilities: Facility[];
  onStartAssessment: () => void;
  onSelectAssessment: (assessment: Assessment) => void;
  onViewFacilities: () => void;
  onViewReferrals: () => void;
  onOpenTraining: () => void;
  onResetDemo: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  assessments,
  referrals,
  facilities,
  onStartAssessment,
  onSelectAssessment,
  onViewFacilities,
  onViewReferrals,
  onOpenTraining,
  onResetDemo,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate live database metrics
  const assessmentsCount = assessments.length;
  const criticalRedCount = assessments.filter((a) => a.evaluation?.category === 'RED').length;
  const awaitingReviewCount = assessments.filter(
    (a) => a.workflowStatus === 'REQUIRES_CLINICAL_REVIEW' || a.workflowStatus === 'READY_FOR_EVALUATION'
  ).length;
  const openReferralsCount = referrals.filter(
    (r) => r.status === 'SENT' || r.status === 'ACCEPTED' || r.status === 'IN_TRANSIT'
  ).length;
  const staleFacilitiesCount = facilities.filter((f) => f.dataFreshnessMinutes > 120).length;

  const filteredAssessments = assessments.filter((a) => {
    if (filterCategory !== 'ALL' && a.evaluation?.category !== filterCategory) return false;
    if (
      searchQuery &&
      !a.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.displayId.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.symptoms.primaryComplaint.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
              CLINICAL TRIAGE PLATFORM
            </span>
            <span className="text-xs font-medium text-slate-500">
              Autonomous Software Demonstration • Hardware-Free
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
            The Right Care. The Right Place. <span className="text-teal-600">Sooner.</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            PulseGate combines AI-assisted multilingual symptom extraction, explainable NEWS2 rules, and
            intelligent capability-first hospital referral routing for frontline healthcare teams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onStartAssessment}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Patient Assessment</span>
          </button>
          <button
            type="button"
            onClick={onOpenTraining}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Scenario Library</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Assessments</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{assessmentsCount}</span>
            <span className="text-xs text-slate-500 font-medium">intakes recorded</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Critical Emergency (RED):</span>
            <strong className="text-rose-600">{criticalRedCount}</strong>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Awaiting Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{awaitingReviewCount}</span>
            <span className="text-xs text-slate-500 font-medium">pending sign-off</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Clinical Lead Queue:</span>
            <span className="text-amber-700 font-semibold">Active</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Referrals</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{openReferralsCount}</span>
            <span className="text-xs text-slate-500 font-medium">transfers in transit</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Receiving Hubs:</span>
            <span className="text-teal-700 font-medium">Connected</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Facility Network</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{facilities.length}</span>
            <span className="text-xs text-slate-500 font-medium">seeded hospitals</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Stale Bed Data (&gt;2h):</span>
            <strong className={staleFacilitiesCount > 0 ? 'text-amber-600' : 'text-slate-600'}>
              {staleFacilitiesCount} facilities
            </strong>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (Two columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Assessments Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 font-heading">Recent Clinical Assessments</h3>
              <p className="text-xs text-slate-500">Patient presentations evaluated via deterministic NEWS2 rules</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search patient / symptom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg px-2 py-1.5 font-medium"
              >
                <option value="ALL">All Categories</option>
                <option value="RED">RED (Emergency)</option>
                <option value="AMBER">AMBER (Urgent)</option>
                <option value="GREEN">GREEN (Routine)</option>
                <option value="GRAY">GRAY (Incomplete)</option>
              </select>
            </div>
          </div>

          {/* Assessments Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ID / Patient</th>
                  <th className="py-2.5 px-3">Presenting Complaint</th>
                  <th className="py-2.5 px-3">Triage Category</th>
                  <th className="py-2.5 px-3">NEWS2</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No matching assessments found.
                    </td>
                  </tr>
                ) : (
                  filteredAssessments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] font-bold text-slate-700 block">
                          {a.displayId}
                        </span>
                        <strong className="text-slate-900 font-medium">
                          {a.patient.name}
                        </strong>
                        <span className="text-[11px] text-slate-400 block">
                          {a.patient.age}y • {a.patient.gender}
                        </span>
                      </td>

                      <td className="py-3 px-3 max-w-[200px]">
                        <span className="text-slate-800 font-medium block truncate">
                          {a.symptoms.primaryComplaint}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {a.symptoms.onset}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {a.evaluation ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide inline-block ${
                              a.evaluation.category === 'RED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : a.evaluation.category === 'AMBER'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : a.evaluation.category === 'GREEN'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-800 border border-slate-300'
                            }`}
                          >
                            {a.evaluation.category}
                          </span>
                        ) : (
                          <span className="text-slate-400">Unevaluated</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {a.evaluation?.news2Score !== null ? a.evaluation?.news2Score : '---'}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {a.workflowStatus.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectAssessment(a)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Live Referral Queue & Fast Actions (1 col) */}
        <div className="space-y-6">
          {/* Active Referrals Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-heading">Live Referral Pipeline</h3>
                <p className="text-xs text-slate-500">Status timeline & receiving acknowledgements</p>
              </div>

              <button
                type="button"
                onClick={onViewReferrals}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {referrals.slice(0, 3).map((ref) => (
                <div
                  key={ref.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-700">{ref.displayId}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        ref.status === 'ACCEPTED' || ref.status === 'IN_TRANSIT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ref.status === 'SENT'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {ref.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <strong className="text-slate-900 block">{ref.patientName}</strong>
                    <span className="text-slate-500 text-[11px]">To: {ref.destinationFacilityName}</span>
                  </div>

                  <div className="text-[11px] text-slate-600 italic">
                    Reason: {ref.reasonForReferral}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tools & Data Reset */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
            <div className="font-bold text-slate-900">Demo Operations & Controls</div>
            <p className="text-slate-500 text-[11px]">
              PulseGate runs 100% on synthetic data. You can inspect regional facilities or reset demo data anytime.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onViewFacilities}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 font-medium text-slate-800 transition-colors"
              >
                <span>Browse 12 Seeded Facilities</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={onResetDemo}
                className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Synthetic Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
