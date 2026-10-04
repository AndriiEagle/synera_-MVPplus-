// Local export closure: semantic tests, one session-epoch mutant, decoded real
// Chromium downloads and a separately assembled review candidate. No publishing.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), proof = 'artifacts/overnight-20261004';
const read = name => fs.readFile(path.join(root, name)), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Local explicit archive download, codec round-trip and synthetic account transport; not live authentication or complete account backup' };
const preserved = ['web_launch/journey-ui.mjs', 'web_launch/archive-codec.mjs', 'web_launch/atelier.mjs', 'web_launch/studio.mjs',
  'web_launch/dist-neon-real-journey-20261003/release.json', 'web_launch/dist-neon-outcomes-api-20261004/release.json', 'web_launch/dist-neon-outcomes-ui-20261004/release.json'];
report.preserved_sha256 = Object.fromEntries(await Promise.all(preserved.map(async name => [name, hash(await read(name))])));
const sourceNames = ['web_launch/real-journey-client.mjs', 'web_launch/real-journey.mjs', 'web_launch/real-journey.html',
  'web_launch/case-outcome-export.test.mjs', 'web_launch/archive-codec.test.mjs', 'tools/case-outcome-export-browser.mjs', 'tools/case-outcome-export-acceptance.mjs'];
report.source_sha256 = Object.fromEntries(await Promise.all(sourceNames.map(async name => [name, hash(await read(name))])));
try {
  report.base_commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const tests = ['web_launch/case-outcome-export.test.mjs', 'web_launch/archive-codec.test.mjs', 'web_launch/case-outcome-client.test.mjs', 'web_launch/real-journey-client.test.mjs', 'web_launch/neon-store.test.mjs'];
  const tap = execFileSync(process.execPath, ['--test', '--test-reporter=tap', ...tests], { cwd: root, encoding: 'utf8' });
  const count = label => Number(tap.match(new RegExp('# ' + label + ' (\\d+)'))?.[1]);
  assert.equal(count('pass'), 34); assert.equal(count('fail'), 0); assert.equal(count('skipped'), 0);
  report.tests = { command: 'node --test ' + tests.join(' '), pass: count('pass'), fail: count('fail'), skipped: count('skipped') };
  const moduleName = 'web_launch/real-journey-client.mjs', testName = 'web_launch/case-outcome-export.test.mjs';
  const absoluteImports = (source, name) => source.replace(/from (['"])(\.[^'"]+)\1/g,
    (match, quote, relative) => 'from ' + JSON.stringify(pathToFileURL(path.resolve(root, path.dirname(name), relative)).href));
  const dataModule = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
  const original = (await read(moduleName)).toString('utf8'), marker = ' || epoch !== this.#outcomeEpoch'; assert.equal(original.split(marker).length, 2);
  const mutant = dataModule(absoluteImports(original.replace(marker, ''), moduleName));
  const testSource = absoluteImports((await read(testName)).toString('utf8'), testName).replace(JSON.stringify(pathToFileURL(path.join(root, moduleName)).href), JSON.stringify(mutant));
  const mutation = spawnSync(process.execPath, ['--input-type=module', '--test-reporter=tap'], { cwd: root, encoding: 'utf8', input: 'await import(' + JSON.stringify(dataModule(testSource)) + ');', maxBuffer: 8 * 1024 * 1024 });
  assert.notEqual(mutation.status, 0); assert.match(mutation.stdout, /not ok[^\n]+logout and restore of the same account/); assert.match(mutation.stdout, /Missing expected rejection/);
  report.compression_session_epoch_mutation_rejected = true;
  report.mutation_scope = 'Only export epoch check removed in an isolated imported module; accepted source unchanged';
  const browser = JSON.parse((await read(proof + '/CASE_OUTCOME_EXPORT_BROWSER.json')).toString('utf8'));
  assert.equal(browser.status, 'PASS_LOCAL_OUTCOME_EXPORT_BROWSER'); assert.equal(browser.logout_cancels_pending_download, true);
  for (const [name, digest] of Object.entries(browser.source_sha256)) assert.equal(hash(await read(name)), digest, name);
  for (const item of browser.downloads) assert.equal(hash(await read(item.file)), item.sha256, item.file);
  report.downloads = browser.downloads;
  for (const receiptName of ['CASE_OUTCOME_SQL', 'CASE_OUTCOME_GATEWAY']) {
    const prior = JSON.parse((await read(proof + '/' + receiptName + '.json')).toString('utf8'));
    for (const [name, digest] of Object.entries(prior.source_sha256)) assert.equal(hash(await read(name)), digest, 'Prior server proof drift: ' + name);
  }
  report.reused_server_proof = 'SQL and API exact source hashes still match; updated client and codec tested freshly';
  const outputName = 'dist-neon-outcomes-export-20261004';
  report.build = JSON.parse(execFileSync(process.execPath, ['neon/build.mjs', outputName], { cwd: root, encoding: 'utf8' }));
  const directory = path.join(root, 'web_launch', outputName), acceptedDemo = execFileSync('git', ['show', 'HEAD:web_launch/journey-ui.mjs'], { cwd: root });
  await fs.writeFile(path.join(directory, 'journey-ui.mjs'), acceptedDemo);
  const release = JSON.parse(await fs.readFile(path.join(directory, 'release.json'), 'utf8'));
  Object.assign(release.files.find(row => row.name === 'journey-ui.mjs'), { bytes: acceptedDemo.length, sha256: hash(acceptedDemo) });
  release.source_selection = { unowned_demo_source: 'HEAD:web_launch/journey-ui.mjs', base_commit: report.base_commit, working_copy_preserved: true };
  await fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(release, null, 2) + '\n');
  assert.deepEqual(new Set(await fs.readdir(directory)), new Set([...Object.keys(PUBLIC_ASSETS), '_worker.js', '_routes.json', 'release.json']));
  for (const row of release.files) { const bytes = await fs.readFile(path.join(directory, row.name)); assert.equal(bytes.length, row.bytes, row.name); assert.equal(hash(bytes), row.sha256, row.name); }
  for (const name of ['real-journey.html', 'real-journey.mjs', 'real-journey-client.mjs', 'archive-codec.mjs']) assert.equal(hash(await fs.readFile(path.join(directory, name))), hash(await read('web_launch/' + name)));
  assert.equal(hash(await fs.readFile(path.join(directory, '_worker.js'))), hash(await read('web_launch/dist-neon-outcomes-ui-20261004/_worker.js')));
  for (const [name, digest] of Object.entries({ ...report.preserved_sha256, ...report.source_sha256 })) assert.equal(hash(await read(name)), digest, name);
  report.directory = directory; report.public_files = release.files.length + 1; report.release_sha256 = hash(await fs.readFile(path.join(directory, 'release.json')));
  report.status = 'PASS_LOCAL_OUTCOME_EXPORT'; report.published = false;
  report.live_accounts = report.signed_http_jwt = report.physical_android = 'NOT_RUN';
} catch (error) { report.error = error.message; throw error; }
finally { await fs.writeFile(path.join(root, proof, 'CASE_OUTCOME_EXPORT.json'), JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, tests: report.tests, compression_session_epoch_mutation_rejected: report.compression_session_epoch_mutation_rejected, files: report.public_files, release_sha256: report.release_sha256 }));
