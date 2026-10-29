// Bounded negative controls. All mutations stay in an owned C: temp snapshot.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
const root = process.cwd(), out = path.join(root, 'docs/privacy-20261029');
const temp = await fs.mkdtemp(path.join(root, 'tmp/privacy-negative-'));
assert.ok(path.resolve(temp).startsWith(path.resolve(root, 'tmp') + path.sep));
const receipt = { scope: 'local snapshots only', checks: [], temp, base: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() };
await fs.mkdir(path.join(temp, 'web_launch'), { recursive: true });
for (const name of ['privacy-device.test.mjs', 'privacy-retention.mjs', 'privacy-content.mjs']) await fs.copyFile(path.join(root, 'web_launch', name), path.join(temp, 'web_launch', name));
const retention = path.join(temp, 'web_launch/privacy-retention.mjs');
const original = await fs.readFile(retention, 'utf8');
assert.ok(original.includes('now - stamps[key] >= DAYS * 86400000'));
await fs.writeFile(retention, original.replace('now - stamps[key] >= DAYS * 86400000', 'false'));
const mutant = spawnSync(process.execPath, ['--test', 'web_launch/privacy-device.test.mjs'], { cwd: temp, encoding: 'utf8', windowsHide: true });
await fs.writeFile(path.join(out, 'retention-mutant.tap'), mutant.stdout + mutant.stderr);
assert.notEqual(mutant.status, 0); assert.match(mutant.stdout, /fail [1-9]/);
receipt.checks.push({ name: 'disabled_expiry_is_rejected_by_mocked_clock_test', pass: true, nativeExit: mutant.status });
// Old HTTP surface proves that the user-facing test distinguishes this lane from its base.
const baseline = await fs.mkdtemp(path.join(root, 'tmp/privacy-baseline-'));
const files = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', '--', 'web_launch'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(file => /\.(?:mjs|json)$/.test(file) && !file.includes('.test.'));
for (const file of files) { const dest = path.join(baseline, file); await fs.mkdir(path.dirname(dest), { recursive: true }); await fs.writeFile(dest, execFileSync('git', ['show', 'HEAD:' + file])); }
const server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { cwd: baseline, env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
try {
  const url = await new Promise((resolve, reject) => { let output = ''; const timer = setTimeout(() => reject(Error('Baseline server timeout: ' + output)), 30000); server.stdout.on('data', chunk => { output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } }); server.stderr.on('data', chunk => output += chunk); server.on('exit', code => { clearTimeout(timer); reject(Error('Baseline exited ' + code + ': ' + output)); }); });
  const response = await fetch(url + '/privacy.html'); assert.equal(response.status, 404);
  receipt.checks.push({ name: 'base_HEAD_cannot_open_privacy_centre', pass: true, status: response.status });
} finally { server.kill(); }
receipt.status = 'PASS_NEGATIVE_CONTROLS';
await fs.writeFile(path.join(out, 'negative-controls.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt));
