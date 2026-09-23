// C03.L7 — Migration Runner: DRY-RUN за замовчуванням; live-apply тільки з явним
// operator approval. Канон: bible/STATUS.md:23 (frozen history), FM-013 (applied migration —
// заморожена історія), bible/STATUS.md:27 (apply тільки після acceptance на disposable базі).
// Тихий apply неможливий: немає SYNERA_MIGRATION_APPROVED=<operator-id> → нічого не мутує.
import { readFile } from 'node:fs/promises';

export const APPROVAL_ENV = 'SYNERA_MIGRATION_APPROVED';

/**
 * Розбір SQL на statements — грубий і ЧЕСНО так позначений: враховує долар-теги ($$, $fn$),
 * рядкові коментарі; семіколони всередині одинарних рядків теж ріже (для dry-run рахунку досить).
 * Ця функція НЕ використовується для виконання — виконання завжди цілим файлом через psql.
 */
export function splitStatements(sql) {
  const noComments = sql.replace(/--.*$/gm, '');
  const out = [];
  let buf = '';
  let tag = null;
  let i = 0;
  while (i < noComments.length) {
    const ch = noComments[i];
    if (!tag && ch === '$') {
      const m = noComments.slice(i).match(/^\$([a-zA-Z_][a-zA-Z0-9_]*)?\$/);
      if (m) { buf += m[0]; i += m[0].length; tag = m[0]; continue; }
      buf += ch; i++; continue; // '$' без тегу — звичайний символ
    }
    if (tag) {
      if (ch === '$' && noComments.startsWith(tag, i)) {
        buf += tag;
        i += tag.length;
        tag = null;
      } else {
        buf += ch;
        i++;
      }
      continue;
    }
    if (ch === ';') { const s = buf.trim(); if (s) out.push(s); buf = ''; i++; continue; }
    buf += ch; i++;
  }
  const last = buf.trim();
  if (last) out.push(last);
  return out;
}

/**
 * Dry-run (дефолт): статичний аналіз міграції — statements, небезпечні оператори, вердикт.
 * Нічого не мутує ніде. Це і є дефолтний режим машини.
 */
export async function dryRun(migrationPath) {
  const sql = await readFile(migrationPath, 'utf8');
  const statements = splitStatements(sql);
  const dangerous = [...sql.matchAll(/^\s*(DROP\s+(SCHEMA|TABLE|DATABASE)|TRUNCATE)\b/gim)].map(m => m[1].toUpperCase());
  return {
    mode: 'dry-run',
    migration: migrationPath,
    statements: statements.length,
    dangerous,
    live_sql_applied: false,
    verdict: dangerous.length === 0 ? 'SAFE-DRY-RUN' : 'REVIEW-DANGEROUS-STATEMENTS',
  };
}

/** Гейт live-apply: approval + backup — обидва обовʼязкові, інакше українська помилка. */
export function requireApproval({ approvedBy, backupConfirmed }) {
  if (typeof approvedBy !== 'string' || !approvedBy.trim()) {
    throw new Error('Живе застосування міграції потребує SYNERA_MIGRATION_APPROVED=<operator-id>');
  }
  if (backupConfirmed !== true) {
    throw new Error('Живе застосування міграції потребує підтвердження backup (snapshot Neon перед apply)');
  }
  return { approved_by: approvedBy.trim(), approved_at: null, backup_confirmed: true };
}

/** Формат рядка approval для bible/STATUS.md (один перемикач після відповіді Q3). */
export function approvalReceipt({ approvedBy, backupConfirmed, migration }) {
  const gate = requireApproval({ approvedBy, backupConfirmed });
  return {
    layer: 'C03.L7',
    migration,
    approved_by: gate.approved_by,
    backup_confirmed: gate.backup_confirmed,
    live_sql_applied: false, // стає true лише в реальному прогоні, який робить runner з run-інʼєкцією
  };
}

/**
 * Live-apply: ПОТРЕБУЄ approval + backup; сам прогон — через injectable run (docker exec / psql).
 */
export async function apply(migrationPath, { approvedBy, backupConfirmed, run, preFiles = [] }) {
  const gate = requireApproval({ approvedBy, backupConfirmed });
  if (typeof run !== 'function') throw new Error('apply потребує injectable run (psql/docker exec)');
  const pre = [];
  for (const file of preFiles) {
    const r = await run(`psql -f "${file.replace(/\\/g, '/')}"`, null);
    if (r.code !== 0) return { applied: false, stage: 'pre:' + String(file), output: r.stderr || r.stdout, gate };
    pre.push(String(file));
  }
  const sql = await readFile(migrationPath, 'utf8');
  const applyRun = await run(`psql -f "${migrationPath.replace(/\\/g, '/')}"`, null);
  if (applyRun.code !== 0) return { applied: false, stage: 'apply', gate, output: applyRun.stderr || applyRun.stdout, pre };
  return { applied: true, stage: 'done', gate, pre, live_sql_applied: true };
}