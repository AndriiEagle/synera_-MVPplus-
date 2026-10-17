import test from 'node:test';
import assert from 'node:assert/strict';
import { RealJourneyStore, exchangeMaterial, JourneyConflict } from './real-journey-client.mjs';
import { A, B, C, config, fields, createFixture } from '../tools/fixtures/real-journey-fixture.mjs';

// Held-out transport histories. These are not execution of SQL or signed JWTs.
const ADDRESS = 'Limmatquai 12, Zürich — вхід 💛';
function event(review, kind, actor, proposal = crypto.randomUUID(), id = 1, address = ADDRESS) {
  return { id, case_id: review.caseId, version: review.version, terms_hash: review.termsHash,
    actor_id: actor, kind, proposal_id: proposal, address: kind === 'propose' ? address : null, created_at: new Date().toISOString() };
}
async function setup(enabled = true) {
  const db = createFixture(), calls = [];
  const controls = { actor: A, events: [], beforeReply: null, nextEvents: null, transform: null, error: 0, current: true };
  let reviewed, meeting;
  const reply = () => {
    const latest = controls.events.filter(e => e.kind === 'propose').at(-1);
    const decision = controls.events.find(e => e.proposal_id === latest?.proposal_id && e.kind !== 'propose')?.kind ?? null;
    const proposal = latest ? { proposal_id: latest.proposal_id, proposer_id: latest.actor_id, address: latest.address,
      current: controls.current, decision } : null;
    const data = { schema: 'synera.meeting-address.v1', meeting_id: meeting.id, case_id: reviewed.caseId,
      version: reviewed.version, terms_hash: reviewed.termsHash, server_now: new Date().toISOString(),
      meeting: { proposed_at: meeting.proposed_at, duration_minutes: meeting.duration_minutes,
        meeting_place: meeting.meeting_place, meeting_address: meeting.meeting_address, status: meeting.status },
      proposal, events: structuredClone(controls.events), agreed: Boolean(proposal?.current && decision === 'accept' && meeting.meeting_address === proposal.address) };
    return controls.transform ? controls.transform(data) : data;
  };
  const fetch = async (path, init) => {
    if (!String(path).startsWith('/api/neon/meeting-address/')) {
      const response = await db.fetchFor(controls.actor)(path, init);
      // Real Data API omits columns not requested; GPS must stay closed here.
      if (String(path).startsWith('/api/neon/data/meeting_requests?') && init.method === 'GET') {
        const rows = await response.json(); for (const row of rows) delete row.meeting_address;
        return Response.json(rows, { status: response.status });
      }
      return response;
    }
    const body = JSON.parse(init.body); calls.push({ path, init, body });
    if (controls.error) return Response.json({ error: 'fixture_denial' }, { status: controls.error });
    if (body.action !== 'state' && controls.nextEvents) {
      controls.events = structuredClone(controls.nextEvents);
      if (body.action === 'accept') meeting.meeting_address = controls.events.find(e => e.kind === 'propose' && e.proposal_id === body.proposalId)?.address;
    }
    const data = structuredClone(reply());
    if (controls.beforeReply) await controls.beforeReply(body);
    return Response.json(data);
  };
  const a = new RealJourneyStore({ ...config, meetingAddressEnabled: enabled }, fetch);
  const b = new RealJourneyStore(config, db.fetchFor(B));
  await a.dashboard(); await b.dashboard();
  reviewed = await a.saveTerms(B, exchangeMaterial(A, B, fields()));
  await a.approveTerms(B, reviewed); reviewed = await b.approveTerms(A, reviewed);
  await a.sendInvitation(B, 'Погодимо місце', { proposed_at: new Date(Date.now() + 7200000).toISOString(), duration_minutes: 30, meeting_place: 'Zürich' });
  meeting = db.meetings[0]; await b.respondInvitation(meeting.id, 'accepted'); meeting.meeting_address = '';
  return { db, a, b, reviewed, meeting, controls, calls };
}
const state = x => x.a.meetingAddressState(B, x.meeting.id, x.reviewed);
const write = (x, selected, intent) => x.a.recordMeetingAddress(B, x.meeting.id, x.reviewed, selected, intent);

test('address state retains pending and bilateral history without enabling GPS or treating a proposal as acceptance', async () => {
  const x = await setup(); let result = await state(x);
  assert.equal(result.proposal, null); assert.equal(result.agreed, false);
  const proposal = event(x.reviewed, 'propose', B);
  x.controls.events = [proposal]; result = await state(x);
  assert.equal(result.proposal.address, ADDRESS); assert.equal(result.agreed, false);
  x.controls.events.push(event(x.reviewed, 'accept', A, proposal.proposal_id, 2)); x.meeting.meeting_address = ADDRESS;
  result = await state(x); assert.equal(result.agreed, true); assert.equal(result.events.length, 2);
  assert.ok(x.calls.every(c => c.body.action === 'state')); assert.equal(x.a.liveLocationEnabled, false);
  x.controls.events[0].version = 1; x.controls.events[1].version = 1;
  x.controls.events[0].case_id = 'prior-case'; x.controls.events[1].case_id = 'prior-case'; x.controls.current = false;
  assert.equal((await state(x)).agreed, false);
});

test('closed address rollout makes no private requests and preserves the existing case', async () => {
  const x = await setup(false), before = x.db.requests.length;
  await assert.rejects(state(x), e => e.status === 503);
  await assert.rejects(write(x, null, { action: 'accept' }), e => e.status === 503);
  assert.equal(x.calls.length, 0); assert.equal(x.db.requests.length, before);
  assert.equal((await x.a.pairState(B)).status, 'approved_for_next_step');
});

test('explicit proposal and recipient decisions send exact reviewed IDs and original retry intent through cookie transport', async () => {
  for (const action of ['propose', 'accept', 'decline']) {
    const x = await setup(), intentId = crypto.randomUUID();
    if (action !== 'propose') x.controls.events = [event(x.reviewed, 'propose', B)];
    const selected = await state(x), proposalId = selected.proposal?.proposal_id ?? null;
    const intent = { action, intentId, ...(action === 'propose' ? { address: ADDRESS, consent: true } : action === 'accept' ? { consent: true } : {}) };
    x.controls.nextEvents = action === 'propose' ? [event(x.reviewed, action, A, intentId)] :
      [...x.controls.events, event(x.reviewed, action, A, proposalId, 2)];
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await write(x, selected, intent);
      assert.equal(result.agreed, action === 'accept');
    }
    const writes = x.calls.filter(c => c.body.action !== 'state'); assert.equal(writes.length, 2);
    assert.deepEqual(writes[0].body, { ...intent, proposalId, version: x.reviewed.version, termsHash: x.reviewed.termsHash });
    assert.deepEqual(writes[1].body, writes[0].body);
    assert.equal(writes[0].path, '/api/neon/meeting-address/' + x.meeting.id + '/' + x.reviewed.caseId);
    assert.equal(writes[0].init.credentials, 'same-origin'); assert.equal(writes[0].init.cache, 'no-store');
    assert.equal(writes[0].init.headers.Authorization, undefined);
  }
});

test('implicit consent, forged fields, self-acceptance and stale selection cannot cause an address write', async () => {
  const x = await setup(); x.controls.events = [event(x.reviewed, 'propose', A)]; const selected = await state(x);
  for (const intent of [ { action: 'accept', intentId: crypto.randomUUID(), consent: true }, { action: 'decline', intentId: crypto.randomUUID() } ])
    await assert.rejects(write(x, selected, intent), e => e.status === 403);
  for (const intent of [ { action: 'state' }, { action: 'propose', intentId: crypto.randomUUID(), address: ADDRESS },
    { action: 'accept', intentId: crypto.randomUUID(), consent: true, proposalId: crypto.randomUUID() },
    { action: 'propose', intentId: crypto.randomUUID(), address: ADDRESS, consent: true, actor_id: B } ])
    await assert.rejects(write(x, selected, intent), e => e.status === 400);
  x.controls.events.push(event(x.reviewed, 'propose', B, crypto.randomUUID(), 2, 'Інша адреса'));
  await assert.rejects(write(x, selected, { action: 'propose', intentId: crypto.randomUUID(), address: ADDRESS, consent: true }), e => e instanceof JourneyConflict);
  assert.equal(x.calls.filter(c => c.body.action !== 'state').length, 0);
});

test('malformed actor-bound address history and invented agreement are rejected', async () => {
  const x = await setup(), proposal = event(x.reviewed, 'propose', B);
  x.controls.events = [proposal, event(x.reviewed, 'accept', A, proposal.proposal_id, 2)]; x.meeting.meeting_address = ADDRESS;
  const changes = [ d => { d.agreed = false; }, d => { d.events = []; }, d => { d.events[1].actor_id = B; },
    d => { d.events[0].actor_id = C; }, d => { d.events[1].id = 1; }, d => { d.version++; },
    d => { d.proposal.address = 'Вигадано'; }, d => { d.meeting.proposed_at = new Date(Date.now() + 9000000).toISOString(); },
    d => { d.events[1].terms_hash = 'b'.repeat(64); }, d => { d.events[1].address = ADDRESS; } ];
  for (const change of changes) {
    x.controls.transform = d => { change(d); return d; };
    await assert.rejects(state(x), e => e.status === 502);
  }
});

test('response cannot promote a proposal after material, meeting or selection changes while it travels', async () => {
  for (const changed of ['material', 'meeting', 'proposal']) {
    const x = await setup(); x.controls.events = [event(x.reviewed, 'propose', B)];
    let once = true;
    x.controls.beforeReply = async () => {
      if (!once) return; once = false;
      if (changed === 'material') await x.b.saveTerms(A, exchangeMaterial(A, B, fields({ give_target: 'Новий конкретний прототип' })), x.reviewed);
      if (changed === 'meeting') x.meeting.duration_minutes = 60;
      if (changed === 'proposal') x.controls.events.push(event(x.reviewed, 'propose', B, crypto.randomUUID(), 2, 'Нова адреса'));
    };
    await assert.rejects(state(x), e => e.status === 409 || e.status === 502);
  }
});

test('late address replies are invalidated by logout and restore of the same or another account', async () => {
  for (const nextActor of [A, B]) {
    const x = await setup(); let entered, release;
    const ready = new Promise(resolve => { entered = resolve; }), blocked = new Promise(resolve => { release = resolve; });
    x.controls.beforeReply = async () => { entered(); await blocked; };
    const pending = state(x); await ready;
    await x.a.signOut(); x.controls.actor = nextActor; await x.a.restore(); release();
    await assert.rejects(pending, e => e.status === 401);
  }
});

test('the final reply cannot attest agreement after a last-moment revision or withdrawal', async () => {
  for (const change of ['revision', 'withdrawal']) {
    const x = await setup(), proposal = event(x.reviewed, 'propose', B);
    x.controls.events = [proposal, event(x.reviewed, 'accept', A, proposal.proposal_id, 2)]; x.meeting.meeting_address = ADDRESS;
    let reads = 0;
    x.controls.beforeReply = async body => {
      if (body.action !== 'state' || ++reads !== 2) return;
      if (change === 'revision') await x.b.saveTerms(A, exchangeMaterial(A, B, fields({ give_target: 'Ще один конкретний прототип' })), x.reviewed);
      else await x.b.withdrawTerms(A, x.reviewed);
    };
    await assert.rejects(state(x), e => e.status === 409 || e.status === 502);
  }
});

test('server denials do not create a local acceptance or hidden retry', async () => {
  for (const status of [401, 403, 409, 429, 503]) {
    const x = await setup(); x.controls.error = status;
    await assert.rejects(state(x), e => e.status === status);
    assert.equal(x.calls.length, 1); assert.equal(x.controls.events.length, 0); assert.equal(x.meeting.meeting_address, '');
  }
});
