import test from 'node:test';
import assert from 'node:assert/strict';
import { NeonStore } from './neon-store.mjs';
const actor = '11111111-1111-4111-8111-111111111111', meeting = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
async function fixture(enabled) {
  const requests = [], row = { id: meeting, meeting_address: '' };
  const store = new NeonStore({ backend: 'neon', liveLocationEnabled: true, meetingAddressEnabled: enabled }, async (url, init) => {
    requests.push({ url, ...init });
    if (url === '/api/neon/session') return Response.json({ user: { id: actor } });
    if (init.method === 'PATCH') Object.assign(row, JSON.parse(init.body));
    return Response.json([row]);
  });
  await store.restore(); requests.length = 0; return { store, requests, row };
}
test('bilateral mode stops the legacy setter before transport or address mutation', async () => {
  const f = await fixture(true);
  await assert.rejects(f.store.setMeetingAddress(meeting, 'One-sided destination'), e => e.status === 409);
  assert.deepEqual(f.requests, []); assert.equal(f.row.meeting_address, '');
});
test('legacy default retains its existing explicit same-origin trimmed address write', async () => {
  for (const enabled of [false, undefined]) {
    const f = await fixture(enabled); await f.store.setMeetingAddress(meeting, '  Bahnhofplatz 15, Zürich 💛  ');
    assert.equal(f.requests.length, 1); assert.equal(f.requests[0].method, 'PATCH'); assert.equal(f.requests[0].credentials, 'same-origin');
    assert.equal(f.row.meeting_address, 'Bahnhofplatz 15, Zürich 💛');
    assert.equal(JSON.parse(f.requests[0].body).meeting_address, f.row.meeting_address);
  }
});
