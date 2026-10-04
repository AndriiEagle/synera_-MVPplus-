import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { readOutcomeArchive } from './outcome-archive.mjs';
import { packArchive, unpackArchive } from './archive-codec.mjs';

const plain = await fs.readFile(new URL('../artifacts/overnight-20261004/outcome-export-plain.json', import.meta.url), 'utf8');
const gzip = await fs.readFile(new URL('../artifacts/overnight-20261004/outcome-export-gzip.json', import.meta.url), 'utf8');
const original = JSON.parse(await unpackArchive(plain));
const envelope = async value => (await packArchive(JSON.stringify(value))).json;
const altered = change => { const copy = structuredClone(original); change(copy); return copy; };

test('the real downloaded plain and gzip copies are read locally with exact terms and participant history', async () => {
  const previous = globalThis.fetch; let calls = 0;
  globalThis.fetch = () => { calls++; throw new Error('Archive must remain local'); };
  try {
    for (const source of [plain, gzip]) {
      const value = await readOutcomeArchive(source);
      assert.deepEqual(value, JSON.parse(await unpackArchive(source)));
      assert.deepEqual(value.case.material, original.case.material);
      assert.equal(value.outcome.events.length, 6);
      assert.ok(value.outcome.events[0].payload.evidenceUri.includes('\n  <script>literal</script> / 向前'));
    }
    assert.equal(calls, 0);
  } finally { globalThis.fetch = previous; }
});

test('a local incomplete copy remains incomplete and never becomes a server approval', async () => {
  const pending = altered(value => {
    value.outcome.events = []; value.outcome.outcome_confirmed = false;
    for (const row of value.outcome.deliverables) Object.assign(row, { phase: 'pending', evidence_uri: null, scope_notes: null, reason: null });
  });
  const value = await readOutcomeArchive(await envelope(pending));
  assert.equal(value.outcome.outcome_confirmed, false);
  assert.deepEqual(value.outcome.events, []);
  assert.deepEqual(value.outcome.deliverables.map(row => row.phase), ['pending', 'pending']);
  assert.deepEqual(value.case.material, original.case.material);
});

test('recomputed envelope digests cannot hide changed material, roles or fabricated acceptance', async () => {
  const changes = [
    value => { value.case.material.trial.deliverables[0].target = 'Forged business terms'; },
    value => { const event = value.outcome.events[2]; event.actor_id = value.case.material.trial.deliverables[event.index].giver_id; },
    value => { value.outcome.events = []; },
    value => { value.outcome.version++; },
    value => { value.outcome.terms_hash = '0'.repeat(64); },
    value => { value.case.participants[1] = value.case.participants[0]; },
    value => { value.exported_by = 'ffffffff-ffff-4fff-8fff-ffffffffffff'; },
    value => { value.authority = 'live_server_state'; },
    value => { value.proof_scope = 'independent_quality_verification'; },
    value => { value.extra_command = { approve: true }; },
  ];
  for (const change of changes) await assert.rejects(readOutcomeArchive(await envelope(altered(change))));
});

test('corrupt, oversized and another archive format do not yield a private outcome', async () => {
  const broken = JSON.parse(plain); broken.sha256 = '0'.repeat(64);
  await assert.rejects(readOutcomeArchive(JSON.stringify(broken)));
  await assert.rejects(readOutcomeArchive(' '.repeat(2 * 1024 * 1024)));
  await assert.rejects(readOutcomeArchive(await envelope({ format: 'synera.session-value.v1', sessions: [] })));
  await assert.rejects(readOutcomeArchive('{'));
});
