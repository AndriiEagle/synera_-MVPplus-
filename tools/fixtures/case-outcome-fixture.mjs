// Synthetic RPC transport for browser interaction only. The separate SQL receipt
// is the database oracle; this fixture does not execute RLS or verify a JWT.
import { handleNeon } from '../../neon/worker.mjs';
import { createFixture, origin } from './real-journey-fixture.mjs';

export function createOutcomeFixture() {
  const db = createFixture(), events = [], attempts = [];
  db.env.SYNERA_CASE_OUTCOMES_READY = 'true';
  Object.assign(db.controls, { beforeOutcome: null, nextOutcomeStatus: null });
  const response = (current, body) => {
    const own = events.filter(event => event.case_id === current.case_id && event.payload.version === body.version && event.payload.termsHash === body.termsHash);
    const deliverables = current.material.trial.deliverables.map((leg, index) => {
      const history = own.filter(event => event.index === index), submit = history.find(event => event.kind === 'submit'), check = history.find(event => event.kind === 'check');
      const decision = history.filter(event => ['accept', 'decline'].includes(event.kind)).at(-1);
      return { index, giver_id: leg.giver_id, receiver_id: leg.receiver_id, target: leg.target, acceptance_criteria: leg.acceptance_criteria,
        phase: decision?.kind === 'accept' ? 'accepted' : decision ? 'declined_dispute_open' : check ? 'checked_with_scope' : submit ? 'evidence_supplied' : 'pending',
        evidence_uri: submit?.payload.evidenceUri ?? null, scope_notes: check?.payload.scopeNotes ?? null, reason: decision?.payload.reason ?? null };
    });
    return Response.json({ schema: 'synera.case-outcome.v1', case_id: current.case_id, version: body.version, terms_hash: body.termsHash,
      deliverables, events: own.map(({ case_id, ...event }) => event), outcome_confirmed: deliverables.length > 0 && deliverables.every(row => row.phase === 'accepted'),
      proof_scope: 'participant_attestation', server_now: new Date().toISOString() });
  };
  async function upstream(input, init = {}) {
    const url = new URL(input);
    if (!url.pathname.endsWith('/rpc/synera_case_outcome')) return db.upstream(input, init);
    const actor = new Headers(init.headers).get('Authorization')?.split('.')[1], args = JSON.parse(init.body), body = args.p_payload;
    attempts.push({ actor, case_id: args.p_case_id, body: structuredClone(body) });
    if (db.controls.beforeOutcome) await db.controls.beforeOutcome(body);
    if (db.controls.nextOutcomeStatus) { const status = db.controls.nextOutcomeStatus; db.controls.nextOutcomeStatus = null; return Response.json({}, { status }); }
    const current = db.cases.find(row => row.case_id === args.p_case_id);
    if (!current || ![current.participant_low, current.participant_high].includes(actor) || db.revoked.has(actor) || db.noConsent.has(actor)) return Response.json({}, { status: 403 });
    if (body.version !== current.version || body.termsHash !== current.terms_hash) return Response.json({}, { status: 409 });
    if (body.action === 'state') return response(current, body);
    const approval = db.approvals.filter(row => row.case_id === current.case_id && row.approved_version === current.version && row.approved_terms_hash === current.terms_hash && !row.withdrawn_at);
    const leg = current.material.trial.deliverables[body.index];
    if (current.status !== 'open' || Date.parse(current.expires_at) <= Date.now() || new Set(approval.map(row => row.party_id)).size !== 2) return Response.json({}, { status: 409 });
    if (!leg || actor !== (body.action === 'submit' ? leg.giver_id : leg.receiver_id)) return Response.json({}, { status: 403 });
    const prior = events.find(row => row.actor_id === actor && row.payload.intentId === body.intentId);
    if (prior) return prior.case_id === current.case_id && JSON.stringify(prior.payload) === JSON.stringify(body) ? response(current, body) : Response.json({}, { status: 409 });
    const own = events.filter(row => row.case_id === current.case_id && row.payload.version === body.version && row.payload.termsHash === body.termsHash && row.index === body.index);
    const decision = own.filter(row => ['accept', 'decline'].includes(row.kind)).at(-1)?.kind;
    if (decision === 'accept' || (body.action === 'submit' && own.some(row => row.kind === 'submit')) ||
        (body.action === 'check' && (!own.some(row => row.kind === 'submit') || own.some(row => row.kind === 'check'))) ||
        (body.action === 'accept' && !own.some(row => row.kind === 'check')) || (body.action === 'decline' && decision === 'decline')) return Response.json({}, { status: 409 });
    events.push({ case_id: current.case_id, id: events.length + 1, index: body.index, kind: body.action, actor_id: actor, created_at: new Date().toISOString(), payload: structuredClone(body) });
    return response(current, body);
  }
  const fetchFor = actor => async (input, init = {}) => {
    const url = new URL(input, origin), headers = new Headers(init.headers);
    headers.set('Origin', origin); headers.set('Cookie', '__Host-synera-session=' + actor);
    const result = await handleNeon(new Request(url, { ...init, headers }), db.env, upstream);
    db.requests.push({ actor, method: init.method || 'GET', path: url.pathname, status: result.status });
    return result;
  };
  return { ...db, events, attempts, fetchFor };
}
