// Real clicks in a desktop browser against a built candidate: the sign-in and profile page in German and in
// English, with Ukrainian as the control. Fixture content is Latin, so Cyrillic left on the page in German or
// English is product text that was not translated.
// Invariants: (1) no Ukrainian text is left on the screens walked here; (2) the choice is shared with the
// two-person page and survives a reload; the browser locale is not consulted; (3) a Ukrainian visit never
// loads the language text; (4) switching language and back restores the Ukrainian page exactly, keeps what
// the person typed and sends no write; (5) profile deletion can be confirmed in each language.
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
const LANGUAGE_FILES = ['/index-i18n.mjs', '/index-i18n-table.mjs', '/real-journey-i18n.mjs'];
const result = { scope: 'Desktop browser, synthetic Auth/Data fixture through the real gateway code. No physical phone, live account, JWT or RLS proof.',
  candidate: path.basename(root), releaseHash, engine: null, runs: [], problems: [], failures: [], provider_calls: 0, usd: 0,
  notWalked: ['Google sign-in and e-mail code delivery', 'AI profile draft and ChatGPT/Claude import (answers come from a provider or are switched off)', 'live location sharing', 'map tiles', 'text placed into fields, files or the clipboard (business case text, share card, invitation draft) — by design it is not translated'] };

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
    if (!signedIn) { await route.fulfill({ status: 401, json: {} }); return; }
    // The gateway's health probe needs a provider; here it only has to say «reachable».
    if (url.pathname === '/api/neon/health') { await route.fulfill({ json: { authGateway: 'reachable', backend: 'neon', policyVersion: POLICY_VERSION } }); return; }
    const response = await db.fetchFor(actor)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message.slice(0, 160)));
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const open = async (query = '') => { await page.goto(base + '/' + query); await page.waitForFunction(() => document.querySelector('#mode') && !/Перевірка доступу|Zugangsprüfung|Checking access/.test(document.querySelector('#mode').textContent)).catch(() => {}); await page.waitForTimeout(400); await settle(); };
  const shot = async (name, selector) => { if (selector) await page.locator(selector).first().evaluate(node => node.scrollIntoView({ block: 'start' })); await page.screenshot({ path: path.join(out, `${label}-${name}.png`) }); };
  const scan = async step => {
    await settle();
    const seen = await page.evaluate(() => {
      const cyrillic = /[Ѐ-ӿ]/, visible = [], hidden = [];
      const push = (element, text) => (element.checkVisibility({ checkVisibilityCSS: true }) ? visible : hidden).push(text.trim().slice(0, 100));
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) { const parent = node.parentElement; if (!cyrillic.test(node.nodeValue) || parent.closest('script,style,textarea,.chat-message > p')) continue; push(parent, node.nodeValue); }
      for (const element of document.body.querySelectorAll('[aria-label],[placeholder],[title],[alt]')) for (const name of ['aria-label', 'placeholder', 'title', 'alt']) { const value = element.getAttribute(name); if (value && cyrillic.test(value)) push(element, `${name}=${value}`); }
      if (cyrillic.test(document.title)) visible.push('title=' + document.title);
      for (const box of document.querySelectorAll('#people textarea[readonly]')) for (const line of box.value.split('\n')) if (cyrillic.test(line)) push(box, 'generated=' + line);
      const sideways = document.documentElement.scrollWidth - innerWidth;
      // Name what sticks out, so a too-long word can be found without guessing.
      const wide = sideways > 1 ? [...document.body.querySelectorAll('*')].filter(node => node.checkVisibility() && node.getBoundingClientRect().right > innerWidth + 1 && ![...node.children].some(child => child.getBoundingClientRect().right > innerWidth + 1))
        .slice(0, 4).map(node => `${node.tagName.toLowerCase()}${node.id ? '#' + node.id : ''}.${node.className}: ${node.textContent.trim().slice(0, 50)}`) : [];
      return { visible, hidden, lang: document.documentElement.lang, sideways, wide };
    });
    run.steps.push({ step, ukrainianVisible: latin ? seen.visible.length : null, ukrainianHidden: latin ? seen.hidden.length : null, sideways: seen.sideways });
    if (seen.lang !== language) result.problems.push({ run: label, step, problem: `document language is ${seen.lang}` });
    if (latin && seen.visible.length) result.problems.push({ run: label, step, problem: 'Ukrainian text left on screen', sample: [...new Set(seen.visible)].slice(0, 12) });
    if (latin && seen.hidden.length) (run.hiddenLeft ||= {})[step] = [...new Set(seen.hidden)].slice(0, 40);
    if (seen.sideways > 1) result.problems.push({ run: label, step, problem: `page scrolls sideways by ${seen.sideways}px`, wide: seen.wide });
    return seen;
  };
  const tab = async name => { await page.locator(`nav [data-tab="${name}"]`).click(); await settle(); };
  const dialog = async (opener, id, name) => { await page.locator(opener).click(); await page.locator(`#${id}[open]`).waitFor(); await scan(name); await page.keyboard.press('Escape'); await page.locator(`#${id}`).evaluate(node => node.open && node.close()); };
  try {
    // Signed out: the first screen a new person meets.
    signedIn = false; await open(latin ? '?lang=' + language : ''); await scan('sign-in screen'); await shot('1-sign-in', '#welcome');
    if (latin) assert.equal(await page.locator(`#lang-switcher [data-lang="${language}"]`).getAttribute('aria-pressed'), 'true');
    if (await page.locator('#signup').isVisible()) { await page.locator('#signup').click(); await scan('sign-up form'); }
    await page.locator('.header-preferences > summary').click(); await scan('language and appearance panel'); await page.locator('.header-preferences > summary').click();
    // Signed in, no parameter: the choice was remembered.
    signedIn = true; await open();
    // A first visit is offered a short tour; it lies over the page until it is finished.
    const guide = page.locator('.tour-panel'); await page.waitForTimeout(800);
    for (let stepNumber = 1; stepNumber <= 8 && await guide.isVisible(); stepNumber++) { await scan('tour step ' + stepNumber); if (stepNumber === 1) await shot('2-tour'); await guide.locator('.actions button').nth(1).click(); await settle(); }
    assert.equal(await guide.isVisible(), false, 'the tour did not finish');
    await scan('workspace after sign-in');
    for (const name of ['people', 'profile', 'meetings', 'settings']) { await tab(name); await scan('tab: ' + name); if (name === 'profile') await shot('3-profile', '#profile-view'); }
    await tab('profile'); await page.locator('#profile-form .brief-details').evaluate(node => { node.open = true; }); await scan('profile: collaboration details'); await shot('4-profile-details', '#profile-form .brief-details');
    await dialog('#share-profile', 'share-dialog', 'dialog: share card');
    await dialog('#import-profile', 'import-dialog', 'dialog: import profile');
    await dialog('#prepare-ai', 'ai-dialog', 'dialog: AI draft');
    await tab('settings'); await shot('6-privacy', '#settings-view');
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
    const discuss = page.locator('#people-view button').filter({ hasText: '↗' }).first();
    if (await discuss.isEnabled()) { await discuss.click(); await page.locator('#invite-dialog[open]').waitFor(); await scan('dialog: invitation'); await page.locator('#invite-cancel').click(); } else run.steps.push({ step: 'dialog: invitation', skipped: 'the invitation button stayed off' });
    // (4) There and back again: the Ukrainian page returns exactly, typed text stays, nothing is written.
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
    const back = await snapshot();
    if (back !== ukrainian) { const a = ukrainian.split('\u0001'), b = back.split('\u0001'); const at = a.findIndex((part, index) => part !== b[index]);
      result.problems.push({ run: label, step: 'there and back', problem: 'the Ukrainian page was not restored exactly', was: (a[at] || '').slice(0, 120), is: (b[at] || '').slice(0, 120) }); }
    assert.equal(writes(), before, 'switching language sent a write');
    await page.locator(`#lang-switcher [data-lang="${language}"]`).click(); await page.waitForFunction(lang => document.documentElement.lang === lang, language);
    // The two-person page opens in the same language without any parameter.
    await page.goto(base + '/real-journey.html'); await page.locator('#real-content-panel').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => document.documentElement.lang), language, 'the choice was not carried to the two-person page');
    if (errors.length) result.problems.push({ run: label, problem: 'page errors', sample: errors.slice(0, 3) });
    // (3) A Ukrainian visit must not download the language text of this page.
    if (!latin) run.languageFilesBeforeSwitch = 'checked separately';
    run.pass = true;
  } catch (error) { run.pass = false; result.failures.push({ run: label, error: error.message.replace(/\u001b\[\d+m/g, '').split('\n').slice(0, 6).join(' | ') }); await shot('failure').catch(() => {}); }
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
  } catch (error) { result.failures.push({ run: 'default', error: error.message.split('\n')[0] }); }
  finally { await context.close(); }
}

let browser;
try {
  const executablePath = engine === 'chromium' ? process.env.SYNERA_CHROMIUM || undefined : undefined;
  browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, timeout: 30000, ...(executablePath ? { executablePath } : {}) });
  result.engine = { name: engine, version: browser.version() };
  for (const view of [{ language: 'uk', width: 390, height: 844 }, { language: 'de', width: 390, height: 844 }, { language: 'en', width: 390, height: 844 }, { language: 'de', width: 320, height: 568 }, { language: 'uk', width: 320, height: 568 }]) await journey(browser, view);
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
