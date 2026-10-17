import { recordLocationSample, LOCATION_SCHEMA } from '../web_launch/live-location.mjs';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
const invalid = () => reply({ error: 'location_invalid', status: 400 }, 400);
const key = grant => 'synera:location:v1:' + grant.id;
export function locationReady(env) {
  return env.SYNERA_PILOT_READY === 'true' && env.SYNERA_LOCATION_READY === 'true' &&
    ['get', 'put', 'delete'].every(method => typeof env.SYNERA_LOCATION_EPHEMERAL?.[method] === 'function');
}
function normalized(grant) {
  if (!grant) return null;
  if (!uuid(grant.id) || grant.schema !== LOCATION_SCHEMA) throw new Error('Invalid location authority');
  return { ...grant, opens_at: new Date(grant.opens_at).toISOString(), closes_at: new Date(grant.closes_at).toISOString(), sample: null };
}

// Postgres owns identity, consent and access. KV holds only the latest coarsened
// sample, with absolute deletion at the grant's end. Never authorize from KV.
export async function handleMeetingLocation(request, env, session, rpc) {
  if (!locationReady(env)) return reply({ error: 'location_unavailable', status: 503 }, 503);
  const url = new URL(request.url), match = url.pathname.match(/^\/api\/neon\/location\/([^/]+)\/(grant|sample|view|revoke)$/);
  if (request.method !== 'POST' || url.search || !match || !uuid(match[1])) return reply({ error: 'not_found', status: 404 }, 404);
  const [, meetingId, action] = match;
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 1024) return invalid();
  let body;
  try { body = JSON.parse(raw); } catch { return invalid(); }
  const fields = { grant: ['precision', 'leadMinutes', 'consent', 'intentId'], sample: ['lat', 'lon', 'accuracyM'], view: [], revoke: [] }[action];
  if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).some(name => !fields.includes(name))) return invalid();
  const args = { p_meeting_id: meetingId }, kv = env.SYNERA_LOCATION_EPHEMERAL;
  if (action === 'grant') {
    if (!uuid(body.intentId) || body.consent !== true || !['approximate', 'exact'].includes(body.precision) || ![15, 30].includes(body.leadMinutes)) return invalid();
    const previous = await rpc('synera_location_access', args);
    const grant = normalized(await rpc('synera_location_grant', { ...args, p_precision: body.precision, p_lead_minutes: body.leadMinutes, p_consent: true, p_intent_id: body.intentId }));
    if (previous.own && previous.own.id !== grant.id) await kv.delete(key(previous.own));
    return reply({ grant });
  }
  if (action === 'revoke') {
    const grant = normalized(await rpc('synera_location_revoke', args));
    // The database revocation already stops disclosure even if KV is unavailable.
    if (grant) await kv.delete(key(grant));
    return reply({ grant });
  }
  if (action === 'sample' && (![body.lat, body.lon].every(Number.isFinite) || Math.abs(body.lat)>90 || Math.abs(body.lon)>180 ||
    (body.accuracyM!==undefined && (!Number.isFinite(body.accuracyM)||body.accuracyM<0||body.accuracyM>100000)))) return invalid();
  const access = action === 'sample' ? await rpc('synera_location_sample', args).then(data => ({ eligible: true, own: data.grant, peer: null, server_now: data.server_now })) : await rpc('synera_location_access', args);
  const at = new Date(access.server_now).toISOString();
  const own = access.eligible ? normalized(access.own) : null, peer = access.eligible ? normalized(access.peer) : null;
  if (action === 'sample') {
    if (!own || own.grantor_id !== session.user.id || own.status !== 'active') return reply({ error: 'location_forbidden', status: 403 }, 403);
    const expiration = Math.floor(Date.parse(own.closes_at) / 1000);
    // KV requires at least 60 seconds. Never prolong permission to satisfy TTL.
    if (at < own.opens_at || expiration - Math.ceil(Math.max(Date.parse(at), Date.now()) / 1000) < 60) return reply({ error: 'location_window_closed', status: 409 }, 409);
    const updated = recordLocationSample(own, { partyId: session.user.id, ...body, at });
    await kv.put(key(own), JSON.stringify({ ...updated.sample, seq: own.sample_seq }), { expiration });
    return reply({ sample: updated.sample, server_now: at });
  }
  async function withSample(grant) {
    if (!grant || grant.status !== 'active' || at < grant.opens_at || at >= grant.closes_at) return grant;
    const sample = await kv.get(key(grant), { type: 'json' });
    if (!sample || sample.seq !== grant.sample_seq || !Number.isFinite(Date.parse(sample.at)) || sample.at < grant.opens_at || sample.at > at || sample.at >= grant.closes_at) return grant;
    return recordLocationSample(grant, { partyId: grant.grantor_id, lat: sample.lat, lon: sample.lon, accuracyM: sample.accuracy_m, at: sample.at });
  }
  const ownWithSample = await withSample(own), peerWithSample = await withSample(peer);
  // Recheck after the KV read: an in-flight view cannot retain authority across
  // a concurrent revocation or return an older admitted sequence.
  const current = await rpc('synera_location_access', args);
  const stillCurrent = (value, latest) => value && latest && value.id === latest.id && value.sample_seq === latest.sample_seq ? value : null;
  return reply({ eligible: current.eligible === true, own: current.eligible ? stillCurrent(ownWithSample, current.own) : null,
    peer: current.eligible ? stillCurrent(peerWithSample, current.peer) : null, meeting: current.meeting ?? null, server_now: current.server_now });
}
