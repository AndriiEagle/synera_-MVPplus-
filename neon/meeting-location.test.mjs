import test from 'node:test';
import assert from 'node:assert/strict';
import { handleNeon, createNeonWorker } from './worker.mjs';
import fs from 'node:fs/promises';
import { generateLocationMigration, generateLocationAcceptance } from './generate-schema.mjs';

const origin = 'https://synera-test.pages.dev';
const meeting = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const actor = '11111111-1111-4111-8111-111111111111';
const peer = '22222222-2222-4222-8222-222222222222';
const now = Date.now();
const grant = { schema: 'synera.location-grant.v1', id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', meeting_id: meeting,
  grantor_id: actor, recipient_id: peer, precision: 'approximate', radius_m: 500, lead_minutes: 15,
  opens_at: new Date(now - 60000).toISOString(), closes_at: new Date(now + 600000).toISOString(), status: 'active', sample_seq: 1 };
const env = { SYNERA_SITE_URL: origin, SYNERA_NEON_AUTH_URL: 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth',
  SYNERA_NEON_DATA_URL: 'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1', SYNERA_PILOT_EMAILS: 'pilot@example.com',
  SYNERA_PILOT_READY: 'true', SYNERA_LOCATION_READY: 'true' };
const request = (action, body = {}) => new Request(`${origin}/api/neon/location/${meeting}/${action}`, { method: 'POST',
  headers: { 'X-Synera-Client': '1', Origin: origin, 'Content-Type': 'application/json', Cookie: '__Host-synera-session=fixture' }, body: JSON.stringify(body) });
function fixture(access = { eligible: true, own: grant, peer: null, server_now: new Date().toISOString() }) {
  const values = new Map(), writes = [], calls = [];
  const kv = { async get(key) { return values.get(key) ?? null; }, async put(key, value, options) { writes.push({ key, value, options }); values.set(key, JSON.parse(value)); }, async delete(key) { values.delete(key); } };
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/get-session')) return Response.json({ user: { id: actor, email: 'pilot@example.com', emailVerified: true }, session: { id: 's' } }, { headers: { 'Set-Auth-Jwt': 'a.b.c' } });
    if (url.endsWith('/rpc/synera_location_access')) return Response.json(access);
    if (url.endsWith('/rpc/synera_location_sample')) return Response.json({ grant, server_now: new Date().toISOString() });
    if (url.endsWith('/rpc/synera_location_grant')) return Response.json(grant);
    if (url.endsWith('/rpc/synera_location_revoke')) return Response.json({ ...grant, status: 'revoked' });
    throw new Error('Unexpected upstream');
  };
  return { kv, values, writes, calls, fetchImpl, settings: { ...env, SYNERA_LOCATION_EPHEMERAL: kv } };
}

test('persisted consent and latest position travel through verified session, coarsening and an absolute expiry', async () => {
  const f = fixture();
  const consent = await handleNeon(request('grant', { precision: 'approximate', leadMinutes: 15, consent: true, intentId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }), f.settings, f.fetchImpl);
  assert.equal(consent.status, 200);
  const sent = await handleNeon(request('sample', { lat: 47.37691, lon: 8.54172, accuracyM: 12 }), f.settings, f.fetchImpl);
  assert.equal(sent.status, 200);
  assert.equal(f.writes.length, 1);
  const saved = JSON.parse(f.writes[0].value);
  assert.ok(Math.abs(saved.lat - 47.375) < 1e-8);
  assert.ok(Math.abs(saved.lon - 8.54) < 1e-8);
  assert.equal(f.writes[0].options.expiration, Math.floor(Date.parse(grant.closes_at) / 1000));
  assert.ok(f.calls.filter(c => c.url.includes('/rpc/')).every(c => c.init.headers.Authorization === 'Bearer a.b.c'));
  assert.ok(!f.calls.some(c => c.init.body?.includes('47.37691')), 'coordinates never enter the database');
});

test('no binding, missing consent, forgery and revoked authority cannot store or reveal a position', async () => {
  const f = fixture({ eligible: false, own: null, peer: null, server_now: new Date().toISOString() });
  assert.equal((await handleNeon(request('sample', { lat: 47, lon: 8 }), env, f.fetchImpl)).status, 503);
  assert.equal((await handleNeon(request('grant', { consent: false, precision: 'exact', leadMinutes: 15 }), f.settings, f.fetchImpl)).status, 400);
  assert.equal((await handleNeon(request('sample', { lat: 47, lon: 8, grantor_id: peer }), f.settings, f.fetchImpl)).status, 400);
  const response = await handleNeon(request('view'), f.settings, f.fetchImpl);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).peer, null);
  assert.equal(f.writes.length, 0);
});

test('permission policy and public feature flag require reviewed rollout and ephemeral binding together', async () => {
  const worker = createNeonWorker([]), f = fixture();
  for (const [settings, ready] of [[env, false], [f.settings, true], [{ ...f.settings, SYNERA_LOCATION_READY: 'false' }, false]]) {
    const response = await worker.fetch(new Request(origin + '/config.json'), settings);
    assert.equal((await response.json()).liveLocationEnabled, ready);
    assert.ok(response.headers.get('Permissions-Policy').includes(ready ? 'geolocation=(self)' : 'geolocation=()'));
  }
});

test('a delayed older KV write cannot make an older position visible as the latest admitted position', async () => {
  const peerGrant = { ...grant, grantor_id: peer, recipient_id: actor, sample_seq: 2 };
  const f = fixture({ eligible: true, own: null, peer: peerGrant, server_now: new Date().toISOString() });
  // Simulate write 1 completing after write 2. Authoritative sequence is 2.
  f.values.set('synera:location:v1:' + peerGrant.id, { lat: 47.375, lon: 8.54, accuracy_m: 10, at: new Date().toISOString(), seq: 1 });
  const response = await handleNeon(request('view'), f.settings, f.fetchImpl);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).peer.sample, null);
  f.values.set('synera:location:v1:' + peerGrant.id, { lat: 47.38, lon: 8.55, accuracy_m: 10, at: new Date(Date.now()-100).toISOString(), seq: 2 });
  const current = await handleNeon(request('view'), f.settings, f.fetchImpl);
  assert.ok(Math.abs((await current.json()).peer.sample.lat - 47.38) < 1e-8);
});

test('a revocation during the KV read is rechecked before disclosing any coordinates', async () => {
  let authority = { eligible: true, own: null, peer: { ...grant, grantor_id: peer, recipient_id: actor }, server_now: new Date().toISOString() };
  const f = fixture(authority);
  const original = f.fetchImpl;
  f.fetchImpl = async (url, init) => url.endsWith('/rpc/synera_location_access') ? Response.json(authority) : original(url, init);
  f.kv.get = async () => { authority = { ...authority, peer: null }; return { lat: 47, lon: 8, accuracy_m: 10, seq: 1, at: new Date().toISOString() }; };
  const response = await handleNeon(request('view'), f.settings, f.fetchImpl);
  assert.equal((await response.json()).peer, null);
});

test('location SQL generation is byte-proven and leaves the applied base schema untouched', async () => {
  const read = file => fs.readFile(new URL(file, import.meta.url), 'utf8');
  assert.equal(await read('./meeting-location.migration.sql'), generateLocationMigration(await read('../supabase/meeting-location.proposal.sql')));
  assert.equal(await read('./meeting-location.acceptance.sql'), generateLocationAcceptance(await read('../supabase/meeting-location.acceptance.sql')));
  assert.doesNotMatch(await read('./schema.proposal.sql'), /meeting_location_grants|location_consent_intents/);
});
