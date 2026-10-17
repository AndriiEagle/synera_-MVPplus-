// Real clicks in a desktop browser against a built candidate with the synthetic two-party fixture.
// Invariants: after every action the person can SEE what happened without scrolling; the page shows which
// of the four steps they are on; a pending invitation is not offered for sending twice; the status line
// never covers the control that has focus. Not physical phones, live accounts, JWT or RLS proof.
// Usage: node tools/journey-feedback-browser.mjs --candidate=web_launch/dist-neon-<name> --out=<dir> [--engine=chromium|webkit]
import { chromium, webkit } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { A, B, config, fields, createFixture } from './fixtures/real-journey-fixture.mjs';
import { createOutcomeFixture } from './fixtures/case-outcome-fixture.mjs';
import { RealJourneyStore, exchangeMaterial } from '../web_launch/real-journey-client.mjs';

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
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' }).end(await fs.readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const views = [
  { name: 'phone', width: 390, height: 844 }, { name: 'small', width: 320, height: 568 },
  { name: 'landscape', width: 844, height: 390 }, { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone-atelier', width: 390, height: 844, atelier: true },
];
const result = { scope: 'Desktop browser, synthetic Auth/Data fixture through the real gateway code. No physical phone, live account, JWT or RLS proof.',
  candidate: path.basename(root), releaseHash, engine: null, observations: [], problems: [], failures: [], provider_calls: 0, usd: 0 };

async function journey(browser, view) {
  const db = createFixture(); let actor = A;
  const context = await browser.newContext({ viewport: { width: view.width, height: view.height }, serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'uk-UA' });
  context.setDefaultTimeout(12000);
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await context.route('**/config.json', route => route.fulfill({ json: config }));
  await context.route('**/api/neon/**', async route => {
    const request = route.request(), url = new URL(request.url());
    const response = await db.fetchFor(actor)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  if (view.atelier) await context.addInitScript(() => localStorage.setItem('synera.atelier.preferences.v1', JSON.stringify({ version: 1, enabled: true, accent: 'gold', density: 'comfortable', largeText: false, strongContrast: false })));
  const page = await context.newPage();
  const ready = () => page.waitForFunction(() => !document.body.dataset.realBusy);
  const load = async () => { await page.goto(base + '/real-journey.html'); await page.locator('#real-content-panel').waitFor({ state: 'visible' }); await ready(); };
  const peer = async name => { const panel = page.locator('#real-people-panel'); if (!await panel.evaluate(node => node.open)) await panel.locator('summary').first().click(); await page.locator('#real-people article').filter({ hasText: name }).getByRole('button').click(); await ready(); };
  // One observation = what a sighted person has on screen right after the action, with no scrolling.
  const observe = async (action, expectedStep, { afterAction = true } = {}) => {
    const seen = await page.evaluate(() => {
      const status = document.getElementById('real-status'), r = status.getBoundingClientRect(), focus = document.activeElement;
      const f = focus && focus !== document.body ? focus.getBoundingClientRect() : null;
      const steps = [...document.querySelectorAll('.real-steps li')];
      return { text: status.textContent.slice(0, 80), statusVisible: r.top >= 0 && r.bottom <= innerHeight && r.height > 0, statusHeight: Math.round(r.height), viewport: innerHeight,
        // The opaque status bar must not sit on top of the control that currently has keyboard focus.
        focusCovered: Boolean(f && f.height && f.top < r.bottom && f.bottom > r.top && f.left < r.right && f.right > r.left),
        step: steps.findIndex(item => item.getAttribute('aria-current') === 'step'), marked: steps.filter(item => item.hasAttribute('aria-current')).length,
        barMatchesPage: getComputedStyle(status).backgroundColor === getComputedStyle(document.body).backgroundColor };
    });
    const row = { view: view.name, action, afterAction, expectedStep, ...seen }; result.observations.push(row);
    // A first paint is not feedback to an action: on a short screen the line may still sit below the heading.
    if (afterAction && !seen.statusVisible) result.problems.push({ ...row, problem: 'feedback off screen' });
    if (!seen.barMatchesPage) result.problems.push({ ...row, problem: 'status bar colour differs from the page' });
    if (seen.focusCovered) result.problems.push({ ...row, problem: 'status covers the focused control' });
    if (seen.step !== expectedStep || seen.marked !== 1) result.problems.push({ ...row, problem: 'current step not shown' });
    if (seen.statusHeight > seen.viewport / 3) result.problems.push({ ...row, problem: 'status takes more than a third of the screen' });
  };
  const shot = name => page.screenshot({ path: path.join(out, `${view.name}-${name}.png`) });
  try {
    await load(); await observe('first paint', 0, { afterAction: false });
    await peer('Тест Марія'); await observe('open terms', 1);
    for (const [name, value] of Object.entries(fields())) { const field = page.locator(`#real-terms-form [name="${name}"]`); if (await field.evaluate(node => node.tagName === 'SELECT')) await field.selectOption(value); else await field.fill(value); }
    await page.locator('#real-terms-form [name="cancellation"]').focus(); await observe('fill terms (focus at the end of the form)', 1); await shot('1-terms-form');
    await page.locator('#real-terms-form button[type=submit]').click(); await ready(); await observe('save terms', 1);
    await page.locator('#real-approve-check').check(); await page.locator('#real-approve').click(); await ready(); await observe('approve own side', 1);
    actor = B; await load(); await peer('Тест Андрій'); await page.locator('#real-approve-check').check(); await page.locator('#real-approve').click(); await ready(); await observe('second approval', 2);
    actor = A; await load(); await peer('Тест Марія'); await observe('both approved', 2);
    const invite = page.locator('#real-invite-form');
    await invite.locator('[name=note]').fill('Обговорити перевірений екран'); await invite.locator('[name=proposed_at]').fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    await invite.locator('[name=meeting_place]').selectOption('Zürich'); await invite.getByRole('button').click(); await ready(); await observe('send invitation', 2); await shot('2-after-invitation');
    // One pending invitation per pair: the form is replaced by the reason, not left ready to send again.
    assert.equal(await page.locator('#real-invite').isHidden(), true, 'invite form stays offered while one is pending');
    assert.equal(await page.locator('#real-invite-wait').isVisible(), true, 'no explanation for the missing invite form');
    assert.equal(db.meetings.length, 1);
    actor = B; await load();
    await page.locator('#real-meetings').getByRole('button', { name: 'Прийняти', exact: true }).click(); await ready(); await observe('accept invitation', 0);
    await page.locator('#real-meetings').getByRole('button', { name: 'Відкрити розмову' }).click(); await ready(); await observe('open conversation', 3);
    await page.locator('#real-message').fill('Привіт! Домовмося про перший крок.'); await page.locator('#real-message-form button').click(); await ready(); await observe('send message', 3); await shot('3-chat');
    assert.equal(db.messages.length, 1); assert.equal(db.approvals.length, 2);
    // After acceptance the sender may invite again, so the form returns.
    actor = A; await load(); await peer('Тест Марія');
    assert.equal(await page.locator('#real-invite').isVisible(), true, 'invite form did not return after the invitation was answered');
    assert.equal(await page.locator('#real-invite-wait').count(), 0);
  } catch (error) { result.failures.push({ view: view.name, error: error.message.split('\n')[0] }); await shot('failure').catch(() => {}); }
  finally { await context.close(); }
}

// Refusals and disputes must name a next action instead of a sign-in hint or a silent dead end.
async function recoveryTexts(browser) {
  const db = createOutcomeFixture(), settings = { ...config, caseOutcomesEnabled: true }; let actor = A, refuseMessages = false;
  const a = new RealJourneyStore(settings, db.fetchFor(A)), b = new RealJourneyStore(settings, db.fetchFor(B));
  await Promise.all([a.dashboard(), b.dashboard()]);
  const terms = await a.saveTerms(B, exchangeMaterial(A, B, fields())); await a.approveTerms(B, terms); await b.approveTerms(A, await b.pairState(A));
  const meeting = (await a.sendInvitation(B, 'Обговорити перевірений екран', { proposed_at: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 30, meeting_place: 'Zürich' })).meetings[0];
  await b.respondInvitation(meeting.id, 'accepted');
  // A gives item 0; B checks it and opens a dispute.
  const agreed = await a.pairState(B), uuid = () => crypto.randomUUID();
  const item = agreed.material.trial.deliverables.findIndex(leg => leg.giver_id === A); assert.ok(item >= 0);
  await a.recordOutcome(B, agreed, { action: 'submit', index: item, intentId: uuid(), evidenceUri: 'https://example.invalid/screen' });
  await b.recordOutcome(A, agreed, { action: 'check', index: item, intentId: uuid(), scopeNotes: 'Не відкривається на телефоні' });
  await b.recordOutcome(A, agreed, { action: 'decline', index: item, intentId: uuid(), reason: 'below_acceptance_criteria' });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'uk-UA' });
  context.setDefaultTimeout(12000);
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await context.route('**/config.json', route => route.fulfill({ json: settings }));
  await context.route('**/api/neon/**', async route => {
    const request = route.request(), url = new URL(request.url());
    // What the gateway returns when the database refuses a write with a plain exception, e.g. the daily admission limit.
    if (refuseMessages && request.method() === 'POST' && url.pathname.endsWith('/data/meeting_messages')) { await route.fulfill({ status: 400, json: { error: 'data_unavailable', status: 400 } }); return; }
    const response = await db.fetchFor(actor)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  const page = await context.newPage(), ready = () => page.waitForFunction(() => !document.body.dataset.realBusy);
  const open = async name => { await page.goto(base + '/real-journey.html'); await page.locator('#real-content-panel').waitFor({ state: 'visible' }); await ready();
    await page.locator('#real-people article').filter({ hasText: name }).getByRole('button').click(); await ready(); await page.locator('#real-outcome-refresh').click(); await ready(); };
  try {
    await open('Тест Марія');
    const giver = await page.locator(`#real-outcome-cards article[data-outcome-index="${item}"]`).innerText();
    assert.ok(giver.includes('Є відкритий спір'), 'fixture did not reach the dispute state');
    assert.ok(giver.includes('збережіть нову редакцію умов') && giver.includes('одержувач може прийняти'), 'the giver sees a dispute with no next action');
    assert.equal(await page.locator(`#real-outcome-cards article[data-outcome-index="${item}"]`).locator('form').count(), 0, 'the giver is offered a write the server refuses');
    await page.locator(`#real-outcome-cards article[data-outcome-index="${item}"]`).scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(out, 'dispute-giver.png') });
    actor = B; await open('Тест Андрій');
    const receiver = await page.locator(`#real-outcome-cards article[data-outcome-index="${item}"]`).innerText();
    assert.ok(receiver.includes('Спір відкрито тобою') && receiver.includes('прийняти результат пізніше'), 'the receiver sees a dispute with no next action');
    // A refused message keeps the text and does not talk about e-mail or sign-in codes.
    await page.locator('#real-meetings-panel summary').first().click(); await page.locator('#real-meetings').getByRole('button', { name: 'Відкрити розмову' }).click(); await ready();
    await page.locator('#real-message').fill('Текст, який сервер не прийме'); refuseMessages = true;
    await page.locator('#real-message-form button').click(); await ready();
    const status = await page.locator('#real-status').innerText();
    assert.ok(status.includes('денний ліміт') && status.includes('Твій текст лишився у полі'), 'a refused write is not explained: ' + status);
    assert.equal(/email|код/i.test(status), false, 'a refused write is described as a sign-in problem: ' + status);
    assert.equal(await page.locator('#real-message').inputValue(), 'Текст, який сервер не прийме');
    assert.equal(await page.locator('#real-auth').isHidden(), true);
    await page.screenshot({ path: path.join(out, 'refused-write.png') });
    result.recoveryTexts = { pass: true };
  } catch (error) { result.recoveryTexts = { pass: false }; result.failures.push({ view: 'recovery-texts', error: error.message.split('\n')[0] }); await page.screenshot({ path: path.join(out, 'recovery-failure.png') }).catch(() => {}); }
  finally { await context.close(); }
}

let browser;
try {
  const executablePath = engine === 'chromium' ? process.env.SYNERA_CHROMIUM || undefined : undefined;
  browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, timeout: 30000, ...(executablePath ? { executablePath } : {}) });
  result.engine = { name: engine, version: browser.version() };
  for (const view of views) await journey(browser, view);
  await recoveryTexts(browser);
} catch (error) { result.failures.push({ stage: 'launch', error: error.message.split('\n')[0] }); }
finally {
  if (browser) await browser.close(); await new Promise(resolve => server.close(resolve));
  assert.equal(sha(await fs.readFile(path.join(root, 'release.json'))), releaseHash, 'Candidate changed during the run');
  const offScreen = result.observations.filter(row => row.afterAction && !row.statusVisible).length;
  result.summary = { observations: result.observations.length, actions: result.observations.filter(row => row.afterAction).length, feedbackOffScreen: offScreen, problems: result.problems.length, failures: result.failures.length };
  result.status = result.failures.length || result.problems.length || !result.observations.length ? 'NEEDS_REVIEW' : `PASS_DESKTOP_${engine.toUpperCase()}_SYNTHETIC`;
  await fs.writeFile(path.join(out, 'RESULT.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ status: result.status, ...result.summary, sample: result.problems.slice(0, 4).map(row => `${row.view}/${row.action}: ${row.problem}`), failures: result.failures }));
}
process.exit(result.status.startsWith('PASS_') ? 0 : 1);
