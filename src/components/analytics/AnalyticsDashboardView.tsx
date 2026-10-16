/**
 * @license
 * PulseGate Operational Analytics Dashboard (Module 22)
 * Purely derived from stored records: triage distribution, transit times & data freshness
 */

import React from 'react';
import type { Assessment, Referral, Facility } from '../../types/index.ts';
import { BarChart3, PieChart, Clock, TrendingUp, Download, ShieldCheck } from 'lucide-react';

interface AnalyticsDashboardViewProps {
  assessments: Assessment[];
  referrals: Referral[];
  facilities: Facility[];
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  assessments,
  referrals,
  facilities,
}) => {
  // Category breakdown
  const redCount = assessments.filter((a) => a.evaluation?.category === 'RED').length;
  const amberCount = assessments.filter((a) => a.evaluation?.category === 'AMBER').length;
  const greenCount = assessments.filter((a) => a.evaluation?.category === 'GREEN').length;
  const grayCount = assessments.filter((a) => a.evaluation?.category === 'GRAY').length;
  const total = assessments.length || 1;

  // Referral status counts
  const sentCount = referrals.filter((r) => r.status === 'SENT').length;
  const acceptedCount = referrals.filter((r) => r.status === 'ACCEPTED').length;
  const declinedCount = referrals.filter((r) => r.status === 'DECLINED').length;
  const transitCount = referrals.filter((r) => r.status === 'IN_TRANSIT').length;
  const completedCount = referrals.filter((r) => r.status === 'COMPLETED').length;

  // Stale data counts
  const freshCount = facilities.filter((f) => f.dataFreshnessMinutes <= 30).length;
  const normalFreshCount = facilities.filter(
    (f) => f.dataFreshnessMinutes > 30 && f.dataFreshnessMinutes <= 120
  ).length;
  const staleCount = facilities.filter((f) => f.dataFreshnessMinutes > 120).length;

  // Export report
  const handleExportCSV = () => {
    const rows = [
      ['Assessment ID', 'Patient Name', 'Age', 'Urgency Category', 'NEWS2', 'Clinic', 'Status'],
      ...assessments.map((a) => [
        a.displayId,
        `"${a.patient.name}"`,
        a.patient.age,
        a.evaluation?.category || 'N/A',
        a.evaluation?.news2Score ?? 'N/A',
        `"${a.clinicName}"`,
        a.workflowStatus,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pulsegate_operational_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono">
              OPERATIONAL INSIGHTS
            </span>
            <span className="text-xs text-slate-500">
              Calculated Strictly from Persisted Database Records
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
            Triage & Referral Analytics
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Real-time analysis of clinical urgency distribution, referral turnaround times, and regional bed census freshness.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
        >
          <Download className="w-4 h-4 text-teal-400" />
          <span>Export Operational CSV</span>
        </button>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Triage Urgency Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Triage Urgency Breakdown
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">{assessments.length} Total</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-rose-800">CRITICAL RED</span>
                <span className="font-mono font-bold">
                  {redCount} ({Math.round((redCount / total) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full"
                  style={{ width: `${(redCount / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-amber-800">URGENT AMBER</span>
                <span className="font-mono font-bold">
                  {amberCount} ({Math.round((amberCount / total) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(amberCount / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-emerald-800">ROUTINE GREEN</span>
                <span className="font-mono font-bold">
                  {greenCount} ({Math.round((greenCount / total) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(greenCount / total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-600">INCOMPLETE (GRAY)</span>
                <span className="font-mono font-bold">
                  {grayCount} ({Math.round((grayCount / total) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full"
                  style={{ width: `${(grayCount / total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Referral Pipeline Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Referral Pipeline Status
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">{referrals.length} Outbound</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900">
              <span>Accepted by Receiving Hub:</span>
              <strong className="font-mono text-sm">{acceptedCount}</strong>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 text-blue-900">
              <span>In Transit (Ambulance):</span>
              <strong className="font-mono text-sm">{transitCount}</strong>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 text-slate-800">
              <span>Sent / Pending Response:</span>
              <strong className="font-mono text-sm">{sentCount}</strong>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 text-rose-900">
              <span>Declined / Reroute Required:</span>
              <strong className="font-mono text-sm">{declinedCount}</strong>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 text-purple-900">
              <span>Completed Transfers:</span>
              <strong className="font-mono text-sm">{completedCount}</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Bed Census Freshness & Data Quality */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Facility Census Freshness
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">{facilities.length} Facilities</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border space-y-1">
              <div className="flex justify-between font-semibold text-emerald-800">
                <span>Real-Time Fresh (&le; 30m):</span>
                <span>{freshCount} facilities</span>
              </div>
              <p className="text-[11px] text-slate-500">Verified census, ready for rapid transfer.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border space-y-1">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Standard (31 - 120m):</span>
                <span>{normalFreshCount} facilities</span>
              </div>
              <p className="text-[11px] text-slate-500">Within acceptable regional reporting interval.</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <div className="flex justify-between font-semibold text-amber-900">
                <span>Stale Warning (&gt; 120m):</span>
                <span>{staleCount} facilities</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Notice: Telephone confirmation required prior to dispatch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
