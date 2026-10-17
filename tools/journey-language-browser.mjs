// Real clicks in a desktop browser against a built candidate: the whole two-person path in German and in
// English, with Ukrainian as the control. Fixture content is Latin, so any Cyrillic left on the page in
// German or English is an untranslated product string.
// Invariants: (1) no Ukrainian text is left anywhere on the page, in controls, labels, titles or generated
// drafts; (2) the choice survives a reload and is not taken from the browser locale; (3) switching language
// keeps unsent text, ticked boxes and the very same card nodes, and sends nothing; (4) the same form gives
// the same terms hash in every language; (5) the narrow phone layout does not start to scroll sideways.
// Not physical phones, live accounts, JWT or RLS proof. The address step uses a small in-tool model.
// Usage: node tools/journey-language-browser.mjs --candidate=web_launch/dist-neon-<name> --out=<dir> [--engine=chromium|webkit]
import { chromium, webkit } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { A, B, C, O, config, fields, day } from './fixtures/real-journey-fixture.mjs';
import { createOutcomeFixture } from './fixtures/case-outcome-fixture.mjs';

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
const settings = { ...config, caseOutcomesEnabled: true, meetingAddressEnabled: true };
const names = { [A]: 'Andrii Test', [B]: 'Maria Test', [C]: 'Oleh Test', [O]: 'Outside Test' };
const terms = () => fields({ give_target: 'One working prototype', take_target: 'One reviewed screen', give_criteria: 'Opens and runs the agreed scenario',
  take_criteria: 'Both reviewed the screen on a phone', give_amount: '3', give_unit: 'hours' });
const runs = [
  { language: 'uk', width: 390, height: 844 }, { language: 'de', width: 390, height: 844 }, { language: 'en', width: 390, height: 844 },
  { language: 'de', width: 320, height: 568 },
];
const result = { scope: 'Desktop browser, synthetic Auth/Data fixture through the real gateway code; the address step is an in-tool model. No physical phone, live account, JWT or RLS proof.',
  candidate: path.basename(root), releaseHash, engine: null, runs: [], problems: [], failures: [], provider_calls: 0, usd: 0 };

async function journey(browser, { language, width, height }) {
  const label = `${language}-${width}`, latin = language !== 'uk';
  const db = createOutcomeFixture(), addressEvents = []; let actor = A;
  for (const profile of db.profiles) if (names[profile.id]) profile.display_name = names[profile.id];
  const run = { run: label, steps: [], termsHash: null }; result.runs.push(run);
  // The browser itself stays Ukrainian: the page language must come from the person's choice, not from here.
  const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'uk-UA', acceptDownloads: true });
  context.setDefaultTimeout(12000);
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await context.route('**/config.json', route => route.fulfill({ json: settings }));
  let refuseMessages = false;
  await context.route('**/api/neon/**', async route => {
    const request = route.request(), url = new URL(request.url());
    if (refuseMessages && request.method() === 'POST' && url.pathname.endsWith('/data/meeting_messages')) { await route.fulfill({ status: 400, json: { error: 'data_unavailable', status: 400 } }); return; }
    const address = url.pathname.match(/\/meeting-address\/([a-f0-9-]{36})\/([A-Za-z0-9_:-]{1,64})$/);
    if (address) { await route.fulfill(addressModel(db, addressEvents, actor, address[1], address[2], JSON.parse(request.postData()))); return; }
    const response = await db.fetchFor(actor)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  const page = await context.newPage();
  const ready = () => page.waitForFunction(() => !document.body.dataset.realBusy);
  const load = async (query = '') => { await page.goto(base + '/real-journey.html' + query); await page.locator('#real-content-panel').waitFor({ state: 'visible' }); await ready(); };
  const peer = async name => { const panel = page.locator('#real-people-panel'); if (!await panel.evaluate(node => node.open)) await panel.locator('summary').first().click(); await page.locator('#real-people article').filter({ hasText: name }).getByRole('button').click(); await ready(); };
  const conversation = async () => { const panel = page.locator('#real-meetings-panel'); if (!await panel.evaluate(node => node.open)) await panel.locator('summary').first().click(); await page.locator('#real-meetings article button').last().click(); await ready(); };
  const outcomes = async () => { await page.locator('#real-outcome-refresh').click(); await ready(); };
  const card = index => page.locator(`#real-outcome-cards article[data-outcome-index="${index}"]`);
  const shot = name => page.screenshot({ path: path.join(out, `${label}-${name}.png`), fullPage: true });
  // Everything a person or a screen reader can meet on the page, hidden sections included.
  const scan = async step => {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); // let the page finish laying out
    const seen = await page.evaluate(() => {
      const cyrillic = /[Ѐ-ӿ]/, hits = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) if (cyrillic.test(node.nodeValue) && !node.parentElement.closest('#real-language')) hits.push(node.nodeValue.trim().slice(0, 90));
      for (const element of document.body.querySelectorAll('[aria-label],[placeholder],[title]')) {
        if (element.id === 'real-language') continue;
        for (const name of ['aria-label', 'placeholder', 'title']) { const value = element.getAttribute(name); if (value && cyrillic.test(value)) hits.push(`${name}=${value.slice(0, 90)}`); }
      }
      if (cyrillic.test(document.title)) hits.push('title=' + document.title);
      for (const field of document.querySelectorAll('textarea,input[type=text]')) if (cyrillic.test(field.value)) hits.push('value=' + field.value.slice(0, 90));
      return { hits, lang: document.documentElement.lang, status: document.getElementById('real-status').textContent, sideways: document.documentElement.scrollWidth - innerWidth,
        statusHeight: Math.round(document.getElementById('real-status').getBoundingClientRect().height), reserved: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0, viewport: innerHeight };
    });
    run.steps.push({ step, status: seen.status.slice(0, 110), ukrainianLeft: latin ? seen.hits.length : null, sideways: seen.sideways, statusHeight: seen.statusHeight, reserved: seen.reserved });
    // The pinned status line must leave room: a control scrolled into view (keyboard focus, a link target) stops below it.
    if (seen.statusHeight > seen.reserved) result.problems.push({ run: label, step, problem: `status line (${seen.statusHeight}px) is taller than the space reserved for it (${seen.reserved}px)` });
    if (seen.statusHeight > seen.viewport / 3) result.problems.push({ run: label, step, problem: 'status takes more than a third of the screen' });
    if (seen.lang !== language) result.problems.push({ run: label, step, problem: `document language is ${seen.lang}` });
    if (latin && seen.hits.length) result.problems.push({ run: label, step, problem: 'Ukrainian text left on the page', sample: seen.hits.slice(0, 6) });
    if (!latin && !/[Ѐ-ӿ]/.test(seen.status)) result.problems.push({ run: label, step, problem: 'the Ukrainian page lost its Ukrainian status text', status: seen.status });
    if (!seen.status.trim()) result.problems.push({ run: label, step, problem: 'empty status line' });
    if (seen.sideways > 1) result.problems.push({ run: label, step, problem: `page scrolls sideways by ${seen.sideways}px` });
    return seen;
  };
  try {
    // (2) An explicit link chooses the language once; later loads carry no parameter.
    await load('?lang=' + language); await scan('first paint');
    assert.equal(await page.locator('#real-language').inputValue(), language);
    await peer(names[B]); await scan('new terms');
    const form = page.locator('#real-terms-form');
    for (const mode of ['joint_project', 'referral', 'hybrid', 'paid_service']) { await form.locator('[name=mode]').selectOption(mode); await scan('mode note: ' + mode); }
    await form.locator('[name=compensation_status]').selectOption('agreed_money'); await scan('money fields');
    await form.locator('[name=mode]').selectOption('exchange');
    for (const [name, value] of Object.entries(terms())) { const field = form.locator(`[name="${name}"]`); if (await field.evaluate(node => node.tagName === 'SELECT')) await field.selectOption(value); else await field.fill(value); }
    // A refusal raised deep in shared code has no translation of its own: the person still gets a next step they can read.
    await form.locator('[name=starts_on]').fill(day(7)); await form.locator('[name=due_on]').fill(day(1));
    await form.locator('button[type=submit]').click(); await ready(); await scan('refused dates');
    assert.equal(db.cases.length, 0, 'terms with an end before the start were saved');
    await form.locator('[name=starts_on]').fill(day(1)); await form.locator('[name=due_on]').fill(day(7)); await shot('1-terms-form');
    await form.locator('button[type=submit]').click(); await ready(); await scan('saved revision'); await shot('2-review');
    run.termsHash = db.cases[0].terms_hash;
    await page.locator('#real-approve-check').check(); await page.locator('#real-approve').click(); await ready(); await scan('own approval');
    actor = B; await load(); await scan('second person, no parameter');
    await peer(names[A]); await page.locator('#real-approve-check').check(); await page.locator('#real-approve').click(); await ready(); await scan('both approved');
    actor = A; await load(); await peer(names[B]);
    const invite = page.locator('#real-invite-form');
    await invite.locator('[name=note]').fill('Discuss the reviewed screen'); await invite.locator('[name=proposed_at]').fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    // The place list shows «online» in the chosen language but keeps storing the one canonical value.
    const online = invite.locator('[name=meeting_place] option').first();
    assert.equal(await online.getAttribute('value'), 'Онлайн'); assert.equal(/[\u0400-\u04FF]/.test(await online.textContent()), !latin);
    await invite.locator('[name=meeting_place]').selectOption('Zürich'); await invite.getByRole('button').click(); await ready(); await scan('invitation sent');
    assert.equal(db.meetings[0].meeting_place, 'Zürich');
    actor = B; await load(); await scan('invitation received'); await shot('3-meetings');
    await page.locator('#real-meetings article button').first().click(); await ready(); await scan('invitation accepted');
    assert.equal(db.meetings[0].status, 'accepted'); db.meetings[0].meeting_address = '';
    await conversation(); await scan('conversation opened');
    await page.locator('#real-message').fill('Hello! Let us agree on the first step.'); await page.locator('#real-message-form button').click(); await ready(); await scan('message sent');
    refuseMessages = true; await page.locator('#real-message').fill('A text the server will refuse'); await page.locator('#real-message-form button').click(); await ready(); await scan('refused message');
    assert.equal(await page.locator('#real-message').inputValue(), 'A text the server will refuse'); refuseMessages = false; await page.locator('#real-message').fill('');
    // Address: proposed by one person, agreed by the other.
    await page.locator('#real-address > summary').click(); await page.locator('#real-address-refresh').click(); await ready(); await scan('address: nothing proposed');
    const propose = page.locator('#real-address-cards form');
    await propose.locator('[name=address]').fill('Bahnhofstrasse 1, 8001 Zürich'); await propose.locator('[name=consent]').check(); await propose.locator('button[type=submit]').click(); await ready(); await scan('address proposed');
    actor = A; await load(); await conversation(); await page.locator('#real-address > summary').click(); await page.locator('#real-address-refresh').click(); await ready(); await scan('address to decide');
    await page.locator('#real-address-cards [name=accept-consent]').check(); await page.locator('#real-address-cards .real-actions button').first().click(); await ready(); await scan('address agreed'); await shot('4-chat-and-address');
    assert.equal(await page.locator('#real-address-route').isVisible(), true);
    // Results: evidence, check, dispute, acceptance.
    const legs = db.cases[0].material.trial.deliverables, mine = legs.findIndex(leg => leg.giver_id === A), theirs = legs.findIndex(leg => leg.giver_id === B);
    await outcomes(); await scan('results: waiting for evidence');
    await card(mine).locator('[name=evidenceUri]').fill('https://example.invalid/prototype'); await card(mine).locator('button[type=submit]').click(); await ready(); await scan('evidence submitted');
    actor = B; await load(); await conversation(); await outcomes();
    await card(theirs).locator('[name=evidenceUri]').fill('https://example.invalid/screen'); await card(theirs).locator('button[type=submit]').click(); await ready();
    await card(mine).locator('[name=scopeNotes]').fill('Opens on a phone and runs the scenario'); await card(mine).locator('form').first().locator('button[type=submit]').click(); await ready(); await scan('result checked');
    await card(mine).locator('.real-check input').check(); await card(mine).locator(':scope > button').click(); await ready(); await scan('result accepted');
    actor = A; await load(); await conversation(); await outcomes();
    await card(theirs).locator('[name=scopeNotes]').fill('The screen does not open on a phone yet'); await card(theirs).locator('form').first().locator('button[type=submit]').click(); await ready();
    await card(theirs).locator('[name=reason]').selectOption('below_acceptance_criteria'); await card(theirs).locator('form').last().locator('button[type=submit]').click(); await ready(); await scan('dispute opened by me');
    actor = B; await load(); await conversation(); await outcomes(); await scan('dispute seen by the giver'); await shot('5-results-dispute');
    actor = A; await load(); await conversation(); await outcomes();
    await card(theirs).locator('.real-check input').check(); await card(theirs).locator(':scope > button').click(); await ready(); await scan('all results accepted');
    // Private copy and private social draft are generated text: they follow the language too.
    await page.locator('#real-outcome-export-controls > summary').click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#real-outcome-export').click()]); await ready(); await download.cancel().catch(() => {}); await scan('private copy');
    await page.locator('#real-social-controls > summary').click(); await page.locator('#real-social-consent').check();
    for (const wording of ['general', 'linkedin']) {
      await page.locator('#real-social-wording').selectOption(wording); await page.locator('#real-social-consent').check(); await page.locator('#real-social-create').click(); await ready();
      const draft = await page.locator('#real-social-text').inputValue();
      assert.ok(draft.includes('One working prototype'), 'the draft lost the accepted result');
      assert.equal(draft.split('\n').filter(Boolean).length, 3, 'the draft lost its heading or its honesty note');
      await scan('social draft: ' + wording);
    }
    await shot('6-results-accepted');
    // The view switcher belongs to another module; its labels and its own status follow the language.
    await page.locator('[data-atelier-controls] > summary').click(); await page.locator('.atelier-mode-choice button').nth(1).click(); await scan('Atelier on');
    const viewStatus = await page.locator('[data-atelier-controls] [role=status]').textContent();
    assert.ok(viewStatus.trim() && /[Ѐ-ӿ]/.test(viewStatus) === !latin, 'view switcher status is in the wrong language: ' + viewStatus);
    await page.locator('.atelier-mode-choice button').nth(0).click(); await scan('Current view back');
    await page.locator('[data-atelier-controls] > summary').click(); // close the panel: on a narrow screen it lies over the page
    // (3) Switching language keeps the person's unfinished work and sends nothing.
    await page.locator('#real-message').fill('Unsent draft text');
    await page.locator('#real-address > summary').click(); await page.locator('#real-address-refresh').click(); await ready();
    await page.locator('#real-address-editor > summary').click();
    const again = page.locator('#real-address-editor form');
    await again.locator('[name=address]').fill('Another place 5'); await again.locator('[name=consent]').check();
    const writes = () => db.requests.filter(row => row.method !== 'GET').length + addressEvents.length;
    const before = { writes: writes(), status: await page.locator('#real-status').textContent() };
    await page.evaluate(() => { window.__kept = [document.querySelector('#real-address-editor [name=address]'), document.querySelector('#real-outcome-cards article'), document.querySelector('#real-transcript article')]; });
    const kept = async () => page.evaluate(() => ({ draft: document.getElementById('real-message').value, address: document.querySelector('#real-address-editor [name=address]').value,
      consent: document.querySelector('#real-address-editor [name=consent]').checked, button: !document.querySelector('#real-address-editor button[type=submit]').disabled,
      sameNodes: window.__kept.every((node, index) => node && node === [document.querySelector('#real-address-editor [name=address]'), document.querySelector('#real-outcome-cards article'), document.querySelector('#real-transcript article')][index]),
      status: document.getElementById('real-status').textContent, lang: document.documentElement.lang }));
    const others = ['uk', 'de', 'en'].filter(code => code !== language);
    for (const code of [...others, language]) {
      await page.locator('#real-language').selectOption(code);
      const state = await kept();
      assert.deepEqual({ draft: state.draft, address: state.address, consent: state.consent, button: state.button, sameNodes: state.sameNodes, lang: state.lang },
        { draft: 'Unsent draft text', address: 'Another place 5', consent: true, button: true, sameNodes: true, lang: code }, 'switching to ' + code + ' disturbed unfinished work');
      assert.equal(/[Ѐ-ӿ]/.test(state.status), code === 'uk', `status line after switching to ${code}: ${state.status}`);
      if (code !== language) assert.notEqual(state.status, before.status, 'the status line did not follow the language');
    }
    assert.equal((await kept()).status, before.status, 'the status line did not return to the original wording');
    assert.equal(writes(), before.writes, 'switching language sent a write');
    await scan('after switching away and back');
    // A real session loss still signs out, in the chosen language, and the choice survives it.
    db.revoked.add(A);
    // Existing background polling may observe revocation while Playwright scrolls to Refresh.
    // Both paths must show the same signed-out state; don't fail a correct automatic closure
    // merely because it removed the button before the manual click became actionable.
    const refresh = page.locator('#real-refresh').click().then(() => 'manual refresh', async error => {
      if (await page.locator('#real-auth').isVisible()) return 'existing background poll';
      throw error;
    });
    await page.locator('#real-auth').waitFor({ state: 'visible' });
    await scan('session lost via ' + await refresh);
    assert.equal(await page.locator('#real-content-panel').isHidden(), true);
    run.pass = true;
  } catch (error) { run.pass = false; result.failures.push({ run: label, error: error.message.replace(/\u001b\[\d+m/g, '').split('\n').slice(0, 8).join(' | ') }); await shot('failure').catch(() => {}); }
  finally { await context.close(); }
}

// A minimal model of the address action, enough to walk its screens. The database is its real authority.
function addressModel(db, events, actor, meetingId, caseId, body) {
  const meeting = db.meetings.find(row => row.id === meetingId), current = db.cases.find(row => row.case_id === caseId);
  if (!meeting || !current || ![meeting.sender_id, meeting.recipient_id].includes(actor)) return { status: 403, json: {} };
  if (body.version !== current.version || body.termsHash !== current.terms_hash) return { status: 409, json: {} };
  const latest = () => events.filter(event => event.kind === 'propose').at(-1);
  if (body.action !== 'state' && !events.some(event => event.intentId === body.intentId)) {
    const open = latest();
    if (body.action !== 'propose' && (!open || open.actor_id === actor || events.some(event => event.proposal_id === open.proposal_id && event.kind !== 'propose'))) return { status: 403, json: {} };
    events.push({ id: events.length + 1, case_id: current.case_id, version: current.version, terms_hash: current.terms_hash, actor_id: actor, kind: body.action,
      proposal_id: body.action === 'propose' ? body.intentId : open.proposal_id, address: body.action === 'propose' ? body.address.trim() : null, created_at: new Date().toISOString(), intentId: body.intentId });
    if (body.action === 'accept') meeting.meeting_address = open.address;
  }
  const open = latest(), decision = events.find(event => event.proposal_id === open?.proposal_id && event.kind !== 'propose')?.kind ?? null;
  const approvals = db.approvals.filter(row => row.case_id === current.case_id && row.approved_version === current.version && row.approved_terms_hash === current.terms_hash && !row.withdrawn_at);
  return { status: 200, json: { schema: 'synera.meeting-address.v1', meeting_id: meeting.id, case_id: current.case_id, version: current.version, terms_hash: current.terms_hash, server_now: new Date().toISOString(),
    meeting: { status: meeting.status, proposed_at: meeting.proposed_at, duration_minutes: meeting.duration_minutes, meeting_place: meeting.meeting_place, meeting_address: meeting.meeting_address },
    proposal: open ? { proposal_id: open.proposal_id, proposer_id: open.actor_id, address: open.address, current: true, decision } : null,
    agreed: Boolean(open && decision === 'accept' && meeting.meeting_address === open.address && new Set(approvals.map(row => row.party_id)).size === 2),
    events: events.map(({ intentId, ...event }) => event) } };
}

// With the pilot switched off there is no data at all: the explanation still has to be readable.
async function closedDoor(browser, language) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'uk-UA' });
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await context.route('**/config.json', route => route.fulfill({ json: { ...config, realJourneyEnabled: false } }));
  const page = await context.newPage();
  try {
    await page.goto(base + '/real-journey.html?lang=' + language); await page.locator('#real-blocked').waitFor({ state: 'visible' });
    const text = await page.locator('main').innerText();
    if (/[Ѐ-ӿ]/.test(text.replace('Українська', '')) !== (language === 'uk')) result.problems.push({ run: 'closed-' + language, problem: 'closed-door page is in the wrong language', sample: text.slice(0, 160) });
  } catch (error) { result.failures.push({ run: 'closed-' + language, error: error.message.split('\n')[0] }); }
  finally { await context.close(); }
}

let browser;
try {
  const executablePath = engine === 'chromium' ? process.env.SYNERA_CHROMIUM || undefined : undefined;
  browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, timeout: 30000, ...(executablePath ? { executablePath } : {}) });
  result.engine = { name: engine, version: browser.version() };
  for (const view of runs) await journey(browser, view);
  for (const language of ['uk', 'de', 'en']) await closedDoor(browser, language);
  // (4) Language is presentation only.
  const hashes = new Set(result.runs.map(run => run.termsHash));
  if (hashes.size !== 1 || hashes.has(null)) result.problems.push({ problem: 'terms hash differs between languages', hashes: [...hashes] });
} catch (error) { result.failures.push({ stage: 'launch', error: error.message.split('\n')[0] }); }
finally {
  if (browser) await browser.close(); await new Promise(resolve => server.close(resolve));
  assert.equal(sha(await fs.readFile(path.join(root, 'release.json'))), releaseHash, 'Candidate changed during the run');
  const steps = result.runs.flatMap(run => run.steps);
  result.summary = { runs: result.runs.length, passed: result.runs.filter(run => run.pass).length, steps: steps.length, tallestStatus: Math.max(0, ...steps.map(step => step.statusHeight || 0)),
    ukrainianLeft: steps.reduce((sum, step) => sum + (step.ukrainianLeft || 0), 0), sideways: steps.filter(step => step.sideways > 1).length,
    oneTermsHash: new Set(result.runs.map(run => run.termsHash)).size === 1, problems: result.problems.length, failures: result.failures.length };
  result.status = result.failures.length || result.problems.length || result.summary.passed !== runs.length ? 'NEEDS_REVIEW' : `PASS_DESKTOP_${engine.toUpperCase()}_SYNTHETIC`;
  await fs.writeFile(path.join(out, 'RESULT.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ status: result.status, ...result.summary, sample: result.problems.slice(0, 6), failures: result.failures }));
}
process.exit(result.status.startsWith('PASS_') ? 0 : 1);
