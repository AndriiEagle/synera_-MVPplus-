import test from 'node:test';
import assert from 'node:assert/strict';
import { RealJourneyStore, exchangeMaterial, JourneyConflict } from './real-journey-client.mjs';
import { A, B, O, config, fields } from '../tools/fixtures/real-journey-fixture.mjs';
import { createOutcomeFixture } from '../tools/fixtures/case-outcome-fixture.mjs';

async function setup() {
  const db = createOutcomeFixture(), a = new RealJourneyStore({ ...config, caseOutcomesEnabled: true }, db.fetchFor(A));
  const b = new RealJourneyStore({ ...config, caseOutcomesEnabled: true }, db.fetchFor(B));
  await a.dashboard(); await b.dashboard();
  let reviewed = await a.saveTerms(B, exchangeMaterial(A, B, fields({ give_target: 'Точний прототип × Zürich 💛\n  向前', take_target: 'Приватний результат партнера' })));
  await a.approveTerms(B, reviewed); reviewed = await b.approveTerms(A, reviewed);
  const finish = async index => {
    const leg = reviewed.material.trial.deliverables[index], giver = leg.giver_id === A ? a : b, receiver = leg.receiver_id === A ? a : b;
    await giver.recordOutcome(leg.receiver_id, reviewed, { action: 'submit', index, intentId: crypto.randomUUID(), evidenceUri: 'Private proof https://private.example/secret' });
    await receiver.recordOutcome(leg.giver_id, reviewed, { action: 'check', index, intentId: crypto.randomUUID(), scopeNotes: 'Private checks' });
    await receiver.recordOutcome(leg.giver_id, reviewed, { action: 'accept', index, intentId: crypto.randomUUID() });
  };
  const finishAll = async () => { for (const [index] of reviewed.material.trial.deliverables.entries()) await finish(index); };
  return { db, a, b, reviewed, finish, finishAll };
}

test('fresh bilateral acceptance yields only the actor contribution and never evidence, partner identity or publication', async () => {
  const { db, a, b, reviewed, finishAll } = await setup(); await finishAll();
  const before = db.events.length;
  for (const [store, actor, peer] of [[a, A, B], [b, B, A]]) {
    const forged = { ...reviewed, material: { fake: 'Invented achievement' } };
    for (const wording of ['general', 'linkedin']) {
      const draft = await store.socialDraft(peer, forged, { wording });
      const own = reviewed.material.trial.deliverables.filter(row => row.giver_id === actor);
      for (const row of own) assert.ok(draft.text.includes(row.target));
      for (const row of reviewed.material.trial.deliverables.filter(row => row.giver_id !== actor)) assert.equal(draft.text.includes(row.target), false);
      assert.equal(draft.publishable, false); assert.equal(draft.trust, 'same_device_unverified');
      assert.equal(draft.proof_scope, 'participant_attestation');
      assert.deepEqual(draft.case, { caseId: reviewed.caseId, version: reviewed.version, termsHash: reviewed.termsHash });
      assert.deepEqual(draft.attestationReferences.map(ref => ref.eventId), db.events.filter(event => event.kind === 'accept' && own.includes(reviewed.material.trial.deliverables[event.index])).map(event => event.id));
      for (const text of ['private.example', 'Private checks', A, B, 'Invented achievement']) assert.equal(draft.text.includes(text), false);
    }
  }
  assert.equal(db.events.length, before, 'Draft creation wrote an outcome event');
});

test('caller snapshots, silence, one accepted leg and a current dispute cannot manufacture a social achievement', async () => {
  const { a, b, reviewed, finish } = await setup();
  const forged = { ...reviewed, outcome: { outcome_confirmed: true } };
  await assert.rejects(a.socialDraft(B, forged));
  await finish(0); await assert.rejects(a.socialDraft(B, reviewed));
  const other = reviewed.material.trial.deliverables[1], receiver = other.receiver_id === A ? a : b;
  await receiver.recordOutcome(other.giver_id, reviewed, { action: 'decline', index: 1, intentId: crypto.randomUUID(), reason: 'not_delivered' });
  await assert.rejects(a.socialDraft(B, reviewed));
});

test('withdrawn approval, expired terms and a new material revision invalidate a previously completed result for drafting', async () => {
  const { db, a, b, reviewed, finishAll } = await setup(); await finishAll();
  await b.withdrawTerms(A, reviewed); await assert.rejects(a.socialDraft(B, reviewed), JourneyConflict);
  await b.approveTerms(A, reviewed);
  const expires = db.cases[0].expires_at; db.cases[0].expires_at = new Date(Date.now() - 1000).toISOString();
  await assert.rejects(a.socialDraft(B, reviewed), JourneyConflict); db.cases[0].expires_at = expires;
  await b.saveTerms(A, exchangeMaterial(A, B, fields({ give_target: 'Нова версія, ще не виконана' })), reviewed);
  await assert.rejects(a.socialDraft(B, reviewed), JourneyConflict);
});

test('logout and same-account restore after outcome read discard the pending social draft', async () => {
  const { a, reviewed, finishAll } = await setup(); await finishAll();
  const original = a.outcomeState.bind(a); let release, reached;
  const wait = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { reached = resolve; });
  a.outcomeState = async (...args) => { const result = await original(...args); reached(); await wait; return result; };
  const pending = a.socialDraft(B, reviewed), rejection = assert.rejects(pending, error => error.status === 401);
  await started; await a.signOut(); await a.restore(); release(); await rejection;
});

test('closed rollout, unsupported wording, outsiders and revoked consent cannot return a draft', async () => {
  const { db, a, reviewed, finishAll } = await setup(); await finishAll();
  const closed = new RealJourneyStore(config, db.fetchFor(A)); await closed.restore();
  let before = db.requests.length; await assert.rejects(closed.socialDraft(B, reviewed), error => error.status === 503);
  assert.equal(db.requests.length, before);
  before = db.requests.length; await assert.rejects(a.socialDraft(B, reviewed, { wording: 'constructor' }), error => error.status === 400);
  assert.equal(db.requests.length, before);
  const outsider = new RealJourneyStore({ ...config, caseOutcomesEnabled: true }, db.fetchFor(O)); await outsider.restore();
  await assert.rejects(outsider.socialDraft(B, reviewed), error => [403, 409].includes(error.status));
  db.noConsent.add(A); await assert.rejects(a.socialDraft(B, reviewed), error => error.status === 403);
});
