// Канон: plan/readiness/ICEBERG_ARCHITECTURE.uk.md §1.1 L3, §1.2, §8.
// Інваріанти: тільки pre-approved bundles; гейти згоди НІКОЛИ не змінюються; rollback < 1s (O(1) константа).
import { createHash } from 'node:crypto';

export const ALLOWED_TOKEN_NAMES = Object.freeze([
  '--color-green-primary', '--color-green-hover', '--color-green-focus',
  '--color-muted', '--color-muted-darker',
  '--color-line', '--color-bg', '--color-bg-panel', '--color-bg-map',
  '--color-bg-map-marker', '--color-warning-text', '--color-warning-bg',
  '--color-notice-text', '--color-notice-bg',
]);

const SEVEN_CONSENT_GATES = Object.freeze([
  'visibility', 'comparison', 'introduction', 'external_ai',
  'recording', 'summary', 'communication',
]);

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalJson(value[k])).join(',') + '}';
}

export const BUNDLES = Object.freeze([
  Object.freeze({
    id: 'new-year', name: 'Новий рік',
    activeFrom: '12-20', activeTo: '01-06', // вікно через рік (wrap-around)
    markerStyle: 'schematic',
    tokens: Object.freeze({
      '--color-green-primary': '#19513e',
      '--color-bg': '#f5f7f4',
      '--color-notice-bg': '#e8f2e9',
      '--color-bg-map-marker': '#287453',
    }),
    banner: Object.freeze({ title: 'Новий рік у Synera', text: 'Святкові зустрічі: узгодьте одну маленьку спільну перемогу до кінця року.' }),
  }),
  Object.freeze({
    id: 'startup-nights', name: 'Startup Nights',
    activeFrom: '03-01', activeTo: '03-14',
    markerStyle: 'satellite',
    tokens: Object.freeze({
      '--color-green-primary': '#254f3b',
      '--color-notice-bg': '#edf0e4',
      '--color-bg-map-marker': '#305b45',
    }),
    banner: Object.freeze({ title: 'Startup Nights', text: 'Глибокий мачинг для команд: знайдіть партнера для спільного експерименту.' }),
  }),
  Object.freeze({
    id: 'summer-forum', name: 'Літній форум',
    activeFrom: '06-15', activeTo: '08-20',
    markerStyle: 'osm',
    tokens: Object.freeze({
      '--color-bg': '#f6f5ef',
      '--color-notice-bg': '#e8f2e9',
      '--color-green-primary': '#21694c',
    }),
    banner: Object.freeze({ title: 'Літній форум', text: 'Літні зустрічі надворі: один невеликий результат для кожного.' }),
  }),
]);

function inWindow(dateMMDD, from, to) {
  if (from <= to) return dateMMDD >= from && dateMMDD <= to;
  return dateMMDD >= from || dateMMDD <= to; // wrap-around (Новий рік)
}

function toMMDD(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Некоректна дата: ' + String(dateStr));
  }
  return dateStr.slice(5);
}

/** Активний bundle для дати YYYY-MM-DD або null (поза усіма вікнами). */
export function activeBundle(dateStr) {
  const d = toMMDD(dateStr);
  return BUNDLES.find(b => inWindow(d, b.activeFrom, b.activeTo)) ?? null;
}

function sha256Hex(value) {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}

/** Валідація набору токенів теми (чиста функція): fail-closed на чужі/криві токени. */
export function validateBundleTokens(tokens = {}) {
  for (const [key, value] of Object.entries(tokens)) {
    if (!ALLOWED_TOKEN_NAMES.includes(key)) throw new Error('Тема містить недозволений токен: ' + key);
    if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value)) throw new Error('Тема містить некоректний колір: ' + key);
  }
}

// Self-audit при завантаженні: кожен shipped bundle автоматично проходить валідацію.
for (const bundle of BUNDLES) validateBundleTokens(bundle.tokens);

/** Застосування ПРЕД-АУДОВАНОГО bundle: тільки identity зі списку; fail-closed. */
export function applyTheme(bundle) {
  if (!bundle || !BUNDLES.includes(bundle)) throw new Error('Тема не в pre-audited списку');
  validateBundleTokens(bundle.tokens);
  return Object.freeze({
    bundleId: bundle.id,
    tokens: Object.freeze({ ...bundle.tokens }),
    markerStyle: bundle.markerStyle,
    banner: bundle.banner,
    sha256: sha256Hex(bundle.tokens),
    appliedAt: null,
  });
}

const RESET = Object.freeze({ bundleId: null, tokens: null, markerStyle: null, banner: null, sha256: null });

/** Rollback < 1s: чиста константа скиду — O(1), нуль DOM/мережі. */
export function rollback() {
  return RESET;
}

export function listConsentGates() {
  return [...SEVEN_CONSENT_GATES];
}

/** Тематична операція не має права торкати жоден із 7 гейтів згоди (канон §1.2). */
export function consentInvariantCheck(themeOperation = {}) {
  const violations = [];
  for (const gate of SEVEN_CONSENT_GATES) {
    if (Object.hasOwn(themeOperation, gate)) violations.push('Заборонено міняти гейти згоди: ' + gate);
    if (Object.hasOwn(themeOperation, 'consent.' + gate)) violations.push('Заборонено міняти гейти згоди: ' + gate);
  }
  return { pass: violations.length === 0, violations };
}