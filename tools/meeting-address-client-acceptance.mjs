// Local client closure, isolated epoch mutation and package readback. No providers.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifact = path.join(root, 'artifacts/overnight-20261004/MEETING_ADDRESS_CLIENT.json');
const directory = path.join(root, 'web_launch/dist-neon-address-client-20261004');
const read = name => fs.readFile(path.join(root, name));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = ['web_launch/neon-store.mjs', 'web_launch/real-journey-client.mjs', 'web_launch/meeting-address-client.test.mjs',
  'web_launch/case-outcome-client.test.mjs', 'web_launch/real-journey-client.test.mjs', 'web_launch/neon-store.test.mjs',
  'web_launch/profile-store.mjs', 'web_launch/business-case.mjs', 'tools/fixtures/real-journey-fixture.mjs', 'tools/meeting-address-client-acceptance.mjs'];
const preserved = ['web_launch/journey-ui.mjs', 'web_launch/real-journey.mjs', 'web_launch/archive-codec.mjs', 'web_launch/session-value.mjs',
  'web_launch/assets.mjs', 'web_launch/dist-neon-address-api-20261004/release.json', 'web_launch/dist-neon-address-api-20261004/_worker.js'];
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Client plus held-out synthetic transport; SQL/API separately source-linked, not signed HTTP JWT, live people, UI or production' };
report.base_commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
report.source_sha256 = Object.fromEntries(await Promise.all(sources.map(async name => [name, hash(await read(name))])));
report.preserved_sha256 = Object.fromEntries(await Promise.all(preserved.map(async name => [name, hash(await read(name))])));
const absoluteImports = (source, name) => source.replace(/from (['"])(\.[^'"]+)\1/g,
  (match, quote, relative) => 'from ' + JSON.stringify(pathToFileURL(path.resolve(root, path.dirname(name), relative)).href));
const dataModule = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
try {
  const files = ['web_launch/meeting-address-client.test.mjs', 'web_launch/case-outcome-client.test.mjs', 'web_launch/real-journey-client.test.mjs', 'web_launch/neon-store.test.mjs'];
  const testRun = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
  report.tests = { command: 'node --test ' + files.join(' '), exit_code: testRun.status, stdout: testRun.stdout, stderr: testRun.stderr };
  assert.equal(testRun.status, 0, testRun.stdout + testRun.stderr);
  for (const label of ['fail', 'skipped', 'cancelled']) assert.match(testRun.stdout, new RegExp('# ' + label + ' 0'));
  report.tests.pass = Number(testRun.stdout.match(/# pass (\d+)/)?.[1]); assert.equal(report.tests.pass, 35);
  const clientName = 'web_launch/real-journey-client.mjs', testName = 'web_launch/meeting-address-client.test.mjs';
  const original = (await read(clientName)).toString('utf8'), marker = ' || addressEpoch !== this.#outcomeEpoch';
  assert.equal(original.split(marker).length, 2);
  const mutant = dataModule(absoluteImports(original.replace(marker, ''), clientName));
  const changedTests = absoluteImports((await read(testName)).toString('utf8'), testName)
    .replace(JSON.stringify(pathToFileURL(path.join(root, clientName)).href), JSON.stringify(mutant));
  const mutation = spawnSync(process.execPath, ['--input-type=module', '--test-reporter=tap'], {
    cwd: root, encoding: 'utf8', input: 'await import(' + JSON.stringify(dataModule(changedTests)) + ');', timeout: 30000, maxBuffer: 8 * 1024 * 1024,
  });
  assert.notEqual(mutation.status, 0); assert.match(mutation.stdout, /not ok[^\n]+late address replies/); assert.match(mutation.stdout, /Missing expected rejection/);
  report.session_epoch_mutation_rejected = true;
  report.mutation = { scope: 'Remove only new address epoch comparison in a data: module; original source untouched', exit_code: mutation.status, stdout: mutation.stdout, stderr: mutation.stderr };
  for (const receiptName of ['MEETING_ADDRESS_SQL.json', 'MEETING_ADDRESS_GATEWAY.json']) {
    const receipt = JSON.parse((await read('artifacts/overnight-20261004/' + receiptName)).toString('utf8'));
    assert.match(receipt.status, /^PASS_LOCAL_/);
    for (const [name, digest] of Object.entries(receipt.source_sha256)) assert.equal(hash(await read(name)), digest, 'Reused proof drift: ' + name);
  }
  report.reused_proof = 'Only recorded SQL/gateway source_sha256 maps match. Historical preserved_sha256 client snapshots are not claimed current. PG not started.';
  report.build = JSON.parse(execFileSync(process.execPath, ['neon/build.mjs', 'dist-neon-address-client-20261004'], { cwd: root, encoding: 'utf8' }));
  const demo = execFileSync('git', ['show', 'HEAD:web_launch/journey-ui.mjs'], { cwd: root });
  await fs.writeFile(path.join(directory, 'journey-ui.mjs'), demo);
  const release = JSON.parse(await fs.readFile(path.join(directory, 'release.json'), 'utf8'));
  Object.assign(release.files.find(row => row.name === 'journey-ui.mjs'), { bytes: demo.length, sha256: hash(demo) });
  release.source_selection = { unowned_demo_source: 'HEAD:web_launch/journey-ui.mjs', base_commit: report.base_commit, working_copy_preserved: true };
  await fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(release, null, 2) + '\n');
  const names = await fs.readdir(directory);
  assert.deepEqual(new Set(names), new Set([...Object.keys(PUBLIC_ASSETS), '_worker.js', '_routes.json', 'release.json']));
  for (const row of release.files) {
    const bytes = await fs.readFile(path.join(directory, row.name)); assert.equal(bytes.length, row.bytes, row.name); assert.equal(hash(bytes), row.sha256, row.name);
  }
  for (const name of ['neon-store.mjs', 'real-journey-client.mjs']) assert.deepEqual(await fs.readFile(path.join(directory, name)), await read('web_launch/' + name));
  assert.deepEqual(await fs.readFile(path.join(directory, '_worker.js')), await read('web_launch/dist-neon-address-api-20261004/_worker.js'));
  const worker = (await import(pathToFileURL(path.join(directory, '_worker.js')).href)).default;
  const savedFetch = globalThis.fetch; let calls = 0;
  try {
    globalThis.fetch = async () => { calls++; throw new Error('Closed feature attempted provider call'); };
    const origin = 'https://address-client-fixture.pages.dev', env = { SYNERA_SITE_URL: origin, SYNERA_PILOT_READY: 'true', SYNERA_REAL_JOURNEY_READY: 'true' };
    assert.equal((await (await worker.fetch(new Request(origin + '/config.json'), env)).json()).meetingAddressEnabled, false);
    const r = await worker.fetch(new Request(origin + '/api/neon/meeting-address/44444444-4444-4444-8444-444444444444/case-ab', {
      method: 'POST', headers: { Origin: origin, 'X-Synera-Client': '1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'state', version: 1, termsHash: 'a'.repeat(64) }),
    }), env);
    assert.equal(r.status, 503); assert.equal(calls, 0); report.closed_worker_upstream_calls = calls;
  } finally { globalThis.fetch = savedFetch; }
  for (const [name, digest] of Object.entries({ ...report.source_sha256, ...report.preserved_sha256 })) assert.equal(hash(await read(name)), digest, name);
  report.directory = directory; report.public_files = names.length; report.release_sha256 = hash(await fs.readFile(path.join(directory, 'release.json')));
  report.status = 'PASS_LOCAL_MEETING_ADDRESS_CLIENT'; report.published = false;
  report.ui = report.live_accounts = report.signed_http_jwt = report.physical_android = 'NOT_RUN';
} catch (error) { report.error = error.message; throw error; }
finally { await fs.writeFile(artifact, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, tests: report.tests.pass, mutation: report.session_epoch_mutation_rejected, files: report.public_files, receipt: artifact }));
