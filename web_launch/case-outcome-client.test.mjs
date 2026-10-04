import test from 'node:test';
import assert from 'node:assert/strict';
import { RealJourneyStore, exchangeMaterial, JourneyConflict } from './real-journey-client.mjs';
import { A, B, O, origin, config, fields, createFixture } from '../tools/fixtures/real-journey-fixture.mjs';

// A synthetic response contract, not PostgreSQL, RLS, JWT or execution evidence.
function responseFor(reviewed, events = []) {
  const deliverables = reviewed.material.trial.deliverables.map((leg, index) => {
    const own = events.filter(event => event.index === index);
    const submit = own.find(event => event.kind === 'submit'), check = own.find(event => event.kind === 'check');
    const decision = own.filter(event => ['accept', 'decline'].includes(event.kind)).at(-1);
    return { index, giver_id: leg.giver_id, receiver_id: leg.receiver_id, target: leg.target, acceptance_criteria: leg.acceptance_criteria,
      phase: decision?.kind === 'accept' ? 'accepted' : decision ? 'declined_dispute_open' : check ? 'checked_with_scope' : submit ? 'evidence_supplied' : 'pending',
      evidence_uri: submit?.payload.evidenceUri ?? null, scope_notes: check?.payload.scopeNotes ?? null, reason: decision?.payload.reason ?? null };
  });
  return { schema: 'synera.case-outcome.v1', case_id: reviewed.caseId, version: reviewed.version, terms_hash: reviewed.termsHash,
    deliverables, events, outcome_confirmed: deliverables.length > 0 && deliverables.every(row => row.phase === 'accepted'),
    proof_scope: 'participant_attestation', server_now: new Date().toISOString() };
}
function history(reviewed, indices = [0, 1]) {
  const events = [];
  for (const index of indices) for (const kind of ['submit', 'check', 'accept']) {
    const leg = reviewed.material.trial.deliverables[index];
    const payload = { action: kind, version: reviewed.version, termsHash: reviewed.termsHash, index, intentId: crypto.randomUUID(),
      ...(kind === 'submit' ? { evidenceUri: 'https://example.com/доказ × Zürich 💛 <script>literal</script>' } : {}),
      ...(kind === 'check' ? { scopeNotes: 'Перевірено погоджений сценарій × Zürich 💛' } : {}) };
    events.push({ id: events.length + 1, index, kind, actor_id: kind === 'submit' ? leg.giver_id : leg.receiver_id, created_at: new Date().toISOString(), payload });
  }
  return events;
}
async function setup(enabled = true) {
  const db = createFixture(), calls = [], controls = { reply: null, beforeReply: null, actor: A };
  const fetch = async (path, init) => {
    if (!String(path).startsWith('/api/neon/outcomes/')) return db.fetchFor(controls.actor)(path, init);
    calls.push({ path, init, body: JSON.parse(init.body) });
    if (controls.beforeReply) await controls.beforeReply();
    return controls.reply instanceof Response ? controls.reply : Response.json(controls.reply);
  };
  const a = new RealJourneyStore({ ...config, caseOutcomesEnabled: enabled }, fetch);
  const b = new RealJourneyStore(config, db.fetchFor(B));
  await a.dashboard(); await b.dashboard();
  let reviewed = await a.saveTerms(B, exchangeMaterial(A, B, fields()));
  await a.approveTerms(B, reviewed); reviewed = await b.approveTerms(A, reviewed);
  controls.reply = responseFor(reviewed);
  return { db, a, b, reviewed, calls, controls };
}

test('outcome reads preserve both pending legs; one acceptance cannot confirm the whole collaboration', async () => {
  const { a, reviewed, controls, calls } = await setup();
  let result = await a.outcomeState(B, reviewed);
  assert.equal(result.outcome_confirmed, false);
  assert.deepEqual(result.deliverables.map(row => row.phase), ['pending', 'pending']);
  controls.reply = responseFor(reviewed, history(reviewed, [0]));
  result = await a.outcomeState(B, reviewed);
  assert.equal(result.outcome_confirmed, false);
  assert.deepEqual(result.deliverables.map(row => row.phase), ['accepted', 'pending']);
  controls.reply = responseFor(reviewed, history(reviewed));
  assert.equal((await a.outcomeState(B, reviewed)).outcome_confirmed, true);
  assert.ok(calls.every(row => row.body.action === 'state'));
});

test('rollout remains closed without the outcome flag and leaves existing case behaviour intact', async () => {
  const { a, reviewed, calls } = await setup(false);
  await assert.rejects(a.outcomeState(B, reviewed), error => error.status === 503);
  await assert.rejects(a.recordOutcome(B, reviewed, { action: 'accept', index: 0, intentId: crypto.randomUUID() }), error => error.status === 503);
  assert.equal(calls.length, 0);
  assert.equal((await a.pairState(B)).status, 'approved_for_next_step');
});

test('an explicit write keeps its original retry intent and only acknowledges the actor-bound server event', async () => {
  const { a, reviewed, controls, calls } = await setup();
  const index = reviewed.material.trial.deliverables.findIndex(leg => leg.giver_id === A);
  const event = history(reviewed, [index])[0];
  const intent = { action: 'submit', index, intentId: event.payload.intentId, evidenceUri: event.payload.evidenceUri };
  controls.reply = responseFor(reviewed, [event]);
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await a.recordOutcome(B, reviewed, intent);
    assert.equal(result.events.length, 1);
    assert.equal(result.deliverables[index].evidence_uri, intent.evidenceUri);
    assert.equal(result.outcome_confirmed, false);
  }
  assert.deepEqual(calls[0].body, { ...intent, version: reviewed.version, termsHash: reviewed.termsHash });
  assert.deepEqual(calls[1].body, calls[0].body);
  assert.equal(calls[0].path, '/api/neon/outcomes/' + reviewed.caseId);
  assert.equal(calls[0].init.credentials, 'same-origin'); assert.equal(calls[0].init.cache, 'no-store');
  assert.equal(calls[0].init.headers['X-Synera-Client'], '1');
  assert.equal(calls[0].init.headers.Authorization, undefined);
  controls.reply = responseFor(reviewed);
  await assert.rejects(a.recordOutcome(B, reviewed, intent), error => error.status === 502);
});

test('receiver checks, neutral disputes and a later explicit acceptance retain the complete event history', async () => {
  const { a, reviewed, controls } = await setup();
  const index = reviewed.material.trial.deliverables.findIndex(leg => leg.receiver_id === A);
  const events = history(reviewed, [index]);
  controls.reply = responseFor(reviewed, events.slice(0, 2));
  const check = events[1].payload;
  assert.equal((await a.recordOutcome(B, reviewed, { action: 'check', index, intentId: check.intentId, scopeNotes: check.scopeNotes })).deliverables[index].phase, 'checked_with_scope');
  const decline = { id: 3, index, kind: 'decline', actor_id: A, created_at: new Date().toISOString(),
    payload: { action: 'decline', version: reviewed.version, termsHash: reviewed.termsHash, index, intentId: crypto.randomUUID(), reason: 'outside_agreed_scope' } };
  controls.reply = responseFor(reviewed, [...events.slice(0, 2), decline]);
  const dispute = await a.recordOutcome(B, reviewed, { action: 'decline', index, intentId: decline.payload.intentId, reason: decline.payload.reason });
  assert.equal(dispute.deliverables[index].phase, 'declined_dispute_open'); assert.equal(dispute.outcome_confirmed, false);
  const accept = { ...events[2], id: 4, created_at: new Date().toISOString() };
  controls.reply = responseFor(reviewed, [...events.slice(0, 2), decline, accept]);
  const resolved = await a.recordOutcome(B, reviewed, { action: 'accept', index, intentId: accept.payload.intentId });
  assert.equal(resolved.deliverables[index].phase, 'accepted');
  assert.equal(resolved.events.find(row => row.kind === 'decline').payload.reason, 'outside_agreed_scope');
  assert.equal(resolved.deliverables[index].reason, null); assert.equal(resolved.outcome_confirmed, false);
});

test('wrong roles, unknown actions and forged fields cause no outcome write', async () => {
  const { a, reviewed, calls } = await setup();
  const own = reviewed.material.trial.deliverables.findIndex(leg => leg.giver_id === A);
  const received = reviewed.material.trial.deliverables.findIndex(leg => leg.receiver_id === A);
  for (const action of ['accept', 'check', 'decline']) {
    await assert.rejects(a.recordOutcome(B, reviewed, { action, index: own, intentId: crypto.randomUUID(),
      ...(action === 'check' ? { scopeNotes: 'Scope' } : {}), ...(action === 'decline' ? { reason: 'other' } : {}) }), error => error.status === 403);
  }
  await assert.rejects(a.recordOutcome(B, reviewed, { action: 'submit', index: received, intentId: crypto.randomUUID(), evidenceUri: 'Evidence' }), error => error.status === 403);
  for (const extra of [{ actor_id: A }, { created_at: new Date().toISOString() }, { evidenceUri: 'irrelevant' }]) {
    await assert.rejects(a.recordOutcome(B, reviewed, { action: 'accept', index: received, intentId: crypto.randomUUID(), ...extra }), error => error.status === 400);
  }
  for (const action of ['state', 'automatically_accept', 'constructor', '__proto__']) {
    await assert.rejects(a.recordOutcome(B, reviewed, { action }), error => error.status === 400);
  }
  assert.equal(calls.length, 0);
});

test('a malformed or foreign response cannot promote a collaboration to confirmed', async () => {
  const { a, reviewed, controls } = await setup();
  const mutations = [
    value => { value.outcome_confirmed = true; value.events = []; },
    value => { value.case_id = 'another-case'; },
    value => { value.version++; },
    value => { value.terms_hash = 'f'.repeat(64); },
    value => { value.proof_scope = 'independently_verified'; },
    value => { value.deliverables[0].receiver_id = O; },
    value => { value.deliverables[0].target = 'Different result'; },
    value => { value.deliverables[1].index = 0; },
    value => { value.deliverables.pop(); },
    value => { value.deliverables[0].scope_notes = 'Not in the history'; },
    value => { value.events[2].actor_id = value.deliverables[0].giver_id; },
    value => { value.events.splice(1, 1); },
    value => { value.events[1].payload.termsHash = 'f'.repeat(64); },
    value => { value.events[1].payload.actor_id = A; },
    value => { value.events[1].id = value.events[0].id; },
    value => { value.events[2].payload.intentId = value.events[1].payload.intentId; },
    value => { value.events[0].created_at = 'not-an-instant'; },
  ];
  for (const mutate of mutations) {
    controls.reply = responseFor(reviewed, history(reviewed)); mutate(controls.reply);
    await assert.rejects(a.outcomeState(B, reviewed), error => error.status === 502);
  }
});

test('PostgreSQL transaction-start server_now is not treated as a wall-clock upper bound on prior committed events', async () => {
  const { a, reviewed, controls } = await setup();
  controls.reply = responseFor(reviewed, history(reviewed));
  // A read transaction can start before a writer, then wait on its case lock.
  // now() stays at read transaction start even after that writer commits.
  controls.reply.server_now = new Date(Date.parse(controls.reply.events[0].created_at) - 500).toISOString();
  assert.equal((await a.outcomeState(B, reviewed)).outcome_confirmed, true);
});

test('old reviewed terms and terms revised while the response travels never return an attestation', async () => {
  const { db, a, b, reviewed, controls, calls } = await setup();
  const material = exchangeMaterial(A, B, fields({ take_target: 'Нова незалежна редакція' }));
  controls.beforeReply = async () => { await b.saveTerms(A, material, reviewed); };
  await assert.rejects(a.outcomeState(B, reviewed), JourneyConflict);
  assert.equal(calls.length, 1);
  controls.beforeReply = null;
  await assert.rejects(a.outcomeState(B, reviewed), JourneyConflict);
  assert.equal(calls.length, 1);
  assert.equal(db.cases[0].material.trial.deliverables.find(row => row.giver_id === B).target, 'Нова незалежна редакція');
});

test('late private outcome responses are discarded after logout, same-account restore or another-account restore', async () => {
  for (const next of ['logout', 'same', 'other']) {
    const { a, reviewed, controls } = await setup();
    let release, reached;
    const wait = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { reached = resolve; });
    controls.beforeReply = async () => { reached(); await wait; };
    const pending = a.outcomeState(B, reviewed);
    const rejected = assert.rejects(pending, error => error.status === 401);
    await started; await a.signOut();
    if (next !== 'logout') { controls.actor = next === 'other' ? B : A; await a.restore(); }
    release(); await rejected;
    assert.equal(a.user?.id ?? null, next === 'logout' ? null : next === 'other' ? B : A);
  }
});

test('server session, consent and write-conflict failures remain failures and never manufacture a result', async () => {
  for (const status of [401, 403, 409, 429, 503]) {
    const { a, reviewed, controls } = await setup();
    controls.reply = Response.json({ error: 'fixture_refusal' }, { status });
    await assert.rejects(a.outcomeState(B, reviewed), error => error.status === status);
    if (status === 401) assert.equal(a.user, null);
  }
});
