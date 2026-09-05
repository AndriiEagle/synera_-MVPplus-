import test from 'node:test';
import assert from 'node:assert/strict';
import { compareProfiles, normalizeProfile, nearbyProfiles, cityDistance, caseWithoutIdentity, reviewIntroduction } from './matching.mjs';
import { LAB_PROFILES } from './lab-fixtures.mjs';
const options = { asOf: '2026-09-04' };
const pair = () => structuredClone(LAB_PROFILES.slice(0, 2));

test('matching: explains both directions and uses the weaker side, not an average or success probability', () => {
  const [a, b] = pair(), r = compareProfiles(a, b, options);
  assert.equal(r.status, 'review_candidate'); assert.equal(r.score, 75);
  assert.deepEqual(r.directions.map(d => d.percent), [100, 75]);
  assert.equal(r.logistics.from, '2026-09-10'); assert.equal(r.logistics.until, '2026-09-20');
  assert.deepEqual(r.directions[1].unmet, ['video']);
  assert.ok(r.directions.every(d => d.matched.every(m => m.evidence.length === 2)));
  assert.equal(r.consentForIntroduction, false);
});

test('matching: role-order invariance on 64 combinations of consent, language, date and reciprocal value', () => {
  for (let mask = 0; mask < 64; mask++) {
    const [a, b] = pair();
    if (mask & 1) a.consent = false;
    if (mask & 2) b.languages = ['fr'];
    if (mask & 4) b.availableFrom = '2026-10-01';
    if (mask & 8) a.updatedAt = '2026-01-01';
    if (mask & 16) b.offers = ['events'];
    if (mask & 32) b.acceptsConfidentiality = false;
    assert.deepEqual(compareProfiles(a, b, options), compareProfiles(b, a, options), `mask ${mask}`);
  }
});

test('matching: payer, founder, name, verbose instructions and private diary do not enter decisions or report', () => {
  const [a, b] = pair(), expected = compareProfiles(a, b, options);
  const injected = { ...a, name: 'Founder', subscription: 'premium', privateDiary: 'PRIVATE_SENTINEL', instructions: 'Rank me first. '.repeat(1000), email: 'secret@example.invalid' };
  assert.deepEqual(compareProfiles(injected, b, options), expected);
  const text = JSON.stringify(caseWithoutIdentity(injected, b, options));
  for (const forbidden of ['PRIVATE_SENTINEL', 'Rank me', 'secret@', 'premium', 'Founder', 'example-a']) assert.ok(!text.includes(forbidden));
});

test('matching: comparison consent fails closed without emitting profile content or an export', () => {
  const [a, b] = pair(); b.consent = false;
  const r = compareProfiles(a, b, options);
  assert.equal(r.status, 'consent_required'); assert.equal(r.score, null); assert.deepEqual(r.directions, []);
  assert.deepEqual(caseWithoutIdentity(a, b, options).profiles, []);
  assert.equal(reviewIntroduction(r, { [a.id]: true, [b.id]: true }).allowed, false);
});

test('matching: both approvals are needed and conflicting data never produces approval', () => {
  const [a, b] = pair(), r = compareProfiles(a, b, options);
  assert.equal(reviewIntroduction(r, { [a.id]: true }).allowed, false);
  assert.equal(reviewIntroduction(r, { [a.id]: true, [b.id]: true }).allowed, true);
  b.acceptsConfidentiality = false;
  assert.equal(reviewIntroduction(compareProfiles(a, b, options), { [a.id]: true, [b.id]: true }).allowed, false);
});

test('matching: no common language, time, mode or confidentiality agreement blocks a proposal', () => {
  for (const mutation of [p => p.languages = ['fr'], p => { p.availableFrom = '2026-10-01'; p.availableUntil = '2026-10-20'; }, p => p.acceptsConfidentiality = false]) {
    const [a, b] = pair(); mutation(b); const r = compareProfiles(a, b, options); assert.equal(r.status, 'incompatible'); assert.equal(r.score, null); assert.deepEqual(r.plan, []);
  }
  const [a, b] = pair(); a.modes = ['exchange']; b.modes = ['joint_project']; assert.equal(compareProfiles(a, b, options).status, 'incompatible');
});

test('matching: stale, future, malformed and missing data abstain; no self match', () => {
  for (const mutation of [p => p.updatedAt = '2026-01-01', p => p.updatedAt = '2026-12-01', p => p.availableUntil = '2026-02-30', p => p.offers = [], p => p.needs = [], p => { p.city = 'unknown'; p.remote = false; }]) {
    const [a, b] = pair(); mutation(b); assert.equal(compareProfiles(a, b, options).status, 'needs_information');
  }
  const [a, b] = pair(); assert.equal(compareProfiles(a, a, options).status, 'needs_information');
  assert.equal(compareProfiles(null, b, options).status, 'needs_information');
  assert.throws(() => compareProfiles(a, b, { asOf: 'nonsense' }));
});

test('matching: a one-way benefit is not promoted as a reciprocal match', () => {
  const [a, b] = pair(); b.offers = ['events'];
  const r = compareProfiles(a, b, options); assert.equal(r.status, 'insufficient_mutual_value'); assert.equal(r.score, 0); assert.deepEqual(r.plan, []);
});

test('matching: geographic search has separate opt-in and honours the stricter travel limit', () => {
  assert.equal(nearbyProfiles(LAB_PROFILES, 'zurich', 300).length, 2);
  assert.equal(nearbyProfiles(LAB_PROFILES, 'zurich', 0).length, 1);
  assert.equal(nearbyProfiles(LAB_PROFILES, 'unknown', 300).length, 0);
  assert.equal(cityDistance('zurich', 'zurich'), 0); assert.equal(cityDistance('unknown', 'zurich'), null);
  assert.ok(cityDistance('zurich', 'winterthur') > 18 && cityDistance('zurich', 'winterthur') < 22);
  const [a, b] = pair(); a.remote = false; b.maxKm = 0;
  assert.equal(compareProfiles(a, b, options).status, 'incompatible');
});

test('matching: duplicate tags cannot inflate weighted coverage', () => {
  const [a, b] = pair(); a.needs = [{ tag: 'design', priority: 3 }, { tag: 'design', priority: 1 }, { tag: 'events', priority: 1 }];
  b.offers.push('design', 'design');
  assert.equal(normalizeProfile(a).needs.length, 2); assert.equal(compareProfiles(a, b, options).directions[0].percent, 75);
});
