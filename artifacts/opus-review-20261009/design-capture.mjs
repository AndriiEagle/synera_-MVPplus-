// Evidence generator for the design notes in REPORT.uk.md: first-screen captures and one measurement.
// Desktop Chromium, synthetic fixture. Not a phone, not a human rating.
// Usage (repo root): node artifacts/opus-review-20261009/design-capture.mjs web_launch/dist-neon-<name>
import { chromium } from 'playwright';
import fs from 'node:fs/promises'; import path from 'node:path'; import http from 'node:http';
import { RealJourneyStore, exchangeMaterial } from '../../web_launch/real-journey-client.mjs';
import { A, B, config, fields, createFixture } from '../../tools/fixtures/real-journey-fixture.mjs';
const root = path.resolve(process.argv[2]), out = path.resolve('artifacts/opus-review-20261009/design');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer(async (q, r) => { try { const f = path.resolve(root, '.' + decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!f.startsWith(root + path.sep)) throw 0; r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }).end(await fs.readFile(f)); } catch { r.writeHead(404).end(); } });
await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ executablePath: process.env.SYNERA_CHROMIUM || undefined });
const report = { scope: 'Desktop Chromium, synthetic fixture; captures of the visible first screen', captures: [], statusVisibility: [], consoleErrors: [] };
const atelier = () => localStorage.setItem('synera.atelier.preferences.v1', JSON.stringify({ version: 1, enabled: true, accent: 'gold', density: 'comfortable', largeText: false, strongContrast: false }));
async function context(viewport, { db, actor, skin } = {}) {
  const c = await browser.newContext({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'uk-UA' }); c.setDefaultTimeout(12000);
  await c.route('**/*', r => new URL(r.request().url()).origin === base ? r.continue() : r.abort());
  await c.route('**/config.json', r => r.fulfill({ json: db ? config : { backend: 'neon', pilotSafetyEnabled: false, realPilotEnabled: false } }));
  if (db) await c.route('**/api/neon/**', async r => { const q = r.request(), u = new URL(q.url()); const res = await db.fetchFor(actor())(u.pathname + u.search, { method: q.method(), headers: q.headers(), ...(q.method() === 'GET' ? {} : { body: q.postData() }) }); await r.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: await res.text() }); });
  if (skin === 'atelier') await c.addInitScript(atelier);
  return c;
}
const sizes = { phone: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };
for (const file of ['summit.html', 'index.html', 'get.html', 'studio-journey.html', 'triangle.html', 'studio.html']) for (const [size, viewport] of Object.entries(sizes)) {
  const c = await context(viewport), p = await c.newPage(); p.on('pageerror', e => report.consoleErrors.push({ file, size, error: e.message.slice(0, 160) }));
  try { await p.goto(base + '/' + file); await p.waitForLoadState('networkidle'); await p.waitForTimeout(400);
    const name = `${file.replace('.html', '')}-${size}.png`; await p.screenshot({ path: path.join(out, name) });
    report.captures.push({ name, title: await p.title(), h1: (await p.locator('h1').first().innerText().catch(() => '')).slice(0, 90), pageHeight: await p.evaluate(() => document.documentElement.scrollHeight), buttonsAboveFold: await p.evaluate(() => [...document.querySelectorAll('a[href],button')].filter(e => e.checkVisibility() && e.getBoundingClientRect().top < innerHeight && e.getBoundingClientRect().bottom > 0).length) });
  } catch (e) { report.captures.push({ name: file + '-' + size, error: e.message.split('\n')[0] }); } finally { await c.close(); }
}
// The real two-person page: states a person actually reaches, plus where the action feedback lands.
const db = createFixture(); let actor = A; const a = new RealJourneyStore(config, db.fetchFor(A)), b = new RealJourneyStore(config, db.fetchFor(B)); await Promise.all([a.dashboard(), b.dashboard()]);
for (const [label, viewport, skin] of [['phone', sizes.phone], ['phone-atelier', sizes.phone, 'atelier'], ['landscape', { width: 844, height: 390 }], ['desktop', sizes.desktop]]) {
  const world = label === 'phone' ? db : createFixture(); let who = A; const c = await context(viewport, { db: world, actor: () => who, skin }), p = await c.newPage();
  const ready = () => p.waitForFunction(() => !document.body.dataset.realBusy);
  const load = async () => { await p.goto(base + '/real-journey.html'); await p.locator('#real-content-panel').waitFor({ state: 'visible' }); await ready(); };
  const shot = async name => { await p.screenshot({ path: path.join(out, `journey-${label}-${name}.png`) }); report.captures.push({ name: `journey-${label}-${name}.png` }); };
  const feedback = async action => { const s = await p.evaluate(() => { const r = document.getElementById('real-status').getBoundingClientRect(); return { inViewport: r.bottom > 0 && r.top < innerHeight, statusTop: Math.round(r.top), scrollY: Math.round(scrollY), text: document.getElementById('real-status').textContent.slice(0, 70) }; }); report.statusVisibility.push({ view: label, action, ...s }); };
  try {
    await load(); await shot('1-dashboard');
    await p.locator('#real-people article').filter({ hasText: 'Тест Марія' }).getByRole('button').click(); await ready(); await feedback('open terms'); await shot('2-terms-top');
    for (const [name, value] of Object.entries(fields())) { const e = p.locator(`#real-terms-form [name="${name}"]`); if (await e.evaluate(n => n.tagName === 'SELECT')) await e.selectOption(value); else await e.fill(value); }
    await p.locator('#real-terms-form button[type=submit]').scrollIntoViewIfNeeded(); await shot('3-terms-submit');
    report.captures.at(-1).formHeight = await p.locator('#real-terms-form').evaluate(n => Math.round(n.getBoundingClientRect().height)); report.captures.at(-1).viewportHeight = viewport.height;
    await p.locator('#real-terms-form button[type=submit]').click(); await ready(); await feedback('save terms');
    await p.locator('#real-approve-check').check(); await p.locator('#real-approve').click(); await ready(); await feedback('approve'); await shot('4-approved-own');
    who = B; await load(); await p.locator('#real-people article').filter({ hasText: 'Тест Андрій' }).getByRole('button').click(); await ready(); await p.locator('#real-approve-check').check(); await p.locator('#real-approve').click(); await ready();
    who = A; await load(); await p.locator('#real-people article').filter({ hasText: 'Тест Марія' }).getByRole('button').click(); await ready();
    const invite = p.locator('#real-invite-form'); await invite.locator('[name=note]').fill('Обговорити перевірений екран'); await invite.locator('[name=proposed_at]').fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    await invite.getByRole('button').scrollIntoViewIfNeeded(); await shot('5-invite'); await invite.getByRole('button').click(); await ready(); await feedback('send invitation');
    who = B; await load(); await p.locator('#real-meetings').getByRole('button', { name: 'Прийняти', exact: true }).scrollIntoViewIfNeeded(); await shot('6-pending-invitation');
    await p.locator('#real-meetings').getByRole('button', { name: 'Прийняти', exact: true }).click(); await ready(); await feedback('accept invitation');
    await p.locator('#real-meetings').getByRole('button', { name: 'Відкрити розмову' }).click(); await ready(); await feedback('open conversation');
    await p.locator('#real-message').fill('Привіт! Домовмося про перший крок.'); await p.locator('#real-message-form button').click(); await ready(); await feedback('send message'); await shot('7-chat');
  } catch (e) { report.captures.push({ name: 'journey-' + label, error: e.message.split('\n')[0] }); } finally { await c.close(); }
}
await browser.close(); server.close();
await fs.writeFile(path.join(out, 'DESIGN_CAPTURE.json'), JSON.stringify(report, null, 2) + '\n');
const hidden = report.statusVisibility.filter(r => !r.inViewport);
console.log(JSON.stringify({ captures: report.captures.length, errors: report.captures.filter(c => c.error), consoleErrors: report.consoleErrors.length, feedbackOffScreen: `${hidden.length}/${report.statusVisibility.length}` }));
