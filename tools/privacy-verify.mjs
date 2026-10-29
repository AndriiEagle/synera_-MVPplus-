// Local lane acceptance only. No install, hosted calls, production SQL or publishing.
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
const out = path.resolve('docs/privacy-20261029');
await fs.mkdir(out, { recursive: true });
const tests = async dir => (await fs.readdir(dir)).filter(name => name.endsWith('.test.mjs')).map(name => dir + '/' + name);
const report = { status: 'RUNNING', startedAt: new Date().toISOString(), node: process.version, cwd: process.cwd(), providerCalls: 0, usd: 0, runs: [], sourceSha256: {} };
const sourcePaths = [...Object.keys(PUBLIC_ASSETS).map(name => 'web_launch/' + name), 'web_launch/assets.mjs', 'web_launch/server.mjs', 'web_launch/ops-log.mjs', 'web_launch/config.mjs', 'neon/worker.mjs', 'neon/privacy-complete-erasure.migration.sql', 'neon/privacy-retention-purge.migration.sql', 'tools/privacy-journal-retention.mjs', '.github/workflows/ci.yml'];
for (const file of sourcePaths) report.sourceSha256[file] = createHash('sha256').update(await fs.readFile(file)).digest('hex');
async function run(name, args) {
  const log = path.join(out, name + '.log'), handle = await fs.open(log, 'w');
  const start = Date.now();
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: process.cwd(), windowsHide: true, env: { ...process.env, SYNERA_CHROMIUM_EXECUTABLE: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }, stdio: ['ignore', handle.fd, handle.fd] });
    child.on('error', reject); child.on('exit', resolve);
  });
  await handle.close(); report.runs.push({ name, command: ['node', ...args], nativeExit: code, elapsedMs: Date.now() - start, log: path.relative(process.cwd(), log) });
  await fs.writeFile(path.join(out, 'acceptance.json'), JSON.stringify(report, null, 2) + '\n');
  if (code !== 0) throw Error(name + ' failed: ' + code);
}
try {
  await run('verified-main', ['--test', ...await tests('web_launch'), ...await tests('web_launch/iceberg'), ...await tests('neon'), 'plan/v6/workflow/approval-boundary.test.mjs']);
  await run('verified-pwa-i18n', ['--test', ...await tests('tests/pwa'), ...await tests('tests/i18n_ch')]);
  await run('verified-browser', ['node_modules/@playwright/test/cli.js', 'test', '--config', 'docs/privacy-20261029/playwright.config.mjs', 'tests/browser-e2e.spec.mjs', 'tests/studio-e2e.spec.mjs', 'tests/privacy-e2e.spec.mjs']);
  for (const [file, hash] of Object.entries(report.sourceSha256)) if (createHash('sha256').update(await fs.readFile(file)).digest('hex') !== hash) throw Error('Source changed during acceptance: ' + file);
  report.status = 'PASS_LOCAL_WITH_STATED_HOLDS';
  report.holds = ['PostgreSQL behavioral acceptance NOT_RUN locally', 'simulation-owned HTML/runtime integration pending', 'identity-provider deletion G7, legal review and live rollout remain closed'];
} catch (error) { report.status = 'NEEDS_REVIEW'; report.error = error.message; process.exitCode = 1; }
report.completedAt = new Date().toISOString();
await fs.writeFile(path.join(out, 'acceptance.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, runs: report.runs.map(({name,nativeExit}) => ({name,nativeExit})), receipt: 'docs/privacy-20261029/acceptance.json' }));
