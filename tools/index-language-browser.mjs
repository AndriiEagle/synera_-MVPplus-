// Real clicks in a desktop browser against a built candidate: the sign-in and profile page in German and in
// English, with Ukrainian as the control. In the main walk fixture content is Latin, so Cyrillic left on the
// page in German or English is product text that was not translated.
// Invariants: (1) no Ukrainian text is left on the screens walked here; (2) the choice is shared with the
// two-person page and survives a reload; the browser locale is not consulted; (3) a Ukrainian visit never
// loads the language text; (4) switching language and back restores the Ukrainian page exactly — also after
// the page redrew its lists in the other language — keeps what the person typed and sends no write;
// (5) profile deletion can be confirmed in each language; (6) what a person wrote in Ukrainian — a name, a
// city, an offer, a note, a message — is shown exactly as written, even when it equals one of the page's own
// labels; (7) a choice in a list is sent by the same value in every language; (8) no internal name such as
// «A_from_B» is shown to a person, in any language.
// Not physical phones, live accounts, JWT or RLS proof. Screens not walked are listed in RESULT.json.
// Usage: node tools/index-language-browser.mjs --candidate=web_launch/dist-neon-<name> --out=<dir> [--engine=chromium|webkit]
import { chromium, webkit } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { A, B, C, O, config, fields, createFixture } from './fixtures/real-journey-fixture.mjs';
import { RealJourneyStore, exchangeMaterial } from '../web_launch/real-journey-client.mjs';
import { POLICY_VERSION } from '../web_launch/pilot-policy.mjs';

const option = name => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const root = path.resolve(option('candidate') || '');
assert.match(path.basename(root), /^dist-neon-[a-z0-9-]+$/, 'Pass --candidate=web_launch/dist-neon-<name>');
assert.ok(option('out'), 'Pass --out=<new directory for RESULT.json and screenshots>');
const out = path.resolve(option('out')); await fs.mkdir(out, { recursive: true });
const engine = option('engine') || 'chromium';
assert.ok(['chromium', 'webkit'].includes(engine));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const releaseHash = sha(await fs.readFile(path.join(root, 'release.json')));
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); if (pathname === '/') pathname = '/index.html';
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' }).end(await fs.readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const names = { [A]: 'Andrii Test', [B]: 'Maria Test', [C]: 'Oleh Test', [O]: 'Outside Test' };
const LANGUAGE_FILES = ['/index-i18n.mjs', '/index-i18n-table.mjs', '/real-journey-i18n.mjs', '/legal-i18n.mjs'];
const result = { scope: 'Desktop browser, synthetic Auth/Data fixture through the real gateway code. No physical phone, live account, JWT or RLS proof.',
  candidate: path.basename(root), releaseHash, engine: null, runs: [], problems: [], failures: [], provider_calls: 0, usd: 0,
  notWalked: ['Google sign-in and e-mail code delivery', 'AI profile draft and ChatGPT/Claude import (answers come from a provider or are switched off)', 'live location sharing', 'map tiles', 'the invitation dialog of the main page (its button cannot open there: tools/people-gate-browser.mjs)', 'text placed into editable fields, files or the clipboard (share card, invitation draft, prompt for an AI) — by design it is not translated'] };

async function world() {
  const db = createFixture();
  for (const profile of db.profiles) { if (names[profile.id]) profile.display_name = names[profile.id]; profile.brief.goal = 'Check one concrete result for the business'; profile.offers = 'Process automation for small teams'; profile.seeks = 'A reviewed product screen'; }
  // One accepted meeting with a message and one more pending invitation, so every list has something in it.
  const a = new RealJourneyStore(config, db.fetchFor(A)), b = new RealJourneyStore(config, db.fetchFor(B));
  await Promise.all([a.dashboard(), b.dashboard()]);
  const terms = await a.saveTerms(B, exchangeMaterial(A, B, fields({ give_target: 'One working prototype', take_target: 'One reviewed screen', give_criteria: 'Opens and runs the agreed scenario', take_criteria: 'Both reviewed the screen on a phone' })));
  await a.approveTerms(B, terms); await b.approveTerms(A, await b.pairState(A));
  const meeting = (await a.sendInvitation(B, 'Discuss the reviewed screen', { proposed_at: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 30, meeting_place: 'Zürich' })).meetings[0];
  await b.respondInvitation(meeting.id, 'accepted'); await a.sendConversation(meeting.id, 'Hello! Let us agree on the first step.');
  // A message that happens to equal a button label: it is the person's text and must be shown as typed.
  await b.sendConversation(meeting.id, 'Оновити');
  return db;
}

async function journey(browser, { language, width, height }) {
  const latin = language !== 'uk', label = `${language}-${width}`, db = await world(); let actor = A, signedIn = true;
  const run = { run: label, steps: [], languageFilesLoaded: [] }; result.runs.push(run);
  const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'uk-UA' });
  context.setDefaultTimeout(12000);
  await context.route('**/*', route => { const url = new URL(route.request().url()); if (url.origin !== base) return route.abort(); if (LANGUAGE_FILES.includes(url.pathname)) run.languageFilesLoaded.push(url.pathname); return route.continue(); });
  await context.route('**/config.json', route => route.fulfill({ json: config }));
  await context.route('**/api/neon/**', async route => {
    const request = route.request(), url = new URL(request.url());
    // The gateway's health probe needs a provider; here it only has to say «reachable».
    if (url.pathname === '/api/neon/health') { await route.fulfill({ json: { authGateway: 'reachable', backend: 'neon', policyVersion: POLICY_VERSION } }); return; }
    if (!signedIn) { await route.fulfill({ status: 401, json: {} }); return; }
    // The shared fixture was built for the two-person page and has no list of blocked people; one row is served
    // here so the Privacy tab shows its real state instead of a «could not load» notice.
    if (request.method() === 'GET' && url.pathname.endsWith('/profile_blocks')) { await route.fulfill({ json: [{ blocked_id: O, created_at: '2026-10-07T09:05:00.000Z' }] }); return; }
    const response = await db.fetchFor(actor)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
    // What the fixture cannot answer is written down, so a notice on screen can be traced to its cause.
    if (response.status >= 400) (run.refusedByFixture ||= []).push(`${request.method()} ${url.pathname.replace('/api/neon', '')}${url.search.slice(0, 60)} → ${response.status}`);
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message.slice(0, 160)));
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const open = async (query = '') => { await page.goto(base + '/' + query); await page.waitForFunction(() => document.querySelector('#mode') && !/Перевірка доступу|Zugangsprüfung|Checking access/.test(document.querySelector('#mode').textContent)).catch(() => {}); await page.waitForTimeout(400); await settle(); };
  const shot = async (name, selector) => { if (selector) await page.locator(selector).first().evaluate(node => node.scrollIntoView({ block: 'start' })); await page.screenshot({ path: path.join(out, `${label}-${name}.png`) }); };
  const scan = async step => {
    await settle();
    const seen = await page.evaluate(() => {
      const cyrillic = /[Ѐ-ӿ]/, visible = [], hidden = [], codes = [];
      // An internal name such as «A_from_B» or «review_candidate» is not something a person can read.
      const internal = /\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+\b/;
      const push = (element, text) => (element.checkVisibility({ checkVisibilityCSS: true }) ? visible : hidden).push(text.trim().slice(0, 100));
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) { const parent = node.parentElement; if (parent.closest('script,style,textarea,[translate="no"]')) continue;
        if (internal.test(node.nodeValue) && parent.checkVisibility({ checkVisibilityCSS: true })) codes.push(node.nodeValue.trim().slice(0, 90));
        if (cyrillic.test(node.nodeValue)) push(parent, node.nodeValue); }
      for (const element of document.body.querySelectorAll('[aria-label],[placeholder],[title],[alt]')) for (const name of ['aria-label', 'placeholder', 'title', 'alt']) { const value = element.getAttribute(name); if (value && cyrillic.test(value)) push(element, `${name}=${value}`); }
      if (cyrillic.test(document.title)) visible.push('title=' + document.title);
      for (const box of document.querySelectorAll('#people textarea[readonly], #demo-journey-stage textarea[readonly]')) for (const line of box.value.split('\n')) if (cyrillic.test(line)) push(box, 'generated=' + line);
      const sideways = document.documentElement.scrollWidth - innerWidth;
      // Name what sticks out, so a too-long word can be found without guessing.
      const wide = sideways > 1 ? [...document.body.querySelectorAll('*')].filter(node => node.checkVisibility() && node.getBoundingClientRect().right > innerWidth + 1 && ![...node.children].some(child => child.getBoundingClientRect().right > innerWidth + 1))
        .slice(0, 4).map(node => `${node.tagName.toLowerCase()}${node.id ? '#' + node.id : ''}.${node.className}: ${node.textContent.trim().slice(0, 50)}`) : [];
      return { visible, hidden, codes, lang: document.documentElement.lang, sideways, wide, notice: document.querySelector('#notice')?.textContent.trim().slice(0, 110) || '' };
    });
    run.steps.push({ step, ukrainianVisible: latin ? seen.visible.length : null, ukrainianHidden: latin ? seen.hidden.length : null, sideways: seen.sideways, ...(seen.notice && seen.notice !== run.lastNotice ? { notice: seen.notice } : {}) }); run.lastNotice = seen.notice;
    if (seen.lang !== language) result.problems.push({ run: label, step, problem: `document language is ${seen.lang}` });
    if (latin && seen.visible.length) result.problems.push({ run: label, step, problem: 'Ukrainian text left on screen', sample: [...new Set(seen.visible)].slice(0, 12) });
    if (latin && seen.hidden.length) (run.hiddenLeft ||= {})[step] = [...new Set(seen.hidden)].slice(0, 40);
    if (seen.sideways > 1) result.problems.push({ run: label, step, problem: `page scrolls sideways by ${seen.sideways}px`, wide: seen.wide });
    if (seen.codes.length) result.problems.push({ run: label, step, problem: 'an internal name is shown to the person', sample: [...new Set(seen.codes)].slice(0, 6) });
    return seen;
  };
  const tab = async name => { await page.locator(`nav [data-tab="${name}"]`).click(); await settle(); };
  const dialog = async (opener, id, name) => { await page.locator(opener).click(); await page.locator(`#${id}[open]`).waitFor(); await scan(name); await page.keyboard.press('Escape'); await page.locator(`#${id}`).evaluate(node => node.open && node.close()); };
  try {
    // Signed out: the first screen a new person meets.
    signedIn = false; await open(latin ? '?lang=' + language : ''); await scan('sign-in screen'); await shot('1-sign-in', '#welcome');
    if (latin) assert.equal(await page.locator(`#lang-switcher [data-lang="${language}"]`).getAttribute('aria-pressed'), 'true');
    if (await page.locator('#signup').isVisible()) { await page.locator('#signup').click(); await scan('sign-up form'); }
    // A refused sign-in attempt: the explanation is read by someone who cannot sign in yet.
    if (await page.locator('#email').isEnabled()) { await page.locator('#email').fill('person@example.com'); await page.locator('#auth-submit').click(); await page.waitForTimeout(600); await scan('sign-in refused'); run.refusedNotice = (await page.locator('#notice').textContent()).slice(0, 90); }
    else run.steps.push({ step: 'sign-in refused', skipped: 'the sign-in form is switched off in this state' });
    await page.locator('.header-preferences > summary').click(); await scan('language and appearance panel'); await page.locator('.header-preferences > summary').click();
    // Signed in, no parameter: the choice was remembered.
    signedIn = true; await open();
    // A first visit is offered a short tour; it lies over the page until it is finished.
    const guide = page.locator('.tour-panel'); await page.waitForTimeout(800);
    for (let stepNumber = 1; stepNumber <= 8 && await guide.isVisible(); stepNumber++) { await scan('tour step ' + stepNumber); if (stepNumber === 1) await shot('2-tour'); await guide.locator('.actions button').nth(1).click(); await settle(); }
    assert.equal(await guide.isVisible(), false, 'the tour did not finish');
    // The demonstration is the first thing a new person can try; its last step shows a generated sample draft.
    // The tour lies over it on a first visit and leaves it on screen, so it is walked once the tour is done.
    const demo = page.locator('#demo-journey-stage');
    assert.ok(await demo.isVisible(), 'the demonstration is not on screen after the tour');
    for (let stepNumber = 2; stepNumber <= 4; stepNumber++) { await demo.locator('button').click(); await scan('demonstration step ' + stepNumber); }
    const sample = await demo.locator('textarea[readonly]').inputValue(); run.demoDraft = sample.slice(0, 70);
    assert.ok(sample.length > 40 && /[Ѐ-ӿ]/.test(sample) === !latin, 'the demonstration draft is not in the chosen language: ' + sample.slice(0, 60));
    await shot('1b-demo', '#demo-journey'); await demo.locator('button').click();
    await scan('workspace after sign-in');
    for (const name of ['people', 'profile', 'meetings', 'settings']) { await tab(name); await scan('tab: ' + name); if (name === 'profile') await shot('3-profile', '#profile-view'); }
    await tab('profile'); await page.locator('#profile-form .brief-details').evaluate(node => { node.open = true; }); await scan('profile: collaboration details'); await shot('4-profile-details', '#profile-form .brief-details');
    await dialog('#share-profile', 'share-dialog', 'dialog: share card');
    await dialog('#import-profile', 'import-dialog', 'dialog: import profile');
    // Parsing a pasted text happens in the browser; its messages and preview are page text too.
    await page.locator('#import-profile').click(); await page.locator('#import-dialog[open]').waitFor();
    await page.locator('#profile-import-text').fill('I automate reporting for small teams. I am looking for a product designer for one screen.');
    await page.locator('#profile-authorized').check(); await page.locator('#parse-profile').click(); await settle(); await scan('dialog: import profile, text parsed');
    await page.locator('#import-cancel').click(); await page.locator('#import-dialog').evaluate(node => node.open && node.close());
    await dialog('#prepare-ai', 'ai-dialog', 'dialog: AI draft');
    await tab('settings'); await shot('6-privacy', '#settings-view');
    run.blockedLine = (await page.locator('#blocked-people').innerText()).replace(/\s+/g, ' ').trim();
    assert.match(run.blockedLine, { uk: /^Учасник 1 · 7 жовт\. 2026 р\., \d{2}:05 Розблокувати$/, de: /^Person 1 · 07\.10\.2026, \d{2}:05 Blockierung aufheben$/, en: /^Participant 1 · 7 Oct 2026, \d{2}:05 Unblock$/ }[language], 'the blocked-people line: ' + run.blockedLine);
    // (5) Deleting a profile is a right; it must be possible to confirm it in the language on screen.
    await page.locator('#delete-profile').click(); await page.locator('#delete-dialog[open]').waitFor(); await scan('dialog: delete profile');
    const word = { uk: 'ВИДАЛИТИ', de: 'LÖSCHEN', en: 'DELETE' }[language];
    assert.ok((await page.locator('#delete-form').innerText()).includes(word), 'the delete dialog does not name the word to type');
    for (const [value, valid] of [['x', false], [word, true], ['ВИДАЛИТИ', true]]) { await page.locator('#delete-confirmation').fill(value); assert.equal(await page.locator('#delete-form').evaluate(form => form.checkValidity()), valid, `delete confirmation «${value}»`); }
    await page.locator('#delete-confirmation').fill(''); await page.locator('#delete-cancel').click();
    assert.equal(db.profiles.length, 4, 'a profile was deleted by the walk');
    // Meetings: the accepted one opens a conversation; the safety dialog sits behind it.
    await tab('meetings'); await scan('meetings with one accepted');
    run.controls = { meetings: await page.locator('#meetings-view button').evaluateAll(list => list.map(b => (b.disabled ? '(off) ' : '') + b.textContent.trim().slice(0, 40))) };
    const meetingButtons = page.locator('#meetings-view article button, #meetings-view .card button, #meeting-list button');
    await meetingButtons.nth(1).click(); await page.locator('#chat-dialog[open]').waitFor(); await scan('dialog: conversation'); await shot('5-chat');
    assert.deepEqual(await page.locator('#chat-messages .chat-message > p').allTextContents().then(list => list.sort()), ['Hello! Let us agree on the first step.', 'Оновити'], 'a typed message was changed');
    await page.locator('#chat-cancel').click();
    await meetingButtons.nth(3).click(); await page.locator('#safety-dialog[open]').waitFor(); await scan('dialog: boundaries and complaint'); await page.locator('#safety-cancel').click();
    // People: with the two permissions switched on (they live in memory only), the business case and the invitation open.
    await tab('settings'); await page.locator('#consent-comparison').check(); await page.locator('#consent-introduction').check(); await scan('permissions switched on');
    await tab('people'); await page.locator('#toggle-map').click(); await scan('people list with map');
    await page.locator('#people-view details').evaluateAll(list => list.forEach(node => { node.open = true; })); await scan('people: business case open'); await shot('7-business-case', '#people .brief-details');
    run.controls.people = await page.locator('#people-view article button, #people-view .person button').evaluateAll(list => list.map(b => (b.disabled ? '(off) ' : '') + b.textContent.trim().slice(0, 40)));
    const discuss = page.locator('#people-view button:enabled').filter({ hasText: '↗' }).first();
    if (await discuss.count()) { await discuss.click(); await page.locator('#invite-dialog[open]').waitFor(); await scan('dialog: invitation'); await page.locator('#invite-cancel').click(); } else run.steps.push({ step: 'dialog: invitation', skipped: 'the invitation button stayed off' });
    // (7) The meeting place «online» is stored by the same value whatever the list shows.
    const place = await page.locator('#invite-place option').first().evaluate(node => ({ value: node.value, label: node.textContent }));
    assert.equal(place.value, 'Онлайн', 'the first meeting place would be sent as «' + place.value + '»'); if (latin) assert.notEqual(place.label, 'Онлайн', 'the meeting place label was not translated');
    run.choices = await page.evaluate(() => [...document.querySelectorAll('option')].filter(node => !node.hasAttribute('value') && /[Ѐ-ӿ]/.test(node.value)).map(node => node.value));
    assert.deepEqual(run.choices, [], 'choices that would be sent by their label');
    // (4) There and back again: the Ukrainian page returns exactly, typed text stays, nothing is written.
    // The lists are redrawn first while the other language is on screen, so freshly drawn text is covered too.
    await tab('people'); await page.locator('#refresh').click(); await page.waitForTimeout(700); await tab('meetings'); await page.locator('#refresh-meetings').click(); await page.waitForTimeout(700); await settle(); await scan('lists redrawn in this language');
    await tab('profile');
    const snapshot = () => page.evaluate(() => { const parts = []; const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) if (!node.parentElement.closest('script,style,#notice,#meeting-count,[aria-live]')) parts.push(node.nodeValue);
      for (const element of document.body.querySelectorAll('[aria-label],[placeholder],[title],[alt]')) for (const name of ['aria-label', 'placeholder', 'title', 'alt']) if (element.hasAttribute(name)) parts.push(name + '=' + element.getAttribute(name));
      for (const box of document.querySelectorAll('#people textarea[readonly]')) parts.push('generated=' + box.value);
      return parts.join('\u0001'); });
    await page.locator('.header-preferences > summary').click(); await page.locator('#lang-switcher [data-lang="uk"]').click(); await settle();
    const ukrainian = await snapshot();
    const field = page.locator('#profile-form textarea, #profile-form input[type=text]').first(); await field.fill('Typed and not saved');
    const writes = () => db.requests.filter(row => row.method !== 'GET').length, before = writes();
    for (const code of ['de', 'en', 'uk']) { await page.locator(`#lang-switcher [data-lang="${code}"]`).click(); await page.waitForFunction(lang => document.documentElement.lang === lang, code); await settle();
      assert.equal(await field.inputValue(), 'Typed and not saved', 'typed text lost on switching to ' + code);
      if (code !== 'uk') assert.notEqual(await snapshot(), ukrainian, 'the page did not change language: ' + code); }
    const differs = (step, was, is) => { if (was === is) return; const a = was.split('\u0001'), b = is.split('\u0001'); const at = a.findIndex((part, index) => part !== b[index]);
      result.problems.push({ run: label, step, problem: 'the Ukrainian page was not restored exactly', was: (a[at] || '').slice(0, 120), is: (b[at] || '').slice(0, 120) }); };
    differs('there and back', ukrainian, await snapshot());
    assert.equal(writes(), before, 'switching language sent a write');
    // The same page drawn afresh in Ukrainian is the reference: what was restored must equal it word for word.
    await page.locator('.header-preferences > summary').click(); run.noticeBeforeRedraw = (await page.locator('#notice').textContent()).slice(0, 120);
    await tab('people'); await page.locator('#refresh').click(); await page.waitForTimeout(700); await tab('meetings'); await page.locator('#refresh-meetings').click(); await page.waitForTimeout(700); await tab('profile'); await settle();
    differs('restored against a fresh Ukrainian draw', ukrainian, await snapshot());
    await page.evaluate(code => document.querySelector(`#lang-switcher [data-lang="${code}"]`).click(), language); await page.waitForFunction(lang => document.documentElement.lang === lang, language);
    // The rules page: an unofficial translation that says so and offers the binding Ukrainian text.
    await page.goto(base + '/legal.html');
    if (latin) {
      await page.locator('#translation-notice').waitFor(); await scan('rules page'); await shot('8-rules', 'main');
      await page.locator('#translation-notice a').click(); await page.waitForLoadState('load'); await page.waitForTimeout(300);
      const original = await page.evaluate(() => ({ lang: document.documentElement.lang, notice: Boolean(document.getElementById('translation-notice')), text: document.querySelector('main').textContent.slice(0, 200) }));
      assert.ok(original.lang === 'uk' && !original.notice && /[\u0400-\u04FF]/.test(original.text), 'the original rules were not shown');
    } else { await page.waitForTimeout(500); assert.equal(await page.locator('#translation-notice').count(), 0, 'the Ukrainian rules page carries a translation notice'); }
    // The two-person page opens in the same language without any parameter.
    await page.goto(base + '/real-journey.html'); await page.locator('#real-content-panel').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => document.documentElement.lang), language, 'the choice was not carried to the two-person page');
    if (errors.length) result.problems.push({ run: label, problem: 'page errors', sample: errors.slice(0, 3) });
    if (run.refusedByFixture?.length) result.problems.push({ run: label, problem: 'the fixture refused a request, so that screen was not really shown', sample: [...new Set(run.refusedByFixture)].slice(0, 4) });
    // (3) A Ukrainian visit must not download the language text of this page.
    if (!latin) run.languageFilesBeforeSwitch = 'checked separately';
    run.pass = true;
  } catch (error) { run.pass = false; result.failures.push({ run: label, error: error.message.replace(/\u001b\[\d+m/g, '').split('\n').slice(0, 6).join(' | ') }); await shot('failure').catch(() => {}); }
  finally { await context.close(); }
}

// (6) A person's own Ukrainian words, in the two hardest forms. «labels»: each value equals one of the page's
// own labels, so only the place tells them apart. «lookalikes»: each value is unique but shaped like text the
// page assembles (a label list, a date line, a step counter), so any place that shows it alone and unmarked
// is a leak. Either way the page must show it exactly as written, before and after a redraw.
const OWN_WORDS = {
  labels: { name: 'Демо', city: 'Онлайн', offers: 'Оновити', seeks: 'Скасувати', goal: 'Не вказано', note: 'Прийнято', message: 'Закрити' },
  lookalikes: { name: 'Місто: Київ', city: 'Онлайн, Zürich', offers: 'Дизайн продукту, Автоматизація процесів', seeks: 'Зустріч: щовівторка о десятій', goal: 'Крок 2 / 6: один перевірений екран', note: 'Ти · 11 жовт. 2026 р., 23:26', message: 'КРОК 2 / 6' },
};
async function ownWords(browser, language, kind) {
  const OWN = OWN_WORDS[kind], unique = kind === 'lookalikes', label = `own-words-${kind}-${language}`, run = { run: label, steps: [], own: {} }; result.runs.push(run);
  const db = createFixture();
  for (const profile of db.profiles) { profile.display_name = names[profile.id] || profile.display_name; profile.brief.goal = 'Check one concrete result for the business'; profile.offers = 'Process automation for small teams'; profile.seeks = 'A reviewed product screen'; }
  const peer = db.profiles.find(profile => profile.id === B); Object.assign(peer, { display_name: OWN.name, city: OWN.city, offers: OWN.offers, seeks: OWN.seeks }); peer.brief.goal = OWN.goal;
  const a = new RealJourneyStore(config, db.fetchFor(A)), b = new RealJourneyStore(config, db.fetchFor(B));
  await Promise.all([a.dashboard(), b.dashboard()]);
  const terms = await a.saveTerms(B, exchangeMaterial(A, B, fields({ give_target: 'One working prototype', take_target: 'One reviewed screen', give_criteria: 'Opens and runs the agreed scenario', take_criteria: 'Both reviewed the screen on a phone' })));
  await a.approveTerms(B, terms); await b.approveTerms(A, await b.pairState(A));
  const meeting = (await a.sendInvitation(B, OWN.note, { proposed_at: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 30, meeting_place: 'Zürich' })).meetings[0];
  await b.respondInvitation(meeting.id, 'accepted'); await b.sendConversation(meeting.id, OWN.message);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'uk-UA' });
  context.setDefaultTimeout(12000);
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await context.route('**/config.json', route => route.fulfill({ json: config }));
  await context.route('**/api/neon/**', async route => { const request = route.request(), url = new URL(request.url());
    if (url.pathname === '/api/neon/health') { await route.fulfill({ json: { authGateway: 'reachable', backend: 'neon', policyVersion: POLICY_VERSION } }); return; }
    const response = await db.fetchFor(A)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() }); });
  const page = await context.newPage();
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  // Every place on the page where one of the person's values is shown: which value, and the full text around it.
  const places = () => page.evaluate(values => { const found = []; const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) { if (node.parentElement.closest('script,style')) continue; for (const [name, value] of Object.entries(values)) if (node.nodeValue.includes(value)) found.push({ name, whole: node.nodeValue.trim() === value, marked: Boolean(node.parentElement.closest('[translate="no"]')), text: node.nodeValue.trim().slice(0, 90) }); }
    return found; }, OWN);
  const card = () => page.locator('#person-' + B).evaluate(node => ({ name: node.querySelector('h3')?.textContent, city: node.querySelector('.city')?.textContent, facts: [...node.querySelectorAll('.fact > span')].map(span => span.textContent), initial: node.querySelector('.avatar')?.textContent }));
  const check = (step, pass, detail) => { run.steps.push({ step, pass: Boolean(pass) }); if (!pass) result.problems.push({ run: label, step, problem: 'a person\'s own words were changed or lost', detail }); };
  try {
    await page.goto(base + '/'); await page.waitForTimeout(1500);
    const guide = page.locator('.tour-panel'); for (let step = 0; step < 8 && await guide.isVisible(); step++) await guide.locator('.actions button').nth(1).click();
    await page.locator('nav [data-tab="settings"]').click(); await page.locator('#consent-comparison').check(); await page.locator('#consent-introduction').check();
    await page.locator('nav [data-tab="meetings"]').click(); await settle(); await page.locator('#meetings-view article button, #meetings-view .card button, #meeting-list button').nth(1).click(); await page.locator('#chat-dialog[open]').waitFor(); await settle();
    const expected = { name: OWN.name, city: OWN.city, facts: [OWN.offers, OWN.seeks, OWN.goal], initial: OWN.name[0] };
    // With label-equal values only the marked places are certainly the person's; unique values are theirs everywhere.
    const mine = list => list.filter(place => unique || place.marked);
    const ukrainian = mine(await places()); run.own.placesInUkrainian = ukrainian.length;
    check('the fixture reached the page in Ukrainian', ['note', 'message'].every(name => ukrainian.some(place => place.name === name && place.whole && place.marked)), ukrainian);
    check('Ukrainian card', JSON.stringify(await card()) === JSON.stringify(expected), await card());
    // Switch on the open page: the same text nodes must still carry the same words.
    await page.evaluate(code => document.querySelector(`#lang-switcher [data-lang="${code}"]`).click(), language); await page.waitForFunction(code => document.documentElement.lang === code, language); await settle();
    const switched = mine(await places()); run.own.placesAfterSwitch = switched.length;
    check('after switching: every place still shows the words as written', switched.length === ukrainian.length && ukrainian.every((place, index) => switched[index].name === place.name && switched[index].whole === place.whole), { was: ukrainian, is: switched });
    check('after switching: the card', JSON.stringify(await card()) === JSON.stringify(expected), await card());
    check('after switching: the message', (await page.locator('#chat-messages .chat-message > p').allTextContents()).join('|') === OWN.message, await page.locator('#chat-messages .chat-message > p').allTextContents());
    check('after switching: the page itself is in the chosen language', (await page.locator('#chat-form button[type=submit], #chat-dialog button').first().textContent()).match(/[Ѐ-ӿ]/) === null, null);
    await page.screenshot({ path: path.join(out, `${label}-chat.png`) });
    // Redraw everything while the other language is on screen.
    await page.locator('#refresh-chat').click(); await page.waitForTimeout(600); await settle();
    check('after a redraw: the message', (await page.locator('#chat-messages .chat-message > p').allTextContents()).join('|') === OWN.message, await page.locator('#chat-messages .chat-message > p').allTextContents());
    await page.locator('#chat-cancel').click(); await page.locator('#refresh-meetings').click(); await page.waitForTimeout(700); await settle();
    const note = await page.locator('#meetings-view [translate="no"]').allTextContents();
    check('after a redraw: the meeting note', note.includes(OWN.note), note);
    await page.locator('#meetings-view').screenshot({ path: path.join(out, `${label}-meetings.png`) }).catch(() => {});
    await page.locator('nav [data-tab="people"]').click(); await page.locator('#refresh').click(); await page.waitForTimeout(800); await settle();
    check('after a redraw: the card', JSON.stringify(await card()) === JSON.stringify(expected), await card());
    await page.locator('#person-' + B).scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(out, `${label}-card.png`) });
    // The page's own «online» and «not given» (another person left the field empty) are still translated.
    const other = await page.locator('#person-' + C).evaluate(node => [...node.querySelectorAll('.fact > span')].map(span => span.textContent));
    run.own.pageLabelsNextToThem = other;
    const redrawn = mine(await places()); run.own.placesAfterRedraw = redrawn.length; run.own.assembledAround = [...new Set(redrawn.filter(place => !place.whole).map(place => place.name + ': ' + place.text))];
    if (unique) { run.own.unmarked = [...new Set(redrawn.filter(place => place.whole && !place.marked).map(place => place.name + ': ' + place.text))];
      check('after a redraw: nothing the person wrote stands alone without the mark', run.own.unmarked.length === 0, run.own.unmarked); }
    check('after a redraw: every value is still on the page as written', ['name', 'city', 'offers', 'seeks', 'goal'].every(name => redrawn.some(place => place.name === name && place.whole && place.marked)), redrawn);
    run.pass = run.steps.every(step => step.pass);
  } catch (error) { run.pass = false; result.failures.push({ run: label, error: error.message.replace(/\u001b\[\d+m/g, '').split('\n').slice(0, 6).join(' | ') }); await page.screenshot({ path: path.join(out, `${label}-failure.png`) }).catch(() => {}); }
  finally { await context.close(); }
}

// (3) Default visit: Ukrainian, and none of the language text is fetched.
async function defaultVisit(browser) {
  const db = await world(), loaded = [];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'de-CH' });
  await context.route('**/*', route => { const url = new URL(route.request().url()); if (url.origin !== base) return route.abort(); loaded.push(url.pathname); return route.continue(); });
  await context.route('**/config.json', route => route.fulfill({ json: config }));
  await context.route('**/api/neon/**', async route => { const request = route.request(), url = new URL(request.url());
    if (url.pathname === '/api/neon/health') { await route.fulfill({ json: { authGateway: 'reachable', backend: 'neon', policyVersion: POLICY_VERSION } }); return; }
    const response = await db.fetchFor(A)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() }); });
  const page = await context.newPage();
  try {
    await page.goto(base + '/'); await page.waitForTimeout(1500);
    const state = await page.evaluate(() => ({ lang: document.documentElement.lang, pressed: document.querySelector('#lang-switcher [aria-pressed="true"]')?.dataset.lang, text: document.body.innerText.slice(0, 2000) }));
    result.defaultVisit = { browserLocale: 'de-CH', lang: state.lang, pressed: state.pressed, languageFilesLoaded: loaded.filter(name => LANGUAGE_FILES.includes(name)) };
    if (state.lang !== 'uk' || state.pressed !== 'uk' || !/[Ѐ-ӿ]/.test(state.text)) result.problems.push({ run: 'default', problem: 'the default visit is not Ukrainian', state: { lang: state.lang, pressed: state.pressed } });
    if (result.defaultVisit.languageFilesLoaded.length) result.problems.push({ run: 'default', problem: 'a Ukrainian visit loaded language text', files: result.defaultVisit.languageFilesLoaded });
    // Two quick choices: the later one wins, on screen, on the buttons and in what is remembered.
    const quick = async (first, second) => { await page.evaluate(([one, two]) => { document.querySelector(`#lang-switcher [data-lang="${one}"]`).click(); document.querySelector(`#lang-switcher [data-lang="${two}"]`).click(); }, [first, second]); await page.waitForTimeout(900);
      return page.evaluate(() => ({ lang: document.documentElement.lang, pressed: [...document.querySelectorAll('#lang-switcher [aria-pressed="true"]')].map(node => node.dataset.lang).join(), stored: localStorage.getItem('synera.real-journey.language.v1'), ukrainian: /[Ѐ-ӿ]/.test(document.querySelector('#welcome, #workspace:not([hidden])')?.innerText || document.body.innerText) })); };
    const toUkrainian = await quick('de', 'uk'), toGerman = await quick('en', 'de');
    result.defaultVisit.quickChoices = { 'de then uk': toUkrainian, 'en then de': toGerman };
    if (toUkrainian.lang !== 'uk' || toUkrainian.pressed !== 'uk' || toUkrainian.stored !== 'uk' || !toUkrainian.ukrainian) result.problems.push({ run: 'default', problem: 'German then Ukrainian, quickly: the page did not end in Ukrainian', state: toUkrainian });
    if (toGerman.lang !== 'de' || toGerman.pressed !== 'de' || toGerman.stored !== 'de') result.problems.push({ run: 'default', problem: 'English then German, quickly: the page did not end in German', state: toGerman });
  } catch (error) { result.failures.push({ run: 'default', error: error.message.split('\n')[0] }); }
  finally { await context.close(); }
}

let browser;
try {
  const executablePath = engine === 'chromium' ? process.env.SYNERA_CHROMIUM || undefined : undefined;
  browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, timeout: 30000, ...(executablePath ? { executablePath } : {}) });
  result.engine = { name: engine, version: browser.version() };
  for (const view of [{ language: 'uk', width: 390, height: 844 }, { language: 'de', width: 390, height: 844 }, { language: 'en', width: 390, height: 844 }, { language: 'de', width: 320, height: 568 }, { language: 'uk', width: 320, height: 568 }]) await journey(browser, view);
  for (const [language, kind] of [['de', 'labels'], ['en', 'labels'], ['de', 'lookalikes'], ['en', 'lookalikes']]) await ownWords(browser, language, kind);
  await defaultVisit(browser);
} catch (error) { result.failures.push({ stage: 'launch', error: error.message.split('\n')[0] }); }
finally {
  if (browser) await browser.close(); await new Promise(resolve => server.close(resolve));
  assert.equal(sha(await fs.readFile(path.join(root, 'release.json'))), releaseHash, 'Candidate changed during the run');
  const steps = result.runs.flatMap(run => run.steps);
  result.summary = { runs: result.runs.length, passed: result.runs.filter(run => run.pass).length, steps: steps.filter(step => !step.skipped).length, skipped: steps.filter(step => step.skipped).length,
    ukrainianVisible: steps.reduce((sum, step) => sum + (step.ukrainianVisible || 0), 0), ukrainianHidden: steps.reduce((sum, step) => sum + (step.ukrainianHidden || 0), 0),
    problems: result.problems.length, failures: result.failures.length };
  result.status = result.failures.length || result.problems.length || result.summary.passed !== result.runs.length ? 'NEEDS_REVIEW' : `PASS_DESKTOP_${engine.toUpperCase()}_SYNTHETIC`;
  await fs.writeFile(path.join(out, 'RESULT.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ status: result.status, ...result.summary, sample: result.problems.slice(0, 8), failures: result.failures }));
}
process.exit(result.status.startsWith('PASS_') ? 0 : 1);
