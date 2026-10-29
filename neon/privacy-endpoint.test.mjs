import test from 'node:test';
import assert from 'node:assert/strict';
import { handleNeon } from './worker.mjs';
import { world, A, origin } from '../tools/fixtures/profile-delete-fixture.mjs';
function fixture(overrides = {}) {
  const w = world(), calls = [];
  const env = { ...w.env, SYNERA_PROFILE_ERASURE_READY: 'true', SYNERA_COMPLETE_ERASURE_READY: 'true', ...overrides };
  const send = (body = { confirm: 'ERASE_ALL_APPLICATION_DATA', expectedSubject: A }, headers = {}) => handleNeon(new Request(origin + '/api/neon/privacy-erasure', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Synera-Client': '1', Cookie: '__Host-synera-session=' + A, ...headers }, body: JSON.stringify(body) }), env, async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/rpc/synera_complete_erase_application_data')) return Response.json({ status: 'application_data_completely_erased', providerDeletion: 'pending', staleSessionTombstone: 'retained', repeated: false });
    if (url.endsWith('/sign-out')) return Response.json({});
    return w.db.upstream(url, init);
  });
  return { calls, send };
}
test('P3: complete application erasure defaults OFF and never calls upstream', async () => {
  for (const value of [undefined, 'false', 'TRUE']) { const f = fixture({ SYNERA_COMPLETE_ERASURE_READY: value }); assert.equal((await f.send()).status, 503); assert.equal(f.calls.length, 0); }
});
test('P3: explicit complete erase uses verified subject, empty RPC body and pending provider status', async () => {
  const f = fixture(), response = await f.send(); assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'application_data_completely_erased', providerDeletion: 'pending', staleSessionTombstone: 'retained', repeated: false, sessionRevoked: true });
  assert.equal(f.calls.find(call => call.url.endsWith('/rpc/synera_complete_erase_application_data')).init.body, '{}');
  assert.equal(response.headers.has('Set-Cookie'), false);
});
test('P3: complete erasure rejects CSRF, subject changes and legacy confirmation without data writes', async () => {
  for (const [body, headers, status] of [[{ confirm: 'ERASE_ALL_APPLICATION_DATA', expectedSubject: 'another-account' }, {}, 409], [{ confirm: 'ERASE_APPLICATION_DATA', expectedSubject: A }, {}, 400], [undefined, { Origin: 'https://evil.invalid' }, 403]]) {
    const f = fixture(); assert.equal((await f.send(body, headers)).status, status); assert.equal(f.calls.some(call => call.url.includes('/rpc/')), false);
  }
});
