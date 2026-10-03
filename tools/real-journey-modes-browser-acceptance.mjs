import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { A, B, config, fields, createFixture } from './fixtures/real-journey-fixture.mjs';

const proof = 'artifacts/product-completion-20261003';
const modes = {
  exchange: { compensation_status: 'agreed_exchange' },
  paid_service: { compensation_status: 'agreed_money', amount: '125.50', currency: 'CHF', invoice: 'yes' },
  referral: { compensation_status: 'agreed_none' },
  hybrid: { compensation_status: 'agreed_exchange', components: ['exchange', 'referral'] },
  joint_project: { compensation_status: 'agreed_none' },
};
const receiptPath = `${proof}/MODES_BROWSER_ACCEPTANCE.json`;
const selectedModes = process.env.SYNERA_REAL_JOURNEY_MODE ? [process.env.SYNERA_REAL_JOURNEY_MODE] : Object.keys(modes);
if (selectedModes.some(mode => !Object.hasOwn(modes, mode))) throw new Error('Unknown real journey mode selection');
await fs.mkdir(proof, { recursive: true });
const server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { cwd: process.cwd(), env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
const base = await new Promise((resolve, reject) => {
  let output = ''; const timeout = setTimeout(() => reject(Error(output || 'Local server unavailable')), 30000);
  server.stdout.on('data', chunk => { output += chunk; const url = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]; if (url) { clearTimeout(timeout); resolve(url); } });
  server.once('exit', code => reject(Error('Local server exit ' + code)));
});
const browser = await chromium.launch({ headless: true, executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE || chromium.executablePath() });
const prior = process.env.SYNERA_REAL_JOURNEY_RESET === '1' ? {} : await fs.readFile(receiptPath, 'utf8').then(JSON.parse).catch(() => ({}));
const report = { status: 'PARTIAL', scope: 'Actual local Chromium 390x844 against isolated handleNeon fixtures. This is not live Neon, SQL/RLS/JWT, deployed product, public endpoint, or physical Android evidence.', modes: prior.modes || {}, provider_calls: 0, provider_usd: 0 };
const errors = [];
async function pageFor(db, id) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  await page.route('**/config.json', route => route.fulfill({ json: config }));
  await page.route('**/api/neon/**', async route => {
    const request = route.request(), url = new URL(request.url());
    const response = await db.fetchFor(id)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  await page.goto(base + '/real-journey.html'); await page.locator('#real-content-panel').waitFor({ state: 'visible' });
  return { page, context };
}
async function ready(page) { await page.waitForFunction(() => !document.body.dataset.realBusy); }
async function open(page, id) { const panel = page.locator('#' + id); if (!await panel.evaluate(node => node.open)) await panel.locator('summary').click(); }
async function refresh(page) { await ready(page); await page.locator('#real-refresh').click(); await ready(page); }
async function selectPeer(page, name) { await open(page, 'real-people-panel'); await page.locator('#real-people article').filter({ hasText: name }).getByRole('button', { name: 'Відкрити умови' }).click(); await ready(page); await page.locator('#real-peer').filter({ hasText: name }).waitFor(); }
async function fillTerms(page, mode, overrides = {}) {
  const data = { ...fields({ mode, ...modes[mode], ...overrides }) };
  await open(page, 'real-editor');
  for (const [name, value] of Object.entries(data)) {
    if (name === 'components') continue;
    const input = page.locator(`#real-terms-form [name="${name}"]`);
    if (await input.evaluate(node => node.tagName === 'SELECT')) await input.selectOption(String(value)); else await input.fill(String(value));
  }
  for (const component of data.components || []) await page.locator(`#real-terms-form [name="components"][value="${component}"]`).check();
  await page.locator('#real-terms-form button[type=submit]').click(); await ready(page);
  await page.locator('#real-terms-review').waitFor({ state: 'visible' });
}
async function approve(page) { await page.locator('#real-approve-check').check(); assert.equal(await page.locator('#real-approve').isEnabled(), true); await page.locator('#real-approve').click(); await ready(page); }
async function inviteAndChat(a, b, mode) {
  await refresh(a); await a.locator('#real-invite').waitFor({ state: 'visible' });
  const form = a.locator('#real-invite-form'); await form.locator('[name=note]').fill(`Розмова про ${mode}`); await form.locator('[name=proposed_at]').fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16)); await form.locator('[name=duration_minutes]').selectOption('20'); await form.locator('[name=meeting_place]').selectOption('Онлайн'); await form.getByRole('button').click(); await ready(a);
  await refresh(b); await open(b, 'real-meetings-panel'); await b.locator('#real-meetings').getByRole('button', { name: 'Прийняти', exact: true }).click(); await ready(b);
  for (const page of [a, b]) { await refresh(page); await open(page, 'real-meetings-panel'); await page.locator('#real-meetings').getByRole('button', { name: 'Відкрити розмову' }).click(); await ready(page); }
  const text = `Режим ${mode}: конкретний крок 💛 <script>literal</script>`;
  await a.locator('#real-message').fill(text); await a.locator('#real-message-form button').click(); await ready(a); await refresh(b); await b.locator('#real-transcript').filter({ hasText: text }).waitFor();
  assert.equal(await b.locator('#real-transcript script').count(), 0); return text;
}
try {
  for (const mode of selectedModes) {
    const db = createFixture(), { page: a, context: aContext } = await pageFor(db, A), { page: b, context: bContext } = await pageFor(db, B);
    const record = report.modes[mode] = { viewport: '390x844', profile_capability: mode === 'exchange' ? 'fixture profiles declare reciprocal exchange capabilities' : 'fixture profiles declare exchange only; no mode-specific match score was invented', saved: false, reviewed: false, independently_approved: false, invitation_accepted: false, private_message: false };
    try {
      await selectPeer(a, 'Тест Марія'); await fillTerms(a, mode); record.saved = true;
      const review = await a.locator('#real-terms-review').innerText(); record.review_text = review; assert.ok(review.includes(mode === 'joint_project' ? 'Спільний проєкт' : mode === 'paid_service' ? 'Оплачувана послуга' : mode === 'referral' ? 'Рекомендація' : mode === 'hybrid' ? 'Взаємний обмін + Рекомендація' : 'Взаємний обмін'));
      if (mode === 'paid_service') for (const term of ['125.50 CHF', 'Рахунок: так']) assert.ok(review.includes(term));
      record.reviewed = true; await a.screenshot({ path: `${proof}/mode-${mode}-review-390x844.png` });
      await approve(a); await refresh(b); await selectPeer(b, 'Тест Андрій'); await approve(b); assert.equal(db.approvals.length, 2); record.independently_approved = true;
      const message = await inviteAndChat(a, b, mode); record.invitation_accepted = true; record.private_message = true; record.message = message;
      await b.screenshot({ path: `${proof}/mode-${mode}-chat-390x844.png` });
      if (mode === 'joint_project') {
        await selectPeer(a, 'Тест Марія'); await fillTerms(a, mode, { give_target: 'Новий спільний прототип для перевірки' }); assert.equal(await a.locator('#real-approve-check').isChecked(), false); assert.equal(await a.locator('#real-invite').isHidden(), true); record.revision_clears_old_consent_and_blocks_invitation = true;
      }
      const audit = await new AxeBuilder({ page: a }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); assert.deepEqual(audit.violations, []); record.axe_violations = 0;
      const layout = await a.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth })); assert.ok(layout.width <= layout.viewport, JSON.stringify(layout)); record.no_overflow = layout;
      const storage = await a.evaluate(async () => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), caches: await caches.keys(), databases: await indexedDB.databases() })); assert.deepEqual(storage, { local: [], session: [], caches: [], databases: [] }); record.private_storage = 'empty';
      record.status = 'PASS';
    } finally { await aContext.close(); await bContext.close(); }
  }
  assert.deepEqual(errors, []); report.page_errors = errors; report.status = Object.keys(modes).every(mode => report.modes[mode]?.status === 'PASS') ? 'PASS' : 'PARTIAL';
  await fs.writeFile(receiptPath, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
} catch (error) {
  report.status = 'FAIL'; report.error = error.message; report.page_errors = errors; await fs.writeFile(receiptPath, JSON.stringify(report, null, 2)); throw error;
} finally { await browser.close(); server.kill(); }
