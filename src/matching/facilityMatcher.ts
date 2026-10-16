/**
 * @license
 * PulseGate Intelligent Facility Matching & Ranking Service
 * Deterministic Two-Stage Algorithm: Eligibility Filtering -> Multi-Factor Ranking
 */

import type { Facility, FacilityMatchResult } from '../types/index.ts';

export interface MatchingCriteria {
  requiredCapabilities: string[];
  patientUrgencyCategory: 'RED' | 'AMBER' | 'GREEN' | 'GRAY';
  preferredDepartmentType?: 'ICU' | 'CARDIAC_CCU' | 'STROKE_UNIT' | 'EMERGENCY_BAY';
  maxTravelMinutes?: number;
}

/**
 * Stage A & B: Filter by eligibility then rank by travel time, bed availability, and data freshness.
 */
export function matchAndRankFacilities(
  facilities: Facility[],
  criteria: MatchingCriteria
): FacilityMatchResult[] {
  const { requiredCapabilities, preferredDepartmentType } = criteria;

  const results: FacilityMatchResult[] = facilities.map((facility) => {
    const exclusionReasons: string[] = [];
    const matchedCapabilities: string[] = [];
    const missingMandatoryCapabilities: string[] = [];

    // 1. Check Operational Status
    if (facility.operationalStatus === 'CLOSED' || facility.operationalStatus === 'TEMPORARILY_UNAVAILABLE') {
      exclusionReasons.push(`Facility is currently ${facility.operationalStatus.replace('_', ' ')}.`);
    }

    // 2. Check Referral Acceptance
    if (!facility.acceptingReferrals) {
      exclusionReasons.push('Facility is not currently accepting incoming patient referrals.');
    }

    // 3. Check Mandatory Capabilities
    for (const reqCap of requiredCapabilities) {
      const hasCap = facility.capabilities.includes(reqCap);
      if (hasCap) {
        matchedCapabilities.push(reqCap);
      } else {
        missingMandatoryCapabilities.push(reqCap);
        exclusionReasons.push(`Missing mandatory capability: '${reqCap}'`);
      }
    }

    const isEligible = exclusionReasons.length === 0;

    // Check availability state
    let totalAvailRelevantBeds = 0;
    let hasStaleData = facility.dataFreshnessMinutes > 120;
    let availabilityState: FacilityMatchResult['availabilityState'] = 'CONFIRMED_BED';

    if (preferredDepartmentType) {
      const dept = facility.departments.find((d) => d.type === preferredDepartmentType);
      if (dept) {
        totalAvailRelevantBeds = dept.availableBeds;
        if (dept.status === 'STALE' || hasStaleData) {
          availabilityState = 'STALE_WARNING';
        } else if (dept.availableBeds === 0) {
          availabilityState = 'UNAVAILABLE';
        } else if (dept.availableBeds <= 2) {
          availabilityState = 'LIMITED';
        }
      } else {
        availabilityState = 'UNKNOWN';
      }
    } else {
      const anyAvailable = facility.departments.some((d) => d.availableBeds > 0);
      if (hasStaleData) availabilityState = 'STALE_WARNING';
      else if (!anyAvailable) availabilityState = 'UNAVAILABLE';
    }

    // Stage B: Multi-Factor Scoring
    let matchScore = 0;
    let rankingRationale = '';

    if (isEligible) {
      // Base score 100
      let score = 100;

      // Distance / travel time penalty
      const travelPenalty = Math.min(facility.estimatedDriveMinutes * 0.75, 45);
      score -= travelPenalty;

      // Bed availability bonus / penalty
      if (availabilityState === 'CONFIRMED_BED') {
        score += 15;
      } else if (availabilityState === 'LIMITED') {
        score += 5;
      } else if (availabilityState === 'UNAVAILABLE') {
        score -= 25;
      }

      // Freshness penalty
      if (hasStaleData) {
        score -= 20;
      } else if (facility.dataFreshnessMinutes <= 30) {
        score += 5;
      }

      matchScore = Math.max(1, Math.min(100, Math.round(score)));

      rankingRationale = `Eligible candidate: Satisfies all ${requiredCapabilities.length} mandatory clinical capabilities. Estimated transit: ${facility.estimatedDriveMinutes} mins (${facility.distanceKm} km). Data freshness: ${facility.dataFreshnessMinutes}m ago. ${
        availabilityState === 'STALE_WARNING'
          ? 'Warning: Availability record is stale (>2 hrs).'
          : availabilityState === 'UNAVAILABLE'
          ? 'Notice: Bed census is at maximum capacity.'
          : 'Bed capacity confirmed.'
      }`;
    } else {
      matchScore = 0;
      rankingRationale = `Ineligible: ${exclusionReasons[0]}${
        facility.distanceKm < 10
          ? ` (Note: Despite close proximity of ${facility.distanceKm} km, mandatory clinical capabilities take absolute precedence over distance).`
          : ''
      }`;
    }

    return {
      facility,
      isEligible,
      matchScore,
      exclusionReasons,
      capabilityMatchCount: matchedCapabilities.length,
      totalRequiredCapabilities: requiredCapabilities.length,
      matchedCapabilities,
      missingMandatoryCapabilities,
      availabilityState,
      freshnessWarning: hasStaleData,
      rankingRationale,
    };
  });

  // Sort: Eligible first, then descending by matchScore, then by estimatedDriveMinutes
  return results.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore;
    return a.facility.estimatedDriveMinutes - b.facility.estimatedDriveMinutes;
  });
}
