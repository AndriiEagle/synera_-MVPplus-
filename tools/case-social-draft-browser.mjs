// Real Chromium controls, synthetic account transport; never copies to the OS
// clipboard, publishes, uses OAuth or sends a provider request.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { A, B, config, fields } from './fixtures/real-journey-fixture.mjs';
import { createOutcomeFixture } from './fixtures/case-outcome-fixture.mjs';
import { RealJourneyStore, exchangeMaterial } from '../web_launch/real-journey-client.mjs';

const proof = 'artifacts/overnight-20261004', red = process.argv.includes('--red');
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Actual Chromium 390x844 private social draft controls; accounts and RPC are synthetic, not live JWT/SQL/LinkedIn or OS clipboard', checks: [] };
const db = createOutcomeFixture(), stores = {};
for (const id of [A, B]) { stores[id] = new RealJourneyStore({ ...config, caseOutcomesEnabled: true }, db.fetchFor(id)); await stores[id].dashboard(); }
let reviewed = await stores[A].saveTerms(B, exchangeMaterial(A, B, fields({ give_target: 'Мій прототип × Zürich 💛\n  <script>literal</script> / 向前', take_target: 'Приватна робота партнера' })));
await stores[A].approveTerms(B, reviewed); reviewed = await stores[B].approveTerms(A, reviewed);
await stores[A].sendInvitation(B, 'Local fixture', { proposed_at: new Date(Date.now() + 3600000).toISOString(), duration_minutes: 30, meeting_place: 'Zürich' });
const dashboard = await stores[B].dashboard(); await stores[B].respondInvitation(dashboard.meetings[0].id, 'accepted');
const peer = id => id === A ? B : A;
for (const [index, leg] of reviewed.material.trial.deliverables.entries()) {
  await stores[leg.giver_id].recordOutcome(peer(leg.giver_id), reviewed, { action: 'submit', index, intentId: crypto.randomUUID(), evidenceUri: 'PRIVATE EVIDENCE https://private.example/secret' });
  await stores[leg.receiver_id].recordOutcome(peer(leg.receiver_id), reviewed, { action: 'check', index, intentId: crypto.randomUUID(), scopeNotes: 'PRIVATE CHECKS' });
  if (index === 0) await stores[leg.receiver_id].recordOutcome(peer(leg.receiver_id), reviewed, { action: 'accept', index, intentId: crypto.randomUUID() });
}
const names = ['web_launch/real-journey-client.mjs', 'web_launch/real-journey.mjs', 'web_launch/real-journey.html', 'web_launch/session-value.mjs', 'tools/case-social-draft-browser.mjs'];
report.source_sha256 = Object.fromEntries(await Promise.all(names.map(async name => [name, createHash('sha256').update(await fs.readFile(name)).digest('hex')])));
const server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
let browser;
try {
  const base = await new Promise((resolve, reject) => {
    let output = ''; const timeout = setTimeout(() => reject(Error(output || 'Local server unavailable')), 20000);
    server.stdout.on('data', chunk => { output += chunk; const url = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]; if (url) { clearTimeout(timeout); resolve(url); } });
    server.once('exit', code => { clearTimeout(timeout); reject(Error('Local server exit ' + code)); });
  });
  browser = await chromium.launch({ headless: true, executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE || chromium.executablePath() });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage(), errors = [], external = [];
  page.setDefaultTimeout(8000); page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== base) { external.push(url.origin); await route.abort(); return; }
    if (url.pathname === '/config.json') { await route.fulfill({ json: { ...config, caseOutcomesEnabled: true } }); return; }
    if (url.pathname.startsWith('/api/neon/')) {
      const response = await db.fetchFor(A)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() }); return;
    }
    await route.continue();
  });
  const ready = () => page.waitForFunction(() => !document.body.dataset.realBusy);
  await page.goto(base + '/real-journey.html'); await page.waitForFunction(() => !document.getElementById('real-content').hidden);
  await page.getByRole('button', { name: 'Відкрити розмову', exact: true }).click(); await ready();
  await page.locator('#real-outcome-refresh').click(); await ready();
  const controls = page.locator('#real-social-controls'), output = page.locator('#real-social-output'), text = page.locator('#real-social-text');
  assert.equal(await controls.isHidden(), true); report.checks.push('one accepted leg exposes no social achievement');
  const last = reviewed.material.trial.deliverables[1]; await stores[last.receiver_id].recordOutcome(last.giver_id, reviewed, { action: 'accept', index: 1, intentId: crypto.randomUUID() });
  await page.locator('#real-outcome-refresh').click(); await ready(); assert.equal(await controls.isVisible(), true);
  await controls.locator('summary').click();
  assert.equal(await page.locator('#real-social-create').isDisabled(), true); assert.equal(await output.isHidden(), true);
  const consent = page.locator('#real-social-consent'), create = page.locator('#real-social-create');
  const createDraft = async () => { await consent.check(); await create.click(); await ready(); assert.equal(await output.isVisible(), true); };
  const eventsBefore = db.events.length; await createDraft();
  const own = reviewed.material.trial.deliverables.find(row => row.giver_id === A), other = reviewed.material.trial.deliverables.find(row => row.giver_id !== A);
  const value = await text.inputValue(); assert.ok(value.includes(own.target)); assert.equal(value.includes(other.target), false);
  for (const forbidden of ['PRIVATE EVIDENCE', 'PRIVATE CHECKS', 'private.example', A, B]) assert.equal(value.includes(forbidden), false);
  assert.equal(await controls.locator('script').count(), 0); assert.equal(db.events.length, eventsBefore);
  report.checks.push('explicit checkbox creates only actor contribution; no evidence, identity or outcome write');
  await page.locator('#real-social-wording').selectOption('linkedin'); assert.equal(await output.isHidden(), true); assert.equal(await consent.isChecked(), false);
  await createDraft(); assert.ok((await text.inputValue()).includes('LinkedIn'));
  const edited = (await text.inputValue()) + '\nМоє уточнення, без автоматичної публікації.'; await text.fill(edited);
  await page.locator('#real-social-select').click();
  assert.deepEqual(await text.evaluate(element => ({ start: element.selectionStart, end: element.selectionEnd, value: element.value })), { start: 0, end: edited.length, value: edited });
  report.checks.push('LinkedIn format requires new choice; edited text selected without OS clipboard or publication');
  let release, reached; const wait = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { reached = resolve; });
  db.controls.beforeOutcome = async body => { if (body.action === 'state') { reached(); await wait; } };
  await create.click(); await started; await consent.uncheck(); release(); db.controls.beforeOutcome = null; await ready();
  assert.equal(await output.isHidden(), true, 'Revoked draft consent allowed a late private draft'); assert.equal(await text.inputValue(), '');
  report.checks.push('withdrawing local draft consent cancels pending generation');
  await createDraft();
  const look = page.locator('[data-atelier-controls]');
  assert.equal(await page.locator('html').getAttribute('data-synera-atelier'), null);
  assert.deepEqual((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations, []); report.axe_current = 0;
  await output.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${proof}/case-social-draft-390x844.png` });
  await look.locator('summary').click(); await look.getByRole('button', { name: 'Atelier 2026', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('data-synera-atelier'), 'on');
  assert.deepEqual((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations, []); report.axe_atelier = 0;
  await look.getByRole('button', { name: 'Чинний', exact: true }).click(); await look.locator('summary').click();
  const layout = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth })); assert.ok(layout.width <= layout.viewport); report.no_overflow = layout;
  await stores[B].withdrawTerms(A, reviewed); await page.locator('#real-outcome-refresh').click(); await ready();
  assert.equal(await controls.isHidden(), true); assert.equal(await text.inputValue(), ''); report.checks.push('withdrawn case approval hides and clears draft');
  await stores[B].approveTerms(A, reviewed); await page.locator('#real-outcome-refresh').click(); await ready(); await createDraft();
  await page.locator('#real-logout').click(); await ready();
  assert.equal(await text.inputValue(), ''); assert.equal(await output.isHidden(), true); assert.equal(await controls.isHidden(), true);
  report.checks.push('logout purges social draft and permission');
  const storage = await page.evaluate(async () => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), caches: await caches.keys(), databases: await indexedDB.databases() }));
  assert.deepEqual(storage, { local: ['synera.atelier.preferences.v1'], session: [], caches: [], databases: [] }); report.no_private_storage = true;
  assert.deepEqual(errors, []); assert.deepEqual(external, []); report.page_errors = errors; report.external_requests = 0;
  report.status = 'PASS_LOCAL_CASE_SOCIAL_BROWSER';
} catch (error) { report.error = error.message; throw error; }
finally { if (browser) await browser.close(); server.kill(); await fs.writeFile(`${proof}/CASE_SOCIAL_BROWSER${red ? '_RED' : ''}.json`, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, checks: report.checks.length, external_requests: report.external_requests }));
