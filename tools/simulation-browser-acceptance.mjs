import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createSimulationServer } from './simulation-server.mjs';
import { createScreenshotRunner, executeDecision } from './simulation-runner.mjs';

const output = process.env.SYNERA_SIMULATION_EVIDENCE || 'artifacts/android-simulation-20261020/browser';
await fs.mkdir(output, { recursive: true });
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'synera-simulation-browser-'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const checks = {}, errors = [], requests = [];
let actorRun, releaseActor;
const app = await createSimulationServer({ directory, runner: async run => {
  actorRun = run;
  await new Promise(resolve => { releaseActor = resolve; });
} });
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE || chromium.executablePath() });
const ownerContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const owner = await ownerContext.newPage();
owner.on('pageerror', error => errors.push(error.message));
const revision = page => page.locator('body').getAttribute('data-revision').then(Number);
async function changed(page, action) {
  const before = await revision(page);
  await action();
  await page.waitForFunction(value => Number(document.body.dataset.revision) > value, before);
}
async function refresh(page) {
  const response = page.waitForResponse(r => r.url().includes('/api/sim/session?'));
  await page.locator('#sim-refresh').click(); await response;
  await page.waitForFunction(() => !document.getElementById('sim-refresh').disabled);
}
async function stop() {
  const response = owner.waitForResponse(r => r.url().endsWith('/api/sim/stop'));
  await owner.locator('#sim-stop').click();
  assert.equal((await response).status(), 200);
}
try {
  await owner.goto(app.url);
  await owner.waitForFunction(() => document.body.dataset.revision !== undefined);
  assert.equal(new URL(owner.url()).hash, '');
  assert.equal(await owner.locator('#sim-person option').count(), 20);
  checks.private_login_20_fictional_people_key_removed = true;
  await owner.locator('#sim-message').fill('Чернетка <script>no execution</script>');
  await owner.locator('#sim-message').focus();
  await owner.waitForResponse(r => r.url().includes('/api/sim/session?'));
  assert.equal(await owner.locator('#sim-message').inputValue(), 'Чернетка <script>no execution</script>');
  assert.equal(await owner.evaluate(() => document.activeElement.id), 'sim-message');
  await owner.reload();
  await owner.waitForFunction(() => document.body.dataset.revision !== undefined);
  assert.match(await owner.locator('#sim-message').inputValue(), /Чернетка/);
  checks.poll_and_reload_preserve_draft_and_focus = true;
  await changed(owner, () => owner.locator('#sim-send').click());
  assert.equal(await owner.locator('#sim-messages script').count(), 0);
  await owner.locator('#sim-terms-panel > summary').click();
  await owner.locator('[name=mode]').selectOption('paid_service');
  const due = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  for (const [field, value] of Object.entries({ target: 'Три конкретні покращення сторінки', criteria: 'Три дії з поясненням користі', amount: '120.50', due })) {
    await owner.locator(`#sim-terms [name=${field}]`).fill(value);
  }
  assert.equal(await owner.locator('#sim-reciprocal').isHidden(), true);
  await changed(owner, () => owner.locator('#sim-propose').click());
  await changed(owner, () => owner.locator('#sim-approve').click());
  await owner.locator('#sim-consent').check(); await owner.locator('#sim-run').click();
  await owner.waitForResponse(r => r.url().includes('/api/sim/session?'));
  assert.ok(actorRun);
  const actorContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const token = actorRun.cookie();
  await actorContext.addCookies([{ name: 'synera_sim', value: token, url: app.origin + '/api/sim/', httpOnly: true, sameSite: 'Strict' }]);
  const actor = await actorContext.newPage();
  actor.on('pageerror', error => errors.push(error.message));
  await actor.goto(app.origin + '/simulation.html?person=bot-mira');
  await actor.waitForFunction(() => document.body.dataset.revision !== undefined);
  assert.equal(await actor.locator('#sim-person option').count(), 1);
  const action = async (decision, selector) => {
    await actor.locator(selector).scrollIntoViewIfNeeded();
    const before = await actor.screenshot();
    actorRun.authorizeFrame(token, { revision: await revision(actor), evidence: { syntheticController: true, screenshotSha256: hash(before) } });
    await changed(actor, () => executeDecision(actor, decision));
  };
  await action({ action: 'approve' }, '#sim-approve');
  const panel = actor.locator('[data-deliverable-index="0"]');
  await panel.locator('textarea[name=output]').scrollIntoViewIfNeeded();
  // The fixture controls UI; it is not a provider or a vision-capability claim.
  await action({ action: 'deliver', index: 0, text: '1. Один чіткий заголовок. 2. Приклад результату. 3. Одна наступна дія.' }, '[data-deliverable-index="0"] textarea[name=output]');
  assert.equal(await panel.locator('[data-action=accept]').isVisible(), false);
  await refresh(owner);
  const ownerPanel = owner.locator('[data-deliverable-index="0"]');
  assert.equal(await ownerPanel.locator('[data-action=accept]').isEnabled(), false);
  await ownerPanel.locator('textarea[name=checkNotes]').fill('Прочитано всі три дії; кожна відповідає погодженим критеріям.');
  await changed(owner, () => ownerPanel.locator('[data-action=check]').click());
  await changed(owner, () => ownerPanel.locator('[data-action=accept]').click());
  assert.match(await ownerPanel.innerText(), /Отримувач прийняв/);
  const exported = await ownerContext.request.get(app.origin + '/api/sim/export?person=bot-mira');
  const state = await exported.json();
  assert.equal(state.customerEvidence, false);
  assert.equal(state.state.paymentVerified, false);
  assert.equal(state.state.case.material.trial.deliverables.length, 1);
  checks.actual_http_two_actor_paid_cycle_receiver_only = true;
  checks.synthetic_frame_receipts_on_actor_events = state.state.events.filter(e => e.actor === 'bot-mira').every(e => e.evidence?.syntheticController);

  await stop();
  assert.equal(actorRun.valid(), false);
  releaseActor();
  await actorContext.close();
  checks.explicit_stop_invalidates_actor = true;
  for (const width of [320, 390, 1440]) {
    await owner.setViewportSize({ width, height: 844 });
    assert.equal(await owner.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `overflow ${width}`);
    await owner.screenshot({ path: path.join(output, `simulation-${width}.png`), fullPage: true });
  }
  await owner.setViewportSize({ width: 390, height: 844 });
  await owner.evaluate(() => {
    const nodes = [...document.querySelectorAll('body *')].filter(n => n.checkVisibility() &&
      (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(n.tagName) || [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())));
    const sizes = nodes.map(n => parseFloat(getComputedStyle(n).fontSize));
    nodes.forEach((n, i) => { n.style.fontSize = `${sizes[i] * 2}px`; });
  });
  assert.equal(await owner.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, '200% text');
  await owner.screenshot({ path: path.join(output, 'simulation-390-text200.png'), fullPage: true });
  const a11y = await new AxeBuilder({ page: owner }).analyze();
  assert.deepEqual(a11y.violations.filter(v => ['serious', 'critical'].includes(v.impact)), []);
  checks.widths_and_double_text_no_horizontal_overflow = true;
  checks.axe_no_serious_or_critical = true;
  await owner.reload(); await owner.waitForFunction(() => document.body.dataset.revision !== undefined);
  await owner.evaluate(() => navigator.serviceWorker.ready);
  await ownerContext.setOffline(true);
  await owner.reload();
  await owner.locator('#sim-message').waitFor();
  assert.match(await owner.locator('#sim-status').innerText(), /посилання|офлайн|fetch|Failed/i);
  assert.equal(await owner.locator('#sim-send').isEnabled(), false);
  await ownerContext.setOffline(false);
  checks.offline_shell_loads_but_no_fake_ai_or_private_cache = true;
  const cached = await owner.evaluate(async () => (await Promise.all((await caches.keys()).map(async name =>
    (await (await caches.open(name)).keys()).map(r => new URL(r.url).pathname)))).flat());
  assert.equal(cached.some(p => p.startsWith('/api/')), false);

  // Actual PNG capture and stale-response guard, with explicitly injected local decision.
  let pendingModel, captured;
  const screenshotRunner = createScreenshotRunner({ maxSteps: 1,
    executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE || chromium.executablePath(),
    preflight: async () => ({ syntheticTest: true }), model: async requestFile => {
      const request = JSON.parse(await fs.readFile(requestFile, 'utf8'));
      const bytes = await fs.readFile(request.screenshot);
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(hash(bytes), request.screenshotSha256);
      requests.push({ screenshotSha256: hash(bytes), actualPng: true, providerCalled: false });
      captured();
      await new Promise(resolve => { pendingModel = resolve; });
      return { decision: { action: 'wait', revision: (await actorRun.snapshot()).revision }, receipt: { syntheticTest: true } };
    } });
  await owner.reload(); await owner.waitForFunction(() => document.body.dataset.revision !== undefined);
  await owner.locator('#sim-consent').check(); await owner.locator('#sim-run').click();
  await owner.waitForResponse(r => r.url().includes('/api/sim/session?'));
  const gotCapture = new Promise(resolve => { captured = resolve; });
  const run = screenshotRunner(actorRun);
  await Promise.race([gotCapture, run.then(() => { throw Error('Runner ended before capture'); })]);
  await stop();
  pendingModel(); await run; releaseActor();
  const decisions = await fs.readdir(path.join(directory, 'decisions'));
  const record = JSON.parse(await fs.readFile(path.join(directory, 'decisions', decisions[0], 'result.json')));
  assert.equal(record.status, 'STALE_OR_STOPPED');
  checks.real_png_runner_stop_rejects_delayed_synthetic_decision = true;
  assert.deepEqual(errors, []);
  checks.no_browser_exceptions = true;
  await fs.writeFile(path.join(output, 'acceptance.json'), JSON.stringify({
    at: new Date().toISOString(), runtime: process.version, checks, requests,
    evidence: 'actual local HTTP and Chromium; deterministic actor/model injection',
    liveProvider: 'NOT RUN', physicalAndroid: 'NOT RUN', privateHTTPS: 'NOT RUN',
  }, null, 2));
  console.log(JSON.stringify({ checks, providerCalls: 0, output }, null, 2));
} finally {
  releaseActor?.();
  await browser.close(); await app.close();
  if (path.dirname(directory) === os.tmpdir() && path.basename(directory).startsWith('synera-simulation-browser-')) await fs.rm(directory, { recursive: true });
}
