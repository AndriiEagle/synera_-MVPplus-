import test from 'node:test';
import assert from 'node:assert/strict';
import { RealJourneyStore, exchangeMaterial, assertRealJourneyGate, JourneyConflict } from './real-journey-client.mjs';
import { validateConfig } from './config.mjs';
import { createNeonWorker, handleNeon } from '../neon/worker.mjs';
import { A, B, O, origin, config, fields, createFixture } from '../tools/fixtures/real-journey-fixture.mjs';
import { hashMaterialPayload } from './business-case.mjs';
import { reviseCase } from './business-case.mjs';
import { NeonStore } from './neon-store.mjs';

async function setup() {
  const db = createFixture();
  const a = new RealJourneyStore(config, db.fetchFor(A)), b = new RealJourneyStore(config, db.fetchFor(B)), o = new RealJourneyStore(config, db.fetchFor(O));
  await Promise.all([a.dashboard(), b.dashboard(), o.dashboard()]);
  return { db, a, b, o, material: exchangeMaterial(A, B, fields()) };
}
test('real journey is separately closed; readiness and typed config cannot be inferred from pilot or registration', async () => {
  for (const candidate of [{}, { ...config, realJourneyEnabled: false }, { ...config, realPilotEnabled: false }]) assert.throws(() => assertRealJourneyGate(candidate));
  assert.deepEqual(validateConfig(config).realJourneyEnabled, true);
  assert.throws(() => validateConfig({ ...config, realJourneyEnabled: 'true' }));
  assert.throws(() => validateConfig({ ...config, backend: 'supabase' }));
  const worker = createNeonWorker([]);
  for (const [extra, expected] of [[{}, false], [{ SYNERA_REAL_JOURNEY_READY: 'true' }, true], [{ SYNERA_REAL_JOURNEY_READY: 'true', SYNERA_PILOT_READY: 'false' }, false]]) {
    const response = await worker.fetch(new Request(origin + '/config.json'), { SYNERA_PILOT_READY: 'true', ...extra });
    assert.equal((await response.json()).realJourneyEnabled, expected);
  }
});
test('closed agreement rollout also denies direct table calls before any Auth/Data request', async () => {
  const db = createFixture(); let calls = 0;
  for (const table of ['match_cases', 'match_case_approvals']) {
    const response = await handleNeon(new Request(origin + '/api/neon/data/' + table, { headers: { Origin: origin, 'X-Synera-Client': '1', Cookie: '__Host-synera-session=' + A } }),
      { ...db.env, SYNERA_REAL_JOURNEY_READY: 'false' }, async (input, init) => { calls++; return db.upstream(input, init); });
    assert.equal(response.status, 503);
  }
  assert.equal(calls, 0);
});
test('gateway refuses a material PATCH without the exact reviewed case/version/hash before forwarding', async () => {
  const db = createFixture(); let calls = 0;
  const response = await handleNeon(new Request(origin + '/api/neon/data/match_cases?case_id=eq.case-legacy', {
    method: 'PATCH', headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Synera-Client': '1', Cookie: '__Host-synera-session=' + A }, body: JSON.stringify({ material: {} }),
  }), db.env, async (input, init) => { calls++; return db.upstream(input, init); });
  assert.equal(response.status, 400); assert.equal(calls, 0);
});
test('two server-derived accounts share one case, independently approve, accept an invitation, then exchange actual stored text', async () => {
  const { db, a, b, o, material } = await setup();
  const created = await a.saveTerms(B, material);
  assert.equal((await b.pairState(A)).caseId, created.caseId);
  await assert.rejects(a.sendInvitation(B, 'Перший тест', {}), /обидва/);
  await a.approveTerms(B, created);
  assert.equal((await b.pairState(A)).status, 'awaiting_approval');
  await b.approveTerms(A, await b.pairState(A));
  const snapshot = await a.dashboard();
  assert.equal(snapshot.cases[0].status, 'approved_for_next_step');
  assert.equal((await o.dashboard()).cases.length, 0);
  const dashboard = await a.sendInvitation(B, 'Обговорити перевірений екран', { proposed_at: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 30, meeting_place: 'Zürich' });
  const meeting = dashboard.meetings[0];
  await assert.rejects(a.conversation(meeting.id), error => error.status === 403);
  await assert.rejects(a.respondInvitation(meeting.id, 'accepted'), error => error.status === 403);
  await b.respondInvitation(meeting.id, 'accepted');
  const body = 'Код × дизайн. Українська, English, Zürich 💛 <script>literal</script>';
  await a.sendConversation(meeting.id, body);
  assert.equal((await b.conversation(meeting.id)).messages[0].body, body);
  await assert.rejects(o.conversation(meeting.id), error => error.status === 403);
  assert.equal(db.approvals.length, 2);
});
test('a stale screen cannot edit or approve a revision another account already changed', async () => {
  const { db, a, b, material } = await setup();
  const old = await a.saveTerms(B, material);
  await a.approveTerms(B, old);
  const changed = exchangeMaterial(A, B, fields({ take_target: 'Два перевірених екрани' }));
  await b.saveTerms(A, changed, await b.pairState(A));
  await assert.rejects(a.approveTerms(B, old), JourneyConflict);
  await assert.rejects(a.saveTerms(B, material, old), JourneyConflict);
  assert.deepEqual((await a.pairState(B)).approvals, {});
  assert.equal(db.cases[0].material.trial.deliverables.find(row => row.giver_id === B).target, 'Два перевірених екрани');
});
test('CAS predicate rejects a concurrent write AFTER client read and leaves the other material intact', async () => {
  const { db, a, material } = await setup();
  const reviewed = await a.saveTerms(B, material);
  const theirs = exchangeMaterial(A, B, fields({ take_target: 'Конкурентна правка B' }));
  db.controls.beforeCasePatch = async () => Object.assign(db.cases[0], { material: theirs, terms_hash: await hashMaterialPayload(theirs), version: 2, updated_at: new Date().toISOString() });
  await assert.rejects(a.saveTerms(B, exchangeMaterial(A, B, fields({ give_target: 'Застаріла правка A' })), reviewed), JourneyConflict);
  assert.equal(db.cases[0].material.trial.deliverables.find(row => row.giver_id === B).target, 'Конкурентна правка B');
  assert.equal(db.cases[0].version, 2);
});
test('existing ProfileStore save path also rejects a write-time race and preserves the newer material', async () => {
  const { db, a, material } = await setup();
  const reviewed = await a.saveTerms(B, material);
  const legacy = new NeonStore(config, db.fetchFor(A)); await legacy.restore();
  const ours = await reviseCase(reviewed, { material: exchangeMaterial(A, B, fields({ give_target: 'Застаріла правка A' })), now: new Date().toISOString() });
  const theirs = exchangeMaterial(A, B, fields({ take_target: 'Конкурентна правка B' }));
  db.controls.beforeCasePatch = async () => Object.assign(db.cases[0], { material: theirs, terms_hash: await hashMaterialPayload(theirs), version: 2, updated_at: new Date().toISOString() });
  await assert.rejects(legacy.saveCaseState(ours), error => error.status === 409);
  assert.equal(db.cases[0].material.trial.deliverables.find(row => row.giver_id === B).target, 'Конкурентна правка B');
  assert.equal(db.cases[0].version, 2);
});
test('existing store rejects a competing revision already committed before its read, even with the same ordinal', async () => {
  const { db, a, material } = await setup();
  const old = await a.saveTerms(B, material), legacy = new NeonStore(config, db.fetchFor(A)); await legacy.restore();
  const ours = await reviseCase(old, { material: exchangeMaterial(A, B, fields({ give_target: 'Застаріла правка A' })), now: new Date().toISOString() });
  const theirs = exchangeMaterial(A, B, fields({ take_target: 'Збережена правка B' }));
  Object.assign(db.cases[0], { material: theirs, terms_hash: await hashMaterialPayload(theirs), version: 2, updated_at: new Date().toISOString() });
  await assert.rejects(legacy.saveCaseState(ours), error => error.status === 409);
  assert.equal(db.cases[0].version, 2);
});
test('approval never writes material and a revision at POST is denied by the transport oracle', async () => {
  const { db, a, material } = await setup();
  const reviewed = await a.saveTerms(B, material), before = db.requests.length;
  db.controls.beforeApproval = async () => { db.cases[0].version++; };
  await assert.rejects(a.approveTerms(B, reviewed), error => error.status === 403);
  assert.equal(db.requests.slice(before).some(row => row.method === 'PATCH' && row.path.endsWith('/match_cases')), false);
  assert.equal(db.approvals.length, 0);
});
test('withdrawing affects only self; incomplete input and revoked session/consent cannot progress', async () => {
  const { db, a, b, material } = await setup();
  let state = await a.saveTerms(B, material);
  await a.approveTerms(B, state); await b.approveTerms(A, await b.pairState(A));
  state = await a.withdrawTerms(B, await a.pairState(B));
  assert.equal(state.approvals[A], undefined); assert.ok(state.approvals[B]);
  assert.throws(() => exchangeMaterial(A, B, fields({ intellectual_property: '', compensation_status: '' })));
  db.noConsent.add(A);
  await assert.rejects(a.pairState(B), error => error.status === 403);
  db.noConsent.delete(A); db.revoked.add(A);
  await assert.rejects(a.dashboard(), error => error.status === 401);
});
test('PostgREST timezone and fractional timestamps still permit an explicit approval of the reviewed material', async () => {
  const { db, a, material } = await setup();
  await a.saveTerms(B, material);
  for (const key of ['created_at', 'updated_at', 'expires_at']) db.cases[0][key] = db.cases[0][key].replace('Z', '123+00:00');
  const state = await a.pairState(B);
  assert.equal((await a.approveTerms(B, state)).status, 'awaiting_approval');
});
