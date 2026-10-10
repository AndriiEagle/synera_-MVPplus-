// Invariants of German and English on the sign-in and profile page:
//  1. Every Ukrainian string the page can show — markup and the modules it loads — has German and English
//     text, is part of a longer assembled text with a pattern, or is listed as «never page text» with a reason.
//     A new Ukrainian string fails here until one of the three is true.
//  2. A Ukrainian visit loads none of it: the page references only the small button module.
//  3. What a person wrote is marked by the page and skipped by the overlay; a choice in a list is sent by a
//     fixed value, never by its translated label; profile deletion can be confirmed in each language.
//  4. The card shows words, not the engine's internal codes; the rules page has an unofficial translation
//     for every Ukrainian sentence; the coverage lists hold nothing stale or doubled.
// What a person actually sees is proven in a browser by tools/index-language-browser.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sourceStrings, cooked, pageModules } from './source-strings.mjs';
import { TABLE, LANGUAGE_KEY, LANGUAGES, setLanguage } from './real-journey-i18n.mjs';
import { ROWS, PATTERNS } from './index-i18n-table.mjs';
import { translate, MAX_ASSEMBLED } from './index-i18n.mjs';
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

test('a long text is never run through the patterns, and near-matches stay cheap', () => {
  const examples = PATTERN_EXAMPLES.map(([, example]) => norm(example));
  assert.ok(Math.max(...examples.map(example => example.length)) * 2 < MAX_ASSEMBLED, 'the limit must leave room for real assembled labels');
  setLanguage('de');
  // A text that a pattern would match, made long by what a person typed: left exactly as written.
  const long = 'Твій результат: ' + 'дуже довгий опис бажаного результату '.repeat(40) + '. Заявлена допомога: Дизайн продукту.';
  assert.ok(long.length > MAX_ASSEMBLED); assert.equal(translate(long), null);
  assert.notEqual(translate('Твій результат: короткий опис. Заявлена допомога: Дизайн продукту.'), null);
  // Stretched near-matches of every example, up to the limit: no pattern may take pathological time.
  // The bound is loose on purpose (measured: under 15 ms); it exists to catch runaway backtracking, not jitter.
  let slowest = 0;
  for (const example of examples) {
    const middle = example.slice(Math.floor(example.length / 3), Math.floor(2 * example.length / 3));
    for (const text of [example.slice(0, Math.floor(2 * example.length / 3)) + middle.repeat(80) + ' ✗', (example + ' ').repeat(80) + '✗']) {
      const started = performance.now(); translate(text.slice(0, MAX_ASSEMBLED)); slowest = Math.max(slowest, performance.now() - started);
    }
  }
  setLanguage('uk');
  assert.ok(slowest < 500, `a near-match took ${slowest.toFixed(0)} ms`);
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

test('the rules page: every Ukrainian text has an unofficial translation, loaded only on demand', async () => {
  const html = read('./legal.html'), loader = read('./legal-language.mjs');
  const legal = await import('./legal-i18n.mjs');
  const decode = text => text.replace(/&nbsp;/g, '\u00a0').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  const texts = [...html.matchAll(/>([^<>]+)</g)].map(match => norm(decode(match[1]))).filter(text => CYRILLIC.test(text));
  assert.ok(texts.length >= 30, 'rules scan found too little: ' + texts.length);
  const keys = new Set(legal.ROWS.map(row => row[0]));
  // A change to the binding Ukrainian text fails here until both translations follow it.
  assert.deepEqual(texts.filter(text => !keys.has(text)), [], 'rules text without a translation');
  assert.deepEqual([...keys].filter(key => !texts.includes(key)), [], 'translation of text that is no longer in the rules');
  for (const [uk, de, en] of legal.ROWS) assert.ok(de && en && !CYRILLIC.test(de + en) && !de.includes('ß'), 'bad translation of: ' + uk.slice(0, 50));
  for (const code of ['de', 'en']) { assert.equal(legal.NOTICE[code].length, 2); assert.match(legal.NOTICE[code][0], code === 'de' ? /inoffizielle Übersetzung.*Verbindlich ist die ukrainische Fassung/ : /unofficial translation.*Ukrainian text.*binding/); }
  assert.match(html, /<html lang="uk">/); assert.match(html, /<script type="module" src="\/legal-language\.mjs"><\/script>/);
  assert.equal(/legal-i18n/.test(html), false); assert.equal(/^\s*import\s/m.test(loader), false, 'the rules page must not load the translation up front');
  assert.ok(loader.includes(`'${LANGUAGE_KEY}'`) && loader.includes("query.has('original')"));
  for (const name of ['legal-language.mjs', 'legal-i18n.mjs']) assert.equal(PUBLIC_ASSETS[name], 'text/javascript');
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

test('profile deletion: the form and the code accept the same words, one per language', () => {
  const html = read('./index.html'), app = read('./app.mjs');
  // A browser checks the field against the whole pattern; the handler checks again before anything is deleted.
  const form = new RegExp('^(?:' + html.match(/id="delete-confirmation"[^>]*pattern="([^"]+)"/)[1] + ')$', 'u');
  const confirmed = Function('return ' + app.match(/const deletionConfirmed = (typed => [^\n]+);\n/)[1])();
  assert.ok(app.includes(`if(!deletionConfirmed($('#delete-confirmation').value))return;await store.deleteProfile();`), 'deletion must stay behind the typed word');
  // German is accepted in any letter case and as LOESCHEN: a capital Ö is awkward on a Swiss keyboard.
  for (const word of ['ВИДАЛИТИ', 'DELETE', 'LÖSCHEN', 'löschen', 'Löschen', 'LOESCHEN', 'loeschen']) { assert.ok(form.test(word), 'the form refuses ' + word); assert.ok(confirmed(word), 'the code refuses ' + word); }
  for (const word of ['', ' ', 'x', 'видалити', 'delete', 'LOSCHEN', 'LÖSCHE', 'LÖSCHEN!', ' DELETE', 'DELETE ', 'ВИДАЛИТИ DELETE', 'löschen\n']) { assert.equal(form.test(word), false, 'the form accepts «' + word + '»'); assert.equal(confirmed(word), false, 'the code accepts «' + word + '»'); }
  const row = ROWS.find(item => item[0] === 'Для підтвердження введи ВИДАЛИТИ');
  assert.ok(row[1].includes('LÖSCHEN') && row[2].includes('DELETE'), 'each language must name a word that is accepted');
});

test('a choice in a list is sent by a fixed value, never by its translated label', () => {
  // The overlay changes what an option says. Without a value attribute the browser would send that text.
  const html = read('./index.html');
  const options = [...html.matchAll(/<option([^>]*)>([^<]*)</g)].filter(match => CYRILLIC.test(match[2]));
  assert.ok(options.length >= 15, 'option scan found too little: ' + options.length);
  assert.deepEqual(options.filter(match => !/\svalue="/.test(match[1])).map(match => match[2]), [], 'Ukrainian choices without a value');
  assert.match(html, /<option value="Онлайн">Онлайн<\/option>/, 'the meeting place «online» must be stored the same in every language');
  // Choices the page adds later always get a value from the code; the overlay pins any that do not.
  const app = read('./app.mjs'), added = [...app.matchAll(/const (\w+) ?= ?el\('option'[^;]*;([^;]*);/g)];
  assert.ok(added.length >= 4); for (const [whole, name, next] of added) assert.match(next, new RegExp(`\\b${name}\\.value ?=`), 'an added choice without a value: ' + whole.slice(0, 80));
  assert.ok(read('./index-i18n.mjs').includes(`if (option && !option.hasAttribute('value') && now === source) option.setAttribute('value', option.value);`));
});

test('what a person wrote is marked and is never translated, even when it equals a label', () => {
  const app = read('./app.mjs'), overlay = read('./index-i18n.mjs');
  assert.match(app, /function said\(tag, text, className\) \{ const node = el\(tag, text, className\); node\.setAttribute\('translate', 'no'\); return node; \}/);
  for (const own of [`said('h3', person.display_name)`, `said('p', person.city, 'city')`, `said('span',value)`, `said('p',meeting.note)`, `said('p',row.body)`]) assert.ok(app.includes(own), 'shown without the mark: ' + own);
  assert.match(overlay, /SKIP = 'script,style,textarea,\[translate="no"\]'/);
  assert.match(overlay, /if \(!node\.parentElement \|\| node\.parentElement\.closest\(SKIP\)\) return;/);
  assert.match(read('./index.html'), /<pre id="ai-payload"[^>]*translate="no"/, 'the text prepared for an AI provider is the person\'s data');
});

test('dates follow the chosen language and lists of labels are translated item by item', () => {
  setLanguage('de');
  assert.equal(translate('11 жовт. 2026 р., 23:26'), '11.10.2026, 23:26');
  assert.equal(translate('3 січ. 2027 р., 09:05'), '03.01.2027, 09:05');
  assert.equal(translate('Ти · 11 жовт. 2026 р., 23:26'), 'Du · 11.10.2026, 23:26');
  assert.equal(translate('Дизайн продукту, Автоматизація процесів'), 'Produktdesign, Prozessautomatisierung');
  assert.equal(translate('Дизайн продукту, Deutsch, Zürich'), 'Produktdesign, Deutsch, Zürich', 'Latin items stay as written');
  assert.equal(translate('Дизайн продукту, мій власний пункт'), null, 'a list with a person\'s own item is left alone');
  setLanguage('en');
  assert.equal(translate('11 жовт. 2026 р., 23:26'), '11 Oct 2026, 23:26');
  assert.equal(translate('Співрозмовник · 1 трав. 2026 р., 08:00'), 'Other person · 1 May 2026, 08:00');
  for (const month of ['січ.', 'лют.', 'бер.', 'квіт.', 'трав.', 'черв.', 'лип.', 'серп.', 'вер.', 'жовт.', 'лист.', 'груд.']) assert.match(translate(`5 ${month} 2026 р.`), /^5 [A-Z][a-z]{2} 2026$/, 'month not recognised: ' + month);
  // What the browser itself produces for every month must be recognised, whatever its abbreviations are.
  const format = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });
  for (let month = 0; month < 12; month++) { const written = format.format(new Date(2026, month, 7, 14, 3)); assert.equal(CYRILLIC.test(translate(written) ?? written), false, 'date left in Ukrainian: ' + written); }
  setLanguage('uk');
});

test('the coverage lists hold nothing stale, doubled or contradictory', () => {
  const html = read('./index.html');
  const decode = text => text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'');
  const present = new Set([...[...html.matchAll(/>([^<>]+)</g)].map(match => match[1]), ...[...html.matchAll(/\s(?:aria-label|placeholder|title|alt)="([^"]*)"/g)].map(match => match[1])].map(text => norm(decode(text))));
  for (const name of pageModules(html, file => read('./' + file)).filter(file => !LANGUAGE_FILES.includes(file))) for (const item of sourceStrings(read('./' + name))) present.add(norm(cooked(item)));
  // An entry for text that no longer exists would silently excuse the same words if they came back as page text.
  assert.deepEqual([...NOT_PAGE_TEXT.keys()].filter(key => !present.has(key)).map(key => key.slice(0, 70)), [], '«not page text» entries for text that is gone');
  assert.deepEqual([...INSIDE_PATTERNS].filter(key => !present.has(key)).map(key => key.slice(0, 70)), [], '«inside a pattern» entries for text that is gone');
  assert.deepEqual([...NOT_PAGE_TEXT.keys()].filter(key => rows.has(key) || core.has(key) || INSIDE_PATTERNS.has(key)).map(key => key.slice(0, 70)), [], 'text listed both as translated and as «not page text»');
  const sources = PATTERNS.map(pattern => pattern[0]);
  assert.deepEqual(sources.filter((source, index) => sources.indexOf(source) !== index), [], 'the same pattern twice: only the first would ever be used');
  assert.deepEqual(PATTERN_EXAMPLES.map(pair => pair[0]).filter(source => !sources.includes(source)), [], 'an example for a pattern that is gone');
  assert.deepEqual(sources.filter(source => !new Map(PATTERN_EXAMPLES).has(source)), [], 'a pattern without an example is never exercised');
});

test('the card says who a hint is for and what a confirmation means, not the internal codes', async () => {
  const app = read('./app.mjs');
  const forWhom = Function('return ' + app.match(/const forWhom = (\(text, ownId, otherId\) => [^\n]+);\n/)[1])();
  const labels = Function('return ' + app.match(/const ATTESTATION_LABELS = (\{[^\n]+\});\n/)[1])();
  // Checked against the real engine: «a» needs design and «b» offers it, so the design hint is for «a».
  const { evaluateAlgorithmicMatch } = await import('./matching.mjs');
  const profile = (id, overrides) => ({ id, city: 'zurich', offers: [], needs: [], languages: ['en'], modes: ['exchange'], availableFrom: '2026-09-07', availableUntil: '2026-09-30', updatedAt: '2026-09-07', consent: true, remote: true, maxKm: 25, ...overrides });
  const result = evaluateAlgorithmicMatch(profile('a', { offers: ['sales'], needs: [{ tag: 'design', priority: 2 }] }), profile('b', { offers: ['design'], needs: [{ tag: 'sales', priority: 1 }] }), { asOf: '2026-09-07' });
  const design = result.topics.find(topic => topic.text.includes('Дизайн продукту')), sales = result.topics.find(topic => topic.text.includes('B2B-продажі'));
  assert.ok(design && sales && /^A_from_B: /.test(design.text) && /^B_from_A: /.test(sales.text), 'the engine no longer writes the codes this page replaces');
  assert.equal(forWhom(design.text, 'a', 'b'), 'Для тебе: уточніть обсяг і доступність для «Дизайн продукту».');
  assert.equal(forWhom(design.text, 'b', 'a'), 'Для іншої сторони: уточніть обсяг і доступність для «Дизайн продукту».');
  assert.equal(forWhom(sales.text, 'a', 'b'), 'Для іншої сторони: уточніть обсяг і доступність для «B2B-продажі».');
  assert.equal(forWhom(sales.text, 'b', 'a'), 'Для тебе: уточніть обсяг і доступність для «B2B-продажі».');
  assert.equal(forWhom('Інший текст без коду', 'a', 'b'), 'Інший текст без коду');
  assert.ok(app.includes(`fit.append(el('p', forWhom(topic.text, own.id, person.id), 'fine'));`));
  // The stored confirmation code keeps its value; only the words on the card change. An unknown code is shown as it is.
  assert.deepEqual(Object.keys(labels), ['ACKNOWLEDGED_FOR_NEXT_STEP_NOT_A_CONTRACT']); assert.match(labels.ACKNOWLEDGED_FOR_NEXT_STEP_NOT_A_CONTRACT, /не договір/);
  assert.ok(app.includes(`(ATTESTATION_LABELS[state.approvalAttestation] || state.approvalAttestation)`));
  assert.match(read('./profile-store.mjs'), /const CASE_ATTESTATION = 'ACKNOWLEDGED_FOR_NEXT_STEP_NOT_A_CONTRACT';/);
  for (const [language, hint, status] of [['de', 'Für dich: Klärt Umfang und Verfügbarkeit für «Produktdesign».', 'Status: Entwurf · kein Vertrag, sondern die Bestätigung des nächsten Schritts'], ['en', 'For you: clarify the scope and availability for “Product design”.', 'Status: draft · not a contract, only a confirmation of the next step']]) {
    setLanguage(language);
    assert.equal(translate(forWhom(design.text, 'a', 'b')), hint);
    assert.equal(translate('Статус: чернетка · ' + labels.ACKNOWLEDGED_FOR_NEXT_STEP_NOT_A_CONTRACT), status);
  }
  setLanguage('uk');
});
