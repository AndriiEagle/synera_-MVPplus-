// Invariants of German and English on the sign-in and profile page:
//  1. Every Ukrainian string the page can show — markup and the modules it loads — has German and English
//     text, is part of a longer assembled text with a pattern, or is listed as «never page text» with a reason.
//     A new Ukrainian string fails here until one of the three is true.
//  2. A Ukrainian visit loads none of it: the page references only the small button module.
//  3. Text a person typed is never translated; profile deletion can be confirmed in each language.
// What a person actually sees is proven in a browser by tools/index-language-browser.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sourceStrings, cooked, pageModules } from './source-strings.mjs';
import { TABLE, LANGUAGE_KEY, LANGUAGES, setLanguage } from './real-journey-i18n.mjs';
import { ROWS, PATTERNS } from './index-i18n-table.mjs';
import { translate } from './index-i18n.mjs';
import { NOT_PAGE_TEXT, INSIDE_PATTERNS, PATTERN_EXAMPLES } from './index-i18n.coverage.mjs';
import { PUBLIC_ASSETS } from './assets.mjs';

const CYRILLIC = /[Ѐ-ӿ]/, norm = text => text.replace(/\s+/g, ' ').trim();
const read = name => fs.readFileSync(new URL(name, import.meta.url), 'utf8');
const LANGUAGE_FILES = ['index-language.mjs', 'index-i18n.mjs', 'index-i18n-table.mjs', 'real-journey-i18n.mjs'];
const core = new Set(TABLE.map(row => row[0])), rows = new Set(ROWS.map(row => row[0]));
const groupsIn = source => new RegExp(source + '|', 'u').exec('').length - 1;
const references = template => [...template.matchAll(/\$(\d{1,2})/g)].map(match => Number(match[1]));

test('rows are well-formed and do not shadow the shared table', () => {
  assert.ok(ROWS.length > 600);
  const seen = new Set();
  for (const [uk, de, en] of ROWS) {
    assert.equal(uk, norm(uk), 'key is not whitespace-normalised: ' + uk);
    assert.equal(seen.has(uk), false, 'duplicate key: ' + uk); seen.add(uk);
    assert.equal(core.has(uk), false, 'already in the shared table: ' + uk);
    assert.ok(de && en && de === norm(de) && en === norm(en), 'empty or padded text for: ' + uk);
    assert.equal(CYRILLIC.test(de) || CYRILLIC.test(en), false, 'Cyrillic left in a translation of: ' + uk);
    assert.equal(de.includes('ß'), false, 'Swiss spelling uses ss: ' + de);
  }
  for (const [uk] of TABLE) assert.equal(uk, norm(uk), 'shared key is not whitespace-normalised: ' + uk);
});

test('patterns compile, are anchored and only refer to groups they have', () => {
  assert.ok(PATTERNS.length > 150);
  for (const [source, de, en, groups, separator] of PATTERNS) {
    assert.ok(source.startsWith('^') && source.endsWith('$'), 'not anchored: ' + source);
    const count = groupsIn(source);
    for (const template of [de, en]) {
      assert.equal(CYRILLIC.test(template), false, 'Cyrillic in a template of: ' + source);
      // «$12» may mean group 12 or group 1 followed by «2»; either way the group must exist.
      for (const number of references(template)) assert.ok(number <= count || Number(String(number)[0]) <= count, `template refers to a missing group $${number}: ${source}`);
    }
    assert.ok(Array.isArray(groups) && groups.every(number => number >= 1 && number <= count), 'bad label groups: ' + source);
    assert.ok(separator === null || typeof separator === 'string');
  }
});

test('every pattern matches its own example and changes it', () => {
  const byRegex = new Map(PATTERN_EXAMPLES);
  assert.ok(byRegex.size > 150);
  setLanguage('de');
  for (const [source] of PATTERNS) {
    const example = byRegex.get(source); if (!example) continue;
    assert.ok(new RegExp(source, 'u').test(norm(example)), `pattern does not match its example: ${source} / ${example}`);
    const shown = translate(example);
    assert.ok(shown !== null && shown !== norm(example), 'example left untranslated: ' + example);
  }
  setLanguage('uk');
});

test('every Ukrainian string of the page markup and its modules is accounted for', () => {
  const html = read('./index.html');
  const decode = text => text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'');
  const markup = [...[...html.matchAll(/>([^<>]+)</g)].map(match => match[1]), ...[...html.matchAll(/\s(?:aria-label|placeholder|title|alt)="([^"]*)"/g)].map(match => match[1])]
    .map(text => norm(decode(text))).filter(text => CYRILLIC.test(text));
  assert.ok(markup.length > 200, 'markup scan found too little: ' + markup.length);
  const modules = pageModules(html, name => read('./' + name)).filter(name => !LANGUAGE_FILES.includes(name));
  assert.ok(modules.includes('app.mjs') && modules.includes('profile-store.mjs') && modules.length >= 20, 'module scan lost the page: ' + modules.length);
  const literals = [];
  for (const name of modules) for (const item of sourceStrings(read('./' + name))) { const value = norm(cooked(item)); if (CYRILLIC.test(value)) literals.push({ module: name, line: item.line, value }); }
  assert.ok(literals.length > 700, 'literal scan found too little: ' + literals.length);
  const accounted = text => core.has(text) || rows.has(text) || NOT_PAGE_TEXT.has(text) || INSIDE_PATTERNS.has(text);
  assert.deepEqual(markup.filter(text => !accounted(text)), [], 'Ukrainian markup text without German and English');
  assert.deepEqual(literals.filter(item => !accounted(item.value)).map(item => `${item.module}:${item.line} ${item.value.slice(0, 80)}`), [], 'Ukrainian module text without German and English');
  for (const [text, reason] of NOT_PAGE_TEXT) assert.ok(reason && reason.length > 3, 'no reason given for skipping: ' + text.slice(0, 60));
});

test('a Ukrainian visit loads only the button module; the rest ships but is fetched on demand', () => {
  const html = read('./index.html'), loader = read('./index-language.mjs');
  assert.match(html, /<script type="module" src="\/index-language\.mjs"><\/script>/);
  assert.equal(/index-i18n|real-journey-i18n/.test(html), false, 'the page must not reference the language text directly');
  assert.equal(/^\s*import\s/m.test(loader), false, 'the button module must not import anything up front');
  assert.ok(loader.includes(`'${LANGUAGE_KEY}'`), 'the choice must be shared with the two-person page');
  for (const code of Object.keys(LANGUAGES)) { assert.ok(loader.includes(`'${code}'`)); assert.match(html, new RegExp(`data-lang="${code}"`)); }
  assert.match(html, /<html lang="uk"[ >]/);
  for (const name of ['index-language.mjs', 'index-i18n.mjs', 'index-i18n-table.mjs']) assert.equal(PUBLIC_ASSETS[name], 'text/javascript', name + ' must ship');
  for (const name of ['source-strings.mjs', 'index-i18n.coverage.mjs']) assert.equal(name in PUBLIC_ASSETS, false, name + ' is test data and must not ship');
});

test('translate: whole labels, assembled text, lists; a person\'s own text is left alone', () => {
  setLanguage('uk'); assert.equal(translate('Мій профіль'), null, 'Ukrainian needs no translation');
  setLanguage('de');
  assert.equal(translate('  Мій   профіль '), 'Mein Profil');
  assert.equal(translate('Оновити'), 'Aktualisieren', 'shared rows are reused');
  for (const own of ['Привіт! Домовмося про перший крок.', 'Тест Марія', 'Zürich', '']) assert.equal(translate(own), null, 'changed text nobody translated: ' + own);
  setLanguage('en');
  assert.equal(translate('Для підтвердження введи ВИДАЛИТИ'), 'To confirm, type DELETE');
  const step = translate('КРОК 2 / 6'); assert.ok(step && !CYRILLIC.test(step) && step.includes('2') && step.includes('6'), 'assembled text: ' + step);
  setLanguage('uk');
});

test('profile deletion can be confirmed with the word shown in each language', () => {
  const html = read('./index.html'), app = read('./app.mjs');
  const pattern = html.match(/id="delete-confirmation"[^>]*pattern="([^"]+)"/)[1].split('|');
  assert.deepEqual(pattern, ['ВИДАЛИТИ', 'DELETE', 'LÖSCHEN']);
  assert.ok(app.includes(`['ВИДАЛИТИ','DELETE','LÖSCHEN'].includes($('#delete-confirmation').value)`), 'the page and the form must accept the same words');
  const row = ROWS.find(item => item[0] === 'Для підтвердження введи ВИДАЛИТИ');
  assert.ok(row[1].includes('LÖSCHEN') && row[2].includes('DELETE'));
});
