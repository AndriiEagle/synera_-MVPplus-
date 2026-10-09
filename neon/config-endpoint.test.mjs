// Invariant: /config.json always answers with JSON. A misconfigured optional provider closes that option;
// it never throws out of the worker, and it never opens anything.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createNeonWorker } from './worker.mjs';

const origin = 'https://config-fixture.pages.dev';
const good = { SYNERA_SITE_URL: origin, SYNERA_NEON_AUTH_URL: 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth',
  SYNERA_NEON_DATA_URL: 'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1', SYNERA_PILOT_EMAILS: 'fixture@example.com',
  SYNERA_PILOT_READY: 'true', SYNERA_REGISTRATION_ENABLED: 'true', SYNERA_GOOGLE_OAUTH_READY: 'true' };
const config = async env => { const response = await createNeonWorker([]).fetch(new Request(origin + '/config.json'), env); return { status: response.status, body: await response.json() }; };

test('a valid provider configuration advertises Google sign-in with its verified init URL', async () => {
  const { status, body } = await config(good);
  assert.equal(status, 200); assert.equal(body.googleOAuthEnabled, true);
  assert.equal(body.googleOAuthInitUrl, good.SYNERA_NEON_AUTH_URL + '/sign-in/social/init');
});

test('an invalid provider URL closes Google sign-in and still answers the public configuration', async () => {
  for (const change of [{ SYNERA_NEON_AUTH_URL: 'https://bad.example/x' }, { SYNERA_NEON_DATA_URL: 'http://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1' }, { SYNERA_NEON_AUTH_URL: undefined }]) {
    const { status, body } = await config({ ...good, ...change });
    assert.equal(status, 200); assert.equal(body.backend, 'neon');
    assert.equal(body.googleOAuthEnabled, false); assert.equal(body.googleOAuthInitUrl, undefined);
    assert.equal(body.registrationEnabled, true, 'unrelated flags keep their own value');
  }
});
