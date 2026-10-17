// Real clicks in a desktop browser against a built candidate, two separate sign-ins.
// Fact under test: on the main page the draft terms and a person's confirmation live only in that tab. Two
// people can each confirm the very same terms in their own sign-in and neither ever sees the other's
// confirmation, so the «discuss collaboration» button there can never open.
// Invariant: a card must not leave a person waiting at that button. It says where the two confirmations
// really happen and links there (the two-person page), in every language.
// Not physical phones, live accounts, JWT or RLS proof.
// Usage: node tools/people-gate-browser.mjs --candidate=web_launch/dist-neon-<name> --out=<dir> [--engine=chromium|webkit]
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
const result = { scope: 'Desktop browser, two sign-ins, synthetic Auth/Data fixture through the real gateway code. No physical phone, live account, JWT or RLS proof.',
  candidate: path.basename(root), releaseHash, engine: null, facts: {}, checks: [], failures: [], provider_calls: 0, usd: 0 };
const check = (name, pass, detail) => { result.checks.push({ name, pass: Boolean(pass), ...(detail === undefined ? {} : { detail }) }); };

let browser;
try {
  const executablePath = engine === 'chromium' ? process.env.SYNERA_CHROMIUM || undefined : undefined;
  browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, timeout: 30000, ...(executablePath ? { executablePath } : {}) });
  result.engine = { name: engine, version: browser.version() };
  const db = createFixture();
  for (const profile of db.profiles) { profile.display_name = { [A]: 'Andrii Test', [C]: 'Oleh Test' }[profile.id] || profile.display_name; profile.brief.goal = 'Check one concrete result for the business'; }
  async function signIn(actor, language = 'uk') {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'uk-UA' });
    context.setDefaultTimeout(12000);
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    await context.route('**/config.json', route => route.fulfill({ json: config }));
    await context.route('**/api/neon/**', async route => { const request = route.request(), url = new URL(request.url());
      if (url.pathname === '/api/neon/health') { await route.fulfill({ json: { authGateway: 'reachable', backend: 'neon', policyVersion: POLICY_VERSION } }); return; }
      const response = await db.fetchFor(actor)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() }); });
    const page = await context.newPage(); await page.goto(base + '/' + (language === 'uk' ? '' : '?lang=' + language)); await page.waitForTimeout(1500);
    const guide = page.locator('.tour-panel'); for (let step = 0; step < 8 && await guide.isVisible(); step++) await guide.locator('.actions button').nth(1).click();
    // The two permissions are in-memory switches; with them on, the business case and the invitation gate are shown.
    await page.locator('nav [data-tab="settings"]').click(); await page.locator('#consent-comparison').check(); await page.locator('#consent-introduction').check(); await page.locator('nav [data-tab="people"]').click();
    return page;
  }
  const card = (page, peer) => page.locator('#person-' + peer);
  const read = (page, peer) => card(page, peer).evaluate(node => {
    const invite = [...node.querySelectorAll('button')].find(button => button.textContent.includes('↗'));
    const hash = (node.textContent.match(/SHA-256: ([a-f0-9]{8})/g) || []);
    const link = node.querySelector('a:is([href="/real-journey.html"],[href^="/real-journey.html?"])');
    return { inviteDisabled: invite ? invite.disabled : null, confirmations: (node.textContent.match(/умови підтверджені · версія/g) || []).length, hashes: [...new Set(hash)], link: link ? { text: link.textContent.trim(), visible: link.checkVisibility() } : null,
      text: node.innerText.slice(0, 4000) };
  });
  // Each person fills the same draft terms and confirms them in their own sign-in.
  async function confirm(page, peer) {
    await card(page, peer).locator('details').evaluateAll(list => list.forEach(node => { node.open = true; }));
    await card(page, peer).evaluate(node => { for (const control of node.querySelectorAll('select, input:not([type=checkbox])')) { if (control.readOnly || control.disabled) continue;
      if (control.tagName === 'SELECT') { const options = [...control.options].filter(item => item.value && item.value !== 'unresolved'); const pick = options.find(item => /exchange|hours|shared|required|mutual/.test(item.value)) || options[0]; if (pick) control.value = pick.value; }
      else if (control.name !== 'amount' && (control.inputMode === 'numeric' || control.type === 'number')) control.value = '2';
      control.dispatchEvent(new Event('input', { bubbles: true })); control.dispatchEvent(new Event('change', { bubbles: true })); } });
    // These two sign-ins use the default Ukrainian page, so the buttons are found by their Ukrainian labels.
    await card(page, peer).locator('button').filter({ hasText: 'Оновити умови чернетки' }).click(); await page.waitForTimeout(500);
    await card(page, peer).locator('details').evaluateAll(list => list.forEach(node => { node.open = true; }));
    await card(page, peer).locator('button').filter({ hasText: 'Підтвердити умови' }).click(); await page.waitForTimeout(500);
  }
  const a = await signIn(A), c = await signIn(C);
  await confirm(a, C); await confirm(c, A);
  const mineA = await read(a, C), mineC = await read(c, A);
  await a.locator('#refresh').click(); await a.waitForTimeout(1200);
  await card(a, C).locator('details').evaluateAll(list => list.forEach(node => { node.open = true; }));
  const afterA = await read(a, C);
  result.facts = { sameTermsHashInBothSignIns: mineA.hashes.length === 1 && mineC.hashes.length === 1 && mineA.hashes[0] === mineC.hashes[0], hash: mineA.hashes[0] || null,
    confirmationsSeenByEach: [afterA.confirmations, mineC.confirmations], inviteStillOff: afterA.inviteDisabled === true && mineC.inviteDisabled === true,
    serverCases: db.cases.length, serverApprovals: db.approvals.length, serverWrites: db.requests.filter(row => row.method !== 'GET').length };
  check('both people confirmed the same terms, each in their own sign-in', result.facts.sameTermsHashInBothSignIns, result.facts.hash);
  check('neither sees the other\'s confirmation; nothing reached the server; the button stays off', afterA.confirmations === 1 && mineC.confirmations === 1 && result.facts.inviteStillOff && result.facts.serverCases === 0 && result.facts.serverWrites === 0, result.facts);
  // The invariant: the card names the page where this really happens and links there.
  check('the card links to the two-person page', afterA.link?.visible === true, afterA.link);
  check('the card does not promise that this button opens after both confirm here', !/підтвердять чернетку умов у власних входах/.test(afterA.text), null);
  await card(a, C).locator('a:is([href="/real-journey.html"],[href^="/real-journey.html?"])').first().scrollIntoViewIfNeeded().catch(() => {}); await a.screenshot({ path: path.join(out, 'uk-card.png') });
  if (afterA.link) { await card(a, C).locator('a:is([href="/real-journey.html"],[href^="/real-journey.html?"])').first().click(); await a.locator('#real-content-panel').waitFor({ state: 'visible' }).then(() => check('the link opens the two-person page, signed in', true), () => check('the link opens the two-person page, signed in', false)); }
  // The same in German: the explanation and the link are readable.
  const german = await signIn(A, 'de'); await german.waitForFunction(() => document.documentElement.lang === 'de'); await german.waitForTimeout(400);
  const de = await read(german, C);
  check('German: the card links to the two-person page with a German label', de.link?.visible === true && !/[Ѐ-ӿ]/.test(de.link.text), de.link);
  check('German: no Ukrainian text in the card', !/[Ѐ-ӿ]/.test(de.text), (de.text.match(/[^\n]*[Ѐ-ӿ][^\n]*/) || [null])[0]);
  await card(german, C).locator('a:is([href="/real-journey.html"],[href^="/real-journey.html?"])').first().scrollIntoViewIfNeeded().catch(() => {}); await german.screenshot({ path: path.join(out, 'de-card.png') });
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
