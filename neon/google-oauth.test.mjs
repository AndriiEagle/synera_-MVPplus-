import test from 'node:test';
import assert from 'node:assert/strict';
import { handleGoogleOAuth } from './google-oauth.mjs';
import { POLICY_VERSION } from '../web_launch/pilot-policy.mjs';

const origin = 'https://synera-test.pages.dev';
const endpoints = { origin, auth: 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth' };
const env = { SYNERA_PILOT_READY: 'true', SYNERA_REGISTRATION_ENABLED: 'true', SYNERA_GOOGLE_OAUTH_READY: 'true', SYNERA_GOOGLE_OAUTH_ENABLED: 'true' };
const allowed = new Set(['pilot@example.com']);
const challengeName = '__Secure-neon-auth.session_challenge';
const sessionName = '__Secure-neon-auth.session_token';
const request = (path, { method = 'GET', body, headers = {} } = {}) => new Request(origin + path, {
  method,
  headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const consent = { policy_version: POLICY_VERSION, terms_accepted: true, privacy_acknowledged: true, demo_only: false };
const cookies = response => response.headers.getSetCookie();
const localChallenge = response => cookies(response).find(value => /^__Host-synera-google-challenge=[^;]/.test(value));
const responseWithCookies = (body, values, status = 200) => {
  const headers = new Headers();
  for (const value of values) headers.append('Set-Cookie', value);
  return new Response(JSON.stringify(body), { status, headers });
};
const googleInit = new URL(endpoints.auth + '/sign-in/social/init?token=opaque-init-token-0123456789');

test('Google OAuth bridges an explicit-consent start and callback without exposing provider values', async () => {
  const calls = [];
  const start = await handleGoogleOAuth(request('/api/neon/oauth/google/start', { method: 'POST', body: { consent } }), env, endpoints, allowed, async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ url: googleInit.href }), { headers: { 'Set-Cookie': `${challengeName}=challenge-value; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=None` } });
  });
  assert.equal(start.status, 200);
  assert.deepEqual(await start.json(), { url: googleInit.href });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, endpoints.auth + '/sign-in/social');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.Origin, origin);
  assert.equal(calls[0].init.headers['X-Neon-Auth-Middleware'], 'true');
  assert.deepEqual(JSON.parse(calls[0].init.body), { provider: 'google', callbackURL: origin + '/api/neon/oauth/google/callback', errorCallbackURL: origin + '/', disableRedirect: true });
  assert.match(localChallenge(start), /HttpOnly; SameSite=Lax/);
  assert.doesNotMatch(JSON.stringify([...start.headers]), /challenge-value/);

  const callbackCalls = [];
  const callback = await handleGoogleOAuth(request('/api/neon/oauth/google/callback?neon_auth_session_verifier=verifier-0123456789', {
    headers: { Cookie: localChallenge(start).split(';')[0], 'Sec-Fetch-Site': 'cross-site' },
  }), env, endpoints, allowed, async (url, init) => {
    callbackCalls.push({ url, init });
    return new Response(JSON.stringify({ session: { id: 'session-id' }, user: { id: 'user-a', email: 'pilot@example.com', emailVerified: true } }), {
      headers: { 'Set-Cookie': `${sessionName}=provider-session; Path=/; HttpOnly; Secure; SameSite=None` },
    });
  });
  assert.equal(callback.status, 303);
  assert.equal(callback.headers.get('location'), origin + '/');
  assert.ok(cookies(callback).some(value => /__Host-synera-session=provider-session/.test(value)));
  assert.ok(cookies(callback).some(value => /__Host-synera-google-challenge=;.*Max-Age=0/.test(value)));
  assert.equal(callbackCalls.length, 1);
  assert.equal(callbackCalls[0].url, endpoints.auth + '/get-session?neon_auth_session_verifier=verifier-0123456789');
  assert.equal(callbackCalls[0].init.method, 'GET');
  assert.equal(callbackCalls[0].init.headers.Cookie, `${challengeName}=challenge-value`);
  assert.equal(callbackCalls[0].init.headers['X-Neon-Auth-Middleware'], 'true');
});

test('Google OAuth rejects missing consent and unsafe upstream start responses without retaining a challenge', async () => {
  for (const { body, expected, expectedCalls, upstream } of [
    { body: {}, expected: 400, expectedCalls: 0, upstream: async () => new Response('must not fetch') },
    { body: { consent, padding: 'x'.repeat(4096) }, expected: 413, expectedCalls: 0, upstream: async () => new Response('must not fetch') },
    { body: { consent }, expected: 503, expectedCalls: 1, upstream: async () => new Response(JSON.stringify({ url: 'https://accounts.google.com/o/oauth2/v2/auth?state=opaque-state' }), { headers: { 'Set-Cookie': `${challengeName}=challenge; Path=/; Max-Age=600; HttpOnly; Secure` } }) },
    { body: { consent }, expected: 503, expectedCalls: 1, upstream: async () => responseWithCookies({ url: googleInit.href }, [`${challengeName}=a; Path=/; Max-Age=600; HttpOnly; Secure`, `${challengeName}=b; Path=/; Max-Age=600; HttpOnly; Secure`]) },
  ]) {
    let calls = 0;
    const response = await handleGoogleOAuth(request('/api/neon/oauth/google/start', { method: 'POST', body }), env, endpoints, allowed, async (...args) => { calls++; return upstream(...args); });
    assert.equal(response.status, expected);
    assert.equal(calls, expectedCalls);
    assert.equal(localChallenge(response), undefined);
  }
});

test('Google callback clears the challenge on malformed, duplicate, crossed or denied inputs', async () => {
  const encoded = btoa(JSON.stringify({ name: challengeName, value: 'challenge-value' }));
  const cookie = `__Host-synera-google-challenge=${encoded}`;
  const cases = [
    { path: '/api/neon/oauth/google/callback', cookie, expected: 400, expectedCalls: 0, upstream: async () => new Response('must not fetch') },
    { path: '/api/neon/oauth/google/callback?neon_auth_session_verifier=a&neon_auth_session_verifier=b', cookie, expected: 400, expectedCalls: 0, upstream: async () => new Response('must not fetch') },
    { path: '/api/neon/oauth/google/callback?neon_auth_session_verifier=verifier-0123456789', cookie: cookie + '; ' + cookie, expected: 400, expectedCalls: 0, upstream: async () => new Response('must not fetch') },
    { path: '/api/neon/oauth/google/callback?neon_auth_session_verifier=verifier-0123456789', cookie, expected: 401, expectedCalls: 1, upstream: async () => responseWithCookies({ session: { id: 's' }, user: { id: 'not-allowed', email: 'other@example.com', emailVerified: true } }, [`${sessionName}=provider-session; Path=/; HttpOnly; Secure`]) },
    { path: '/api/neon/oauth/google/callback?neon_auth_session_verifier=verifier-0123456789', cookie, expected: 503, expectedCalls: 1, upstream: async () => responseWithCookies({ session: { id: 's' }, user: { id: 'user-a', email: 'pilot@example.com', emailVerified: true } }, [`${sessionName}=one; Path=/; HttpOnly; Secure`, `${sessionName}=two; Path=/; HttpOnly; Secure`]) },
    { path: '/api/neon/oauth/google/callback?neon_auth_session_verifier=crossed-verifier-0123456789', cookie, expected: 401, expectedCalls: 1, upstream: async () => new Response('provider says mismatched', { status: 401 }) },
  ];
  for (const entry of cases) {
    let calls = 0;
    const response = await handleGoogleOAuth(request(entry.path, { headers: { Cookie: entry.cookie } }), env, endpoints, allowed, async (...args) => { calls++; return entry.upstream(...args); });
    assert.equal(response.status, entry.expected);
    assert.equal(calls, entry.expectedCalls);
    assert.match(response.headers.get('set-cookie') || '', /__Host-synera-google-challenge=;.*Max-Age=0/);
    assert.doesNotMatch(await response.text(), /verifier|provider-session|other@example/);
  }
});

test('legacy challenge receives a distinct local cookie name and legacy flag alone stays closed', async () => {
  const legacy = '__Secure-neon-auth.session_challange';
  const response = await handleGoogleOAuth(request('/api/neon/oauth/google/start', { method: 'POST', body: { consent } }), env, endpoints, allowed,
    async () => responseWithCookies({ url: googleInit.href }, [`${legacy}=legacy-value; Path=/; Max-Age=300; HttpOnly; Secure` ]));
  assert.equal(response.status, 200);
  assert.match(cookies(response).join('\n'), /__Host-synera-google-challange=/);
  const disabled = await handleGoogleOAuth(request('/api/neon/oauth/google/start', { method: 'POST', body: { consent } }),
    { ...env, SYNERA_GOOGLE_OAUTH_READY: 'false' }, endpoints, allowed, async () => { throw new Error('must not fetch'); });
  assert.equal(disabled.status, 404);
});
