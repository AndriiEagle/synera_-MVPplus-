// SYN_OWN_APPROVAL_ONLY: proves one party cannot record the other party's approval.
// bible/STATUS.md names this as the open item blocking the case-state migration:
// "saveCaseState still posts one JSON state blob, which would let a client write the
// other party's approval (step B2-rework)". These tests pin the client side of it.
// They do not test RLS: no statement here reaches a database.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfileStore } from './profile-store.mjs';
import { createCaseState, approveCase } from './business-case.mjs';

const ME = 'u-1';
const OTHER = 'u-2';

const material = (overrides = {}) => ({
  mode: 'paid_service', components: ['paid_service'],
  outcomes: [{ receiver_id: ME, capability_tag: 'sales', target: 'Review one synthetic offer' }],
  trial: {
    starts_on: '2026-09-08', due_on: '2026-09-12',
    deliverables: [{ giver_id: OTHER, receiver_id: ME, capability_tag: 'sales', target: 'One review', acceptance_criteria: 'Receiver explicitly accepts this version' }],
  },
  compensation: { status: 'agreed_money', amount_minor: 12000, currency: 'CHF', invoice_required: true },
  terms: { revision_limit: 1, confidentiality: 'required', intellectual_property: 'receiver', cancellation: 'mutual_written_notice' },
  ...overrides,
});

// Same harness shape as profile-portability.test.mjs: record calls, serve canned rows.
function wire(store, storedState) {
  store.user = { id: ME, email: 'u@example.invalid' };
  store.pilotSafetyEnabled = true;
  store.realPilotEnabled = true;
  const calls = [];
  store._send = async (path, options = {}) => {
    calls.push({ path, options });
    if (path.startsWith('/rest/v1/match_cases?case_id=')) return storedState ? [{ state: storedState }] : [];
    return [];
  };
  return calls;
}

const written = calls => calls.find(call => call.options?.method === 'POST')?.options.body.state;

const freshCase = () => createCaseState({
  caseId: 'case-guard', participants: [ME, OTHER], material: material(),
  now: '2026-09-08T10:00:00.000Z', expiresAt: '2026-09-15T10:00:00.000Z',
});

test('a party cannot write the other party approval, even hand-crafted into the payload', async () => {
  const state = await freshCase();
  const forged = structuredClone(state);
  forged.approvals[OTHER] = { partyId: OTHER, version: state.version, termsHash: state.termsHash, approvedAt: '2026-09-08T11:00:00.000Z', attestation: state.approvalAttestation };
  forged.status = 'approved_for_next_step';

  const store = new ProfileStore();
  const calls = wire(store, null);
  await store.saveCaseState(forged);

  const sent = written(calls);
  assert.deepEqual(Object.keys(sent.approvals), [], 'no approval reaches the wire');
  assert.equal(sent.status, 'draft', 'a forged status is recomputed, not trusted');
});

test('own approval is written and derives awaiting_approval on its own', async () => {
  const state = await freshCase();
  const mine = approveCase(state, { partyId: ME, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });

  const store = new ProfileStore();
  const calls = wire(store, null);
  await store.saveCaseState(mine);

  const sent = written(calls);
  assert.deepEqual(Object.keys(sent.approvals), [ME]);
  assert.equal(sent.approvals[ME].partyId, ME);
  assert.equal(sent.status, 'awaiting_approval');
});

test('a genuine stored approval of the other party survives, and both together derive approved_for_next_step', async () => {
  const state = await freshCase();
  const theirs = approveCase(state, { partyId: OTHER, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });
  const mine = approveCase(state, { partyId: ME, termsHash: state.termsHash, now: '2026-09-08T12:00:00.000Z' });

  const store = new ProfileStore();
  const calls = wire(store, theirs);
  await store.saveCaseState(mine);

  const sent = written(calls);
  assert.deepEqual(Object.keys(sent.approvals).sort(), [ME, OTHER].sort());
  assert.equal(sent.approvals[OTHER].approvedAt, '2026-09-08T11:00:00.000Z', 'kept from the stored row, not from the payload');
  assert.equal(sent.status, 'approved_for_next_step');
});

test('a party cannot silently drop the other party stored approval by sending an empty approvals object', async () => {
  const state = await freshCase();
  const theirs = approveCase(state, { partyId: OTHER, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });
  const wiped = structuredClone(theirs);
  wiped.approvals = {};
  wiped.status = 'draft';

  const store = new ProfileStore();
  const calls = wire(store, theirs);
  await store.saveCaseState(wiped);

  const sent = written(calls);
  assert.deepEqual(Object.keys(sent.approvals), [OTHER], 'the other party approval is restored from storage');
  assert.equal(sent.status, 'awaiting_approval');
});

test('a stored approval for an older version or a different terms hash is not carried forward', async () => {
  const state = await freshCase();
  const theirs = approveCase(state, { partyId: OTHER, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });
  const stale = structuredClone(theirs);
  stale.approvals[OTHER].version = theirs.version - 1 || 0;

  const revised = structuredClone(state);
  revised.version = state.version + 1;
  revised.approvals = {};

  const store = new ProfileStore();
  const calls = wire(store, stale);
  await store.saveCaseState(revised);

  const sent = written(calls);
  assert.deepEqual(Object.keys(sent.approvals), [], 'a revision does not inherit an approval of the previous terms');
  assert.equal(sent.status, 'draft');
});

test('version cannot move backwards and participants cannot be swapped', async () => {
  const state = await freshCase();
  const stored = structuredClone(state);
  stored.version = 4;

  const rollback = structuredClone(state);
  rollback.version = 2;
  const back = new ProfileStore();
  wire(back, stored);
  await assert.rejects(() => back.saveCaseState(rollback), /Версія кейсу не може йти назад/);

  const swapped = structuredClone(state);
  swapped.participants = [ME, 'u-3'];
  const swap = new ProfileStore();
  wire(swap, state);
  await assert.rejects(() => swap.saveCaseState(swapped), /Учасники кейсу не можуть змінитися/);
});

test('a case is closed only by the party doing it, and closing clears approvals', async () => {
  const state = await freshCase();
  const theirs = approveCase(state, { partyId: OTHER, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });

  const forgedClose = structuredClone(state);
  forgedClose.status = 'revoked';
  forgedClose.closedBy = OTHER;
  const bad = new ProfileStore();
  wire(bad, theirs);
  await assert.rejects(() => bad.saveCaseState(forgedClose), /Кейс закривається лише стороною, яка це робить/);

  const ownClose = structuredClone(state);
  ownClose.status = 'revoked';
  ownClose.closedBy = ME;
  const good = new ProfileStore();
  const calls = wire(good, theirs);
  await good.saveCaseState(ownClose);
  const sent = written(calls);
  assert.equal(sent.status, 'revoked');
  assert.deepEqual(Object.keys(sent.approvals), []);
});

test('a caller who is not a participant writes no approval at all', async () => {
  const state = await freshCase();
  const theirs = approveCase(state, { partyId: OTHER, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });
  const forged = structuredClone(theirs);
  forged.approvals[ME] = { partyId: ME, version: state.version, termsHash: state.termsHash, approvedAt: '2026-09-08T12:00:00.000Z', attestation: state.approvalAttestation };

  const store = new ProfileStore();
  store.user = { id: 'outsider', email: 'x@example.invalid' };
  store.pilotSafetyEnabled = true;
  store.realPilotEnabled = true;
  const calls = [];
  store._send = async (path, options = {}) => {
    calls.push({ path, options });
    return path.startsWith('/rest/v1/match_cases?case_id=') ? [{ state: theirs }] : [];
  };
  await store.saveCaseState(forged);

  const sent = written(calls);
  assert.deepEqual(Object.keys(sent.approvals), [OTHER], 'only the stored approval survives; an outsider adds none');
});

test('V6-03: own approval is written separately to match_case_approvals for Neon RLS', async () => {
  const state = await freshCase();
  const mine = approveCase(state, { partyId: ME, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });

  const store = new ProfileStore();
  const calls = wire(store, null);
  await store.saveCaseState(mine);

  const approvalCall = calls.find(call => call.path === '/rest/v1/match_case_approvals');
  assert.ok(approvalCall, 'must post to /rest/v1/match_case_approvals');
  assert.deepEqual(approvalCall.options.body, {
    case_id: 'case-guard',
    party_id: ME,
    approved_version: mine.version,
    approved_terms_hash: mine.termsHash,
  });
});

test('X6 / V6-06: bilateral store sync allows party A and party B to independently approve and reach approved_for_next_step', async () => {
  const state = await freshCase();

  // Party A approves
  const mine = approveCase(state, { partyId: ME, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });
  const storeA = new ProfileStore();
  const callsA = wire(storeA, null);
  await storeA.saveCaseState(mine);
  const stateAfterA = written(callsA);
  assert.equal(stateAfterA.status, 'awaiting_approval');
  assert.ok(stateAfterA.approvals[ME]);
  assert.equal(stateAfterA.approvals[OTHER], undefined);

  // Party B fetches and approves
  const storeB = new ProfileStore();
  storeB.user = { id: OTHER, email: 'other@example.invalid' };
  storeB.pilotSafetyEnabled = true;
  storeB.realPilotEnabled = true;
  const callsB = [];
  storeB._send = async (path, options = {}) => {
    callsB.push({ path, options });
    if (path.startsWith('/rest/v1/match_cases?case_id=')) return [{ state: stateAfterA }];
    return [];
  };

  const loadedByB = await storeB.caseState('case-guard');
  assert.ok(loadedByB.approvals[ME], 'party B sees party A approval');
  const bApproved = approveCase(loadedByB, { partyId: OTHER, termsHash: loadedByB.termsHash, now: '2026-09-08T11:30:00.000Z' });
  await storeB.saveCaseState(bApproved);

  const stateAfterB = callsB.find(call => call.options?.method === 'POST' && call.path.startsWith('/rest/v1/match_cases'))?.options.body.state;
  assert.equal(stateAfterB.status, 'approved_for_next_step');
  assert.ok(stateAfterB.approvals[ME]);
  assert.ok(stateAfterB.approvals[OTHER]);
});


