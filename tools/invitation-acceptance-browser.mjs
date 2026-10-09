// Real clicks in a desktop browser against a built candidate with the synthetic two-party fixture.
// Not physical phones, not live accounts, not a signed JWT. The server rule itself is proven on PostgreSQL
// by tools/meeting-status-guard-sql-acceptance.mjs; this covers what a person sees and can press.
// Usage: node tools/invitation-acceptance-browser.mjs --candidate=web_launch/dist-neon-<name> --out=<dir>
//        [--engine=chromium|webkit] [--sizes=standard,small,desktop]   SYNERA_CHROMIUM=<path> overrides the binary.
import { chromium, webkit } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { RealJourneyStore, exchangeMaterial } from '../web_launch/real-journey-client.mjs';
import { A, B, config, fields, createFixture } from './fixtures/real-journey-fixture.mjs';

const option = name => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const root = path.resolve(option('candidate') || '');
assert.match(path.basename(root), /^dist-neon-[a-z0-9-]+$/, 'Pass --candidate=web_launch/dist-neon-<name>');
const out = path.resolve(option('out') || '');
assert.ok(option('out'), 'Pass --out=<new directory for RESULT.json and screenshots>');
await fs.mkdir(out, { recursive: true });
const engine = option('engine') || 'chromium';
assert.ok(['chromium', 'webkit'].includes(engine));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const releaseHash = sha(await fs.readFile(path.join(root, 'release.json')));
const sizes = { small: { width: 320, height: 568 }, standard: { width: 390, height: 844 }, desktop: { width: 1280, height: 900 } };
const selected = (option('sizes') || 'standard').split(',');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer(async (request, response) => {
  try {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' }).end(await fs.readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const result = { scope: 'Desktop browser, synthetic Auth/Data fixture through the real gateway code. No physical phone, live account, JWT or RLS proof.',
  candidate: path.basename(root), releaseHash, engine: null, runs: [], failures: [], provider_calls: 0, usd: 0 };
const plan = () => ({ proposed_at: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 30, meeting_place: 'Zürich' });
const CONFLICT = 'Умови змінилися після цього запрошення';

async function scenario(browser, name) {
  const db = createFixture(); let actor = B;
  const a = new RealJourneyStore(config, db.fetchFor(A)), b = new RealJourneyStore(config, db.fetchFor(B));
  await Promise.all([a.dashboard(), b.dashboard()]);
  const first = await a.saveTerms(B, exchangeMaterial(A, B, fields()));
  await a.approveTerms(B, first); await b.approveTerms(A, await b.pairState(A));
  const meeting = (await a.sendInvitation(B, 'Обговорити перевірений екран', plan())).meetings[0];

  const context = await browser.newContext({ viewport: sizes[name], serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'uk-UA' });
  context.setDefaultTimeout(12000);
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await context.route('**/config.json', route => route.fulfill({ json: config }));
  await context.route('**/api/neon/**', async route => {
    const request = route.request(), url = new URL(request.url());
    const response = await db.fetchFor(actor)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  const page = await context.newPage(), steps = [];
  const ready = () => page.waitForFunction(() => !document.body.dataset.realBusy);
  const card = () => page.locator('#real-meetings article').first();
  const button = label => card().getByRole('button', { name: label, exact: true });
  const shot = async label => { const file = `${name}-${label}.png`; await page.screenshot({ path: path.join(out, file), fullPage: true }); return file; };
  const signedIn = async () => { assert.equal(await page.locator('#real-auth').isHidden(), true, 'must not be sent to sign-in'); assert.equal(await page.locator('#real-content-panel').isVisible(), true); };
  const writes = () => db.requests.filter(row => row.method === 'PATCH' && row.path.endsWith('/meeting_requests')).length;
  try {
    // 1. B opens the page while the agreement is current: acceptance is offered.
    await page.goto(base + '/real-journey.html'); await page.locator('#real-content-panel').waitFor({ state: 'visible' }); await ready();
    assert.equal(await button('Прийняти').count(), 1); assert.equal(await button('Відхилити').count(), 1);
    steps.push({ step: 'current_agreement_offers_acceptance', screenshot: await shot('1-current') });

    // 2. A revises the terms while B still looks at the old card, then B presses the now stale button.
    const revised = await a.saveTerms(B, exchangeMaterial(A, B, fields({ take_target: 'Два перевірених екрани' })), await a.pairState(B));
    const before = writes();
    await button('Прийняти').click(); await ready();
    await page.waitForFunction(text => document.getElementById('real-status').textContent.includes(text), CONFLICT);
    await signedIn();
    assert.equal(db.meetings[0].status, 'pending', 'stale click must not accept');
    assert.equal(writes(), before, 'a known-stale acceptance is not sent');
    assert.equal(await button('Прийняти').count(), 0, 'the refreshed card no longer offers acceptance');
    assert.equal(await button('Переглянути умови').count(), 1); assert.equal(await button('Відхилити').count(), 1);
    assert.ok((await card().innerText()).includes(CONFLICT));
    steps.push({ step: 'stale_click_refused_with_next_action', screenshot: await shot('2-stale-refused') });

    // 3. A fresh load shows the same honest state without any click.
    await page.reload(); await page.locator('#real-content-panel').waitFor({ state: 'visible' }); await ready();
    assert.equal(await button('Прийняти').count(), 0); assert.equal(await button('Переглянути умови').count(), 1);

    // 4. The offered next action leads to the current revision; B approves it there, A approves too.
    await button('Переглянути умови').click(); await ready();
    assert.ok((await page.locator('#real-terms-review').innerText()).includes('Редакція 2'));
    await page.locator('#real-approve-check').check(); await page.locator('#real-approve').click(); await ready();
    await a.approveTerms(B, revised);
    steps.push({ step: 'next_action_opens_current_revision', screenshot: await shot('3-reapprove') });

    // 5. The SAME invitation becomes acceptable; the conversation opens only now.
    await page.locator('#real-refresh').click(); await ready();
    const panel = page.locator('#real-meetings-panel'); if (!await panel.evaluate(node => node.open)) await panel.locator('summary').first().click();
    assert.equal(await button('Прийняти').count(), 1);
    await button('Прийняти').click(); await ready();
    assert.equal(db.meetings[0].status, 'accepted'); assert.equal(db.meetings[0].id, meeting.id); assert.equal(writes(), before + 1);
    await card().getByRole('button', { name: 'Відкрити розмову' }).click(); await ready();
    await page.locator('#real-message').fill('Після обох підтверджень'); await page.locator('#real-message-form button').click(); await ready();
    assert.equal(db.messages.length, 1);
    steps.push({ step: 'same_invitation_accepted_after_both_reapproved', screenshot: await shot('4-accepted') });

    // 6. The sender's own pending card explains who has to act when the agreement is not current.
    const second = createFixture(); const a2 = new RealJourneyStore(config, second.fetchFor(A)), b2 = new RealJourneyStore(config, second.fetchFor(B));
    await Promise.all([a2.dashboard(), b2.dashboard()]);
    const terms = await a2.saveTerms(B, exchangeMaterial(A, B, fields())); await a2.approveTerms(B, terms); await b2.approveTerms(A, await b2.pairState(A));
    await a2.sendInvitation(B, 'Обговорити перевірений екран', plan()); await b2.withdrawTerms(A, await b2.pairState(A));
    await context.unroute('**/api/neon/**');
    await context.route('**/api/neon/**', async route => {
      const request = route.request(), url = new URL(request.url());
      const response = await second.fetchFor(A)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
    });
    await page.goto(base + '/real-journey.html'); await page.locator('#real-content-panel').waitFor({ state: 'visible' }); await ready();
    assert.ok((await card().innerText()).includes('спершу обидва мають підтвердити поточну редакцію'));
    assert.equal(await button('Прийняти').count(), 0); assert.equal(await button('Відхилити').count(), 0);
    steps.push({ step: 'sender_card_names_the_missing_approvals', screenshot: await shot('5-sender') });
    result.runs.push({ size: name, viewport: sizes[name], steps, status_writes: writes() });
  } catch (error) {
    result.failures.push({ size: name, error: error.message.split('\n')[0], screenshot: await shot('failure').catch(() => null), completed: steps.map(step => step.step) });
  } finally { await context.close(); }
}

let browser;
try {
  const executablePath = engine === 'chromium' ? process.env.SYNERA_CHROMIUM || undefined : undefined;
  browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, timeout: 30000, ...(executablePath ? { executablePath } : {}) });
  result.engine = { name: engine, version: browser.version() };
  for (const name of selected) { assert.ok(sizes[name], 'Unknown size ' + name); await scenario(browser, name); }
} catch (error) { result.failures.push({ stage: 'launch', error: error.message.split('\n')[0] }); }
finally {
  if (browser) await browser.close(); await new Promise(resolve => server.close(resolve));
  assert.equal(sha(await fs.readFile(path.join(root, 'release.json'))), releaseHash, 'Candidate changed during the run');
  result.status = result.failures.length || !result.runs.length ? 'NEEDS_REVIEW' : `PASS_DESKTOP_${engine.toUpperCase()}_SYNTHETIC`;
  await fs.writeFile(path.join(out, 'RESULT.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ status: result.status, runs: result.runs.length, failures: result.failures }));
}
process.exit(result.status.startsWith('PASS_') ? 0 : 1);
