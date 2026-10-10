import test from 'node:test';
import assert from 'node:assert/strict';
import { RealJourneyStore } from './real-journey-client.mjs';
import { validateConfig } from './config.mjs';
import { A, B, O, config } from '../tools/fixtures/real-journey-fixture.mjs';
import { createMessageFixture } from '../tools/fixtures/message-intent-fixture.mjs';
const meeting = '44444444-4444-4444-8444-444444444444';
class MemoryStorage {
  #items = new Map();
  getItem(key) { return this.#items.get(key) ?? null; }
  setItem(key, value) { this.#items.set(key, String(value)); }
  removeItem(key) { this.#items.delete(key); }
  values() { return [...this.#items.values()]; }
}
class DeniedStorage {
  getItem() { throw new Error('denied'); }
  setItem() { throw new Error('denied'); }
  removeItem() { throw new Error('denied'); }
}
class ChurningStorage {
  #turn = 0;
  #salts = [crypto.randomUUID(), crypto.randomUUID()];
  getItem() { return JSON.stringify({ version: 1, salt: this.#salts[this.#turn++ % this.#salts.length], entries: [] }); }
  setItem() {}
  removeItem() {}
}
async function delayDigests(count, run) {
  const subtle = globalThis.crypto.subtle, original = subtle.digest.bind(subtle);
  let released = false, reached = 0, release, ready;
  const gate = new Promise(resolve => { release = () => { released = true; resolve(); }; });
  const barrier = new Promise(resolve => { ready = resolve; });
  Object.defineProperty(subtle, 'digest', { configurable: true, value: async (...args) => {
    if (reached < count) { reached++; if (reached === count) ready(); await gate; }
    return original(...args);
  } });
  try { return await run({ barrier, release }); }
  finally { Object.defineProperty(subtle, 'digest', { configurable: true, value: original }); if (!released) release(); }
}
async function setup(storage) {
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
  const a = new RealJourneyStore({ ...config, messageIntentsEnabled: true }, fetchImpl, { storage }); await a.restore();
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
test('same-tab reload retries a committed unknown delivery once without storing message text', async () => {
  const storage = new MemoryStorage();
  const { db, a, control } = await setup(storage); const text = '  Після reload лише один рядок  ';
  control.fail = 'post'; await assert.rejects(a.sendConversation(meeting, text)); assert.equal(db.messages.length, 1);
  assert.ok(storage.values().length === 1 && storage.values().every(value => !value.includes(text.trim())), 'Retry metadata stored raw message text');
  const reloaded = new RealJourneyStore({ ...config, messageIntentsEnabled: true }, db.fetchFor(A), { storage }); await reloaded.restore();
  assert.equal(db.messages.length, 1, 'Reload must not send automatically');
  await reloaded.sendConversation(meeting, text.trim());
  assert.equal(db.messages.length, 1, 'The explicit retry after reload duplicated the committed message');
  assert.equal(storage.values().length, 0, 'Acknowledged retry metadata was not cleared');
});
test('logout while retry metadata hashes cannot restore a stale intent', async () => {
  const storage = new MemoryStorage(); const { a } = await setup(storage);
  await delayDigests(1, async ({ barrier, release }) => {
    const pending = assert.rejects(a.sendConversation(meeting, 'Пізній digest'));
    await barrier; await a.signOut(); release(); await pending;
  });
  assert.equal(storage.values().length, 0, 'Late digest restored metadata after logout');
});
test('concurrent unknown first sends retain both reload retry UUIDs', async () => {
  const storage = new MemoryStorage(), db = createMessageFixture();
  db.meetings.push({ id: meeting, sender_id: A, recipient_id: B, status: 'accepted', created_at: new Date().toISOString() });
  let losses = 2;
  const a = new RealJourneyStore({ ...config, messageIntentsEnabled: true }, async (path, init) => {
    const response = await db.fetchFor(A)(path, init);
    if (init.method === 'POST' && path.includes('/messages/') && losses-- > 0) return Response.json({}, { status: 503 });
    return response;
  }, { storage }); await a.restore();
  await delayDigests(2, async ({ barrier, release }) => {
    const first = assert.rejects(a.sendConversation(meeting, 'Перша паралельна'));
    const second = assert.rejects(a.sendConversation(meeting, 'Друга паралельна'));
    await barrier; release(); await Promise.all([first, second]);
  });
  const reloaded = new RealJourneyStore({ ...config, messageIntentsEnabled: true }, db.fetchFor(A), { storage }); await reloaded.restore();
  await reloaded.sendConversation(meeting, 'Перша паралельна'); await reloaded.sendConversation(meeting, 'Друга паралельна');
  assert.equal(db.messages.length, 2, 'Concurrent initial metadata lost one retry UUID');
});
test('blocked or corrupt storage falls back to the existing RAM retry path', async () => {
  for (const storage of [new DeniedStorage(), Object.assign(new MemoryStorage(), { getItem() { return '{corrupt'; } })]) {
    const { db, a, control } = await setup(storage); control.fail = 'post';
    await assert.rejects(a.sendConversation(meeting, 'RAM fallback')); await a.sendConversation(meeting, 'RAM fallback');
    assert.equal(db.messages.length, 1);
  }
});
test('persisted metadata cannot merge a different authenticated actor', async () => {
  const storage = new MemoryStorage(); const { db, a, control } = await setup(storage); control.fail = 'post';
  await assert.rejects(a.sendConversation(meeting, 'Один текст')); const first = db.messages[0].id;
  const b = new RealJourneyStore({ ...config, messageIntentsEnabled: true }, db.fetchFor(B), { storage }); await b.restore();
  await b.sendConversation(meeting, 'Один текст');
  assert.equal(db.messages.length, 2); assert.notEqual(db.messages[1].id, first, 'Different actor reused another actor\'s UUID');
});
test('persisted metadata cannot merge the same text across meetings', async () => {
  const storage = new MemoryStorage(), otherMeeting = '55555555-5555-4555-8555-555555555555', db = createMessageFixture();
  db.meetings.push({ id: meeting, sender_id: A, recipient_id: B, status: 'accepted' }, { id: otherMeeting, sender_id: A, recipient_id: B, status: 'accepted' });
  let losses = 2;
  const a = new RealJourneyStore({ ...config, messageIntentsEnabled: true }, async (path, init) => {
    const response = await db.fetchFor(A)(path, init);
    if (init.method === 'POST' && path.includes('/messages/') && losses-- > 0) return Response.json({}, { status: 503 });
    return response;
  }, { storage }); await a.restore();
  await assert.rejects(a.sendConversation(meeting, 'Спільний текст')); await assert.rejects(a.sendConversation(otherMeeting, 'Спільний текст'));
  const reloaded = new RealJourneyStore({ ...config, messageIntentsEnabled: true }, db.fetchFor(A), { storage }); await reloaded.restore();
  await reloaded.sendConversation(meeting, 'Спільний текст'); await reloaded.sendConversation(otherMeeting, 'Спільний текст');
  assert.equal(db.messages.length, 2);
});
test('untrusted retry metadata is copied without extra fields', async () => {
  const storage = new MemoryStorage(), salt = crypto.randomUUID();
  storage.setItem('synera.message-intent-retry.v1', JSON.stringify({ version: 1, salt, entries: [{
    actor: A, meeting, fingerprint: 'a'.repeat(64), intent: crypto.randomUUID(), profile: 'raw-profile', text: 'raw-text', outbox: { retry: true },
  }] }));
  const { a, control } = await setup(storage); control.fail = 'post'; await assert.rejects(a.sendConversation(meeting, 'Новий текст'));
  assert.ok(storage.values().every(value => !value.includes('raw-profile') && !value.includes('raw-text') && !value.includes('Новий текст')));
});
test('metadata churn settles before POST instead of retrying forever', async () => {
  const { a, calls } = await setup(new ChurningStorage());
  await assert.rejects(a.sendConversation(meeting, 'Зайнятий metadata'), error => error.status === 503);
  assert.equal(calls.filter(row => row.method === 'POST').length, 0);
});
test('concurrent same intent collapses; different text remains a separate explicit send', async () => {
  const { db, a, control } = await setup(); control.fail = 'post'; await assert.rejects(a.sendConversation(meeting, 'Перша'));
  await a.sendConversation(meeting, 'Друга'); await Promise.all(Array.from({ length: 16 }, () => a.sendConversation(meeting, 'Перша')));
  assert.equal(db.messages.length, 2); assert.deepEqual(db.messages.map(row => row.body), ['Перша', 'Друга']);
});
test('authentication reset forgets pending intent', async () => {
  const storage = new MemoryStorage(); const { db, a, control } = await setup(storage); control.fail = 'post'; await assert.rejects(a.sendConversation(meeting, 'Невідомо'));
  const old = db.messages[0].id; await a.signOut(); assert.equal(storage.values().length, 0, 'Logout retained retry metadata'); await a.restore(); await a.sendConversation(meeting, 'Невідомо');
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
