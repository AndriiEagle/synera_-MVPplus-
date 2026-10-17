// Close one local UI step; keep old acceptance artifacts and public releases intact.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
const root = fileURLToPath(new URL('../', import.meta.url)), proof = 'artifacts/overnight-20261004';
const read = name => fs.readFile(path.join(root, name)), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Local Chromium address flow and preserved outcome UI; synthetic accounts/RPC, not SQL via HTTP, signed JWT, live people, Maps or Android hardware' };
const sources = ['web_launch/real-journey.html', 'web_launch/real-journey.mjs', 'tools/meeting-address-browser.mjs', 'tools/meeting-address-ui-acceptance.mjs'];
const preserved = ['web_launch/journey-ui.mjs', 'web_launch/real-journey.css', 'web_launch/real-journey-client.mjs', 'web_launch/neon-store.mjs',
  'web_launch/assets.mjs', 'web_launch/atelier.mjs', 'web_launch/atelier.css', 'tools/case-outcome-browser-acceptance.mjs',
  proof + '/CASE_OUTCOME_BROWSER.json', proof + '/CASE_SOCIAL_BROWSER.json',
  'web_launch/dist-neon-address-client-20261004/release.json', 'web_launch/dist-neon-address-api-20261004/release.json'];
report.source_sha256 = Object.fromEntries(await Promise.all(sources.map(async name => [name, hash(await read(name))])));
report.preserved_sha256 = Object.fromEntries(await Promise.all(preserved.map(async name => [name, hash(await read(name))])));
const run = (args, input) => spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 60000, maxBuffer: 8 * 1024 * 1024, ...(input ? { input } : {}) });
try {
  report.base_commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const baseline = JSON.parse(await read(proof + '/MEETING_ADDRESS_UI_BASELINE.json')); assert.equal(baseline.status, 'PASS_PRESERVED_ADDRESS_CHAT_BASELINE');
  const red = JSON.parse(await read(proof + '/MEETING_ADDRESS_UI_RED.json')); assert.match(red.error, /Address UI missing/);
  const mutation = JSON.parse(await read(proof + '/MEETING_ADDRESS_UI_MUTATION.json')); assert.match(mutation.error, /Private address DOM survived logout/);
  report.logout_purge_mutation_rejected = true; report.mutation_scope = 'Only clearAddress call removed from clearPrivate in browser-delivered source; canonical source untouched';
  let browser = JSON.parse(await read(proof + '/MEETING_ADDRESS_BROWSER.json'));
  const reusableBrowser = browser.status === 'PASS_LOCAL_MEETING_ADDRESS_BROWSER' &&
    (await Promise.all(Object.entries(browser.source_sha256).map(async ([name, digest]) => hash(await read(name)) === digest))).every(Boolean);
  if (!reusableBrowser) {
    const canonical = run(['tools/meeting-address-browser.mjs']); assert.equal(canonical.status, 0, canonical.stdout + canonical.stderr);
    browser = JSON.parse(await read(proof + '/MEETING_ADDRESS_BROWSER.json'));
  }
  report.reused_browser_by_exact_source_hashes = reusableBrowser;
  assert.equal(browser.status, 'PASS_LOCAL_MEETING_ADDRESS_BROWSER'); assert.equal(browser.external_requests, 0);
  for (const [name, digest] of Object.entries(browser.source_sha256)) assert.equal(hash(await read(name)), digest, name);
  report.browser_checks = browser.checks; report.address_checks = Object.keys(browser.checks).length;
  // Rerun the affected outcome/private-purge path, with its existing oracle and
  // a new output directory; do not rewrite previously accepted evidence.
  const regressionName = 'tools/case-outcome-browser-acceptance.mjs', regressionProof = proof + '/address-ui-regression';
  await fs.mkdir(path.join(root, regressionProof), { recursive: true });
  const original = (await read(regressionName)).toString('utf8'), marker = "'artifacts/overnight-20261004'";
  assert.equal(original.split(marker).length, 2);
  const adapted = original.replace(marker, JSON.stringify(regressionProof)).replace(/from (['"])(\.[^'"]+)\1/g,
    (match, quote, relative) => 'from ' + JSON.stringify(pathToFileURL(path.resolve(root, path.dirname(regressionName), relative)).href))
    .replace(/from (['"])(playwright|@axe-core\/playwright)\1/g, (match, quote, name) => 'from ' + JSON.stringify(import.meta.resolve(name)))
    .replace("assert.equal(await a.locator('#real-outcome-cards [data-outcome-index]').count(), 2);", "assert.equal(await a.locator('#real-outcome-cards [data-outcome-index]').count(), 2, 'Outcome cards unavailable: ' + await a.locator('#real-status').innerText());");
  report.regression_runner_sha256 = hash(Buffer.from(adapted));
  const runner = path.join(root, regressionProof, 'runner.mjs'); await fs.writeFile(runner, adapted);
  const regression = run([runner]);
  assert.equal(regression.status, 0, regression.stdout + regression.stderr);
  const outcome = JSON.parse(await read(regressionProof + '/CASE_OUTCOME_BROWSER.json')); assert.equal(outcome.status, 'PASS_LOCAL_OUTCOME_BROWSER');
  for (const [name, digest] of Object.entries(outcome.source_sha256)) assert.equal(hash(await read(name)), digest, name);
  report.preserved_outcome_checks = outcome.checks; report.regression_checks = Object.keys(outcome.checks).length;
  for (const receiptName of ['MEETING_ADDRESS_SQL.json', 'MEETING_ADDRESS_GATEWAY.json', 'MEETING_ADDRESS_CLIENT.json']) {
    const receipt = JSON.parse(await read(proof + '/' + receiptName)); assert.match(receipt.status, /^PASS_LOCAL_/);
    for (const [name, digest] of Object.entries(receipt.source_sha256)) assert.equal(hash(await read(name)), digest, 'Reused proof drift: ' + name);
  }
  report.reused_proof = 'SQL/API/client source_sha256 maps match; their historical preserved UI hashes are not claimed current. PG and unchanged unit suites not rerun.';
  const outputName = 'dist-neon-address-ui-20261004';
  report.build = JSON.parse(execFileSync(process.execPath, ['neon/build.mjs', outputName], { cwd: root, encoding: 'utf8' }));
  const directory = path.join(root, 'web_launch', outputName), demo = execFileSync('git', ['show', 'HEAD:web_launch/journey-ui.mjs'], { cwd: root });
  await fs.writeFile(path.join(directory, 'journey-ui.mjs'), demo);
  const release = JSON.parse(await fs.readFile(path.join(directory, 'release.json'), 'utf8'));
  Object.assign(release.files.find(row => row.name === 'journey-ui.mjs'), { bytes: demo.length, sha256: hash(demo) });
  release.source_selection = { unowned_demo_source: 'HEAD:web_launch/journey-ui.mjs', base_commit: report.base_commit, working_copy_preserved: true };
  await fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(release, null, 2) + '\n');
  const names = await fs.readdir(directory); assert.deepEqual(new Set(names), new Set([...Object.keys(PUBLIC_ASSETS), '_worker.js', '_routes.json', 'release.json']));
  for (const row of release.files) { const bytes = await fs.readFile(path.join(directory, row.name)); assert.equal(bytes.length, row.bytes); assert.equal(hash(bytes), row.sha256, row.name); }
  for (const name of ['real-journey.html', 'real-journey.mjs', 'real-journey-client.mjs', 'neon-store.mjs']) assert.deepEqual(await fs.readFile(path.join(directory, name)), await read('web_launch/' + name));
  assert.deepEqual(await fs.readFile(path.join(directory, '_worker.js')), await read('web_launch/dist-neon-address-client-20261004/_worker.js'));
  for (const [name, digest] of Object.entries({ ...report.source_sha256, ...report.preserved_sha256 })) assert.equal(hash(await read(name)), digest, name);
  report.screenshot_sha256 = Object.fromEntries(await Promise.all(['meeting-address-current-390x844.png', 'meeting-address-atelier-390x844.png'].map(async name => [name, hash(await read(proof + '/' + name))])));
  report.status = 'PASS_LOCAL_MEETING_ADDRESS_UI'; report.directory = directory; report.public_files = names.length;
  report.release_sha256 = hash(await fs.readFile(path.join(directory, 'release.json'))); report.published = false;
  report.live_accounts = report.signed_http_jwt = report.physical_android = report.google_maps = 'NOT_RUN';
} catch (error) { report.error = error.message; throw error; }
finally { await fs.writeFile(path.join(root, proof, 'MEETING_ADDRESS_UI.json'), JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, address_checks: report.address_checks, preserved_outcome_checks: report.regression_checks, mutation: report.logout_purge_mutation_rejected, files: report.public_files }));
