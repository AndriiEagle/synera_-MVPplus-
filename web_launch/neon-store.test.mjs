import test from 'node:test';
import assert from 'node:assert/strict';
import { NeonStore } from './neon-store.mjs';
import { ServiceError } from './profile-store.mjs';

test('Google start is explicitly enabled and only navigates to the same-origin gateway', () => {
  const prior = globalThis.window, seen = [];
  globalThis.window = { location: { assign: value => seen.push(value) } };
  try {
    const disabled = new NeonStore({ backend: 'neon', googleOAuthEnabled: false }, async () => new Response());
    assert.throws(() => disabled.beginGoogleSignIn(), error => error instanceof ServiceError && error.status === 503);
    const enabled = new NeonStore({ backend: 'neon', googleOAuthEnabled: true }, async () => new Response());
    enabled.beginGoogleSignIn();
    assert.deepEqual(seen, ['/api/neon/oauth/google/start']);
  } finally { globalThis.window = prior; }
});
