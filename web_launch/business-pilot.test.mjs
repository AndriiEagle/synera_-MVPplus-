import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { normalizeBrief, compareRealProfiles } from './profile-brief.mjs';
import { buildBusinessCase, createCaseState, approveCase, reviseCase, reviewCaseAction } from './business-case.mjs';
import { pilotFunnel } from './economics.mjs';
import { SYNTHETIC_COHORT } from './lab-fixtures.mjs';

const at = '2026-09-08T10:00:00.000Z';
const expiresAt = '2026-09-15T10:00:00.000Z';
const options = { asOf: '2026-09-08' };
const profile = (id, overrides = {}) => ({
  id, display_name: `${id} synthetic`, is_discoverable: true, map_visible: false, updated_at: at,
  brief: normalizeBrief({ goal: `${id} synthetic outcome`, languages: ['en'], available_from: '2026-09-08', available_until: '2026-09-15', remote: true, ...overrides }),
});
const permissions = (ids, introduction = true) => Object.fromEntries(ids.map(id => [id, { comparison: true, caseDisclosure: true, termsApproval: true, introduction }]));

function pairFor(mode) {
  if (mode === 'paid_service') return [
    profile('a', { need_tags: ['design'], modes: [mode], mode_details: { paid_service: { role: 'buyer' } } }),
    profile('b', { offer_tags: ['design'], modes: [mode], mode_details: { paid_service: { role: 'supplier' } } }),
  ];
  if (mode === 'referral') return [
    profile('a', { need_tags: ['sales'], modes: [mode], mode_details: { referral: { role: 'seeker' } } }),
    profile('b', { modes: [mode], mode_details: { referral: { role: 'introducer', benefitTags: ['sales'], sourceDeclared: true, recipientScopeDeclared: true, thirdPartyStatus: 'not_consulted' } } }),
  ];
  if (mode === 'hybrid') return [
    profile('a', { offer_tags: ['sales'], need_tags: ['design'], modes: [mode], mode_details: { paid_service: { role: 'buyer' }, hybrid: { components: ['exchange', 'paid_service'] } } }),
    profile('b', { offer_tags: ['design'], need_tags: ['sales'], modes: [mode], mode_details: { paid_service: { role: 'supplier' }, hybrid: { components: ['exchange', 'paid_service'] } } }),
  ];
  return [
    profile('a', { offer_tags: ['sales'], need_tags: ['design'], modes: ['exchange'] }),
    profile('b', { offer_tags: ['design'], need_tags: ['sales'], modes: ['exchange'] }),
  ];
}

function materialFor(mode) {
  const components = mode === 'hybrid' ? ['exchange', 'paid_service'] : [mode];
  const money = components.includes('paid_service');
  return {
    mode, components,
    outcomes: [{ receiver_id: 'a', capability_tag: mode === 'referral' ? 'sales' : 'design', target: 'One synthetic receiver-owned result' }],
    trial: { starts_on: '2026-09-09', due_on: '2026-09-12', deliverables: [{ giver_id: 'b', receiver_id: 'a', capability_tag: mode === 'referral' ? 'sales' : 'design', target: 'One synthetic deliverable', acceptance_criteria: 'Receiver explicitly accepts this exact version' }] },
    compensation: money ? { status: 'agreed_money', amount_minor: 10000, currency: 'CHF', invoice_required: true } : { status: mode === 'exchange' ? 'agreed_exchange' : 'agreed_none', amount_minor: null, currency: '', invoice_required: null },
    terms: { revision_limit: 1, confidentiality: 'required', intellectual_property: 'receiver', cancellation: 'mutual_written_notice' },
  };
}

test('synthetic D1 rehearsal: exchange, paid service, referral and hybrid reach only the pure introduction gate', async () => {
  const events = [];
  for (const mode of ['exchange', 'paid_service', 'referral', 'hybrid']) {
    const [a, b] = pairFor(mode), draft = buildBusinessCase(a, b, { ...options, mode });
    assert.equal(draft.status, 'review_candidate'); assert.equal(draft.mode, mode); assert.equal(draft.binding, false); assert.equal(draft.disclosureAllowed, false);
    let state = await createCaseState({ caseId: `case-${mode.replace('_', '-')}`, participants: [a.id, b.id], material: materialFor(mode), now: at, expiresAt });
    state = approveCase(state, { partyId: a.id, termsHash: state.termsHash, now: '2026-09-08T10:01:00.000Z' });
    state = approveCase(state, { partyId: b.id, termsHash: state.termsHash, now: '2026-09-08T10:02:00.000Z' });
    const gate = await reviewCaseAction(state, { action: 'introduction', permissions: permissions([a.id, b.id]), now: '2026-09-08T10:03:00.000Z' });
    assert.equal(gate.allowed, true); assert.equal(gate.binding, false);
    events.push({ eventId: `event-${mode.replace('_', '-')}`, pairKey: `pair-${mode.replace('_', '-')}`, caseId: state.caseId, source: 'synthetic_test', channel: 'synera', state: 'trial_agreed', occurredAt: '2026-09-08T10:03:00.000Z', operatorMinutes: 0, directCashCost: 0 });
  }
  const funnel = pilotFunnel(events, { source: 'synthetic_test' });
  assert.equal(funnel.uniquePairs, 4); assert.equal(funnel.states.trial_agreed, 4); assert.equal(funnel.businessEvidence, false);
});

test('synthetic D1 rehearsal: withdrawn comparison and changed material terms are explicit refusal journeys', async () => {
  const [a, b] = pairFor('exchange');
  const blockedDraft = buildBusinessCase(a, { ...b, is_discoverable: false }, { ...options, mode: 'exchange' });
  assert.equal(blockedDraft.status, 'consent_required'); assert.deepEqual(blockedDraft.benefits, []);

  let state = await createCaseState({ caseId: 'case-revision', participants: [a.id, b.id], material: materialFor('exchange'), now: at, expiresAt });
  state = approveCase(state, { partyId: a.id, termsHash: state.termsHash, now: '2026-09-08T10:01:00.000Z' });
  state = approveCase(state, { partyId: b.id, termsHash: state.termsHash, now: '2026-09-08T10:02:00.000Z' });
  const changed = await reviseCase(state, { material: { ...materialFor('exchange'), trial: { ...materialFor('exchange').trial, due_on: '2026-09-13' } }, now: '2026-09-08T10:03:00.000Z' });
  assert.deepEqual(changed.approvals, {});
  assert.deepEqual((await reviewCaseAction(changed, { action: 'introduction', permissions: permissions([a.id, b.id]), now: '2026-09-08T10:04:00.000Z' })).reasonCodes, ['BOTH_CURRENT_APPROVALS_REQUIRED']);
});

// SYN_COHORT_JOURNEYS_GREEN: the ten labelled synthetic participants from COHORT_10.json, as fixtures only.
const cohortAsOf = { asOf: '2026-09-15' };
const cohort = Object.fromEntries(SYNTHETIC_COHORT.map(p => [p.id.replace('syn-', ''), {
  id: p.id, display_name: p.display_name, is_discoverable: p.consent === true, map_visible: false, updated_at: '2026-09-10T00:00:00.000Z', brief: normalizeBrief(p.brief),
}]));
const modesOf = result => Object.fromEntries((result.modeCandidates ?? []).map(candidate => [candidate.mode, candidate]));

test('SYN_COHORT_JOURNEYS_GREEN: four accepted paths — exchange (legacy v1), paid service, hybrid, referral', () => {
  assert.equal(SYNTHETIC_COHORT.length, 10);
  assert.ok(SYNTHETIC_COHORT.every(p => p.synthetic === true && p.display_name.includes('синт.')));
  assert.equal(cohort.iryna.brief.version, 1); assert.equal(cohort.noa.brief.version, 1);
  assert.equal(compareRealProfiles(cohort.iryna, cohort.noa, cohortAsOf).status, 'review_candidate');
  const paid = compareRealProfiles(cohort.eva, cohort.tomas, cohortAsOf);
  assert.equal(paid.status, 'review_candidate'); assert.equal(modesOf(paid).paid_service.status, 'eligible');
  assert.ok(modesOf(paid).paid_service.reasonCodes.includes('COMPENSATION_REQUIRES_TERMS'));
  const hybrid = compareRealProfiles(cohort.lina, cohort.marko, cohortAsOf);
  assert.equal(hybrid.status, 'review_candidate'); assert.equal(modesOf(hybrid).hybrid.status, 'eligible');
  const referral = modesOf(compareRealProfiles(cohort.sofia, cohort.hector, cohortAsOf)).referral;
  assert.equal(referral.status, 'eligible');
  // Flagged, not blocked: whether to block an unconsulted third party is an open human decision.
  assert.ok(referral.reasonCodes.includes('THIRD_PARTY_NOT_CONSULTED')); assert.ok(referral.unresolved.includes('third_party_agreement'));
  const consented = structuredClone(cohort.hector); consented.brief.mode_details.referral.thirdPartyStatus = 'consented';
  const verified = modesOf(compareRealProfiles(cohort.sofia, consented, cohortAsOf)).referral;
  assert.ok(verified.reasonCodes.includes('THIRD_PARTY_CONSENT_SELF_DECLARED')); assert.ok(verified.unresolved.includes('third_party_consent_verification'));
});

test('SYN_COHORT_JOURNEYS_GREEN: refusals stay refusals — invalid availability, withdrawn consent, one-way value', () => {
  for (const partner of ['lina', 'marko', 'eva', 'tomas', 'iryna', 'noa', 'sofia', 'hector']) assert.equal(compareRealProfiles(cohort[partner], cohort.pierre, cohortAsOf).status, 'needs_information', partner);
  for (const partner of ['lina', 'marko', 'eva', 'tomas', 'iryna', 'noa', 'sofia']) {
    const withdrawn = compareRealProfiles(cohort[partner], cohort.anita, cohortAsOf);
    assert.equal(withdrawn.status, 'consent_required', partner); assert.deepEqual(withdrawn.directions ?? [], []);
    const oneWay = compareRealProfiles(cohort[partner], { ...cohort.anita, is_discoverable: true }, cohortAsOf);
    assert.ok(['insufficient_mutual_value', 'incompatible'].includes(oneWay.status), partner + ' ' + oneWay.status);
  }
});

test('SYN_COHORT_JOURNEYS_GREEN: funnel keeps every refusal, ghost and missing feedback in the denominator', () => {
  const pairs = [['iryna', 'noa', 'trial_agreed'], ['eva', 'tomas', 'trial_agreed'], ['lina', 'marko', 'trial_agreed'], ['sofia', 'hector', 'trial_agreed'], ['lina', 'pierre', 'not_eligible'], ['lina', 'anita', 'not_eligible']];
  const events = [];
  const push = (pair, state, n) => events.push({ eventId: `${pair}:${state.replaceAll('_', '-')}:${n}`, pairKey: pair, caseId: `case:${pair}`, source: 'synthetic_test', channel: 'synera', state, occurredAt: '2026-09-15T10:00:00.000Z', operatorMinutes: 5, directCashCost: null });
  for (const [a, b, state] of pairs) {
    const pair = `pair:${a}:${b}`, members = [a, b].map(key => SYNTHETIC_COHORT.find(p => p.id === 'syn-' + key));
    push(pair, state, 1);
    if (members.some(p => p.behaviour.ghosts)) push(pair, 'no_response', 2);
    else if (state === 'trial_agreed' && members.some(p => !p.behaviour.gives_delayed_feedback)) push(pair, 'feedback_missing', 2);
  }
  const funnel = pilotFunnel(events, { source: 'synthetic_test' });
  assert.equal(funnel.uniquePairs, 6);
  assert.equal(funnel.states.trial_agreed, 4); assert.equal(funnel.states.not_eligible, 2);
  assert.equal(funnel.states.no_response, 2); assert.equal(funnel.states.feedback_missing, 2);
  assert.equal(funnel.directCashCost, null); assert.equal(funnel.businessEvidence, false); assert.equal(funnel.businessEvidenceCandidate, false);
  assert.equal(pilotFunnel(events, { source: 'real_authorized' }).eventCount, 0);
});

test('SYN_COHORT_JOURNEYS_GREEN: the synthetic cohort never reaches a store, seed or shipped asset', async () => {
  for (const name of ['profile-store.mjs', 'neon-store.mjs', 'online-store.mjs', 'data.mjs', 'app.mjs', 'assets.mjs']) {
    const source = await fs.readFile(new URL('./' + name, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /lab-fixtures|SYNTHETIC_COHORT/, name);
  }
});
