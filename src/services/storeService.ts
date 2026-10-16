/**
 * @license
 * PulseGate Local Persistence & Operational Data Store
 * Fully reactive local storage manager with synthetic data seeds & transactional state
 */

import type {
  Assessment,
  Facility,
  Referral,
  TransportRequest,
  NotificationItem,
  AuditLogItem,
  ReferralStatus,
  UrgencyCategory,
} from '../types/index.ts';
import { SEEDED_FACILITIES } from '../data/seedFacilities.ts';
import { SEEDED_SCENARIOS } from '../data/seedScenarios.ts';
import { evaluateAssessment } from '../rules/rulesEngine.ts';

const STORAGE_KEYS = {
  ASSESSMENTS: 'pulsegate_assessments_v2',
  FACILITIES: 'pulsegate_facilities_v2',
  REFERRALS: 'pulsegate_referrals_v2',
  TRANSPORT: 'pulsegate_transport_v2',
  NOTIFICATIONS: 'pulsegate_notifications_v2',
  AUDIT: 'pulsegate_audit_v2',
  ACTIVE_USER: 'pulsegate_active_user_v2',
  OFFLINE_MODE: 'pulsegate_offline_mode_v2',
};

export interface AppUser {
  id: string;
  name: string;
  role: 'FRONT_LINE_WORKER' | 'CLINICAL_REVIEWER' | 'REFERRAL_COORDINATOR' | 'ADMINISTRATOR';
  clinicId: string;
  clinicName: string;
  avatarInitials: string;
}

export const DEMO_USERS: AppUser[] = [
  {
    id: 'USR-01',
    name: 'Nurse Deepa Hegde, RN',
    role: 'FRONT_LINE_WORKER',
    clinicId: 'CLN-NORTH-01',
    clinicName: 'Yelahanka Sub-District Primary Health Center',
    avatarInitials: 'DH',
  },
  {
    id: 'USR-02',
    name: 'Dr. Vikramaditya Rao, MD',
    role: 'CLINICAL_REVIEWER',
    clinicId: 'CLN-NORTH-01',
    clinicName: 'District Clinical Oversight Team',
    avatarInitials: 'VR',
  },
  {
    id: 'USR-03',
    name: 'Kavitha S., Dispatch Officer',
    role: 'REFERRAL_COORDINATOR',
    clinicId: 'CLN-COORD-01',
    clinicName: 'Regional Emergency Operations Hub',
    avatarInitials: 'KS',
  },
  {
    id: 'USR-04',
    name: 'Admin Rajesh M.',
    role: 'ADMINISTRATOR',
    clinicId: 'HQ-01',
    clinicName: 'Health Department Directorate',
    avatarInitials: 'RM',
  },
];

class StoreService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.ensureInitialized();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private getJson<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setJson<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  public ensureInitialized(): void {
    if (!localStorage.getItem(STORAGE_KEYS.FACILITIES)) {
      this.resetToDemoData();
    }
  }

  public resetToDemoData(): void {
    // 1. Seed Facilities
    this.setJson(STORAGE_KEYS.FACILITIES, SEEDED_FACILITIES);

    // 2. Seed Assessments from Scenarios
    const initialAssessments: Assessment[] = [];
    const initialReferrals: Referral[] = [];
    const initialTransports: TransportRequest[] = [];
    const now = new Date();

    // Create 4 initial seeded assessments with evaluations
    for (let i = 0; i < Math.min(4, SEEDED_SCENARIOS.length); i++) {
      const scen = SEEDED_SCENARIOS[i];
      const assessmentId = `PG-2026-000${100 + i}`;
      const evalResult = evaluateAssessment({
        assessmentId,
        patientAge: scen.syntheticPatient.age,
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
          confirmedAt: new Date(now.getTime() - (i + 1) * 3600000).toISOString(),
          confirmedBy: 'Nurse Deepa Hegde, RN',
        },
        observations: scen.syntheticObservations,
      });

      const assessment: Assessment = {
        id: assessmentId,
        displayId: assessmentId,
        createdAt: new Date(now.getTime() - (i + 1) * 3600000).toISOString(),
        updatedAt: new Date(now.getTime() - (i + 1) * 3600000).toISOString(),
        clinicId: scen.syntheticPatient.clinicId,
        clinicName: scen.syntheticPatient.clinicName,
        creatorName: 'Nurse Deepa Hegde, RN',
        creatorRole: 'Staff Nurse (Frontline)',
        workflowStatus: i === 0 ? 'REFERRED' : i === 1 ? 'REFERRAL_DRAFT' : 'EVALUATION_COMPLETED',
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
          confirmedAt: new Date(now.getTime() - (i + 1) * 3600000).toISOString(),
          confirmedBy: 'Nurse Deepa Hegde, RN',
        },
        observations: scen.syntheticObservations,
        evaluation: evalResult,
        evaluationHistory: [evalResult],
        dataProvenance: 'SIMULATED',
        isSimulatedDemo: true,
      };

      // Create linked referral for patient 0 (Sunita Sharma)
      if (i === 0) {
        const referralId = `REF-2026-0042`;
        assessment.referralId = referralId;
        const ref: Referral = {
          id: referralId,
          displayId: referralId,
          assessmentId: assessment.id,
          patientId: assessment.patient.id,
          patientName: assessment.patient.name,
          patientAge: assessment.patient.age,
          referringClinic: assessment.clinicName,
          referringClinician: assessment.creatorName,
          destinationFacilityId: 'FAC-002', // NIMHANS Neuro-Trauma
          destinationFacilityName: 'National Neuro-Trauma & Stroke Institute (NIMHANS Wing)',
          priority: 'RED',
          status: 'IN_TRANSIT',
          reasonForReferral: 'Suspected acute ischemic stroke within 3-hour thrombolysis window. Emergency neuro-CT & stroke team standby required.',
          requiredCapabilities: evalResult.requiredFacilityCapabilities,
          provisionalSummary: 'FAST positive acute stroke presentation. Right facial droop and right arm hemiparesis.',
          handoverSummaryText: `REFERRAL HANDOVER SUMMARY - PULSEGATE\nReferral ID: ${referralId} | Assessment: ${assessmentId}\nPatient: ${assessment.patient.name} (${assessment.patient.age}y / ${assessment.patient.gender})\nUrgency: CRITICAL RED\nDestination: National Neuro-Trauma & Stroke Institute\nPresenting Complaint: Acute right facial droop and right arm weakness\nNEWS2 Score: 0 (Normal physiological vitals, emergency red flag stroke trigger)\nMatched Protocol: AHA/ASA Acute Stroke Thrombolysis Pathway\nTransport: ALS Ambulance dispatched with tele-stroke notice`,
          createdAt: new Date(now.getTime() - 45 * 60000).toISOString(),
          updatedAt: new Date(now.getTime() - 10 * 60000).toISOString(),
          timeline: [
            {
              id: 'EVT-1',
              timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
              status: 'DRAFT',
              actor: 'Nurse Deepa Hegde, RN',
              role: 'Frontline Triage',
              note: 'Referral draft created from assessment PG-2026-000100',
              isSimulated: true,
            },
            {
              id: 'EVT-2',
              timestamp: new Date(now.getTime() - 35 * 60000).toISOString(),
              status: 'SENT',
              actor: 'Nurse Deepa Hegde, RN',
              role: 'Frontline Triage',
              note: 'Referral transmitted electronically to NIMHANS Acute Stroke Hub',
              isSimulated: true,
            },
            {
              id: 'EVT-3',
              timestamp: new Date(now.getTime() - 28 * 60000).toISOString(),
              status: 'ACCEPTED',
              actor: 'Dr. Suresh V. (NIMHANS)',
              role: 'Receiving Stroke Fellow',
              note: 'Referral accepted. Neuro-CT suite cleared for patient arrival.',
              isSimulated: true,
            },
            {
              id: 'EVT-4',
              timestamp: new Date(now.getTime() - 12 * 60000).toISOString(),
              status: 'IN_TRANSIT',
              actor: 'ALS-Echo-04 Driver',
              role: 'Paramedic',
              note: 'Patient onboard ALS Ambulance. Blue-light transit in progress.',
              isSimulated: true,
            },
          ],
        };
        initialReferrals.push(ref);

        // Linked transport
        initialTransports.push({
          id: 'TRN-2026-018',
          displayId: 'TRN-2026-018',
          referralId: ref.id,
          assessmentId: assessment.id,
          patientName: assessment.patient.name,
          urgency: 'RED',
          pickupLocation: assessment.clinicName,
          destinationFacility: ref.destinationFacilityName,
          vehicleIdentifier: 'KA-04-G-9921 (ALS-Echo-04)',
          vehicleType: 'ADVANCED_LIFE_SUPPORT_AMBULANCE',
          status: 'PATIENT_ONBOARD',
          etaMinutes: 14,
          driverContact: '+91 98450 77112',
          isSimulated: true,
          requestedAt: new Date(now.getTime() - 30 * 60000).toISOString(),
          updatedAt: new Date(now.getTime() - 10 * 60000).toISOString(),
        });
      }

      initialAssessments.push(assessment);
    }

    this.setJson(STORAGE_KEYS.ASSESSMENTS, initialAssessments);
    this.setJson(STORAGE_KEYS.REFERRALS, initialReferrals);
    this.setJson(STORAGE_KEYS.TRANSPORT, initialTransports);

    // Initial notifications
    const initialNotifications: NotificationItem[] = [
      {
        id: 'NOTIF-01',
        type: 'REFERRAL_STATUS',
        title: 'Referral Accepted by Receiving Hub',
        message: 'NIMHANS Acute Stroke Unit accepted referral REF-2026-0042 for Sunita Sharma.',
        timestamp: new Date(now.getTime() - 28 * 60000).toISOString(),
        read: false,
        severity: 'INFO',
        linkedReferralId: 'REF-2026-0042',
      },
      {
        id: 'NOTIF-02',
        type: 'TRIAGE_ALERT',
        title: 'High Urgency Case: ACS / STEMI Detected',
        message: 'Assessment PG-2026-000101 (Ramesh Gowda) triggered Red Flag for Acute Coronary Syndrome.',
        timestamp: new Date(now.getTime() - 90 * 60000).toISOString(),
        read: false,
        severity: 'CRITICAL',
        linkedAssessmentId: 'PG-2026-000101',
      },
      {
        id: 'NOTIF-03',
        type: 'FACILITY_STALE',
        title: 'Facility Data Stale Warning',
        message: 'Bowring Hospital bed census is older than 3 hours (180 mins). Please phone to confirm.',
        timestamp: new Date(now.getTime() - 120 * 60000).toISOString(),
        read: true,
        severity: 'WARNING',
      },
    ];
    this.setJson(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);

    // Initial audit logs
    const initialAudit: AuditLogItem[] = [
      {
        id: 'AUD-001',
        timestamp: new Date(now.getTime() - 50 * 60000).toISOString(),
        actor: 'Nurse Deepa Hegde, RN',
        role: 'FRONT_LINE_WORKER',
        action: 'ASSESSMENT_CREATED',
        resourceType: 'Assessment',
        resourceId: 'PG-2026-000100',
        summary: 'Initiated acute triage assessment for Sunita Sharma',
      },
      {
        id: 'AUD-002',
        timestamp: new Date(now.getTime() - 48 * 60000).toISOString(),
        actor: 'RulesEngine v2.4.1',
        role: 'SYSTEM',
        action: 'TRIAGE_EVALUATION',
        resourceType: 'Evaluation',
        resourceId: 'PG-2026-000100',
        summary: 'Deterministic rules evaluated: Matched EMERG-STROKE-FAST (RED category)',
      },
      {
        id: 'AUD-003',
        timestamp: new Date(now.getTime() - 35 * 60000).toISOString(),
        actor: 'Nurse Deepa Hegde, RN',
        role: 'FRONT_LINE_WORKER',
        action: 'REFERRAL_DISPATCHED',
        resourceType: 'Referral',
        resourceId: 'REF-2026-0042',
        summary: 'Submitted emergency referral to NIMHANS Wing',
      },
      {
        id: 'AUD-004',
        timestamp: new Date().toISOString(),
        actor: 'System Admin',
        role: 'ADMINISTRATOR',
        action: 'DEMO_DATA_INITIALIZED',
        resourceType: 'System',
        resourceId: 'PULSEGATE_DEMO',
        summary: 'Synthetic demonstration scenarios and facility network seeded',
      },
    ];
    this.setJson(STORAGE_KEYS.AUDIT, initialAudit);

    this.setActiveUser(DEMO_USERS[0]);
    this.logAuditEvent('DEMO_RESET', 'System', 'ALL', 'Reset all records to synthetic demonstration seed');
  }

  // Active User & Permissions
  public getActiveUser(): AppUser {
    return this.getJson<AppUser>(STORAGE_KEYS.ACTIVE_USER, DEMO_USERS[0]);
  }

  public setActiveUser(user: AppUser): void {
    this.setJson(STORAGE_KEYS.ACTIVE_USER, user);
    this.logAuditEvent('USER_SWITCH', 'User', user.id, `Active user switched to ${user.name} (${user.role})`);
  }

  // Assessments
  public getAssessments(): Assessment[] {
    return this.getJson<Assessment[]>(STORAGE_KEYS.ASSESSMENTS, []);
  }

  public getAssessmentById(id: string): Assessment | undefined {
    return this.getAssessments().find((a) => a.id === id || a.displayId === id);
  }

  public saveAssessment(assessment: Assessment): void {
    const list = this.getAssessments();
    const index = list.findIndex((a) => a.id === assessment.id);
    if (index >= 0) {
      list[index] = { ...assessment, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...assessment, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.setJson(STORAGE_KEYS.ASSESSMENTS, list);
    this.logAuditEvent(
      index >= 0 ? 'ASSESSMENT_UPDATED' : 'ASSESSMENT_CREATED',
      'Assessment',
      assessment.id,
      `Saved assessment for ${assessment.patient.name} (${assessment.workflowStatus})`
    );
  }

  public overrideTriage(
    assessmentId: string,
    overrideCategory: UrgencyCategory,
    reason: string,
    clinicianName: string
  ): Assessment | undefined {
    const assessment = this.getAssessmentById(assessmentId);
    if (!assessment || !assessment.evaluation) return undefined;

    const updatedEvaluation = {
      ...assessment.evaluation,
      category: overrideCategory,
      categoryLabel: `CLINICAL OVERRIDE: ${overrideCategory}`,
      isHumanOverridden: true,
      overrideCategory,
      overrideReason: reason,
      overrideBy: clinicianName,
      overrideTimestamp: new Date().toISOString(),
    };

    assessment.evaluation = updatedEvaluation;
    assessment.evaluationHistory.push(updatedEvaluation);
    assessment.workflowStatus = 'REQUIRES_CLINICAL_REVIEW';
    this.saveAssessment(assessment);

    this.logAuditEvent(
      'CLINICAL_OVERRIDE',
      'Evaluation',
      assessment.id,
      `Category overridden to ${overrideCategory} by ${clinicianName}. Reason: ${reason}`
    );

    return assessment;
  }

  // Facilities
  public getFacilities(): Facility[] {
    return this.getJson<Facility[]>(STORAGE_KEYS.FACILITIES, SEEDED_FACILITIES);
  }

  public getFacilityById(id: string): Facility | undefined {
    return this.getFacilities().find((f) => f.id === id || f.displayId === id);
  }

  public updateFacility(facility: Facility): void {
    const list = this.getFacilities();
    const idx = list.findIndex((f) => f.id === facility.id);
    if (idx >= 0) {
      list[idx] = facility;
      this.setJson(STORAGE_KEYS.FACILITIES, list);
      this.logAuditEvent('FACILITY_UPDATED', 'Facility', facility.id, `Updated details for ${facility.name}`);
    }
  }

  public updateBedCount(
    facilityId: string,
    departmentName: string,
    newCount: number
  ): void {
    const facilities = this.getFacilities();
    const fac = facilities.find((f) => f.id === facilityId);
    if (fac) {
      const dept = fac.departments.find((d) => d.name === departmentName);
      if (dept) {
        dept.availableBeds = newCount;
        dept.lastUpdatedMinutesAgo = 0;
        dept.status = newCount > 0 ? 'AVAILABLE' : 'UNAVAILABLE';
        fac.dataFreshnessMinutes = 0;
        fac.lastVerificationTime = new Date().toISOString();
        this.setJson(STORAGE_KEYS.FACILITIES, facilities);
        this.logAuditEvent(
          'BED_AVAILABILITY_UPDATE',
          'Facility',
          facilityId,
          `Updated ${departmentName} available beds to ${newCount}`
        );
      }
    }
  }

  // Referrals
  public getReferrals(): Referral[] {
    return this.getJson<Referral[]>(STORAGE_KEYS.REFERRALS, []);
  }

  public getReferralById(id: string): Referral | undefined {
    return this.getReferrals().find((r) => r.id === id || r.displayId === id);
  }

  public createReferral(referral: Referral): void {
    const list = this.getReferrals();
    list.unshift(referral);
    this.setJson(STORAGE_KEYS.REFERRALS, list);

    // Link back to assessment
    const assessment = this.getAssessmentById(referral.assessmentId);
    if (assessment) {
      assessment.referralId = referral.id;
      assessment.workflowStatus = 'REFERRAL_DRAFT';
      this.saveAssessment(assessment);
    }

    this.logAuditEvent(
      'REFERRAL_CREATED',
      'Referral',
      referral.id,
      `Drafted referral to ${referral.destinationFacilityName}`
    );
  }

  public updateReferralStatus(
    referralId: string,
    newStatus: ReferralStatus,
    note: string,
    actorName: string,
    actorRole: string
  ): Referral | undefined {
    const list = this.getReferrals();
    const ref = list.find((r) => r.id === referralId);
    if (!ref) return undefined;

    ref.status = newStatus;
    ref.updatedAt = new Date().toISOString();
    ref.timeline.push({
      id: `EVT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: newStatus,
      actor: actorName,
      role: actorRole,
      note,
      isSimulated: true,
    });

    this.setJson(STORAGE_KEYS.REFERRALS, list);

    // Update assessment workflow status accordingly
    const assessment = this.getAssessmentById(ref.assessmentId);
    if (assessment) {
      if (newStatus === 'SENT' || newStatus === 'ACCEPTED' || newStatus === 'IN_TRANSIT') {
        assessment.workflowStatus = 'REFERRED';
      } else if (newStatus === 'COMPLETED') {
        assessment.workflowStatus = 'CLOSED';
      }
      this.saveAssessment(assessment);
    }

    this.addNotification({
      type: 'REFERRAL_STATUS',
      title: `Referral Status: ${newStatus.replace('_', ' ')}`,
      message: `${ref.patientName} -> ${ref.destinationFacilityName}: ${note}`,
      severity: newStatus === 'DECLINED' ? 'CRITICAL' : 'INFO',
      linkedReferralId: ref.id,
    });

    this.logAuditEvent(
      'REFERRAL_TRANSITION',
      'Referral',
      referralId,
      `Status changed to ${newStatus}. Note: ${note}`
    );

    return ref;
  }

  // Simulated Acknowledgement Workflow (Module 16)
  public simulateAcknowledgement(referralId: string, accepted: boolean, note?: string): void {
    const defaultNote = accepted
      ? 'Receiving emergency triage desk reviewed clinical handover and accepted patient. Resuscitation bay prepared.'
      : 'Receiving facility unable to accept: Current critical care occupancy at maximum capacity. Alternative destination required.';

    const newStatus: ReferralStatus = accepted ? 'ACCEPTED' : 'DECLINED';
    this.updateReferralStatus(
      referralId,
      newStatus,
      note || defaultNote,
      'Receiving Hospital Coordinator (Simulated)',
      'Receiving Medical Officer'
    );
  }

  // Transport
  public getTransportRequests(): TransportRequest[] {
    return this.getJson<TransportRequest[]>(STORAGE_KEYS.TRANSPORT, []);
  }

  public createTransportRequest(request: TransportRequest): void {
    const list = this.getTransportRequests();
    list.unshift(request);
    this.setJson(STORAGE_KEYS.TRANSPORT, list);

    this.logAuditEvent(
      'TRANSPORT_REQUESTED',
      'Transport',
      request.id,
      `Requested ${request.vehicleType} for ${request.patientName}`
    );
  }

  public updateTransportStatus(
    requestId: string,
    newStatus: TransportRequest['status'],
    note?: string
  ): void {
    const list = this.getTransportRequests();
    const req = list.find((t) => t.id === requestId);
    if (req) {
      req.status = newStatus;
      req.updatedAt = new Date().toISOString();
      this.setJson(STORAGE_KEYS.TRANSPORT, list);

      this.logAuditEvent(
        'TRANSPORT_STATUS_UPDATE',
        'Transport',
        requestId,
        `Transport status updated to ${newStatus}${note ? `: ${note}` : ''}`
      );
    }
  }

  // Notifications
  public getNotifications(): NotificationItem[] {
    return this.getJson<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): void {
    const list = this.getNotifications();
    const item: NotificationItem = {
      ...notif,
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    list.unshift(item);
    this.setJson(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  public markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const n = list.find((item) => item.id === id);
    if (n) {
      n.read = true;
      this.setJson(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  public markAllNotificationsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.setJson(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  // Audit Logs
  public getAuditLogs(): AuditLogItem[] {
    return this.getJson<AuditLogItem[]>(STORAGE_KEYS.AUDIT, []);
  }

  public logAuditEvent(
    action: string,
    resourceType: string,
    resourceId: string,
    summary: string,
    details?: Record<string, unknown>
  ): void {
    const currentUser = this.getActiveUser();
    const logs = this.getAuditLogs();
    const item: AuditLogItem = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      role: currentUser.role,
      action,
      resourceType,
      resourceId,
      summary,
      details,
    };
    logs.unshift(item);
    // Keep max 200 logs
    if (logs.length > 200) logs.pop();
    this.setJson(STORAGE_KEYS.AUDIT, logs);
  }

  // Universal Quick Search (Module 45)
  public searchAll(query: string): {
    assessments: Assessment[];
    facilities: Facility[];
    referrals: Referral[];
    scenarios: typeof SEEDED_SCENARIOS;
  } {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { assessments: [], facilities: [], referrals: [], scenarios: [] };
    }

    const assessments = this.getAssessments().filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        a.displayId.toLowerCase().includes(q) ||
        a.patient.name.toLowerCase().includes(q) ||
        a.symptoms.primaryComplaint.toLowerCase().includes(q)
    );

    const facilities = this.getFacilities().filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q) ||
        f.displayId.toLowerCase().includes(q) ||
        f.capabilities.some((c) => c.toLowerCase().includes(q))
    );

    const referrals = this.getReferrals().filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        r.destinationFacilityName.toLowerCase().includes(q) ||
        r.reasonForReferral.toLowerCase().includes(q)
    );

    const scenarios = SEEDED_SCENARIOS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );

    return { assessments, facilities, referrals, scenarios };
  }
}

export const store = new StoreService();
