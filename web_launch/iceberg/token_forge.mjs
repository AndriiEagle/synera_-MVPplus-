// C15.L1 — Token Forge: дозволений список токенів + суворий WCAG 2.2 AA guard + preview/reset.
// Канон: plan/readiness/ICEBERG_ARCHITECTURE.uk.md §2.1/§2.3/§1.2.
// Інваріанти: патчится ЛИШЕ зі списку дозволених; WCAG AA — підлога; гейти згоди не торкаються.
import { createHash } from 'node:crypto';

// Дозволений список — реальні імена з web_launch/tokens.css (єдине джерело правди кольорів).
export const ALLOWED_TOKENS = Object.freeze([
  '--color-green-primary', '--color-green-hover', '--color-green-focus',
  '--color-muted', '--color-muted-darker', '--color-muted-lighter',
  '--color-line', '--color-line-input',
  '--color-bg', '--color-bg-panel', '--color-bg-input', '--color-bg-map',
  '--color-bg-map-marker', '--color-warning-text',
  '--color-warning-bg', '--color-notice-text', '--color-notice-bg',
]);

// Базовий набір = поточні значення tokens.css (перевіряються тестом проти тексту tokens.css).
export const BASELINE = Object.freeze({
  '--color-green-primary': '#254f3b',
  '--color-green-hover': '#21694c',
  '--color-green-focus': '#31805a',
  '--color-muted': '#667467',
  '--color-muted-darker': '#425644',
  '--color-muted-lighter': '#78836a',
  '--color-line': '#dbe0d4',
  '--color-line-input': '#becfc2',
  '--color-bg': '#f6f5ef',
  '--color-bg-map': '#e8eddf',
  '--color-bg-map-marker': '#254f3b',
  '--color-warning-text': '#804024',
  '--color-warning-bg': '#fff0e5',
  '--color-notice-text': '#61704f',
  '--color-notice-bg': '#edf0e4',
});

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function listAllowedTokens() {
  return [...ALLOWED_TOKENS];
}

export function resetTokenSet() {
  return { ...BASELINE };
}

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalJson(value[k])).join(',') + '}';
}

export function sha256Canonical(value) {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}

/** Патчить ЛИШЕ дозволені токени валідними hex-кольорами; fail-closed. */
export function forgeTokens(patch = {}) {
  const keys = Object.keys(patch);
  for (const key of keys) {
    if (!ALLOWED_TOKENS.includes(key)) throw new Error('Токен не в дозволеному списку: ' + key);
    if (typeof patch[key] !== 'string' || !HEX_RE.test(patch[key])) throw new Error('Некоректний колір для ' + key);
  }
  return Object.freeze({ ...resetTokenSet(), ...patch });
}

// --- WCAG 2.x relative luminance / contrast (обчислення за специфікацією) ---

export function hexToRgb(hex) {
  if (typeof hex !== 'string' || !HEX_RE.test(hex)) throw new Error('Некоректний колір: ' + String(hex));
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  };
}

function channelLinear(c) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channelLinear(r) + 0.7152 * channelLinear(g) + 0.0722 * channelLinear(b);
}

export function contrastRatio(fg, bg) {
  const l1 = relLuminance(fg), l2 = relLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function isWcagAA(fg, bg) { return contrastRatio(fg, bg) >= 4.5; }

export function isWcagAALarge(fg, bg) { return contrastRatio(fg, bg) >= 3.0; }

/**
 * Контрольний гейт WCAG AA: pairs = [[fgToken, bgToken], ...] — обидва мають бути в наборі.
 * @returns {{pass: boolean, violations: {token: string, bg: string, ratio: number}[]}}
 */
export function guardAA(tokenSet, pairs) {
  const violations = [];
  for (const [fg, bg] of pairs) {
    if (!tokenSet[fg] || !tokenSet[bg]) throw new Error('Токен не в дозволеному списку: ' + (!tokenSet[fg] ? fg : bg));
    const ratio = contrastRatio(tokenSet[fg], tokenSet[bg]);
    if (!isWcagAA(tokenSet[fg], tokenSet[bg])) violations.push({ token: fg, bg, ratio: Math.round(ratio * 100) / 100 });
  }
  return { pass: violations.length === 0, violations };
}

/** Детермінований превʼю: canonical sha256, без DOM і без мережі. */
export function previewTokenSet(tokenSet) {
  for (const key of Object.keys(tokenSet)) {
    if (!ALLOWED_TOKENS.includes(key)) throw new Error('Токен не в дозволеному списку: ' + key);
  }
  return Object.freeze({ preview: true, tokenSet: { ...tokenSet }, sha256: sha256Canonical(tokenSet) });
}