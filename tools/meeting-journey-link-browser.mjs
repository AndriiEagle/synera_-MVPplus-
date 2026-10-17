// Extend accepted address/chat oracle with actual main-app -> selected-room clicks.
// The URL hint is never permission. All accounts/RPC replies here are synthetic.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url)), proof = 'artifacts/overnight-20261004/journey-link';
const red = process.argv.includes('--red'), mutation = process.argv.includes('--mutate-hint');
const hash = b => createHash('sha256').update(b).digest('hex'), originalName = 'tools/meeting-address-browser.mjs';
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Actual local Chromium, same synthetic account fixture across main app and private journey; not SQL/JWT, real accounts, Android or providers' };
await fs.mkdir(path.join(root, proof), { recursive: true });
let source = await fs.readFile(path.join(root, originalName), 'utf8');
const replace = (needle, replacement) => { assert.equal(source.split(needle).length, 2, 'Oracle seam drift: ' + needle); source = source.replace(needle, replacement); };
replace("'artifacts/overnight-20261004'", JSON.stringify(proof));
replace("'MEETING_ADDRESS_BROWSER'", JSON.stringify(mutation ? 'HINT_MUTATION_DETAIL' : 'MEETING_ADDRESS_BROWSER'));
replace('report.error = error.message; throw error;', 'report.error = error.message; report.stack = error.stack; throw error;');
replace('const controls = { failWrite: 0, beforeState: null };', 'const controls = { failWrite: 0, beforeState: null }; const apiReads = [];');
// The health endpoint probes Auth without a session. Model its reachable,
// signed-out response without granting any account to that anonymous probe.
replace('async function upstream(input, init = {}) {', `async function upstream(input, init = {}) {
  if (String(input).endsWith('/get-session') && !new Headers(init.headers).has('Cookie')) return Response.json({});`);
replace('async function pageFor(actor, enabled = true) {', "async function pageFor(actor, enabled = true, pathname = '/real-journey.html', fragment = '', signedIn = true, rejectedHint = false) {");
replace('    const page = await context.newPage();', `    await context.addInitScript(() => {
      localStorage.setItem('synera.first-user-tour.v1', 'done'); window.__gpsStarts = 0;
      navigator.geolocation.watchPosition = () => { window.__gpsStarts++; throw new Error('Unexpected GPS capture'); };
    });
    const page = await context.newPage(), pageId = crypto.randomUUID(); page.__fixturePageId = pageId;`);
replace('    if (mutation) await page.route', `    if (process.argv.includes('--mutate-hint')) await page.route('**/real-journey.mjs', async route => {
      const canonical = await fs.readFile('web_launch/real-journey.mjs', 'utf8');
      const marker = "if (!meeting || meeting.status !== 'accepted' || ![meeting.sender_id, meeting.recipient_id].includes(state.dashboard.own.id))";
      assert.equal(canonical.split(marker).length, 2);
      await route.fulfill({ contentType: 'text/javascript', body: canonical.replace(marker, 'if (false)') });
    });
    if (mutation) await page.route`);
replace('      const request = route.request(), url = new URL(request.url());', `      const request = route.request(), url = new URL(request.url());
      apiReads.push({ actor, page_id: pageId, path: url.pathname + url.search, page_url: page.url(), method: request.method() });`);
replace("    await page.goto(base + '/real-journey.html'); await page.waitForLoadState('networkidle'); await page.locator('#real-content-panel').waitFor({ state: 'visible' });", `    await page.goto(base + pathname + fragment); await page.waitForLoadState('networkidle');
    if (pathname === '/') {
      try { await page.locator('#workspace:not([hidden])').waitFor(); }
      catch (error) { await fs.writeFile(proof + '/ENTRY_SETUP_FAILURE.json', JSON.stringify({ errors, apiReads, text: await page.locator('body').innerText() }, null, 2)); throw error; }
    }
    else if (rejectedHint) await page.waitForFunction(() => ['real-content-panel', 'real-blocked', 'real-auth'].some(id => !document.getElementById(id).hidden));
    else await page.locator(signedIn ? '#real-content-panel' : '#real-auth').waitFor({ state: 'visible' });`);
replace('  const a = await pageFor(A), b = await pageFor(B);', `  const entryMessage = 'Саме вибрана розмова × Zürich 💛';
  const decoyId = crypto.randomUUID(), pendingId = crypto.randomUUID(), cancelledId = crypto.randomUUID(), foreignId = crypto.randomUUID();
  const extraMeetings = [
    { ...structuredClone(meeting), id: decoyId },
    { ...structuredClone(meeting), id: pendingId, status: 'pending' },
    { ...structuredClone(meeting), id: cancelledId, status: 'cancelled' },
    { ...structuredClone(meeting), id: foreignId, sender_id: '33333333-3333-4333-8333-333333333333', recipient_id: '99999999-9999-4999-8999-999999999999' },
  ];
  db.meetings.unshift(...extraMeetings);
  db.messages.push({ id: crypto.randomUUID(), meeting_id: meeting.id, sender_id: B, body: entryMessage, created_at: new Date().toISOString() },
    { id: crypto.randomUUID(), meeting_id: decoyId, sender_id: B, body: 'WRONG ROOM', created_at: new Date().toISOString() });
  const unchanged = JSON.stringify({ approvals: db.approvals, cases: db.cases, meetings: db.meetings, messages: db.messages, events });
  const main = await pageFor(A, true, '/'); await main.locator('[data-tab="meetings"]').click();
  const location = main.locator('.meeting-location[data-meeting-id="' + meeting.id + '"]'); await location.locator('summary').click();
  const link = location.getByRole('link', { name: 'Погодити адресу в приватній розмові', exact: true });
  await link.click(); await main.waitForURL(base + '/real-journey.html*'); await main.waitForLoadState('networkidle');
  assert.equal(await main.locator('#real-conversation').isVisible(), true, 'Selected GPS link did not open the conversation');
  assert.ok((await main.locator('#real-transcript').innerText()).includes(entryMessage), 'Wrong meeting selected');
  assert.ok(!(await main.locator('#real-transcript').innerText()).includes('WRONG ROOM'));
  assert.equal(await main.evaluate(() => location.hash), '');
  assert.equal(await main.locator('#real-address').evaluate(n => n.open), true);
  assert.equal(await main.locator('#real-address-cards [name=consent]').isChecked(), false);
  assert.equal(await main.evaluate(() => window.__gpsStarts), 0); report.checks.exact_main_app_to_selected_conversation = true;
  await main.screenshot({ path: proof + '/selected-conversation-390x844.png', fullPage: true });
  const direct = await pageFor(B, true, '/real-journey.html', '#meeting=' + meeting.id.toUpperCase());
  assert.equal(await direct.locator('#real-conversation').isVisible(), true); assert.ok((await direct.locator('#real-transcript').innerText()).includes(entryMessage));
  assert.equal(await direct.evaluate(() => location.hash), ''); report.checks.recipient_and_normalized_uuid_hint = true;
  for (const fragment of ['#meeting=' + cancelledId, '#meeting=not-a-uuid', '#meeting=' + pendingId, '#meeting=' + foreignId, '#meeting=' + crypto.randomUUID(), '#meeting=' + meeting.id + '&meeting=' + decoyId, '#meeting=' + meeting.id + '&extra=1']) {
    const start = apiReads.length, page = await pageFor(A, true, '/real-journey.html', fragment, true, true);
    assert.equal(apiReads.slice(start).filter(r => r.page_id === page.__fixturePageId && r.path.startsWith('/api/neon/data/meeting_requests?')).length, 1, 'Rejected hint started an extra conversation lookup');
    assert.equal(await page.locator('#real-content-panel').isVisible(), true, 'Rejected hint hid ordinary dashboard');
    assert.equal(await page.locator('#real-conversation').isHidden(), true);
    assert.equal(await page.evaluate(() => location.hash), ''); assert.equal(await page.evaluate(() => window.__gpsStarts), 0);
    await page.context().close();
  }
  report.checks.foreign_cancelled_pending_unknown_and_malformed_hints_rejected = true;
  db.revoked.add(A); const signedOut = await pageFor(A, true, '/real-journey.html', '#meeting=' + meeting.id, false);
  assert.equal(await signedOut.evaluate(() => location.hash), ''); assert.equal(await signedOut.locator('#real-transcript').textContent(), '');
  db.revoked.delete(A); await signedOut.context().close(); report.checks.signed_out_hint_cleared_without_private_chat = true;
  const plain = await pageFor(A, true); assert.equal(await plain.locator('#real-conversation').isHidden(), true);
  const anchor = await pageFor(A, true, '/real-journey.html', '#real-meetings-panel'); assert.equal(await anchor.evaluate(() => location.hash), '#real-meetings-panel');
  await plain.context().close(); await anchor.context().close(); report.checks.default_and_existing_anchor_preserved = true;
  assert.equal(JSON.stringify({ approvals: db.approvals, cases: db.cases, meetings: db.meetings, messages: db.messages, events }), unchanged, 'URL hint caused a write');
  const hintRequests = apiReads.filter(r => r.page_url.includes('/real-journey.html'));
  assert.ok(hintRequests.every(r => !r.page_url.includes('#meeting=')), 'Private hint survived until API transport');
  report.checks.hint_cleared_before_api_and_no_automatic_write = true;
  await main.locator('#real-logout').click(); await main.locator('#real-auth').waitFor({ state: 'visible' });
  assert.equal(await main.locator('#real-transcript').textContent(), ''); assert.equal(await main.locator('#real-address-cards').textContent(), '');
  assert.equal(await main.evaluate(() => location.hash), ''); report.checks.selected_room_logout_purges = true;
  await main.context().close(); await direct.context().close(); db.meetings.splice(0, extraMeetings.length);
  const a = await pageFor(A), b = await pageFor(B);`);
// Only this fixture preference is allowed; private browser stores remain empty.
replace("local: Object.keys(localStorage), session: Object.keys(sessionStorage)", "local: Object.keys(localStorage).filter(key => key !== 'synera.first-user-tour.v1'), session: Object.keys(sessionStorage)");
source = source.replace(/from (['"])(\.[^'"]+)\1/g,(m,q,n)=>'from '+JSON.stringify(pathToFileURL(path.resolve(root,'tools',n)).href))
  .replace(/from (['"])(playwright|@axe-core\/playwright)\1/g,(m,q,n)=>'from '+JSON.stringify(import.meta.resolve(n)));
const runner = path.join(root, proof, mutation ? 'mutation-runner.mjs' : 'runner.mjs');
report.oracle_sha256 = hash(await fs.readFile(path.join(root, originalName))); report.extended_runner_sha256 = hash(Buffer.from(source));
try {
  await fs.writeFile(runner, source); const result = spawnSync(process.execPath,[runner,...process.argv.slice(2)],{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:1024*1024});
  report.process_exit = result.status;
  report.browser = JSON.parse(await fs.readFile(path.join(root,proof,red?'MEETING_ADDRESS_UI_RED.json':mutation?'HINT_MUTATION_DETAIL.json':'MEETING_ADDRESS_BROWSER.json'),'utf8'));
  assert.equal(result.status,0,report.browser.error||result.stderr); assert.equal(report.browser.external_requests,0); report.status='PASS_LOCAL_MEETING_JOURNEY_LINK';
} catch(error) {report.error=error.message;process.exitCode=1;}
finally {
  report.source_sha256=Object.fromEntries(await Promise.all(['web_launch/meeting-location.mjs','web_launch/real-journey.mjs','web_launch/app.mjs','web_launch/neon-store.mjs',originalName,'tools/meeting-journey-link-browser.mjs'].map(async n=>[n,hash(await fs.readFile(path.join(root,n)))])));
  await fs.writeFile(path.join(root,proof,red?'RED.json':mutation?'MUTATION.json':'BROWSER.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({status:report.status,checks:Object.keys(report.browser?.checks||{}).length,error:report.error}));
