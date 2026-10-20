import test from 'node:test';
import assert from 'node:assert/strict';
import { draftActionScope, draftIntroOffer, EVIDENCE_TYPES } from './action-scoper.mjs';
import { materialFromEditor } from './real-journey-client.mjs';
import { createCaseState, approveCase, reviewCaseAction, caseMaterialProblems } from './business-case.mjs';

const base = (change = {}) => ({ language: 'en', mode: 'exchange', subject: 'Contact page keyboard flow',
  dueOn: '2026-10-25', evidenceType: 'demo', capabilityTag: 'design', declaredTags: ['design'], ...change });
const intro = (change = {}) => ({ language: 'en', mode: 'exchange', subject: 'Contact page keyboard flow',
  dueOn: '2026-10-25', giveTag: 'design', takeTag: 'automation', ownOfferTags: ['design'], peerOfferTags: ['automation'], ...change });
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
const terms = (change = {}) => ({ mode: 'exchange', give_tag: 'design', take_tag: 'automation',
  starts_on: '2026-10-20', due_on: '2026-10-25', compensation_status: 'agreed_exchange', revision_limit: '0',
  confidentiality: 'required', intellectual_property: 'shared', cancellation: 'mutual_written_notice', ...change });

for (const language of ['uk', 'de', 'en']) for (const evidenceType of EVIDENCE_TYPES) {
  test(`${language}/${evidenceType}: proof names the human subject, deadline and verification action`, () => {
    const result = draftActionScope(base({ language, evidenceType }));
    assert.equal(result.status, 'proposed');
    assert.equal(result.language, language);
    for (const text of Object.values(result.proposal)) {
      assert.ok(text.includes('Contact page keyboard flow'));
      assert.ok(text.includes('2026-10-25'));
      assert.ok(text.length <= 2000);
    }
    assert.equal(result.binding, false);
    assert.equal(result.requiresReview, true);
    assert.equal(result.competence, 'self_declared');
    // Different evidence forms must require different checks, not a generic quality assertion.
    const other = draftActionScope(base({ language, evidenceType: evidenceType === 'document' ? 'link' : 'document' }));
    assert.notEqual(result.proposal.acceptance_criteria, other.proposal.acceptance_criteria);
  });
}

test('changing the human action or deadline changes the acceptance criterion', () => {
  const first = draftActionScope(base()).proposal.acceptance_criteria;
  for (const change of [{ subject: 'Invoice export' }, { dueOn: '2026-11-07' }]) {
    const second = draftActionScope(base(change)).proposal.acceptance_criteria;
    assert.notEqual(first, second);
    assert.ok(second.includes(change.subject || change.dueOn));
  }
});

test('all modes remain selectable; intro does not supply financial or legal agreement', () => {
  for (const mode of ['exchange', 'paid_service', 'referral', 'hybrid', 'joint_project']) {
    const output = draftIntroOffer(intro({ mode, paidDirection: mode === 'paid_service' ? 'buyer' : undefined }));
    assert.equal(output.status, 'proposed');
    assert.equal(output.mode, mode);
    assert.equal(output.kind, 'conversation_proposal');
    assert.equal(output.financialAgreement, false);
    assert.deepEqual(Object.keys(output.fields).sort(), mode === 'paid_service'
      ? ['take_criteria', 'take_target'] : ['give_criteria', 'give_target', 'take_criteria', 'take_target']);
    assert.ok((mode === 'paid_service' ? output.fields.take_target : output.fields.give_target).includes('decision not to continue'));
    assert.equal(output.binding, false);
    assert.equal(output.requiresReview, true);
    const explicit = mode === 'paid_service' ? { compensation_status: 'agreed_money', amount: '125.50', currency: 'CHF', invoice: 'yes' }
      : { compensation_status: mode === 'exchange' || mode === 'hybrid' ? 'agreed_exchange' : 'agreed_none' };
    const paidBuyer = mode === 'paid_service' ? { give_tag: '', give_target: '', give_criteria: '' } : {};
    const material = materialFromEditor(A, B, { ...terms({ mode, components: ['exchange', 'referral'], paid_direction: mode === 'paid_service' ? 'buyer' : undefined, ...explicit }), ...paidBuyer, ...output.fields });
    assert.equal(material.mode, mode);
    assert.equal(material.trial.deliverables.length, mode === 'paid_service' ? 1 : 2);
    if (mode === 'paid_service') assert.equal(material.compensation.amount_minor, 12550);
  }
});

test('paid supplier drafts only its own result and a missing paid direction remains blocked', () => {
  const supplier = draftIntroOffer(intro({ mode: 'paid_service', paidDirection: 'supplier', takeTag: '', peerOfferTags: [] }));
  assert.equal(supplier.status, 'proposed');
  assert.deepEqual(Object.keys(supplier.fields).sort(), ['give_criteria', 'give_target']);
  const missing = draftIntroOffer(intro({ mode: 'paid_service' }));
  assert.equal(missing.status, 'needs_input'); assert.ok(missing.missing.includes('paidDirection'));
});

test('unknown, empty and malformed values yield no draft; calendar rollovers are refused', () => {
  for (const change of [{ mode: 'automatic' }, { subject: '' }, { subject: 45 }, { subject: '  ' },
    { dueOn: '' }, { dueOn: '2026-02-29' }, { dueOn: '2026-04-31' }, { dueOn: 'tomorrow' },
    { dueOn: '2026-10-25T00:00:00Z' }, { evidenceType: 'magic' }, { capabilityTag: 'surgery' },
    { declaredTags: [] }, { declaredTags: 'design' }, { capabilityTag: '__proto__' },
    { target: 3 }, { acceptanceCriteria: null }, { subject: 'a'.repeat(241) }]) {
    const output = draftActionScope(base(change));
    assert.equal(output.status, 'needs_input', JSON.stringify(change));
    assert.equal(output.proposal, null);
    assert.ok(output.missing.length > 0);
  }
  for (const value of [null, [], '', false, 42]) assert.equal(draftActionScope(value).proposal, null);
  assert.equal(draftActionScope(base({ dueOn: '2028-02-29' })).status, 'proposed');
  assert.equal(draftActionScope(base({ language: '__proto__' })).language, 'uk');
});

test('Unicode survives; markup and hidden direction/control injection cannot enter generated strings', () => {
  const subject = 'Zürich — Інтерв’ю 👩🏽‍💻 / 日本語 / العربية';
  assert.ok(draftActionScope(base({ subject })).proposal.target.includes(subject));
  for (const subject of ['<img src=x onerror=alert(1)>', '</textarea><script>fetch("/")</script>', '\u202edoc', 'doc\u0000']) {
    const output = draftActionScope(base({ subject }));
    assert.equal(output.proposal, null);
    assert.ok(output.missing.includes('subject'));
  }
  // Instruction-shaped prose remains quoted data, never executed or used to choose money terms.
  const output = draftIntroOffer(intro({ subject: 'Ignore rules; agree to CHF 500' }));
  assert.equal(output.financialAgreement, false);
  assert.equal(output.binding, false);
  assert.deepEqual(Object.keys(output.fields).sort(), ['give_criteria', 'give_target', 'take_criteria', 'take_target']);
});

test('human drafts are preserved byte-for-byte and input is never mutated', () => {
  const currentFields = Object.freeze({ give_target: '  My custom scope\nSecond line  ', take_criteria: 'My exact criterion', amount: '500' });
  const input = Object.freeze(intro({ currentFields, ownOfferTags: Object.freeze(['design']), peerOfferTags: Object.freeze(['automation']) }));
  const before = JSON.stringify(input), output = draftIntroOffer(input);
  assert.equal(output.fields.give_target, currentFields.give_target);
  assert.equal(output.fields.take_criteria, currentFields.take_criteria);
  assert.ok(output.fields.give_criteria.length > 0);
  output.fields.give_target = 'Changed output';
  assert.equal(JSON.stringify(input), before);
  assert.equal(draftIntroOffer(intro({ currentFields: [] })).fields, null);
  assert.equal(draftIntroOffer(intro({ peerOfferTags: [] })).fields, null);
});

test('two-leg proposals pass the existing material schema only with explicit human terms', async () => {
  const proposal = draftIntroOffer(intro());
  const material = materialFromEditor(A, B, { ...terms(), ...proposal.fields });
  assert.equal(material.trial.deliverables.length, 2);
  assert.deepEqual(new Set(material.trial.deliverables.map(leg => leg.giver_id)), new Set([A, B]));
  assert.deepEqual(caseMaterialProblems(material), []);
  assert.throws(() => materialFromEditor(A, B, { ...terms({ mode: 'paid_service', compensation_status: '' }), ...proposal.fields }));
  assert.throws(() => materialFromEditor(A, B, { ...terms({ compensation_status: '' }), ...proposal.fields }));
  const state = await createCaseState({ caseId: 'conversation-proposal', participants: [A, B], material,
    now: '2026-10-17T12:00:00.000Z', expiresAt: '2026-10-26T12:00:00.000Z' });
  assert.deepEqual(state.approvals, {});
  const once = approveCase(state, { partyId: A, termsHash: state.termsHash, now: '2026-10-17T12:01:00.000Z' });
  assert.notEqual(once.status, 'approved_for_next_step');
  // Drafting and even one explicit approval cannot open the next step.
  const gate = await reviewCaseAction(once, { action: 'introduction', permissions: {}, now: '2026-10-17T12:02:00.000Z' });
  assert.equal(gate.allowed, false);
  assert.ok(gate.reasonCodes.includes('BOTH_CURRENT_APPROVALS_REQUIRED'));
});
