// Uses an already running, explicitly named disposable PostgreSQL container.
// No image download, network port, real credentials or production connection.
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { neonAuthShimSql } from '../neon/local_acceptance.mjs';
const container = 'synera-location-20261002';
const inspect = spawnSync('docker', ['inspect', '--format', '{{index .Config.Labels "synera.disposable"}}', container], { encoding: 'utf8' });
if (inspect.status !== 0 || inspect.stdout.trim() !== '20261002') throw new Error('Disposable container identity not verified');
const database = 'synera_local_' + Date.now();
const created = spawnSync('docker', ['exec', container, 'createdb', '-U', 'postgres', database], { encoding: 'utf8' });
if (created.status !== 0) throw new Error(created.stderr);
const run = sql => spawnSync('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-q'], { input: sql, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
const receipt = { scope: 'disposable PostgreSQL 16; not live Neon', pass: false, stages: [], provider_calls: 0 };
for (const [name, sql] of [['shim', neonAuthShimSql()], ...await Promise.all(['schema.proposal.sql', 'acceptance.sql', 'case-state.migration.sql', 'case-state.acceptance.sql', 'meeting-location.migration.sql', 'meeting-location.acceptance.sql'].map(async file => [file, await fs.readFile(new URL('../neon/' + file, import.meta.url), 'utf8')]))]) {
  const result = run(sql);
  receipt.stages.push({ name, exit: result.status, output: result.stdout + result.stderr });
  if (result.status !== 0) {
    await fs.writeFile(new URL('../artifacts/location-sql.json', import.meta.url), JSON.stringify(receipt, null, 2));
    throw new Error(name + ': ' + result.stderr);
  }
}
const mutation = run('grant select on public.meeting_location_grants to authenticated;');
if (mutation.status !== 0) throw new Error(mutation.stderr);
try {
  const rejected = run(await fs.readFile(new URL('../neon/meeting-location.acceptance.sql', import.meta.url), 'utf8'));
  receipt.mutation_rejected = rejected.status !== 0 && rejected.stderr.includes('Raw grant read allowed');
  if (!receipt.mutation_rejected) throw new Error('The privacy regression oracle did not reject raw-table disclosure');
} finally {
  const restored = run('revoke all on public.meeting_location_grants from authenticated;');
  if (restored.status !== 0) throw new Error(restored.stderr);
}
const check = run('select count(*) as fixture_users_left from neon_auth."user";');
receipt.fixture_users_left = check.stdout.includes('\n                   0\n') || /\n\s*0\s*\n/.test(check.stdout) ? 0 : null;
receipt.pass = receipt.fixture_users_left === 0 && receipt.mutation_rejected;
await fs.writeFile(new URL('../artifacts/location-sql.json', import.meta.url), JSON.stringify(receipt, null, 2));
if (!receipt.pass) throw new Error('Rollback acceptance failed');
console.log(JSON.stringify({ pass: true, stages: receipt.stages.map(s => s.name), mutation_rejected: true, fixture_users_left: 0 }));
