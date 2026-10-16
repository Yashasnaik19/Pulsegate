import test from 'node:test';
import assert from 'node:assert/strict';
import { matchAndRankFacilities } from './facilityMatcher.ts';
import { SEEDED_FACILITIES } from '../data/seedFacilities.ts';

test('Facility matching: Strict capability requirement excludes nearby facilities lacking mandatory service', () => {
  const cardiacCriteria = {
    requiredCapabilities: [
      '24/7 Cardiac Catheterization Lab (Cath Lab)',
      'Cardiac Care Unit (CCU)',
    ],
    patientUrgencyCategory: 'RED' as const,
    preferredDepartmentType: 'CARDIAC_CCU' as const,
  };

  const results = matchAndRankFacilities(SEEDED_FACILITIES, cardiacCriteria);

  // KC General is closest (3.8 km), but lacks Cath Lab!
  const kcgResult = results.find((r) => r.facility.id === 'FAC-005');
  assert.ok(kcgResult, 'KC General should be in results');
  assert.equal(kcgResult.isEligible, false, 'KC General must be excluded because it lacks Cath Lab');
  assert.ok(
    kcgResult.missingMandatoryCapabilities.includes('24/7 Cardiac Catheterization Lab (Cath Lab)')
  );

  // Jayadeva has Cath Lab + CCU
  const jayadevaResult = results.find((r) => r.facility.id === 'FAC-001');
  assert.ok(jayadevaResult);
  assert.equal(jayadevaResult.isEligible, true);
  assert.ok(jayadevaResult.matchScore > 50);

  // The top ranked facility must be eligible
  assert.equal(results[0].isEligible, true);
  assert.equal(results[0].facility.id, 'FAC-001');
});

test('Facility matching: Excludes facilities that are not operational or not accepting referrals', () => {
  const results = matchAndRankFacilities(SEEDED_FACILITIES, {
    requiredCapabilities: ['24/7 Emergency Department'],
    patientUrgencyCategory: 'GREEN' as const,
  });

  const hosakote = results.find((r) => r.facility.id === 'FAC-012'); // TEMPORARILY_UNAVAILABLE
  assert.ok(hosakote);
  assert.equal(hosakote.isEligible, false);
  assert.ok(hosakote.exclusionReasons.some((r) => r.includes('TEMPORARILY UNAVAILABLE')));

  const indiranagar = results.find((r) => r.facility.id === 'FAC-010'); // not accepting referrals
  assert.ok(indiranagar);
  assert.equal(indiranagar.isEligible, false);
  assert.ok(indiranagar.exclusionReasons.some((r) => r.includes('not currently accepting')));
});

test('Facility matching: Flags stale data (>120 mins) with warning', () => {
  const results = matchAndRankFacilities(SEEDED_FACILITIES, {
    requiredCapabilities: ['Pulmonology Specialist'],
    patientUrgencyCategory: 'AMBER' as const,
  });

  const bowring = results.find((r) => r.facility.id === 'FAC-004'); // Bowring has dataFreshness = 180m
  assert.ok(bowring);
  assert.equal(bowring.freshnessWarning, true);
});
