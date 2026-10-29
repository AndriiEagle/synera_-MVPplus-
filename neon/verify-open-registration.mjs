// Run the CI Node sets from an exact C: snapshot, closing sparse-checkout inputs
// from pinned Git blobs. Never writes the other lane's web_launch or Git index.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
if (path.resolve(root).toLowerCase() !== 'c:\\sw\\synera-openreg' || !/^c:\\/i.test(os.tmpdir())) throw new Error('Acceptance must use this worktree and C: OS temp');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', ['-C', root, ...args]);
const head = git('rev-parse', 'HEAD').toString().trim();
if (head !== 'a95acd525afd3c7a729bf7123254d9e81c224e93') throw new Error('Review changed baseline before rerun');
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'synera-openreg-'));
const receipt = { baseline: head, node: process.version, directory, sourceFiles: [], restoredInputs: [], runs: [], published: false };
for (const name of ['web_launch', 'neon', 'tools', 'docs', 'supabase', 'tests']) {
  await fs.cp(path.join(root, name), path.join(directory, name), { recursive: true,
    filter: source => !/(?:^|[\\/])(?:dist[^\\/]*|node_modules)(?:[\\/]|$)|\.(?:tap|log)$|open-registration-acceptance\.json$/.test(source) });
}
for (const name of ['package.json', 'package-lock.json']) {
  await fs.writeFile(path.join(directory, name), git('show', `${head}:${name}`));
}
const missing = ['artifacts/overnight-20261004/outcome-export-plain.json', 'artifacts/overnight-20261004/outcome-export-gzip.json', 'plan/v6/workflow/approval-boundary.test.mjs'];
for (const name of missing) {
  const bytes = git('show', `${head}:${name}`);
  await fs.mkdir(path.dirname(path.join(directory, name)), { recursive: true });
  await fs.writeFile(path.join(directory, name), bytes);
  receipt.restoredInputs.push({ path: name, sha256: sha(bytes), gitBlob: git('rev-parse', `${head}:${name}`).toString().trim() });
}
async function inventory(dir, prefix = '') {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const name = prefix + entry.name, full = path.join(dir, entry.name);
    if (entry.isDirectory()) await inventory(full, name + '/');
    else receipt.sourceFiles.push({ path: name, sha256: sha(await fs.readFile(full)) });
  }
}
await inventory(directory);
function run(name, args) {
  const result = spawnSync(process.execPath, args, { cwd: directory, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, windowsHide: true });
  const output = (result.stdout || '') + (result.stderr || '');
  const log = `open-registration-ci-${name}.tap`;
  return fs.writeFile(path.join(root, 'neon', log), output).then(() => {
    const counts = Object.fromEntries([...output.matchAll(/^# (tests|pass|fail|skipped|cancelled) (\d+)$/gm)].map(match => [match[1], Number(match[2])]));
    receipt.runs.push({ name, command: ['node', ...args].join(' '), exit: result.status, counts, log: 'neon/' + log });
    console.log(JSON.stringify(receipt.runs.at(-1)));
    if (result.error) throw result.error;
    if (result.status !== 0) process.exitCode = 1;
  });
}
await run('main', ['--test', '--test-reporter=tap', 'web_launch/*.test.mjs', 'web_launch/iceberg/*.test.mjs', 'neon/*.test.mjs', 'plan/v6/workflow/approval-boundary.test.mjs']);
const dependencyHook = 'C:/Users/Andrii/.codex/outputs/synera-gilbert-readiness-20261021/dependency-resolution.mjs';
receipt.dependencyHook = { path: dependencyHook, sha256: sha(await fs.readFile(dependencyHook)), scope: 'Existing installed Playwright resolution only; no install' };
await run('simulation', ['--import', pathToFileURL(dependencyHook).href, '--test', '--test-reporter=tap', 'tools/simulation-server.test.mjs', 'tools/simulation-runner.test.mjs']);
await run('pwa', ['--test', '--test-reporter=tap', 'tests/pwa/*.test.mjs']);
await run('i18n', ['--test', '--test-reporter=tap', 'tests/i18n_ch/*.test.mjs']);
// Building in the snapshot protects the actual web_launch file zone.
await run('build', ['neon/build.mjs', 'dist-neon-ci']);
if (receipt.runs.find(row => row.name === 'build').exit === 0) {
  const bundle = path.join(directory, 'web_launch/dist-neon-ci/_worker.js');
  await run('bundle-syntax', ['--check', bundle]);
  const { default: worker } = await import(pathToFileURL(bundle));
  const config = await worker.fetch(new Request('https://synera-test.pages.dev/config.json'), {});
  if ((await config.json()).registrationEnabled !== false) throw new Error('Bundled registration must default off');
  const previousFetch = globalThis.fetch, rows = new Map();
  try {
    globalThis.fetch = async () => Response.json({});
    const result = await worker.fetch(new Request('https://synera-test.pages.dev/api/neon/otp/request', { method: 'POST',
      headers: { Origin: 'https://synera-test.pages.dev', 'X-Synera-Client': '1', 'CF-Connecting-IP': '192.0.2.1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com', consent: { policy_version: '2026-09-05-pilot-3', terms_accepted: true, privacy_acknowledged: true } }) }), {
      SYNERA_SITE_URL: 'https://synera-test.pages.dev', SYNERA_NEON_AUTH_URL: 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth',
      SYNERA_NEON_DATA_URL: 'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1', SYNERA_PILOT_READY: 'true', SYNERA_REGISTRATION_ENABLED: 'true', SYNERA_OPEN_REGISTRATION: 'true',
      SYNERA_LOCATION_EPHEMERAL: { async get(key) { return rows.has(key) ? JSON.parse(rows.get(key)) : null; }, async put(key, value) { rows.set(key, value); } },
    });
    if (result.status !== 200 || (await result.json()).sent !== true) throw new Error('Bundled open OTP path failed');
  } finally { globalThis.fetch = previousFetch; }
  receipt.bundle = { sha256: sha(await fs.readFile(bundle)), defaultOffVerified: true, openOtpVerified: true, provider: 'synthetic local response; no hosted call' };
}
// Bind copied code to the actual reviewed lane, even if another lane worked meanwhile.
for (const row of receipt.sourceFiles.filter(row => /^(web_launch|neon)\//.test(row.path))) {
  if (sha(await fs.readFile(path.join(root, row.path))) !== row.sha256) throw new Error(`Source changed during acceptance: ${row.path}`);
}
await fs.writeFile(path.join(root, 'neon/open-registration-acceptance.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ receipt: 'neon/open-registration-acceptance.json', exit: process.exitCode || 0, directory }));
