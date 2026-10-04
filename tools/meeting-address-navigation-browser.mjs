// Extend the accepted address oracle without rewriting its code or old receipts.
// Google navigation is intercepted and fulfilled locally, never transmitted.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url)), proof = 'artifacts/overnight-20261004/address-navigation';
const hash = b => createHash('sha256').update(b).digest('hex'), originalName = 'tools/meeting-address-browser.mjs';
const mutation = process.argv.includes('--mutate-navigation'), red = process.argv.includes('--red');
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Actual local Chromium clicks, synthetic account/RPC; navigation fulfilled locally without Google, JWT or Android hardware' };
await fs.mkdir(path.join(root, proof), { recursive: true });
let source = await fs.readFile(path.join(root, originalName), 'utf8');
const replace = (needle, replacement) => { assert.equal(source.split(needle).length, 2, 'Oracle seam drift: ' + needle); source = source.replace(needle, replacement); };
replace("'artifacts/overnight-20261004'", JSON.stringify(proof));
replace('const controls = { failWrite: 0, beforeState: null };', 'const controls = { failWrite: 0, failState: 0, beforeState: null }; const navigationAttempts = [];');
for (const actor of ['A', 'B']) replace(`new RealJourneyStore(config, fetchFor(${actor}))`, `new RealJourneyStore({ ...config, meetingAddressEnabled: true }, fetchFor(${actor}))`);
replace("  if (body.action !== 'state') {", "  if (body.action === 'state' && controls.failState) { const status = controls.failState; controls.failState = 0; return Response.json({}, { status }); }\n  if (body.action !== 'state') {");
replace('    if (mutation) await page.route', `    await page.route('https://www.google.com/maps/**', async route => {
      navigationAttempts.push(route.request().url());
      await route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Local navigation interception</title><p>No Google request was transmitted.</p>' });
    });
    if (process.argv.includes('--mutate-navigation')) await page.route('**/real-journey.mjs', async route => {
      const canonical = await fs.readFile('web_launch/real-journey.mjs', 'utf8'), marker = 'if (!same) {';
      assert.equal(canonical.split(marker).length, 2);
      await route.fulfill({ contentType: 'text/javascript', body: canonical.replace(marker, 'if (false) {') });
    });
    if (mutation) await page.route`);
replace('    await reload(a); assert.equal(events.length, 0);', "    await reload(a); assert.equal(await a.locator('#real-address-route').count(), 0, 'Missing address offered navigation'); assert.equal(events.length, 0);");
replace('report.checks.explicit_decline = true;', "report.checks.explicit_decline = true; assert.equal(await b.locator('#real-address-route').count(), 0, 'Declined address offered navigation');");
// Delimiters and literal markup must stay in the one destination parameter.
source = source.replaceAll('Третій варіант — Zürich 💛', 'Третій варіант — Zürich 💛 &x=1#<script>literal</script>');
replace("'MEETING_ADDRESS_BROWSER'", JSON.stringify(mutation ? 'NAVIGATION_MUTATION_DETAIL' : 'MEETING_ADDRESS_BROWSER'));
replace('    report.checks.bilateral_selected_address_and_literal_history = true;', `    report.checks.bilateral_selected_address_and_literal_history = true;
    const routeButton = page => page.locator('#real-address-route');
    for (const page of [a, b]) assert.equal(await routeButton(page).count(), 1, 'Agreed address route missing');
    assert.equal(navigationAttempts.length, 0, 'Navigation happened without a click');
    assert.equal(await a.locator('#real-address-cards a[href*="google"]').count(), 0);
    report.checks.navigation_requires_explicit_click = true;
    controls.failState = 503; await routeButton(a).click(); await ready(a);
    assert.equal(navigationAttempts.length, 0, 'Unavailable state navigated');
    assert.equal(await routeButton(a).count(), 1); report.checks.failed_read_does_not_navigate = true;
    let latest = await stores[0].meetingAddressState(B, meeting.id, reviewed);
    await stores[0].recordMeetingAddress(B, meeting.id, reviewed, latest, { action: 'propose', intentId: crypto.randomUUID(), address: 'Новий ще не погоджений варіант, Zürich', consent: true });
    await routeButton(a).click(); await ready(a);
    await a.waitForURL('https://www.google.com/maps/**', { timeout: 1000 }).catch(() => {});
    assert.equal(navigationAttempts.length, 0, 'Unagreed address navigated');
    assert.equal(await routeButton(a).count(), 0); report.checks.superseded_selection_stops_navigation = true;
    await reload(b); await b.locator('#real-address-cards [name=accept-consent]').check(); await accepted.click(); await ready(b); await reload(a);
    const approval = db.approvals.find(e => e.party_id === B && !e.withdrawn_at); approval.withdrawn_at = new Date().toISOString();
    await routeButton(a).click(); await ready(a);
    await a.waitForURL('https://www.google.com/maps/**', { timeout: 1000 }).catch(() => {});
    assert.equal(navigationAttempts.length, 0, 'Withdrawn approval navigated');
    assert.equal(await routeButton(a).count(), 0); report.checks.withdrawal_stops_navigation = true;
    approval.withdrawn_at = null; await reload(a); await reload(b);
    const latePage = await pageFor(A); await conversation(latePage); await latePage.locator('#real-address > summary').click(); await reload(latePage);
    let startedRoute, releaseRoute; const routeReached = new Promise(resolve => { startedRoute = resolve; }), routeHeld = new Promise(resolve => { releaseRoute = resolve; });
    releaseLate = releaseRoute; controls.beforeState = async actor => { if (actor === A) { startedRoute(); await routeHeld; } };
    await routeButton(latePage).click(); await routeReached; await latePage.locator('#real-logout').click(); releaseRoute(); controls.beforeState = null; releaseLate = null;
    await latePage.locator('#real-auth').waitFor({ state: 'visible' }); await ready(latePage);
    assert.equal(navigationAttempts.length, 0, 'Late route read navigated after logout');
    assert.equal(await latePage.locator('#real-address-cards').textContent(), ''); report.checks.logout_during_route_read_stops_navigation = true;
    // Return to the exact delimiter-rich address using two separate UI choices.
    await propose(a, 'Третій варіант — Zürich 💛 &x=1#<script>literal</script>'); await reload(b);
    await b.locator('#real-address-cards [name=accept-consent]').check(); await accepted.click(); await ready(b); await reload(a);
    const navigator = await pageFor(A); await conversation(navigator); await navigator.locator('#real-address > summary').click(); await reload(navigator);
    const attemptStart = attempts.length, eventStart = events.length;
    await routeButton(navigator).click(); await navigator.waitForURL('https://www.google.com/maps/**');
    assert.equal(navigationAttempts.length, 1); const url = new URL(navigationAttempts[0]);
    assert.equal(url.origin, 'https://www.google.com'); assert.equal(url.pathname, '/maps/dir/');
    assert.equal(url.searchParams.get('destination'), meeting.meeting_address);
    assert.equal(url.searchParams.get('api'), '1'); assert.equal(url.searchParams.get('travelmode'), 'walking'); assert.equal(url.searchParams.get('dir_action'), 'navigate');
    assert.deepEqual([...url.searchParams.keys()].sort(), ['api', 'destination', 'dir_action', 'travelmode']);
    assert.equal(events.length, eventStart); assert.ok(attempts.length - attemptStart >= 2);
    assert.ok(attempts.slice(attemptStart).every(e => e.body.action === 'state'));
    report.checks.exact_destination_after_fresh_reads_without_vote_or_GPS = true;
    report.intercepted_navigation_attempts = navigationAttempts.length; report.google_requests_transmitted = 0;
    report.checks.navigation_after_success_is_current_tab = navigator.url() === url.href;
`);
source = source.replace(/from (['"])(\.[^'"]+)\1/g, (m, q, name) => 'from ' + JSON.stringify(pathToFileURL(path.resolve(root, 'tools', name)).href))
  .replace(/from (['"])(playwright|@axe-core\/playwright)\1/g, (m, q, name) => 'from ' + JSON.stringify(import.meta.resolve(name)));
const runner = path.join(root, proof, mutation ? 'mutation-runner.mjs' : 'runner.mjs');
report.oracle_sha256 = hash(await fs.readFile(path.join(root, originalName))); report.extended_runner_sha256 = hash(Buffer.from(source));
try {
  await fs.writeFile(runner, source);
  const result = spawnSync(process.execPath, [runner, ...process.argv.slice(2)], { cwd: root, encoding: 'utf8', timeout: 60000, maxBuffer: 1024 * 1024 });
  const outputName = red ? 'MEETING_ADDRESS_UI_RED.json' : mutation ? 'NAVIGATION_MUTATION_DETAIL.json' : 'MEETING_ADDRESS_BROWSER.json';
  const browser = JSON.parse(await fs.readFile(path.join(root, proof, outputName), 'utf8'));
  report.browser = browser; report.process_exit = result.status;
  assert.equal(result.status, 0, browser.error || result.stderr); assert.equal(browser.external_requests, 0); assert.equal(browser.google_requests_transmitted, 0);
  report.status = 'PASS_LOCAL_MEETING_ADDRESS_NAVIGATION';
} catch (error) { report.error = error.message; process.exitCode = 1; }
finally {
  report.source_sha256 = Object.fromEntries(await Promise.all(['web_launch/real-journey.mjs', 'web_launch/real-journey.html', 'web_launch/live-location.mjs', originalName, 'tools/meeting-address-navigation-browser.mjs'].map(async n => [n, hash(await fs.readFile(path.join(root, n)))])));
  await fs.writeFile(path.join(root, proof, red ? 'NAVIGATION_RED.json' : mutation ? 'NAVIGATION_MUTATION.json' : 'NAVIGATION_BROWSER.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ status: report.status, checks: Object.keys(report.browser?.checks || {}).length, error: report.error }));
