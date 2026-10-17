// GEO-01 — meeting-bound live location grant. Pure contract: no browser API, no network, no storage.
// Each participant decides alone (no forced reciprocity); a grant names exactly one recipient, has a
// visible window and precision, keeps only the latest sample and is closed by revocation, cancellation
// or expiry. Live GPS capture stays off in this release: Permissions-Policy geolocation=() is unchanged.
export const LOCATION_SCHEMA = 'synera.location-grant.v1';
export const LOCATION_PRECISIONS = Object.freeze({ approximate: 500, exact: 50 });
export const LOCATION_LEAD_MINUTES = Object.freeze([15, 30]);
export const STALE_AFTER_SECONDS = 120;
const ONLINE_PLACES = new Set(['онлайн', 'online']);
const validInstant = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);
const isOnline = place => ONLINE_PLACES.has(String(place ?? '').trim().toLocaleLowerCase());
const addMinutes = (iso, minutes) => new Date(Date.parse(iso) + minutes * 60000).toISOString();

export function locationEligibility(meeting) {
  if (!meeting || meeting.status !== 'accepted') return { eligible: false, reason: 'MEETING_NOT_ACCEPTED' };
  if (!meeting.proposed_at || !Number.isFinite(Date.parse(meeting.proposed_at))) return { eligible: false, reason: 'MEETING_TIME_MISSING' };
  if (!meeting.meeting_place || isOnline(meeting.meeting_place)) return { eligible: false, reason: 'ONLINE_MEETING' };
  return { eligible: true, reason: null };
}

export function createLocationGrant({ meeting, grantorId, precision, leadMinutes, consent, now }) {
  const eligibility = locationEligibility(meeting);
  if (!eligibility.eligible) throw new Error('Місце не можна показувати: ' + eligibility.reason);
  if (consent !== true) throw new Error('Потрібна власна явна згода цієї сторони');
  const participants = [meeting.sender_id, meeting.recipient_id];
  if (!validId(grantorId) || !participants.includes(grantorId) || participants[0] === participants[1]) throw new Error('Дозвіл може дати лише учасник цієї зустрічі');
  if (!Object.hasOwn(LOCATION_PRECISIONS, precision) || !LOCATION_LEAD_MINUTES.includes(leadMinutes) || !validInstant(now)) throw new Error('Некоректна точність, вікно або час');
  const startsAt = new Date(Date.parse(meeting.proposed_at)).toISOString();
  const closesAt = addMinutes(startsAt, Number.isFinite(meeting.duration_minutes) && meeting.duration_minutes > 0 ? Math.min(meeting.duration_minutes, 240) : 60);
  if (now >= closesAt) throw new Error('Зустріч уже завершилась');
  return Object.freeze({
    schema: LOCATION_SCHEMA, meeting_id: meeting.id, grantor_id: grantorId,
    recipient_id: participants.find(id => id !== grantorId),
    precision, radius_m: LOCATION_PRECISIONS[precision], lead_minutes: leadMinutes,
    opens_at: addMinutes(startsAt, -leadMinutes), closes_at: closesAt, granted_at: now,
    status: 'active', sample: null,
  });
}

// Coarsens the position to the chosen precision before it is kept: approximate ≈ 0.005° grid.
function coarsen(value, precision) {
  const step = precision === 'approximate' ? 0.005 : 0.0005;
  return Math.round(value / step) * step;
}

export function recordLocationSample(grant, { partyId, lat, lon, accuracyM, at }) {
  if (grant?.schema !== LOCATION_SCHEMA) throw new Error('Некоректний дозвіл');
  if (partyId !== grant.grantor_id) throw new Error('Позицію надсилає лише сторона, що дала дозвіл');
  if (grant.status !== 'active') throw new Error('Дозвіл закрито');
  if (!validInstant(at) || at < grant.opens_at || at >= grant.closes_at) throw new Error('Поза вікном дозволу');
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error('Некоректні координати');
  const accuracy = Number.isFinite(accuracyM) && accuracyM > 0 ? Math.round(accuracyM) : null;
  // Minimization: only the latest coarsened sample survives; earlier samples are not kept anywhere.
  return Object.freeze({ ...grant, sample: Object.freeze({ lat: coarsen(lat, grant.precision), lon: coarsen(lon, grant.precision), accuracy_m: accuracy, at }) });
}

export function revokeLocationGrant(grant, { partyId, at }) {
  if (grant?.schema !== LOCATION_SCHEMA) throw new Error('Некоректний дозвіл');
  if (partyId !== grant.grantor_id) throw new Error('Відкликати може лише сторона, що дала дозвіл');
  if (!validInstant(at)) throw new Error('Некоректний час');
  return Object.freeze({ ...grant, status: 'revoked', closed_at: at, sample: null });
}

// Meeting cancelled/declined/over → the grant closes and the last position is dropped.
export function closeLocationGrantForMeeting(grant, meeting, at) {
  if (grant?.schema !== LOCATION_SCHEMA || grant.status !== 'active') return grant;
  if (!validInstant(at)) throw new Error('Некоректний час');
  if (meeting?.id === grant.meeting_id && meeting.status === 'accepted' && at < grant.closes_at) return grant;
  return Object.freeze({ ...grant, status: 'closed', closed_at: at, sample: null });
}

export function viewLocation(grant, { viewerId, now }) {
  if (grant?.schema !== LOCATION_SCHEMA || !validInstant(now)) return { visible: false, reason: 'INVALID' };
  const own = viewerId === grant.grantor_id;
  if (!own && viewerId !== grant.recipient_id) return { visible: false, reason: 'NOT_RECIPIENT' };
  if (grant.status === 'revoked') return { visible: false, reason: 'REVOKED', own };
  if (grant.status === 'closed') return { visible: false, reason: 'MEETING_CLOSED', own };
  if (now >= grant.closes_at) return { visible: false, reason: 'EXPIRED', own };
  if (now < grant.opens_at) return { visible: false, reason: 'NOT_YET_OPEN', own, opens_at: grant.opens_at };
  if (!grant.sample) return { visible: false, reason: 'NO_SAMPLE', own };
  const ageSeconds = Math.max(0, Math.round((Date.parse(now) - Date.parse(grant.sample.at)) / 1000));
  const radius = Math.max(grant.radius_m, grant.sample.accuracy_m ?? 0);
  return {
    visible: true, own, lat: grant.sample.lat, lon: grant.sample.lon, radius_m: radius, age_seconds: ageSeconds,
    stale: ageSeconds > STALE_AFTER_SECONDS,
    accuracy_label: grant.sample.accuracy_m === null ? 'точність пристрою невідома' : 'точність ~' + radius + ' м',
  };
}

// Static navigation needs no GPS and no SDK: an external Google Maps search link for the agreed place,
// opened only by the person's own click.
export function staticNavigationUrl(place) {
  const destination = String(place ?? '').trim();
  if (!destination || isOnline(destination)) return null;
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(destination);
}

// Device location stays with Google Maps; Synera supplies only the agreed destination.
export function meetingDirectionsUrl(place) {
  const search = staticNavigationUrl(place);
  if (!search) return null;
  const url = new URL('https://www.google.com/maps/dir/');
  url.search = new URLSearchParams({ api: '1', destination: new URL(search).searchParams.get('query'), travelmode: 'walking', dir_action: 'navigate' }).toString();
  return url.href;
}
