/**
 * @license
 * PulseGate System Audit Log & Traceability View (Module 26)
 * Immutable decision audit log, actor credentials, and timestamped actions
 */

import React, { useState } from 'react';
import type { AuditLogItem } from '../../types/index.ts';
import { ShieldCheck, Search, Filter, Clock, UserCheck } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogItem[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filtered = logs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (
      search &&
      !log.actor.toLowerCase().includes(search.toLowerCase()) &&
      !log.action.toLowerCase().includes(search.toLowerCase()) &&
      !log.summary.toLowerCase().includes(search.toLowerCase()) &&
      !log.resourceId.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono">
              SECURITY & AUDIT
            </span>
            <span className="text-xs text-slate-500">Immutable System Event Traceability</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
            Clinical Decision Audit Trail
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Every patient intake, deterministic rule execution, clinical override, referral submission, and census update is immutably logged for governance and quality assurance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Events Recorded:</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono">
            {logs.length} events
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search audit trail by actor, resource, action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium"
          >
            <option value="ALL">All Actions</option>
            <option value="TRIAGE_EVALUATION">Triage Evaluation</option>
            <option value="CLINICAL_OVERRIDE">Clinical Override</option>
            <option value="REFERRAL_DISPATCHED">Referral Dispatched</option>
            <option value="ASSESSMENT_CREATED">Assessment Created</option>
            <option value="BED_AVAILABILITY_UPDATE">Bed Census Update</option>
            <option value="DEMO_RESET">Demo Reset</option>
          </select>
        </div>

        <span className="text-slate-500 font-medium">
          Showing {filtered.length} of {logs.length} audit events
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Target Resource</th>
              <th className="py-3 px-4">Details / Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  No matching audit records.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        log.action.includes('OVERRIDE')
                          ? 'bg-rose-100 text-rose-800'
                          : log.action.includes('TRIAGE')
                          ? 'bg-teal-100 text-teal-800'
                          : log.action.includes('REFERRAL')
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <strong className="text-slate-900 block font-medium">{log.actor}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">{log.role}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-slate-700 font-semibold text-[11px]">
                      {log.resourceType}: {log.resourceId}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {log.summary}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
