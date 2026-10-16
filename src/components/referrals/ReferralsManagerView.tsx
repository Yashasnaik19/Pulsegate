/**
 * @license
 * PulseGate Referrals & Transport Management View (Modules 16, 17, 18)
 * Lifecycle Status Transitions, Simulated Hospital Acknowledgement, and Handover Summaries
 */

import React, { useState } from 'react';
import type { Referral, Assessment, TransportRequest, ReferralStatus } from '../../types/index.ts';
import { store } from '../../services/storeService.ts';
import { ClinicalHandoverSummary } from '../handover/ClinicalHandoverSummary.tsx';
import {
  Send,
  CheckCircle2,
  XCircle,
  Truck,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ReferralsManagerViewProps {
  referrals: Referral[];
  assessments: Assessment[];
  transports: TransportRequest[];
}

export const ReferralsManagerView: React.FC<ReferralsManagerViewProps> = ({
  referrals,
  assessments,
  transports,
}) => {
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(referrals[0] || null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [activeHandoverModal, setActiveHandoverModal] = useState<Referral | null>(null);

  const filteredReferrals = referrals.filter((r) => {
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    return true;
  });

  const activeAssessment = assessments.find((a) => a.id === selectedReferral?.assessmentId);
  const activeTransport = transports.find((t) => t.referralId === selectedReferral?.id);

  const handleSimulateStatus = (newStatus: ReferralStatus, note: string) => {
    if (!selectedReferral) return;
    const updated = store.updateReferralStatus(
      selectedReferral.id,
      newStatus,
      note,
      'Emergency Dispatch Desk',
      'Coordinator'
    );
    if (updated) {
      setSelectedReferral({ ...updated });
    }
  };

  const handleSimulateAccept = () => {
    if (!selectedReferral) return;
    store.simulateAcknowledgement(selectedReferral.id, true);
    const updated = store.getReferralById(selectedReferral.id);
    if (updated) setSelectedReferral({ ...updated });
  };

  const handleSimulateDecline = () => {
    if (!selectedReferral) return;
    store.simulateAcknowledgement(selectedReferral.id, false);
    const updated = store.getReferralById(selectedReferral.id);
    if (updated) setSelectedReferral({ ...updated });
  };

  const handleDispatchTransport = () => {
    if (!selectedReferral) return;
    const transportId = `TRN-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newTrn: TransportRequest = {
      id: transportId,
      displayId: transportId,
      referralId: selectedReferral.id,
      assessmentId: selectedReferral.assessmentId,
      patientName: selectedReferral.patientName,
      urgency: selectedReferral.priority,
      pickupLocation: selectedReferral.referringClinic,
      destinationFacility: selectedReferral.destinationFacilityName,
      vehicleIdentifier: `KA-04-E-${Math.floor(1000 + Math.random() * 9000)} (ALS Unit)`,
      vehicleType: 'ADVANCED_LIFE_SUPPORT_AMBULANCE',
      status: 'EN_ROUTE_PICKUP',
      etaMinutes: 12,
      driverContact: '+91 98450 88219',
      isSimulated: true,
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.createTransportRequest(newTrn);
    handleSimulateStatus(
      'IN_TRANSIT',
      `ALS Ambulance ${newTrn.vehicleIdentifier} dispatched. ETA ${newTrn.etaMinutes} mins.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono">
              REFERRAL HUB
            </span>
            <span className="text-xs text-slate-500">End-to-End Hospital Handover & Ambulance Coordination</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
            Referral Pipeline & Transport Hub
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Track outbound patient transfers, simulate receiving facility bed acceptance/decline, dispatch emergency ambulances, and generate clinical SBAR handover summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Total Referrals:</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-600 text-white font-mono">
            {referrals.length} active
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-semibold mr-1">Filter Status:</span>
        {['ALL', 'SENT', 'ACCEPTED', 'DECLINED', 'IN_TRANSIT', 'COMPLETED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1 rounded-lg font-medium transition-colors border ${
              filterStatus === status
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Layout: Referrals List on Left, Selected Referral Action Center on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Referrals List */}
        <div className="space-y-3 lg:col-span-1 max-h-[640px] overflow-y-auto pr-1">
          {filteredReferrals.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
              No referrals found matching this status filter.
            </div>
          ) : (
            filteredReferrals.map((ref) => {
              const isSelected = ref.id === selectedReferral?.id;

              return (
                <div
                  key={ref.id}
                  onClick={() => setSelectedReferral(ref)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-300 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {ref.displayId}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        ref.status === 'ACCEPTED' || ref.status === 'IN_TRANSIT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ref.status === 'DECLINED'
                          ? 'bg-rose-100 text-rose-800'
                          : ref.status === 'SENT'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {ref.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <strong className="text-xs font-semibold text-slate-900 block">{ref.patientName}</strong>
                    <span className="text-[11px] text-slate-500">To: {ref.destinationFacilityName}</span>
                  </div>

                  <div className="text-[11px] text-slate-600 line-clamp-1 italic">
                    {ref.reasonForReferral}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Referral Details & Simulation Actions */}
        {selectedReferral && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-700">
                    {selectedReferral.displayId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      selectedReferral.priority === 'RED'
                        ? 'bg-rose-100 text-rose-800'
                        : selectedReferral.priority === 'AMBER'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Priority {selectedReferral.priority}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading mt-1">
                  {selectedReferral.patientName} ({selectedReferral.patientAge}y)
                </h3>
                <p className="text-xs text-slate-500">
                  From: {selectedReferral.referringClinic} &rarr; To: <strong>{selectedReferral.destinationFacilityName}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveHandoverModal(selectedReferral)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border transition-colors shrink-0"
              >
                <FileText className="w-4 h-4 text-teal-600" />
                <span>View Handover SBAR</span>
              </button>
            </div>

            {/* Interactive Simulation Action Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Interactive Workflow Simulator (Test Receiving Hospital Transitions):</span>
                </span>
                <span className="text-[11px] text-slate-500">Simulate real-world hospital events</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSimulateAccept}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simulate Hospital Accept</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateDecline}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors shadow-2xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Simulate Hospital Decline</span>
                </button>

                <button
                  type="button"
                  onClick={handleDispatchTransport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-2xs"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Dispatch ALS Ambulance</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateStatus('ARRIVED', 'Patient arrived at emergency receiving bay.')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Patient Arrived</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateStatus('COMPLETED', 'Clinical handover completed to receiving intensive care team.')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors shadow-2xs"
                >
                  <span>Complete Transfer</span>
                </button>
              </div>
            </div>

            {/* Transport Request Card if dispatched */}
            {activeTransport && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-700" />
                    <span>Dispatched Transport: {activeTransport.vehicleIdentifier}</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200 text-blue-900">
                    STATUS: {activeTransport.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-blue-900 text-xs">
                  Driver Contact: <strong>{activeTransport.driverContact}</strong> • ETA: <strong>{activeTransport.etaMinutes} mins</strong>
                </div>
              </div>
            )}

            {/* Referral Timeline History */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Audit Timeline & Status Transitions
              </h4>
              <div className="space-y-2">
                {selectedReferral.timeline.map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {evt.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-600">{evt.note}</p>
                    <div className="text-[10px] text-slate-400">
                      Actor: {evt.actor} ({evt.role}) {evt.isSimulated && '• [SIMULATED EVENT]'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Handover Summary Modal */}
      {activeHandoverModal && activeAssessment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <ClinicalHandoverSummary
            assessment={activeAssessment}
            referral={activeHandoverModal}
            onClose={() => setActiveHandoverModal(null)}
          />
        </div>
      )}
    </div>
  );
};
