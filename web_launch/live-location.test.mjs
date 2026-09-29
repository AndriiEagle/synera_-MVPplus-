// GEO-01 — synthetic two sessions + an outsider. No browser geolocation, no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createLocationGrant, recordLocationSample, revokeLocationGrant, closeLocationGrantForMeeting,
  viewLocation, locationEligibility, staticNavigationUrl, STALE_AFTER_SECONDS,
} from './live-location.mjs';

const A = 'u-anna', B = 'u-ben', OUTSIDER = 'u-outsider';
const meeting = (overrides = {}) => ({ id: 'm-1', sender_id: A, recipient_id: B, status: 'accepted', proposed_at: '2026-10-02T14:00:00.000Z', duration_minutes: 30, meeting_place: 'Zürich', ...overrides });
const grantFromA = (overrides = {}) => createLocationGrant({ meeting: meeting(), grantorId: A, precision: 'approximate', leadMinutes: 30, consent: true, now: '2026-10-02T10:00:00.000Z', ...overrides });
const inWindow = '2026-10-02T13:45:00.000Z';

test('GEO-01: grant needs own explicit consent, an accepted in-person meeting and a participant', () => {
  assert.throws(() => grantFromA({ consent: false }), /згода/);
  assert.throws(() => grantFromA({ grantorId: OUTSIDER }), /учасник/);
  assert.throws(() => createLocationGrant({ meeting: meeting({ status: 'pending' }), grantorId: A, precision: 'approximate', leadMinutes: 30, consent: true, now: '2026-10-02T10:00:00.000Z' }), /MEETING_NOT_ACCEPTED/);
  assert.throws(() => createLocationGrant({ meeting: meeting({ meeting_place: 'Онлайн' }), grantorId: A, precision: 'approximate', leadMinutes: 30, consent: true, now: '2026-10-02T10:00:00.000Z' }), /ONLINE_MEETING/);
  assert.throws(() => grantFromA({ precision: 'street' }), /точність/);
  assert.throws(() => grantFromA({ leadMinutes: 120 }), /вікно/);
  assert.equal(locationEligibility(meeting()).eligible, true);
});

test('GEO-01: the grant names exactly one recipient with a visible window and precision', () => {
  const grant = grantFromA();
  assert.equal(grant.recipient_id, B);
  assert.equal(grant.opens_at, '2026-10-02T13:30:00.000Z');
  assert.equal(grant.closes_at, '2026-10-02T14:30:00.000Z');
  assert.equal(grant.radius_m, 500);
});

test('GEO-01: no forced reciprocity — A sharing never makes B visible', () => {
  const grant = recordLocationSample(grantFromA(), { partyId: A, lat: 47.3769, lon: 8.5417, accuracyM: 20, at: inWindow });
  assert.equal(viewLocation(grant, { viewerId: B, now: inWindow }).visible, true);
  assert.throws(() => recordLocationSample(grant, { partyId: B, lat: 47.1, lon: 8.1, accuracyM: 10, at: inWindow }), /лише сторона/);
});

test('GEO-01: outsider isolation — a non-recipient sees nothing, not even status details', () => {
  const grant = recordLocationSample(grantFromA(), { partyId: A, lat: 47.3769, lon: 8.5417, accuracyM: 20, at: inWindow });
  const view = viewLocation(grant, { viewerId: OUTSIDER, now: inWindow });
  assert.deepEqual(view, { visible: false, reason: 'NOT_RECIPIENT' });
});

test('GEO-01: approximate precision coarsens the stored point and reports an honest radius', () => {
  const grant = recordLocationSample(grantFromA(), { partyId: A, lat: 47.376912, lon: 8.541694, accuracyM: 20, at: inWindow });
  assert.notEqual(grant.sample.lat, 47.376912);
  assert.ok(Math.abs(grant.sample.lat - 47.376912) <= 0.0025 + 1e-9);
  const view = viewLocation(grant, { viewerId: B, now: inWindow });
  assert.equal(view.radius_m, 500);
  const blurry = recordLocationSample(grantFromA({ precision: 'exact' }), { partyId: A, lat: 47.37, lon: 8.54, accuracyM: 900, at: inWindow });
  assert.equal(viewLocation(blurry, { viewerId: B, now: inWindow }).radius_m, 900, 'device inaccuracy is never hidden behind the chosen precision');
});

test('GEO-01: only the latest sample is kept (minimization)', () => {
  let grant = recordLocationSample(grantFromA({ precision: 'exact' }), { partyId: A, lat: 47.30, lon: 8.50, accuracyM: 10, at: inWindow });
  grant = recordLocationSample(grant, { partyId: A, lat: 47.40, lon: 8.60, accuracyM: 10, at: '2026-10-02T13:50:00.000Z' });
  assert.ok(!JSON.stringify(grant).includes('47.3'));
  assert.equal(Object.keys(grant.sample).sort().join(','), 'accuracy_m,at,lat,lon');
});

test('GEO-01: window, staleness and expiry are enforced', () => {
  assert.throws(() => recordLocationSample(grantFromA(), { partyId: A, lat: 47.37, lon: 8.54, accuracyM: 10, at: '2026-10-02T13:00:00.000Z' }), /вікном/);
  assert.equal(viewLocation(grantFromA(), { viewerId: B, now: '2026-10-02T13:00:00.000Z' }).reason, 'NOT_YET_OPEN');
  const grant = recordLocationSample(grantFromA(), { partyId: A, lat: 47.37, lon: 8.54, accuracyM: 10, at: inWindow });
  const later = new Date(Date.parse(inWindow) + (STALE_AFTER_SECONDS + 1) * 1000).toISOString();
  assert.equal(viewLocation(grant, { viewerId: B, now: later }).stale, true);
  assert.equal(viewLocation(grant, { viewerId: B, now: '2026-10-02T14:30:00.000Z' }).reason, 'EXPIRED');
});

test('GEO-01: revocation and meeting cancellation drop the position immediately', () => {
  const grant = recordLocationSample(grantFromA(), { partyId: A, lat: 47.37, lon: 8.54, accuracyM: 10, at: inWindow });
  assert.throws(() => revokeLocationGrant(grant, { partyId: B, at: inWindow }), /лише сторона/);
  const revoked = revokeLocationGrant(grant, { partyId: A, at: inWindow });
  assert.equal(revoked.sample, null);
  assert.equal(viewLocation(revoked, { viewerId: B, now: inWindow }).reason, 'REVOKED');
  assert.throws(() => recordLocationSample(revoked, { partyId: A, lat: 47.37, lon: 8.54, accuracyM: 10, at: inWindow }), /закрито/);
  const cancelled = closeLocationGrantForMeeting(grant, meeting({ status: 'cancelled' }), inWindow);
  assert.equal(cancelled.sample, null);
  assert.equal(viewLocation(cancelled, { viewerId: B, now: inWindow }).reason, 'MEETING_CLOSED');
  assert.equal(closeLocationGrantForMeeting(grant, meeting(), inWindow), grant, 'still-accepted meeting keeps the grant');
});

test('GEO-01: static navigation works without GPS; online meetings get no map link', () => {
  assert.equal(staticNavigationUrl('Zürich'), 'https://www.google.com/maps/search/?api=1&query=Z%C3%BCrich%2C%20Switzerland');
  assert.equal(staticNavigationUrl('Онлайн'), null);
});

test('GEO-01: this release does not open browser geolocation (header stays geolocation=())', () => {
  for (const file of ['web_launch/config.mjs', 'neon/worker.mjs']) assert.match(readFileSync(file, 'utf8'), /geolocation=\(\)/);
  const source = readFileSync('web_launch/live-location.mjs', 'utf8') + readFileSync('web_launch/app.mjs', 'utf8');
  assert.equal(/navigator\.geolocation|watchPosition|getCurrentPosition/.test(source), false);
});
