// Preserve an explicit language choice through the actual main-page next action when storage is denied.
// Reuses the two-person fixture, real page code and ordinary clicks; no live account/JWT/RLS proof.
// Usage: node tools/language-link-browser.mjs --candidate=web_launch/dist-neon-<name> --out=<dir> [--engine=chromium|webkit]
import { chromium, webkit } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { A, C, config, createFixture } from './fixtures/real-journey-fixture.mjs';
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
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.mjs': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer(async (request, response) => {
  try { let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); if (pathname === '/') pathname = '/index.html';
    const file = path.resolve(root, '.' + pathname); if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' }).end(await fs.readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const result = { scope: 'Desktop browser, actual navigation with denied localStorage, synthetic Auth/Data. No live JWT, physical device or RLS proof.',
  candidate: path.basename(root), releaseHash, engine: null, facts: {}, checks: [], failures: [], provider_calls: 0, usd: 0 };
const check = (name, pass, detail) => { result.checks.push({ name, pass: Boolean(pass), ...(detail === undefined ? {} : { detail }) }); };

let browser;
try {
  const executablePath = engine === 'chromium' ? process.env.SYNERA_CHROMIUM || undefined : undefined;
  browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, timeout: 30000, ...(executablePath ? { executablePath } : {}) });
  result.engine = { name: engine, version: browser.version() };
  const db = createFixture();
  for (const profile of db.profiles) { profile.display_name = { [A]: 'Andrii Test', [C]: 'Oleh Test' }[profile.id] || profile.display_name; profile.brief.goal = 'Check one concrete result for the business'; }
  async function signIn(actor, language = 'uk', withoutStorage = false) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'uk-UA' });
    context.setDefaultTimeout(12000);
    if (withoutStorage) await context.addInitScript(() => { Object.defineProperty(window, 'localStorage', {get() { throw new DOMException('Storage denied for regression test', 'SecurityError'); }}); });
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    await context.route('**/config.json', route => route.fulfill({ json: config }));
    await context.route('**/api/neon/**', async route => { const request = route.request(), url = new URL(request.url());
      if (url.pathname === '/api/neon/health') { await route.fulfill({ json: { authGateway: 'reachable', backend: 'neon', policyVersion: POLICY_VERSION } }); return; }
      const response = await db.fetchFor(actor)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() }); });
    const page = await context.newPage(); page.on('pageerror', error => result.failures.push({language, error:error.message, stack:error.stack, url:page.url()}));
    await page.goto(base + '/' + (language === 'uk' ? '' : '?lang=' + language)); await page.waitForTimeout(1500);
    const guide = page.locator('.tour-panel'); for (let step = 0; step < 8 && await guide.isVisible(); step++) await guide.locator('.actions button').nth(1).click();
    // The two permissions are in-memory switches; with them on, the business case and the invitation gate are shown.
    await page.locator('nav [data-tab="settings"]').click(); await page.locator('#consent-comparison').check(); await page.locator('#consent-introduction').check(); await page.locator('nav [data-tab="people"]').click();
    return page;
  }
  for (const language of ['de', 'en']) {
    const page = await signIn(A, language, true);
    await page.waitForFunction(code => document.documentElement.lang === code, language);
    const storageDenied = await page.evaluate(() => { try { void localStorage; return false; } catch { return true; } });
    check(language + ': browser really denies localStorage', storageDenied);
    const writesBefore = db.requests.filter(row => row.method !== 'GET').length;
    await page.locator('.header-preferences > summary').click();
    const styles = [];
    for (let n = 0; n < 3; n++) { await page.locator('#style-toggle').click(); styles.push(await page.evaluate(() => document.documentElement.dataset.syneraStyle)); }
    check(language + ': design cycle works locally and returns to Current', JSON.stringify(styles) === JSON.stringify(['atelier','original','synera']), styles);
    await page.locator('#tour-start').click();
    const tour = page.locator('.tour-panel');
    check(language + ': explicit tour works without storage', await tour.isVisible());
    if (await tour.isVisible()) { const title = await tour.locator('h2').textContent(); await tour.locator('.actions button').nth(1).click(); check(language + ': tour advances to the next real step', await tour.locator('h2').textContent() !== title); await page.keyboard.press('Escape'); }
    await page.locator('.header-preferences > summary').click();
    // Redraw the actual people card after the language has been chosen. The next link is created asynchronously.
    await page.locator('#refresh').click();
    const next = page.locator('#person-' + C + ' a[href^="/real-journey.html"]').first();
    await next.waitFor({state:'visible'}); await page.waitForTimeout(500);
    const href = await next.getAttribute('href');
    check(language + ': newly drawn next link carries the explicit choice', new URL(href, base).searchParams.get('lang') === language, href);
    await page.locator('.header-preferences > summary').click();
    await page.locator('#lang-switcher [data-lang="uk"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'uk');
    check(language + ': returning to Ukrainian removes the old language from the link', new URL(await next.getAttribute('href'), base).searchParams.has('lang') === false);
    await page.locator('#lang-switcher [data-lang="' + language + '"]').click();
    await page.waitForFunction(code => document.documentElement.lang === code, language);
    await page.locator('.header-preferences > summary').click();
    await page.evaluate(() => {
      for (const [id, href] of [['malformed-probe', 'http://['], ['internal-probe', '/real-journey.html?entry=test#next'], ['external-probe', 'https://example.com/real-journey.html?entry=test#next']]) {
        const a = document.createElement('a'); a.id = id; a.href = href; a.textContent = 'Link probe'; document.body.append(a);
      }
    });
    await page.waitForTimeout(100);
    const links = await page.evaluate(() => ({internal:document.getElementById('internal-probe').getAttribute('href'), external:document.getElementById('external-probe').getAttribute('href')}));
    const internal = new URL(links.internal, base);
    check(language + ': query and fragment survive on newly added internal links', internal.searchParams.get('lang') === language && internal.searchParams.get('entry') === 'test' && internal.hash === '#next', links.internal);
    check(language + ': external links are unchanged', links.external === 'https://example.com/real-journey.html?entry=test#next', links.external);
    await next.click(); await page.locator('#real-content-panel').waitFor({state:'visible'});
    const actual = await page.evaluate(() => document.documentElement.lang);
    check(language + ': real next page keeps the choice without storage', actual === language, {actual, url:page.url()});
    check(language + ': language and navigation did not write data', db.requests.filter(row => row.method !== 'GET').length === writesBefore);
    await page.screenshot({path:path.join(out, language + '-next-page.png')});
    await page.context().close();
  }
} catch (error) { result.failures.push({ error: error.message.replace(/\u001b\[\d+m/g, '').split('\n').slice(0, 5).join(' | ') }); }
finally {
  if (browser) await browser.close(); await new Promise(resolve => server.close(resolve));
  assert.equal(sha(await fs.readFile(path.join(root, 'release.json'))), releaseHash, 'Candidate changed during the run');
  const failed = result.checks.filter(item => !item.pass);
  result.status = result.failures.length || failed.length || !result.checks.length ? 'NEEDS_REVIEW' : `PASS_DESKTOP_${engine.toUpperCase()}_SYNTHETIC`;
  await fs.writeFile(path.join(out, 'RESULT.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ status: result.status, facts: result.facts, failed: failed.map(item => item.name), failures: result.failures }));
}
process.exit(result.status.startsWith('PASS_') ? 0 : 1);
