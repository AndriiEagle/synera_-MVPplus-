// C03.L4 — локальна RLS-акцептанса на DISPOSABLE базі (REVERSIBLE_DEFAULT: локальний Docker Postgres).
// Канон: bible/STATUS.md:27 (Neon branch АБО локальний Docker Postgres; окреме human approval H1
// реалізовано як REVERSIBLE_DEFAULT за наказом оператора: disposable, $0, rollback = контейнер),
// neon/case-state.acceptance.sql:1 («Requires exact approval. Always ROLLBACK.»).
// Дизайн: offline-валідація SQL (детермінована, без БД) + integration-запуск проти реального PG
// через pg-клієнт недоступний без залежностей → використовує psql CLI, якщо є, або чітко каже SKIP.
// Модуль чистий: ніяких побічних записів, окрім receipt через ін'єкцію.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ACCEPTANCE_SQL = path.join(MODULE_DIR, 'case-state.acceptance.sql');
export const MIGRATION_SQL = path.join(MODULE_DIR, 'case-state.migration.sql');

const FIXTURE_EMAILS = ['a@synera-acceptance.example', 'b@synera-acceptance.example', 'c@synera-acceptance.example'];

/** Структурна валідація acceptance SQL: ROLLBACK обовʼязковий, фікстури — тільки disposable-домени. */
export async function validateAcceptanceSql(sqlPath = ACCEPTANCE_SQL) {
  const sql = await fs.readFile(sqlPath, 'utf8');
  const violations = [];
  if (!/ROLLBACK\s*;?\s*$/im.test(sql.trim())) violations.push('СКРИПТ НЕ ЗАВЕРШУЄТЬСЯ ROLLBACK');
  if (!/^begin\s*;/im.test(sql)) violations.push('НЕМАЄ begin (транзакційний контейнер)');
  if (!sql.includes('set local role authenticated')) violations.push('НЕМАЄ set local role authenticated (RLS-контекст)');
  for (const email of FIXTURE_EMAILS) {
    if (!sql.includes(email)) violations.push('ВІДСУТНЯ ФІКСТУРА: ' + email);
  }
  // Disposable-гігієна: лише example-домени, без реальних PII.
  const emails = [...sql.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)].map(m => m[0]);
  for (const e of emails) {
    if (!e.endsWith('.example')) violations.push('NON-DISPOSABLE EMAIL: ' + e);
  }
  // Нічого поза транзакцією, що мутує: DDL SET ROLE / INSERT / UPDATE ок, але DROP/ALTER схеми глобально — заборонені
  for (const m of sql.matchAll(/^\s*(DROP\s+(SCHEMA|DATABASE)|ALTER\s+SYSTEM)\b/gim)) {
    violations.push('ЗАБОРОНЕНИЙ STATEMENT: ' + m[1]);
  }
  return { pass: violations.length === 0, violations, statements: (sql.match(/;\s*(?:\n|$)/g) ?? []).length };
}

/**
 * neon_auth shim для локального Postgres: створює мінімальний neon_auth."user",
 * якого очікує acceptance.sql. Тільки для DISPOSABLE бази.
 */
export function neonAuthShimSql() {
  return [
    'create schema if not exists neon_auth;',
    `create table if not exists neon_auth."user" (
  id uuid primary key,
  name text not null default '',
  email text not null default '',
  "emailVerified" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);`,
    // synera_user_id() створює schema.proposal.sql — тут НЕ дублюємо
    // Neon-гвард schema.proposal.sql перевіряє to_regprocedure('auth.uid()') — локальний аналог провайдера
    'create schema if not exists auth;',
    `create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$$;`,
    // Neon Data API ролі, на які посилаються RLS-політики schema.proposal.sql
    `do $$ begin
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select from pg_roles where rolname = 'anonymous') then create role anonymous nologin; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;`,
  ].join('\n');
}

/** Збірка receipts-обʼєкта (детермінована форма для bible/STATUS.md). */
export function receipt({ env, result, pass, rolledBack, executedBy, approvedBy }) {
  if (typeof pass !== 'boolean') throw new Error('Receipt без вердикту неможливий');
  return {
    layer: 'C03.L4',
    env: String(env),
    result: String(result),
    pass,
    rolled_back: rolledBack === true,
    executed_by: String(executedBy || 'agent'),
    approved_by: approvedBy ? String(approvedBy) : 'operator-default:disposable-local',
    fixture_emails: [...FIXTURE_EMAILS],
    sql: 'neon/case-state.acceptance.sql',
    always_rollback: true,
  };
}

/** Формат рядка receipt для bible/STATUS.md (prepend-стиль списку приймань). */
export function receiptLine(r) {
  return `- \`${r.env}\` acceptance ${r.result}: PASS=${r.pass}, rolled_back=${r.rolled_back}, by ${r.executed_by}, approved=${r.approved_by} (C03.L4)`;
}

/**
 * Integration-запуск на disposable PG через injectable runner (psql / docker exec).
 * Потік: neon_auth shim → SCHEMA_SQL (заморожений, disposable) → MIGRATION_SQL → acceptance.sql
 * (begin…ROLLBACK) → контроль, що фікстури НЕ залишились.
 * @param {{connectionString: string, run?: (cmd:string, input?:string)=>Promise<{code:number, stdout:string, stderr:string}>, preFiles?: string[]}} opts
 */
export async function runAcceptance(opts) {
  const { connectionString, run, preFiles = [path.join(MODULE_DIR, 'schema.proposal.sql'), MIGRATION_SQL] } = opts ?? {};
  if (!connectionString || !run) throw new Error('Потрібні connectionString і run (інʼєкція виконавця)');
  const shim = neonAuthShimSql();
  // 1) shim (без транзакції — disposable база, shim ідемпотентний)
  const shimRun = await run(`psql "${connectionString}" -v ON_ERROR_STOP=1 -q`, shim);
  if (shimRun.code !== 0) return { pass: false, stage: 'shim', output: shimRun.stderr || shimRun.stdout };
  // 2) preFiles: заморожена схема + міграція (ПЕРЕД acceptance, який на них посилається)
  for (const file of preFiles) {
    const preRun = await run(`psql "${connectionString}" -v ON_ERROR_STOP=1 -q -f "${file.replace(/\\/g, '/')}"`, null);
    if (preRun.code !== 0) return { pass: false, stage: 'pre:' + path.basename(file), output: preRun.stderr || preRun.stdout };
  }
  // 3) acceptance.sql — файл виконується як є; завершується ROLLBACK => нічого не лишається
  const accRun = await run(`psql "${connectionString}" -v ON_ERROR_STOP=1 -q -f "${ACCEPTANCE_SQL.replace(/\\/g, '/')}"`, null);
  if (accRun.code !== 0) return { pass: false, stage: 'acceptance', output: accRun.stderr || accRun.stdout };
  // 3) контроль disposable-гігієни: фікстури не мали залишитись (ROLLBACK)
  const leftoverSql = "select count(*) from neon_auth.\"user\" where email like '%@synera-acceptance.example'";
  const checkRun = await run(`psql "${connectionString}" -tAc --acceptance-leftover-check`, leftoverSql);
  const leftover = parseInt((checkRun.stdout ?? '').trim(), 10);
  if (!Number.isFinite(leftover)) return { pass: false, stage: 'verify', output: checkRun.stdout + checkRun.stderr };
  return {
    pass: leftover === 0,
    stage: 'done',
    rolled_back: leftover === 0,
    output: accRun.stdout,
    leftover_fixture_users: leftover,
  };
}