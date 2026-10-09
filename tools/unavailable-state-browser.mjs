// Real clicks in a desktop browser against a built candidate with the synthetic two-party fixture.
// Invariant: a cancelled meeting or an answered invitation is not a lost session. The person stays signed in
// and keeps unsent text; a REAL session loss still returns to sign-in and purges private content.
// Not physical phones, live accounts, JWT or RLS proof.
// Usage: node tools/unavailable-state-browser.mjs --candidate=web_launch/dist-neon-<name> --out=<dir> [--engine=chromium|webkit]
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
assert.ok(option('out'), 'Pass --out=<new directory for RESULT.json and screenshots>');
const out = path.resolve(option('out')); await fs.mkdir(out, { recursive: true });
const engine = option('engine') || 'chromium';
assert.ok(['chromium', 'webkit'].includes(engine));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const releaseHash = sha(await fs.readFile(path.join(root, 'release.json')));
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
  candidate: path.basename(root), releaseHash, engine: null, scenarios: [], failures: [], provider_calls: 0, usd: 0 };
const DRAFT = 'Довга думка, яку я ще не надіслала — сорок хвилин роботи.';

// Each scenario gets a fresh pair: agreed terms, one invitation from A to B, B's page open.
async function world(browser, { accepted }) {
  const db = createFixture();
  const a = new RealJourneyStore(config, db.fetchFor(A)), b = new RealJourneyStore(config, db.fetchFor(B));
  await Promise.all([a.dashboard(), b.dashboard()]);
  const terms = await a.saveTerms(B, exchangeMaterial(A, B, fields())); await a.approveTerms(B, terms); await b.approveTerms(A, await b.pairState(A));
  const meeting = (await a.sendInvitation(B, 'Обговорити перевірений екран', { proposed_at: new Date(Date.now() + 86400000).toISOString(), duration_minutes: 30, meeting_place: 'Zürich' })).meetings[0];
  if (accepted) { await b.respondInvitation(meeting.id, 'accepted'); await a.sendConversation(meeting.id, 'Перше повідомлення від Андрія'); }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'uk-UA' });
  context.setDefaultTimeout(12000);
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await context.route('**/config.json', route => route.fulfill({ json: config }));
  await context.route('**/api/neon/**', async route => {
    const request = route.request(), url = new URL(request.url());
    const response = await db.fetchFor(B)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  const page = await context.newPage();
  const ready = () => page.waitForFunction(() => !document.body.dataset.realBusy);
  await page.goto(base + '/real-journey.html'); await page.locator('#real-content-panel').waitFor({ state: 'visible' }); await ready();
  const view = () => page.evaluate(() => ({ status: document.getElementById('real-status').textContent, signIn: !document.getElementById('real-auth').hidden,
    content: !document.getElementById('real-content-panel').hidden, draft: document.getElementById('real-message').value,
    readOnly: document.getElementById('real-message').readOnly, sendDisabled: document.querySelector('#real-message-form button').disabled,
    transcript: document.getElementById('real-transcript').innerText, meetings: document.getElementById('real-meetings').innerText,
    // Is the explanation of the disabled control on screen together with that control, without scrolling?
    reasonBesideControl: (() => { const note = document.getElementById('real-conversation-closed'), send = document.querySelector('#real-message-form button');
      if (!note || !send) return false; send.scrollIntoView({ block: 'end' }); const r = note.getBoundingClientRect(); return note.checkVisibility() && r.top >= 0 && r.bottom <= innerHeight; })() }));
  const openChat = async () => { await page.locator('#real-meetings').getByRole('button', { name: 'Відкрити розмову' }).click(); await ready(); };
  return { db, page, context, ready, view, openChat, meeting };
}
const signedInWithText = state => {
  assert.equal(state.signIn, false, 'must not be sent to sign-in'); assert.equal(state.content, true, 'private content stays');
  assert.equal(state.draft, DRAFT, 'unsent text stays in the field');
  assert.ok(state.status.includes('Ця розмова більше недоступна'), 'status names the real cause: ' + state.status);
  assert.ok(state.status.includes('ненадісланий текст лишився'));
  assert.equal(state.readOnly, true); assert.equal(state.sendDisabled, true, 'no dead send control');
  assert.equal(state.reasonBesideControl, true, 'the reason is visible next to the disabled control');
  assert.ok(state.transcript.includes('Перше повідомлення від Андрія'), 'the read transcript stays');
  assert.ok(state.meetings.includes('Скасовано'), 'the list shows the real meeting state');
};
const scenarios = {
  async send_after_sender_cancelled(browser) {
    const w = await world(browser, { accepted: true });
    try {
      await w.openChat(); await w.page.locator('#real-message').fill(DRAFT);
      w.db.meetings[0].status = 'cancelled'; // the sender cancels the accepted meeting on another device
      await w.page.locator('#real-message-form button').click(); await w.ready();
      signedInWithText(await w.view()); assert.equal(w.db.messages.length, 1, 'nothing written after cancellation');
      await w.page.screenshot({ path: path.join(out, 'send-after-cancel.png') });
      // Fixture-only reversal to exercise the control: opening an available conversation enables writing again.
      w.db.meetings[0].status = 'accepted';
      await w.page.locator('#real-refresh').click(); await w.ready(); await w.openChat();
      const reopened = await w.view(); assert.equal(reopened.readOnly, false); assert.equal(reopened.sendDisabled, false);
      assert.equal(await w.page.locator('#real-conversation-closed').count(), 0, 'the closed note leaves with the closure');
      await w.page.locator('#real-message').fill('Після повернення'); await w.page.locator('#real-message-form button').click(); await w.ready();
      assert.equal(w.db.messages.length, 2);
    } finally { await w.context.close(); }
  },
  async background_read_after_sender_cancelled(browser) {
    const w = await world(browser, { accepted: true });
    try {
      await w.openChat(); await w.page.locator('#real-message').fill(DRAFT);
      w.db.meetings[0].status = 'cancelled';
      await w.page.waitForFunction(() => document.getElementById('real-status').textContent.includes('більше недоступна'), null, { timeout: 12000 });
      await w.ready(); signedInWithText(await w.view());
      await w.page.screenshot({ path: path.join(out, 'poll-after-cancel.png') });
    } finally { await w.context.close(); }
  },
  async stale_invitation_card_after_sender_cancelled(browser) {
    const w = await world(browser, { accepted: false });
    try {
      const card = w.page.locator('#real-meetings article').first();
      assert.equal(await card.getByRole('button', { name: 'Прийняти', exact: true }).count(), 1);
      w.db.meetings[0].status = 'cancelled';
      await card.getByRole('button', { name: 'Прийняти', exact: true }).click(); await w.ready();
      const state = await w.view();
      assert.equal(state.signIn, false, 'must not be sent to sign-in'); assert.equal(state.content, true);
      assert.ok(state.status.includes('Це запрошення вже змінилося або скасоване'), state.status);
      assert.ok(state.meetings.includes('Скасовано'));
      assert.equal(await w.page.locator('#real-meetings').getByRole('button', { name: 'Прийняти', exact: true }).count(), 0);
      assert.equal(w.db.meetings[0].status, 'cancelled');
      await w.page.screenshot({ path: path.join(out, 'stale-invitation.png') });
    } finally { await w.context.close(); }
  },
  // Preservation: a real session loss still returns to sign-in and purges the private page.
  async real_session_loss_still_signs_out_and_purges(browser) {
    const w = await world(browser, { accepted: true });
    try {
      await w.openChat(); await w.page.locator('#real-message').fill(DRAFT);
      w.db.revoked.add(B);
      await w.page.locator('#real-message-form button').click(); await w.ready();
      const state = await w.view();
      assert.equal(state.signIn, true, 'a revoked session must show sign-in'); assert.equal(state.content, false);
      assert.equal(state.draft, '', 'private text is purged on session loss'); assert.equal(state.transcript.trim(), '');
      assert.equal(state.readOnly, false, 'the composer is reset for the next signed-in person');
      await w.page.screenshot({ path: path.join(out, 'session-loss.png') });
    } finally { await w.context.close(); }
  },
};

let browser;
try {
  const executablePath = engine === 'chromium' ? process.env.SYNERA_CHROMIUM || undefined : undefined;
  browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, timeout: 30000, ...(executablePath ? { executablePath } : {}) });
  result.engine = { name: engine, version: browser.version() };
  for (const [name, scenario] of Object.entries(scenarios)) {
    try { await scenario(browser); result.scenarios.push({ name, pass: true }); }
    catch (error) { result.scenarios.push({ name, pass: false }); result.failures.push({ scenario: name, error: error.message.split('\n')[0] }); }
  }
} catch (error) { result.failures.push({ stage: 'launch', error: error.message.split('\n')[0] }); }
finally {
  if (browser) await browser.close(); await new Promise(resolve => server.close(resolve));
  assert.equal(sha(await fs.readFile(path.join(root, 'release.json'))), releaseHash, 'Candidate changed during the run');
  result.status = result.failures.length || !result.scenarios.length ? 'NEEDS_REVIEW' : `PASS_DESKTOP_${engine.toUpperCase()}_SYNTHETIC`;
  await fs.writeFile(path.join(out, 'RESULT.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ status: result.status, scenarios: result.scenarios, failures: result.failures }));
}
process.exit(result.status.startsWith('PASS_') ? 0 : 1);
