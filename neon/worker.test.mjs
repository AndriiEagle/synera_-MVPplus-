import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { handleNeon, neonEndpoints, createNeonWorker } from './worker.mjs';
import { NeonStore } from '../web_launch/neon-store.mjs';
import { SupabaseStore } from '../web_launch/online-store.mjs';
import { ProfileStore } from '../web_launch/profile-store.mjs';
import { consentRecord } from '../web_launch/pilot-policy.mjs';
import { generateSchema, generateAcceptance, generateCaseMigration, generateCaseAcceptance } from './generate-schema.mjs';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';

const origin = 'https://synera-test.pages.dev';
const env = { SYNERA_SITE_URL: origin, SYNERA_NEON_AUTH_URL: 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth',
  SYNERA_NEON_DATA_URL: 'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1', SYNERA_PILOT_EMAILS: 'pilot@example.com',
  SYNERA_PILOT_READY: 'true', SYNERA_REGISTRATION_ENABLED: 'true' };
const user = { id: '11111111-1111-4111-8111-111111111111', email: 'pilot@example.com', emailVerified: true };
const jwt = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJmaXh0dXJlIn0.signature'; // Shape-only public fixture. Never sent to a provider.
const request = (path, { method = 'GET', body, headers = {} } = {}) => new Request(origin + '/api/neon' + path, { method,
  headers: { 'X-Synera-Client': '1', Origin: origin, 'Content-Type': 'application/json', ...headers },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const upstreamSession = () => new Response(JSON.stringify({ user, session: { token: 'opaque-secret', id: 'session-id' } }), { headers: { 'Set-Auth-Jwt': jwt } });
const browserCookie = { Cookie: '__Host-synera-session=opaque-secret' };

test('closed backend, wrong origins, bad configuration and unsupported routes make no upstream request', async () => {
  let calls = 0; const never = async () => { calls++; throw new Error('Unexpected request'); };
  const cases = [
    [request('/health'), { ...env, SYNERA_PILOT_READY: 'false' }, 503],
    [request('/health', { headers: { Origin: 'https://evil.example' } }), env, 403],
    [request('/health', { headers: { 'X-Synera-Client': '' } }), env, 403],
    [request('/health', { headers: { 'Sec-Fetch-Site': 'cross-site' } }), env, 403],
    [request('/otp/request', { method: 'POST', body: {}, headers: { Origin: '' } }), env, 403],
    [request('/data/rpc'), env, 404],
    [request('/data/synera_pilot_members'), env, 404],
    [request('/session', { method: 'OPTIONS' }), env, 405],
    [request('/health'), { ...env, SYNERA_NEON_AUTH_URL: 'https://evil.example/auth' }, 503],
    [request('/health'), { ...env, SYNERA_NEON_DATA_URL: env.SYNERA_NEON_DATA_URL.replace('ep-fixture', 'ep-other') }, 503],
  ];
  for (const [req, settings, status] of cases) assert.equal((await handleNeon(req, settings, never)).status, status);
  assert.equal(calls, 0); assert.throws(() => neonEndpoints({ ...env, SYNERA_NEON_AUTH_URL: env.SYNERA_NEON_AUTH_URL + '?password=secret' }));
});

test('OTP requires an invited email, explicit current consent and a bounded body before sending', async () => {
  const calls = []; const upstream = async (...args) => { calls.push(args); return new Response('{}'); };
  const consent = consentRecord({ terms: true, privacy: true });
  for (const [body, status] of [[{ email: user.email }, 400], [{ email: 'not-invited@example.com', consent }, 403], [{ email: user.email, consent, admin: true }, 400], [{ email: 'x'.repeat(5000), consent }, 413]]) {
    assert.equal((await handleNeon(request('/otp/request', { method: 'POST', body }), env, upstream)).status, status);
  }
  assert.equal(calls.length, 0);
  assert.equal((await handleNeon(request('/otp/request', { method: 'POST', body: { email: user.email, consent } }), env, upstream)).status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], env.SYNERA_NEON_AUTH_URL + '/email-otp/send-verification-otp');
  assert.deepEqual(JSON.parse(calls[0][1].body), { email: user.email, type: 'sign-in' });
  assert.equal(calls[0][1].redirect, 'manual');
  assert.equal((await handleNeon(request('/otp/request', { method: 'POST', body: { email: user.email, consent } }), { ...env, SYNERA_REGISTRATION_ENABLED: 'false' }, upstream)).status, 403);
  assert.equal(calls.length, 1);
});

test('OTP verification keeps provider session, identity metadata and JWT out of browser JSON', async () => {
  const calls = [];
  const upstream = async (...args) => { calls.push(args); return new Response(JSON.stringify({ user: { ...user, privateMetadata: 'unnecessary' }, token: 'secret-provider-token' }),
    { headers: { 'Set-Cookie': '__Secure-neon-auth.session_token=opaque-secret; Path=/; Domain=neon.tech; Secure; HttpOnly; SameSite=None; Max-Age=604800', 'Set-Auth-Jwt': jwt } }); };
  const response = await handleNeon(request('/otp/verify', { method: 'POST', body: { email: user.email, otp: '123456' } }), env, upstream);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { user: { id: user.id, email: user.email } });
  assert.equal(response.headers.get('set-cookie'), '__Host-synera-session=opaque-secret; Path=/; Secure; HttpOnly; SameSite=Lax');
  assert.equal(response.headers.get('set-auth-jwt'), null);
  assert.equal(calls.length, 1);
  const bad = await handleNeon(request('/otp/verify', { method: 'POST', body: { email: user.email, otp: '123456' } }), env,
    async () => new Response(JSON.stringify({ user: { ...user, emailVerified: false } })));
  assert.equal(bad.status, 401); assert.match(bad.headers.get('set-cookie'), /Max-Age=0/);
});

test('a fresh provider session supplies the data token; caller Authorization and stray cookies are discarded', async () => {
  const calls = [];
  const upstream = async (url, init) => { calls.push({ url, init }); return calls.length === 1 ? upstreamSession() : new Response(JSON.stringify([{ id: user.id, display_name: 'Owned test profile' }])); };
  const response = await handleNeon(request('/data/profiles?select=id,display_name&limit=50', { headers: { ...browserCookie, Cookie: browserCookie.Cookie + '; unrelated=sensitive', Authorization: 'Bearer attacker-token' } }), env, upstream);
  assert.equal(response.status, 200); assert.equal(calls.length, 2);
  assert.equal(calls[0].init.headers.Cookie, '__Secure-neon-auth.session_token=opaque-secret');
  assert.equal(calls[1].init.headers.Authorization, 'Bearer ' + jwt);
  assert.equal(calls[1].init.headers.Cookie, undefined);
  assert.equal(calls[1].url, env.SYNERA_NEON_DATA_URL + '/profiles?select=id,display_name&limit=50');
  assert.equal(response.headers.get('set-auth-jwt'), null);
});

test('current Neon cookie survives OTP -> browser session -> data; unrelated cookie caches stay private', async () => {
  const headers = new Headers();
  headers.append('Set-Cookie', '__Secure-neon-auth.session_data=private-cache; Path=/; Secure; HttpOnly');
  headers.append('Set-Cookie', '__Secure-neon-auth.session_token=signed.opaque%2Bvalue; Path=/; Secure; HttpOnly; SameSite=None');
  const verified = await handleNeon(request('/otp/verify', { method: 'POST', body: { email: user.email, otp: '123456' } }), env,
    async () => new Response(JSON.stringify({ user }), { headers }));
  assert.equal(verified.status, 200);
  const cookie = verified.headers.get('set-cookie').split(';')[0];
  let calls = 0;
  const data = await handleNeon(request('/data/pilot_consents', { headers: { Cookie: cookie } }), env, async (url, init) => {
    calls++;
    if (calls === 1) {
      assert.equal(init.headers.Cookie, '__Secure-neon-auth.session_token=signed.opaque%2Bvalue');
      assert.equal(init.headers['X-Neon-Auth-Middleware'], 'true');
      return upstreamSession();
    }
    assert.equal(init.headers.Authorization, 'Bearer ' + jwt);
    return new Response('[]');
  });
  assert.equal(data.status, 200); assert.equal(calls, 2);
  assert.equal(JSON.stringify([...verified.headers]).includes('private-cache'), false);
});

test('Cloudflare extensionless HTML redirects stay inside the public asset allowlist', async () => {
  const worker = createNeonWorker(['index.html', 'legal.html', 'style.css']);
  const requests = [];
  const assets = { fetch: async req => { requests.push(new URL(req.url).pathname); return new Response('Public legal page'); } };
  const response = await worker.fetch(new Request(origin + '/legal'), { ...env, ASSETS: assets });
  assert.equal(response.status, 200); assert.equal(await response.text(), 'Public legal page');
  for (const path of ['/private', '/worker', '/release', '/schema']) {
    assert.equal((await worker.fetch(new Request(origin + path), { ...env, ASSETS: assets })).status, 404);
  }
  assert.deepEqual(requests, ['/legal']);
});

test('missing or ambiguous provider cookies fail closed with an actionable code, never a raw provider body', async () => {
  for (const values of [
    ['__Secure-neonauth.session_token=old-spelling; Path=/'],
    ['__Secure-neon-auth.session_token=a; Path=/', '__Secure-neon-auth.session_token=b; Path=/'],
  ]) {
    const headers = new Headers(); values.forEach(v => headers.append('Set-Cookie', v));
    const response = await handleNeon(request('/otp/verify', { method: 'POST', body: { email: user.email, otp: '123456' } }), env,
      async () => new Response(JSON.stringify({ user }), { headers }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'session_cookie_unavailable', status: 503 });
    assert.equal(response.headers.get('set-cookie'), null);
  }
  const response = await handleNeon(request('/otp/verify', { method: 'POST', body: { email: user.email, otp: '123456' } }), env,
    async () => new Response(JSON.stringify({ message: 'private email and code must not leak' }), { status: 400 }));
  assert.deepEqual(await response.json(), { error: 'otp_invalid', status: 400 });
});

test('client explains expired OTP and treats a temporary data failure as recoverable without forgetting the user', async () => {
  let calls = 0;
  const store = new NeonStore({ backend: 'neon', pilotSafetyEnabled: true, realPilotEnabled: true }, async () => {
    calls++;
    if (calls === 1) return new Response(JSON.stringify({ error: 'otp_invalid' }), { status: 400 });
    if (calls === 2) return new Response(JSON.stringify({ user }));
    if (calls === 3) return new Response(JSON.stringify({ error: 'data_unavailable' }), { status: 503 });
    return new Response('[]');
  });
  await assert.rejects(store.verifyOtp(user.email, '123456'), error => error.code === 'otp_invalid' && /вже використаний/.test(error.message));
  await store.verifyOtp(user.email, '123456');
  await assert.rejects(store.hasPolicy(), error => error.code === 'data_unavailable');
  assert.equal(store.user.id, user.id);
  assert.equal(await store.hasPolicy(), false);
  assert.equal(calls, 4);
});

test('missing, malformed or revoked sessions stop before any data access; no hidden retry on provider failures', async () => {
  let calls = 0;
  assert.equal((await handleNeon(request('/data/profiles'), env, async () => { calls++; })).status, 401);
  assert.equal(calls, 0);
  for (const make of [() => new Response('null'), () => new Response('{"session":{},"user":null}'), () => new Response('private error detail', { status: 429 }), () => new Response('', { status: 302, headers: { Location: 'https://evil.example' } })]) {
    const response = await handleNeon(request('/data/profiles', { headers: browserCookie }), env, async () => { calls++; return make(); });
    assert.ok([401, 429, 503].includes(response.status)); assert.doesNotMatch(await response.text(), /private|opaque|eyJ|evil/);
  }
  assert.equal(calls, 4);
});

test('logout clears local HttpOnly cookie even when upstream revocation fails', async () => {
  const response = await handleNeon(request('/logout', { method: 'POST', body: {}, headers: browserCookie }), env, async () => { throw new Error('network failed: private'); });
  assert.equal(response.status, 503); assert.match(response.headers.get('set-cookie'), /Max-Age=0/); assert.doesNotMatch(await response.text(), /private/);
});

test('published worker serves only the allowlist, keeps configuration closed and protects every response', async () => {
  const worker = createNeonWorker(Object.keys(PUBLIC_ASSETS));
  const settings = { ASSETS: { fetch: async () => new Response('public asset') } };
  for (const path of ['/', '/app.mjs', '/neon-store.mjs']) assert.equal((await worker.fetch(new Request(origin + path), settings)).status, 200);
  for (const path of ['/_worker.js', '/release.json', '/neon/schema.proposal.sql', '/config.public.json', '/server/local-profile-ai.mjs', '/data.mjs', '/lab.html']) assert.equal((await worker.fetch(new Request(origin + path), settings)).status, 404);
  const response = await worker.fetch(new Request(origin + '/config.json'), settings);
  const config = await response.json(); assert.equal(config.registrationEnabled, false); assert.equal(config.backend, 'neon');
  assert.equal(response.headers.get('Cache-Control'), 'no-store'); assert.equal(response.headers.get('Strict-Transport-Security'), 'max-age=31536000'); assert.match(response.headers.get('Content-Security-Policy'), /connect-src 'self';/);
  assert.doesNotMatch(JSON.stringify(config), /PILOT_EMAILS|AUTH_URL|DATA_URL/);
});

test('Neon reuses the exact profile contract and sends no browser bearer token or provider URL', async () => {
  assert.equal(NeonStore.prototype.saveProfile, ProfileStore.prototype.saveProfile);
  assert.equal(SupabaseStore.prototype.saveProfile, ProfileStore.prototype.saveProfile);
  const calls = [];
  const store = new NeonStore({ backend: 'neon', pilotSafetyEnabled: true, realPilotEnabled: true }, async (path, init) => {
    calls.push({ path, init }); return new Response(JSON.stringify(path.endsWith('/verify') ? { user: { id: user.id, email: user.email } } : []));
  });
  await store.verifyOtp(user.email, '123456');
  await store.saveProfile({ display_name: 'Owned', city: '', offers: 'Product design', seeks: 'Sales', is_discoverable: false, id: 'attacker-id' });
  assert.equal(calls[1].path, '/api/neon/data/profiles?on_conflict=id');
  assert.equal(JSON.parse(calls[1].init.body).id, user.id);
  assert.equal(calls[1].init.headers.Authorization, undefined); assert.equal(calls[1].init.credentials, 'same-origin');
  assert.equal(calls[1].init.headers['X-Synera-Client'], '1');
});

test('browser fetch is called without rebinding its receiver to the store', async () => {
  const strictFetch = function () {
    assert.equal(this, undefined, 'Native browser fetch must not receive a store as its receiver');
    return Promise.resolve(new Response('{}'));
  };
  await new NeonStore({ backend: 'neon' }, strictFetch).availability();
  await new SupabaseStore({ supabaseUrl: 'https://sample.supabase.co', publishableKey: 'sb_publishable_test' }, strictFetch).availability();
});

test('migration preserves canonical rules, adds private verified-member gate, and never assumes it was applied', async () => {
  const [base, proposal, acceptance] = await Promise.all(['schema.sql', 'real-pilot.proposal.sql', 'real-pilot.acceptance.sql'].map(file => fs.readFile(new URL('../supabase/' + file, import.meta.url), 'utf8')));
  const sql = generateSchema(base, proposal), checks = generateAcceptance(acceptance);
  assert.doesNotMatch(sql, /auth\.users|auth\.user_id\(\)|(?:sender_id|user_id|recipient_id) text/);
  assert.match(sql, /id uuid primary key references neon_auth\."user"/);
  assert.match(sql, /language sql stable security invoker return auth\.uid\(\);/);
  for (const policy of ['profiles_unblocked', 'meetings_response_unblocked', 'messages_create', 'reports_create']) assert.ok(sql.includes(policy));
  assert.match(sql, /u\."emailVerified"=true/);
  assert.equal((sql.match(/create policy synera_members_only/g) || []).length, 6);
  assert.equal((sql.match(/security definer/g) || []).length, 2);
  assert.match(sql, /Target is not empty/); assert.match(sql, /No email addresses are seeded/);
  assert.match(checks, /Uninvited user entered pilot/); assert.match(checks, /JWT fixture context unsupported/); assert.ok(checks.trim().endsWith('rollback;'));
  assert.equal(await fs.readFile(new URL('./schema.proposal.sql', import.meta.url), 'utf8'), sql);
  assert.equal(await fs.readFile(new URL('./acceptance.sql', import.meta.url), 'utf8'), checks);
});

test('SYN_SQL_GENERATION_BYTE_PROVEN: case-state migration is additive, generated byte-for-byte, and never assumed applied', async () => {
  const read = file => fs.readFile(new URL('../supabase/' + file, import.meta.url), 'utf8');
  const [source, acceptance, applied] = await Promise.all([read('case-state.proposal.sql'), read('case-state.acceptance.sql'), fs.readFile(new URL('./schema.proposal.sql', import.meta.url), 'utf8')]);
  const sql = generateCaseMigration(source), checks = generateCaseAcceptance(acceptance);
  assert.equal(generateCaseMigration(source), sql); assert.equal(generateCaseAcceptance(acceptance), checks);
  assert.equal(await fs.readFile(new URL('./case-state.migration.sql', import.meta.url), 'utf8'), sql);
  assert.equal(await fs.readFile(new URL('./case-state.acceptance.sql', import.meta.url), 'utf8'), checks);
  // The applied live schema stays frozen history: the case tables never enter it.
  assert.doesNotMatch(applied, /match_case/);
  assert.match(sql, /NOT APPLIED/); assert.match(sql, /Apply neon\/schema\.proposal\.sql first/);
  assert.doesNotMatch(sql, /auth\.users|auth\.uid\(\)/);
  assert.equal((sql.match(/create policy synera_members_only/g) || []).length, 2);
  assert.equal((sql.match(/security definer/g) || []).length, 0);
  for (const policy of ['approvals_create', 'approvals_withdraw', 'cases_unblocked', 'meetings_need_approved_case']) assert.ok(sql.includes(policy), policy);
  assert.match(checks, /Approved on behalf of the other party/); assert.match(checks, /Invitation passed with one approval/);
  assert.ok(checks.trim().endsWith('rollback;')); assert.doesNotMatch(checks, /set local role anon/);
});
