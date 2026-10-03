// Local transport oracle only. It does not execute PostgreSQL, RLS, or real JWTs.
import { randomUUID } from 'node:crypto';
import { handleNeon } from '../../neon/worker.mjs';
import { POLICY_VERSION } from '../../web_launch/pilot-policy.mjs';
import { caseMaterialProblems } from '../../web_launch/business-case.mjs';

export const A = '11111111-1111-4111-8111-111111111111';
export const B = '22222222-2222-4222-8222-222222222222';
export const C = '33333333-3333-4333-8333-333333333333';
export const O = '99999999-9999-4999-8999-999999999999';
export const origin = 'https://synera-fixture.pages.dev';
export const config = { backend: 'neon', pilotSafetyEnabled: true, realPilotEnabled: true, realJourneyEnabled: true };
const instant = () => new Date().toISOString();
export const day = offset => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
export const fields = (overrides = {}) => ({
  starts_on: day(1), due_on: day(7), give_tag: 'automation', take_tag: 'design',
  give_target: 'Один працюючий прототип', take_target: 'Один перевірений екран',
  give_criteria: 'Відкривається й виконує узгоджений сценарій', take_criteria: 'Обидва переглянули екран на телефоні',
  compensation_status: 'agreed_exchange', revision_limit: '1', confidentiality: 'required',
  intellectual_property: 'shared', cancellation: 'mutual_written_notice', ...overrides,
});
function matches(row, params) {
  for (const [key, filter] of params) {
    if (filter.startsWith('eq.') && String(row[key]) !== filter.slice(3)) return false;
    if (filter.startsWith('neq.') && String(row[key]) === filter.slice(4)) return false;
    if (filter === 'is.null' && row[key] !== null) return false;
  }
  return true;
}
export function createFixture() {
  const ids = [A, B, C, O], names = { [A]: 'Тест Андрій', [B]: 'Тест Марія', [C]: 'Тест Олег', [O]: 'Тест сторонній' };
  const profiles = ids.map(id => ({ id, display_name: names[id], city: 'Zürich', offers: '', seeks: '',
    is_discoverable: true, map_visible: false, updated_at: instant(), brief: {
      goal: 'Перевірити один конкретний результат для бізнесу', offer_tags: id === A ? ['automation'] : ['design'],
      need_tags: id === A ? ['design'] : ['automation'], languages: ['uk'], modes: ['exchange'],
      available_from: day(0), available_until: day(21), city_code: 'zurich', remote: true, max_km: 50,
    } }));
  const cases = [], approvals = [], meetings = [], messages = [], requests = [];
  const revoked = new Set(), noConsent = new Set();
  const controls = { beforeCasePatch: null, beforeApproval: null, delayMessages: null };
  const env = { SYNERA_SITE_URL: origin, SYNERA_NEON_AUTH_URL: 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth',
    SYNERA_NEON_DATA_URL: 'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1',
    SYNERA_PILOT_EMAILS: ids.map(id => id + '@example.com').join(','), SYNERA_PILOT_READY: 'true', SYNERA_REAL_JOURNEY_READY: 'true' };
  const owns = (row, id) => [row.participant_low, row.participant_high].includes(id);
  const members = (row, id) => [row.sender_id, row.recipient_id].includes(id);
  const response = rows => Response.json(structuredClone(rows));
  async function upstream(input, init = {}) {
    const url = new URL(input), headers = new Headers(init.headers);
    if (url.pathname.endsWith('/get-session')) {
      const id = headers.get('Cookie')?.split('=').at(-1);
      if (!ids.includes(id) || revoked.has(id)) return Response.json({}, { status: 401 });
      return Response.json({ user: { id, email: id + '@example.com', emailVerified: true }, session: { id: 'fixture' } }, { headers: { 'set-auth-jwt': 'fixture.' + id + '.signature' } });
    }
    if (url.pathname.endsWith('/sign-out')) return Response.json({});
    const id = headers.get('Authorization')?.split('.')[1], method = init.method || 'GET', body = init.body ? JSON.parse(init.body) : {}, table = url.pathname.split('/').at(-1);
    if (!ids.includes(id) || revoked.has(id)) return Response.json({}, { status: 401 });
    if (table === 'pilot_consents') return response(noConsent.has(id) ? [] : [{ policy_version: POLICY_VERSION }]);
    if (noConsent.has(id)) return Response.json({}, { status: 403 });
    if (table === 'profiles') return response(profiles.filter(row => (row.id === id || row.is_discoverable) && matches(row, url.searchParams)));
    if (table === 'match_cases') {
      if (method === 'GET') return response(cases.filter(row => owns(row, id) && matches(row, url.searchParams)));
      if (method === 'POST') {
        if (![body.participant_low, body.participant_high].includes(id)) return Response.json({}, { status: 403 });
        if (cases.some(row => row.status === 'open' && row.participant_low === body.participant_low && row.participant_high === body.participant_high)) return Response.json({}, { status: 409 });
        const row = { ...body, version: 1, status: 'open', created_at: instant(), updated_at: instant(), closed_at: null };
        cases.push(row); return response([row]);
      }
      if (method === 'PATCH') {
        if (controls.beforeCasePatch) { const hook = controls.beforeCasePatch; controls.beforeCasePatch = null; await hook(); }
        const found = cases.filter(row => owns(row, id) && row.status === 'open' && matches(row, url.searchParams));
        for (const row of found) {
          const changed = row.terms_hash !== body.terms_hash;
          Object.assign(row, body, { version: row.version + Number(changed), updated_at: instant() });
        }
        return response(found);
      }
    }
    if (table === 'match_case_approvals') {
      if (method === 'GET') return response(approvals.filter(row => cases.some(c => c.case_id === row.case_id && owns(c, id)) && matches(row, url.searchParams)));
      if (method === 'POST') {
        if (controls.beforeApproval) { const hook = controls.beforeApproval; controls.beforeApproval = null; await hook(); }
        const current = cases.find(row => row.case_id === body.case_id && owns(row, id) && row.status === 'open');
        if (body.party_id !== id || !current || current.version !== body.approved_version || current.terms_hash !== body.approved_terms_hash || Date.parse(current.expires_at) <= Date.now() || caseMaterialProblems(current.material).length) return Response.json({}, { status: 403 });
        if (approvals.some(row => row.case_id === body.case_id && row.party_id === id && row.approved_version === body.approved_version && !row.withdrawn_at)) return Response.json({}, { status: 409 });
        const row = { ...body, approved_at: instant(), withdrawn_at: null }; approvals.push(row); return response([row]);
      }
      if (method === 'PATCH') {
        const found = approvals.filter(row => row.party_id === id && !row.withdrawn_at && matches(row, url.searchParams));
        for (const row of found) row.withdrawn_at = instant(); return response(found);
      }
    }
    if (table === 'meeting_requests') {
      if (method === 'GET') return response(meetings.filter(row => members(row, id) && matches(row, url.searchParams)));
      if (method === 'POST') {
        const [low, high] = [body.sender_id, body.recipient_id].sort();
        const current = cases.find(row => row.status === 'open' && row.participant_low === low && row.participant_high === high);
        if (body.sender_id !== id || !current || ![low, high].every(party => approvals.some(row => row.case_id === current.case_id && row.party_id === party && row.approved_version === current.version && row.approved_terms_hash === current.terms_hash && !row.withdrawn_at))) return Response.json({}, { status: 403 });
        const row = { ...body, id: randomUUID(), status: 'pending', created_at: instant(), sender_name: names[body.sender_id], recipient_name: names[body.recipient_id] };
        meetings.push(row); return response([row]);
      }
      if (method === 'PATCH') {
        const found = meetings.filter(row => row.recipient_id === id && row.status === 'pending' && matches(row, url.searchParams));
        for (const row of found) row.status = body.status; return response(found);
      }
    }
    if (table === 'meeting_messages') {
      const meetingId = method === 'POST' ? body.meeting_id : url.searchParams.get('meeting_id')?.slice(3);
      const meeting = meetings.find(row => row.id === meetingId && row.status === 'accepted' && members(row, id));
      if (!meeting || (method === 'POST' && body.sender_id !== id)) return Response.json({}, { status: 403 });
      if (method === 'GET') {
        if (controls.delayMessages?.id === meetingId) await controls.delayMessages.wait;
        return response(messages.filter(row => row.meeting_id === meetingId));
      }
      if (method === 'POST') { const row = { ...body, id: randomUUID(), created_at: instant() }; messages.push(row); return response([row]); }
    }
    return Response.json({}, { status: 404 });
  }
  const fetchFor = id => async (path, init = {}) => {
    const url = new URL(path, origin), headers = new Headers(init.headers);
    headers.set('Origin', origin); headers.set('Cookie', '__Host-synera-session=' + id);
    const result = await handleNeon(new Request(url, { ...init, headers }), env, upstream);
    requests.push({ actor: id, method: init.method || 'GET', path: url.pathname, status: result.status });
    return result;
  };
  return { profiles, cases, approvals, meetings, messages, requests, revoked, noConsent, controls, fetchFor, env, upstream };
}
