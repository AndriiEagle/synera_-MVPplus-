// Portable local SQL acceptance for neon/meeting-status-guard.migration.sql.
// DISPOSABLE loopback PostgreSQL only: identity shim, no provider, no signed HTTP JWT, no production.
// Usage (psql on PATH or SYNERA_ACCEPTANCE_PSQL; the server must already run on loopback):
//   SYNERA_ACCEPTANCE_PGPORT=55432 node tools/meeting-status-guard-sql-acceptance.mjs [--receipt=path.json]
// It creates databases named synera_status_guard_<run>_<n>, drops only those, and never reads other databases.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { neonAuthShimSql } from '../neon/local_acceptance.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const psql = process.env.SYNERA_ACCEPTANCE_PSQL || 'psql';
const host = process.env.SYNERA_ACCEPTANCE_PGHOST || '127.0.0.1';
const port = process.env.SYNERA_ACCEPTANCE_PGPORT || '';
const user = process.env.SYNERA_ACCEPTANCE_PGUSER || 'postgres';
if (!['127.0.0.1', '::1', 'localhost'].includes(host) || !/^\d{2,5}$/.test(port)) {
  console.error('Set SYNERA_ACCEPTANCE_PGPORT to a disposable loopback PostgreSQL. Remote hosts are refused.');
  process.exit(2);
}
const receiptArg = process.argv.find(arg => arg.startsWith('--receipt='));
const receiptPath = receiptArg ? path.resolve(receiptArg.slice('--receipt='.length)) : null;
// Strip inherited PG* settings so an operator's production PGDATABASE/PGSERVICE can never be picked up.
const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^PG/i.test(key))), PGCLIENTENCODING: 'UTF8' };
const sql = (database, input) => spawnSync(psql, ['-h', host, '-p', port, '-U', user, '-w', '-X', '-d', database, '-At', '-q', '-v', 'ON_ERROR_STOP=1'],
  { input, encoding: 'utf8', env, maxBuffer: 4 * 1024 * 1024, timeout: 60000 });
const hash = value => createHash('sha256').update(value).digest('hex');

const preflight = sql('postgres', "select json_build_object('version',current_setting('server_version'),'host',host(inet_server_addr()),'port',inet_server_port());");
assert.equal(preflight.status, 0, 'PostgreSQL preflight failed: ' + (preflight.stderr || preflight.error?.message));
const server = JSON.parse(preflight.stdout.trim());
assert.ok(['127.0.0.1', '::1'].includes(server.host), 'Refusing a non-loopback server: ' + server.host);

const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), server,
  scope: 'Disposable loopback PostgreSQL with an identity shim. Not a signed HTTP JWT, not Neon, not two live accounts, not production.',
  stages: [], source_sha256: {}, provider_calls: 0, provider_usd: 0, live: false };
const read = async name => { const bytes = await fs.readFile(path.join(root, name)); report.source_sha256[name] = hash(bytes); return bytes.toString('utf8'); };
const run = Date.now().toString(36); let counter = 0; const created = [];
const GUARD = 'neon/meeting-status-guard.migration.sql', ACCEPTANCE = 'neon/meeting-status-guard.acceptance.sql';
const CASE = ['neon/schema.proposal.sql', 'neon/case-state.migration.sql'];
const LATER = ['neon/meeting-location.migration.sql', 'neon/group-room.migration.sql', 'neon/case-outcome.migration.sql', 'neon/meeting-address-agreement.migration.sql', 'neon/message-intent.migration.sql'];

// Builds one fresh database from the listed sources (a string entry is a file, an object is inline SQL).
async function build(label, sources) {
  const database = `synera_status_guard_${run}_${++counter}`;
  const made = sql('postgres', `create database ${database} template template0 encoding 'UTF8';`);
  assert.equal(made.status, 0, 'createdb: ' + made.stderr); created.push(database);
  const shim = sql(database, neonAuthShimSql()); assert.equal(shim.status, 0, 'shim: ' + shim.stderr);
  for (const source of sources) {
    const [name, text] = typeof source === 'string' ? [source, await read(source)] : [source.name, source.sql];
    const applied = sql(database, text);
    assert.equal(applied.status, 0, `${label}: ${name}: ${applied.stderr}`);
  }
  return database;
}
// Runs an acceptance file and records the outcome; `expect` is null for PASS or the oracle message for RED.
function accept(name, database, text, expect = null, marker = 'MEETING_STATUS_GUARD_ACCEPTANCE_PASS') {
  const result = sql(database, text);
  const stage = { name, exit_code: result.status, expected: expect === null ? 'PASS' : 'RED: ' + expect,
    error: (result.stderr.match(/ERROR:\s+(.*)/) || [])[1] ?? null };
  report.stages.push(stage);
  if (expect === null) {
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
    // Exit code 0 alone could mean an empty or truncated script; the final marker proves the last oracle ran.
    if (marker) assert.ok(result.stdout.includes(marker), `${name}: final marker missing`);
  } else {
    assert.notEqual(result.status, 0, `${name}: expected the oracle to fail`);
    assert.ok(result.stderr.includes(expect), `${name}: expected "${expect}", got: ${result.stderr}`);
  }
  // Every acceptance script ends with ROLLBACK: nothing may be left behind.
  const left = sql(database, 'select (select count(*) from neon_auth."user") + (select count(*) from public.meeting_requests) + (select count(*) from public.match_cases);');
  assert.equal(left.stdout.trim(), '0', `${name}: fixtures were left behind`); stage.rolled_back = true;
}

try {
  const guard = await read(GUARD), acceptance = await read(ACCEPTANCE), caseAcceptance = await read('neon/case-state.acceptance.sql');
  report.source_sha256['tools/meeting-status-guard-sql-acceptance.mjs'] = hash(await fs.readFile(fileURLToPath(import.meta.url)));
  assert.match(guard, /^begin;/m); assert.match(guard.trim(), /commit;$/); assert.match(acceptance.trim(), /rollback;$/);

  // RED: the oracle fails on the unchanged sources, on the stack where each defect lives.
  accept('baseline_case_stack_stale_acceptance', await build('baseline-case', CASE), acceptance, 'Recipient accepted after the agreement changed');
  accept('baseline_location_stack_sender_self_accept', await build('baseline-location', [...CASE, LATER[0]]), acceptance, 'Sender accepted their own invitation');
  accept('baseline_full_stack_sender_self_accept', await build('baseline-full', [...CASE, ...LATER]), acceptance, 'Sender accepted their own invitation');

  // GREEN: guard before the later migrations, guard last on an existing full stack, and guard alone.
  const guardedCase = await build('guard-case', [...CASE, GUARD]);
  accept('guard_case_stack', guardedCase, acceptance);
  accept('guard_then_full_stack', await build('guard-then-full', [...CASE, GUARD, ...LATER]), acceptance);
  const guardLast = await build('full-then-guard', [...CASE, ...LATER, GUARD]);
  accept('full_stack_then_guard', guardLast, acceptance);
  // The previously reviewed case acceptance keeps passing with the guard installed.
  accept('existing_case_state_acceptance_with_guard', guardedCase, caseAcceptance, null, '');
  // A second apply is refused by the migration's own precondition instead of silently replacing the guard.
  const again = sql(guardLast, guard);
  assert.notEqual(again.status, 0); assert.match(again.stderr, /Inspect existing meeting status guard/);
  report.stages.push({ name: 'second_apply_refused', exit_code: again.status, expected: 'RED: Inspect existing meeting status guard' });

  // MUTATION: each guard condition is load-bearing; removing it makes the same oracle fail again.
  const mutants = [
    ['mutation_any_participant_may_answer', "and actor is not null and actor = old.recipient_id then", "and actor is not null then", 'Sender accepted their own invitation'],
    ['mutation_acceptance_ignores_approvals', "if new.status = 'accepted' and not exists (", "if false and not exists (", 'Recipient accepted after the agreement changed'],
    ['mutation_unlisted_transitions_allowed', "raise exception 'Invitation status transition denied' using errcode = '42501';", 'return new;', 'Sender accepted their own invitation'],
  ];
  for (const [name, needle, replacement, expected] of mutants) {
    assert.equal(guard.split(needle).length, 2, name + ': mutation target must occur exactly once');
    const mutant = guard.replace(needle, replacement);
    accept(name, await build(name, [...CASE, ...LATER, { name: name + '.sql', sql: mutant }]), acceptance, expected);
  }
  accept('acceptance_after_mutations', guardLast, acceptance);
  report.status = 'PASS_LOCAL_MEETING_STATUS_GUARD_SQL';
} catch (error) { report.error = error.message; throw error; }
finally {
  for (const database of created) sql('postgres', `drop database if exists ${database};`);
  report.databases_dropped = created.length;
  if (receiptPath) { await fs.mkdir(path.dirname(receiptPath), { recursive: true }); await fs.writeFile(receiptPath, JSON.stringify(report, null, 2) + '\n'); }
  console.log(JSON.stringify({ status: report.status, stages: report.stages.map(stage => ({ name: stage.name, exit_code: stage.exit_code, expected: stage.expected })), receipt: receiptPath }));
}
