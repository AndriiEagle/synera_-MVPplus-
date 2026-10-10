// Adversarial actual-layout probe: keep typing while a send is pending, then a long refusal arrives.
import { chromium, webkit } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createMessageFixture } from './fixtures/message-intent-fixture.mjs';
import { A, B, config } from './fixtures/real-journey-fixture.mjs';
const arg = name => process.argv.find(value => value.startsWith('--' + name + '='))?.slice(name.length + 3);
assert.ok(arg('candidate') && arg('out'));
const root = path.resolve(arg('candidate')), out = path.resolve(arg('out')), engine = arg('engine') || 'webkit';
const release = createHash('sha256').update(await fs.readFile(path.join(root, 'release.json'))).digest('hex');
await fs.mkdir(out, { recursive: true });
const result = { status: 'NOT_ACCEPTED', candidate: path.basename(root), release_sha256: release, engine,
  scope: 'Actual desktop browser geometry, fixture accounts, 320x568, German/English, Current/Atelier; not physical keyboard or live server.', observations: [], failures: [] };
const server = http.createServer(async (request, response) => {
  try {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname)); assert.ok(file.startsWith(root + path.sep));
    const type = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(file)] || 'application/octet-stream';
    response.writeHead(200, { 'content-type': type }).end(await fs.readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, ...(engine === 'chromium' && process.env.SYNERA_CHROMIUM ? { executablePath: process.env.SYNERA_CHROMIUM } : {}) });
  result.engine_version = browser.version();
  for (const atelier of [false, true]) {
    const db = createMessageFixture(), meeting = '44444444-4444-4444-8444-444444444444';
    db.meetings.push({ id: meeting, sender_id: A, recipient_id: B, status: 'accepted', created_at: new Date().toISOString(),
      proposed_at: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 20, meeting_place: 'Online' });
    const context = await browser.newContext({ viewport: { width: 320, height: 568 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    await context.route('**/config.json', route => route.fulfill({ json: config }));
    let hold = null;
    await context.route('**/api/neon/**', async route => {
      const request = route.request(), url = new URL(request.url()), method = request.method();
      if (hold && method === 'POST' && url.pathname.endsWith('/meeting_messages')) {
        const pending = hold; hold = null; pending.reached(); await pending.wait;
        await route.fulfill({ status: 400, json: { error: 'synthetic refusal' } }); return;
      }
      const response = await db.fetchFor(A)(url.pathname + url.search, { method, headers: request.headers(), ...(method === 'GET' ? {} : { body: request.postData() }) });
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
    });
    const page = await context.newPage(); page.setDefaultTimeout(12000);
    try {
      await page.goto(base + '/real-journey.html?lang=de'); await page.locator('#real-content-panel').waitFor({ state: 'visible' });
      await page.waitForFunction(() => !document.body.dataset.realBusy);
      if (atelier) { await page.locator('[data-atelier-controls] > summary').click(); await page.locator('.atelier-mode-choice button').nth(1).click(); }
      // A language change cannot remount the review or clear independent consent controls.
      await page.evaluate(() => { window.__consents = ['real-approve-check', 'real-social-consent'].map(id => document.getElementById(id)); for (const node of window.__consents) node.checked = true; });
      for (const code of ['en', 'de']) await page.locator('#real-language').selectOption(code);
      assert.equal(await page.evaluate(() => window.__consents.every(node => node === document.getElementById(node.id) && node.checked)), true);
      const panel = page.locator('#real-meetings-panel'); if (!await panel.evaluate(node => node.open)) await panel.locator('summary').first().click();
      await page.locator('#real-meetings article button').last().click(); await page.waitForFunction(() => !document.body.dataset.realBusy);
      const rects = () => page.evaluate(() => {
        const status = document.getElementById('real-status').getBoundingClientRect(), field = document.getElementById('real-message').getBoundingClientRect();
        return { status_top: status.top, status_bottom: status.bottom, status_height: status.height, field_top: field.top, field_bottom: field.bottom,
          focused: document.activeElement?.id, draft: document.getElementById('real-message').value, viewport: innerHeight };
      });
      let release, reached; const wait = new Promise(resolve => { release = resolve; }), barrier = new Promise(resolve => { reached = resolve; }); hold = { wait, reached };
      await page.locator('#real-message').fill('This send will be refused'); await page.locator('#real-message-form button').click(); await barrier;
      await page.locator('#real-message').fill('My next unsent thought');
      await page.locator('#real-message').evaluate(node => { node.focus(); node.scrollIntoView({ block: 'start' }); });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const before = await rects(); release(); await page.waitForFunction(() => !document.body.dataset.realBusy);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const after = await rects(); result.observations.push({ atelier, before, after });
      await page.screenshot({ path: path.join(out, atelier ? 'atelier-refusal.png' : 'current-refusal.png') });
      assert.equal(after.focused, 'real-message'); assert.equal(after.draft, 'My next unsent thought');
      assert.ok(after.status_height > before.status_height, 'The adversary must actually grow the pinned status');
      assert.ok(after.field_top >= after.status_bottom - 1, 'Growing status covered the focused field');
      assert.ok(after.field_bottom <= after.viewport + 1, 'Focused field left the visible viewport');
    } catch (error) { result.failures.push({ atelier, message: error.message }); }
    finally { await context.close(); }
  }
  result.status = result.failures.length ? 'NEEDS_REVIEW' : 'PASS_DESKTOP_' + engine.toUpperCase() + '_SYNTHETIC';
} catch (error) { result.failures.push({ message: error.message }); }
finally {
  if (browser) await browser.close(); await new Promise(resolve => server.close(resolve));
  await fs.writeFile(path.join(out, 'RESULT.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
}
process.exit(result.status.startsWith('PASS_') ? 0 : 1);
