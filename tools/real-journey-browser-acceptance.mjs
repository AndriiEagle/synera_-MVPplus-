import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { A, B, C, O, config, fields, createFixture } from './fixtures/real-journey-fixture.mjs';
import { canonicalMaterialPayload, hashMaterialPayload } from '../web_launch/business-case.mjs';

const dir = 'artifacts/real-journey-20261003';
await fs.mkdir(dir, { recursive: true });
const db = createFixture(), errors = [], checks = {};
const server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { cwd: process.cwd(), env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
const base = await new Promise((resolve, reject) => {
  let text = ''; const timer = setTimeout(() => reject(Error(text || 'Local server unavailable')), 30000);
  server.stdout.on('data', chunk => { text += chunk; const found = text.match(/http:\/\/127\.0\.0\.1:\d+/); if (found) { clearTimeout(timer); resolve(found[0]); } });
  server.on('exit', code => reject(Error('Server exit ' + code)));
});
const browser = await chromium.launch({ headless: true, executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE || chromium.executablePath() });
const contexts = [];
async function pageFor(id, settings = config) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  contexts.push(context);
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  await page.route('**/config.json', route => route.fulfill({ json: settings }));
  await page.route('**/api/neon/**', async route => {
    const request = route.request(), url = new URL(request.url());
    const response = await db.fetchFor(id)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  await page.goto(base + '/real-journey.html');
  return page;
}
async function ready(page) { await page.waitForFunction(() => !document.body.dataset.realBusy); }
async function refresh(page) { await ready(page); await page.locator('#real-refresh').click(); await ready(page); }
async function openPanel(page, id) { const panel = page.locator('#' + id); if (!await panel.evaluate(node => node.open)) await panel.locator('summary').first().click(); }
async function selectPeer(page, name) { await ready(page); await openPanel(page, 'real-people-panel'); await page.locator('#real-people article').filter({ hasText: name }).getByRole('button').click(); await ready(page); await page.locator('#real-peer').filter({ hasText: name }).waitFor(); }
async function fillTerms(page, values) {
  await openPanel(page, 'real-editor');
  for (const [name, value] of Object.entries(values)) {
    const input = page.locator(`#real-terms-form [name="${name}"]`);
    if (await input.evaluate(node => node.tagName === 'SELECT')) await input.selectOption(value); else await input.fill(value);
  }
}
async function approve(page) {
  await page.locator('#real-approve-check').check();
  assert.equal(await page.locator('#real-approve-check').isChecked(), true, 'Reading checkbox must remain checked');
  assert.equal(await page.locator('#real-approve').isEnabled(), true);
  await page.locator('#real-approve').click(); await ready(page);
  await page.locator('#real-status').filter({ hasText: 'підтвердження збережено' }).waitFor();
}
let lastPage;
try {
  const closed = await pageFor(O, { ...config, realJourneyEnabled: false });
  await closed.locator('#real-blocked').waitFor({ state: 'visible' });
  assert.equal(db.requests.length, 0, 'Closed gate must contact no Auth/Data endpoint'); checks.closed_gate = true;
  const a = lastPage = await pageFor(A), b = await pageFor(B), o = await pageFor(O);
  await a.locator('#real-content-panel').waitFor({ state: 'visible', timeout: 5000 });
  await b.locator('#real-content-panel').waitFor({ state: 'visible' });
  await o.locator('#real-content-panel').waitFor({ state: 'visible' });
  await selectPeer(a, 'Тест Марія'); await fillTerms(a, fields());
  await a.locator('#real-terms-form button[type=submit]').click(); await ready(a);
  await a.locator('#real-terms-review').filter({ hasText: 'Один працюючий прототип' }).waitFor();
  const review = await a.locator('#real-terms-review').innerText();
  for (const text of ['Взаємний обмін', 'Потрібна', 'Спільна', 'письмове', fields().due_on]) assert.ok(review.includes(text), 'Readable material field missing: ' + text);
  assert.ok(!review.includes('не вказано'), 'Every required field shown before approval');
  await a.screenshot({ path: dir + '/01-shared-terms.png', fullPage: true }); checks.material_visible_before_approval = true;
  await a.locator('#real-terms-review').scrollIntoViewIfNeeded(); await a.screenshot({ path: dir + '/01-shared-terms-viewport.png' });
  await approve(a); await refresh(b); await selectPeer(b, 'Тест Андрій'); await approve(b);
  await refresh(a); await a.locator('#real-invite').waitFor({ state: 'visible' });
  assert.equal(db.approvals.length, 2); checks.two_independent_approvals = true;
  await refresh(o); assert.equal(await o.locator('#real-cases article').count(), 0); checks.outsider_no_case = true;
  const invitation = a.locator('#real-invite-form');
  await invitation.locator('[name=note]').fill('Обговорити один прототип і один екран');
  await invitation.locator('[name=proposed_at]').fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  await invitation.locator('[name=duration_minutes]').selectOption('30'); await invitation.locator('[name=meeting_place]').selectOption('Zürich');
  await invitation.getByRole('button').click(); await ready(a);
  await a.locator('#real-status').filter({ hasText: 'надіслано' }).waitFor();
  assert.equal(await a.locator('#real-meetings').getByRole('button', { name: 'Відкрити розмову' }).count(), 0);
  await refresh(b); await openPanel(b, 'real-meetings-panel'); await b.locator('#real-meetings').getByRole('button', { name: 'Прийняти', exact: true }).click(); await ready(b);
  await refresh(a);
  for (const page of [a, b]) { await openPanel(page, 'real-meetings-panel'); await page.locator('#real-meetings').getByRole('button', { name: 'Відкрити розмову' }).click(); await ready(page); }
  checks.recipient_acceptance_before_chat = true;
  const text = 'Прототип готовий до перегляду 💛 <script>literal</script>';
  await a.locator('#real-message').fill(text); await a.locator('#real-message-form button').click(); await ready(a);
  await refresh(b); await b.locator('#real-transcript').filter({ hasText: text }).waitFor();
  assert.equal(await b.locator('#real-transcript script').count(), 0); checks.unicode_text_and_no_html_execution = true;
  await b.screenshot({ path: dir + '/02-private-conversation.png', fullPage: true });
  await b.locator('#real-conversation').scrollIntoViewIfNeeded(); await b.screenshot({ path: dir + '/02-private-conversation-viewport.png' });
  const accepted = db.meetings[0];
  const second = { ...accepted, id: randomUUID(), recipient_id: C, note: 'Другий незалежний діалог', recipient_name: 'Тест Олег' };
  db.meetings.push(second); await refresh(a);
  await a.locator('#real-message').fill('Чернетка лише для першої людини');
  let release; db.controls.delayMessages = { id: accepted.id, wait: new Promise(resolve => { release = resolve; }) };
  const oldRead = a.waitForRequest(request => request.url().includes('/meeting_messages?meeting_id=eq.' + accepted.id));
  await a.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await oldRead;
  await openPanel(a, 'real-meetings-panel');
  await a.locator('#real-meetings article').filter({ hasText: second.note }).getByRole('button', { name: 'Відкрити розмову' }).click(); await ready(a);
  assert.equal(await a.locator('#real-message').inputValue(), ''); release(); db.controls.delayMessages = null;
  await a.waitForTimeout(150);
  assert.ok(!(await a.locator('#real-transcript').innerText()).includes(text)); checks.different_conversation_discards_draft_and_old_response = true;
  db.revoked.add(B); await refresh(b); await b.locator('#real-auth').waitFor({ state: 'visible' });
  assert.equal(await b.locator('#real-transcript').innerText(), ''); assert.equal(await b.locator('#real-message').inputValue(), ''); checks.expired_session_clears_private_state = true;
  db.revoked.delete(B);
  await refresh(a); await selectPeer(a, 'Тест Марія');
  await fillTerms(a, fields({ take_target: 'Два перевірених екрани' })); await a.locator('#real-terms-form button[type=submit]').click(); await ready(a);
  assert.equal(await a.locator('#real-approve-check').isChecked(), false); assert.equal(Object.keys((await new (await import('../web_launch/real-journey-client.mjs')).RealJourneyStore(config, db.fetchFor(A)).dashboard()).cases[0].approvals).length, 0);
  checks.revision_clears_both_approvals = true;
  const paid = canonicalMaterialPayload({ ...db.cases[0].material, mode: 'paid_service', components: ['paid_service'],
    outcomes: [{ receiver_id: A, capability_tag: 'design', target: 'Окремо погоджений бізнес-результат' }],
    compensation: { status: 'agreed_money', amount_minor: 123456, currency: 'CHF', invoice_required: true },
  });
  Object.assign(db.cases[0], { mode: paid.mode, material: paid, terms_hash: await hashMaterialPayload(paid), version: db.cases[0].version + 1 });
  await refresh(a);
  const moneyReview = await a.locator('#real-terms-review').innerText();
  for (const text of ['1234.56 CHF', 'Рахунок: так', 'Оплачувана послуга', 'Окремо погоджений бізнес-результат']) assert.ok(moneyReview.includes(text), 'Financial/material term hidden before approval: ' + text);
  checks.existing_paid_case_shows_amount_currency_invoice_and_outcomes = true;
  const audit = await new AxeBuilder({ page: a }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(audit.violations, []); checks.axe_violations = audit.violations.length;
  const layout = await a.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
  assert.ok(layout.width <= layout.viewport, JSON.stringify(layout)); checks.no_mobile_overflow = layout;
  const storage = await a.evaluate(async () => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), caches: await caches.keys(), databases: await indexedDB.databases() }));
  assert.ok(storage.local.every(key => /synera.*(atelier|theme|style)/i.test(key)), JSON.stringify(storage));
  assert.deepEqual({ ...storage, local: [] }, { local: [], session: [], caches: [], databases: [] }); checks.no_private_storage = storage;
  assert.deepEqual(errors, []); checks.page_errors = errors;
  await openPanel(a, 'real-meetings-panel');
  await a.locator('#real-meetings article').filter({ hasText: accepted.note }).getByRole('button', { name: 'Відкрити розмову' }).click(); await ready(a);
  let finishOld; db.controls.delayMessages = { id: accepted.id, wait: new Promise(resolve => { finishOld = resolve; }) };
  const pending = a.waitForRequest(request => request.url().includes('/meeting_messages?meeting_id=eq.' + accepted.id));
  await a.locator('#real-refresh').click(); await pending;
  await a.locator('#real-logout').click(); await a.locator('#real-auth').waitFor({ state: 'visible' });
  assert.equal(await a.locator('#real-transcript').innerText(), '');
  finishOld(); db.controls.delayMessages = null; await ready(a); await a.waitForTimeout(150);
  assert.equal(await a.locator('#real-content-panel').isVisible(), false);
  assert.equal(await a.locator('#real-transcript').innerText(), ''); checks.logout_interrupts_pending_read_without_private_reappearance = true;
  await fs.writeFile(dir + '/BROWSER_ACCEPTANCE.json', JSON.stringify({ status: 'PASS', scope: 'Actual local Chromium 390x844; actual client and handleNeon; Auth/Data persistence are isolated fixtures. Not live Neon, SQL/RLS/JWT, deployed product or physical Android evidence.', checks, requests: db.requests.length }, null, 2));
  console.log(JSON.stringify({ status: 'PASS', checks }));
} catch (error) {
  if (lastPage) await lastPage.screenshot({ path: dir + '/failure.png', fullPage: true });
  await fs.writeFile(dir + '/BROWSER_FAILURE.json', JSON.stringify({ error: error.message, checks, page_errors: errors }, null, 2)); throw error;
} finally { await browser.close(); server.kill(); }
