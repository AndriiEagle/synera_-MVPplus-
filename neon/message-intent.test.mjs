import test from 'node:test';
import assert from 'node:assert/strict';
import { handleNeon, createNeonWorker } from './worker.mjs';
import { createMessageFixture } from '../tools/fixtures/message-intent-fixture.mjs';
import { A, B, origin } from '../tools/fixtures/real-journey-fixture.mjs';
const meeting = '44444444-4444-4444-8444-444444444444', intent = '55555555-5555-4555-8555-555555555555';
const db = createMessageFixture(); db.meetings.push({ id: meeting, sender_id: A, recipient_id: B, status: 'accepted' });
const request = (body = { intentId: intent, text: 'Текст' }, suffix = '', extra = {}) => new Request(origin + '/api/neon/messages/' + meeting + suffix, { method: 'POST', headers: { Origin: origin, 'X-Synera-Client': '1', 'Content-Type': 'application/json', Cookie: '__Host-synera-session=' + A, ...extra }, body: JSON.stringify(body) });
const env = { ...db.env, SYNERA_MESSAGE_INTENTS_READY: 'true' };
test('readiness gates keep new route and advertised capability closed without upstream calls', async () => {
  for (const field of ['SYNERA_MESSAGE_INTENTS_READY', 'SYNERA_REAL_JOURNEY_READY', 'SYNERA_PILOT_READY']) {
    let calls = 0; const settings = { ...env, [field]: 'false' };
    assert.equal((await handleNeon(request(), settings, async () => { calls++; throw Error(); })).status, 503); assert.equal(calls, 0);
    assert.equal((await (await createNeonWorker([]).fetch(new Request(origin + '/config.json'), settings)).json()).messageIntentsEnabled, false);
  }
});
test('untrusted sender, unknown keys, query injection and wrong origin never reach message RPC', async () => {
  for (const req of [request({ intentId: intent, text: 'Текст', sender_id: B }), request({ intentId: 'invalid', text: 'Текст' }), request({ intentId: intent, text: 'x'.repeat(1001) }), request({ intentId: intent, text: ' ' }), request({ intentId: intent, text: ' padded ' }), request(undefined, '?rpc=evil'), request(undefined, '', { Origin: 'https://evil.example' }), request(undefined, '', { Cookie: '' })]) {
    let calls = 0; const response = await handleNeon(req, env, async (...args) => { calls++; return db.upstream(...args); });
    assert.ok(response.status >= 400); assert.ok(calls <= 1); // Only missing-cookie/session validation can require auth.
  }
});
test('RPC forwards server session identity and preserves rejection with sanitized errors', async () => {
  for (const status of [400, 401, 403, 409, 429, 500]) {
    const calls = [];
    const response = await handleNeon(request(), env, async (url, init) => {
      calls.push({ url, init }); if (url.endsWith('/get-session')) return db.upstream(url, init);
      assert.ok(url.endsWith('/rpc/synera_send_message')); assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer fixture.' + A + '.signature');
      assert.deepEqual(JSON.parse(init.body), { p_meeting_id: meeting, p_intent_id: intent, p_body: 'Текст' });
      return Response.json({ secret: 'provider private diagnostic' }, { status });
    });
    assert.equal(response.status, status === 500 ? 503 : status); assert.equal(calls.length, 2); assert.equal((await response.text()).includes('provider private diagnostic'), false);
  }
});
