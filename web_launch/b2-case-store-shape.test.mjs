import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfileStore } from './profile-store.mjs';
import { approveCase, createCaseState } from './business-case.mjs';

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

const material = {
  mode: 'paid_service', components: ['paid_service'],
  outcomes: [{ receiver_id: ME, capability_tag: 'sales', target: 'Review one synthetic offer' }],
  trial: {
    starts_on: '2026-09-08', due_on: '2026-09-12',
    deliverables: [{ giver_id: OTHER, receiver_id: ME, capability_tag: 'sales', target: 'One review', acceptance_criteria: 'Receiver explicitly accepts this version' }],
  },
  compensation: { status: 'agreed_money', amount_minor: 12000, currency: 'CHF', invoice_required: true },
  terms: { revision_limit: 1, confidentiality: 'required', intellectual_property: 'receiver', cancellation: 'mutual_written_notice' },
};

function storeWith(handler) {
  const store = new ProfileStore();
  store.user = { id: ME, email: 'me@example.invalid' };
  store.pilotSafetyEnabled = true;
  store.realPilotEnabled = true;
  const calls = [];
  store._send = async (path, options = {}) => { calls.push({ path, options }); return handler(path, options); };
  return { store, calls };
}

test('SYN_CASE_STORE_MATCHES_SQL: writes columns and reconstructs state from case plus approval rows', async () => {
  const created = await createCaseState({
    caseId: 'case-b2', participants: [OTHER, ME], material,
    now: '2026-09-08T10:00:00.000Z', expiresAt: '2026-09-15T10:00:00.000Z',
  });
  const approved = approveCase(created, { partyId: ME, termsHash: created.termsHash, now: '2026-09-08T11:00:00.000Z' });
  const writer = storeWith(() => []);
  await writer.store.saveCaseState(approved);

  const caseWrite = writer.calls.find(call => call.options.method === 'POST' && call.path.startsWith('/rest/v1/match_cases'));
  assert.ok(caseWrite);
  assert.equal(Object.hasOwn(caseWrite.options.body, 'state'), false, 'legacy JSON state blob must never reach match_cases');
  assert.deepEqual(caseWrite.options.body, {
    case_id: 'case-b2',
    participant_low: ME,
    participant_high: OTHER,
    mode: 'paid_service',
    material: approved.material,
    terms_hash: approved.termsHash,
    expires_at: approved.expiresAt,
  });

  const caseRow = {
    case_id: 'case-b2', participant_low: ME, participant_high: OTHER,
    mode: 'paid_service', material: approved.material, terms_hash: approved.termsHash,
    version: 1, status: 'open', expires_at: approved.expiresAt,
    created_at: created.createdAt, updated_at: approved.updatedAt, closed_at: null,
  };
  const approvalRows = [{
    party_id: ME, approved_version: 1, approved_terms_hash: approved.termsHash,
    approved_at: approved.approvals[ME].approvedAt, withdrawn_at: null,
  }];
  const reader = storeWith(path => {
    if (path.startsWith('/rest/v1/match_cases?')) return [caseRow];
    if (path.startsWith('/rest/v1/match_case_approvals?')) return approvalRows;
    return [];
  });
  const loaded = await reader.store.caseState('case-b2');
  assert.deepEqual(loaded.participants, [ME, OTHER]);
  assert.equal(loaded.status, 'awaiting_approval');
  assert.deepEqual(Object.keys(loaded.approvals), [ME]);
  assert.equal(loaded.approvals[ME].termsHash, approved.termsHash);
  assert.equal(loaded.approvalAttestation, 'ACKNOWLEDGED_FOR_NEXT_STEP_NOT_A_CONTRACT');
});
