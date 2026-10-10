// Semantic UI oracle: an unavailable terms write is not logout; private data is still purged on 401/403.
// Only synthetic accounts/transport. This does not prove PostgreSQL, signed JWT or phone installation.
import { chromium, webkit } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { RealJourneyStore, exchangeMaterial } from '../web_launch/real-journey-client.mjs';
import { A, B, config, fields, createFixture } from './fixtures/real-journey-fixture.mjs';

const option = name => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
assert.ok(option('candidate') && option('out'), 'Pass --candidate=<build> --out=<new proof directory>');
const root = path.resolve(option('candidate')), out = path.resolve(option('out'));
const source = option('source-root') && path.resolve(option('source-root'));
const engine = option('engine') || 'webkit'; assert.ok(['webkit', 'chromium'].includes(engine));
const mutation = option('mutate') === 'purge-terms';
const overrides = new Set(['real-journey.mjs', 'real-journey-i18n.mjs']);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
await fs.mkdir(out, { recursive: true });
const report = { status: 'NOT_ACCEPTED', scope: 'Desktop engine with synthetic gateway fixture, no live JWT/RLS/phones',
  candidate: path.basename(root), release_sha256: sha(await fs.readFile(path.join(root, 'release.json'))),
  source_overrides: {}, engine, mutation, checks: [], failures: [], provider_calls: 0, usd: 0 };
const mime = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer(async (request, response) => {
  try {
    const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1);
    const target = path.resolve(source && overrides.has(name) ? source : root, name);
    assert.ok(target.startsWith((source && overrides.has(name) ? source : root) + path.sep));
    let bytes = await fs.readFile(target);
    if (source && overrides.has(name)) report.source_overrides[name] = sha(bytes);
    if (mutation && name === 'real-journey.mjs') {
      const text = bytes.toString(), guard = "if (error?.status === 503 && error?.code === 'data_unavailable'";
      assert.ok(text.includes(guard)); bytes = Buffer.from(text.replace(guard, 'if (false && ' + guard.slice(4)));
    }
    response.writeHead(200, { 'content-type': mime[path.extname(name)] || 'application/octet-stream' }).end(bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await (engine === 'webkit' ? webkit : chromium).launch(engine === 'chromium' && process.env.SYNERA_CHROMIUM ? { executablePath: process.env.SYNERA_CHROMIUM } : {});
  report.browser_version = browser.version();
  const scenarios = [
    { name: 'uncommitted-uk', lang: 'uk', failure: 'before' },
    { name: 'committed-de', lang: 'de', failure: 'after', atelier: true },
    { name: 'revision-de', lang: 'de', failure: 'before', revision: true },
    { name: 'late-logout-en', lang: 'en', failure: 'late' },
    { name: 'denied-en', lang: 'en', failure: 'forbidden' },
    { name: 'expired-en', lang: 'en', failure: 'expired' },
    { name: 'warm-disabled-en', lang: 'en', failure: 'feature-off' },
    { name: 'cold-disabled', lang: 'de', failure: 'cold' },
  ];
  for (const scenario of scenarios) {
    const db = createFixture(); let inject = scenario.failure, posts = 0, release, entered;
    const gate = new Promise(resolve => { release = resolve; }), barrier = new Promise(resolve => { entered = resolve; });
    if (scenario.revision) {
      const store = new RealJourneyStore(config, db.fetchFor(A)); await store.dashboard();
      await store.saveTerms(B, exchangeMaterial(A, B, fields({ give_target: 'Попередній погоджуваний прототип' })));
    }
    const context = await browser.newContext({ viewport: { width: 320, height: 568 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    context.setDefaultTimeout(10000);
    let page;
    try {
      await context.addInitScript(({ lang, atelier }) => {
        localStorage.setItem('synera.real-journey.language.v1', lang);
        if (atelier) localStorage.setItem('synera.atelier.preferences.v1', JSON.stringify({ version: 1, enabled: true, accent: 'gold', density: 'comfortable', largeText: false, strongContrast: false }));
      }, scenario);
      await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      await context.route('**/config.json', route => route.fulfill({ json: scenario.failure === 'cold' ? { ...config, realJourneyEnabled: false } : config }));
      await context.route('**/api/neon/**', async route => {
        const request = route.request(), url = new URL(request.url());
        const write = ['POST', 'PATCH'].includes(request.method()) && url.pathname.endsWith('/data/match_cases');
        if (write) {
          posts++;
          if (inject === 'late') { entered(); await gate; inject = null; return route.fulfill({ status: 503, json: { error: 'data_unavailable', status: 503 } }); }
          if (inject === 'before') { inject = null; return route.fulfill({ status: 503, json: { error: 'data_unavailable', status: 503 } }); }
          if (inject === 'forbidden' || inject === 'expired') {
            const status = inject === 'expired' ? 401 : 403; inject = null;
            return route.fulfill({ status, json: { error: 'data_unavailable', status } });
          }
          if (inject === 'feature-off') { inject = null; return route.fulfill({ status: 503, json: { error: 'real_journey_not_ready', status: 503 } }); }
        }
        const response = await db.fetchFor(A)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
        if (write && inject === 'after') { assert.equal(response.ok, true); inject = null; return route.fulfill({ status: 503, json: { error: 'data_unavailable', status: 503 } }); }
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
      });
      page = await context.newPage(); const ready = () => page.waitForFunction(() => !document.body.dataset.realBusy);
      await page.goto(base + '/real-journey.html');
      if (scenario.failure === 'cold') {
        await page.locator('#real-blocked').waitFor({ state: 'visible' });
        assert.equal(await page.locator('#real-content-panel').isVisible(), false); assert.equal(db.requests.length, 0);
        report.checks.push({ name: scenario.name, status: 'PASS', posts }); continue;
      }
      await page.locator('#real-content-panel').waitFor({ state: 'visible' }); await ready();
      if (!await page.locator('#real-people-panel').evaluate(node => node.open)) await page.locator('#real-people-panel summary').click();
      await page.locator('#real-people article').filter({ hasText: 'Тест Марія' }).getByRole('button').click(); await ready();
      if (!await page.locator('#real-editor').evaluate(node => node.open)) await page.locator('#real-editor summary').click();
      for (const [name, value] of Object.entries(fields())) {
        const input = page.locator(`#real-terms-form [name="${name}"]`);
        if (await input.evaluate(node => node.tagName === 'SELECT')) await input.selectOption(value); else await input.fill(value);
      }
      const snapshot = () => page.locator('#real-terms-form').evaluate(form => [...new FormData(form).entries()]);
      const draft = await snapshot();
      await page.locator('#real-terms-form button[type=submit]').click();
      if (scenario.failure === 'late') {
        await barrier; await page.locator('#real-logout').click();
        await page.waitForFunction(() => !document.getElementById('real-auth').hidden && document.getElementById('real-status').textContent.includes('signed out'));
        const note = await page.locator('#real-status').textContent(); release(); await ready();
        assert.equal(await page.locator('#real-status').textContent(), note, 'late failure replaced logout');
        assert.equal(await page.locator('[name=give_target]').inputValue(), '', 'late failure restored private text');
        assert.equal(await page.locator('#real-content-panel').isVisible(), false);
        assert.equal(db.cases.length, 0); assert.equal(posts, 1);
        report.checks.push({ name: scenario.name, status: 'PASS', posts }); continue;
      }
      await ready();
      if (['forbidden', 'expired', 'feature-off'].includes(scenario.failure)) {
        assert.equal(await page.locator(scenario.failure === 'feature-off' ? '#real-blocked' : '#real-auth').isVisible(), true);
        assert.equal(await page.locator('#real-content-panel').isVisible(), false);
        assert.equal(await page.locator('[name=give_target]').inputValue(), '', 'private text must be purged on denied access');
        report.checks.push({ name: scenario.name, status: 'PASS', posts, cases: db.cases.length }); continue;
      }
      await page.screenshot({ path: path.join(out, scenario.name + '-after-failure.png') });
      assert.equal(await page.locator('#real-content-panel').isVisible(), true, 'transient terms write hid the active workspace');
      assert.equal(await page.locator('#real-auth').isVisible(), false, 'temporary write failure became logout');
      assert.deepEqual(await snapshot(), draft, 'temporary save failure destroyed the unsent terms');
      const note = await page.locator('#real-status').textContent();
      assert.equal(await page.locator('#real-status').getAttribute('role'), 'status');
      assert.equal(/[\u0400-\u04ff]/.test(note), scenario.lang === 'uk', 'recovery text is not translated');
      assert.equal(posts, 1, 'failure must not auto-retry');
      await page.locator('#real-refresh').click(); await ready();
      assert.deepEqual(await snapshot(), draft, 'manual refresh destroyed unsaved terms');
      assert.equal(posts, 1, 'refresh resubmitted the failed write');
      await page.locator('#real-terms-form button[type=submit]').click(); await ready();
      assert.equal(db.cases.length, 1, 'retry created no case or duplicated the committed case');
      assert.equal(posts, scenario.failure === 'after' ? 1 : 2, 'ambiguous commit must hit existing compare-and-swap, not a second insert');
      assert.equal(db.approvals.length, 0, 'a retry silently approved terms');
      if (scenario.failure === 'after') assert.deepEqual(await snapshot(), draft, 'conflict destroyed the draft');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'narrow recovery view overflows');
      report.checks.push({ name: scenario.name, status: 'PASS', posts, cases: db.cases.length, preserved_fields: draft.length, note });
    } catch (error) {
      await page?.screenshot({ path: path.join(out, scenario.name + '-error.png') }).catch(() => {});
      const view = await page?.evaluate(() => ({ people: document.getElementById('real-people-panel')?.open, content: !document.getElementById('real-content-panel')?.hidden, atelier: document.body.getAttribute('data-atelier'), status: document.getElementById('real-status')?.textContent })).catch(() => null);
      report.failures.push({ name: scenario.name, message: error.message, view });
    }
    finally { release(); await context.close(); }
  }
  assert.equal(report.failures.length, 0, JSON.stringify(report.failures)); report.status = 'PASS';
} catch (error) { report.failures.push({ name: 'runner', message: error.message }); process.exitCode = 1; }
finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); await fs.writeFile(path.join(out, 'RESULT.json'), JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify(report));
