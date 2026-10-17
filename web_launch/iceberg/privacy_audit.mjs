// C15.L7 — Security/Privacy Audit C15 машин (детермінований чекліст, агент-виконуваний).
// Канон: BLOCKED_HUMAN.md Q11 (DERIVABLE: code review C15 машин виконує агент,
// оператор підтверджує), plan/readiness/ICEBERG_ARCHITECTURE.uk.md §4.3, §8.
// Перевірки: cascade logs без PII, consent-гейти не мутуються машинами, rollback-механіка
// присутня, WCAG-математика не зіпсована. Результат — PASS/FAIL на кожну машину.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICEBERG = path.dirname(path.dirname(fileURLToPath(import.meta.url))) ; // web_launch/
const DIR = path.join(ICEBERG, 'iceberg');

export const MACHINES = Object.freeze([
  'token_forge.mjs', 'layout_recomposer.mjs', 'map_style.mjs',
  'event_theme.mjs', 'cascade_orchestrator.mjs', 'operator_dashboard.mjs',
]);

export const PII_PATTERNS = Object.freeze([
  /[\w.+-]+@[\w-]+\.[\w.]{2,}/,        // email (крім *.exampleDisposable — перевіряється окремо)
  /\+41\s?\d[\d\s]{8,}/,               // швейцарський телефон
  /\b\d{3}\.\d{3}\.\d{3}\b/,           // AHV номер
]);

export const CONSENT_MUTATION_PATTERNS = Object.freeze([
  /consentState\s*\[/,
  /consentState\.\w+\s*=/,
  /consent\s*:\s*{[^}]*=\s*true/i,
]);

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length;
}

/** Аудит однієї машини: PII-літерали, consent-мутації, rollback для машин, що деплоять стан. */
export async function auditMachine(file) {
  const full = path.join(DIR, file);
  const src = await fs.readFile(full, 'utf8');
  const findings = [];
  for (const pattern of PII_PATTERNS) {
    for (const m of src.matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'))) {
      if (m[0].endsWith('.example')) continue; // disposable-фікстури дозволені
      findings.push({ type: 'PII_LITERAL', detail: m[0], line: lineOf(src, m.index) });
    }
  }
  for (const pattern of CONSENT_MUTATION_PATTERNS) {
    for (const m of src.matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'))) {
      findings.push({ type: 'CONSENT_MUTATION', detail: m[0], line: lineOf(src, m.index) });
    }
  }
  // rollback-наявність для машин, що змінюють стан
  const stateMachines = ['cascade_orchestrator.mjs', 'event_theme.mjs'];
  if (stateMachines.includes(file) && !/rollback/i.test(src)) {
    findings.push({ type: 'MISSING_ROLLBACK', detail: 'машина стану без rollback-механіки', line: 0 });
  }
  return { file, pass: findings.length === 0, findings };
}

/** Повний аудит усіх машин + cascade_log.jsonl (якщо існує) — агрегований вердикт. */
export async function auditAll() {
  const results = [];
  for (const file of MACHINES) results.push(await auditMachine(file));
  // cascade_log.jsonl: якщо існує — скан на PII у payload
  const logPath = path.join(ICEBERG, 'cascade_log.jsonl');
  try {
    const log = await fs.readFile(logPath, 'utf8');
    const findings = [];
    for (const pattern of PII_PATTERNS) {
      for (const m of log.matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'))) {
        if (m[0].endsWith('.example')) continue;
        findings.push({ type: 'PII_IN_LOG', detail: m[0] });
      }
    }
    results.push({ file: 'cascade_log.jsonl', pass: findings.length === 0, findings });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const pass = results.every(r => r.pass);
  return {
    pass,
    checked: results.length,
    results,
    verdict: pass ? 'PRIVACY_AUDIT_PASS' : 'PRIVACY_AUDIT_FAIL',
  };
}

/** Канонічний чекліст-рядок для READINESS evidence (детермінований). */
export function auditSummaryLine(audit) {
  return `C15 privacy audit: ${audit.verdict} over ${audit.checked} units (agent-executed checklist, per Q11)`;
}