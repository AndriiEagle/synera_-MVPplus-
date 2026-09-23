// C03.L7 — тести Migration Runner. Запуск з КОРЕНЯ: node neon/migration_runner.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { splitStatements, dryRun, requireApproval, approvalReceipt, apply, APPROVAL_ENV } from './migration_runner.mjs';

test('C03.L7: splitStatements — долар-теги не ріжуться по семіколонах усередині', () => {
  const sql = [
    'create table t(a int);',
    'do $$ begin raise notice \'a;b\'; end $$;',
    'insert into t values (1);',
  ].join('\n');
  const s = splitStatements(sql);
  assert.equal(s.length, 3, JSON.stringify(s));
  assert.ok(s[1].includes('raise notice'));
});

test('C03.L7: splitStatements — тег $fn$ і хвостовий statement без ;', () => {
  const sql = 'create function f() returns int language plpgsql as $fn$ begin return 1; end $fn$;';
  const s = splitStatements(sql);
  assert.equal(s.length, 1);
  assert.ok(s[0].includes('begin return 1; end $fn$'));
});

test('C03.L7: dryRun на реальному case-state.migration.sql — детермінований, нічого не мутує', async () => {
  const a = await dryRun('neon/case-state.migration.sql');
  const b = await dryRun('neon/case-state.migration.sql');
  assert.deepEqual(a, b);
  assert.equal(a.mode, 'dry-run');
  assert.equal(a.live_sql_applied, false);
  assert.ok(a.statements > 0);
  assert.equal(a.verdict, 'SAFE-DRY-RUN', 'міграція не має містити DROP/TRUNCATE: ' + JSON.stringify(a.dangerous));
});

test('C03.L7: dryRun ловить небезпечні statement на синтетичному файлі', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mig-'));
  const file = path.join(dir, 'drop.sql');
  await fs.writeFile(file, 'drop table public.profiles;\ntruncate public.profiles;\n');
  const r = await dryRun(file);
  assert.equal(r.verdict, 'REVIEW-DANGEROUS-STATEMENTS');
  assert.ok(r.dangerous.includes('DROP TABLE'));
  assert.ok(r.dangerous.includes('TRUNCATE'));
  await fs.rm(dir, { recursive: true, force: true });
});

test('C03.L7: requireApproval — fail-closed без operator-id і без backup (українська помилка)', () => {
  assert.throws(() => requireApproval({ approvedBy: '' }), /SYNERA_MIGRATION_APPROVED/);
  assert.throws(() => requireApproval({ approvedBy: 'andrii', backupConfirmed: false }), /backup/);
  const gate = requireApproval({ approvedBy: 'andrii', backupConfirmed: true });
  assert.equal(gate.approved_by, 'andrii');
  assert.equal(gate.backup_confirmed, true);
});

test('C03.L7: apply без approval НЕ виконує жодного statement (fail-closed, контракт §4)', async () => {
  let executed = 0;
  const r = await apply('neon/case-state.migration.sql', {
    approvedBy: '', backupConfirmed: true,
    run: async () => { executed++; return { code: 0, stdout: '', stderr: '' }; },
  }).catch(e => ({ rejected: true, message: e.message }));
  assert.equal(r.rejected, true);
  assert.match(r.message, /SYNERA_MIGRATION_APPROVED/);
  assert.equal(executed, 0, 'без approval жоден statement не виконується');
});

test('C03.L7: apply з approval і backup — preFiles → apply, gate у результаті', async () => {
  const log = [];
  const r = await apply('neon/case-state.migration.sql', {
    approvedBy: 'andrii', backupConfirmed: true, preFiles: ['neon/schema.proposal.sql'],
    run: async cmd => { log.push(cmd); return { code: 0, stdout: 'ok', stderr: '' }; },
  });
  assert.equal(r.applied, true);
  assert.equal(r.stage, 'done');
  assert.equal(r.live_sql_applied, true);
  assert.deepEqual(log, ['psql -f "neon/schema.proposal.sql"', 'psql -f "neon/case-state.migration.sql"']);
  assert.equal(r.gate.approved_by, 'andrii');
});

test('C03.L7: approvalReceipt — детермінована форма для STATUS.md', () => {
  const r = approvalReceipt({ approvedBy: 'andrii', backupConfirmed: true, migration: 'neon/case-state.migration.sql' });
  assert.equal(r.layer, 'C03.L7');
  assert.equal(r.live_sql_applied, false);
  assert.equal(r.migration, 'neon/case-state.migration.sql');
});

test('C03.L7: cleanup-незалежність — splitStatements не мутує вхід і детермінований', () => {
  const sql = 'select 1;\nselect 2;';
  const a = splitStatements(sql);
  const b = splitStatements(sql);
  assert.deepEqual(a, b);
  assert.equal(a.length, 2);
});