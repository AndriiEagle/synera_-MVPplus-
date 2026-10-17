import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCaseState,
  approveCase,
  reviseCase,
  revokeCase,
  getDeliverableProofStates,
  supplyDeliverableEvidence,
  recordDeliverableScopeCheck,
  acceptDeliverable,
} from './business-case.mjs';

const GIVER = 'u-giver';
const RECEIVER = 'u-receiver';

const material = (overrides = {}) => ({
  mode: 'paid_service',
  components: ['paid_service'],
  outcomes: [{ receiver_id: RECEIVER, capability_tag: 'sales', target: 'Verified lead list' }],
  trial: {
    starts_on: '2026-09-08',
    due_on: '2026-09-12',
    deliverables: [
      {
        giver_id: GIVER,
        receiver_id: RECEIVER,
        capability_tag: 'sales',
        target: '50 verified solopreneurs',
        acceptance_criteria: 'Receiver checks leads match Swiss criteria',
      },
    ],
  },
  compensation: { status: 'agreed_money', amount_minor: 15000, currency: 'CHF', invoice_required: true },
  terms: {
    revision_limit: 2,
    confidentiality: 'required',
    intellectual_property: 'receiver',
    cancellation: 'mutual_written_notice',
  },
  ...overrides,
});

const freshCase = async () =>
  createCaseState({
    caseId: 'case-outcome-test',
    participants: [GIVER, RECEIVER],
    material: material(),
    now: '2026-09-08T10:00:00.000Z',
    expiresAt: '2026-09-15T10:00:00.000Z',
  });

test('C01.L6: deliverable proof state defaults to self_declared', async () => {
  const state = await freshCase();
  const proofStates = getDeliverableProofStates(state);
  assert.equal(proofStates.length, 1);
  assert.equal(proofStates[0].stage, 'self_declared');
  assert.equal(proofStates[0].confirmed_by_party_a, false);
  assert.equal(proofStates[0].confirmed_by_party_b, false);
});

test('C01.L6: only deliverable giver can supply evidence and advance to evidence_supplied', async () => {
  let state = await freshCase();

  // Receiver attempts to supply evidence -> rejected
  assert.throws(
    () =>
      supplyDeliverableEvidence(state, {
        deliverableIndex: 0,
        partyId: RECEIVER,
        evidenceUri: 'https://example.com/leads.csv',
        now: '2026-09-08T11:00:00.000Z',
      }),
    /Only deliverable giver can supply evidence/
  );

  // Outsider attempts -> rejected
  assert.throws(
    () =>
      supplyDeliverableEvidence(state, {
        deliverableIndex: 0,
        partyId: 'outsider',
        evidenceUri: 'https://example.com/leads.csv',
        now: '2026-09-08T11:00:00.000Z',
      }),
    /Party is not a case participant/
  );

  // Giver supplies valid evidence -> success
  state = supplyDeliverableEvidence(state, {
    deliverableIndex: 0,
    partyId: GIVER,
    evidenceUri: 'https://example.com/leads.csv',
    now: '2026-09-08T11:00:00.000Z',
  });

  const proofStates = getDeliverableProofStates(state);
  assert.equal(proofStates[0].stage, 'evidence_supplied');
  assert.equal(proofStates[0].evidence_uri, 'https://example.com/leads.csv');
});

test('C01.L6: participant checks scope and advances to checked_with_scope', async () => {
  let state = await freshCase();
  state = supplyDeliverableEvidence(state, {
    deliverableIndex: 0,
    partyId: GIVER,
    evidenceUri: 'https://example.com/leads.csv',
    now: '2026-09-08T11:00:00.000Z',
  });

  // Participant checks scope
  state = recordDeliverableScopeCheck(state, {
    deliverableIndex: 0,
    partyId: RECEIVER,
    scopeNotes: 'All 50 leads verified within Zurich region',
    now: '2026-09-08T11:15:00.000Z',
  });

  const proofStates = getDeliverableProofStates(state);
  assert.equal(proofStates[0].stage, 'checked_with_scope');
  assert.equal(proofStates[0].scope_notes, 'All 50 leads verified within Zurich region');
});

test('C01.L7: only recipient confirms outcome; giver cannot self-promote or accept own delivery', async () => {
  let state = await freshCase();
  state = supplyDeliverableEvidence(state, {
    deliverableIndex: 0,
    partyId: GIVER,
    evidenceUri: 'https://example.com/leads.csv',
    now: '2026-09-08T11:00:00.000Z',
  });
  state = recordDeliverableScopeCheck(state, {
    deliverableIndex: 0,
    partyId: RECEIVER,
    scopeNotes: 'Scope looks good',
    now: '2026-09-08T11:15:00.000Z',
  });

  // Giver attempts to accept their own deliverable -> rejected (C01.L7 invariant)
  assert.throws(
    () =>
      acceptDeliverable(state, {
        deliverableIndex: 0,
        partyId: GIVER,
        now: '2026-09-08T11:30:00.000Z',
      }),
    /Giver cannot accept own outcome/
  );

  // Receiver accepts deliverable -> success
  state = acceptDeliverable(state, {
    deliverableIndex: 0,
    partyId: RECEIVER,
    now: '2026-09-08T11:30:00.000Z',
  });

  const proofStates = getDeliverableProofStates(state);
  assert.equal(proofStates[0].stage, 'outcome_confirmed');
  assert.equal(proofStates[0].confirmed_by_party_a, true);
  assert.equal(proofStates[0].confirmed_by_party_b, true);
});

test('C01.L6/L7: material change invalidates approvals and downgrades proof states to self_declared', async () => {
  let state = await freshCase();
  state = approveCase(state, { partyId: GIVER, termsHash: state.termsHash, now: '2026-09-08T10:05:00.000Z' });
  state = approveCase(state, { partyId: RECEIVER, termsHash: state.termsHash, now: '2026-09-08T10:10:00.000Z' });
  assert.equal(state.status, 'approved_for_next_step');

  state = supplyDeliverableEvidence(state, {
    deliverableIndex: 0,
    partyId: GIVER,
    evidenceUri: 'https://example.com/leads.csv',
    now: '2026-09-08T11:00:00.000Z',
  });
  state = recordDeliverableScopeCheck(state, {
    deliverableIndex: 0,
    partyId: RECEIVER,
    scopeNotes: 'All good',
    now: '2026-09-08T11:15:00.000Z',
  });
  state = acceptDeliverable(state, {
    deliverableIndex: 0,
    partyId: RECEIVER,
    now: '2026-09-08T11:30:00.000Z',
  });
  assert.equal(getDeliverableProofStates(state)[0].stage, 'outcome_confirmed');

  // Material modification occurs (e.g. price altered)
  const revised = await reviseCase(state, {
    material: material({ compensation: { ...material().compensation, amount_minor: 18000 } }),
    now: '2026-09-08T12:00:00.000Z',
  });

  // Approvals cleared
  assert.equal(revised.status, 'draft');
  assert.deepEqual(revised.approvals, {});

  // Proof states downgraded back to self_declared
  const downgradedProofStates = getDeliverableProofStates(revised);
  assert.equal(downgradedProofStates[0].stage, 'self_declared');
  assert.equal(downgradedProofStates[0].confirmed_by_party_a, false);
  assert.equal(downgradedProofStates[0].confirmed_by_party_b, false);
});

test('closed or expired case rejects proof transitions', async () => {
  let state = await freshCase();
  const revoked = revokeCase(state, { partyId: GIVER, now: '2026-09-08T10:30:00.000Z' });

  assert.throws(
    () =>
      supplyDeliverableEvidence(revoked, {
        deliverableIndex: 0,
        partyId: GIVER,
        evidenceUri: 'https://example.com/file',
        now: '2026-09-08T10:35:00.000Z',
      }),
    /Case is closed or expired/
  );
});
