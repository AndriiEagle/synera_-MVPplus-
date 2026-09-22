// C15.L4 — тести Event Theme Injector. Запуск з КОРЕНЯ: node web_launch/iceberg/event_theme.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALLOWED_TOKEN_NAMES, BUNDLES, activeBundle, applyTheme, rollback, listConsentGates, consentInvariantCheck, validateBundleTokens } from './event_theme.mjs';

test('C15.L4: активний bundle за календарем — вручну пораховані дати', () => {
  assert.equal(activeBundle('2026-12-25').id, 'new-year');
  assert.equal(activeBundle('2026-01-03').id, 'new-year');      // wrap-around: січень належить новорічному вікну
  assert.equal(activeBundle('2025-12-31').id, 'new-year');      // wrap-around: грудень попереднього року
  assert.equal(activeBundle('2026-03-10').id, 'startup-nights');
  assert.equal(activeBundle('2026-03-14').id, 'startup-nights'); // межа включно
  assert.equal(activeBundle('2026-07-01').id, 'summer-forum');
  assert.equal(activeBundle('2026-09-22'), null);               // поза всіма вікнами
});

test('C15.L4: межа вікна — наступний день після закінчення вже null', () => {
  assert.equal(activeBundle('2026-03-15'), null);
  assert.equal(activeBundle('2026-08-20').id, 'summer-forum');
  assert.equal(activeBundle('2026-08-21'), null);
});

test('C15.L4: некоректна дата — fail-closed українською', () => {
  assert.throws(() => activeBundle('not-a-date'), /Некоректна дата/);
  assert.throws(() => activeBundle(42), /Некоректна дата/);
});

test('C15.L4: bundles заморожені, токени — реальні імена з tokens.css', () => {
  assert.equal(BUNDLES.length >= 3, true);
  for (const bundle of BUNDLES) assert.ok(Object.isFrozen(bundle));
  const css = fs.readFileSync(new URL('../tokens.css', import.meta.url), 'utf8');
  for (const bundle of BUNDLES) {
    for (const key of Object.keys(bundle.tokens)) {
      assert.ok(ALLOWED_TOKEN_NAMES.includes(key), key);
      assert.ok(css.includes(key + ':'), key + ' має існувати в tokens.css');
    }
    assert.ok(['osm', 'satellite', 'schematic'].includes(bundle.markerStyle), bundle.id);
  }
});

test('C15.L4: applyTheme валідує токени fail-closed і детермінований', () => {
  const [ny] = BUNDLES;
  const a = applyTheme(ny);
  const b = applyTheme(ny);
  assert.equal(a.sha256, b.sha256);
  assert.equal(a.bundleId, 'new-year');
  assert.equal(a.appliedAt, null);
  const evil = { ...ny, id: 'evil', tokens: { '--color-not-real': '#123456' } };
  assert.throws(() => applyTheme(evil), /Тема не в pre-audited списку/, 'чужий bundle відкидається identity-гейтом');
  // валідація токенів — окрема чиста функція, ловить мутацію навіть pre-audited bundle
  assert.throws(() => validateBundleTokens({ '--color-not-real': '#123456' }), /Тема містить недозволений токен/);
  assert.throws(() => validateBundleTokens({ '--color-bg': 'green' }), /Тема містить некоректний колір/);
  assert.throws(() => applyTheme({ id: 'ghost' }), /Тема не в pre-audited списку/);
});

test('C15.L4: rollback < 1s — чиста константа скиду, O(1)', () => {
  const r = rollback();
  assert.deepEqual({ ...r }, { bundleId: null, tokens: null, markerStyle: null, banner: null, sha256: null });
  assert.equal(rollback(), rollback(), 'одна й та сама заморожена константа');
});

test('C15.L4: consentInvariantCheck блокує будь-яку операцію на 7 гейтах', () => {
  const r = consentInvariantCheck({ visibility: true, banner: {} });
  assert.equal(r.pass, false);
  assert.equal(r.violations.length, 1);
  assert.ok(r.violations[0].includes('visibility'));
  const r2 = consentInvariantCheck({ 'consent.recording': true });
  assert.equal(r2.pass, false);
  const ok = consentInvariantCheck({ banner: {}, markerStyle: 'osm' });
  assert.equal(ok.pass, true);
});

test('C15.L4: listConsentGates — повний набір 7 гейтів канону', () => {
  assert.deepEqual(listConsentGates(), ['visibility', 'comparison', 'introduction', 'external_ai', 'recording', 'summary', 'communication']);
});

test('C15.L4: усі shipped bundles проходять applyTheme (pre-audited гарантія)', () => {
  for (const bundle of BUNDLES) {
    const applied = applyTheme(bundle);
    assert.ok(applied.sha256.length === 64, bundle.id);
    assert.equal(applied.appliedAt, null);
  }
});

// Інваріант канону: машина тем не пише в consentState.
test('C15.L4: інваріант — немає мутацій consentState у модулі', () => {
  const src = fs.readFileSync(new URL('./event_theme.mjs', import.meta.url), 'utf8');
  assert.ok(!src.includes('consentState['), 'мутації consentState заборонені');
  assert.ok(!src.includes('consentState.'), 'властивості consentState заборонені');
});