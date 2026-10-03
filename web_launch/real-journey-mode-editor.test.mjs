import test from 'node:test';
import assert from 'node:assert/strict';
import { materialFromEditor, REAL_MATERIAL_MODES } from './real-journey-client.mjs';
import { RealJourneyStore } from './real-journey-client.mjs';
import { A, B, config, createFixture, fields } from '../tools/fixtures/real-journey-fixture.mjs';

test('real editor preserves explicit paid, referral, hybrid and joint-project material', () => {
  assert.deepEqual(REAL_MATERIAL_MODES, ['exchange', 'joint_project', 'paid_service', 'referral', 'hybrid']);
  const paid = materialFromEditor(A, B, fields({ mode: 'paid_service', compensation_status: 'agreed_money', amount: '125.50', currency: 'CHF', invoice: 'yes' }));
  assert.equal(paid.mode, 'paid_service');
  assert.equal(paid.compensation.amount_minor, 12550);
  assert.equal(paid.compensation.invoice_required, true);
  const referral = materialFromEditor(A, B, fields({ mode: 'referral', compensation_status: 'agreed_none' }));
  assert.equal(referral.mode, 'referral');
  const hybrid = materialFromEditor(A, B, fields({ mode: 'hybrid', components: ['exchange', 'referral'], compensation_status: 'agreed_exchange' }));
  assert.deepEqual(hybrid.components, ['exchange', 'referral']);
  const project = materialFromEditor(A, B, fields({ mode: 'joint_project', compensation_status: 'agreed_none' }));
  assert.deepEqual(project.components, ['joint_project']);
});

test('a joint project is a bilateral trial case: a revision clears both approvals before an invitation can be sent', async () => {
  const db = createFixture();
  const a = new RealJourneyStore(config, db.fetchFor(A)), b = new RealJourneyStore(config, db.fetchFor(B));
  await Promise.all([a.dashboard(), b.dashboard()]);
  const initial = materialFromEditor(A, B, fields({ mode: 'joint_project', compensation_status: 'agreed_none' }));
  const created = await a.saveTerms(B, initial);
  await a.approveTerms(B, created);
  await b.approveTerms(A, await b.pairState(A));
  assert.equal((await a.pairState(B)).status, 'approved_for_next_step');
  const revised = await a.saveTerms(B, materialFromEditor(A, B, fields({ mode: 'joint_project', compensation_status: 'agreed_none', give_target: 'Спільний прототип для перевірки' })), await a.pairState(B));
  assert.deepEqual(revised.approvals, {});
  await assert.rejects(() => a.sendInvitation(B, 'Обговорити конкретний внесок', { proposed_at: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 20, meeting_place: 'Онлайн' }), /обидва/);
});
