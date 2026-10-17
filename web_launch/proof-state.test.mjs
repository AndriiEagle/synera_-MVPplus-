import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROOF_STAGES,
  createProofState,
  advanceProofState,
  downgradeOnMaterialChange
} from './proof-state.mjs';

test('proof-state: initial state defaults to self_declared', () => {
  const p = createProofState();
  assert.equal(p.stage, 'self_declared');
  assert.equal(p.version, 1);
  assert.equal(p.confirmed_by_party_a, false);
  assert.equal(p.confirmed_by_party_b, false);
});

test('proof-state: strictly follows valid transition graph', () => {
  let p = createProofState();

  // Не можна перескочити одразу на checked_with_scope чи outcome_confirmed
  assert.throws(() => advanceProofState(p, 'outcome_confirmed', { confirmed_by_party_a: true, confirmed_by_party_b: true }));
  assert.throws(() => advanceProofState(p, 'checked_with_scope', { scope_notes: 'Scope ok' }));

  // Крок 1: надання доказу
  p = advanceProofState(p, 'evidence_supplied', { evidence_uri: 'https://example.com/audit.pdf' });
  assert.equal(p.stage, 'evidence_supplied');
  assert.equal(p.evidence_uri, 'https://example.com/audit.pdf');
  assert.equal(p.version, 2);

  // Крок 2: узгодження обсягу
  p = advanceProofState(p, 'checked_with_scope', { scope_notes: 'Verified 5 deliverables' });
  assert.equal(p.stage, 'checked_with_scope');
  assert.equal(p.version, 3);

  // Крок 3: не можна підтвердити однією стороною
  assert.throws(() => advanceProofState(p, 'outcome_confirmed', { confirmed_by_party_a: true, confirmed_by_party_b: false }));

  // Крок 3: успішне двостороннє підтвердження
  p = advanceProofState(p, 'outcome_confirmed', { confirmed_by_party_a: true, confirmed_by_party_b: true });
  assert.equal(p.stage, 'outcome_confirmed');
  assert.equal(p.confirmed_by_party_a, true);
  assert.equal(p.confirmed_by_party_b, true);
  assert.equal(p.version, 4);
});

test('proof-state: material modification resets both confirmations to self_declared', () => {
  let p = createProofState('outcome_confirmed', {
    evidence_uri: 'https://example.com/work.zip',
    scope_notes: 'initial scope',
    confirmed_by_party_a: true,
    confirmed_by_party_b: true,
    version: 4
  });

  const downgraded = downgradeOnMaterialChange(p, 'scope_modified');
  assert.equal(downgraded.stage, 'self_declared');
  assert.equal(downgraded.confirmed_by_party_a, false);
  assert.equal(downgraded.confirmed_by_party_b, false);
  assert.equal(downgraded.downgrade_reason, 'scope_modified');
  assert.equal(downgraded.version, 5);
});
