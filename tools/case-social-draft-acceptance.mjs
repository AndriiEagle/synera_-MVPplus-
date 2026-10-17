// Bound local social-draft acceptance: current tests, one session-epoch mutant,
// already-run Chromium proof and a separate package. No provider or publishing.
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
  scope: 'Local deterministic private draft from synthetic server attestations, not live JWT/accounts/SQL, OAuth, public AI or social publication' };
const preserved = ['web_launch/journey-ui.mjs', 'web_launch/archive-codec.mjs', 'web_launch/session-value.mjs', 'web_launch/session-value.test.mjs',
  'web_launch/atelier.mjs', 'web_launch/studio.mjs', 'web_launch/assets.mjs', 'web_launch/outcome-archive.html', 'web_launch/outcome-archive.mjs', 'web_launch/outcome-archive-ui.mjs',
  'web_launch/dist-neon-real-journey-20261003/release.json', 'web_launch/dist-neon-outcomes-api-20261004/release.json',
  'web_launch/dist-neon-outcomes-ui-20261004/release.json', 'web_launch/dist-neon-outcomes-export-20261004/release.json', 'web_launch/dist-neon-outcomes-viewer-20261004/release.json'];
report.preserved_sha256 = Object.fromEntries(await Promise.all(preserved.map(async name => [name, hash(await read(name))])));
const sourceNames = ['web_launch/real-journey-client.mjs', 'web_launch/real-journey.mjs', 'web_launch/real-journey.html',
  'web_launch/case-social-draft.test.mjs', 'tools/case-social-draft-browser.mjs', 'tools/case-social-draft-acceptance.mjs'];
report.source_sha256 = Object.fromEntries(await Promise.all(sourceNames.map(async name => [name, hash(await read(name))])));
try {
  report.base_commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const tests = ['web_launch/case-social-draft.test.mjs', 'web_launch/session-value.test.mjs', 'web_launch/outcome-archive.test.mjs',
    'web_launch/case-outcome-export.test.mjs', 'web_launch/archive-codec.test.mjs', 'web_launch/case-outcome-client.test.mjs',
    'web_launch/real-journey-client.test.mjs', 'web_launch/neon-store.test.mjs'];
  const tap = execFileSync(process.execPath, ['--test', '--test-reporter=tap', ...tests], { cwd: root, encoding: 'utf8' });
  const count = label => Number(tap.match(new RegExp('# ' + label + ' (\\d+)'))?.[1]);
  report.tests = { command: 'node --test ' + tests.join(' '), pass: count('pass'), fail: count('fail'), skipped: count('skipped') };
  assert.equal(report.tests.pass, 49); assert.equal(report.tests.fail, 0); assert.equal(report.tests.skipped, 0);
  const moduleName = 'web_launch/real-journey-client.mjs', testName = 'web_launch/case-social-draft.test.mjs';
  const absolute = (source, name) => source.replace(/from (['"])(\.[^'"]+)\1/g, (match, quote, relative) => 'from ' + JSON.stringify(pathToFileURL(path.resolve(root, path.dirname(name), relative)).href));
  const uri = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
  const original = (await read(moduleName)).toString('utf8'), marker = ' || socialEpoch !== this.#outcomeEpoch';
  assert.equal(original.split(marker).length, 2);
  const mutant = uri(absolute(original.replace(marker, ''), moduleName));
  const oracle = absolute((await read(testName)).toString('utf8'), testName).replace(JSON.stringify(pathToFileURL(path.join(root, moduleName)).href), JSON.stringify(mutant));
  const mutation = spawnSync(process.execPath, ['--input-type=module', '--test-reporter=tap'], { cwd: root, encoding: 'utf8', input: 'await import(' + JSON.stringify(uri(oracle)) + ');', maxBuffer: 8 * 1024 * 1024 });
  assert.notEqual(mutation.status, 0); assert.match(mutation.stdout, /not ok[^\n]+logout and same-account restore after outcome read/); assert.match(mutation.stdout, /Missing expected rejection/);
  report.session_epoch_mutation_rejected = true; report.mutation_scope = 'Only socialDraft epoch check removed in isolated module; accepted source unchanged';
  const browser = JSON.parse(await read(proof + '/CASE_SOCIAL_BROWSER.json'));
  assert.equal(browser.status, 'PASS_LOCAL_CASE_SOCIAL_BROWSER'); assert.equal(browser.external_requests, 0); assert.equal(browser.no_private_storage, true);
  for (const [name, digest] of Object.entries(browser.source_sha256)) assert.equal(hash(await read(name)), digest, name);
  const red = JSON.parse(await read(proof + '/CASE_SOCIAL_BROWSER_RED.json'));
  assert.match(red.error, /Revoked draft consent allowed a late private draft/); report.browser_checks = browser.checks;
  report.explicit_private_scope = 'Actor contribution only; no evidence, checks or partner identity in generated text; manual selection, no OS clipboard or publication';
  const sql = JSON.parse(await read(proof + '/CASE_OUTCOME_SQL.json'));
  for (const [name, digest] of Object.entries(sql.source_sha256)) assert.equal(hash(await read(name)), digest, name);
  report.reused_sql_proof = 'SQL source hashes match, database unchanged and stopped';
  const outputName = 'dist-neon-outcomes-social-20261004';
  report.build = JSON.parse(execFileSync(process.execPath, ['neon/build.mjs', outputName], { cwd: root, encoding: 'utf8' }));
  const directory = path.join(root, 'web_launch', outputName), committedDemo = execFileSync('git', ['show', 'HEAD:web_launch/journey-ui.mjs'], { cwd: root });
  await fs.writeFile(path.join(directory, 'journey-ui.mjs'), committedDemo);
  const release = JSON.parse(await fs.readFile(path.join(directory, 'release.json'), 'utf8'));
  Object.assign(release.files.find(row => row.name === 'journey-ui.mjs'), { bytes: committedDemo.length, sha256: hash(committedDemo) });
  release.source_selection = { unowned_demo_source: 'HEAD:web_launch/journey-ui.mjs', base_commit: report.base_commit, working_copy_preserved: true };
  await fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(release, null, 2) + '\n');
  assert.deepEqual(new Set(await fs.readdir(directory)), new Set([...Object.keys(PUBLIC_ASSETS), '_worker.js', '_routes.json', 'release.json']));
  for (const row of release.files) { const bytes = await fs.readFile(path.join(directory, row.name)); assert.equal(bytes.length, row.bytes); assert.equal(hash(bytes), row.sha256, row.name); }
  for (const name of ['real-journey.html', 'real-journey.mjs', 'real-journey-client.mjs', 'session-value.mjs']) assert.equal(hash(await fs.readFile(path.join(directory, name))), hash(await read('web_launch/' + name)));
  assert.equal(hash(await fs.readFile(path.join(directory, '_worker.js'))), hash(await read('web_launch/dist-neon-outcomes-viewer-20261004/_worker.js')));
  for (const [name, digest] of Object.entries({ ...report.source_sha256, ...report.preserved_sha256 })) assert.equal(hash(await read(name)), digest, name);
  report.status = 'PASS_LOCAL_CASE_SOCIAL_DRAFT'; report.directory = directory; report.public_files = release.files.length + 1;
  report.release_sha256 = hash(await fs.readFile(path.join(directory, 'release.json'))); report.published = false;
  report.live_accounts = report.signed_http_jwt = report.physical_android = report.linkedin_oauth = 'NOT_RUN';
} catch (error) { report.error = error.message; throw error; }
finally { await fs.writeFile(path.join(root, proof, 'CASE_SOCIAL_DRAFT.json'), JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, tests: report.tests, session_epoch_mutation_rejected: report.session_epoch_mutation_rejected, files: report.public_files, release_sha256: report.release_sha256 }));
