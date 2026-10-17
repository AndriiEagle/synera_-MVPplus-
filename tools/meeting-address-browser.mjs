// Actual local Chromium against synthetic account/RPC transport, never real SQL/JWT.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { handleNeon } from '../neon/worker.mjs';
import { RealJourneyStore, exchangeMaterial } from '../web_launch/real-journey-client.mjs';
import { A, B, config, fields, createFixture, origin } from './fixtures/real-journey-fixture.mjs';

const proof = 'artifacts/overnight-20261004', baseline = process.argv.includes('--baseline'), mutation = process.argv.includes('--mutate-purge');
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0, checks: {},
  scope: 'Real Chromium 390x844, synthetic accounts and RPC projection; not signed HTTP JWT, SQL via HTTP, live people or Android hardware' };
const db = createFixture(), events = [], attempts = []; db.env.SYNERA_MEETING_ADDRESS_READY = 'true';
const controls = { failWrite: 0, beforeState: null };
function addressResponse(meeting, current) {
  const latest = events.filter(e => e.kind === 'propose').at(-1), decision = events.find(e => e.proposal_id === latest?.proposal_id && e.kind !== 'propose')?.kind ?? null;
  const active = latest?.case_id === current.case_id && latest.version === current.version && latest.terms_hash === current.terms_hash;
  const approvals = db.approvals.filter(e => e.case_id === current.case_id && e.approved_version === current.version && e.approved_terms_hash === current.terms_hash && !e.withdrawn_at);
  return { schema: 'synera.meeting-address.v1', meeting_id: meeting.id, case_id: current.case_id, version: current.version, terms_hash: current.terms_hash,
    server_now: new Date().toISOString(), meeting: { status: meeting.status, proposed_at: meeting.proposed_at, duration_minutes: meeting.duration_minutes,
      meeting_place: meeting.meeting_place, meeting_address: meeting.meeting_address },
    proposal: latest ? { proposal_id: latest.proposal_id, proposer_id: latest.actor_id, address: latest.address, current: Boolean(active), decision } : null,
    agreed: Boolean(active && decision === 'accept' && meeting.meeting_address === latest.address && new Set(approvals.map(e => e.party_id)).size === 2),
    events: events.map(({ intent, ...e }) => e) };
}
async function upstream(input, init = {}) {
  if (!String(input).endsWith('/rpc/synera_meeting_address')) return db.upstream(input, init);
  const actor = new Headers(init.headers).get('Authorization')?.split('.')[1], args = JSON.parse(init.body), body = args.p_payload;
  attempts.push({ actor, body: structuredClone(body) });
  const meeting = db.meetings.find(m => m.id === args.p_meeting_id), current = db.cases.find(c => c.case_id === args.p_case_id);
  if (!meeting || !current || ![meeting.sender_id, meeting.recipient_id].includes(actor)) return Response.json({}, { status: 403 });
  if (body.version !== current.version || body.termsHash !== current.terms_hash) return Response.json({}, { status: 409 });
  if (body.action !== 'state') {
    if (controls.failWrite) { const status = controls.failWrite; controls.failWrite = 0; return Response.json({}, { status }); }
    const latest = events.filter(e => e.kind === 'propose').at(-1);
    const prior = events.find(e => e.actor_id === actor && e.intent.intentId === body.intentId);
    if (prior) { if (JSON.stringify(prior.intent) !== JSON.stringify(body)) return Response.json({}, { status: 409 }); }
    else {
      if (body.proposalId !== (latest?.proposal_id ?? null)) return Response.json({}, { status: 409 });
      if (body.action !== 'propose' && (!latest || latest.actor_id === actor || events.some(e => e.proposal_id === latest.proposal_id && e.kind !== 'propose'))) return Response.json({}, { status: 403 });
      events.push({ id: events.length + 1, case_id: current.case_id, version: current.version, terms_hash: current.terms_hash,
        actor_id: actor, kind: body.action, proposal_id: body.action === 'propose' ? body.intentId : body.proposalId,
        address: body.action === 'propose' ? body.address.trim() : null, created_at: new Date().toISOString(), intent: structuredClone(body) });
      if (body.action === 'accept') meeting.meeting_address = latest.address;
    }
  }
  const data = structuredClone(addressResponse(meeting, current));
  if (body.action === 'state' && controls.beforeState) await controls.beforeState(actor);
  return Response.json(data);
}
const fetchFor = actor => async (input, init = {}) => {
  const headers = new Headers(init.headers); headers.set('Origin', origin); headers.set('Cookie', '__Host-synera-session=' + actor);
  return handleNeon(new Request(new URL(input, origin), { ...init, headers }), db.env, upstream);
};
const server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
let browser, releaseLate;
try {
  const base = await new Promise((resolve, reject) => {
    let output = ''; const timer = setTimeout(() => reject(Error(output || 'Local server unavailable')), 20000);
    server.stdout.on('data', chunk => { output += chunk; const url = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]; if (url) { clearTimeout(timer); resolve(url); } });
    server.once('exit', code => { clearTimeout(timer); reject(Error('Server exit ' + code)); });
  });
  const stores = [new RealJourneyStore(config, fetchFor(A)), new RealJourneyStore(config, fetchFor(B))];
  for (const store of stores) await store.dashboard();
  let reviewed = await stores[0].saveTerms(B, exchangeMaterial(A, B, fields()));
  await stores[0].approveTerms(B, reviewed); reviewed = await stores[1].approveTerms(A, reviewed);
  await stores[0].sendInvitation(B, 'Зустріч для конкретного обміну', { proposed_at: new Date(Date.now() + 7200000).toISOString(), duration_minutes: 30, meeting_place: 'Zürich' });
  const meeting = db.meetings[0]; await stores[1].respondInvitation(meeting.id, 'accepted'); meeting.meeting_address = '';
  browser = await chromium.launch({ headless: true, executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE || chromium.executablePath() });
  const errors = []; let external = 0;
  async function pageFor(actor, enabled = true) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage(); page.setDefaultTimeout(8000); page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', async route => { if (new URL(route.request().url()).origin !== base) { external++; await route.abort(); } else await route.fallback(); });
    if (mutation) await page.route('**/real-journey.mjs', async route => {
      const source = await fs.readFile('web_launch/real-journey.mjs', 'utf8'), marker = /function clearPrivate\(\) \{\r?\n  clearAddress\(\); addressUI.panel.hidden = true;/;
      assert.equal([...source.matchAll(new RegExp(marker, 'g'))].length, 1);
      await route.fulfill({ contentType: 'text/javascript', body: source.replace(marker, 'function clearPrivate() {\n  addressUI.panel.hidden = true;') });
    });
    await page.route('**/config.json', route => route.fulfill({ json: { ...config, meetingAddressEnabled: enabled } }));
    await page.route('**/api/neon/**', async route => {
      const request = route.request(), url = new URL(request.url());
      const response = await fetchFor(actor)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
    });
    await page.goto(base + '/real-journey.html'); await page.waitForLoadState('networkidle'); await page.locator('#real-content-panel').waitFor({ state: 'visible' });
    return page;
  }
  const a = await pageFor(A), b = await pageFor(B);
  const ready = page => page.waitForFunction(() => !document.body.dataset.realBusy);
  const conversation = async page => { if (!await page.locator('#real-meetings-panel').evaluate(n => n.open)) await page.locator('#real-meetings-panel > summary').click(); await page.locator('#real-meetings').getByRole('button', { name: 'Відкрити розмову' }).click(); await ready(page); };
  for (const page of [a, b]) await conversation(page);
  const message = 'План обміну × Zürich 💛 <script>literal</script>';
  await a.locator('#real-message').fill(message); await a.locator('#real-message-form button').click(); await ready(a);
  await b.locator('#real-refresh').click(); await ready(b);
  assert.ok((await b.locator('#real-transcript').innerText()).includes(message)); assert.equal(await b.locator('#real-transcript script').count(), 0);
  report.checks.preserved_accepted_chat = true;
  if (!baseline) {
    assert.equal(await a.locator('#real-address').count(), 1, 'Address UI missing');
    for (const page of [a, b]) await page.locator('#real-address > summary').click();
    const reload = async page => { await page.locator('#real-address-refresh').click(); await ready(page); };
    await reload(a); assert.equal(events.length, 0); report.checks.read_does_not_vote = true;
    const propose = async (page, address) => {
      const editor = page.locator('#real-address-editor'); if (await editor.count() && !await editor.evaluate(n => n.open)) await editor.locator('summary').click();
      await page.locator('#real-address-cards [name=address]').fill(address); await page.locator('#real-address-cards [name=consent]').check();
      await page.getByRole('button', { name: 'Запропонувати адресу', exact: true }).click(); await ready(page);
    };
    const first = 'Limmatquai 12 × Zürich 💛 <script>literal</script>';
    controls.failWrite = 503; await propose(a, first);
    assert.equal(events.length, 0); assert.equal(await a.locator('#real-address-cards [name=address]').inputValue(), first);
    await a.getByRole('button', { name: 'Запропонувати адресу', exact: true }).click(); await ready(a);
    const proposals = attempts.filter(e => e.body.action === 'propose'); assert.equal(proposals[0].body.intentId, proposals[1].body.intentId);
    assert.equal(meeting.meeting_address, ''); assert.equal(await a.getByRole('button', { name: 'Погодити адресу', exact: true }).count(), 0);
    report.checks.retry_and_proposer_role = true;
    await reload(b); const accepted = b.getByRole('button', { name: 'Погодити адресу', exact: true }); assert.equal(await accepted.isEnabled(), false);
    await b.getByRole('button', { name: 'Відхилити адресу', exact: true }).click(); await ready(b);
    assert.equal(events.at(-1).kind, 'decline'); assert.equal(meeting.meeting_address, ''); report.checks.explicit_decline = true;
    await reload(a); await propose(a, 'Другий варіант, Zürich'); await reload(b);
    await b.locator('#real-address-cards [name=accept-consent]').check(); const count = events.length;
    await propose(a, 'Третій варіант — Zürich 💛'); await accepted.click(); await ready(b);
    assert.equal(events.length, count + 1, 'Stale selection caused an address decision');
    assert.equal(await b.locator('#real-address-cards').textContent(), ''); report.checks.stale_selection_requires_reload = true;
    await reload(b); assert.equal(await accepted.isEnabled(), false); await b.locator('#real-address-cards [name=accept-consent]').check(); await accepted.click(); await ready(b);
    assert.equal(events.at(-1).kind, 'accept'); assert.equal(meeting.meeting_address, 'Третій варіант — Zürich 💛');
    await reload(a); for (const page of [a, b]) assert.ok((await page.locator('#real-address-status').innerText()).includes('Погоджено обома'));
    assert.equal(await a.locator('#real-address-cards script').count(), 0); assert.equal(await a.locator('#real-address-events script').count(), 0);
    report.checks.bilateral_selected_address_and_literal_history = true;
    assert.equal(await a.evaluate(() => document.documentElement.dataset.syneraAtelier || null), null); report.checks.current_default = true;
    const layout = await a.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth })); assert.ok(layout.width <= layout.viewport); report.checks.no_overflow = layout;
    assert.deepEqual((await new AxeBuilder({ page: a }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations, []);
    await a.locator('#real-address').scrollIntoViewIfNeeded(); if (!mutation) await a.screenshot({ path: proof + '/meeting-address-current-390x844.png' });
    const preferences = a.locator('[data-atelier-controls]'); await preferences.locator('summary').click(); await preferences.getByRole('button', { name: 'Atelier 2026', exact: true }).click();
    assert.equal(await a.evaluate(() => document.documentElement.dataset.syneraAtelier), 'on');
    assert.deepEqual((await new AxeBuilder({ page: a }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations, []);
    await a.locator('#real-address').scrollIntoViewIfNeeded(); if (!mutation) await a.screenshot({ path: proof + '/meeting-address-atelier-390x844.png' });
    await preferences.getByRole('button', { name: 'Чинний', exact: true }).click(); await preferences.locator('summary').click();
    assert.equal(await a.evaluate(() => document.documentElement.dataset.syneraAtelier || null), null); assert.equal(await a.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    report.checks.axe_current_atelier_zero_and_opt_in_reversible = true;
    const closed = await pageFor(A, false); await conversation(closed); assert.equal(await closed.locator('#real-address').isHidden(), true); report.checks.closed_flag_keeps_chat = true;
    const storage = await b.evaluate(async () => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), caches: await caches.keys(), databases: await indexedDB.databases() }));
    assert.deepEqual(storage, { local: [], session: [], caches: [], databases: [] }); report.checks.no_private_storage = true;
    await a.locator('#real-logout').click(); await a.locator('#real-auth').waitFor({ state: 'visible' });
    assert.equal(await a.locator('#real-address-cards').textContent(), '', 'Private address DOM survived logout');
    assert.equal(await a.locator('#real-address-events').textContent(), ''); assert.equal(await a.locator('#real-address-status').textContent(), ''); report.checks.logout_purges_private_address = true;
    let started; const reached = new Promise(resolve => { started = resolve; }), blocked = new Promise(resolve => { releaseLate = resolve; });
    controls.beforeState = async actor => { if (actor === B) { started(); await blocked; } };
    await b.locator('#real-address-refresh').click(); await reached; await b.locator('#real-logout').click(); releaseLate(); controls.beforeState = null;
    await b.locator('#real-auth').waitFor({ state: 'visible' }); await ready(b);
    assert.equal(await b.locator('#real-address-cards').textContent(), ''); assert.equal(await b.locator('#real-address-events').textContent(), ''); report.checks.late_read_cannot_restore_private_address = true;
  } else { await a.locator('#real-logout').click(); await a.locator('#real-auth').waitFor({ state: 'visible' }); }
  assert.equal(await a.locator('#real-transcript').textContent(), ''); assert.equal(await a.locator('#real-message').inputValue(), ''); report.checks.preserved_chat_logout = true;
  assert.deepEqual(errors, []); assert.equal(external, 0); report.external_requests = external;
  report.status = baseline ? 'PASS_PRESERVED_ADDRESS_CHAT_BASELINE' : 'PASS_LOCAL_MEETING_ADDRESS_BROWSER';
  const names = ['web_launch/real-journey.html', 'web_launch/real-journey.mjs', 'web_launch/real-journey.css', 'web_launch/real-journey-client.mjs', 'web_launch/neon-store.mjs', 'tools/fixtures/real-journey-fixture.mjs', 'tools/meeting-address-browser.mjs'];
  report.source_sha256 = Object.fromEntries(await Promise.all(names.map(async name => [name, createHash('sha256').update(await fs.readFile(name)).digest('hex')])));
} catch (error) { report.error = error.message; throw error; }
finally { releaseLate?.(); if (browser) await browser.close(); server.kill(); await fs.writeFile(proof + '/' + (baseline ? 'MEETING_ADDRESS_UI_BASELINE' : mutation ? 'MEETING_ADDRESS_UI_MUTATION' : process.argv.includes('--red') ? 'MEETING_ADDRESS_UI_RED' : 'MEETING_ADDRESS_BROWSER') + '.json', JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, checks: report.checks, external_requests: report.external_requests }));
