// Extend the accepted private-download oracle; originals and proofs stay intact.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),proof='artifacts/overnight-20261004/export-recovery';
const red=process.argv.includes('--red'),mutation=process.argv.includes('--mutate-late-error');
const read=n=>fs.readFile(path.join(root,n)),hash=b=>createHash('sha256').update(b).digest('hex');
await fs.mkdir(path.join(root,proof),{recursive:true});
if(mutation)await fs.mkdir(path.join(root,proof,'mutation'),{recursive:true});
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),provider_calls:0,provider_usd:0,
  scope:'Actual Chromium private export and decoded readback; seeded synthetic participants and RPC, not live JWT/SQL/Android or deployment.'};
let source=(await read('tools/case-outcome-export-browser.mjs')).toString('utf8');
const replace=(needle,replacement)=>{assert.equal(source.split(needle).length,2,'Extension seam drift: '+needle);source=source.replace(needle,replacement);};
for(const n of ['./fixtures/real-journey-fixture.mjs','./fixtures/case-outcome-fixture.mjs','../web_launch/real-journey-client.mjs','../web_launch/archive-codec.mjs'])replace(`from '${n}'`,`from ${JSON.stringify(new URL(n,import.meta.url).href)}`);
replace("const proof = 'artifacts/overnight-20261004';",`const proof = ${JSON.stringify(mutation?proof+'/mutation':proof)}; const mutation = process.argv.includes('--mutate-late-error');`);
replace('const server = spawn',`const message = 'Приватний текст × Zürich 💛 <script>literal</script>';
await stores[A].sendConversation(dashboard.meetings[0].id,message);
const server = spawn`);
replace('const page = await context.newPage(), errors = [], downloads = [];','const page = await context.newPage(), errors = [], downloads = [], outcomeRequests = []; let externalRequests=0,networkFailure=false; report.checks={};');
replace("  await page.route('**/config.json'",`  await page.route('**/*',async route=>{if(new URL(route.request().url()).origin===new URL(base).origin)return route.fallback();externalRequests++;await route.abort();});
  if(mutation) await page.route('**/real-journey.mjs',async route=>{
    const canonical=await fs.readFile('web_launch/real-journey.mjs','utf8');
    const start=canonical.indexOf('async function exportOutcome() {'),end=canonical.indexOf('async function createOutcomeSocialDraft()',start);
    const segment=canonical.slice(start,end),catchIndex=segment.indexOf('  } catch (error) {'),marker='    if (epoch !== state.epoch || state.outcomeContext !== context) return;';
    assert.ok(catchIndex>0);const tail=segment.slice(catchIndex);assert.equal(tail.split(marker).length,2);
    await route.fulfill({contentType:'text/javascript',body:canonical.slice(0,start)+segment.slice(0,catchIndex)+tail.replace(marker,'')+canonical.slice(end)});
  });
  await page.route('**/config.json'`);
replace('    const response = await db.fetchFor(A)',`    if(url.pathname.startsWith('/api/neon/outcomes/')) {
      outcomeRequests.push(JSON.parse(request.postData()));
      if(networkFailure){networkFailure=false;await route.abort();return;}
    }
    const response = await db.fetchFor(A)`);
replace('report.explicit_plain_and_gzip_downloads = true;',`report.explicit_plain_and_gzip_downloads = true;
  const originalState=JSON.stringify({cases:db.cases,approvals:db.approvals,events:db.events,meetings:db.meetings,messages:db.messages});
  const unchanged=()=>assert.equal(JSON.stringify({cases:db.cases,approvals:db.approvals,events:db.events,meetings:db.meetings,messages:db.messages}),originalState,'Export changed participant data');
  const reopen=async()=>{await page.reload();await page.locator('#real-content-panel').waitFor({state:'visible'});await page.locator('#real-meetings').getByRole('button',{name:'Відкрити розмову'}).click();await ready();await page.locator('#real-outcome-refresh').click();await ready();await controls.locator('summary').click();};
  const keepChat=async draft=>{assert.equal(await page.locator('#real-conversation').isVisible(),true,'Export failure removed accepted private chat');assert.ok((await page.locator('#real-transcript').innerText()).includes(message));assert.equal(await page.locator('#real-message').inputValue(),draft);};
  const purged=async()=>{await page.locator('#real-auth').waitFor({state:'visible'});assert.equal(await page.locator('#real-content-panel').isHidden(),true);for(const id of ['real-outcome-cards','real-outcome-events','real-transcript'])assert.equal(await page.locator('#'+id).innerText(),'');assert.equal(await page.locator('#real-message').inputValue(),'');assert.equal(await controls.isHidden(),true);};
  const recoveryRequests=outcomeRequests.length;
  for(const failure of [503,409,429,500,'network']) {
    const draft='Експорт: збережи чернетку × '+failure+' 💛';await page.locator('#real-message').fill(draft);
    const before=downloads.length,requestCount=outcomeRequests.length,compress=await page.locator('#real-outcome-compress').isChecked();
    if(failure==='network')networkFailure=true;else db.controls.nextOutcomeStatus=failure;
    await page.locator('#real-outcome-export').click();await ready();await keepChat(draft);
    assert.equal(downloads.length,before,'Failed export produced a private file');assert.equal(outcomeRequests.length-requestCount,1,'Failed export retried automatically');unchanged();
    const failedStatus=await page.locator('#real-status').innerText();assert.ok(failedStatus.length>0);
    if(failure===409) {
      assert.equal(await controls.isHidden(),true,'Changed agreement kept stale export available');assert.equal(await page.locator('#real-outcome-cards').innerText(),'');
      await page.locator('#real-outcome-refresh').click();await ready();if(!await controls.evaluate(node=>node.open))await controls.locator('summary').click();
    } else assert.equal(await controls.isVisible(),true,'Transient export failure removed explicit retry');
    assert.equal(await page.locator('#real-outcome-compress').isChecked(),compress,'Retry changed selected archive format');
    const retryBefore=outcomeRequests.length,next=page.waitForEvent('download');next.catch(()=>{});await page.locator('#real-outcome-export').click();const file=await next;await ready();
    assert.equal(await file.failure(),null);assert.equal(downloads.length,before+1);assert.equal(outcomeRequests.length-retryBefore,1);
    assert.notEqual(await page.locator('#real-status').innerText(),failedStatus,'Successful export left failed state visible');await keepChat(draft);unchanged();
    const fileName=proof+'/recovered-'+failure+'.json';await file.saveAs(fileName);
    const raw=await fs.readFile(fileName),envelope=JSON.parse(raw.toString('utf8')),decoded=JSON.parse(await unpackArchive(raw.toString('utf8')));
    assert.equal(envelope.encoding,compress?'gzip-base64':'utf8-base64');assert.equal(decoded.authority,'local_copy_not_live_server_state');assert.equal(decoded.proof_scope,'participant_attestation');
    assert.deepEqual(decoded.case.material,reviewed.material);assert.deepEqual(decoded.outcome.events,db.events.map(({case_id,...event})=>event));
    report.downloads.push({file:fileName,sha256:createHash('sha256').update(raw).digest('hex'),file_bytes:raw.length,encoding:envelope.encoding});
  }
  assert.ok(outcomeRequests.slice(recoveryRequests).every(body=>body.action==='state'),'Export sent a write RPC');
  report.checks.transient_failure_keeps_chat_and_explicit_retry=[503,429,500,'network'];report.checks.changed_agreement_clears_stale_export=true;
  report.checks.manual_retry_preserves_format_and_decodes_fresh_source=true;report.checks.export_has_no_automatic_retry_or_writes=true;
  for(const status of [401,403]) {
    await page.locator('#real-message').fill('Чутлива чернетка');const before=downloads.length;db.controls.nextOutcomeStatus=status;
    await page.locator('#real-outcome-export').click();await ready();await purged();assert.equal(downloads.length,before);await reopen();
  }
  report.checks.auth_failure_purges_private_data_without_file=[401,403];
  let releaseFailure,reachedFailure;const heldFailure=new Promise(resolve=>{releaseFailure=resolve}),startedFailure=new Promise(resolve=>{reachedFailure=resolve});
  db.controls.beforeOutcome=async body=>{if(body.action==='state'){reachedFailure();await heldFailure;}};db.controls.nextOutcomeStatus=500;
  const beforeFailure=downloads.length;await page.locator('#real-outcome-export').click();await startedFailure;await page.locator('#real-logout').click();
  await page.waitForFunction(()=>document.getElementById('real-status').textContent==='Ти вийшов/вийшла з Synera.');const logoutStatus=await page.locator('#real-status').innerText();
  releaseFailure();db.controls.beforeOutcome=null;await ready();
  assert.equal(await page.locator('#real-status').innerText(),logoutStatus,'Late failed export changed logout status');await purged();assert.equal(downloads.length,beforeFailure);unchanged();
  report.checks.late_failure_after_logout_does_not_change_state_or_download=true;
  await reopen();const acceptedDownloads=downloads.length;
`);
replace("assert.equal(downloads.length, 2, 'Logout allowed a queued private archive download');","assert.equal(downloads.length, acceptedDownloads, 'Logout allowed a queued private archive download');");
replace("'tools/case-outcome-export-browser.mjs'];","'tools/case-outcome-export-browser.mjs','tools/outcome-export-recovery-browser.mjs'];");
replace("report.status = 'PASS_LOCAL_OUTCOME_EXPORT_BROWSER';","assert.equal(externalRequests,0);report.external_requests=externalRequests;report.status = 'PASS_LOCAL_EXPORT_RECOVERY_BROWSER';");
replace('`${proof}/CASE_OUTCOME_EXPORT_BROWSER.json`',"`${proof}/${mutation?'MUTATION_DETAIL':'BROWSER_DETAIL'}.json`");
const runner=path.join(root,proof,mutation?'mutation-runner.mjs':'runner.mjs');await fs.writeFile(runner,source);
const before=await read('web_launch/real-journey.mjs');const result=spawnSync(process.execPath,[runner,...(mutation?['--mutate-late-error']:[])],{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:1024*1024});
report.exit_code=result.status;report.signal=result.signal;report.runner_sha256=hash(Buffer.from(source));report.browser=JSON.parse((await read(proof+'/'+(mutation?'mutation/MUTATION_DETAIL':'BROWSER_DETAIL')+'.json')).toString('utf8'));
report.source_sha256=Object.fromEntries(await Promise.all(['web_launch/real-journey.mjs','tools/outcome-export-recovery-browser.mjs'].map(async n=>[n,hash(await read(n))])));assert.deepEqual(await read('web_launch/real-journey.mjs'),before);
if(red){assert.notEqual(result.status,0);assert.match(report.browser.error,/Export failure removed accepted private chat/);report.status='RED_CONFIRMED_EXPORT_CHAT_REMOVAL';}
else if(mutation){assert.notEqual(result.status,0);assert.match(report.browser.error,/Late failed export changed logout status/);report.status='MUTANT_REJECTED_LATE_EXPORT_FAILURE';}
else{assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(report.browser.status,'PASS_LOCAL_EXPORT_RECOVERY_BROWSER');report.status='PASS_LOCAL_PRIVATE_EXPORT_RECOVERY';}
await fs.writeFile(path.join(root,proof,red?'RED.json':mutation?'MUTATION.json':'BROWSER.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,checks:Object.keys(report.browser.checks||{}).length,downloads:report.browser.downloads.length,error:report.browser.error,external_requests:report.browser.external_requests}));
