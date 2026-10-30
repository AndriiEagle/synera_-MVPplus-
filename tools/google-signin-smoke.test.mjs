import test from 'node:test';
import assert from 'node:assert/strict';
import { googleSigninSmoke } from './google-signin-smoke.mjs';

const origin = 'https://synera-test.pages.dev';
const clientId = '123-demo.apps.googleusercontent.com';
const init = 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth/sign-in/social/init';
const callback = 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth/callback/google';
const config = { backend: 'neon', registrationEnabled: true, googleOauthReady: true, googleOAuthEnabled: true, pilotSafetyEnabled: true, realPilotEnabled: true, googleOAuthClientId: clientId, googleOAuthInitUrl: init };
function fixture({ settings = config, bridge = init + '?token=opaque-init-0123456789', googleClient = clientId, provider = 'https://accounts.google.com/o/oauth2/v2/auth', redirectUri = callback, providerStatus = 302 } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push(url);
    assert.equal(options.redirect, 'manual'); assert.equal(options.credentials, 'omit');
    if (url === origin + '/config.json') return Response.json(settings);
    if (url === origin + '/api/neon/oauth/google/start') return new Response(null, { status: 303, headers: { location: bridge } });
    assert.equal(url, init + '?token=opaque-init-0123456789', 'No arbitrary host or Google login page may be fetched');
    const google = new URL(provider);
    for (const [key, value] of Object.entries({ client_id: googleClient, redirect_uri: redirectUri, response_type: 'code', state: 'fixture-state' })) google.searchParams.set(key, value);
    return new Response(null, { status: providerStatus, headers: { location: google.href } });
  };
  return { calls, fetchImpl };
}
test('smoke checks exact Google client through Neon and stops before the Google login page', async () => {
  const { calls, fetchImpl } = fixture();
  assert.deepEqual(await googleSigninSmoke({ origin, fetchImpl }), { status: 'PASS_REDIRECT_ONLY', origin, clientId, providerCallback: callback, redirectHops: 2, signedIn: false });
  assert.equal(calls.length, 3);
});
test('closed flags and missing or mismatched client pin never start OAuth', async () => {
  for (const settings of [{ ...config, googleOauthReady: false }, { ...config, registrationEnabled: false }, { ...config, googleOAuthClientId: '' }]) {
    const { calls, fetchImpl } = fixture({ settings });
    await assert.rejects(googleSigninSmoke({ origin, fetchImpl })); assert.equal(calls.length, 1);
  }
  const { calls, fetchImpl } = fixture();
  await assert.rejects(googleSigninSmoke({ origin, clientId: 'other.apps.googleusercontent.com', fetchImpl })); assert.equal(calls.length, 1);
});
test('wrong clients, provider failures and unsafe redirects fail without visiting Google', async () => {
  for (const options of [{ googleClient: 'wrong.apps.googleusercontent.com' }, { provider: 'https://accounts.google.com.evil.example/o/oauth2/v2/auth' }, { redirectUri: 'https://evil.example/callback' }, { providerStatus: 200 }, { bridge: 'https://evil.example/init?token=opaque-init-0123456789' }]) {
    const { calls, fetchImpl } = fixture(options);
    await assert.rejects(googleSigninSmoke({ origin, fetchImpl })); assert.ok(calls.length <= 3);
  }
});
