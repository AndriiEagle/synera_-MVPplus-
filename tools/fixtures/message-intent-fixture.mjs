// Synthetic HTTP oracle. Real SQL/RLS/concurrent persistence is tested separately.
import { handleNeon } from '../../neon/worker.mjs';
import { createFixture, origin } from './real-journey-fixture.mjs';
export function createMessageFixture() {
  const db = createFixture(), writes = [];
  const upstream = async (url, init) => {
    if (!url.endsWith('/rpc/synera_send_message')) return db.upstream(url, init);
    const actor = new Headers(init.headers).get('Authorization')?.split('.')[1];
    const { p_meeting_id, p_intent_id, p_body } = JSON.parse(init.body);
    writes.push({ actor, meeting: p_meeting_id, intent: p_intent_id, body: p_body });
    const meeting = db.meetings.find(row => row.id === p_meeting_id && row.status === 'accepted' && [row.sender_id, row.recipient_id].includes(actor));
    if (!meeting || db.revoked.has(actor) || db.noConsent.has(actor)) return Response.json({}, { status: 403 });
    const old = db.messages.find(row => row.id === p_intent_id);
    if (old && (old.sender_id !== actor || old.meeting_id !== p_meeting_id || old.body !== p_body)) return Response.json({}, { status: 409 });
    const row = old || { id: p_intent_id, meeting_id: p_meeting_id, sender_id: actor, body: p_body, created_at: new Date().toISOString() };
    if (!old) db.messages.push(row);
    return Response.json(row);
  };
  const fetchFor = actor => async (path, init = {}) => {
    const headers = new Headers(init.headers); headers.set('Origin', origin); headers.set('Cookie', '__Host-synera-session=' + actor);
    return handleNeon(new Request(new URL(path, origin), { ...init, headers }), { ...db.env, SYNERA_MESSAGE_INTENTS_READY: 'true' }, upstream);
  };
  return { ...db, writes, fetchFor };
}
