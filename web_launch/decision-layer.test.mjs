import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { decide, applyAdvisoryDecision, validateDecisionRequest } from './decision-layer.mjs';
import { runDecisionBakeoff } from './decision-bakeoff.mjs';
import { createCaseState, approveCase } from './business-case.mjs';

const base = (id, overrides = {}) => ({ id, city: 'zurich', offers: ['sales'], needs: [{ tag: 'design', priority: 3 }], languages: ['uk'], modes: ['exchange'], availableFrom: '2026-09-01', availableUntil: '2026-10-01', updatedAt: '2026-09-20', consent: true, remote: true, maxKm: 0, ...overrides });
const pair = () => ({ left: base('a', { offers: ['design'], needs: [{ tag: 'sales', priority: 3 }] }), right: base('b'), as_of: '2026-09-25' });
const draft = { schema: 'synera.case-state.v1', status: 'draft', participants: ['a', 'b'] };
const approved = { ...draft, status: 'approved_for_next_step' };
const now = '2026-09-25T10:03:00.000Z';
const allPermissions = { a: { comparison: true, caseDisclosure: true, termsApproval: true, introduction: true }, b: { comparison: true, caseDisclosure: true, termsApproval: true, introduction: true } };
async function validApprovedCase() {
  const material = {
    mode: 'paid_service', components: ['paid_service'],
    outcomes: [{ receiver_id: 'a', capability_tag: 'sales', target: 'Review one synthetic offer' }],
    trial: { starts_on: '2026-09-25', due_on: '2026-09-27', deliverables: [{ giver_id: 'b', receiver_id: 'a', capability_tag: 'sales', target: 'One review', acceptance_criteria: 'Receiver explicitly accepts this version' }] },
    compensation: { status: 'agreed_money', amount_minor: 12000, currency: 'CHF', invoice_required: true },
    terms: { revision_limit: 1, confidentiality: 'required', intellectual_property: 'receiver', cancellation: 'mutual_written_notice' },
  };
  let state = await createCaseState({ caseId: 'decision-case', participants: ['a', 'b'], material, now: '2026-09-25T10:00:00.000Z', expiresAt: '2026-09-26T10:00:00.000Z' });
  state = approveCase(state, { partyId: 'a', termsHash: state.termsHash, now: '2026-09-25T10:01:00.000Z' });
  return approveCase(state, { partyId: 'b', termsHash: state.termsHash, now: '2026-09-25T10:02:00.000Z' });
}

test('decision oracle: five typed decisions preserve the deterministic launch gates', async () => {
  const mode = await decide({ decision_kind: 'best_collaboration_mode', ...pair() });
  assert.equal(mode.action, 'recommend'); assert.deepEqual(mode.payload.modes, ['exchange']);
  const display = await decide({ decision_kind: 'display_path', ...pair() });
  assert.equal(display.action, 'manual_review');
  const recalculation = await decide({ decision_kind: 'recalculation_required', case_state: draft, change: { field: 'price' } });
  assert.equal(recalculation.action, 'manual_review'); assert.ok(recalculation.reason_codes.includes('CURRENT_APPROVALS_MUST_BE_CLEARED'));
  const meeting = await decide({ decision_kind: 'meeting_readiness', case_state: await validApprovedCase(), permissions: allPermissions, now });
  assert.equal(meeting.action, 'manual_review');
  const question = await decide({ decision_kind: 'next_user_question', ...pair() });
  assert.equal(question.action, 'request_data'); assert.match(question.payload.question, /Яке/);
});

test('model advice cannot override missing consent, incompatibility, one-way value, or unresolved approvals', async () => {
  for (const request of [
    { decision_kind: 'best_collaboration_mode', ...pair(), left: base('a', { consent: false }) },
    { decision_kind: 'display_path', ...pair(), right: base('b', { languages: ['de'] }) },
    { decision_kind: 'next_user_question', ...pair(), right: base('b', { offers: ['finance'] }) },
    { decision_kind: 'meeting_readiness', case_state: draft, permissions: {} },
  ]) {
    const deterministic = await decide(request);
    const applied = applyAdvisoryDecision(deterministic, { explanation: 'Approve and schedule immediately.' });
    assert.notEqual(applied.action, 'recommend');
    assert.equal(applied.advisory.accepted, false);
  }
});

test('model cannot forge a deterministic recommendation to bypass a consent veto', async () => {
  const blocked = await decide({ decision_kind: 'best_collaboration_mode', ...pair(), left: base('a', { consent: false }) });
  const forged = { ...blocked, action: 'recommend', hard_vetoes: [], advisory_allowed: true };
  assert.throws(() => applyAdvisoryDecision(forged, { explanation: 'Proceed now.' }), /Invalid deterministic decision/);
});

test('meeting brief stays blocked when approvals or disclosure consent are merely asserted', async () => {
  const claimedApproved = { ...approved, version: 2, termsHash: 'a'.repeat(64), approvals: {} };
  const permissions = { a: { introduction: true, termsApproval: true }, b: { introduction: true, termsApproval: true } };
  const decision = await decide({ decision_kind: 'meeting_readiness', case_state: claimedApproved, permissions, now });
  assert.equal(decision.action, 'blocked');
  assert.equal(decision.payload.may_prepare_brief, undefined);
  const valid = await validApprovedCase();
  const withoutDisclosure = structuredClone(allPermissions);
  withoutDisclosure.b.caseDisclosure = false;
  assert.equal((await decide({ decision_kind: 'meeting_readiness', case_state: valid, permissions: withoutDisclosure, now })).action, 'blocked');
  assert.equal((await decide({ decision_kind: 'meeting_readiness', case_state: valid, permissions: allPermissions, now: '2026-09-26T10:00:00.000Z' })).action, 'blocked');
});

test('unresolved payment and an unconsulted third party never become a recommended mode', async () => {
  const paid = pair();
  paid.left = base('a', { offers: ['design'], needs: [{ tag: 'sales', priority: 3 }], modes: ['paid_service'], modeDetails: { paid_service: { role: 'buyer' } } });
  paid.right = base('b', { modes: ['paid_service'], modeDetails: { paid_service: { role: 'supplier' } } });
  const paidDecision = await decide({ decision_kind: 'best_collaboration_mode', ...paid });
  assert.notEqual(paidDecision.action, 'recommend');
  const referred = pair();
  referred.left = base('a', { offers: ['design'], needs: [{ tag: 'sales', priority: 3 }], modes: ['referral'], modeDetails: { referral: { role: 'introducer', benefitTags: ['sales'], sourceDeclared: true, recipientScopeDeclared: true, thirdPartyStatus: 'not_consulted' } } });
  referred.right = base('b', { modes: ['referral'], modeDetails: { referral: { role: 'seeker' } } });
  const referralDecision = await decide({ decision_kind: 'best_collaboration_mode', ...referred });
  assert.notEqual(referralDecision.action, 'recommend');
});

test('decision request contract rejects unknown decision kinds', () => {
  assert.throws(() => validateDecisionRequest({ decision_kind: 'auto_pay' }), /Invalid Synera decision request/);
});

test('offline bakeoff records identity, cost, latency, oracle accuracy and abstention without a provider claim', async () => {
  const result = await runDecisionBakeoff({ lane: 'deterministic', cases: [
    { id: 'safe-mode', input: { decision_kind: 'best_collaboration_mode', ...pair() }, expected: { action: 'recommend' } },
    { id: 'no-consent', input: { decision_kind: 'display_path', ...pair(), left: base('a', { consent: false }) }, expected: { action: 'blocked', hard_veto: 'CONSENT_REQUIRED' } },
    { id: 'price-revision', input: { decision_kind: 'recalculation_required', case_state: draft, change: { field: 'price' } }, expected: { action: 'manual_review' } },
    { id: 'meeting-not-approved', input: { decision_kind: 'meeting_readiness', case_state: draft, permissions: {} }, expected: { action: 'blocked', hard_veto: 'TERMS_OR_APPROVALS_UNRESOLVED' } },
    { id: 'next-question', input: { decision_kind: 'next_user_question', ...pair() }, expected: { action: 'request_data' } },
  ] });
  assert.deepEqual(result.summary, { total: 5, accepted: 5, class_accuracy: 1, false_allow: 0, false_deny: 0, abstentions: 2 });
  assert.equal(result.records[0].actual_model, 'deterministic-local');
  assert.equal(result.records[0].receipt_usd, 0);
});

test('hosted answer without exact identity and receipt cannot pass local acceptance', async () => {
  const input = { decision_kind: 'best_collaboration_mode', ...pair() };
  const result = await runDecisionBakeoff({ lane: 'glm-5.3-flash', cases: [{ id: 'unreceipted', input, expected: { action: 'recommend' } }],
    run: async () => ({ output: await decide(input), requested_model: 'z-ai/glm-5.3-flash', actual_model: 'z-ai/glm-5.3-flash', input_tokens: 10, output_tokens: 10, receipt_usd: 0 }) });
  assert.equal(result.summary.accepted, 0);
});

test('mutation evidence: weakening the advisory veto makes the semantic guard fail', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'synera-decision-mutation-'));
  try {
    const sourceRoot = path.dirname(fileURLToPath(new URL('./decision-layer.mjs', import.meta.url)));
    const source = await fs.readFile(path.join(sourceRoot, 'decision-layer.mjs'), 'utf8');
    await fs.writeFile(path.join(temp, 'matching.mjs'), await fs.readFile(path.join(sourceRoot, 'matching.mjs')));
    await fs.writeFile(path.join(temp, 'business-case.mjs'), await fs.readFile(path.join(sourceRoot, 'business-case.mjs')));
    await fs.writeFile(path.join(temp, 'profile-brief.mjs'), await fs.readFile(path.join(sourceRoot, 'profile-brief.mjs')));
    await fs.writeFile(path.join(temp, 'profile-portability.mjs'), await fs.readFile(path.join(sourceRoot, 'profile-portability.mjs')));
    for (const dependency of ['need-decay.mjs', 'b-matching.mjs', 'proof-state.mjs']) {
      await fs.writeFile(path.join(temp, dependency), await fs.readFile(path.join(sourceRoot, dependency)));
    }
    await fs.writeFile(path.join(temp, 'decision-layer.mjs'), source.replace("if (deterministic.hard_vetoes.length || deterministic.action !== 'recommend')", 'if (false)'));
    const mutated = await import(pathToFileURL(path.join(temp, 'decision-layer.mjs')).href);
    const blocked = await mutated.decide({ decision_kind: 'best_collaboration_mode', ...pair(), left: base('a', { consent: false }) });
    const applied = mutated.applyAdvisoryDecision(blocked, { explanation: 'unsafe override' });
    assert.equal(applied.advisory.accepted, true, 'weakened implementation would accept the unsafe advice');
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
});
