/**
 * @license
 * PulseGate Patient-Facing Navigation Bar
 * Accessible, responsive header with clean brand identity & mode switcher
 */

import React, { useState } from 'react';
import {
  Activity,
  HeartPulse,
  MapPin,
  HelpCircle,
  Stethoscope,
  Globe,
  Menu,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { LanguageCode } from '../../types/index.ts';

interface PatientNavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onSwitchToProvider: () => void;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
}

export const PatientNavbar: React.FC<PatientNavbarProps> = ({
  currentTab,
  onNavigate,
  onSwitchToProvider,
  selectedLanguage,
  onSelectLanguage,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'HOME', label: 'Home' },
    { id: 'ASSESSMENT', label: 'Start Assessment' },
    { id: 'FIND_CARE', label: 'Find Care' },
    { id: 'HOW_IT_WORKS', label: 'How It Works' },
    { id: 'DEMO_SCENARIOS', label: 'Demo Cases' },
  ];

  const handleNavClick = (tabId: string) => {
    onNavigate(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          onClick={() => handleNavClick('HOME')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-[#0f766e] flex items-center justify-center text-white shadow-xs">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#12304a] font-heading">
              Pulse<span className="text-[#0f766e]">Gate</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 ml-2">
              Care Navigation & Triage
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link.id)}
                className={`px-3.5 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-[#0f766e] font-semibold bg-[#ddf4f1]/50'
                    : 'text-slate-600 hover:text-[#12304a] hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Language Selector & Switch to Provider */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {selectedLanguage === 'en'
                  ? 'English'
                  : selectedLanguage === 'kn'
                  ? 'ಕನ್ನಡ (Kannada)'
                  : 'हिंदी (Hindi)'}
              </span>
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onSelectLanguage('en');
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 font-medium hover:bg-slate-50 ${
                    selectedLanguage === 'en' ? 'text-[#0f766e] font-bold bg-teal-50/50' : 'text-slate-700'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectLanguage('kn');
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 font-medium hover:bg-slate-50 ${
                    selectedLanguage === 'kn' ? 'text-[#0f766e] font-bold bg-teal-50/50' : 'text-slate-700'
                  }`}
                >
                  Kannada (KN)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectLanguage('hi');
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 font-medium hover:bg-slate-50 ${
                    selectedLanguage === 'hi' ? 'text-[#0f766e] font-bold bg-teal-50/50' : 'text-slate-700'
                  }`}
                >
                  Hindi (HI)
                </button>
              </div>
            )}
          </div>

          {/* Switch to Provider Workspace Button */}
          <button
            type="button"
            onClick={onSwitchToProvider}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#12304a] bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Clinicians & staff workspace"
          >
            <Stethoscope className="w-3.5 h-3.5 text-[#0f766e]" />
            <span>Staff Workspace</span>
          </button>

          {/* CTA: Start Assessment */}
          <button
            type="button"
            onClick={() => handleNavClick('ASSESSMENT')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0f766e] hover:bg-[#0d9488] shadow-xs transition-colors"
          >
            <span>Start Assessment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => handleNavClick(link.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={onSwitchToProvider}
              className="w-full text-center px-3 py-2.5 rounded-xl text-xs font-semibold text-[#12304a] bg-slate-100"
            >
              Clinician / Provider Workspace
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('ASSESSMENT')}
              className="w-full text-center px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0f766e]"
            >
              Start Health Assessment
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
