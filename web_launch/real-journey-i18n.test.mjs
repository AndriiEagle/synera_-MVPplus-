// Invariants of the display language on the two-person path:
//  1. Ukrainian is the source and the default; German and English cover every string the page can show.
//  2. A new Ukrainian string added to the page, its client or the shared lists fails here until it is translated.
//  3. Language is presentation only: the same form produces the same terms and the same hash in every language.
// Whether a person actually sees no untranslated text is proven in a browser by tools/journey-language-browser.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { LANGUAGES, LANGUAGE_KEY, TABLE, tr, t, known, hasSource, getLanguage, setLanguage, initLanguage, dateLocale } from './real-journey-i18n.mjs';
import { CAPABILITIES } from './matching.mjs';
import { PUBLIC_ASSETS } from './assets.mjs';
import { materialFromEditor } from './real-journey-client.mjs';
import { hashMaterialPayload } from './business-case.mjs';
import { A, B, fields } from '../tools/fixtures/real-journey-fixture.mjs';
import { sourceStrings } from './source-strings.mjs';

const CYRILLIC = /[Ѐ-ӿ]/;
const read = name => fs.readFile(new URL(name, import.meta.url), 'utf8');
const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort().join(',');

const literals = source => sourceStrings(source).map(item => ({ quote: item.quote, value: item.raw }));

test('the table is complete and well-formed in German and English', () => {
  assert.deepEqual(Object.keys(LANGUAGES), ['uk', 'de', 'en']);
  const seen = new Set();
  for (const row of TABLE) {
    assert.equal(row.length, 3, row[0]);
    for (const cell of row) assert.ok(typeof cell === 'string' && cell.trim() === cell && cell.length > 0, 'empty or padded cell: ' + row[0]);
    assert.equal(seen.has(row[0]), false, 'duplicate source: ' + row[0]); seen.add(row[0]);
    assert.equal(CYRILLIC.test(row[1]), false, 'German cell still has Cyrillic: ' + row[1]);
    assert.equal(CYRILLIC.test(row[2]), false, 'English cell still has Cyrillic: ' + row[2]);
    assert.equal(placeholders(row[1]), placeholders(row[0]), 'German placeholders differ: ' + row[0]);
    assert.equal(placeholders(row[2]), placeholders(row[0]), 'English placeholders differ: ' + row[0]);
  }
  assert.ok(TABLE.length > 300);
});

test('every Ukrainian string of the page module is a translated source', async () => {
  const found = literals(await read('./real-journey.mjs'));
  const ukrainian = found.filter(item => CYRILLIC.test(item.value));
  assert.ok(ukrainian.length > 180, 'the scanner lost track of the source: ' + ukrainian.length);
  // «онлайн» is compared with stored data, never shown.
  const missing = ukrainian.filter(item => item.quote !== '\'' || (!hasSource(item.value) && item.value !== 'онлайн'));
  assert.deepEqual(missing, [], 'untranslated or non-single-quoted Ukrainian text in real-journey.mjs');
});

test('every Ukrainian string of the page markup is a translated source', async () => {
  const html = await read('./real-journey.html');
  const texts = [...html.matchAll(/>([^<>]+)</g)].map(match => match[1].trim());
  const attributes = [...html.matchAll(/\s(?:aria-label|placeholder|title)="([^"]*)"/g)].map(match => match[1]);
  const ukrainian = [...texts, ...attributes].filter(text => CYRILLIC.test(text));
  assert.ok(ukrainian.length > 100);
  // A language is named in that language, and the selector is labelled in all three at once.
  const own = new Set(['Українська', 'Мова · Sprache · Language']);
  assert.deepEqual(ukrainian.filter(text => !hasSource(text) && !own.has(text)), []);
  assert.match(html, /<html lang="uk" data-synera-style="atelier">/, 'Ukrainian must stay the default document language');
  assert.match(html, /<select id="site-language"[^>]*><option value="uk"[^>]*>Українська<\/option><option value="de"[^>]*>Deutsch<\/option><option value="en"[^>]*>English<\/option><\/select>/);
  assert.equal(PUBLIC_ASSETS['real-journey-i18n.mjs'], 'text/javascript', 'the module must ship with the page');
});

test('messages raised by the client, the skill list and the view switcher are translated sources', async () => {
  const client = literals(await read('./real-journey-client.mjs')).filter(item => CYRILLIC.test(item.value));
  assert.ok(client.length >= 15);
  assert.deepEqual(client.map(item => item.value.replace(/^(\\n)+/, '')).filter(text => !hasSource(text) && text !== 'онлайн'), []);
  for (const label of Object.values(CAPABILITIES)) assert.ok(hasSource(label), 'skill without translation: ' + label);
  const switcher = literals(await read('./atelier.mjs')).filter(item => CYRILLIC.test(item.value));
  // The switcher builds its status from two halves; the four whole sentences are the sources.
  const halves = [['Atelier увімкнено', 'Чинний вигляд повернуто'], ['Вигляд збережено.', 'Лише в цій вкладці.']];
  for (const first of halves[0]) for (const second of halves[1]) assert.ok(hasSource(`${first}. ${second}`), `${first}. ${second}`);
  assert.deepEqual(switcher.map(item => item.value.replace(/^\. /, '').trim()).filter(text => text && !hasSource(text) && !halves.flat().includes(text) && !halves.flat().includes(text + '.')), []);
});

test('Ukrainian is the default; a choice is explicit, remembered and never guessed from the browser', () => {
  const storage = (initial = {}) => { const data = { ...initial }; return { data, getItem: key => data[key] ?? null, setItem: (key, value) => { data[key] = value; } }; };
  assert.equal(initLanguage(), 'uk'); assert.equal(getLanguage(), 'uk'); assert.equal(dateLocale(), 'uk');
  assert.equal(tr('Оновити'), 'Оновити');
  const store = storage();
  assert.equal(initLanguage({ search: '?lang=de', storage: store }), 'de');
  assert.equal(store.data[LANGUAGE_KEY], 'de', 'an explicit link choice is remembered');
  assert.equal(tr('Оновити'), 'Aktualisieren'); assert.equal(dateLocale(), 'de-CH');
  assert.equal(initLanguage({ search: '', storage: store }), 'de', 'the earlier choice is restored');
  assert.equal(initLanguage({ search: '?lang=xx', storage: storage({ [LANGUAGE_KEY]: 'en' }) }), 'en', 'an unknown ?lang= is ignored');
  assert.equal(initLanguage({ search: '', storage: storage({ [LANGUAGE_KEY]: 'fr' }) }), 'uk', 'an unsupported saved value falls back to Ukrainian');
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.equal(initLanguage({ search: '', storage: broken }), 'uk');
  assert.equal(setLanguage('en', broken), 'en', 'the choice still works for this page without storage');
  assert.equal(setLanguage('zz'), 'uk');
});

test('placeholders are filled once; unknown text is left alone', () => {
  setLanguage('en');
  assert.equal(tr('Редакція {version} · {status}', { version: 3, status: () => tr('Погоджено обома') }), 'Revision 3 · Confirmed by both');
  // Text typed by a person is inserted as is, even when it looks like a placeholder or a source string.
  assert.equal(tr('Результат: {text}', { text: '{text} {status} Оновити' }), 'Result: {text} {status} Оновити');
  assert.equal(tr('Критерій: {text}', {}), 'Criterion: {text}');
  assert.equal(tr('Щось, чого немає у таблиці'), 'Щось, чого немає у таблиці');
  assert.equal(known('Щось, чого немає у таблиці'), false); assert.equal(known('Оновити'), true);
  const later = t('Запрошення: {status}.', { status: () => tr('Прийнято') });
  assert.equal(later(), 'Invitation: Accepted.'); setLanguage('de'); assert.equal(later(), 'Einladung: Angenommen.');
  setLanguage('uk'); assert.equal(later(), 'Запрошення: Прийнято.'); assert.equal(known('Щось, чого немає у таблиці'), true);
});

test('the same form gives the same terms and the same hash in every language', async () => {
  const hashes = new Set(), payloads = new Set();
  for (const code of Object.keys(LANGUAGES)) {
    setLanguage(code);
    const material = materialFromEditor(A, B, { ...fields(), mode: 'exchange', components: ['exchange'] });
    payloads.add(JSON.stringify(material)); hashes.add(await hashMaterialPayload(material));
  }
  setLanguage('uk');
  assert.equal(payloads.size, 1); assert.equal(hashes.size, 1);
});
