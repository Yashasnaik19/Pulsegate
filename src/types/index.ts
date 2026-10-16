/**
 * @license
 * PulseGate Clinical Decision Support & Smart Referral Platform
 * Type Definitions & Domain Models
 */

export type UrgencyCategory = 'RED' | 'AMBER' | 'GREEN' | 'GRAY';

export type LanguageCode = 'en' | 'kn' | 'hi';

export type DataSource = 
  | 'SIMULATED' 
  | 'MANUAL_ENTRY' 
  | 'LLM_EXTRACTED' 
  | 'CLINICIAN_CONFIRMED' 
  | 'EXTERNAL_PROVIDER' 
  | 'VERIFIED_FACILITY_SOURCE';

export interface PatientInfo {
  id: string;
  displayId: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  ageBand: 'ADULT' | 'PEDIATRIC' | 'GERIATRIC';
  preferredLanguage: LanguageCode;
  clinicId: string;
  clinicName: string;
  allergies: string[];
  medicalHistory: string[];
  currentMedications: string[];
  contactNumber?: string;
}

export interface ExtractedSymptom {
  concept: string;
  label: string;
  reportedStatus: 'present' | 'absent' | 'unknown';
  evidenceText: string;
  confidence: number;
}

export interface SymptomIntake {
  rawTranscript: string;
  transcriptLanguage: LanguageCode;
  intakeMethod: 'TEXT_INPUT' | 'SPEECH_RECOGNITION' | 'PRESET_SCENARIO';
  primaryComplaint: string;
  onset: string;
  duration: string;
  severityScale: number; // 1-10
  symptoms: ExtractedSymptom[];
  reportedRedFlags: string[];
  uncertainItems: string[];
  missingInformation: string[];
  humanConfirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface VitalSignsObservations {
  spo2: number | null; // %
  heartRate: number | null; // bpm
  temperature: number | null; // °C
  respiratoryRate: number | null; // breaths/min
  systolicBp: number | null; // mmHg
  diastolicBp: number | null; // mmHg
  consciousness: 'ALERT' | 'CONFUSION_NEW' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE' | null;
  onSupplementalOxygen: boolean | null;
  oxygenScale: 1 | 2; // 1 = standard, 2 = hypercapnic respiratory risk (COPD)
  dataSource: DataSource;
  signalQuality: 'OPTIMAL' | 'ACCEPTABLE' | 'DEGRADED' | 'INVALID';
  measurementTimestamp: string;
  notes?: string;
}

export interface MatchedRule {
  ruleId: string;
  ruleName: string;
  severity: UrgencyCategory;
  category: 'EMERGENCY_RED_FLAG' | 'NEWS2_PHYSIOLOGICAL' | 'CLINICAL_PROTOCOL';
  explanation: string;
  rationale: string;
  sourceGuideline: string;
}

export interface TriageEvaluation {
  id: string;
  assessmentId: string;
  ruleSetId: string;
  ruleSetVersion: string;
  evaluationTimestamp: string;
  category: UrgencyCategory;
  categoryLabel: string;
  news2Score: number | null;
  news2RiskLevel: 'LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'HIGH' | 'INCOMPLETE';
  news2Breakdown: Record<string, number>;
  matchedRules: MatchedRule[];
  missingRequiredObservations: string[];
  invalidObservations: string[];
  escalationRequirement: string;
  clinicalActionSummary: string;
  requiredFacilityCapabilities: string[];
  isHumanOverridden?: boolean;
  overrideCategory?: UrgencyCategory;
  overrideReason?: string;
  overrideBy?: string;
  overrideTimestamp?: string;
}

export type FacilityType = 
  | 'TERTIARY_ACADEMIC_CENTER'
  | 'REGIONAL_TRAUMA_CENTER'
  | 'DISTRICT_SPECIALTY_HOSPITAL'
  | 'COMMUNITY_HEALTH_CENTER'
  | 'SUB_DISTRICT_CLINIC';

export interface BedDepartment {
  name: string;
  type: 'ICU' | 'CARDIAC_CCU' | 'STROKE_UNIT' | 'EMERGENCY_BAY' | 'GENERAL_WARD' | 'PEDIATRICS';
  availableBeds: number;
  totalBeds: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'UNAVAILABLE' | 'STALE' | 'SIMULATED';
  lastUpdatedMinutesAgo: number;
}

export interface Facility {
  id: string;
  displayId: string;
  name: string;
  type: FacilityType;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  operationalStatus: 'OPERATIONAL' | 'LIMITED_SERVICES' | 'TEMPORARILY_UNAVAILABLE' | 'CLOSED';
  dataSource: DataSource;
  dataFreshnessMinutes: number;
  lastVerificationTime: string;
  capabilities: string[];
  departments: BedDepartment[];
  distanceKm: number;
  estimatedDriveMinutes: number;
  ambulanceAvailability: boolean;
  acceptingReferrals: boolean;
  notes?: string;
}

export interface FacilityMatchResult {
  facility: Facility;
  isEligible: boolean;
  matchScore: number; // 0 - 100
  exclusionReasons: string[];
  capabilityMatchCount: number;
  totalRequiredCapabilities: number;
  matchedCapabilities: string[];
  missingMandatoryCapabilities: string[];
  availabilityState: 'CONFIRMED_BED' | 'LIMITED' | 'UNKNOWN' | 'STALE_WARNING' | 'UNAVAILABLE';
  freshnessWarning: boolean;
  rankingRationale: string;
}

export type ReferralStatus = 
  | 'DRAFT'
  | 'AWAITING_REVIEW'
  | 'APPROVED'
  | 'READY_TO_SEND'
  | 'SENT'
  | 'ACKNOWLEDGEMENT_PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'ALTERNATIVE_DESTINATION_REQUIRED'
  | 'TRANSPORT_PENDING'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ReferralTimelineEvent {
  id: string;
  timestamp: string;
  status: ReferralStatus;
  actor: string;
  role: string;
  note: string;
  isSimulated: boolean;
}

export interface Referral {
  id: string;
  displayId: string;
  assessmentId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  referringClinic: string;
  referringClinician: string;
  destinationFacilityId: string;
  destinationFacilityName: string;
  priority: UrgencyCategory;
  status: ReferralStatus;
  reasonForReferral: string;
  requiredCapabilities: string[];
  provisionalSummary: string;
  handoverSummaryText: string;
  transportRequestId?: string;
  createdAt: string;
  updatedAt: string;
  timeline: ReferralTimelineEvent[];
}

export interface TransportRequest {
  id: string;
  displayId: string;
  referralId: string;
  assessmentId: string;
  patientName: string;
  urgency: UrgencyCategory;
  pickupLocation: string;
  destinationFacility: string;
  vehicleIdentifier: string;
  vehicleType: 'ADVANCED_LIFE_SUPPORT_AMBULANCE' | 'BASIC_LIFE_SUPPORT_AMBULANCE' | 'NEONATAL_CRITICAL_TRANSPORT' | 'AIR_AMBULANCE';
  status: 'REQUESTED' | 'ASSIGNED' | 'EN_ROUTE_PICKUP' | 'PATIENT_ONBOARD' | 'EN_ROUTE_DESTINATION' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
  etaMinutes: number;
  driverContact: string;
  isSimulated: boolean;
  requestedAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: string;
  displayId: string;
  createdAt: string;
  updatedAt: string;
  clinicId: string;
  clinicName: string;
  creatorName: string;
  creatorRole: string;
  workflowStatus: 
    | 'DRAFT' 
    | 'INTAKE_IN_PROGRESS' 
    | 'AWAITING_OBSERVATIONS' 
    | 'READY_FOR_EVALUATION' 
    | 'EVALUATION_COMPLETED' 
    | 'REQUIRES_CLINICAL_REVIEW' 
    | 'REFERRAL_DRAFT' 
    | 'REFERRED' 
    | 'CLOSED' 
    | 'CANCELLED';
  patient: PatientInfo;
  symptoms: SymptomIntake;
  observations: VitalSignsObservations;
  evaluation?: TriageEvaluation;
  evaluationHistory: TriageEvaluation[];
  referralId?: string;
  dataProvenance: DataSource;
  isSimulatedDemo: boolean;
}

export interface TrainingScenario {
  id: string;
  code: string;
  title: string;
  category: 'CARDIOLOGY' | 'NEUROLOGY' | 'RESPIRATORY' | 'SEPSIS' | 'TRAUMA' | 'EDGE_CASE';
  description: string;
  syntheticPatient: PatientInfo;
  syntheticSymptoms: {
    rawTranscript: string;
    language: LanguageCode;
    primaryComplaint: string;
    onset: string;
    duration: string;
    severity: number;
    symptoms: Array<{ concept: string; label: string; reportedStatus: 'present' | 'absent' | 'unknown'; evidenceText: string; confidence: number }>;
    redFlags: string[];
  };
  syntheticObservations: VitalSignsObservations;
  expectedTriageCategory: UrgencyCategory;
  expectedMandatoryCapabilities: string[];
  learningObjective: string;
  edgeCaseNote?: string;
}

export interface NotificationItem {
  id: string;
  type: 'TRIAGE_ALERT' | 'REFERRAL_STATUS' | 'TRANSPORT_UPDATE' | 'FACILITY_STALE' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  linkedAssessmentId?: string;
  linkedReferralId?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  resourceType: string;
  resourceId: string;
  summary: string;
  details?: Record<string, unknown>;
}
