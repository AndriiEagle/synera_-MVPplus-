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

function rowFromState(state) {
  if (!state) return null;
  const [participant_low, participant_high] = [...state.participants].sort();
  return {
    case_id: state.caseId, participant_low, participant_high, mode: state.material.mode,
    material: state.material, terms_hash: state.termsHash, version: state.version,
    status: ['revoked', 'abandoned'].includes(state.status) ? state.status : 'open',
    expires_at: state.expiresAt, closed_at: state.closedAt,
    created_at: state.createdAt, updated_at: state.updatedAt,
  };
}

function approvalRowsFromState(state) {
  return Object.values(state?.approvals ?? {}).map(approval => ({
    party_id: approval.partyId, approved_version: approval.version,
    approved_terms_hash: approval.termsHash, approved_at: approval.approvedAt,
    withdrawn_at: null,
  }));
}

function fakeDatabase(storedState = null) {
  let row = rowFromState(storedState);
  const approvals = approvalRowsFromState(storedState);
  const handler = async (path, options = {}) => {
    if (path.startsWith('/rest/v1/match_cases?case_id=') && !options.method) return row ? [structuredClone(row)] : [];
    if (path.startsWith('/rest/v1/match_case_approvals?') && !options.method) return structuredClone(approvals);
    if (path.startsWith('/rest/v1/match_cases?on_conflict=') && options.method === 'POST') {
      const body = options.body;
      const changed = row && (row.terms_hash !== body.terms_hash || JSON.stringify(row.material) !== JSON.stringify(body.material));
      row = {
        ...row, ...body, version: row ? row.version + (changed ? 1 : 0) : 1,
        status: row?.status ?? 'open', closed_at: row?.closed_at ?? null,
        created_at: row?.created_at ?? '2026-09-08T10:00:00.000Z',
        updated_at: '2026-09-08T12:00:00.000Z',
      };
      return [];
    }
    if (path === '/rest/v1/match_case_approvals' && options.method === 'POST') {
      approvals.push({
        party_id: options.body.party_id, approved_version: options.body.approved_version,
        approved_terms_hash: options.body.approved_terms_hash,
        approved_at: '2026-09-08T12:00:00.000Z', withdrawn_at: null,
      });
      return [];
    }
    if (path.startsWith('/rest/v1/match_case_approvals?') && options.method === 'PATCH') {
      const party = decodeURIComponent(path.match(/party_id=eq\.([^&]+)/)?.[1] ?? '');
      for (const approval of approvals) if (approval.party_id === party && approval.withdrawn_at === null) approval.withdrawn_at = options.body.withdrawn_at;
      return [];
    }
    if (path.startsWith('/rest/v1/match_cases?case_id=') && options.method === 'PATCH') {
      row.status = options.body.status;
      row.closed_at = '2026-09-08T12:00:00.000Z';
      return [];
    }
    return [];
  };
  return { handler };
}

function wire(store, database, userId = ME) {
  store.user = { id: userId, email: 'u@example.invalid' };
  store.pilotSafetyEnabled = true;
  store.realPilotEnabled = true;
  const calls = [];
  store._send = async (path, options = {}) => {
    calls.push({ path, options });
    return database.handler(path, options);
  };
  return calls;
}

const caseWrite = calls => calls.find(call => call.options?.method === 'POST' && call.path.startsWith('/rest/v1/match_cases'))?.options.body;
const approvalWrites = calls => calls.filter(call => call.options?.method === 'POST' && call.path === '/rest/v1/match_case_approvals').map(call => call.options.body);

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
  const database = fakeDatabase();
  const calls = wire(store, database);
  await store.saveCaseState(forged);

  assert.deepEqual(approvalWrites(calls), [], 'no approval reaches the wire');
  assert.equal(Object.hasOwn(caseWrite(calls), 'state'), false, 'forged state is never stored as a JSON blob');
  assert.equal((await store.caseState(state.caseId)).status, 'draft', 'a forged status is recomputed, not trusted');
});

test('own approval is written and derives awaiting_approval on its own', async () => {
  const state = await freshCase();
  const mine = approveCase(state, { partyId: ME, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });

  const store = new ProfileStore();
  const database = fakeDatabase();
  const calls = wire(store, database);
  await store.saveCaseState(mine);

  assert.deepEqual(approvalWrites(calls).map(row => row.party_id), [ME]);
  const loaded = await store.caseState(state.caseId);
  assert.equal(loaded.approvals[ME].partyId, ME);
  assert.equal(loaded.status, 'awaiting_approval');
});

test('a genuine stored approval of the other party survives, and both together derive approved_for_next_step', async () => {
  const state = await freshCase();
  const theirs = approveCase(state, { partyId: OTHER, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });
  const mine = approveCase(state, { partyId: ME, termsHash: state.termsHash, now: '2026-09-08T12:00:00.000Z' });

  const store = new ProfileStore();
  const database = fakeDatabase(theirs);
  wire(store, database);
  await store.saveCaseState(mine);

  const loaded = await store.caseState(state.caseId);
  assert.deepEqual(Object.keys(loaded.approvals).sort(), [ME, OTHER].sort());
  assert.equal(loaded.approvals[OTHER].approvedAt, '2026-09-08T11:00:00.000Z', 'kept from the stored row, not from the payload');
  assert.equal(loaded.status, 'approved_for_next_step');
});

test('a party cannot silently drop the other party stored approval by sending an empty approvals object', async () => {
  const state = await freshCase();
  const theirs = approveCase(state, { partyId: OTHER, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });
  const wiped = structuredClone(theirs);
  wiped.approvals = {};
  wiped.status = 'draft';

  const store = new ProfileStore();
  const database = fakeDatabase(theirs);
  wire(store, database);
  await store.saveCaseState(wiped);

  const loaded = await store.caseState(state.caseId);
  assert.deepEqual(Object.keys(loaded.approvals), [OTHER], 'the other party approval is restored from storage');
  assert.equal(loaded.status, 'awaiting_approval');
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
  const database = fakeDatabase(stale);
  wire(store, database);
  await store.saveCaseState(revised);

  const loaded = await store.caseState(state.caseId);
  assert.deepEqual(Object.keys(loaded.approvals), [], 'a revision does not inherit an approval of the previous terms');
  assert.equal(loaded.status, 'draft');
});

test('version cannot move backwards and participants cannot be swapped', async () => {
  const state = await freshCase();
  const stored = structuredClone(state);
  stored.version = 4;

  const rollback = structuredClone(state);
  rollback.version = 2;
  const back = new ProfileStore();
  wire(back, fakeDatabase(stored));
  await assert.rejects(() => back.saveCaseState(rollback), /Версія кейсу не може йти назад/);

  const swapped = structuredClone(state);
  swapped.participants = [ME, 'u-3'];
  const swap = new ProfileStore();
  wire(swap, fakeDatabase(state));
  await assert.rejects(() => swap.saveCaseState(swapped), /Учасники кейсу не можуть змінитися/);
});

test('a case is closed only by the party doing it, and closing clears approvals', async () => {
  const state = await freshCase();
  const theirs = approveCase(state, { partyId: OTHER, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });

  const forgedClose = structuredClone(state);
  forgedClose.status = 'revoked';
  forgedClose.closedBy = OTHER;
  const bad = new ProfileStore();
  wire(bad, fakeDatabase(theirs));
  await assert.rejects(() => bad.saveCaseState(forgedClose), /Кейс закривається лише стороною, яка це робить/);

  const ownClose = structuredClone(state);
  ownClose.status = 'revoked';
  ownClose.closedBy = ME;
  const good = new ProfileStore();
  const database = fakeDatabase(theirs);
  wire(good, database);
  await good.saveCaseState(ownClose);
  const loaded = await good.caseState(state.caseId);
  assert.equal(loaded.status, 'revoked');
  assert.deepEqual(Object.keys(loaded.approvals), []);
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
  const database = fakeDatabase(theirs);
  const calls = [];
  store._send = async (path, options = {}) => {
    calls.push({ path, options });
    return database.handler(path, options);
  };
  await store.saveCaseState(forged);

  assert.deepEqual(approvalWrites(calls), [], 'an outsider adds no approval row');
  assert.equal(Object.hasOwn(caseWrite(calls), 'state'), false);
});

test('V6-03: own approval is written separately to match_case_approvals for Neon RLS', async () => {
  const state = await freshCase();
  const mine = approveCase(state, { partyId: ME, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });

  const store = new ProfileStore();
  const calls = wire(store, fakeDatabase());
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
  const database = fakeDatabase();

  // Party A approves
  const mine = approveCase(state, { partyId: ME, termsHash: state.termsHash, now: '2026-09-08T11:00:00.000Z' });
  const storeA = new ProfileStore();
  wire(storeA, database);
  await storeA.saveCaseState(mine);
  const stateAfterA = await storeA.caseState('case-guard');
  assert.equal(stateAfterA.status, 'awaiting_approval');
  assert.ok(stateAfterA.approvals[ME]);
  assert.equal(stateAfterA.approvals[OTHER], undefined);

  // Party B fetches and approves
  const storeB = new ProfileStore();
  wire(storeB, database, OTHER);

  const loadedByB = await storeB.caseState('case-guard');
  assert.ok(loadedByB.approvals[ME], 'party B sees party A approval');
  const bApproved = approveCase(loadedByB, { partyId: OTHER, termsHash: loadedByB.termsHash, now: '2026-09-08T12:30:00.000Z' });
  await storeB.saveCaseState(bApproved);

  const stateAfterB = await storeB.caseState('case-guard');
  assert.equal(stateAfterB.status, 'approved_for_next_step');
  assert.ok(stateAfterB.approvals[ME]);
  assert.ok(stateAfterB.approvals[OTHER]);
});
