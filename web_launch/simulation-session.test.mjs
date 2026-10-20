import test from 'node:test';
import assert from 'node:assert/strict';
import { SIMULATION_PEOPLE, createSimulation, simulationAction } from './simulation-session.mjs';

const at = '2026-10-20T12:00:00.000Z';
const terms = mode => ({ mode, target: 'Три конкретні ідеї для сторінки', criteria: 'Кожна ідея має приклад',
  returnTarget: 'Відгук на три ідеї', returnCriteria: 'Пояснено корисність кожної', due: '2026-10-27', amount: '120' });
const act = (s, actor, kind, extra = {}) => simulationAction(s, { actor, kind, revision: s.revision, ...extra }, at);

test('20 distinct labelled fictional actors; legacy bot identities remain available', () => {
  assert.equal(SIMULATION_PEOPLE.length, 20);
  assert.equal(new Set(SIMULATION_PEOPLE.map(p => p.id)).size, 20);
  assert.ok(SIMULATION_PEOPLE.every(p => p.is_bot && p.role && p.scenario && p.boundary));
  assert.ok(SIMULATION_PEOPLE.some(p => p.id === 'bot-mira'));
});
for (const mode of ['paid_service', 'exchange', 'referral', 'hybrid', 'joint_project']) {
  test(`${mode}: independent approvals and receiver-only accepted simulated output`, async () => {
    let s = createSimulation('bot-mira', at);
    s = await act(s, 'owner', 'propose', { terms: terms(mode) });
    assert.equal(s.case.material.mode, mode);
    assert.equal(s.case.material.trial.deliverables.length, mode === 'paid_service' || mode === 'referral' ? 1 : 2);
    await assert.rejects(act(s, s.personId, 'deliver', { text: 'Завчасний результат', index: 0 }));
    s = await act(s, 'owner', 'approve');
    assert.notEqual(s.case.status, 'approved_for_next_step');
    s = await act(s, s.personId, 'approve');
    assert.equal(s.case.status, 'approved_for_next_step');
    const index = s.case.material.trial.deliverables.findIndex(d => d.giver_id === s.personId);
    s = await act(s, s.personId, 'deliver', { text: '1. Приклад першої ідеї.\n2. Друга.\n3. Третя.', index });
    await assert.rejects(act(s, s.personId, 'accept', { index }));
    await assert.rejects(act(s, s.personId, 'check', { index, text: 'Сам собі перевірив' }));
    await assert.rejects(act(s, 'owner', 'accept', { index }));
    s = await act(s, 'owner', 'check', { index, text: 'Прочитав кожен приклад' });
    s = await act(s, 'owner', 'accept', { index });
    assert.ok(s.case.events.some(e => e.type === 'deliverable_accepted' && e.by === 'owner'));
    assert.equal(s.simulation, true);
    assert.equal(s.paymentVerified, false);
  });
}
test('stale frame revision, outsider, and stopped session never mutate state', async () => {
  let s = createSimulation('bot-mira', at);
  const old = structuredClone(s);
  await assert.rejects(act(s, 'bot-leo', 'message', { text: 'Чужа пара' }));
  s = await act(s, 'owner', 'message', { text: 'Поточна версія' });
  await assert.rejects(simulationAction(s, { actor: s.personId, kind: 'message', text: 'Запізно', revision: old.revision }, at), /змінився/);
  s = await act(s, 'owner', 'stop');
  const before = structuredClone(s);
  await assert.rejects(act(s, s.personId, 'message', { text: 'Після STOP' }), /зупинена/);
  assert.deepEqual(s, before);
  await assert.rejects(act(s, s.personId, 'resume'));
  s = await act(s, 'owner', 'resume');
  assert.equal(s.stopped, false);
});
test('revising terms invalidates both approvals; refusal is available', async () => {
  let s = createSimulation('bot-mira', at);
  s = await act(s, 'owner', 'propose', { terms: terms('exchange') });
  s = await act(s, 'owner', 'approve'); s = await act(s, s.personId, 'approve');
  s = await act(s, s.personId, 'propose', { terms: { ...terms('exchange'), target: 'Інша робота' } });
  assert.deepEqual(s.case.approvals, {});
  s = await act(s, s.personId, 'decline');
  assert.equal(s.case.status, 'revoked');
});
test('failed validation retains complete text and previous state', async () => {
  const s = createSimulation('bot-mira', at), before = structuredClone(s);
  await assert.rejects(act(s, 'owner', 'propose', { terms: { ...terms('paid_service'), amount: '0' } }));
  await assert.rejects(act(s, 'owner', 'message', { text: '' }));
  assert.deepEqual(s, before);
  const text = 'Думка 🐝 '.repeat(200);
  const next = await act(s, 'owner', 'message', { text });
  assert.equal(next.messages.at(-1).text, text);
});
