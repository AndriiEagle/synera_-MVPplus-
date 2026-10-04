// Actual local Chromium file selection, readback and clear; no Auth/RPC fixture.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { unpackArchive, packArchive } from '../web_launch/archive-codec.mjs';

const proof = 'artifacts/overnight-20261004', mutation = process.argv.includes('--mutation');
const receiptPath = `${proof}/OUTCOME_ARCHIVE_${mutation ? 'MUTATION' : 'BROWSER'}.json`;
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Local Chromium 390x844 file viewer; existing downloads contain synthetic participant attestations, not live server proof', checks: [] };
const sourceNames = ['web_launch/outcome-archive.html', 'web_launch/outcome-archive.mjs', 'web_launch/outcome-archive-ui.mjs', 'web_launch/real-journey-client.mjs', 'web_launch/real-journey.html', 'web_launch/archive-codec.mjs', 'tools/outcome-archive-browser.mjs'];
report.source_sha256 = Object.fromEntries(await Promise.all(sourceNames.map(async name => [name, createHash('sha256').update(await fs.readFile(name)).digest('hex')])));
const server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
let browser;
try {
  const base = await new Promise((resolve, reject) => {
    let text = ''; const timeout = setTimeout(() => reject(Error(text || 'Local server unavailable')), 20000);
    server.stdout.on('data', chunk => { text += chunk; const url = text.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]; if (url) { clearTimeout(timeout); resolve(url); } });
    server.once('exit', code => { clearTimeout(timeout); reject(Error('Local server exit ' + code)); });
  });
  browser = await chromium.launch({ headless: true, executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE || chromium.executablePath() });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage(), errors = [], forbidden = [];
  page.setDefaultTimeout(8000); page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== base || url.pathname.startsWith('/api/') || url.pathname === '/config.json') {
      forbidden.push(url.pathname); await route.abort(); return;
    }
    if (mutation && url.pathname === '/outcome-archive-ui.mjs') {
      const original = await fs.readFile('web_launch/outcome-archive-ui.mjs', 'utf8'), marker = 'if (ticket !== generation) return;';
      assert.equal(original.split(marker).length, 2);
      await route.fulfill({ contentType: 'text/javascript', body: original.replace(marker, '') }); return;
    }
    await route.continue();
  });
  await page.goto(base + '/outcome-archive.html');
  await page.waitForFunction(() => document.querySelector('[data-atelier-controls]'));
  assert.equal(await page.locator('html').getAttribute('data-synera-atelier'), null);
  assert.equal(await page.locator('#archive-result').isHidden(), true);
  const choose = async buffer => {
    await page.locator('#archive-file').setInputFiles({ name: 'private-outcome.json', mimeType: 'application/json', buffer });
    await page.waitForFunction(() => document.getElementById('archive-status').textContent !== 'Читаю локальну копію…');
  };
  for (const kind of ['gzip', 'plain']) {
    const file = `${proof}/outcome-export-${kind}.json`, bytes = await fs.readFile(file);
    const value = JSON.parse(await unpackArchive(bytes.toString('utf8')));
    await choose(bytes);
    assert.equal(await page.locator('#archive-result').isVisible(), true);
    assert.deepEqual(JSON.parse(await page.locator('#archive-exact').textContent()), value);
    assert.equal(await page.locator('#archive-events>li').count(), 6);
    assert.equal(await page.locator('#archive-cards article').count(), 2);
    assert.equal(await page.locator('#archive-cards dd').filter({ hasText: '<script>literal</script>' }).count(), 2);
    assert.equal(await page.locator('#archive-result script').count(), 0);
    assert.ok((await page.locator('#archive-authority').innerText()).includes('не перевірені сервером'));
    assert.equal(await page.locator('#archive-result button,#archive-result input').count(), 0, 'File viewer exposed an approval/write control');
    assert.equal(await page.locator('#archive-file').inputValue(), '');
    report.checks.push(`${kind}: exact private file readback, six events, literal text, no approval controls`);
  }
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(audit.violations, []); report.axe_current = 0;
  await page.locator('#archive-cards').scrollIntoViewIfNeeded();
  if (!mutation) await page.screenshot({ path: `${proof}/outcome-archive-390x844.png` });
  const look = page.locator('[data-atelier-controls]'); await look.locator('summary').click();
  await look.getByRole('button', { name: 'Atelier 2026', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('data-synera-atelier'), 'on');
  assert.deepEqual((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations, []); report.axe_atelier = 0;
  await look.getByRole('button', { name: 'Чинний', exact: true }).click(); await look.locator('summary').click();
  assert.equal(await page.locator('html').getAttribute('data-synera-atelier'), null);
  const layout = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
  assert.ok(layout.width <= layout.viewport); report.no_overflow = layout;
  // A corrupt next file must clear the previous private material immediately.
  await choose(Buffer.from('{"unsupported":true}'));
  assert.equal(await page.locator('#archive-result').isHidden(), true);
  assert.equal(await page.locator('#archive-exact').textContent(), ''); report.checks.push('invalid next file clears earlier private copy');
  const original = JSON.parse(await unpackArchive(await fs.readFile(`${proof}/outcome-export-plain.json`, 'utf8')));
  original.outcome.events = []; original.outcome.outcome_confirmed = false;
  for (const row of original.outcome.deliverables) Object.assign(row, { phase: 'pending', evidence_uri: null, scope_notes: null, reason: null });
  await choose(Buffer.from((await packArchive(JSON.stringify(original))).json));
  assert.ok((await page.locator('#archive-summary').innerText()).includes('ще не завершений'));
  assert.equal(await page.locator('#archive-events>li').count(), 0); report.checks.push('pending outcome stays pending');
  await page.locator('#archive-clear').click();
  assert.equal(await page.locator('#archive-exact').textContent(), ''); assert.equal(await page.locator('#archive-result').isHidden(), true);
  // Pause a real archive digest, clear the view, then finish decoding.
  await page.evaluate(() => {
    const digest = crypto.subtle.digest.bind(crypto.subtle); let calls = 0;
    crypto.subtle.digest = async (...args) => {
      calls++;
      if (calls === 1) { window.__archiveWaiting = true; await new Promise(resolve => { window.__archiveRelease = resolve; }); }
      const result = await digest(...args); if (calls === 2) window.__archiveFinished = true; return result;
    };
  });
  await page.locator('#archive-file').setInputFiles({ name: 'delayed.json', mimeType: 'application/json', buffer: await fs.readFile(`${proof}/outcome-export-plain.json`) });
  await page.waitForFunction(() => window.__archiveWaiting === true);
  await page.locator('#archive-clear').click(); await page.evaluate(() => window.__archiveRelease());
  await page.waitForFunction(() => window.__archiveFinished === true);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.locator('#archive-result').isHidden(), true, 'Cleared archive returned after pending decode');
  assert.equal(await page.locator('#archive-exact').textContent(), ''); report.checks.push('clear cancels delayed decode');
  const storage = await page.evaluate(async () => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), caches: await caches.keys(), databases: await indexedDB.databases() }));
  assert.deepEqual(storage, { local: ['synera.atelier.preferences.v1'], session: [], caches: [], databases: [] });
  report.no_private_storage = true; report.stored_design_preferences_only = true;
  assert.deepEqual(forbidden, []); assert.deepEqual(errors, []); report.api_or_external_requests = 0; report.page_errors = errors;
  report.status = 'PASS_LOCAL_OUTCOME_ARCHIVE_BROWSER';
} catch (error) { report.error = error.message; throw error; }
finally { if (browser) await browser.close(); server.kill(); await fs.writeFile(receiptPath, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, checks: report.checks.length, api_or_external_requests: report.api_or_external_requests }));
