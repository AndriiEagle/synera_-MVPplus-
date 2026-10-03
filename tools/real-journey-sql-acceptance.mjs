// Approved portable runtime only. No Docker, downloads, service registration,
// production credentials, arbitrary connection string or destructive cleanup.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { neonAuthShimSql } from '../neon/local_acceptance.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = 'C:\\Users\\Andrii\\.codex\\tmp\\synera-pg16-20261003';
const binaries = path.join(runtime, 'runtime/pgsql/bin');
const data = path.join(runtime, 'data');
const address = ['-h', '127.0.0.1', '-p', '55331', '-U', 'synera_acceptance_admin', '-w'];
const env = { ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^PG/i.test(name))), PGCLIENTENCODING: 'UTF8' };
const sql = (database, input) => spawnSync(path.join(binaries, 'psql.exe'), [...address, '-X', '-d', database, '-At', '-v', 'ON_ERROR_STOP=1'],
  { input, encoding: 'utf8', env, maxBuffer: 8 * 1024 * 1024, timeout: 30000 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const preflight = sql('postgres', "select json_build_object('version',current_setting('server_version'),'data',current_setting('data_directory'),'host',inet_server_addr(),'port',inet_server_port());");
assert.equal(preflight.status, 0, preflight.stderr);
const server = JSON.parse(preflight.stdout.trim());
assert.equal(server.version, '16.15');
assert.equal(path.resolve(server.data).toLowerCase(), path.resolve(data).toLowerCase());
assert.equal(server.host, '127.0.0.1'); assert.equal(server.port, 55331);
const database = 'synera_acceptance_' + Date.now();
const created = spawnSync(path.join(binaries, 'createdb.exe'), [...address, '-T', 'template0', '--encoding=UTF8', '--locale-provider=icu', '--icu-locale=und', database], { encoding: 'utf8', env, timeout: 30000 });
assert.equal(created.status, 0, created.stderr);
const receipt = { status: 'NOT_ACCEPTED', scope: 'Approved local PostgreSQL16.15, real SQL/RLS with provider identity shim; not live Neon/JWT/phone proof',
  generated_at: new Date().toISOString(), runtime, database, server, stages: [], source_sha256: {}, provider_calls: 0, provider_usd: 0 };
const run = (name, input, requireSuccess = true) => {
  const result = sql(database, input);
  receipt.stages.push({ name, exit_code: result.status, stdout: result.stdout, stderr: result.stderr, error: result.error?.message ?? null });
  if (requireSuccess) assert.equal(result.status, 0, `${name}: ${result.stderr || result.error?.message}`);
  return result;
};
const proof = path.join(root, 'artifacts/real-journey-20261003');
await fs.mkdir(proof, { recursive: true });
try {
  const locale = run('unicode_locale', "select json_build_object('provider',datlocprovider,'icu_locale',daticulocale,'client_encoding',current_setting('client_encoding'),'cyrillic_lower',lower('Онлайн')) from pg_database where datname=current_database();");
  receipt.locale = JSON.parse(locale.stdout.trim());
  assert.equal(receipt.locale.provider, 'i'); assert.equal(receipt.locale.icu_locale, 'und');
  assert.equal(receipt.locale.client_encoding, 'UTF8'); assert.equal(receipt.locale.cyrillic_lower, 'онлайн');
  run('provider_identity_shim', neonAuthShimSql());
  const files = ['schema.proposal.sql','acceptance.sql','case-state.migration.sql','case-state.acceptance.sql',
    'meeting-location.migration.sql','meeting-location.acceptance.sql','group-room.migration.sql','group-room.acceptance.sql'];
  for (const name of files) {
    if (name === 'group-room.acceptance.sql') run('existing_account_sentinel', `
      insert into neon_auth."user"(id,name,email,"emailVerified") values ('55555555-5555-4555-8555-555555555555','Existing local sentinel','sentinel@synera-acceptance.example',true);
      insert into public.profiles(id,display_name,brief) values ('55555555-5555-4555-8555-555555555555','Existing local sentinel',
        jsonb_build_object('version',1,'goal','Preserve existing account','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
          'languages',jsonb_build_array('en'),'modes',jsonb_build_array('exchange'),'available_from',current_date::text,'available_until',(current_date+14)::text,
          'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false));`);
    const bytes = await fs.readFile(path.join(root, 'neon', name)); receipt.source_sha256['neon/' + name] = sha(bytes);
    const contents = bytes.toString('utf8');
    if (name.endsWith('.acceptance.sql') || name === 'acceptance.sql') {
      assert.match(contents.trim(), /rollback;$/i); assert.match(contents, /^begin;/im);
    }
    run(name, contents);
  }
  const fixtureCount = run('fixture_rollback', 'select count(*) from neon_auth."user";');
  assert.equal(fixtureCount.stdout.trim(), '1'); receipt.fixture_users_left = 0;
  assert.equal(run('existing_account_preserved', "select count(*) from public.profiles where id='55555555-5555-4555-8555-555555555555' and display_name='Existing local sentinel';").stdout.trim(), '1');
  receipt.existing_account_preserved = true;
  const caseMigration = await fs.readFile(path.join(root, 'neon/case-state.migration.sql'), 'utf8');
  const definition = caseMigration.match(/^create function public\.synera_case_guard\(\)[\s\S]*?\$\$;/m)?.[0];
  assert.ok(definition, 'Canonical case guard not found');
  const repaired = definition.replace('create function', 'create or replace function');
  const expiredDeadlock = repaired.replace("old.expires_at <= now() and new.status = 'open'", 'old.expires_at <= now()');
  assert.notEqual(expiredDeadlock, repaired, 'Expiry mutation must actually change the guard');
  run('expiry_deadlock_mutation', expiredDeadlock);
  try {
    const rejected = run('expiry_deadlock_expected_red', await fs.readFile(path.join(root, 'neon/case-state.acceptance.sql'), 'utf8'), false);
    assert.notEqual(rejected.status, 0); assert.match(rejected.stderr, /Case expired/); receipt.expiry_deadlock_mutation_rejected = true;
  } finally {
    const repair = await fs.readFile(path.join(root, 'neon/case-expiry-repair.migration.sql'));
    receipt.source_sha256['neon/case-expiry-repair.migration.sql'] = sha(repair);
    run('apply_additive_expiry_repair_locally', repair.toString('utf8'));
  }
  run('case_acceptance_after_restore', await fs.readFile(path.join(root, 'neon/case-state.acceptance.sql'), 'utf8'));
  const projectGuard = caseMigration.match(/^create function public\.synera_case_project_guard\(\)[\s\S]*?\$\$;/m)?.[0];
  assert.ok(projectGuard, 'Canonical project guard not found');
  run('project_contribution_mutation', "create or replace function public.synera_case_project_guard() returns trigger language plpgsql security invoker set search_path='' as $$ begin return new; end $$;");
  try {
    const rejected = run('project_contribution_expected_red', await fs.readFile(path.join(root, 'neon/case-state.acceptance.sql'), 'utf8'), false);
    assert.notEqual(rejected.status, 0); assert.match(rejected.stderr, /One-sided project accepted/); receipt.project_contribution_mutation_rejected = true;
  } finally { run('restore_project_guard', projectGuard.replace('create function', 'create or replace function')); }
  run('project_acceptance_after_restore', await fs.readFile(path.join(root, 'neon/case-state.acceptance.sql'), 'utf8'));
  // The established privacy oracle must reject a deliberate raw-table grant.
  run('grant_privacy_mutation', 'grant select on public.meeting_location_grants to authenticated;');
  try {
    const rejected = run('privacy_mutation_expected_red', await fs.readFile(path.join(root, 'neon/meeting-location.acceptance.sql'), 'utf8'), false);
    assert.notEqual(rejected.status, 0); assert.match(rejected.stderr, /Raw grant read allowed/); receipt.privacy_mutation_rejected = true;
  } finally { run('restore_private_grants', 'revoke all on public.meeting_location_grants from authenticated;'); }
  assert.equal(run('final_fixture_rollback', 'select count(*) from neon_auth."user";').stdout.trim(), '1');
  receipt.status = 'LOCAL_SQL_ACCEPTED_LIVE_HOLD';
} catch (error) { receipt.failure = error.message; throw error;
} finally {
  receipt.completed_at = new Date().toISOString();
  await fs.writeFile(path.join(proof, receipt.status === 'NOT_ACCEPTED' ? 'SQL_FAILURE.json' : 'SQL_ACCEPTANCE.json'), JSON.stringify(receipt, null, 2));
}
console.log(JSON.stringify({ status: receipt.status, stages: receipt.stages.map(s => s.name), fixture_users_left: receipt.fixture_users_left,
  privacy_mutation_rejected: receipt.privacy_mutation_rejected, database, scope: receipt.scope }));
