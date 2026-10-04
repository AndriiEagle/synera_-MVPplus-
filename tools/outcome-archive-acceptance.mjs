// Read-only archive closure: current semantic tests, already-run browser oracle,
// actual mutant rejection and separately built local candidate. Never deploys.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), proof = 'artifacts/overnight-20261004';
const read = name => fs.readFile(path.join(root, name)), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Local read-only viewer and synthetic archived attestations; no restore, live authentication or production publication' };
const preserved = ['web_launch/journey-ui.mjs', 'web_launch/archive-codec.mjs', 'web_launch/atelier.mjs', 'web_launch/studio.mjs', 'web_launch/real-journey.mjs',
  'artifacts/overnight-20261004/outcome-export-plain.json', 'artifacts/overnight-20261004/outcome-export-gzip.json',
  'web_launch/dist-neon-real-journey-20261003/release.json', 'web_launch/dist-neon-outcomes-api-20261004/release.json',
  'web_launch/dist-neon-outcomes-ui-20261004/release.json', 'web_launch/dist-neon-outcomes-export-20261004/release.json'];
report.preserved_sha256 = Object.fromEntries(await Promise.all(preserved.map(async name => [name, hash(await read(name))])));
const sourceNames = ['web_launch/outcome-archive.html', 'web_launch/outcome-archive.mjs', 'web_launch/outcome-archive-ui.mjs', 'web_launch/outcome-archive.test.mjs',
  'web_launch/assets.mjs', 'web_launch/real-journey-client.mjs', 'web_launch/real-journey.html', 'tools/outcome-archive-browser.mjs', 'tools/outcome-archive-acceptance.mjs'];
report.source_sha256 = Object.fromEntries(await Promise.all(sourceNames.map(async name => [name, hash(await read(name))])));
const counts = tap => Object.fromEntries(['pass', 'fail', 'skipped'].map(label => [label, Number(tap.match(new RegExp('# ' + label + ' (\\d+)'))?.[1])]));
try {
  report.base_commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const tests = ['web_launch/outcome-archive.test.mjs', 'web_launch/case-outcome-export.test.mjs', 'web_launch/archive-codec.test.mjs',
    'web_launch/case-outcome-client.test.mjs', 'web_launch/real-journey-client.test.mjs', 'web_launch/neon-store.test.mjs'];
  const tap = execFileSync(process.execPath, ['--test', '--test-reporter=tap', ...tests], { cwd: root, encoding: 'utf8' });
  report.tests = { command: 'node --test ' + tests.join(' '), ...counts(tap) };
  assert.equal(report.tests.pass, 38); assert.equal(report.tests.fail, 0); assert.equal(report.tests.skipped, 0);
  const filter = ['--test', '--test-reporter=tap', '--test-name-pattern=allowlist|extensionless', 'neon/worker.test.mjs'];
  report.allowlist_tests = { command: 'node ' + filter.join(' '), ...counts(execFileSync(process.execPath, filter, { cwd: root, encoding: 'utf8' })) };
  assert.equal(report.allowlist_tests.pass, 3); assert.equal(report.allowlist_tests.fail, 0);
  const browser = JSON.parse(await read(proof + '/OUTCOME_ARCHIVE_BROWSER.json'));
  const mutation = JSON.parse(await read(proof + '/OUTCOME_ARCHIVE_MUTATION.json'));
  assert.equal(browser.status, 'PASS_LOCAL_OUTCOME_ARCHIVE_BROWSER'); assert.equal(browser.api_or_external_requests, 0);
  assert.equal(browser.no_private_storage, true); assert.equal(browser.axe_current, 0); assert.equal(browser.axe_atelier, 0);
  assert.equal(mutation.status, 'NOT_ACCEPTED'); assert.match(mutation.error, /Cleared archive returned after pending decode/);
  for (const receipt of [browser, mutation]) for (const [name, digest] of Object.entries(receipt.source_sha256)) assert.equal(hash(await read(name)), digest, name);
  report.browser_checks = browser.checks; report.clear_generation_mutation_rejected = true;
  report.mutation_scope = 'Only stale-decode generation guard removed by local browser route; accepted sources unchanged';
  const sql = JSON.parse(await read(proof + '/CASE_OUTCOME_SQL.json'));
  for (const [name, digest] of Object.entries(sql.source_sha256)) assert.equal(hash(await read(name)), digest, name);
  report.sql_reused = 'SQL source hashes match; PostgreSQL unchanged and stopped';
  const outputName = 'dist-neon-outcomes-viewer-20261004';
  report.build = JSON.parse(execFileSync(process.execPath, ['neon/build.mjs', outputName], { cwd: root, encoding: 'utf8' }));
  const directory = path.join(root, 'web_launch', outputName), committedDemo = execFileSync('git', ['show', 'HEAD:web_launch/journey-ui.mjs'], { cwd: root });
  await fs.writeFile(path.join(directory, 'journey-ui.mjs'), committedDemo);
  const release = JSON.parse(await fs.readFile(path.join(directory, 'release.json'), 'utf8'));
  Object.assign(release.files.find(row => row.name === 'journey-ui.mjs'), { bytes: committedDemo.length, sha256: hash(committedDemo) });
  release.source_selection = { unowned_demo_source: 'HEAD:web_launch/journey-ui.mjs', base_commit: report.base_commit, working_copy_preserved: true };
  await fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(release, null, 2) + '\n');
  assert.deepEqual(new Set(await fs.readdir(directory)), new Set([...Object.keys(PUBLIC_ASSETS), '_worker.js', '_routes.json', 'release.json']));
  for (const row of release.files) { const bytes = await fs.readFile(path.join(directory, row.name)); assert.equal(bytes.length, row.bytes); assert.equal(hash(bytes), row.sha256, row.name); }
  for (const name of ['outcome-archive.html', 'outcome-archive.mjs', 'outcome-archive-ui.mjs', 'real-journey-client.mjs', 'real-journey.html', 'archive-codec.mjs']) {
    assert.equal(hash(await fs.readFile(path.join(directory, name))), hash(await read('web_launch/' + name)), name);
  }
  // Exercise the actual bundle's new public route and closed outcome gate locally.
  const bytes = await fs.readFile(path.join(directory, '_worker.js'));
  const { default: worker } = await import('data:text/javascript;base64,' + bytes.toString('base64'));
  const origin = 'https://local-fixture.pages.dev', assetRequests = [];
  const env = { SYNERA_SITE_URL: origin, ASSETS: { fetch: async request => { const name = new URL(request.url).pathname; assetRequests.push(name); return new Response(await fs.readFile(path.join(directory, name === '/outcome-archive' ? 'outcome-archive.html' : name.slice(1)))); } } };
  for (const pathname of ['/outcome-archive', '/outcome-archive.html', '/outcome-archive.mjs', '/outcome-archive-ui.mjs']) {
    const response = await worker.fetch(new Request(origin + pathname), env); assert.equal(response.status, 200);
    assert.ok((await response.text()).length > 0);
  }
  const before = assetRequests.length;
  for (const pathname of ['/outcome-archive.test.mjs', '/case-outcome.migration.sql', '/release.json']) assert.equal((await worker.fetch(new Request(origin + pathname), env)).status, 404);
  const closed = await worker.fetch(new Request(origin + '/api/neon/outcomes/pair-x', { method: 'POST', headers: { Origin: origin, 'X-Synera-Client': '1', 'Content-Type': 'application/json' }, body: '{}' }), env);
  assert.equal(closed.status, 503); assert.equal(assetRequests.length, before);
  report.bundled_public_routes = 4; report.private_assets_denied = 3; report.closed_outcome_gate = 503;
  for (const [name, digest] of Object.entries({ ...report.source_sha256, ...report.preserved_sha256 })) assert.equal(hash(await read(name)), digest, name);
  report.status = 'PASS_LOCAL_OUTCOME_ARCHIVE'; report.directory = directory; report.public_files = release.files.length + 1;
  report.release_sha256 = hash(await fs.readFile(path.join(directory, 'release.json')));
  report.published = false; report.live_accounts = report.signed_http_jwt = report.physical_android = 'NOT_RUN';
} catch (error) { report.error = error.message; throw error; }
finally { await fs.writeFile(path.join(root, proof, 'OUTCOME_ARCHIVE.json'), JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, tests: report.tests, allowlist_tests: report.allowlist_tests, mutation_rejected: report.clear_generation_mutation_rejected, files: report.public_files, release_sha256: report.release_sha256 }));
