import test from 'node:test';
import assert from 'node:assert/strict';
import { NeonStore } from './neon-store.mjs';
import { ServiceError } from './profile-store.mjs';
import { consentRecord } from './pilot-policy.mjs';

const neonInit = 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth/sign-in/social/init';

test('Google start requires readiness and consent before requesting or redirecting', async () => {
  const prior = globalThis.window, seen = [];
  globalThis.window = { location: { assign: value => seen.push(value) } };
  try {
    const disabled = new NeonStore({ backend: 'neon', googleOAuthEnabled: false }, async () => new Response());
    await assert.rejects(disabled.beginGoogleSignIn(), error => error instanceof ServiceError && error.status === 503);
    const calls = [];
    const enabled = new NeonStore({ backend: 'neon', googleOAuthEnabled: true, googleOAuthInitUrl: neonInit, pilotSafetyEnabled: true, realPilotEnabled: true }, async (...args) => {
      calls.push(args); return Response.json({ url: neonInit + '?token=opaque-init-token-0123456789' });
    });
    await assert.rejects(enabled.beginGoogleSignIn({ terms: true, privacy: false }));
    assert.deepEqual(seen, []);
    assert.equal(calls.length, 0);
    await enabled.beginGoogleSignIn({ terms: true, privacy: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], '/api/neon/oauth/google/start');
    assert.equal(calls[0][1].method, 'POST');
    assert.equal(calls[0][1].credentials, 'same-origin');
    assert.deepEqual(JSON.parse(calls[0][1].body), { consent: consentRecord({ terms: true, privacy: true }) });
    assert.deepEqual(seen, [neonInit + '?token=opaque-init-token-0123456789']);
  } finally { globalThis.window = prior; }
});

test('Google start never redirects on upstream failure or an unexpected destination', async () => {
  const prior = globalThis.window, seen = [];
  globalThis.window = { location: { assign: value => seen.push(value) } };
  try {
    for (const response of [Response.json({ url: 'https://evil.example/' }), Response.json({ url: 'https://accounts.google.com/o/oauth2/v2/auth?token=opaque-init-token-0123456789' }), Response.json({ error: 'unavailable' }, { status: 503 })]) {
      const store = new NeonStore({ backend: 'neon', googleOAuthEnabled: true, googleOAuthInitUrl: neonInit, pilotSafetyEnabled: true, realPilotEnabled: true }, async () => response);
      await assert.rejects(store.beginGoogleSignIn({ terms: true, privacy: true }));
    }
    assert.deepEqual(seen, []);
  } finally { globalThis.window = prior; }
});
