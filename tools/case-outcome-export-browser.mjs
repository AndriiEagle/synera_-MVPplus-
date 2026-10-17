// Actual file downloads from local Chromium; database state is an explicit
// synthetic fixture prepared through the client, not live-account evidence.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { A, B, config, fields } from './fixtures/real-journey-fixture.mjs';
import { createOutcomeFixture } from './fixtures/case-outcome-fixture.mjs';
import { RealJourneyStore, exchangeMaterial } from '../web_launch/real-journey-client.mjs';
import { unpackArchive } from '../web_launch/archive-codec.mjs';

const proof = 'artifacts/overnight-20261004';
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Actual Chromium 390x844 downloads and decoded readback; case/meeting/outcomes are seeded synthetic transport, not SQL/JWT/live accounts', downloads: [] };
const db = createOutcomeFixture(), stores = {};
for (const id of [A, B]) { stores[id] = new RealJourneyStore({ ...config, caseOutcomesEnabled: true }, db.fetchFor(id)); await stores[id].dashboard(); }
let reviewed = await stores[A].saveTerms(B, exchangeMaterial(A, B, fields()));
await stores[A].approveTerms(B, reviewed); reviewed = await stores[B].approveTerms(A, reviewed);
const dashboard = await stores[A].sendInvitation(B, 'Тестове джерело для приватного експорту', { proposed_at: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 20, meeting_place: 'Онлайн' });
await stores[B].respondInvitation(dashboard.meetings[0].id, 'accepted');
for (const [index, leg] of reviewed.material.trial.deliverables.entries()) {
  const peer = id => id === A ? B : A;
  await stores[leg.giver_id].recordOutcome(peer(leg.giver_id), reviewed, { action: 'submit', index, intentId: crypto.randomUUID(), evidenceUri: 'Точний доказ × Zürich 💛\n  <script>literal</script> / 向前' });
  await stores[leg.receiver_id].recordOutcome(peer(leg.receiver_id), reviewed, { action: 'check', index, intentId: crypto.randomUUID(), scopeNotes: 'Критерій перевірено; це підтвердження учасника' });
  await stores[leg.receiver_id].recordOutcome(peer(leg.receiver_id), reviewed, { action: 'accept', index, intentId: crypto.randomUUID() });
}
const server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
let browser;
try {
  const base = await new Promise((resolve, reject) => {
    let text = ''; const timeout = setTimeout(() => reject(Error(text || 'Local server unavailable')), 20000);
    server.stdout.on('data', chunk => { text += chunk; const url = text.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]; if (url) { clearTimeout(timeout); resolve(url); } });
    server.once('exit', code => { clearTimeout(timeout); reject(Error('Local server exit ' + code)); });
  });
  browser = await chromium.launch({ headless: true, executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE || chromium.executablePath() });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block', acceptDownloads: true });
  const page = await context.newPage(), errors = [], downloads = [];
  page.setDefaultTimeout(8000); page.on('pageerror', error => errors.push(error.message)); page.on('download', value => downloads.push(value));
  await page.route('**/config.json', route => route.fulfill({ json: { ...config, caseOutcomesEnabled: true } }));
  await page.route('**/api/neon/**', async route => {
    const request = route.request(), url = new URL(request.url());
    const response = await db.fetchFor(A)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  const ready = () => page.waitForFunction(() => !document.body.dataset.realBusy);
  await page.goto(base + '/real-journey.html'); await page.locator('#real-content-panel').waitFor({ state: 'visible' });
  await page.locator('#real-meetings').getByRole('button', { name: 'Відкрити розмову' }).click(); await ready();
  await page.locator('#real-outcome-refresh').click(); await ready();
  const controls = page.locator('#real-outcome-export-controls'); await controls.locator('summary').click();
  for (const compress of [true, false]) {
    await page.locator('#real-outcome-compress').setChecked(compress);
    const next = page.waitForEvent('download'); await page.locator('#real-outcome-export').click(); const download = await next; await ready();
    assert.equal(await download.failure(), null); assert.match(download.suggestedFilename(), /^synera-outcome-[A-Za-z0-9_-]+-v1\.json$/);
    const file = `${proof}/outcome-export-${compress ? 'gzip' : 'plain'}.json`; await download.saveAs(file);
    const bytes = await fs.readFile(file), envelope = JSON.parse(bytes.toString('utf8')), decoded = await unpackArchive(bytes.toString('utf8')), value = JSON.parse(decoded);
    assert.equal(envelope.encoding, compress ? 'gzip-base64' : 'utf8-base64');
    assert.equal(value.authority, 'local_copy_not_live_server_state'); assert.equal(value.proof_scope, 'participant_attestation');
    assert.deepEqual(value.case.material, reviewed.material); assert.equal(value.case.terms_hash, reviewed.termsHash); assert.equal(value.outcome.outcome_confirmed, true);
    assert.deepEqual(value.outcome.events, db.events.map(({ case_id, ...event }) => event));
    assert.ok(value.outcome.events[0].payload.evidenceUri.includes('\n  <script>literal</script> / 向前'));
    report.downloads.push({ file, encoding: envelope.encoding, file_bytes: bytes.length, original_utf8_bytes: new TextEncoder().encode(decoded).length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  assert.equal(downloads.length, 2); report.explicit_plain_and_gzip_downloads = true;
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); assert.deepEqual(audit.violations, []); report.axe_violations = 0;
  const layout = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth })); assert.ok(layout.width <= layout.viewport); report.no_overflow = layout;
  await controls.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${proof}/outcome-export-390x844.png` });
  let release, reached; const wait = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { reached = resolve; });
  db.controls.beforeOutcome = async body => { if (body.action === 'state') { reached(); await wait; } };
  await page.locator('#real-outcome-export').click(); await started;
  await page.locator('#real-logout').click(); release(); db.controls.beforeOutcome = null; await ready();
  assert.equal(downloads.length, 2, 'Logout allowed a queued private archive download');
  assert.equal(await controls.isHidden(), true); assert.equal(await page.locator('#real-outcome-cards').innerText(), '');
  report.logout_cancels_pending_download = true;
  const storage = await page.evaluate(async () => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), caches: await caches.keys(), databases: await indexedDB.databases() }));
  assert.deepEqual(storage, { local: [], session: [], caches: [], databases: [] }); report.no_private_storage = true;
  assert.deepEqual(errors, []); report.page_errors = errors;
  const names = ['web_launch/real-journey-client.mjs', 'web_launch/real-journey.mjs', 'web_launch/real-journey.html', 'web_launch/archive-codec.mjs', 'tools/fixtures/case-outcome-fixture.mjs', 'tools/case-outcome-export-browser.mjs'];
  report.source_sha256 = Object.fromEntries(await Promise.all(names.map(async name => [name, createHash('sha256').update(await fs.readFile(name)).digest('hex')])));
  report.status = 'PASS_LOCAL_OUTCOME_EXPORT_BROWSER';
} catch (error) { report.error = error.message; throw error; }
finally { if (browser) await browser.close(); server.kill(); await fs.writeFile(`${proof}/CASE_OUTCOME_EXPORT_BROWSER.json`, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, downloads: report.downloads, logout_cancels_pending_download: report.logout_cancels_pending_download }));
