import test from 'node:test';
import assert from 'node:assert/strict';
import { PHRASES, translatePhrase } from './i18n-phrases.mjs';

test('exact interface phrases translate to German and English; unknown user text is left alone', () => {
  assert.equal(translatePhrase('Зберегти профіль', 'de'), 'Profil speichern');
  assert.equal(translatePhrase('  Зберегти   профіль ', 'en'), 'Save profile');
  assert.equal(translatePhrase('Проведу три інтерв’ю з клієнтами', 'de'), null);
  assert.equal(translatePhrase('Зберегти профіль', 'uk'), null);
});

test('interpolated texts keep their numbers and names', () => {
  assert.equal(translatePhrase('3 з 7 завантажених профілів · є наступна сторінка', 'en'), '3 of 7 loaded profiles · there is another page');
  assert.equal(translatePhrase('ДО ПУБЛІКАЦІЇ: ЩЕ 4 ПУНКТІВ', 'de'), 'VOR DER VERÖFFENTLICHUNG: NOCH 4 PUNKTE');
  assert.equal(translatePhrase('Тобі: Дизайн продукту, B2B-продажі', 'en'), 'For you: Product design, B2B sales');
  assert.equal(translatePhrase('Олена: уточніть період доступності.', 'de'), 'Олена: Verfügbarkeitszeitraum klären.');
  assert.equal(translatePhrase('Deutsch, Українська · Онлайн · до 2026-12-31', 'en'), 'German, Ukrainian · Online · until 2026-12-31');
  assert.equal(translatePhrase('25 км', 'de'), '25 km');
});

test('the two-direction coverage line has no single compatibility number in any language', () => {
  const uk = 'Твоїх заявлених потреб ця людина закриває: 1 з 2. Її заявлених потреб закриваєш ти: 1 з 1. Рахуються лише заявлені навички й потреби, це не оцінка людини, довіри чи доходу.';
  for (const locale of ['de', 'en']) {
    const out = translatePhrase(uk, locale);
    assert.ok(out && !/%|\/100/.test(out), locale);
    assert.match(out, /1 (von|of) 2/);
  }
});

test('both languages cover the same set of phrases', () => {
  assert.deepEqual([...PHRASES.de.keys()].sort(), [...PHRASES.en.keys()].sort());
  for (const locale of ['de', 'en']) for (const [key, value] of PHRASES[locale]) assert.ok(value && value.trim(), `${locale}: ${key}`);
});
