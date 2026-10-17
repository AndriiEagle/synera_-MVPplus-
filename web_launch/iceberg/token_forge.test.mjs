// C15.L1 — тести Token Forge. Запуск з КОРЕНЯ: node web_launch/iceberg/token_forge.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALLOWED_TOKENS, BASELINE, listAllowedTokens, resetTokenSet, forgeTokens,
  isWcagAA, isWcagAALarge, contrastRatio, guardAA, previewTokenSet, sha256Canonical } from './token_forge.mjs';

test('C15.L1: allowlist заморожений і складається з РЕАЛЬНИХ імен tokens.css', () => {
  assert.ok(Object.isFrozen(ALLOWED_TOKENS));
  const css = fs.readFileSync(new URL('../tokens.css', import.meta.url), 'utf8');
  for (const name of ['--color-green-primary', '--color-bg', '--color-warning-text', '--color-notice-text', '--color-muted']) {
    assert.ok(ALLOWED_TOKENS.includes(name), name);
    assert.ok(css.includes(name + ':'), name + ' має існувати в tokens.css');
  }
});

test('C15.L1: baseline дорівнює tokens.css значенням — жодної вигаданої фарби', () => {
  const css = fs.readFileSync(new URL('../tokens.css', import.meta.url), 'utf8');
  for (const [name, hex] of Object.entries(BASELINE)) {
    assert.ok(css.includes(name + ': ' + hex), name + ' = ' + hex);
  }
});

test('C15.L1: forgeTokens — fail-closed на недозволеному ключі і на кривому кольорі', () => {
  assert.throws(() => forgeTokens({ '--color-not-real': '#123456' }), /Токен не в дозволеному списку/);
  assert.throws(() => forgeTokens({ '--color-bg': 'red' }), /Некоректний колір/);
  assert.throws(() => forgeTokens({ '--color-bg': '#12345' }), /Некоректний колір/);
});

test('C15.L1: forgeTokens детермінований — той самий патч, той самий sha256', () => {
  const a = forgeTokens({ '--color-green-primary': '#19513e' });
  const b = forgeTokens({ '--color-green-primary': '#19513e' });
  assert.deepEqual(a, b);
  assert.equal(previewTokenSet(a).sha256, previewTokenSet(b).sha256);
  // вхід не мутує
  assert.equal(a['--color-green-primary'], '#19513e');
  assert.equal(resetTokenSet()['--color-green-primary'], '#254f3b');
});

test('C15.L1: WCAG — відома еталонна пара чорний/білий = 21.0, поріг AA = 4.5', () => {
  assert.equal(contrastRatio('#000000', '#FFFFFF').toFixed(2), '21.00');
  assert.equal(isWcagAA('#000000', '#FFFFFF'), true);
  assert.equal(isWcagAA('#FFFFFF', '#000000'), true, 'симетрія');
});

test('C15.L1: WCAG — #777777 на #FFFFFF ≈ 4.47 < 4.5 → fail ( hand-computed відомий випадок)', () => {
  const ratio = contrastRatio('#777777', '#FFFFFF');
  assert.ok(ratio > 4.4 && ratio < 4.5, 'ratio=' + ratio);
  assert.equal(isWcagAA('#777777', '#FFFFFF'), false);
  // large text поріг 3.0 — той самий колір проходить для великого тексту
  assert.equal(isWcagAALarge('#777777', '#FFFFFF'), true);
});

test('C15.L1: базові пари бренду проходять AA (межі пораховані вручну: 8.5 і 7.0)', () => {
  // #254f3b на #f6f5ef ≈ 8.51:1; #804024 на #fff0e5 ≈ 7.04:1 (обчислено в спекі карти)
  const brand = contrastRatio('#254f3b', '#f6f5ef');
  const warn = contrastRatio('#804024', '#fff0e5');
  assert.ok(brand > 8 && brand < 9, 'brand=' + brand.toFixed(2));
  assert.ok(warn > 6.5 && warn < 7.5, 'warn=' + warn.toFixed(2));
  assert.equal(isWcagAA(BASELINE['--color-notice-text'], BASELINE['--color-notice-bg']), true);
});

test('C15.L1: guardAA ловить навмано провальну пару і повертає violations з ratio', () => {
  const result = guardAA(BASELINE, [
    ['--color-green-primary', '--color-bg'],
    ['--color-muted-lighter', '--color-bg'], // #78836a на #f6f5ef — світло-зелений на світлому фоні
  ]);
  assert.equal(result.violations.length, 1);
  assert.equal(result.violations[0].token, '--color-muted-lighter');
  assert.ok(result.violations[0].ratio > 2 && result.violations[0].ratio < 4.5);
  assert.equal(result.pass, false);
  // і позитивний кейс
  const ok = guardAA(BASELINE, [['--color-green-primary', '--color-bg']]);
  assert.equal(ok.pass, true);
});

test('C15.L1: guardAA fail-closed на токені поза набором', () => {
  assert.throws(() => guardAA(BASELINE, [['--color-not-real', '--color-bg']]), /Токен не в дозволеному списку/);
});

test('C15.L1: previewTokenSet — preview:true, sha256 стабільний, ключі поза списком відкидаються', () => {
  const p1 = previewTokenSet(resetTokenSet());
  const p2 = previewTokenSet(resetTokenSet());
  assert.equal(p1.preview, true);
  assert.equal(p1.sha256, p2.sha256);
  assert.equal(p1.sha256, sha256Canonical(resetTokenSet()));
  assert.throws(() => previewTokenSet({ '--color-not-real': '#123456' }), /Токен не в дозволеному списку/);
});

test('C15.L1: resetTokenSet повертає заморожений baseline — два виклики ідентичні', () => {
  const a = resetTokenSet();
  const b = resetTokenSet();
  assert.deepEqual(a, b);
  assert.notEqual(a, b);
});

// Інваріант канону: машина токенів НІКОЛИ не торкається consent-гейтів.
test('C15.L1: інваріант — у модулі немає звернень до consentState', () => {
  const src = fs.readFileSync(new URL('./token_forge.mjs', import.meta.url), 'utf8');
  assert.ok(!src.includes('consentState'), 'consentState заборонений');
  assert.ok(!src.includes('consent'), 'слово consent не має зʼявлятись у машині токенів');
});