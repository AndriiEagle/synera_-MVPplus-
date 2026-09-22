// C15.L5 — Cascade Orchestrator: MA4 гіпотеза → Template Selector → Forge → Preview →
// Confirm → Deploy → Audit Log (immutable, hash-chained) → Rollback.
// Канон: plan/readiness/ICEBERG_ARCHITECTURE.uk.md §2.2, §4.2, §4.3.
// Дизайн: ін'єкції now/logPath/deploy/rollback для детермінізму; deploy делегується
// у web_launch/cascade.mjs (runtime SSE-поверхня); аудит — окремий iceberg/cascade_log.jsonl
// з hash-ланцюгом (prev_hash → entry_hash, genesis = 'GENESIS').
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_LOG_PATH = path.join(MODULE_DIR, 'cascade_log.jsonl');
export const GENESIS = 'GENESIS';

const LEVEL_STEPS = Object.freeze({
  L1: ['select', 'forge', 'preview', 'confirm', 'deploy', 'log'],
  L2: ['select', 'forge', 'reorder', 'preview', 'confirm', 'deploy', 'log'],
  L3: ['select', 'theme', 'preview', 'confirm', 'deploy', 'log'],
});

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalJson(value[k])).join(',') + '}';
}

function sha256Hex(value) {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}

function entryHash(entry) {
  return sha256Hex({ seq: entry.seq, payload: entry.payload, prev_hash: entry.prev_hash });
}

/** Template Selector: L1 → forge-only, L2 → forge+reorder, L3 → event theme. */
export function selectTemplate(level) {
  if (!['L1', 'L2', 'L3'].includes(level)) {
    throw new Error('Некоректна гіпотеза каскаду: рівень має бути L1, L2 або L3');
  }
  return LEVEL_STEPS[level];
}

// Мінімальний WCAG-контраст для forge-варіантів (та сама математика, що й у token_forge).
function lum(hex) {
  if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error('Некоректний колір: ' + String(hex));
  const lin = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(fg, bg) {
  const [hi, lo] = lum(fg) >= lum(bg) ? [lum(fg), lum(bg)] : [lum(bg), lum(fg)];
  return (hi + 0.05) / (lo + 0.05);
}

const AA_PAIRS = Object.freeze([
  ['--color-green-primary', '--color-bg'],
  ['--color-warning-text', '--color-warning-bg'],
]);
const FORGE_BASE = Object.freeze({
  '--color-green-primary': '#254f3b',
  '--color-bg': '#f6f5ef',
  '--color-warning-text': '#804024',
  '--color-warning-bg': '#fff0e5',
});

export function createOrchestrator(options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const logPath = options.logPath ?? DEFAULT_LOG_PATH;
  const appendLog = options.appendLog ?? (line => fs.promises.appendFile(logPath, line + '\n', 'utf8'));
  const deployFn = options.deploy ?? null; // runtime-деплой у web_launch/cascade.mjs — поза тестами
  const rollbackFn = options.rollback ?? null;

  const plans = new Map();
  const confirmed = new Set();

  function fromHypothesis({ level, cohort, hypothesis, proposal }) {
    if (!['L1', 'L2', 'L3'].includes(level)) throw new Error('Некоректна гіпотеза каскаду: рівень має бути L1, L2 або L3');
    const dropoff = hypothesis?.dropoff;
    if (typeof dropoff !== 'number' || Number.isNaN(dropoff) || dropoff <= 0) {
      throw new Error('Некоректна гіпотеза каскаду: dropoff має бути > 0');
    }
    if (level === 'L2' && (!cohort || typeof cohort !== 'string')) {
      throw new Error('Некоректна гіпотеза каскаду: для L2 потрібна когорта');
    }
    const base = { level, cohort: cohort ?? null, hypothesis, proposal: proposal ?? {} };
    const createdAt = now();
    const plan = {
      id: 'plan-' + sha256Hex({ ...base, createdAt }).slice(0, 16),
      ...base,
      steps: LEVEL_STEPS[level],
      sha256: sha256Hex({ ...base, createdAt }),
      createdAt,
    };
    plans.set(plan.id, plan);
    return Object.freeze(plan);
  }

  /** Preview: A консервативний (baseline), B агресивний (proposal.tokens); WCAG AA гейт обох. */
  function preview(planId) {
    const plan = plans.get(planId);
    if (!plan) throw new Error('Некоректна гіпотеза каскаду: план не знайдений');
    const forge = patch => {
      const merged = { ...FORGE_BASE, ...patch };
      for (const [fg, bg] of AA_PAIRS) {
        if (contrastRatio(merged[fg], merged[bg]) < 4.5) {
          throw new Error('Некоректна гіпотеза каскаду: пара не проходить WCAG AA');
        }
      }
      return Object.freeze(merged);
    };
    const makeVariant = (id, kind, tokensPatch) => {
      const tokens = forge(tokensPatch);
      return Object.freeze({ id, kind, tokens, sha256: sha256Hex(tokens) });
    };
    const aggressivePatch = plan.level === 'L3' ? {} : (plan.proposal?.tokens ?? {});
    return Object.freeze({
      planId: plan.id,
      level: plan.level,
      variants: [
        makeVariant('A', 'conservative', {}),
        makeVariant('B', 'aggressive', aggressivePatch),
      ],
      requiresOperatorConfirm: true,
    });
  }

  /** Немає тихих змін: confirm тільки з непорожнім operatorId (канон §4.3). */
  function confirm(planId, operatorId) {
    if (typeof operatorId !== 'string' || !operatorId) throw new Error('Потрібне підтвердження оператора');
    if (!plans.has(planId)) throw new Error('Некоректна гіпотеза каскаду: план не знайдений');
    confirmed.add(planId);
    return { planId, operatorId, confirmedAt: now(), state: 'confirmed' };
  }

  async function readLastEntry() {
    try {
      const data = await fs.promises.readFile(logPath, 'utf8');
      const lines = data.split('\n').filter(Boolean);
      return lines.length ? JSON.parse(lines[lines.length - 1]) : null;
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  /** Deploy = runtime-деплой (інʼєкція) + аудит-запис у hash-ланцюг. */
  async function deployAndLog(planId, operatorId) {
    if (!plans.has(planId)) throw new Error('Некоректна гіпотеза каскаду: план не знайдений');
    if (!confirmed.has(planId)) throw new Error('Потрібне підтвердження оператора');
    const plan = plans.get(planId);
    if (deployFn) await deployFn(plan);
    const last = await readLastEntry();
    const payload = {
      planId,
      operatorId,
      artifact_sha256: plan.sha256,
      changed_paths: plan.level === 'L3' ? ['tokens', 'markerStyle', 'banner'] : ['tokens', 'layout'],
      before_metrics: plan.hypothesis,
      test_results: 'pending',
      timestamp: now(),
    };
    const entry = { seq: (last?.seq ?? 0) + 1, payload, prev_hash: last?.entry_hash ?? GENESIS };
    entry.entry_hash = sha256Hex({ seq: entry.seq, payload: entry.payload, prev_hash: entry.prev_hash });
    await appendLog(JSON.stringify(entry));
    return entry;
  }

  /** Rollback останнього запису: runtime-відкат + аудит-запис. */
  async function rollbackLast(operatorId = 'system-rollback') {
    if (rollbackFn) await rollbackFn();
    const last = await readLastEntry();
    const payload = {
      planId: last?.payload?.planId ?? null,
      operatorId,
      artifact_sha256: last?.prev_hash ?? GENESIS,
      changed_paths: ['rollback'],
      before_metrics: null,
      test_results: 'rollback',
      timestamp: now(),
    };
    const entry = { seq: (last?.seq ?? 0) + 1, payload, prev_hash: last?.entry_hash ?? GENESIS };
    entry.entry_hash = sha256Hex({ seq: entry.seq, payload: entry.payload, prev_hash: entry.prev_hash });
    await appendLog(JSON.stringify(entry));
    return entry;
  }

  return Object.freeze({ fromHypothesis, preview, confirm, deployAndLog, rollbackLast });
}

/** Верифікація hash-ланцюга: prev_hash лінкується, entry_hash відтворюється. */
export function verifyLog(logLines) {
  let prevHash = GENESIS;
  for (let i = 0; i < logLines.length; i++) {
    let entry;
    try { entry = JSON.parse(logLines[i]); } catch { return { pass: false, brokenAt: i }; }
    if (entry.prev_hash !== prevHash) return { pass: false, brokenAt: i };
    if (sha256Hex({ seq: entry.seq, payload: entry.payload, prev_hash: entry.prev_hash }) !== entry.entry_hash) {
      return { pass: false, brokenAt: i };
    }
    prevHash = entry.entry_hash;
  }
  return { pass: true, brokenAt: null };
}

export { canonicalJson, sha256Hex, contrastRatio };