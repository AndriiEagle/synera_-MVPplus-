// C15.L6 — Operator Dashboard Integration: когорти + превʼю-композиція + audit trail.
// Канон: plan/readiness/ICEBERG_ARCHITECTURE.uk.md §4 (перебудова L2 для когорти:
// map style + layout + flags → preview → confirm → deploy), §4.3 (no silent changes), §8 (max 3).
// Самодостатній логічний шар: НЕ імпортує sibling-модулі (їх контракти зафіксовані в каноні),
// не пише на диск, не торкається consent-гейтів. UI-рендер — plain-text панель для майбутнього UI.
import { createHash } from 'node:crypto';

const CANONICAL_SCREENS = Object.freeze(['welcome', 'people', 'profile', 'meetings', 'settings']);

export const COHORTS = Object.freeze([
  Object.freeze({ id: 'designers', mapStyleDefault: 'schematic', layoutPreference: { first: 'profile' }, modes: ['exchange', 'referral'] }),
  Object.freeze({ id: 'sales', mapStyleDefault: 'osm', layoutPreference: { first: 'people' }, modes: ['exchange', 'paid_service'] }),
  Object.freeze({ id: 'winterthur-devs', mapStyleDefault: 'schematic', layoutPreference: { first: 'meetings' }, modes: ['exchange'] }),
]);

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalJson(value[k])).join(',') + '}';
}

function sha256Hex(value) {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}

export function listCohorts() {
  return COHORTS.map(c => Object.freeze({ ...c }));
}

function isPermutationOf(order, set) {
  return Array.isArray(order) && order.length === set.length && new Set(order).size === set.length && order.every(s => set.includes(s));
}

/**
 * Превʼю перебудови L2 для когорти: порядок екранів = валідна перестановка канонічного набору.
 * @returns {{cohort, level:'L2', plan:{mapStyle, layoutOrder, enabledModes}, sha256, requiresOperatorConfirm:true}}
 */
export function composePreview(cohortId, intent = {}) {
  const cohort = COHORTS.find(c => c.id === cohortId);
  if (!cohort) throw new Error('Невідома когорта: ' + cohortId);
  const layoutOrder = intent.layoutOrder ?? [...CANONICAL_SCREENS];
  if (!isPermutationOf(layoutOrder, CANONICAL_SCREENS)) {
    throw new Error('Некоректний порядок екранів: має бути перестановкою ' + CANONICAL_SCREENS.join(','));
  }
  if (intent.mapStyle !== undefined && !['osm', 'satellite', 'schematic'].includes(intent.mapStyle)) {
    throw new Error('Невідома карта-підкладка: ' + intent.mapStyle);
  }
  const plan = {
    mapStyle: intent.mapStyle ?? cohort.mapStyleDefault,
    layoutOrder: [...layoutOrder],
    enabledModes: [...(intent.enabledModes ?? cohort.modes)],
  };
  return Object.freeze({
    cohort: cohortId,
    level: 'L2',
    plan,
    sha256: sha256Hex({ cohortId, plan }),
    requiresOperatorConfirm: true,
  });
}

/** Канонічний audit-рядок: ключі відсортовані, один JSON-рядок (канон §4.3 audit trail). */
export function auditLine(entry) {
  const canonical = {
    cohortId: entry.cohortId,
    decision: entry.decision,
    intentId: entry.intentId,
    operatorId: entry.operatorId,
    prev_hash: entry.prev_hash,
    sha256: entry.sha256,
    ts: entry.ts,
  };
  return JSON.stringify(canonical);
}

/** Audit trail з hash-ланцюгом: prev_hash кожного запису = sha256 попереднього канонічного рядка. */
export function auditTrail(entries) {
  let prevHash = 'GENESIS';
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.prev_hash !== prevHash) return { chainValid: false, brokenAt: i };
    const expected = sha256Hex({ decision: entry.decision, intentId: entry.intentId, sha256: entry.sha256, ts: entry.ts });
    if (entry.entry_hash !== expected) return { chainValid: false, brokenAt: i };
    prevHash = entry.entry_hash;
  }
  return { chainValid: true, brokenAt: null };
}

/** Новий audit-запис з hash-ланцюгом (хелпер для побудови коректних послідовностей). */
export function makeAuditEntry({ ts, cohortId, intentId, decision, sha256, operatorId, prevHash }) {
  const base = { decision, intentId, sha256, ts };
  return Object.freeze({
    ...base,
    cohortId,
    operatorId,
    prev_hash: prevHash,
    entry_hash: sha256Hex(base),
  });
}

/** Plain-text панель превʼю для майбутнього UI (канон §4.1: side-by-side, default = safe). */
export function renderPreviewPanel(preview) {
  return [
    'ПРЕВʼЮ ПЕРЕБУДОВИ · ' + preview.level + ' · sha256=' + preview.sha256.slice(0, 12),
    'Когорта: ' + preview.cohort,
    'Порядок екранів: ' + preview.plan.layoutOrder.join(' > '),
    'Карта: ' + preview.plan.mapStyle,
    'Режими: ' + preview.plan.enabledModes.join(', '),
    'Потрібне підтвердження оператора: так',
  ].join('\n');
}

/** Батч-превʼю: максимум 3 когорти на превʼю (канон §8: Max 3 workers). */
export function batchPreview(cohortIds, intent = {}) {
  if (cohortIds.length > 3) throw new Error('Максимум 3 когорти на превʼю');
  const order = COHORTS.map(c => c.id);
  return cohortIds.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b)).map(id => composePreview(id, intent));
}