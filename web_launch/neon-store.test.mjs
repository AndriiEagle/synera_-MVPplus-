import test from 'node:test';
import assert from 'node:assert/strict';
import { NeonStore } from './neon-store.mjs';
import { ServiceError } from './profile-store.mjs';

test('Google start remains unavailable until a browser-domain-safe contract exists', () => {
  const prior = globalThis.window, seen = [];
  globalThis.window = { location: { assign: value => seen.push(value) } };
  try {
    const disabled = new NeonStore({ backend: 'neon', googleOAuthEnabled: false }, async () => new Response());
    assert.throws(() => disabled.beginGoogleSignIn(), error => error instanceof ServiceError && error.status === 503);
    const legacyEnabled = new NeonStore({ backend: 'neon', googleOAuthEnabled: true }, async () => new Response());
    assert.throws(() => legacyEnabled.beginGoogleSignIn(), error => error instanceof ServiceError && error.status === 503);
    assert.deepEqual(seen, []);
  } finally { globalThis.window = prior; }
});
