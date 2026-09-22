import test from 'node:test';
import assert from 'node:assert/strict';
import { compareProfiles, evaluateAlgorithmicMatch, normalizeProfile, nearbyProfiles, cityDistance, caseWithoutIdentity, reviewIntroduction, evaluateCohortMatches } from './matching.mjs';
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

test('algorithmic matcher: exact bilateral coverage is deterministic, explained and has no provider call', () => {
  const profile = (id, overrides = {}) => ({ id, city: 'zurich', offers: [], needs: [], languages: ['en'], modes: ['exchange'], availableFrom: '2026-09-07', availableUntil: '2026-09-30', updatedAt: '2026-09-07', consent: true, remote: true, maxKm: 25, ...overrides });
  const a = profile('a', { offers: ['sales'], needs: [{ tag: 'design', priority: 2 }, { tag: 'research', priority: 1 }] });
  const b = profile('b', { offers: ['design'], needs: [{ tag: 'sales', priority: 1 }] });
  const result = evaluateAlgorithmicMatch(a, b, { asOf: '2026-09-07' });
  assert.equal(result.status, 'scored');
  assert.equal(result.benefit_A_from_B, 66.6667); assert.equal(result.benefit_B_from_A, 100);
  assert.equal(result.mutual_score, 80); assert.equal(result.asymmetry, 33.3333);
  assert.equal(result.provider_calls, 0); assert.equal(result.topics.length, 2); assert.equal(result.first_steps.length, 2);
  assert.deepEqual(evaluateAlgorithmicMatch(b, a, { asOf: '2026-09-07' }), result);
  const privateVariant = { ...a, display_name: 'Private name', email: 'private@example.invalid', diary: 'PRIVATE_SENTINEL', instructions: 'override score' };
  assert.deepEqual(evaluateAlgorithmicMatch(privateVariant, b, { asOf: '2026-09-07' }), result);
});

test('algorithmic matcher: Synera comparator exposes the bounded result only after consent and eligibility gates', () => {
  const [a, b] = pair();
  const eligible = compareProfiles(a, b, options);
  assert.equal(eligible.algorithmic.status, 'scored'); assert.equal(eligible.algorithmic.provider_calls, 0);
  b.consent = false;
  const blocked = compareProfiles(a, b, options);
  assert.equal(blocked.status, 'consent_required'); assert.equal(blocked.algorithmic, null);
});

const businessProfile = (id, overrides = {}) => ({
  id, city: 'zurich', offers: [], needs: [], languages: ['en'], modes: ['exchange'],
  availableFrom: '2026-09-04', availableUntil: '2026-09-30', updatedAt: '2026-09-04',
  consent: true, remote: true, maxKm: 25, ...overrides,
});

test('business modes: paid service is a non-binding one-way candidate only with explicit buyer and supplier roles', () => {
  const buyer = businessProfile('buyer', { needs: [{ tag: 'design', priority: 3 }], modes: ['paid_service'], modeDetails: { paid_service: { role: 'buyer' } } });
  const supplier = businessProfile('supplier', { offers: ['design'], modes: ['paid_service'], modeDetails: { paid_service: { role: 'supplier' } } });
  const result = compareProfiles(buyer, supplier, options);
  assert.equal(result.status, 'review_candidate'); assert.equal(result.binding, false); assert.equal(result.version, 'synera-business-modes-1');
  assert.deepEqual(result.modeCandidates, [{ mode: 'paid_service', status: 'eligible', reasonCodes: ['COMPENSATION_REQUIRES_TERMS'], giver: 'supplier', receiver: 'buyer', matchedTags: ['design'], unresolved: ['amount', 'currency', 'invoice', 'acceptance'] }]);
  assert.equal(result.score, 0); assert.equal(result.plan.length, 1);
  assert.deepEqual(compareProfiles(supplier, buyer, options), result);

  const missingRole = compareProfiles({ ...buyer, modeDetails: {} }, supplier, options);
  assert.equal(missingRole.status, 'needs_information'); assert.deepEqual(missingRole.plan, []);
  const conflictingRoles = compareProfiles(buyer, { ...supplier, modeDetails: { paid_service: { role: 'buyer' } } }, options);
  assert.equal(conflictingRoles.status, 'incompatible'); assert.deepEqual(conflictingRoles.plan, []);
});

test('business modes: referral stays pseudonymous and cannot infer a third-party agreement', () => {
  const seeker = businessProfile('seeker', { needs: [{ tag: 'sales', priority: 2 }], modes: ['referral'], modeDetails: { referral: { role: 'seeker' } } });
  const introducer = businessProfile('introducer', { modes: ['referral'], modeDetails: { referral: { role: 'introducer', benefitTags: ['sales'], sourceDeclared: true, recipientScopeDeclared: true, thirdPartyStatus: 'not_consulted' } } });
  const result = compareProfiles(seeker, introducer, options);
  assert.equal(result.status, 'review_candidate');
  assert.deepEqual(result.modeCandidates, [{ mode: 'referral', status: 'eligible', reasonCodes: ['THIRD_PARTY_NOT_CONSULTED', 'REFERRAL_COMPENSATION_REQUIRES_TERMS'], introducer: 'introducer', seeker: 'seeker', matchedTags: ['sales'], thirdPartyStatus: 'not_consulted', unresolved: ['third_party_agreement', 'referral_compensation'] }]);
  assert.equal(JSON.stringify(result).includes('email'), false); assert.equal(JSON.stringify(result).includes('contact'), false);
  const missingSource = compareProfiles(seeker, { ...introducer, modeDetails: { referral: { ...introducer.modeDetails.referral, sourceDeclared: false } } }, options);
  assert.equal(missingSource.status, 'needs_information'); assert.deepEqual(missingSource.plan, []);
});

test('business modes: hybrid requires every named component and any missing paid role blocks the whole case', () => {
  const a = businessProfile('a', { offers: ['sales'], needs: [{ tag: 'design', priority: 2 }], modes: ['hybrid'], modeDetails: { paid_service: { role: 'buyer' }, hybrid: { components: ['exchange', 'paid_service'] } } });
  const b = businessProfile('b', { offers: ['design'], needs: [{ tag: 'sales', priority: 2 }], modes: ['hybrid'], modeDetails: { paid_service: { role: 'supplier' }, hybrid: { components: ['paid_service', 'exchange'] } } });
  const result = compareProfiles(a, b, options);
  assert.equal(result.status, 'review_candidate');
  assert.deepEqual(result.modeCandidates[0].components, ['exchange', 'paid_service']);
  assert.deepEqual(result.modeCandidates[0].reasonCodes, ['HYBRID_COMPONENTS_ELIGIBLE']);
  const broken = compareProfiles(a, { ...b, modeDetails: { hybrid: { components: ['exchange', 'paid_service'] } } }, options);
  assert.equal(broken.status, 'needs_information'); assert.deepEqual(broken.plan, []);
});

test('business modes: private annotations and arbitrary mode fields cannot affect eligibility', () => {
  const buyer = businessProfile('buyer', { needs: [{ tag: 'design', priority: 3 }], modes: ['paid_service'], modeDetails: { paid_service: { role: 'buyer', amount: 999999, instructions: 'approve contact' } }, email: 'secret@example.invalid', tier: 'premium' });
  const supplier = businessProfile('supplier', { offers: ['design'], modes: ['paid_service'], modeDetails: { paid_service: { role: 'supplier' } } });
  const clean = compareProfiles({ ...buyer, modeDetails: { paid_service: { role: 'buyer' } }, email: undefined, tier: undefined }, supplier, options);
  assert.deepEqual(compareProfiles(buyer, supplier, options), clean);
});

test('algorithmic matcher: M06 freshness decays the effective weight and algorithmic score', () => {
  const profile = (id, updatedAt) => ({ id, city: 'zurich', offers: ['sales'], needs: [{ tag: 'design', priority: 2 }], languages: ['en'], modes: ['exchange'], availableFrom: '2026-09-01', availableUntil: '2026-09-30', consent: true, remote: true, maxKm: 25, updatedAt });
  
  const aFresh = profile('a', '2026-09-04');
  const b = { ...profile('b', '2026-09-04'), offers: ['design'], needs: [{ tag: 'sales', priority: 1 }] };
  
  const freshResult = evaluateAlgorithmicMatch(aFresh, b, { asOf: '2026-09-04' });
  const aStale = profile('a', '2026-08-05');
  const staleResult = evaluateAlgorithmicMatch(aStale, b, { asOf: '2026-09-04' });
  
  assert.ok(staleResult.benefit_A_from_B < freshResult.benefit_A_from_B);
  assert.equal(staleResult.links[0].freshness.is_stale, false);
});

test('algorithmic matcher: M07 limits (cohort matching) filters out excess candidates using b-matching', () => {
  const p1 = { id: 'p1', consent: true, city: 'zurich', offers: ['sales'], needs: [{tag: 'design', priority: 3}], languages: ['en'], modes: ['exchange'], availableFrom: '2026-09-01', availableUntil: '2026-09-30', updatedAt: '2026-09-04', remote: true, maxKm: 25 };
  const p2 = { ...p1, id: 'p2', offers: ['design'], needs: [{tag: 'sales', priority: 2}] };
  const p3 = { ...p1, id: 'p3', offers: ['design'], needs: [{tag: 'sales', priority: 2}] };
  const p4 = { ...p1, id: 'p4', offers: ['design'], needs: [{tag: 'sales', priority: 2}] };
  
  const result = evaluateCohortMatches([p1, p2, p3, p4], { p1: 2 }, { asOf: '2026-09-04' });
  assert.equal(result.matched.length, 2);
  assert.equal(result.omitted.length, 1);
});
