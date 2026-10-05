import test from 'node:test';
import assert from 'node:assert/strict';
import { RealJourneyStore } from './real-journey-client.mjs';
import { validateConfig } from './config.mjs';
import { A, B, O, config } from '../tools/fixtures/real-journey-fixture.mjs';
import { createMessageFixture } from '../tools/fixtures/message-intent-fixture.mjs';
const meeting = '44444444-4444-4444-8444-444444444444';
async function setup() {
  const db = createMessageFixture(); db.meetings.push({ id: meeting, sender_id: A, recipient_id: B, status: 'accepted', created_at: new Date().toISOString() });
  const control = { fail: null }, calls = [];
  const fetchImpl = async (path, init = {}) => {
    calls.push({ path, method: init.method });
    const response = await db.fetchFor(A)(path, init);
    const sending = init.method === 'POST' && (path.includes('/messages/') || path.endsWith('/meeting_messages'));
    const reading = init.method === 'GET' && path.includes('/meeting_messages?');
    if ((control.fail === 'post' && sending) || (control.fail === 'read' && reading)) { control.fail = null; return Response.json({}, { status: 503 }); }
    return response;
  };
  const a = new RealJourneyStore({ ...config, messageIntentsEnabled: true }, fetchImpl); await a.restore();
  return { db, a, calls, control };
}
test('lost POST response and explicit retry produce exactly one stored message', async () => {
  const { db, a, calls, control } = await setup(); control.fail = 'post';
  const text = 'Не дублюй 💛 <script>literal</script>';
  await assert.rejects(a.sendConversation(meeting, text)); assert.equal(db.messages.length, 1);
  await a.sendConversation(meeting, text);
  assert.equal(db.messages.length, 1, 'Explicit retry duplicated an already delivered message');
  assert.equal(db.messages[0].body, text); assert.equal(calls.filter(row => row.method === 'POST').length, 2, 'Only explicit clicks may POST');
});
test('failed read after committed send reuses intent; acknowledged repeat is a new message', async () => {
  const { db, a, control } = await setup(); control.fail = 'read';
  await assert.rejects(a.sendConversation(meeting, 'Одна думка')); await a.sendConversation(meeting, 'Одна думка');
  assert.equal(db.messages.length, 1);
  await a.sendConversation(meeting, 'Одна думка'); assert.equal(db.messages.length, 2); assert.notEqual(db.messages[0].id, db.messages[1].id);
});
test('ordinary dashboard refresh keeps ambiguous intent in the same authenticated account', async () => {
  const { db, a, control } = await setup(); control.fail = 'post'; await assert.rejects(a.sendConversation(meeting, 'Спершу онови чат'));
  await a.dashboard(); await a.sendConversation(meeting, 'Спершу онови чат');
  assert.equal(db.messages.length, 1, 'Dashboard refresh discarded the ambiguous delivery intent');
});
test('concurrent same intent collapses; different text remains a separate explicit send', async () => {
  const { db, a, control } = await setup(); control.fail = 'post'; await assert.rejects(a.sendConversation(meeting, 'Перша'));
  await a.sendConversation(meeting, 'Друга'); await Promise.all(Array.from({ length: 16 }, () => a.sendConversation(meeting, 'Перша')));
  assert.equal(db.messages.length, 2); assert.deepEqual(db.messages.map(row => row.body), ['Перша', 'Друга']);
});
test('authentication reset forgets pending intent', async () => {
  const { db, a, control } = await setup(); control.fail = 'post'; await assert.rejects(a.sendConversation(meeting, 'Невідомо'));
  const old = db.messages[0].id; await a.signOut(); await a.restore(); await a.sendConversation(meeting, 'Невідомо');
  assert.equal(db.messages.length, 2); assert.notEqual(db.messages[1].id, old, 'Pending intent survived logout');
});
test('late committed acknowledgement is rejected after same-account restore', async () => {
  const db = createMessageFixture(); db.meetings.push({ id: meeting, sender_id: A, recipient_id: B, status: 'accepted' });
  let release, reached; const waiting = new Promise(r => { release = r; }), barrier = new Promise(r => { reached = r; });
  const a = new RealJourneyStore({ ...config, messageIntentsEnabled: true }, async (path, init) => {
    const response = await db.fetchFor(A)(path, init);
    if (path.includes('/messages/')) { reached(); await waiting; } return response;
  }); await a.restore();
  const late = assert.rejects(a.sendConversation(meeting, 'Запізніла відповідь'), error => error.status === 401);
  await barrier; await a.restore(); release(); await late; assert.equal(db.messages.length, 1);
});
test('forged acknowledgement keeps the exact intent for later manual recovery', async () => {
  const db = createMessageFixture(); db.meetings.push({ id: meeting, sender_id: A, recipient_id: B, status: 'accepted' });let corrupt = true;
  const a = new RealJourneyStore({ ...config, messageIntentsEnabled: true }, async (path, init) => {
    const response = await db.fetchFor(A)(path, init);
    if (corrupt && path.includes('/messages/')) { corrupt = false; const row = await response.json(); return Response.json({ ...row, sender_id: B }); } return response;
  }); await a.restore();
  await assert.rejects(a.sendConversation(meeting, 'Точно ця думка'), error => error.status === 502);
  await a.sendConversation(meeting, 'Точно ця думка'); assert.equal(db.messages.length, 1);
});
test('outsider and cancelled meeting cannot send, and malformed config never enables the new lane', async () => {
  const { db, a } = await setup(); db.meetings[0].status = 'cancelled'; await assert.rejects(a.sendConversation(meeting, 'Ні')); assert.equal(db.messages.length, 0);
  const outsider = new RealJourneyStore({ ...config, messageIntentsEnabled: true }, db.fetchFor(O)); await outsider.restore();
  await assert.rejects(outsider.sendConversation(meeting, 'Ні')); assert.equal(db.messages.length, 0);
  assert.throws(() => validateConfig({ ...config, messageIntentsEnabled: 'true' }));
});
