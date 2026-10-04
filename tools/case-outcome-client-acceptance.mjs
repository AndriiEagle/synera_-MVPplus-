// Local semantic closure and isolated mutation. No external calls or publication.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => fs.readFile(path.join(root, name));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const artifact = path.join(root, 'artifacts/overnight-20261004/CASE_OUTCOME_CLIENT.json');
const sources = ['web_launch/neon-store.mjs', 'web_launch/real-journey-client.mjs', 'web_launch/case-outcome-client.test.mjs',
  'web_launch/real-journey-client.test.mjs', 'web_launch/neon-store.test.mjs', 'tools/fixtures/real-journey-fixture.mjs',
  'tools/case-outcome-client-acceptance.mjs'];
const preserved = ['web_launch/journey-ui.mjs', 'web_launch/dist-neon-real-journey-20261003/release.json',
  'web_launch/dist-neon-outcomes-api-20261004/release.json'];
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Local client and synthetic transport; no UI, signed HTTP JWT, live accounts, physical Android or deployed outcome feature' };
report.base_commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
report.source_sha256 = Object.fromEntries(await Promise.all(sources.map(async name => [name, hash(await read(name))])));
report.preserved_sha256 = Object.fromEntries(await Promise.all(preserved.map(async name => [name, hash(await read(name))])));
const absoluteImports = (source, name) => source.replace(/from (['"])(\.[^'"]+)\1/g,
  (match, quote, relative) => 'from ' + JSON.stringify(pathToFileURL(path.resolve(root, path.dirname(name), relative)).href));
const dataModule = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
try {
  const files = ['web_launch/case-outcome-client.test.mjs', 'web_launch/real-journey-client.test.mjs', 'web_launch/neon-store.test.mjs'];
  const canonical = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  assert.equal(canonical.status, 0, canonical.stdout + canonical.stderr);
  const count = label => Number(canonical.stdout.match(new RegExp('# ' + label + ' (\\d+)'))?.[1]);
  assert.equal(count('fail'), 0); assert.equal(count('skipped'), 0); assert.ok(count('pass') >= 24);
  report.tests = { command: 'node --test ' + files.join(' '), pass: count('pass'), fail: count('fail'), skipped: count('skipped') };
  const clientName = 'web_launch/real-journey-client.mjs', testName = 'web_launch/case-outcome-client.test.mjs';
  const canonicalSource = (await read(clientName)).toString('utf8');
  const marker = ' || this.#outcomeEpoch !== epoch';
  assert.equal(canonicalSource.split(marker).length, 2);
  const mutant = dataModule(absoluteImports(canonicalSource.replace(marker, ''), clientName));
  const testSource = absoluteImports((await read(testName)).toString('utf8'), testName)
    .replace(JSON.stringify(pathToFileURL(path.join(root, clientName)).href), JSON.stringify(mutant));
  const mutation = spawnSync(process.execPath, ['--input-type=module', '--test-reporter=tap'], {
    cwd: root, encoding: 'utf8', input: 'await import(' + JSON.stringify(dataModule(testSource)) + ');', maxBuffer: 8 * 1024 * 1024,
  });
  assert.notEqual(mutation.status, 0, 'Session-epoch mutant escaped the semantic guard');
  assert.match(mutation.stdout, /not ok[^\n]+late private outcome responses/);
  assert.match(mutation.stdout, /Missing expected rejection/);
  report.session_epoch_mutation_rejected = true;
  report.mutation_scope = 'Isolated imported source removes epoch comparison only; canonical source files unchanged';
  for (const receiptName of ['CASE_OUTCOME_SQL.json', 'CASE_OUTCOME_GATEWAY.json']) {
    const receipt = JSON.parse((await read('artifacts/overnight-20261004/' + receiptName)).toString('utf8'));
    assert.match(receipt.status, /^PASS_LOCAL_/);
    for (const [name, digest] of Object.entries(receipt.source_sha256)) assert.equal(hash(await read(name)), digest, 'Reused proof source drift: ' + name);
  }
  report.reused_proof = 'SQL and API receipts have exact matching recorded source hashes; unchanged suites not rerun';
  for (const [name, digest] of Object.entries({ ...report.source_sha256, ...report.preserved_sha256 })) assert.equal(hash(await read(name)), digest, name);
  report.status = 'PASS_LOCAL_CLIENT'; report.published = false;
  report.live_accounts = report.signed_http_jwt = report.physical_android = report.browser_ui = 'NOT_RUN';
} catch (error) { report.error = error.message; throw error; }
finally { await fs.writeFile(artifact, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, tests: report.tests, session_epoch_mutation_rejected: report.session_epoch_mutation_rejected, receipt: artifact }));
