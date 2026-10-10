// Real browser reload and manual retries against synthetic Auth/Data. No live JWT or physical-phone proof.
import { chromium, webkit } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createMessageFixture } from './fixtures/message-intent-fixture.mjs';
import { A, B, config } from './fixtures/real-journey-fixture.mjs';

const option = name => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
assert.ok(option('candidate') && option('out'), 'Use --candidate=<built directory> --out=<new proof directory>');
const root = path.resolve(option('candidate')), out = path.resolve(option('out'));
const engine = option('engine') || 'webkit'; assert.ok(['chromium', 'webkit'].includes(engine));
const mutation = option('mutate') === 'forget-reload';
await fs.mkdir(out, { recursive: true });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const releaseHash = sha(await fs.readFile(path.join(root, 'release.json')));
const report = { status: 'NOT_ACCEPTED', scope: 'Desktop browser with synthetic Auth/Data fixture, real same-tab reload and explicit clicks. Not SQL/JWT/live accounts/physical phones.',
  candidate: path.basename(root), release_sha256: releaseHash, engine, mutation, checks: [], errors: [], provider_calls: 0, usd: 0 };
const mime = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  try {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    assert.ok(file.startsWith(root + path.sep));
    response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' }).end(await fs.readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const db = createMessageFixture(), meeting = '44444444-4444-4444-8444-444444444444';
db.meetings.push({ id: meeting, sender_id: A, recipient_id: B, status: 'accepted', created_at: new Date().toISOString(),
  proposed_at: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 20, meeting_place: 'Online', sender_name: 'Andrii Test', recipient_name: 'Maria Test' });
let browser, context, fail = null, posts = 0;
try {
  browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, ...(engine === 'chromium' && process.env.SYNERA_CHROMIUM ? { executablePath: process.env.SYNERA_CHROMIUM } : {}) });
  report.engine_version = browser.version();
  context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  if (mutation) {
    const source = await fs.readFile(path.join(root, 'real-journey-client.mjs'), 'utf8');
    const needle = 'const raw = this.#messageStorage?.getItem(MESSAGE_RETRY_STORAGE_KEY);';
    assert.equal(source.split(needle).length, 2, 'Mutation must target the exact persisted-retry lookup');
    await context.route('**/real-journey-client.mjs', route => route.fulfill({ contentType: 'text/javascript', body: source.replace(needle, 'const raw = null;') }));
  }
  await context.route('**/config.json', route => route.fulfill({ json: { ...config, messageIntentsEnabled: true } }));
  await context.route('**/api/neon/**', async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    const sending = method === 'POST' && url.pathname.includes('/messages/');
    if (sending) posts++;
    const response = await db.fetchFor(A)(url.pathname + url.search, { method, headers: request.headers(), ...(method === 'GET' ? {} : { body: request.postData() }) });
    if ((fail === 'post' && sending) || (fail === 'read' && method === 'GET' && url.pathname.endsWith('/meeting_messages'))) {
      fail = null; await route.fulfill({ status: 503, json: { error: 'synthetic lost response after commit' } }); return;
    }
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  const page = await context.newPage(); page.setDefaultTimeout(12000); page.on('pageerror', error => report.errors.push(error.message));
  const ready = () => page.waitForFunction(() => !document.body.dataset.realBusy);
  const open = async () => {
    await page.locator('#real-content-panel').waitFor({ state: 'visible' }); await ready();
    const panel = page.locator('#real-meetings-panel'); if (!await panel.evaluate(node => node.open)) await panel.locator('summary').first().click();
    await page.locator('#real-meetings article button').last().click(); await ready();
  };
  const send = async text => { await page.locator('#real-message').fill(text); await page.locator('#real-message-form button').click(); await ready(); };
  const stored = () => page.evaluate(() => Object.fromEntries(Object.keys(sessionStorage).map(key => [key, sessionStorage.getItem(key)])));
  await page.goto(base + '/real-journey.html?lang=de'); await open();
  for (const phase of ['post', 'read']) {
    const text = `Приватна думка ${phase} 💛 <script>literal</script>`, before = db.messages.length;
    fail = phase; await send(text); assert.equal(db.messages.length, before + 1);
    assert.equal(await page.locator('#real-message').inputValue(), text);
    const metadata = JSON.stringify(await stored()); assert.equal(metadata.includes(text), false, 'Private message leaked into session storage');
    const beforeReloadPosts = posts; await page.reload(); await open();
    assert.equal(posts, beforeReloadPosts, 'Reload sent a message automatically');
    // Reload deliberately does not restore private text: the person manually supplies their exact retry.
    await send(text); assert.equal(db.messages.length, before + 1, 'Reload + manual retry duplicated an already committed message');
    assert.equal(await page.locator('#real-message').inputValue(), '');
    assert.equal(await page.locator('#real-transcript script').count(), 0);
    await send(text); assert.equal(db.messages.length, before + 2, 'Acknowledged same-text send was merged with an earlier action');
    report.checks.push({ name: phase + '_reload_manual_retry_one_row_then_new_explicit_send', pass: true });
  }
  // A pending action must not cross explicit logout, even if the same test account later returns.
  const text = 'Logout boundary is explicit', before = db.messages.length; fail = 'post'; await send(text);
  await page.locator('#real-logout').click(); await page.locator('#real-auth').waitFor({ state: 'visible' });
  await page.reload(); await open(); await send(text);
  assert.equal(db.messages.length, before + 2, 'An old pending action survived explicit logout');
  report.checks.push({ name: 'logout_clears_pending_identity', pass: true });
  assert.deepEqual(report.errors, []);
  await page.screenshot({ path: path.join(out, 'manual-recovery.png'), fullPage: true });
  report.status = 'PASS_DESKTOP_' + engine.toUpperCase() + '_SYNTHETIC';
} catch (error) { report.failure = { message: error.message, stack: error.stack }; }
finally {
  if (context) await context.close(); if (browser) await browser.close(); await new Promise(resolve => server.close(resolve));
  assert.equal(sha(await fs.readFile(path.join(root, 'release.json'))), releaseHash, 'Candidate changed');
  report.messages_stored = db.messages.length; report.explicit_posts = posts;
  await fs.writeFile(path.join(out, 'RESULT.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, checks: report.checks, failure: report.failure?.message, messages_stored: report.messages_stored, explicit_posts: posts }));
}
process.exit(report.status.startsWith('PASS_') ? 0 : 1);
