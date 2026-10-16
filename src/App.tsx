/**
 * @license
 * PulseGate Master Application Shell
 * AI-Assisted Clinical Triage, Explainable Decision Support & Smart Hospital Referral Platform
 * Supports Dual Workspaces: Patient & Care Navigation Portal + Clinical Staff & Provider Workspace
 */

import React, { useState, useEffect } from 'react';
import { store, DEMO_USERS, AppUser } from './services/storeService.ts';
import type {
  Assessment,
  Referral,
  Facility,
  TrainingScenario,
  LanguageCode,
  TriageEvaluation,
} from './types/index.ts';

// Patient Facing Components
import { PatientNavbar } from './components/navigation/PatientNavbar.tsx';
import { PatientFooter } from './components/navigation/PatientFooter.tsx';
import { LandingPage } from './components/patient/LandingPage.tsx';
import { PatientAssessmentFlow } from './components/patient/PatientAssessmentFlow.tsx';
import { PatientGuidanceView } from './components/patient/PatientGuidanceView.tsx';
import { HowItWorksView } from './components/patient/HowItWorksView.tsx';

// Clinical / Provider Components
import { OverviewDashboard } from './components/dashboard/OverviewDashboard.tsx';
import { AssessmentWizard } from './components/assessment/AssessmentWizard.tsx';
import { AssessmentRegistry } from './components/assessment/AssessmentRegistry.tsx';
import { FacilityDirectoryView } from './components/facilities/FacilityDirectoryView.tsx';
import { ReferralsManagerView } from './components/referrals/ReferralsManagerView.tsx';
import { TrainingSimulatorView } from './components/training/TrainingSimulatorView.tsx';
import { AnalyticsDashboardView } from './components/analytics/AnalyticsDashboardView.tsx';
import { AuditLogView } from './components/audit/AuditLogView.tsx';
import { Triage3DVisualizer } from './components/three/Triage3DVisualizer.tsx';

// Icons
import {
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  MapPin,
  Send,
  Sparkles,
  BarChart3,
  ShieldAlert,
  Boxes,
  Bell,
  Search,
  RotateCcw,
  Menu,
  X,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';

export type WorkspaceMode = 'PATIENT' | 'PROVIDER';

export type PatientTab =
  | 'HOME'
  | 'ASSESSMENT'
  | 'RESULTS'
  | 'FIND_CARE'
  | 'HOW_IT_WORKS'
  | 'DEMO_SCENARIOS';

export type ProviderTab =
  | 'OVERVIEW'
  | 'NEW_ASSESSMENT'
  | 'REGISTRY'
  | 'FACILITIES'
  | 'REFERRALS'
  | 'SCENARIOS'
  | '3D_TWIN'
  | 'ANALYTICS'
  | 'AUDIT_LOG';

export default function App() {
  // Top-level workspace mode: Patient Portal or Provider Workspace
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('PATIENT');

  // Tab states
  const [patientTab, setPatientTab] = useState<PatientTab>('HOME');
  const [providerTab, setProviderTab] = useState<ProviderTab>('OVERVIEW');

  // Selected language
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');

  // UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active completed assessment for the patient guidance view
  const [latestPatientAssessment, setLatestPatientAssessment] = useState<{
    assessment: Assessment;
    evaluation: TriageEvaluation;
  } | null>(null);

  // Wizard state (when editing or reviewing an assessment in provider mode)
  const [selectedAssessmentForWizard, setSelectedAssessmentForWizard] = useState<Assessment | undefined>(
    undefined
  );

  // Reactive store state
  const [assessments, setAssessments] = useState<Assessment[]>(store.getAssessments());
  const [referrals, setReferrals] = useState<Referral[]>(store.getReferrals());
  const [facilities, setFacilities] = useState<Facility[]>(store.getFacilities());
  const [notifications, setNotifications] = useState(store.getNotifications());
  const [auditLogs, setAuditLogs] = useState(store.getAuditLogs());
  const [activeUser, setActiveUser] = useState<AppUser>(store.getActiveUser());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setAssessments([...store.getAssessments()]);
      setReferrals([...store.getReferrals()]);
      setFacilities([...store.getFacilities()]);
      setNotifications([...store.getNotifications()]);
      setAuditLogs([...store.getAuditLogs()]);
      setActiveUser(store.getActiveUser());
    });
    return () => unsubscribe();
  }, []);

  // Keyboard shortcut for universal search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  // Handlers for switching and workflows
  const handleStartPatientAssessment = () => {
    setPatientTab('ASSESSMENT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePatientAssessmentComplete = (newAssess: Assessment, evaluation: TriageEvaluation) => {
    // Save to local store so provider workspace immediately sees it
    store.saveAssessment(newAssess);
    setLatestPatientAssessment({ assessment: newAssess, evaluation });
    setPatientTab('RESULTS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartProviderNewAssessment = () => {
    setSelectedAssessmentForWizard(undefined);
    setProviderTab('NEW_ASSESSMENT');
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReviewAssessment = (assessment: Assessment) => {
    setSelectedAssessmentForWizard(assessment);
    setWorkspaceMode('PROVIDER');
    setProviderTab('NEW_ASSESSMENT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadScenarioIntoAssessment = (scen: TrainingScenario) => {
    // Generate a fresh assessment from this scenario
    const newAssess: Assessment = {
      id: `PG-2026-${Math.floor(100 + Math.random() * 900)}`,
      displayId: `PG-2026-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clinicId: scen.syntheticPatient.clinicId,
      clinicName: scen.syntheticPatient.clinicName,
      creatorName: activeUser.name,
      creatorRole: activeUser.role,
      workflowStatus: 'DRAFT',
      patient: scen.syntheticPatient,
      symptoms: {
        rawTranscript: scen.syntheticSymptoms.rawTranscript,
        transcriptLanguage: scen.syntheticSymptoms.language,
        intakeMethod: 'PRESET_SCENARIO',
        primaryComplaint: scen.syntheticSymptoms.primaryComplaint,
        onset: scen.syntheticSymptoms.onset,
        duration: scen.syntheticSymptoms.duration,
        severityScale: scen.syntheticSymptoms.severity,
        symptoms: scen.syntheticSymptoms.symptoms,
        reportedRedFlags: scen.syntheticSymptoms.redFlags,
        uncertainItems: [],
        missingInformation: [],
        humanConfirmed: true,
        confirmedAt: new Date().toISOString(),
        confirmedBy: activeUser.name,
      },
      observations: scen.syntheticObservations,
      evaluationHistory: [],
      dataProvenance: 'SIMULATED',
      isSimulatedDemo: true,
    };

    setSelectedAssessmentForWizard(newAssess);
    setWorkspaceMode('PROVIDER');
    setProviderTab('NEW_ASSESSMENT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadScenarioFromPatientLanding = (scen: TrainingScenario) => {
    // Load scenario and navigate to patient assessment or results
    handleLoadScenarioIntoAssessment(scen);
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset all synthetic records, facilities, and referrals to initial demo seed?')) {
      store.resetToDemoData();
      setProviderTab('OVERVIEW');
      setPatientTab('HOME');
    }
  };

  // Universal Search Results
  const searchResults = store.searchAll(searchQuery);

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#172B3A] flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* =========================================================================
          WORKSPACE A: PATIENT & PUBLIC CARE NAVIGATION
          ========================================================================= */}
      {workspaceMode === 'PATIENT' ? (
        <div className="flex flex-col min-h-screen">
          {/* Patient Top Navigation */}
          <PatientNavbar
            currentTab={patientTab}
            onNavigate={(tab) => {
              setPatientTab(tab as PatientTab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSwitchToProvider={() => {
              setWorkspaceMode('PROVIDER');
              setProviderTab('OVERVIEW');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={(lang) => setSelectedLanguage(lang)}
          />

          {/* Patient Main Content */}
          <main className="flex-1">
            {patientTab === 'HOME' && (
              <LandingPage
                onStartAssessment={handleStartPatientAssessment}
                onExploreHowItWorks={() => {
                  setPatientTab('HOW_IT_WORKS');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onFindCare={() => {
                  setPatientTab('FIND_CARE');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectDemoScenario={handleLoadScenarioFromPatientLanding}
              />
            )}

            {patientTab === 'ASSESSMENT' && (
              <PatientAssessmentFlow
                initialLanguage={selectedLanguage}
                onComplete={handlePatientAssessmentComplete}
                onCancel={() => {
                  setPatientTab('HOME');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {patientTab === 'RESULTS' && latestPatientAssessment && (
              <PatientGuidanceView
                assessment={latestPatientAssessment.assessment}
                evaluation={latestPatientAssessment.evaluation}
                onStartNewAssessment={handleStartPatientAssessment}
                onSwitchToProviderView={(assess) => {
                  setSelectedAssessmentForWizard(assess);
                  setWorkspaceMode('PROVIDER');
                  setProviderTab('NEW_ASSESSMENT');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {patientTab === 'FIND_CARE' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12304a] font-heading">
                      Healthcare Facilities & Capacity Directory
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Explore verified secondary and tertiary hospitals, live bed occupancy, and specialist clinical capabilities.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartPatientAssessment}
                    className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
                  >
                    <span>Assess My Symptoms First</span>
                    <HeartPulse className="w-4 h-4" />
                  </button>
                </div>

                <FacilityDirectoryView
                  facilities={facilities}
                  onSelectFacilityForReferral={() => {
                    handleStartPatientAssessment();
                  }}
                />
              </div>
            )}

            {patientTab === 'HOW_IT_WORKS' && (
              <HowItWorksView
                onStartAssessment={handleStartPatientAssessment}
                onExploreDirectory={() => {
                  setPatientTab('FIND_CARE');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {patientTab === 'DEMO_SCENARIOS' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="pb-2 border-b border-slate-200">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12304a] font-heading">
                    14 Synthetic Clinical Demonstration Cases
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Select any case to test PulseGate’s multilingual intake, NEWS2 deterministic rules, and facility routing.
                  </p>
                </div>
                <TrainingSimulatorView onLoadScenario={handleLoadScenarioIntoAssessment} />
              </div>
            )}
          </main>

          {/* Patient Footer */}
          <PatientFooter
            onNavigate={(tab) => {
              setPatientTab(tab as PatientTab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSwitchToProvider={() => {
              setWorkspaceMode('PROVIDER');
              setProviderTab('OVERVIEW');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      ) : (
        /* =========================================================================
           WORKSPACE B: CLINICAL STAFF & PROVIDER WORKSPACE
           ========================================================================= */
        <div className="flex flex-col min-h-screen">
          {/* Provider Top Header */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
              {/* Left: Mobile Toggle & Brand */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <div
                  onClick={() => setProviderTab('OVERVIEW')}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#12304a] flex items-center justify-center text-teal-400 font-extrabold shadow-xs">
                    PG
                  </div>
                  <div>
                    <span className="font-extrabold text-lg tracking-tight text-[#12304a] font-heading">
                      PULSE<span className="text-teal-700">GATE</span>
                    </span>
                    <span className="hidden sm:inline-block text-[10px] text-teal-900 font-semibold ml-2 py-0.5 px-2 bg-teal-50 rounded-full border border-teal-200">
                      CLINICAL WORKSPACE
                    </span>
                  </div>
                </div>
              </div>

              {/* Center: Universal Command Search Trigger */}
              <div className="hidden md:flex flex-1 max-w-md mx-4">
                <button
                  type="button"
                  onClick={() => setIsSearchModalOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100/80 hover:bg-slate-100 border border-slate-200 text-xs text-slate-500 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <span>Search patients, symptoms, hospitals, scenarios...</span>
                  </span>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-300 text-slate-600 shadow-2xs">
                    ⌘K
                  </kbd>
                </button>
              </div>

              {/* Right: Switch to Patient, Mode Badge, Notifications, User Switcher */}
              <div className="flex items-center gap-2.5">
                {/* Switch back to Patient Portal button */}
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceMode('PATIENT');
                    setPatientTab('HOME');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
                  title="Switch to public patient care navigation"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Patient Portal</span>
                </button>

                {/* Hardware-Free Simulator Badge */}
                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[11px] font-semibold text-teal-800">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                  <span>HARDWARE-FREE SIMULATOR</span>
                </div>

                {/* Notifications Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifsCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 text-xs space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-bold text-slate-900">Notifications ({notifications.length})</span>
                        <button
                          type="button"
                          onClick={() => store.markAllNotificationsRead()}
                          className="text-[11px] text-teal-700 hover:underline font-medium"
                        >
                          Mark all read
                        </button>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-1.5">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => store.markNotificationRead(n.id)}
                            className={`p-2.5 rounded-lg border transition-colors cursor-pointer space-y-1 ${
                              n.read
                                ? 'bg-slate-50 border-slate-100 text-slate-600'
                                : 'bg-teal-50/50 border-teal-200 text-slate-900 font-medium'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <strong className="block">{n.title}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Active User Switcher */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#12304a] text-teal-400 font-bold text-xs flex items-center justify-center">
                      {activeUser.avatarInitials}
                    </div>
                    <div className="hidden md:block text-left">
                      <span className="text-xs font-semibold text-slate-900 block leading-tight">
                        {activeUser.name.split(',')[0]}
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight font-mono">
                        {activeUser.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs space-y-1">
                      <div className="p-2 border-b border-slate-100 text-[11px] text-slate-500 font-medium">
                        Switch Clinical Role:
                      </div>
                      {DEMO_USERS.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            store.setActiveUser(u);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                            u.id === activeUser.id
                              ? 'bg-teal-50 text-teal-900 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-medium">{u.name}</div>
                            <div className="text-[10px] text-slate-500">{u.role}</div>
                          </div>
                          {u.id === activeUser.id && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                        </button>
                      ))}
                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button
                          type="button"
                          onClick={handleResetDemoData}
                          className="w-full text-left p-2 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-medium flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Demo Data</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Provider Layout with Sidebar + Main View */}
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-1 gap-6">
            {/* Left Sidebar Navigation */}
            <aside
              className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white lg:bg-transparent border-r lg:border-r-0 border-slate-200 p-4 lg:p-0 flex flex-col justify-between shrink-0 transition-transform ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
              }`}
            >
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
                    Clinical Workflow
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setProviderTab('OVERVIEW');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      providerTab === 'OVERVIEW'
                        ? 'bg-[#12304a] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-teal-400" />
                    <span>Overview Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartProviderNewAssessment}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      providerTab === 'NEW_ASSESSMENT'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>New Assessment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProviderTab('REGISTRY');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      providerTab === 'REGISTRY'
                        ? 'bg-[#12304a] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4 text-teal-400" />
                    <span>Patient Queue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProviderTab('FACILITIES');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      providerTab === 'FACILITIES'
                        ? 'bg-[#12304a] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-teal-400" />
                    <span>Care Routing & Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProviderTab('REFERRALS');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      providerTab === 'REFERRALS'
                        ? 'bg-[#12304a] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Send className="w-4 h-4 text-teal-400" />
                    <span>Referrals & Transport</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
                    Simulators & 3D Twin
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setProviderTab('3D_TWIN');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      providerTab === '3D_TWIN'
                        ? 'bg-[#12304a] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Boxes className="w-4 h-4 text-teal-400" />
                    <span>3D Anatomy & Corridor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProviderTab('SCENARIOS');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      providerTab === 'SCENARIOS'
                        ? 'bg-[#12304a] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>14 Training Scenarios</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProviderTab('ANALYTICS');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      providerTab === 'ANALYTICS'
                        ? 'bg-[#12304a] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-teal-400" />
                    <span>Analytics Insights</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProviderTab('AUDIT_LOG');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      providerTab === 'AUDIT_LOG'
                        ? 'bg-[#12304a] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-teal-400" />
                    <span>Audit & Traceability</span>
                  </button>
                </div>
              </div>

              {/* Sidebar Bottom Clinic Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-xs shadow-2xs space-y-1 mt-6">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Active Origin Clinic</span>
                <strong className="text-slate-900 block truncate font-medium">{activeUser.clinicName}</strong>
                <span className="text-[10px] text-teal-700 font-mono block">Node ID: {activeUser.clinicId}</span>
              </div>
            </aside>

            {/* Provider Content Area */}
            <main className="flex-1 min-w-0">
              {providerTab === 'OVERVIEW' && (
                <OverviewDashboard
                  assessments={assessments}
                  referrals={referrals}
                  facilities={facilities}
                  onStartAssessment={handleStartProviderNewAssessment}
                  onSelectAssessment={handleReviewAssessment}
                  onViewFacilities={() => setProviderTab('FACILITIES')}
                  onViewReferrals={() => setProviderTab('REFERRALS')}
                  onOpenTraining={() => setProviderTab('SCENARIOS')}
                  onResetDemo={handleResetDemoData}
                />
              )}

              {providerTab === 'NEW_ASSESSMENT' && (
                <AssessmentWizard
                  initialAssessment={selectedAssessmentForWizard}
                  onFinish={() => setProviderTab('REFERRALS')}
                  onCancel={() => setProviderTab('OVERVIEW')}
                />
              )}

              {providerTab === 'REGISTRY' && (
                <AssessmentRegistry
                  assessments={assessments}
                  onStartNewAssessment={handleStartProviderNewAssessment}
                  onInitiateReferral={handleReviewAssessment}
                />
              )}

              {providerTab === 'FACILITIES' && (
                <FacilityDirectoryView
                  facilities={facilities}
                  onSelectFacilityForReferral={() => setProviderTab('NEW_ASSESSMENT')}
                />
              )}

              {providerTab === 'REFERRALS' && (
                <ReferralsManagerView
                  referrals={referrals}
                  assessments={assessments}
                  transports={store.getTransportRequests()}
                />
              )}

              {providerTab === 'SCENARIOS' && (
                <TrainingSimulatorView onLoadScenario={handleLoadScenarioIntoAssessment} />
              )}

              {providerTab === '3D_TWIN' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-[#12304a] font-heading">
                        Full-Viewport 3D Anatomy & Referral Corridor Twin
                      </h2>
                      <p className="text-xs text-slate-500">
                        Procedural multi-part PBR models with exploded view, organ system isolation, and systolic pulse kinematics.
                      </p>
                    </div>
                  </div>

                  <Triage3DVisualizer
                    urgencyCategory="RED"
                    primaryCondition="CARDIAC"
                    patientHeartRate={84}
                    className="h-[640px]"
                  />
                </div>
              )}

              {providerTab === 'ANALYTICS' && (
                <AnalyticsDashboardView
                  assessments={assessments}
                  referrals={referrals}
                  facilities={facilities}
                />
              )}

              {providerTab === 'AUDIT_LOG' && <AuditLogView logs={auditLogs} />}
            </main>
          </div>
        </div>
      )}

      {/* =========================================================================
          UNIVERSAL SEARCH MODAL (Command Palette ⌘K)
          ========================================================================= */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-4 space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search across patients, symptoms, hospitals, scenarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm font-medium focus:outline-none text-slate-900"
              />
              <button
                type="button"
                onClick={() => {
                  setIsSearchModalOpen(false);
                  setSearchQuery('');
                }}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {searchQuery.trim() && (
              <div className="max-h-96 overflow-y-auto space-y-3 divide-y divide-slate-100">
                {/* Assessments */}
                {searchResults.assessments.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="font-bold text-[10px] uppercase text-slate-400 block">
                      Assessments ({searchResults.assessments.length})
                    </span>
                    {searchResults.assessments.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          handleReviewAssessment(a);
                          setIsSearchModalOpen(false);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <strong className="text-slate-900">{a.patient.name}</strong> ({a.displayId})
                          <div className="text-slate-500 text-[11px]">{a.symptoms.primaryComplaint}</div>
                        </div>
                        <span className="font-bold text-teal-700">{a.evaluation?.category}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Facilities */}
                {searchResults.facilities.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="font-bold text-[10px] uppercase text-slate-400 block">
                      Hospitals & Facilities ({searchResults.facilities.length})
                    </span>
                    {searchResults.facilities.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => {
                          if (workspaceMode === 'PATIENT') {
                            setPatientTab('FIND_CARE');
                          } else {
                            setProviderTab('FACILITIES');
                          }
                          setIsSearchModalOpen(false);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <strong className="text-slate-900">{f.name}</strong> ({f.city})
                          <div className="text-slate-500 text-[11px]">{f.address}</div>
                        </div>
                        <span className="text-slate-600 font-medium">{f.estimatedDriveMinutes} mins</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Scenarios */}
                {searchResults.scenarios.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="font-bold text-[10px] uppercase text-slate-400 block">
                      Synthetic Scenarios ({searchResults.scenarios.length})
                    </span>
                    {searchResults.scenarios.map((sc) => (
                      <div
                        key={sc.id}
                        onClick={() => {
                          handleLoadScenarioIntoAssessment(sc);
                          setIsSearchModalOpen(false);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <strong className="text-slate-900">{sc.title}</strong> [{sc.code}]
                          <div className="text-slate-500 text-[11px]">{sc.description}</div>
                        </div>
                        <span className="font-bold text-rose-700">{sc.expectedTriageCategory}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
