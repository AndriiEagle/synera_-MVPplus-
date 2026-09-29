// P05 effort volume + P08 decline + P09 feedback — semantic regression tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashMaterialPayload, canonicalMaterialPayload, createCaseState, approveCase, reviseCase, acceptDeliverable,
  effortsFromInput, effortSummary, deliverableKey, rejectDeliverable, recordOutcomeFeedback, deliverableOutcomes,
  supplyDeliverableEvidence, recordDeliverableScopeCheck,
} from './business-case.mjs';

const A = 'u-a', B = 'u-b';
const base = () => ({
  mode: 'exchange', components: ['exchange'],
  outcomes: [{ receiver_id: A, capability_tag: 'design', target: 'Landing page' }, { receiver_id: B, capability_tag: 'sales', target: '5 intros' }],
  trial: { starts_on: '2026-10-01', due_on: '2026-10-10', deliverables: [
    { giver_id: B, receiver_id: A, capability_tag: 'design', target: 'Landing page', acceptance_criteria: 'A approves' },
    { giver_id: A, receiver_id: B, capability_tag: 'sales', target: '5 intros', acceptance_criteria: 'B approves' },
  ] },
  compensation: { status: 'agreed_exchange' },
  terms: { revision_limit: 2, confidentiality: 'required', intellectual_property: 'receiver', cancellation: 'mutual_written_notice' },
});
const withEffort = (first, second) => { const m = base(); if (first) m.trial.deliverables[0].effort = first; if (second) m.trial.deliverables[1].effort = second; return m; };

test('P05: case without effort keeps the exact hash it had before the effort field existed', async () => {
  // Pinned from business-case.mjs at 10101327 (pre-effort). A change here would void every stored approval.
  assert.equal(await hashMaterialPayload(base()), 'ad45e9ee746324fc3b67933448bded54906dcc4ff659a1f63e6d36d01005a3f8');
  assert.equal('effort' in canonicalMaterialPayload(base()).trial.deliverables[0], false);
});

test('P05: adding effort is a material change that clears both approvals', async () => {
  const now = '2026-09-29T10:00:00.000Z';
  let state = await createCaseState({ caseId: 'case-effort', participants: [A, B], material: base(), now, expiresAt: '2026-10-11T00:00:00.000Z' });
  state = approveCase(state, { partyId: A, termsHash: state.termsHash, now });
  state = approveCase(state, { partyId: B, termsHash: state.termsHash, now });
  assert.equal(state.status, 'approved_for_next_step');
  const revised = await reviseCase(state, { material: withEffort({ amount: 3, unit: 'hours' }), now: '2026-09-29T10:05:00.000Z' });
  assert.equal(revised.version, 2);
  assert.deepEqual(revised.approvals, {});
  assert.equal(revised.status, 'draft');
});

test('P05: 1 hour against 30 hours is reported as a difference, never as equivalent', () => {
  const summary = effortSummary(withEffort({ amount: 30, unit: 'hours' }, { amount: 1, unit: 'hours' }));
  assert.equal(summary.differs, true);
  assert.equal(summary.equivalence_claimed, false);
  assert.deepEqual(summary.totals, { [B]: { hours: 30 }, [A]: { hours: 1 } });
  assert.equal('score' in summary || 'ratio' in summary, false);
});

test('P05: equal volumes do not differ; a missing volume stays missing instead of guessed', () => {
  assert.equal(effortSummary(withEffort({ amount: 2, unit: 'sessions' }, { amount: 2, unit: 'sessions' })).differs, false);
  const partial = effortSummary(withEffort({ amount: 2, unit: 'hours' }));
  assert.equal(partial.differs, false);
  assert.deepEqual(partial.missing, [deliverableKey(base().trial.deliverables[1])]);
});

test('P05: malformed effort fails closed in the domain and is ignored from human input', () => {
  assert.throws(() => canonicalMaterialPayload(withEffort({ amount: 0, unit: 'hours' })), /обсяг/);
  assert.throws(() => canonicalMaterialPayload(withEffort({ amount: 2, unit: 'days' })), /обсяг/);
  assert.throws(() => canonicalMaterialPayload(withEffort({ amount: 1.5, unit: 'hours' })), /обсяг/);
  const key = 'u-b|u-a|design';
  assert.deepEqual(effortsFromInput({ ['effort_amount:' + key]: '3', ['effort_unit:' + key]: 'hours' }), { [key]: { amount: 3, unit: 'hours' } });
  assert.deepEqual(effortsFromInput({ ['effort_amount:' + key]: '', ['effort_unit:' + key]: 'hours' }), {});
  assert.deepEqual(effortsFromInput({ ['effort_amount:' + key]: 'багато', ['effort_unit:' + key]: 'hours' }), {});
  assert.deepEqual(effortsFromInput({ ['effort_amount:' + key]: '3', ['effort_unit:' + key]: '' }), {});
});

async function approvedCase() {
  const now = '2026-09-29T10:00:00.000Z';
  let state = await createCaseState({ caseId: 'case-outcome', participants: [A, B], material: withEffort({ amount: 3, unit: 'hours' }, { amount: 5, unit: 'items' }), now, expiresAt: '2026-10-11T00:00:00.000Z' });
  state = approveCase(state, { partyId: A, termsHash: state.termsHash, now });
  return approveCase(state, { partyId: B, termsHash: state.termsHash, now });
}
// Submission alone is not acceptance: evidence and a scope check come first (existing proof-state invariant).
function submitted(state, index, giver, receiver, at) {
  state = supplyDeliverableEvidence(state, { deliverableIndex: index, partyId: giver, evidenceUri: 'https://example.test/result-' + index, now: at });
  return recordDeliverableScopeCheck(state, { deliverableIndex: index, partyId: receiver, scopeNotes: 'Checked against acceptance criteria', now: at });
}

test('P08: only the receiver may decline; decline opens a neutral dispute and keeps history', async () => {
  const state = submitted(await approvedCase(), 0, B, A, '2026-09-30T09:00:00.000Z');
  assert.throws(() => rejectDeliverable(state, { deliverableIndex: 0, partyId: B, reason: 'other', now: '2026-09-30T10:00:00.000Z' }), /receiver/);
  assert.throws(() => rejectDeliverable(state, { deliverableIndex: 0, partyId: 'u-outsider', reason: 'other', now: '2026-09-30T10:00:00.000Z' }), /receiver/);
  assert.throws(() => rejectDeliverable(state, { deliverableIndex: 0, partyId: A, reason: 'lazy person', now: '2026-09-30T10:00:00.000Z' }), /neutral reason/);
  const declined = rejectDeliverable(state, { deliverableIndex: 0, partyId: A, reason: 'below_acceptance_criteria', now: '2026-09-30T10:00:00.000Z' });
  assert.equal(deliverableOutcomes(declined)[0].decision, 'declined_dispute_open');
  assert.equal(deliverableOutcomes(declined)[1].decision, 'pending');
  const resolved = acceptDeliverable(declined, { deliverableIndex: 0, partyId: A, now: '2026-10-01T10:00:00.000Z' });
  assert.equal(deliverableOutcomes(resolved)[0].decision, 'accepted');
  assert.equal(resolved.events.filter(event => event.type === 'deliverable_rejected').length, 1, 'decline stays in history');
});

test('P09: feedback is optional; no reply is missing data, not a negative value', async () => {
  let state = submitted(await approvedCase(), 0, B, A, '2026-09-30T09:00:00.000Z');
  assert.deepEqual(deliverableOutcomes(state)[0].feedback, { immediate: 'missing', delayed: 'missing' });
  assert.throws(() => recordOutcomeFeedback(state, { deliverableIndex: 0, partyId: A, value: 'useful', timing: 'immediate', now: '2026-09-30T10:00:00.000Z' }), /accepted or declined/);
  state = acceptDeliverable(state, { deliverableIndex: 0, partyId: A, now: '2026-09-30T10:00:00.000Z' });
  assert.throws(() => recordOutcomeFeedback(state, { deliverableIndex: 0, partyId: B, value: 'useful', timing: 'immediate', now: '2026-09-30T10:01:00.000Z' }), /receiver/);
  state = recordOutcomeFeedback(state, { deliverableIndex: 0, partyId: A, value: 'partly_useful', timing: 'immediate', now: '2026-09-30T10:01:00.000Z' });
  assert.throws(() => recordOutcomeFeedback(state, { deliverableIndex: 0, partyId: A, value: 'useful', timing: 'immediate', now: '2026-09-30T10:02:00.000Z' }), /already/);
  state = recordOutcomeFeedback(state, { deliverableIndex: 0, partyId: A, value: 'useful', timing: 'delayed', now: '2026-10-20T10:00:00.000Z' });
  assert.deepEqual(deliverableOutcomes(state)[0].feedback, { immediate: 'partly_useful', delayed: 'useful' });
  assert.deepEqual(deliverableOutcomes(state)[1].feedback, { immediate: 'missing', delayed: 'missing' });
});
