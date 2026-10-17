// Close the one local navigation step, preserving all previous releases/proofs.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
const root = fileURLToPath(new URL('../', import.meta.url)), proof = 'artifacts/overnight-20261004/address-navigation';
const read = n => fs.readFile(path.join(root, n)), hash = b => createHash('sha256').update(b).digest('hex');
const sources = ['web_launch/real-journey.mjs', 'web_launch/real-journey.html', 'web_launch/live-location.mjs', 'web_launch/summit.test.mjs',
  'tools/meeting-address-navigation-browser.mjs', 'tools/meeting-address-navigation-acceptance.mjs'];
const preserved = ['web_launch/journey-ui.mjs', 'web_launch/real-journey.css', 'web_launch/real-journey-client.mjs', 'web_launch/neon-store.mjs',
  'web_launch/assets.mjs', 'web_launch/atelier.mjs', 'web_launch/atelier.css', 'tools/meeting-address-browser.mjs', 'tools/fixtures/real-journey-fixture.mjs',
  'artifacts/overnight-20261004/MEETING_ADDRESS_UI.json', 'artifacts/overnight-20261004/MEETING_ADDRESS_BROWSER.json',
  'web_launch/dist-neon-address-ui-20261004/release.json', 'web_launch/dist-neon-address-ui-20261004/_worker.js'];
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Local private journey to independently agreed address; Chromium plus intercepted Maps navigation, not Google service, SQL/JWT, live people or physical Android' };
report.base_commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
for (const [key, names] of [['source_sha256', sources], ['preserved_sha256', preserved]]) report[key] = Object.fromEntries(await Promise.all(names.map(async n => [n, hash(await read(n))])));
try {
  const red = JSON.parse(await read(proof + '/NAVIGATION_RED.json')); assert.match(red.browser.error, /Agreed address route missing/);
  const mutation = JSON.parse(await read(proof + '/NAVIGATION_MUTATION.json')); assert.match(mutation.browser.error, /Unagreed address navigated/);
  assert.equal(mutation.source_sha256['web_launch/real-journey.mjs'], report.source_sha256['web_launch/real-journey.mjs']);
  report.mutation_rejected = true; report.mutation_scope = 'Only fresh-state comparison branch disabled in browser copy; canonical file unchanged';
  let browser = JSON.parse(await read(proof + '/NAVIGATION_BROWSER.json'));
  const reusable = browser.status === 'PASS_LOCAL_MEETING_ADDRESS_NAVIGATION' &&
    (await Promise.all(Object.entries(browser.source_sha256).map(async ([n, digest]) => hash(await read(n)) === digest))).every(Boolean);
  if (!reusable) {
    const run = spawnSync(process.execPath, ['tools/meeting-address-navigation-browser.mjs'], { cwd: root, encoding: 'utf8', timeout: 60000, maxBuffer: 1024 * 1024 });
    assert.equal(run.status, 0, run.stdout + run.stderr); browser = JSON.parse(await read(proof + '/NAVIGATION_BROWSER.json'));
  }
  assert.equal(browser.status, 'PASS_LOCAL_MEETING_ADDRESS_NAVIGATION');
  for (const [n, digest] of Object.entries(browser.source_sha256)) assert.equal(hash(await read(n)), digest, n);
  assert.equal(browser.browser.external_requests, 0); assert.equal(browser.browser.google_requests_transmitted, 0); assert.equal(browser.browser.intercepted_navigation_attempts, 1);
  report.reused_browser_by_exact_hashes = reusable; report.checks = browser.browser.checks; report.chromium_checks = Object.keys(report.checks).length;
  report.intercepted_navigation_attempts = 1; report.google_requests_transmitted = 0;
  for (const name of ['MEETING_ADDRESS_SQL.json', 'MEETING_ADDRESS_GATEWAY.json', 'MEETING_ADDRESS_CLIENT.json']) {
    const receipt = JSON.parse(await read('artifacts/overnight-20261004/' + name)); assert.match(receipt.status, /^PASS_LOCAL_/);
    for (const [n, digest] of Object.entries(receipt.source_sha256)) assert.equal(hash(await read(n)), digest, 'Reused dependency drift: ' + n);
  }
  report.reused_proof = 'Exact SQL/API/client source maps; historical UI full-source proofs not claimed current. No PG/unchanged broad tests rerun.';
  const outputName = 'dist-neon-address-navigation-20261004';
  report.build = JSON.parse(execFileSync(process.execPath, ['neon/build.mjs', outputName], { cwd: root, encoding: 'utf8' }));
  const directory = path.join(root, 'web_launch', outputName), demo = execFileSync('git', ['show', 'HEAD:web_launch/journey-ui.mjs'], { cwd: root });
  await fs.writeFile(path.join(directory, 'journey-ui.mjs'), demo);
  const release = JSON.parse(await fs.readFile(path.join(directory, 'release.json'), 'utf8'));
  Object.assign(release.files.find(row => row.name === 'journey-ui.mjs'), { bytes: demo.length, sha256: hash(demo) });
  release.source_selection = { unowned_demo_source: 'HEAD:web_launch/journey-ui.mjs', base_commit: report.base_commit, working_copy_preserved: true };
  await fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(release, null, 2) + '\n');
  const names = await fs.readdir(directory); assert.deepEqual(new Set(names), new Set([...Object.keys(PUBLIC_ASSETS), '_worker.js', '_routes.json', 'release.json']));
  for (const row of release.files) { const bytes = await fs.readFile(path.join(directory, row.name)); assert.equal(bytes.length, row.bytes); assert.equal(hash(bytes), row.sha256, row.name); }
  for (const name of ['real-journey.mjs', 'real-journey.html', 'live-location.mjs']) assert.deepEqual(await fs.readFile(path.join(directory, name)), await read('web_launch/' + name));
  assert.deepEqual(await fs.readFile(path.join(directory, '_worker.js')), await read('web_launch/dist-neon-address-ui-20261004/_worker.js'));
  for (const [n, digest] of Object.entries({ ...report.source_sha256, ...report.preserved_sha256 })) assert.equal(hash(await read(n)), digest, n);
  report.screenshot_sha256 = Object.fromEntries(await Promise.all(['meeting-address-current-390x844.png', 'meeting-address-atelier-390x844.png'].map(async n => [n, hash(await read(proof + '/' + n))])));
  report.public_files = names.length; report.directory = directory; report.release_sha256 = hash(await fs.readFile(path.join(directory, 'release.json')));
  report.status = 'PASS_LOCAL_ADDRESS_NAVIGATION_CLOSURE'; report.published = false;
  report.maps_provider = report.signed_http_jwt = report.live_accounts = report.physical_android = 'NOT_RUN';
} catch (error) { report.error = error.message; throw error; }
finally { await fs.writeFile(path.join(root, proof, 'NAVIGATION_ACCEPTANCE.json'), JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, checks: report.chromium_checks, mutation: report.mutation_rejected, files: report.public_files, release_sha256: report.release_sha256 }));
