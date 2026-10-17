// Closed, reviewable deployment candidate. No deploy or database mutation.
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
import { A, origin, createFixture } from './fixtures/real-journey-fixture.mjs';

const root = process.cwd(), directory = path.join(root, 'web_launch/dist-neon-real-journey-20261003');
const proof = path.join(root, 'artifacts/real-journey-20261003');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
// An unrelated dirty demo edit is preserved in the checkout. The release uses
// its accepted committed bytes, so this task never publishes that unowned edit.
const baselineDemo = execFileSync('git', ['show', 'HEAD:web_launch/journey-ui.mjs'], { cwd: root });
await fs.writeFile(path.join(directory, 'journey-ui.mjs'), baselineDemo);
const release = JSON.parse(await fs.readFile(path.join(directory, 'release.json'), 'utf8'));
release.files.find(row => row.name === 'journey-ui.mjs').sha256 = sha(baselineDemo);
release.files.find(row => row.name === 'journey-ui.mjs').bytes = baselineDemo.length;
release.source_selection = { unowned_demo_source: 'HEAD:web_launch/journey-ui.mjs', base_commit: base, working_copy_preserved: true };
await fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(release, null, 2));
const expected = new Set([...Object.keys(PUBLIC_ASSETS), '_worker.js', '_routes.json', 'release.json']);
const files = await fs.readdir(directory);
assert.deepEqual(new Set(files), expected);
for (const row of release.files) assert.equal(sha(await fs.readFile(path.join(directory, row.name))), row.sha256, row.name);
assert.ok(!files.some(name => /fixture|\.test\.|\.sql$|config\.public|\.env/i.test(name)));
const worker = (await import(pathToFileURL(path.join(directory, '_worker.js')).href)).default;
const settings = { ...createFixture().env, SYNERA_REAL_JOURNEY_READY: 'false' };
let upstreamCalls = 0;
const previousFetch = globalThis.fetch;
globalThis.fetch = async () => { upstreamCalls++; throw new Error('Unexpected external request'); };
try {
  const config = await (await worker.fetch(new Request(origin + '/config.json'), settings)).json();
  assert.equal(config.realJourneyEnabled, false);
  for (const table of ['match_cases', 'match_case_approvals']) {
    const response = await worker.fetch(new Request(origin + '/api/neon/data/' + table, { headers: { Origin: origin, 'X-Synera-Client': '1', Cookie: '__Host-synera-session=' + A } }), settings);
    assert.equal(response.status, 503);
  }
  const denied = await worker.fetch(new Request(origin + '/case-state.migration.sql'), settings); assert.equal(denied.status, 404);
  assert.equal(upstreamCalls, 0);
} finally { globalThis.fetch = previousFetch; }
const sourceNames = ['neon/worker.mjs', 'neon/worker.test.mjs', 'web_launch/assets.mjs', 'web_launch/config.mjs', 'web_launch/profile-store.mjs',
  'web_launch/case-approval-guard.test.mjs', 'web_launch/e2e-neon-flow.test.mjs', 'web_launch/index.html', 'web_launch/studio-journey.html',
  'web_launch/real-journey.html', 'web_launch/real-journey.css', 'web_launch/real-journey.mjs', 'web_launch/real-journey-client.mjs', 'web_launch/real-journey-client.test.mjs',
  'tools/fixtures/real-journey-fixture.mjs', 'tools/real-journey-browser-acceptance.mjs', 'tools/real-journey-release-acceptance.mjs',
  'tools/real-journey-sql-acceptance.mjs', 'neon/generate-schema.mjs', 'neon/case-expiry-repair.migration.sql',
  'supabase/case-state.proposal.sql', 'supabase/case-state.acceptance.sql'];
const hashes = {};
for (const name of [...sourceNames, 'neon/schema.proposal.sql', 'neon/case-state.migration.sql', 'neon/case-state.acceptance.sql', 'neon/group-room.migration.sql', 'neon/group-room.acceptance.sql']) hashes[name] = sha(await fs.readFile(path.join(root, name)));
const sqlReceipt = JSON.parse(await fs.readFile(path.join(proof, 'SQL_ACCEPTANCE.json'), 'utf8'));
assert.equal(sqlReceipt.status, 'LOCAL_SQL_ACCEPTED_LIVE_HOLD');
for (const [name, digest] of Object.entries(sqlReceipt.source_sha256)) assert.equal(sha(await fs.readFile(path.join(root, name))), digest, 'SQL proof no longer matches ' + name);
const receipt = { status: 'LOCAL_ACCEPTED_LIVE_HOLD', generated_at: new Date().toISOString(), base_commit: base,
  candidate_directory: directory, public_files: files.length, byte_readback: 'PASS', closed_bundled_worker: 'PASS', network_calls: upstreamCalls,
  source_sha256: hashes, unowned_work_preserved: ['web_launch/journey-ui.mjs'],
  sql_runtime: 'PASS_POSTGRESQL_16_15_ICU_UND_PROVIDER_SHIM', sql_acceptance: 'artifacts/real-journey-20261003/SQL_ACCEPTANCE.json',
  neon_auth_two_sessions: 'NOT_RUN', live_rls_jwt: 'NOT_RUN', production_migrations: 'NOT_APPLIED',
  deployed: false, physical_android: 'NOT_RUN', provider_calls: 0, provider_usd: 0,
};
await fs.mkdir(proof, { recursive: true });
await fs.writeFile(path.join(proof, 'CLOSEOUT.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify({ status: receipt.status, files: files.length, byte_readback: receipt.byte_readback, upstream_calls: upstreamCalls, source_hashes: Object.keys(hashes).length }));
