/**
 * @license
 * PulseGate Patient-Facing Footer
 * Compliant medical disclaimer, privacy reassurance & navigation links
 */

import React from 'react';
import { HeartPulse, ShieldCheck, Lock, ExternalLink } from 'lucide-react';

interface PatientFooterProps {
  onNavigate: (tab: string) => void;
  onSwitchToProvider: () => void;
}

export const PatientFooter: React.FC<PatientFooterProps> = ({
  onNavigate,
  onSwitchToProvider,
}) => {
  return (
    <footer className="bg-[#12304a] text-slate-300 pt-12 pb-8 border-t border-slate-800 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Upper Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0f766e] flex items-center justify-center text-white">
                <HeartPulse className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-white font-heading">
                Pulse<span className="text-[#0d9488]">Gate</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-md leading-relaxed">
              AI-assisted triage and smart care navigation platform. Helping patients and frontline
              healthcare workers identify the right care and appropriate destination before travelling.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0d9488]" />
                <span>Deterministic Safety Rules</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#0d9488]" />
                <span>Private & Hardware-Free</span>
              </span>
            </div>
          </div>

          {/* Patient Quick Links */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Patient Care</h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('ASSESSMENT')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Start Symptom Assessment
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('FIND_CARE')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Explore Healthcare Facilities
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('HOW_IT_WORKS')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  How PulseGate Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('DEMO_SCENARIOS')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Demonstration Cases
                </button>
              </li>
            </ul>
          </div>

          {/* Provider & Governance */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Clinical Workspace</h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={onSwitchToProvider}
                  className="text-teal-400 hover:text-teal-300 font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Clinician / Provider Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </li>
              <li>
                <span className="text-slate-500">NEWS2 Protocol v2.4.1</span>
              </li>
              <li>
                <span className="text-slate-500">Zero Hardware Dependency</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Required Healthcare Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] leading-relaxed text-slate-400 space-y-1">
          <strong className="text-amber-400 block font-semibold">Important Medical Notice & Limitations:</strong>
          <p>
            PulseGate provides software-based clinical decision support and health navigation guidance. It is
            intended to support care decisions and is <strong>not an autonomous medical diagnostic device</strong> or
            an emergency dispatch service. If you or someone you are assisting has symptoms of acute stroke (facial droop,
            arm weakness, slurred speech), sudden crushing chest pain, severe difficulty breathing, or severe trauma,
            call <strong>112 / 108 (or your local emergency number)</strong> immediately or proceed without delay to the
            nearest emergency hospital.
          </p>
        </div>

        {/* Bottom copyright */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <span>© 2026 PulseGate Healthcare Technologies. All rights reserved.</span>
          <span>Hackathon Demonstration Edition • Built for Frontline Care Teams</span>
        </div>
      </div>
    </footer>
  );
};
