// C03.L4 — тести локальної RLS-акцептанси. Запуск з КОРЕНЯ: node neon/local_acceptance.test.mjs
// Offline-структурні тести завжди; integration-run виконується ТОЛЬКИ якщо psql+PG доступні
// (env SYNERA_ACCEPTANCE_PG), інакше чесний SKIP з причиною.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateAcceptanceSql, neonAuthShimSql, runAcceptance, receipt, receiptLine, ACCEPTANCE_SQL, MIGRATION_SQL } from './local_acceptance.mjs';

test('C03.L4: acceptance SQL структурно валідний — begin + set local role + ROLLBACK у кінці', async () => {
  const v = await validateAcceptanceSql(ACCEPTANCE_SQL);
  assert.deepEqual(v.violations, [], 'violations: ' + JSON.stringify(v.violations));
  assert.equal(v.pass, true);
});

test('C03.L4: disposable-гігієна — всі email у скрипті з .example, жодних реальних PII', async () => {
  const v = await validateAcceptanceSql(ACCEPTANCE_SQL);
  const sql = await fs.readFile(ACCEPTANCE_SQL, 'utf8');
  for (const m of sql.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)) {
    assert.ok(m[0].endsWith('.example'), 'non-disposable email: ' + m[0]);
  }
  // fingerprint-дані відсутні: жодних телефонів/IBAN/адрес
  assert.ok(!/IBAN|\+41|Bahnhofstr|Hausnummer/i.test(sql.replace(/acceptance_criteria|meeting_place/g, '')));
});

test('C03.L4: валідатор ловить зламані скрипти — без ROLLBACK, з реальним email, з DROP DATABASE', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'acceptance-'));
  const bad = dir + '/bad.sql';
  await fs.writeFile(bad, 'insert into public.profiles values (1); commit;');
  const v = await validateAcceptanceSql(bad);
  assert.equal(v.pass, false);
  assert.ok(v.violations.some(x => x.includes('ROLLBACK')));
  await fs.writeFile(bad, 'begin;\ndrop schema neon_auth cascade;\nrollback;');
  const v2 = await validateAcceptanceSql(bad);
  assert.ok(v2.violations.some(x => x.includes('ЗАБОРОНЕНИЙ STATEMENT')));
  await fs.rm(dir, { recursive: true, force: true });
});

test('C03.L4: neon_auth shim — мінімальний, ідемпотентний; schema.proposal.sql сам визначає synera_user_id', async () => {
  const shim = neonAuthShimSql();
  assert.match(shim, /create schema if not exists neon_auth/);
  assert.match(shim, /create table if not exists neon_auth\."user"/);
  assert.match(shim, /to_regprocedure\('auth\.uid\(\)'\)|auth\.uid\(\)/, 'Neon-гвард вимагає auth.uid()');
  assert.match(shim, /rolname = 'authenticated'/, 'Neon Data API роль');
  // synera_user_id() НЕ дублюється в shim — його створює schema.proposal.sql
  assert.ok(!shim.includes('synera_user_id'));
  // acceptance.sql реально використовує ці обʼєкти
  const sql = await fs.readFile(ACCEPTANCE_SQL, 'utf8');
  assert.ok(sql.includes('neon_auth."user"'));
  assert.ok(sql.includes('synera_user_id()'));
});

test('C03.L4: runAcceptance — fail-closed без інʼєкцій і на помилці pre:schema', async () => {
  await assert.rejects(() => runAcceptance(null), /connectionString/);
  const fakeRun = async (cmd, stdin) => (cmd.includes('-f') ? { code: 1, stdout: '', stderr: 'sql error' } : { code: 0, stdout: '', stderr: '' });
  const bad = await runAcceptance({ connectionString: 'postgres://x', run: fakeRun });
  assert.equal(bad.pass, false);
  assert.equal(bad.stage, 'pre:schema.proposal.sql');
});

test('C03.L4: runAcceptance через інʼєкцію — PASS із rolled_back і leftover=0', async () => {
  const fakeRun = async (cmd, stdin) => {
    if (cmd.includes('-f')) return { code: 0, stdout: 'SET\nINSERT 0 1\nROLLBACK\n', stderr: '' };
    if (stdin && stdin.includes('select count(*)')) return { code: 0, stdout: '0\n', stderr: '' };
    return { code: 0, stdout: 'shim-ok\n', stderr: '' };
  };
  const r = await runAcceptance({ connectionString: 'postgres://disposable', run: fakeRun });
  assert.equal(r.pass, true);
  assert.equal(r.stage, 'done');
  assert.equal(r.rolled_back, true);
  assert.equal(r.leftover_fixture_users, 0);
});

test('C03.L4: receipt — fail-closed без вердикту; канонічна форма з always_rollback', () => {
  assert.throws(() => receipt({ env: 'docker-local', result: 'integration', rolledBack: true }), /вердикту/);
  const r = receipt({ env: 'docker-postgres-disposable', result: 'integration', pass: true, rolledBack: true, executedBy: 'agent' });
  assert.equal(r.layer, 'C03.L4');
  assert.equal(r.always_rollback, true);
  assert.equal(r.fixture_emails.length, 3);
  const line = receiptLine(r);
  assert.match(line, /PASS=true, rolled_back=true/);
  assert.match(line, /\(C03\.L4\)/);
});

test('C03.L4: migration.sql існує поруч і ніколи не редагується вручну — маркер generate-schema', async () => {
  const header = await fs.readFile(MIGRATION_SQL, 'utf8');
  assert.ok(header.length > 0);
});

test('C03.L4: integration-run — тільки якщо SYNERA_ACCEPTANCE_PG заданий; інакше чесний SKIP', async (t) => {
  const pg = process.env.SYNERA_ACCEPTANCE_PG;
  if (!pg) {
    t.skip('SYNERA_ACCEPTANCE_PG не заданий — integration-run проти disposable PG пропущений (offline CI)');
    return;
  }
  const container = process.env.SYNERA_ACCEPTANCE_DOCKER ?? 'synera-rls-acceptance';
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const exec = promisify(execFile);
  // disposable reset: гвард schema.proposal.sql вимагає ПОРОЖНІЙ public
  await exec('docker', ['exec', container, 'psql', '-U', 'postgres', '-c', 'drop schema if exists public cascade; drop schema if exists neon_auth cascade; drop schema if exists auth cascade; create schema public;']);
  const psql = async args => {
    const out = await exec('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', ...args]);
    return { code: 0, stdout: out.stdout, stderr: out.stderr };
  };
  const runImpl = async (cmd, input) => {
    if (cmd.includes('acceptance-leftover-check')) return psql(['-tA', '-v', 'ON_ERROR_STOP=1', '-c', input]);
    return psql(['-v', 'ON_ERROR_STOP=1', '-q', ...(input ? ['-c', input] : [])]);
  };
  const r = await runAcceptance({
    connectionString: pg,
    run: async (cmd, input) => {
      if (input !== null && input !== undefined) return runImpl(cmd, input);
      const file = cmd.match(/-f "([^"]+)"/)?.[1];
      await exec('docker', ['cp', file ?? '', container + ':/tmp/acceptance.sql']);
      return psql(['-v', 'ON_ERROR_STOP=1', '-q', '-f', '/tmp/acceptance.sql']);
    },
  });
  assert.equal(r.pass, true, JSON.stringify(r));
  assert.equal(r.leftover_fixture_users, 0, 'ROLLBACK має залишити базу чистою');
});