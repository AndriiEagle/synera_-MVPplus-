import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBusinessCase, businessCaseText, canonicalMaterialPayload, hashMaterialPayload, createCaseState, approveCase, withdrawApproval, reviseCase, revokeCase, abandonCase, reviewCaseAction, INVALIDATION_MATRIX, caseMaterialProblems, materialTermsFromInput } from './business-case.mjs';
import { normalizeBrief } from './profile-brief.mjs';
const options = { asOf: '2026-09-07' };
const person = (id, offer, need, goal) => ({ id, is_discoverable: true, updated_at: '2026-09-07', brief: { goal, offer_tags: [offer], need_tags: [need], languages: ['en'], modes: ['exchange'], available_from: '2026-09-07', available_until: '2026-09-30', remote: true } });
const a = person('a', 'video', 'sales', 'Перевірити пропозицію з клієнтом');
const b = person('b', 'sales', 'video', 'Підготувати відеопрезентацію');
test('each outcome belongs to its receiver; no invented competence, price, agreement or delivery', () => {
  const result = buildBusinessCase(a, b, options);
  assert.equal(result.status, 'review_candidate');
  assert.equal(result.binding, false);
  for (const benefit of result.benefits) {
    assert.equal(benefit.requestedOutcome, benefit.receiver === 'a' ? a.brief.goal : b.brief.goal);
    assert.equal(benefit.competence, 'self_declared');
    assert.equal(benefit.needConfirmed, false); assert.equal(benefit.deliveryAccepted, false);
    assert.ok(benefit.evidence.length > 0);
  }
  assert.deepEqual(buildBusinessCase(b, a, options), result);
  const text = businessCaseText(result, 'a');
  assert.ok(text.includes('Твій результат: ' + a.brief.goal));
  assert.ok(text.includes('Результат партнера: ' + b.brief.goal));
});
test('withdrawn discovery, one-way value and stale profiles cannot emit a business-case draft', () => {
  for (const other of [{ ...b, is_discoverable: false }, { ...b, brief: { ...b.brief, need_tags: ['finance'] } }, { ...b, updated_at: '2025-01-01' }]) {
    const result = buildBusinessCase(a, other, options);
    assert.notEqual(result.status, 'review_candidate');
    assert.deepEqual(result.benefits, []); assert.equal(businessCaseText(result, 'a'), '');
  }
});
test('identity, subscription and private annotations cannot change the case', () => {
  assert.deepEqual(buildBusinessCase({ ...a, email: 'private', religion: 'private', tier: 'paid', instruction: 'invent expertise' }, b, options), buildBusinessCase(a, b, options));
});

test('business case v2: paid and referral drafts include only the eligible receiver-owned benefit', () => {
  const profile = (id, brief) => ({ id, is_discoverable: true, updated_at: '2026-09-07', brief: normalizeBrief({ goal: `${id} outcome`, languages: ['en'], available_from: '2026-09-07', available_until: '2026-09-30', remote: true, ...brief }) });
  const buyer = profile('buyer', { need_tags: ['design'], modes: ['paid_service'], mode_details: { paid_service: { role: 'buyer' } } });
  const supplier = profile('supplier', { offer_tags: ['design'], modes: ['paid_service'], mode_details: { paid_service: { role: 'supplier' } } });
  const paid = buildBusinessCase(buyer, supplier, { ...options, mode: 'paid_service' });
  assert.equal(paid.version, 2); assert.equal(paid.mode, 'paid_service'); assert.equal(paid.visibility, 'private_draft'); assert.equal(paid.disclosureAllowed, false);
  assert.equal(paid.benefits.length, 1); assert.equal(paid.benefits[0].receiver, 'buyer'); assert.deepEqual(paid.unresolved, ['amount', 'currency', 'invoice', 'acceptance']);

  const seeker = profile('seeker', { need_tags: ['sales'], modes: ['referral'], mode_details: { referral: { role: 'seeker' } } });
  const introducer = profile('introducer', { modes: ['referral'], mode_details: { referral: { role: 'introducer', benefitTags: ['sales'], sourceDeclared: true, recipientScopeDeclared: true, thirdPartyStatus: 'not_consulted' } } });
  const referral = buildBusinessCase(seeker, introducer, { ...options, mode: 'referral' });
  assert.equal(referral.benefits.length, 1); assert.equal(referral.benefits[0].receiver, 'seeker'); assert.equal(referral.benefits[0].competence, 'third_party_unverified');
  assert.equal(JSON.stringify(referral).includes('contact'), false);
});

const material = (overrides = {}) => ({
  mode: 'paid_service', components: ['paid_service'],
  outcomes: [{ receiver_id: 'a', capability_tag: 'sales', target: 'Review one synthetic offer' }],
  trial: { starts_on: '2026-09-08', due_on: '2026-09-12', deliverables: [{ giver_id: 'b', receiver_id: 'a', capability_tag: 'sales', target: 'One review', acceptance_criteria: 'Receiver explicitly accepts this version' }] },
  compensation: { status: 'agreed_money', amount_minor: 12000, currency: 'CHF', invoice_required: true },
  terms: { revision_limit: 1, confidentiality: 'required', intellectual_property: 'receiver', cancellation: 'mutual_written_notice' },
  ...overrides,
});
const permissions = value => ({ a: { comparison: true, caseDisclosure: true, termsApproval: true, introduction: value }, b: { comparison: true, caseDisclosure: true, termsApproval: true, introduction: value } });

test('material terms: byte canonicalization is stable and SHA-256 changes only for a material change', async () => {
  const first = canonicalMaterialPayload(material());
  const reordered = canonicalMaterialPayload({ terms: material().terms, compensation: material().compensation, trial: material().trial, outcomes: material().outcomes, components: ['paid_service'], mode: 'paid_service' });
  assert.equal(JSON.stringify(first), JSON.stringify(reordered));
  assert.equal(await hashMaterialPayload(first), await hashMaterialPayload(reordered));
  assert.notEqual(await hashMaterialPayload(first), await hashMaterialPayload(material({ compensation: { ...material().compensation, amount_minor: 12001 } })));
  assert.equal(JSON.stringify(first).includes('instructions'), false);
});

test('case state: both exact current approvals are required and a material revision clears them', async () => {
  let state = await createCaseState({ caseId: 'case-1', participants: ['b', 'a'], material: material(), now: '2026-09-08T10:00:00.000Z', expiresAt: '2026-09-15T10:00:00.000Z' });
  assert.equal(state.binding, false); assert.equal(state.approvalAttestation, 'ACKNOWLEDGED_FOR_NEXT_STEP_NOT_A_CONTRACT');
  assert.equal((await reviewCaseAction(state, { action: 'introduction', permissions: permissions(true), now: '2026-09-08T10:01:00.000Z' })).allowed, false);
  state = approveCase(state, { partyId: 'a', termsHash: state.termsHash, now: '2026-09-08T10:01:00.000Z' });
  assert.equal(state.status, 'awaiting_approval');
  assert.throws(() => approveCase(state, { partyId: 'b', termsHash: '0'.repeat(64), now: '2026-09-08T10:02:00.000Z' }));
  state = approveCase(state, { partyId: 'b', termsHash: state.termsHash, now: '2026-09-08T10:02:00.000Z' });
  assert.equal(state.status, 'approved_for_next_step');
  assert.equal((await reviewCaseAction(state, { action: 'introduction', permissions: permissions(true), now: '2026-09-08T10:03:00.000Z' })).allowed, true);
  const revised = await reviseCase(state, { material: material({ compensation: { ...material().compensation, amount_minor: 13000 } }), now: '2026-09-08T10:04:00.000Z' });
  assert.equal(revised.version, 2); assert.deepEqual(revised.approvals, {}); assert.equal(revised.status, 'draft'); assert.notEqual(revised.termsHash, state.termsHash);
  assert.equal((await reviewCaseAction(revised, { action: 'introduction', permissions: permissions(true), now: '2026-09-08T10:05:00.000Z' })).allowed, false);
});

test('case state: timestamps are monotonic and withdrawing one approval blocks the next action', async () => {
  let state = await createCaseState({ caseId: 'case-time', participants: ['a', 'b'], material: material(), now: '2026-09-08T10:00:00.000Z', expiresAt: '2026-09-15T10:00:00.000Z' });
  assert.throws(() => approveCase(state, { partyId: 'a', termsHash: state.termsHash, now: '2026-09-08T09:59:00.000Z' }));
  state = approveCase(state, { partyId: 'a', termsHash: state.termsHash, now: '2026-09-08T10:01:00.000Z' });
  state = approveCase(state, { partyId: 'b', termsHash: state.termsHash, now: '2026-09-08T10:02:00.000Z' });
  const withdrawn = withdrawApproval(state, { partyId: 'a', now: '2026-09-08T10:03:00.000Z' });
  assert.equal(withdrawn.status, 'awaiting_approval'); assert.equal('a' in withdrawn.approvals, false); assert.equal('b' in withdrawn.approvals, true);
  assert.deepEqual((await reviewCaseAction(withdrawn, { action: 'introduction', permissions: permissions(true), now: '2026-09-08T10:04:00.000Z' })).reasonCodes, ['BOTH_CURRENT_APPROVALS_REQUIRED']);
});

test('case state: expiry, revocation, abandonment and independent permissions fail closed', async () => {
  let state = await createCaseState({ caseId: 'case-2', participants: ['a', 'b'], material: material(), now: '2026-09-08T10:00:00.000Z', expiresAt: '2026-09-09T10:00:00.000Z' });
  state = approveCase(state, { partyId: 'a', termsHash: state.termsHash, now: '2026-09-08T10:01:00.000Z' });
  state = approveCase(state, { partyId: 'b', termsHash: state.termsHash, now: '2026-09-08T10:02:00.000Z' });
  assert.deepEqual((await reviewCaseAction(state, { action: 'introduction', permissions: permissions(true), now: '2026-09-10T10:00:00.000Z' })).reasonCodes, ['CASE_EXPIRED']);
  const noDisclosure = permissions(true); noDisclosure.b.caseDisclosure = false;
  assert.deepEqual((await reviewCaseAction(state, { action: 'introduction', permissions: noDisclosure, now: '2026-09-08T10:03:00.000Z' })).reasonCodes, ['CASE_DISCLOSURE_CONSENT_MISSING']);
  assert.equal((await reviewCaseAction(revokeCase(state, { partyId: 'a', now: '2026-09-08T10:04:00.000Z' }), { action: 'introduction', permissions: permissions(true), now: '2026-09-08T10:05:00.000Z' })).allowed, false);
  assert.equal((await reviewCaseAction(abandonCase(state, { partyId: 'b', now: '2026-09-08T10:04:00.000Z' }), { action: 'introduction', permissions: permissions(true), now: '2026-09-08T10:05:00.000Z' })).allowed, false);
  assert.equal(INVALIDATION_MATRIX.material_change.approvals, 'clear_both'); assert.equal(INVALIDATION_MATRIX.case_disclosure_withdrawn.next_action, 'block');
});

test('case state: unresolved paid compensation cannot be approved', async () => {
  const state = await createCaseState({ caseId: 'case-3', participants: ['a', 'b'], material: material({ compensation: { status: 'unresolved', amount_minor: null, currency: '', invoice_required: null } }), now: '2026-09-08T10:00:00.000Z', expiresAt: '2026-09-15T10:00:00.000Z' });
  assert.throws(() => approveCase(state, { partyId: 'a', termsHash: state.termsHash, now: '2026-09-08T10:01:00.000Z' }), /compensation/i);
});

test('case state: direct material tampering cannot reuse the old hash and approvals', async () => {
  let state = await createCaseState({ caseId: 'case-tamper', participants: ['a', 'b'], material: material(), now: '2026-09-08T10:00:00.000Z', expiresAt: '2026-09-15T10:00:00.000Z' });
  state = await approveCase(state, { partyId: 'a', termsHash: state.termsHash, now: '2026-09-08T10:01:00.000Z' });
  state = await approveCase(state, { partyId: 'b', termsHash: state.termsHash, now: '2026-09-08T10:02:00.000Z' });
  state.material.compensation.amount_minor = 999999;
  const gate = await reviewCaseAction(state, { action: 'introduction', permissions: permissions(true), now: '2026-09-08T10:03:00.000Z' });
  assert.equal(gate.allowed, false);
  assert.deepEqual(gate.reasonCodes, ['CASE_INTEGRITY_INVALID']);
});

test('case state: every outcome and deliverable party must be one of the two participants', async () => {
  await assert.rejects(
    createCaseState({
      caseId: 'case-outsider', participants: ['a', 'b'],
      material: material({ outcomes: [{ receiver_id: 'c', capability_tag: 'sales', target: 'Outsider result' }] }),
      now: '2026-09-08T10:00:00.000Z', expiresAt: '2026-09-15T10:00:00.000Z',
    }),
    /participant/i,
  );
  await assert.rejects(
    createCaseState({
      caseId: 'case-outsider-deliverable', participants: ['a', 'b'],
      material: material({ trial: { ...material().trial, deliverables: [{ ...material().trial.deliverables[0], giver_id: 'c' }] } }),
      now: '2026-09-08T10:00:00.000Z', expiresAt: '2026-09-15T10:00:00.000Z',
    }),
    /participant/i,
  );
});

test('SYN_TERMS_FROM_HUMAN_INPUT: empty or malformed fields stay unresolved; nothing becomes agreement by default', () => {
  const empty = materialTermsFromInput({});
  assert.deepEqual(empty, { compensation: { status: 'unresolved', amount_minor: null, currency: '', invoice_required: null }, terms: { revision_limit: null, confidentiality: 'unresolved', intellectual_property: 'unresolved', cancellation: 'unresolved' } });
  assert.deepEqual(caseMaterialProblems(material(empty)), ['compensation unresolved', 'paid service compensation must be explicit money terms', 'revision limit unresolved', 'confidentiality unresolved', 'intellectual property unresolved', 'cancellation unresolved']);
  const junk = materialTermsFromInput({ compensation_status: 'agreed', amount: '-5', currency: 'chf', invoice: 'maybe', revision_limit: '101', confidentiality: 'yes', intellectual_property: 'mine', cancellation: 'any' });
  assert.deepEqual(junk, empty);
  const ignoredAmount = materialTermsFromInput({ compensation_status: 'agreed_exchange', amount: '450', currency: 'CHF', invoice: 'yes' });
  assert.deepEqual(ignoredAmount.compensation, { status: 'agreed_exchange', amount_minor: null, currency: '', invoice_required: null });
  const partialMoney = materialTermsFromInput({ compensation_status: 'agreed_money', amount: '450' });
  assert.ok(caseMaterialProblems(material(partialMoney)).includes('money amount, currency and invoice choice required'));
});

test('SYN_TERMS_FROM_HUMAN_INPUT: full human terms pass the domain, and editing one term clears both approvals', async () => {
  const fields = { compensation_status: 'agreed_money', amount: '450,50', currency: 'CHF', invoice: 'yes', revision_limit: '2', confidentiality: 'required', intellectual_property: 'receiver', cancellation: 'mutual_written_notice' };
  const human = materialTermsFromInput(fields);
  assert.equal(human.compensation.amount_minor, 45050);
  assert.deepEqual(caseMaterialProblems(material(human)), []);
  let state = await createCaseState({ caseId: 'case-human', participants: ['a', 'b'], material: material(human), now: '2026-09-08T10:00:00.000Z', expiresAt: '2026-09-15T10:00:00.000Z' });
  state = approveCase(state, { partyId: 'a', termsHash: state.termsHash, now: '2026-09-08T10:01:00.000Z' });
  state = approveCase(state, { partyId: 'b', termsHash: state.termsHash, now: '2026-09-08T10:02:00.000Z' });
  assert.equal(state.status, 'approved_for_next_step');
  const revised = await reviseCase(state, { material: material(materialTermsFromInput({ ...fields, revision_limit: '3' })), now: '2026-09-08T10:03:00.000Z' });
  assert.equal(revised.version, 2); assert.deepEqual(revised.approvals, {}); assert.equal(revised.status, 'draft');
  const cosmetic = await reviseCase(state, { material: material(materialTermsFromInput({ ...fields, currency: ' CHF ' })), now: '2026-09-08T10:03:00.000Z' });
  assert.equal(cosmetic.version, 1); assert.equal(cosmetic.status, 'approved_for_next_step');
});
