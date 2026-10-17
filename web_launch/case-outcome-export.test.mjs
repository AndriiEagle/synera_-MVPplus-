import test from 'node:test';
import assert from 'node:assert/strict';
import { RealJourneyStore, exchangeMaterial, JourneyConflict } from './real-journey-client.mjs';
import { unpackArchive } from './archive-codec.mjs';
import { A, B, O, config, fields } from '../tools/fixtures/real-journey-fixture.mjs';
import { createOutcomeFixture } from '../tools/fixtures/case-outcome-fixture.mjs';

async function setup() {
  const db = createOutcomeFixture(), a = new RealJourneyStore({ ...config, caseOutcomesEnabled: true }, db.fetchFor(A));
  const b = new RealJourneyStore({ ...config, caseOutcomesEnabled: true }, db.fetchFor(B));
  await a.dashboard(); await b.dashboard();
  const original = exchangeMaterial(A, B, fields({ give_target: ' Прототип × Zürich 💛\n  точні слова / 向前 ', take_target: 'Екран без втрати смислу' }));
  let reviewed = await a.saveTerms(B, original); await a.approveTerms(B, reviewed); reviewed = await b.approveTerms(A, reviewed);
  return { db, a, b, reviewed };
}

test('private plain and gzip exports preserve actual server-reviewed material and pending attestations exactly', async () => {
  const { a, reviewed } = await setup();
  const forged = { ...reviewed, material: { message: 'Caller cannot replace the reviewed business terms' } };
  for (const compress of [false, true]) {
    const packed = await a.exportOutcome(B, forged, { compress });
    const restored = JSON.parse(await unpackArchive(packed.json));
    assert.deepEqual(restored.case.material, reviewed.material);
    assert.deepEqual(restored.case.participants, reviewed.participants);
    assert.equal(restored.case.terms_hash, reviewed.termsHash);
    assert.equal(restored.outcome.outcome_confirmed, false);
    assert.deepEqual(restored.outcome.deliverables.map(row => row.phase), ['pending', 'pending']);
    assert.equal(restored.proof_scope, 'participant_attestation');
    assert.equal(restored.authority, 'local_copy_not_live_server_state');
    assert.equal(restored.exported_by, A);
    assert.equal(JSON.parse(packed.json).encoding, compress ? 'gzip-base64' : 'utf8-base64');
    assert.equal(packed.originalBytes, new TextEncoder().encode(await unpackArchive(packed.json)).length);
    assert.equal(packed.envelopeBytes, new TextEncoder().encode(packed.json).length);
    assert.match(packed.fileName, /^synera-outcome-[A-Za-z0-9_-]+-v1\.json$/);
  }
});

test('a partial archive retains receiver-only acceptance and never promotes the other pending result', async () => {
  const { a, b, reviewed } = await setup(), index = reviewed.material.trial.deliverables.findIndex(row => row.giver_id === A);
  await a.recordOutcome(B, reviewed, { action: 'submit', index, intentId: crypto.randomUUID(), evidenceUri: 'Оригінальний доказ 💛\n  <script>literal</script>' });
  await b.recordOutcome(A, reviewed, { action: 'check', index, intentId: crypto.randomUUID(), scopeNotes: 'Перевірено критерій, без автоматичного так' });
  await b.recordOutcome(A, reviewed, { action: 'accept', index, intentId: crypto.randomUUID() });
  const value = JSON.parse(await unpackArchive((await a.exportOutcome(B, reviewed, { compress: true })).json));
  assert.equal(value.outcome.outcome_confirmed, false);
  assert.equal(value.outcome.deliverables[index].phase, 'accepted');
  assert.equal(value.outcome.deliverables[1 - index].phase, 'pending');
  assert.deepEqual(value.outcome.events.map(event => event.actor_id), [A, B, B]);
  assert.equal(value.outcome.events[0].payload.evidenceUri, 'Оригінальний доказ 💛\n  <script>literal</script>');
});

test('closed rollout, outsiders, revoked consent and logged-out accounts cannot produce an archive', async () => {
  const { db, a, reviewed } = await setup();
  const closed = new RealJourneyStore(config, db.fetchFor(A)); await closed.restore();
  const before = db.requests.length;
  await assert.rejects(closed.exportOutcome(B, reviewed), error => error.status === 503);
  assert.equal(db.requests.length, before, 'Closed export performed private data requests');
  const outsider = new RealJourneyStore({ ...config, caseOutcomesEnabled: true }, db.fetchFor(O)); await outsider.restore();
  await assert.rejects(outsider.exportOutcome(B, reviewed), error => [403, 409].includes(error.status));
  db.noConsent.add(A); await assert.rejects(a.exportOutcome(B, reviewed), error => error.status === 403);
  db.noConsent.delete(A); await a.signOut(); await assert.rejects(a.exportOutcome(B, reviewed), error => error.status === 401);
});

async function pauseArchiveDigest(action) {
  const original = crypto.subtle.digest; let release, reached;
  const wait = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { reached = resolve; });
  crypto.subtle.digest = async function (algorithm, data) {
    if (new TextDecoder().decode(data).startsWith('{"format":"synera.case-outcome.archive.v1"')) { reached(); await wait; }
    return original.call(this, algorithm, data);
  };
  try { await action({ started, release }); }
  finally { release(); crypto.subtle.digest = original; }
}

test('logout and restore of the same account during compression discard the private export', async () => {
  const { a, reviewed } = await setup();
  await pauseArchiveDigest(async ({ started, release }) => {
    const pending = a.exportOutcome(B, reviewed, { compress: true }), rejected = assert.rejects(pending, error => error.status === 401);
    await started; await a.signOut(); await a.restore(); release(); await rejected;
    assert.equal(a.user.id, A);
  });
});

test('a material revision during compression cannot return a stale archive as the current reviewed result', async () => {
  const { a, b, reviewed } = await setup();
  await pauseArchiveDigest(async ({ started, release }) => {
    const pending = a.exportOutcome(B, reviewed, { compress: true }), rejected = assert.rejects(pending, JourneyConflict);
    await started;
    await b.saveTerms(A, exchangeMaterial(A, B, fields({ take_target: 'Нові погоджувані умови' })), reviewed);
    release(); await rejected;
  });
});
