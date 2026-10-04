// Reconcile accepted local proofs, kill an isolated DOM-purge mutant and build
// one reviewable candidate. No provider calls, activation or publication.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => fs.readFile(path.join(root, name));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const proof = 'artifacts/overnight-20261004', outputName = 'dist-neon-outcomes-ui-20261004';
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Local browser/UI and reviewable package with synthetic accounts; no production or physical Android proof' };
const preserved = ['web_launch/journey-ui.mjs', 'web_launch/atelier.mjs', 'web_launch/atelier.css', 'web_launch/studio.mjs',
  'web_launch/dist-neon-real-journey-20261003/release.json', 'web_launch/dist-neon-outcomes-api-20261004/release.json',
  proof + '/CASE_OUTCOME_BROWSER.json', proof + '/outcome-current-390x844.png', proof + '/outcome-confirmed-panel.png', proof + '/outcome-atelier-390x844.png'];
report.preserved_sha256 = Object.fromEntries(await Promise.all(preserved.map(async name => [name, hash(await read(name))])));
try {
  report.base_commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  for (const name of ['CASE_OUTCOME_SQL', 'CASE_OUTCOME_GATEWAY', 'CASE_OUTCOME_CLIENT', 'CASE_OUTCOME_BROWSER']) {
    const receipt = JSON.parse((await read(proof + '/' + name + '.json')).toString('utf8'));
    assert.match(receipt.status, /^PASS_LOCAL_/);
    for (const [source, digest] of Object.entries(receipt.source_sha256)) assert.equal(hash(await read(source)), digest, name + ' source drift: ' + source);
  }
  report.reused_proof = 'Exact source hashes matched SQL, API, client and canonical Chromium receipts; unchanged full suites not rerun';
  const mutation = spawnSync(process.execPath, ['tools/case-outcome-browser-acceptance.mjs', '--mutate-purge'], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  assert.notEqual(mutation.status, 0, 'DOM-purge mutant escaped the browser guard');
  const mutantReceipt = JSON.parse((await read(proof + '/OUTCOME_UI_MUTATION.json')).toString('utf8'));
  assert.match(mutantReceipt.error, /Private outcome DOM survived logout/);
  assert.equal(mutantReceipt.checks.both_receiver_acceptances_confirm_all_results, true);
  report.dom_purge_mutation_rejected = true;
  report.mutation_scope = 'Chromium route serves an isolated source variant without outcome purge on logout; canonical files and screenshots preserved';
  const modes = execFileSync(process.execPath, ['--test', '--test-reporter=tap', 'web_launch/real-journey-mode-editor.test.mjs'], { cwd: root, encoding: 'utf8' });
  assert.match(modes, /# pass 2/); assert.match(modes, /# fail 0/); report.mode_editor_regression_tests = 2;
  report.build = JSON.parse(execFileSync(process.execPath, ['neon/build.mjs', outputName], { cwd: root, encoding: 'utf8' }));
  const directory = path.join(root, 'web_launch', outputName);
  const acceptedDemo = execFileSync('git', ['show', 'HEAD:web_launch/journey-ui.mjs'], { cwd: root });
  await fs.writeFile(path.join(directory, 'journey-ui.mjs'), acceptedDemo);
  const release = JSON.parse(await fs.readFile(path.join(directory, 'release.json'), 'utf8'));
  Object.assign(release.files.find(row => row.name === 'journey-ui.mjs'), { bytes: acceptedDemo.length, sha256: hash(acceptedDemo) });
  release.source_selection = { unowned_demo_source: 'HEAD:web_launch/journey-ui.mjs', base_commit: report.base_commit, working_copy_preserved: true };
  await fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(release, null, 2) + '\n');
  assert.deepEqual(new Set(await fs.readdir(directory)), new Set([...Object.keys(PUBLIC_ASSETS), '_worker.js', '_routes.json', 'release.json']));
  for (const row of release.files) { const bytes = await fs.readFile(path.join(directory, row.name)); assert.equal(bytes.length, row.bytes, row.name); assert.equal(hash(bytes), row.sha256, row.name); }
  for (const name of ['real-journey.html', 'real-journey.mjs', 'real-journey-client.mjs', 'neon-store.mjs']) assert.equal(hash(await fs.readFile(path.join(directory, name))), hash(await read('web_launch/' + name)), name);
  assert.equal(hash(await fs.readFile(path.join(directory, '_worker.js'))), hash(await read('web_launch/dist-neon-outcomes-api-20261004/_worker.js')));
  report.worker_proof = 'Bundled Worker bytes exactly match the prior gated API candidate; new UI assets match Chromium-accepted source';
  for (const [name, digest] of Object.entries(report.preserved_sha256)) assert.equal(hash(await read(name)), digest, 'Preserved evidence drift: ' + name);
  report.directory = directory; report.public_files = release.files.length + 1; report.release_sha256 = hash(await fs.readFile(path.join(directory, 'release.json')));
  report.source_sha256 = { 'tools/case-outcome-ui-release-acceptance.mjs': hash(await read('tools/case-outcome-ui-release-acceptance.mjs')) };
  report.status = 'PASS_LOCAL_OUTCOME_UI_RELEASE'; report.published = false;
  report.live_accounts = report.signed_http_jwt = report.physical_android = 'NOT_RUN';
} catch (error) { report.error = error.message; throw error; }
finally { await fs.writeFile(path.join(root, proof, 'CASE_OUTCOME_UI_RELEASE.json'), JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, dom_purge_mutation_rejected: report.dom_purge_mutation_rejected, files: report.public_files, release_sha256: report.release_sha256 }));
