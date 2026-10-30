import test from 'node:test';
import assert from 'node:assert/strict';
import { handleNeon } from './worker.mjs';
import { consentRecord } from '../web_launch/pilot-policy.mjs';

const origin = 'https://synera-test.pages.dev';
const consent = consentRecord({ terms: true, privacy: true });
const base = { SYNERA_SITE_URL: origin, SYNERA_NEON_AUTH_URL: 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth',
  SYNERA_NEON_DATA_URL: 'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1', SYNERA_PILOT_READY: 'true',
  SYNERA_REGISTRATION_ENABLED: 'true', SYNERA_PILOT_EMAILS: 'pilot@example.com' };
function kvStore() {
  const rows = new Map();
  return { rows, async get(key, options) { const value = rows.get(key); return value && options?.type === 'json' ? JSON.parse(value) : value ?? null; },
    async put(key, value, options) { assert.ok(options.expirationTtl >= 60); rows.set(key, value); }, async delete(key) { rows.delete(key); } };
}
const settings = () => ({ ...base, SYNERA_OPEN_REGISTRATION: 'true', SYNERA_PILOT_EMAILS: '', SYNERA_LOCATION_EPHEMERAL: kvStore() });
const request = (path, body, ip = '192.0.2.1') => new Request(origin + '/api/neon' + path, { method: body ? 'POST' : 'GET',
  headers: { 'X-Synera-Client': '1', Origin: origin, 'Content-Type': 'application/json', ...(ip ? { 'CF-Connecting-IP': ip } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}) });
const send = (env, email = 'new@example.com', upstream = async () => Response.json({}), ip) =>
  handleNeon(request('/otp/request', { email, consent }, ip), env, upstream);
const verify = (env, email = 'new@example.com', upstream = success, otp = '123456') =>
  handleNeon(request('/otp/verify', { email, otp }), env, upstream);

test('W1 closed pilot protects issuance and five guesses with allowlist checked before KV', async () => {
  const env = { ...base, SYNERA_LOCATION_EPHEMERAL: kvStore() };
  let calls = 0;
  const fail = async () => { calls++; return Response.json({}, { status: 400 }); };
  assert.equal((await verify(env, 'pilot@example.com', fail)).status, 400);
  assert.equal(calls, 0, 'no issuance means no provider guessing');
  assert.equal((await send(env, 'pilot@example.com')).status, 200);
  for (let i = 0; i < 5; i++) assert.equal((await verify(env, 'pilot@example.com', fail)).status, 400);
  assert.equal((await verify(env, 'pilot@example.com', fail)).status, 429);
  assert.equal(calls, 5);
  assert.equal((await send(env, 'pilot@example.com')).status, 200);
  assert.equal((await verify(env, 'pilot@example.com', fail)).status, 429, 'resend cannot reset guesses');
  assert.equal((await send(env, 'pilot@example.com')).status, 200);
  assert.equal((await send(env, 'pilot@example.com')).status, 429);
  const absent = { ...base };
  assert.equal((await send(absent, 'pilot@example.com')).status, 503);
  assert.equal((await send(absent, 'stranger@example.com')).status, 403);
  assert.equal((await verify(absent, 'stranger@example.com', fail)).status, 403);
  assert.equal(calls, 5);
});
function success() { return Response.json({ user: { id: 'new-user', email: 'new@example.com', emailVerified: true } },
  { headers: { 'Set-Cookie': '__Secure-neon-auth.session_token=synthetic-session; Secure; HttpOnly' } }); }

test('off-mode pins allowlist errors, normalization, verification and missing/oversized configuration', async () => {
  for (const flag of [undefined, 'false', 'TRUE', true]) {
    let calls = 0;
    const upstream = async () => { calls++; return Response.json({}); };
    const env = { ...base, SYNERA_OPEN_REGISTRATION: flag, SYNERA_LOCATION_EPHEMERAL: kvStore() };
    for (const [body, status] of [[{ email: 'new@example.com', consent }, 403], [{ email: 'pilot@example.com' }, 400]]) {
      const response = await handleNeon(request('/otp/request', body), env, upstream);
      assert.equal(response.status, status);
      assert.deepEqual(await response.json(), { error: 'service_unavailable', status });
    }
    assert.equal((await verify(env, 'new@example.com', upstream)).status, 403);
    assert.equal(calls, 0);
    const sent = await send(env, ' PILOT@EXAMPLE.COM ', upstream);
    assert.equal(sent.status, 200); assert.deepEqual(await sent.json(), { sent: true });
    for (const emails of ['', 'bad-address', Array.from({ length: 11 }, (_, i) => `p${i}@example.com`).join(',')]) {
      const response = await send({ ...env, SYNERA_PILOT_EMAILS: emails }, 'pilot@example.com', upstream);
      assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'service_unavailable', status: 503 });
    }
    assert.equal(calls, 1);
  }
});

test('open-mode sends and verifies a normalized new email, then restores its session without an allowlist', async () => {
  const env = settings(), calls = [];
  const sent = await send(env, ' NEW@EXAMPLE.COM ', async (url, init) => { calls.push(JSON.parse(init.body)); return Response.json({}); });
  assert.equal(sent.status, 200); assert.deepEqual(await sent.json(), { sent: true });
  assert.deepEqual(calls, [{ email: 'new@example.com', type: 'sign-in' }]);
  const signedIn = await verify(env, ' NEW@EXAMPLE.COM ');
  assert.equal(signedIn.status, 200); assert.deepEqual(await signedIn.json(), { user: { id: 'new-user', email: 'new@example.com' } });
  assert.match(signedIn.headers.get('set-cookie'), /__Host-synera-session=synthetic-session;.*Secure; HttpOnly/);
  const req = request('/session'); req.headers.set('Cookie', '__Host-synera-session=synthetic-session');
  const restored = await handleNeon(req, env, async () => Response.json({ session: {}, user: { id: 'new-user', email: 'new@example.com', emailVerified: true } }, { headers: { 'Set-Auth-Jwt': 'a.b.c' } }));
  assert.equal(restored.status, 200); assert.deepEqual(await restored.json(), { user: { id: 'new-user', email: 'new@example.com' } });
});

test('open-mode requires valid current consent, an email, storage, trusted IP and all existing readiness flags', async () => {
  const env = settings(); let calls = 0; const never = async () => { calls++; return success(); };
  for (const value of [undefined, { ...consent, terms_accepted: false }, { ...consent, privacy_acknowledged: false }, { ...consent, policy_version: 'old' }]) {
    assert.equal((await handleNeon(request('/otp/request', { email: 'new@example.com', consent: value }), env, never)).status, 400);
  }
  for (const email of ['bad', 'a@b', 'a@b.com,other@b.com', 'a b@b.com', 'x'.repeat(255) + '@example.com']) assert.equal((await send(env, email, never)).status, 400);
  assert.equal((await send({ ...env, SYNERA_LOCATION_EPHEMERAL: undefined }, 'new@example.com', never)).status, 503);
  assert.equal((await send(env, 'new@example.com', never, '')).status, 503);
  assert.equal((await send({ ...env, SYNERA_PILOT_READY: 'false' }, 'new@example.com', never)).status, 503);
  assert.equal((await send({ ...env, SYNERA_REGISTRATION_ENABLED: 'false' }, 'new@example.com', never)).status, 403);
  assert.equal(calls, 0);
});

test('open verify requires an unexpired consent-bearing request before creating an Auth account', async (t) => {
  const env = settings(); let calls = 0; const upstream = async () => { calls++; return success(); };
  assert.equal((await verify(env, 'new@example.com', upstream)).status, 400);
  assert.equal(calls, 0);
  const now = Date.now(); t.mock.method(Date, 'now', () => now);
  await send(env);
  t.mock.method(Date, 'now', () => now + 600_001);
  assert.equal((await verify(env, 'new@example.com', upstream)).status, 400);
  assert.equal(calls, 0);
});

test('email request limit follows normalization across IPs and returns a bounded retry', async () => {
  const env = settings(); let calls = 0; const upstream = async () => { calls++; return Response.json({}); };
  for (let i = 0; i < 3; i++) assert.equal((await send(env, ' NEW@EXAMPLE.COM ', upstream, `192.0.2.${i + 1}`)).status, 200);
  const limited = await send(env, 'new@example.com', upstream, '192.0.2.50');
  assert.equal(limited.status, 429); assert.deepEqual(await limited.json(), { error: 'rate_limited', status: 429 });
  assert.ok(Number(limited.headers.get('retry-after')) > 0); assert.equal(calls, 3);
});

test('IP request limit covers different emails and ignores forged X-Forwarded-For', async () => {
  const env = settings(); let calls = 0; const upstream = async () => { calls++; return Response.json({}); };
  for (let i = 0; i < 20; i++) assert.equal((await send(env, `person${i}@example.com`, upstream)).status, 200);
  const req = request('/otp/request', { email: 'another@example.com', consent }); req.headers.set('X-Forwarded-For', '198.51.100.99');
  assert.equal((await handleNeon(req, env, upstream)).status, 429); assert.equal(calls, 20);
});

test('simultaneous requests sharing a KV binding cannot bypass the in-isolate email or IP limit', async () => {
  const env = settings(); let calls = 0;
  const upstream = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 2)); return Response.json({}); };
  const responses = await Promise.all(Array.from({ length: 8 }, () => send(env, 'new@example.com', upstream)));
  assert.equal(responses.filter(r => r.status === 200).length, 3); assert.equal(calls, 3);
});

test('verification cap covers different guesses and concurrent attempts; success consumes the challenge', async () => {
  const env = settings(); await send(env); let calls = 0;
  const invalid = async () => { calls++; return Response.json({ error: 'internal-detail' }, { status: 401 }); };
  const responses = await Promise.all(Array.from({ length: 8 }, (_, i) => verify(env, 'new@example.com', invalid, `00000${i}`)));
  assert.equal(calls, 5); assert.equal(responses.filter(r => r.status === 400).length, 5);
  assert.equal(responses.filter(r => r.status === 429).length, 3);
  const fresh = settings(); await send(fresh); assert.equal((await verify(fresh)).status, 200);
  assert.equal((await verify(fresh, 'new@example.com', invalid)).status, 429); assert.equal(calls, 5);
  await send(fresh); assert.equal((await verify(fresh)).status, 200, 'a completed sign-in allows a fresh code');
});

test('request/verify responses do not disclose existing versus unknown addresses or upstream account errors', async () => {
  for (const status of [200, 400, 401, 403, 404, 409, 422]) {
    const env = settings();
    const sent = await send(env, 'new@example.com', async () => Response.json({ exists: status === 200, private: 'provider-detail' }, { status }));
    assert.equal(sent.status, 200); assert.deepEqual(await sent.json(), { sent: true });
    assert.equal(sent.headers.get('set-cookie'), null);
  }
  for (const status of [400, 401, 403, 404, 409, 422]) {
    const env = settings(); await send(env);
    const rejected = await verify(env, 'new@example.com', async () => Response.json({ error: 'no-account' }, { status }));
    assert.equal(rejected.status, 400); assert.deepEqual(await rejected.json(), { error: 'otp_invalid', status: 400 });
    assert.equal(rejected.headers.get('set-cookie'), null);
  }
});

test('provider outage, throttling and KV failure stay closed and do not create a browser session', async () => {
  for (const status of [429, 500, 503]) {
    const env = settings();
    assert.equal((await send(env, 'new@example.com', async () => new Response('', { status }))).status, status === 429 ? 429 : 503);
  }
  for (const method of ['get', 'put']) {
    const env = settings(); env.SYNERA_LOCATION_EPHEMERAL[method] = async () => { throw new Error('storage unavailable'); };
    let calls = 0;
    assert.equal((await send(env, 'new@example.com', async () => { calls++; return success(); })).status, 503);
    assert.equal(calls, 0);
  }
});

test('resending cannot reset failed verification budget; rate windows expire and KV stores no raw email, IP or OTP', async (t) => {
  const env = settings(), now = Date.now(); t.mock.method(Date, 'now', () => now);
  await send(env);
  for (let i = 0; i < 5; i++) await verify(env, 'new@example.com', async () => new Response('', { status: 401 }));
  await send(env); assert.equal((await verify(env)).status, 429);
  await send(env); assert.equal((await send(env)).status, 429);
  t.mock.method(Date, 'now', () => now + 900_001);
  assert.equal((await send(env)).status, 200); assert.equal((await verify(env)).status, 200);
  assert.doesNotMatch(JSON.stringify([...env.SYNERA_LOCATION_EPHEMERAL.rows]), /new@example|192\.0\.2|123456/);
});

test('Google open-mode admits a verified new identity through the existing challenge bridge; each old flag still closes it', async () => {
  const env = { ...settings(), SYNERA_GOOGLE_OAUTH_READY: 'true' };
  const start = () => handleNeon(request('/oauth/google/start', { consent }), env, async () => Response.json({ url: base.SYNERA_NEON_AUTH_URL + '/sign-in/social/init?token=synthetic-token-0123456789' },
    { headers: { 'Set-Cookie': '__Secure-neon-auth.session_challenge=synthetic-challenge; Secure; HttpOnly; Max-Age=600' } }));
  const started = await start(); assert.equal(started.status, 200);
  const cookie = started.headers.getSetCookie().find(v => v.startsWith('__Host-synera-google-challenge=')).split(';')[0];
  const callback = () => new Request(origin + '/api/neon/oauth/google/callback?neon_auth_session_verifier=synthetic-verifier-0123456789', { headers: { Cookie: cookie } });
  const upstream = async () => Response.json({ session: { id: 'session' }, user: { id: 'new-user', email: 'new@example.com', emailVerified: true } },
    { headers: { 'Set-Cookie': '__Secure-neon-auth.session_token=synthetic-session; Secure; HttpOnly' } });
  const signedIn = await handleNeon(callback(), env, upstream);
  assert.equal(signedIn.status, 303); assert.equal(signedIn.headers.get('location'), origin + '/');
  assert.match(signedIn.headers.getSetCookie().join('\n'), /__Host-synera-session=synthetic-session/);
  for (const flag of ['SYNERA_GOOGLE_OAUTH_READY', 'SYNERA_REGISTRATION_ENABLED', 'SYNERA_PILOT_READY']) {
    let calls = 0; const never = async () => { calls++; return upstream(); };
    const disabled = { ...env, [flag]: 'false' };
    assert.ok((await handleNeon(request('/oauth/google/start', { consent }), disabled, never)).status >= 400);
    const denied = await handleNeon(callback(), disabled, never);
    assert.equal(denied.headers.get('location'), origin + '/?signin=google-error');
    assert.doesNotMatch(denied.headers.getSetCookie().join('\n'), /__Host-synera-session=synthetic-session/); assert.equal(calls, 0);
  }
});
