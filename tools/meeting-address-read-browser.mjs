// Extend the accepted selected-room oracle; keep original tools/proofs intact.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),proof='artifacts/overnight-20261004/address-read';
const red=process.argv.includes('--red'),mutation=process.argv.includes('--mutate-late-error');
const read=n=>fs.readFile(path.join(root,n)),hash=b=>createHash('sha256').update(b).digest('hex');
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),provider_calls:0,provider_usd:0,
  scope:'Actual Chromium selected-room/manual address reads against synthetic transport. No HTTP JWT, live accounts, Android or providers.'};
await fs.mkdir(path.join(root,proof),{recursive:true});
let source=(await read('tools/meeting-journey-link-browser.mjs')).toString('utf8');
const replace=(needle,replacement)=>{assert.equal(source.split(needle).length,2,'Extension seam drift: '+needle);source=source.replace(needle,replacement);};
replace("fileURLToPath(new URL('../', import.meta.url))",JSON.stringify(root));
replace("'artifacts/overnight-20261004/journey-link'",JSON.stringify(proof));
replace("mutation = process.argv.includes('--mutate-hint');", "mutation = process.argv.includes('--mutate-late-error');");
replace("red?'RED.json'", "red?'READ_RED.json'");
replace("mutation?'MUTATION.json'", "mutation?'READ_MUTATION.json'");
replace("'BROWSER.json'", "'READ_BROWSER.json'");
replace("'PASS_LOCAL_MEETING_JOURNEY_LINK'", "'PASS_LOCAL_ADDRESS_READ_RECOVERY'");
replace("'tools/meeting-journey-link-browser.mjs'].map", "'tools/meeting-journey-link-browser.mjs','tools/meeting-address-read-browser.mjs'].map");
replace("'const controls = { failWrite: 0, beforeState: null }; const apiReads = [];'", "'const controls = { failWrite: 0, beforeState: null, failRead: null, networkReject: false }; const apiReads = [];'");
// Additional changes to the underlying actual-browser oracle, inserted before
// its existing page/fixture setup. Each replacement must match exactly once.
replace("replace('async function pageFor(actor, enabled = true) {'", `replace("  if (body.action !== 'state') {", \`  if (body.action === 'state' && controls.failRead) {
    const failure = controls.failRead; controls.failRead = null;
    if (failure.wait) await failure.wait();
    return Response.json({}, { status: failure.status });
  }
  if (body.action !== 'state') {\`);
replace('    if (mutation) await page.route', \`    if (process.argv.includes('--mutate-late-error')) await page.route('**/real-journey.mjs', async route => {
      const canonical = await fs.readFile('web_launch/real-journey.mjs', 'utf8');
      const start = canonical.indexOf('async function openAddress() {'), end = canonical.indexOf('async function recordAddress(', start);
      const segment = canonical.slice(start, end), catchIndex = segment.indexOf('  } catch (error) {'), marker = '    if (!active()) return;';
      assert.ok(catchIndex > 0); const tail = segment.slice(catchIndex); assert.equal(tail.split(marker).length, 2);
      await route.fulfill({ contentType: 'text/javascript', body: canonical.slice(0, start) + segment.slice(0, catchIndex) + tail.replace(marker, '') + canonical.slice(end) });
    });
    if (mutation) await page.route\`);
replace('async function pageFor(actor, enabled = true) {'`);
replace("apiReads.push({ actor, page_id: pageId, path: url.pathname + url.search, page_url: page.url(), method: request.method() });", `apiReads.push({ actor, page_id: pageId, path: url.pathname + url.search, page_url: page.url(), method: request.method() });
      if (url.pathname.startsWith('/api/neon/meeting-address/') && controls.networkReject) { controls.networkReject = false; await route.abort(); return; }`);
// Close the active A room before the separate signed-out fixture probe; a
// global synthetic revocation must not accidentally race its 5-second poll.
const logoutRoom = `  await main.locator('#real-logout').click(); await main.locator('#real-auth').waitFor({ state: 'visible' });
  assert.equal(await main.locator('#real-transcript').textContent(), ''); assert.equal(await main.locator('#real-address-cards').textContent(), '');
  assert.equal(await main.evaluate(() => location.hash), ''); report.checks.selected_room_logout_purges = true;`;
replace(logoutRoom, '');
replace('  db.revoked.add(A);', logoutRoom + '\n  await main.context().close(); await direct.context().close();\n  db.revoked.add(A);');
replace("  await main.context().close(); await direct.context().close(); db.meetings.splice(0, extraMeetings.length);", `  // Earlier entry pages are closed before account-revocation testing.
  const readyRead = page => page.waitForFunction(() => !document.body.dataset.realBusy);
  for (const status of [503, 409, 429, 500, 'network']) {
    if (status === 'network') controls.networkReject = true; else controls.failRead = { status };
    const page = await pageFor(A, true, '/real-journey.html', '#meeting=' + meeting.id, true, true);
    assert.equal(await page.locator('#real-conversation').isVisible(), true, 'Address read failure removed accepted private chat');
    assert.equal(await page.locator('#real-blocked').isHidden(), true); assert.equal(await page.locator('#real-auth').isHidden(), true);
    assert.ok((await page.locator('#real-transcript').innerText()).includes(entryMessage));
    assert.equal(await page.locator('#real-address-cards').textContent(), ''); assert.equal(await page.locator('#real-address-events').textContent(), '');
    assert.equal(await page.locator('#real-address-route').count(), 0); assert.ok((await page.locator('#real-status').textContent()).trim());
    assert.equal(await page.evaluate(() => location.hash), ''); assert.equal(await page.evaluate(() => window.__gpsStarts), 0);
    const failureStatus = await page.locator('#real-status').textContent();
    const addressCount = () => apiReads.filter(r => r.page_id === page.__fixturePageId && r.path.startsWith('/api/neon/meeting-address/')).length;
    assert.equal(addressCount(), 1, 'Entry retried failed read automatically');
    await page.locator('#real-address-refresh').click(); await readyRead(page);
    assert.equal(addressCount(), 3, 'Successful manual read lost its existing final state recheck'); assert.equal(await page.locator('#real-address-cards [name=consent]').isChecked(), false);
    assert.notEqual(await page.locator('#real-status').textContent(), failureStatus, 'Successful manual read left failed state visible');
    assert.equal(JSON.stringify({ approvals: db.approvals, cases: db.cases, meetings: db.meetings, messages: db.messages, events }), unchanged);
    // Repeat the same failure through the real manual button after a success:
    // stale address controls must disappear while the private chat remains.
    await page.locator('#real-message').fill('Моя ненадіслана думка × Zürich 💛');
    if (status === 'network') controls.networkReject = true; else controls.failRead = { status };
    await page.locator('#real-address-refresh').click(); await readyRead(page);
    assert.equal(await page.locator('#real-conversation').isVisible(), true, 'Manual read failure removed accepted chat');
    assert.equal(await page.locator('#real-message').inputValue(), 'Моя ненадіслана думка × Zürich 💛');
    assert.equal(await page.locator('#real-address-cards').textContent(), ''); assert.equal(await page.locator('#real-address-events').textContent(), '');
    await page.locator('#real-address-refresh').click(); await readyRead(page);
    assert.equal(addressCount(), 6); assert.equal(await page.locator('#real-address-cards [name=consent]').isChecked(), false);
    if (status === 503) { await page.locator('#real-message').click(); await page.screenshot({ path: proof + '/read-recovered-390x844.png', fullPage: true }); }
    await page.context().close();
  }
  report.checks.entry_and_manual_409_429_500_503_network_preserve_chat_and_explicit_retry = true;
  for (const status of [401, 403]) {
    controls.failRead = { status };
    const page = await pageFor(A, true, '/real-journey.html', '#meeting=' + meeting.id, true, true);
    await page.locator('#real-auth').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#real-transcript').textContent(), ''); assert.equal(await page.locator('#real-address-cards').textContent(), '');
    assert.equal(await page.locator('#real-address-events').textContent(), ''); assert.equal(await page.locator('#real-message').inputValue(), '');
    await page.context().close();
    const manual = await pageFor(A, true, '/real-journey.html', '#meeting=' + meeting.id);
    controls.failRead = { status }; await manual.locator('#real-address-refresh').click(); await readyRead(manual);
    assert.equal(await manual.locator('#real-auth').isVisible(), true); assert.equal(await manual.locator('#real-transcript').textContent(), '');
    assert.equal(await manual.locator('#real-address-cards').textContent(), ''); await manual.context().close();
  }
  report.checks.entry_and_manual_auth_denial_purge = true;
  const late = await pageFor(B, true, '/real-journey.html', '#meeting=' + meeting.id);
  let failReached, failRelease; const reachedRead = new Promise(resolve => { failReached = resolve; });
  const heldRead = new Promise(resolve => { failRelease = resolve; }); releaseLate = failRelease;
  controls.failRead = { status: 500, wait: async () => { failReached(); await heldRead; } };
  await late.locator('#real-address-refresh').click(); await reachedRead; await late.locator('#real-logout').click();
  await late.waitForFunction(() => document.getElementById('real-status').textContent.includes('вийшов'));
  const logoutStatus = await late.locator('#real-status').textContent(); failRelease(); releaseLate = null; await readyRead(late);
  assert.equal(await late.locator('#real-status').textContent(), logoutStatus, 'Late failed read changed logout status');
  assert.equal(await late.locator('#real-transcript').textContent(), ''); assert.equal(await late.locator('#real-address-cards').textContent(), '');
  assert.equal(await late.locator('#real-auth').isVisible(), true); await late.context().close();
  report.checks.late_failed_read_cannot_change_logout_or_restore_private_data = true;
  db.meetings.splice(0, extraMeetings.length);`);
const runner=path.join(root,proof,mutation?'mutation-wrapper.mjs':'wrapper.mjs');
try {
  await fs.writeFile(runner,source);
  const result=spawnSync(process.execPath,[runner,...process.argv.slice(2)],{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:1024*1024}); report.process_exit=result.status;
  report.browser=JSON.parse(await read(proof+'/'+(red?'READ_RED.json':mutation?'READ_MUTATION.json':'READ_BROWSER.json')));
  assert.equal(result.status,0,report.browser.error||result.stderr); assert.equal(report.browser.status,'PASS_LOCAL_ADDRESS_READ_RECOVERY'); report.status='PASS_LOCAL_ADDRESS_READ_RECOVERY';
} catch(error) {report.error=error.message;process.exitCode=1;}
finally {
  report.source_sha256=Object.fromEntries(await Promise.all(['web_launch/real-journey.mjs','tools/meeting-journey-link-browser.mjs','tools/meeting-address-read-browser.mjs'].map(async n=>[n,hash(await read(n))])));
  report.extended_wrapper_sha256=hash(Buffer.from(source)); await fs.writeFile(path.join(root,proof,red?'RED.json':mutation?'MUTATION.json':'BROWSER.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({status:report.status,checks:Object.keys(report.browser?.browser?.checks||{}).length,error:report.error}));
