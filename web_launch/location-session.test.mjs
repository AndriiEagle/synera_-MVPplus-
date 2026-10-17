import test from 'node:test';
import assert from 'node:assert/strict';
import { LocationSession } from './location-session.mjs';
const actor = '11111111-1111-4111-8111-111111111111';
function fixture() {
  let now = Date.parse('2026-10-02T12:00:00.000Z'), success, failure, own = null;
  const calls = [], stopped = [], timers = [];
  const grant = { schema: 'synera.location-grant.v1', id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', meeting_id: 'm1', grantor_id: actor,
    recipient_id: 'peer', precision: 'approximate', radius_m: 500, status: 'active', opens_at: new Date(now-60000).toISOString(), closes_at: new Date(now+600000).toISOString() };
  const store = { user: { id: actor },
    async locationState() { calls.push('view'); return { eligible: true, own, peer: null, server_now: new Date(now).toISOString() }; },
    async grantLocation(id, options) { calls.push(['grant', options]); own = grant; },
    async publishLocation(id, sample) { calls.push(['sample', sample]); return { sample: { ...sample, at: new Date(now).toISOString() } }; },
    async revokeLocation() { calls.push('revoke'); own = null; } };
  const geolocation = { watchPosition(ok, bad) { calls.push('watch'); success = ok; failure = bad; return 1; }, clearWatch(id) { stopped.push(id); } };
  const session = new LocationSession({ store, geolocation, now: () => now, setTimer: fn => { timers.push(fn); return timers.length; }, clearTimer() {} });
  return { session, store, calls, stopped, timers, grant, success: (...args) => success(...args), failure: () => failure(), advance: ms => { now += ms; } };
}
const position = { coords: { latitude: 47.37691, longitude: 8.54172, accuracy: 12 } };

test('GPS starts only after explicit persisted consent; coordinates are rounded before transport', async () => {
  const f = fixture();
  assert.deepEqual(f.calls, []);
  await assert.rejects(f.session.grant('m1', { consent: false }), /згода/);
  assert.deepEqual(f.calls, []);
  await f.session.grant('m1', { consent: true, precision: 'approximate', leadMinutes: 15 });
  assert.equal(f.calls[0][0], 'grant'); assert.match(f.calls[0][1].intentId, /^[a-f0-9-]{36}$/);
  assert.ok(f.calls.indexOf('watch') > f.calls.indexOf('view'));
  await f.success(position);
  const samples = () => f.calls.filter(c => c[0] === 'sample');
  assert.ok(Math.abs(samples()[0][1].lat - 47.375) < 1e-8); assert.ok(Math.abs(samples()[0][1].lon - 8.54) < 1e-8);
  await f.success(position); assert.equal(samples().length, 1);
  f.advance(20000); await f.success(position); assert.equal(samples().length, 2);
  await f.session.revoke('m1'); await f.success(position);
  assert.equal(samples().length, 2); assert.deepEqual(f.stopped, [1]); assert.equal(f.session.state('m1').own, null);
});

test('expiry timer, hidden-tab pause, cancellation, denial and logout stop device capture', async () => {
  for (const mode of ['expiry','hidden','cancel','denied','logout']) {
    const f = fixture(); await f.session.grant('m1', { consent: true });
    if (mode === 'expiry') f.timers[0]();
    if (mode === 'hidden') f.session.pauseAll();
    if (mode === 'cancel') f.session.retain([{ id: 'm1', status: 'cancelled' }]);
    if (mode === 'denied') f.failure();
    if (mode === 'logout') f.session.clear();
    await f.success(position);
    assert.deepEqual(f.stopped, [1], mode); assert.ok(!f.calls.some(c => c[0] === 'sample'), mode);
  }
});

test('a failed authority refresh erases the peer position and cannot leave GPS running', async () => {
  const f = fixture(); await f.session.grant('m1', { consent: true });
  f.session.emit('m1', { peer: { sample: position } });
  f.store.locationState = async () => { throw new Error('offline'); };
  await assert.rejects(f.session.refresh('m1'), /offline/);
  assert.equal(f.session.state('m1').peer, null); assert.deepEqual(f.stopped, [1]);
});

test('a delayed pre-revocation refresh cannot restore old coordinates in the UI', async () => {
  const f = fixture(); await f.session.grant('m1', { consent: true });
  const original = f.store.locationState; let release;
  f.store.locationState = () => new Promise(resolve => { release = resolve; });
  const pending = f.session.refresh('m1');
  f.store.locationState = original;
  await f.session.revoke('m1');
  release({ eligible: true, own: f.grant, peer: { sample: position }, server_now: '2026-10-02T12:00:00.000Z' });
  await pending;
  assert.equal(f.session.state('m1').own, null); assert.equal(f.session.state('m1').peer, null);
});
