// Extend the accepted actual-browser outcome cycle without changing its oracle.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),proof='artifacts/overnight-20261004/outcome-read';
const red=process.argv.includes('--red'),mutation=process.argv.includes('--mutate-late-error');
const read=n=>fs.readFile(path.join(root,n)),hash=b=>createHash('sha256').update(b).digest('hex');
await fs.mkdir(path.join(root,proof),{recursive:true});
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),provider_calls:0,provider_usd:0,
  scope:'Actual Chromium outcome cycle/read recovery; synthetic same-origin accounts and RPC. No live JWT, Android, providers or deployment.'};
let source=(await read('tools/case-outcome-browser-acceptance.mjs')).toString('utf8');
const replace=(needle,replacement)=>{assert.equal(source.split(needle).length,2,'Extension seam drift: '+needle);source=source.replace(needle,replacement);};
replace("from './fixtures/real-journey-fixture.mjs'",`from ${JSON.stringify(new URL('./fixtures/real-journey-fixture.mjs',import.meta.url).href)}`);
replace("from './fixtures/case-outcome-fixture.mjs'",`from ${JSON.stringify(new URL('./fixtures/case-outcome-fixture.mjs',import.meta.url).href)}`);
replace("proof = 'artifacts/overnight-20261004'",`proof = ${JSON.stringify(proof)}`);
replace("const mutation = process.argv.includes('--mutate-purge');","const mutation = process.argv.includes('--mutate-late-error');");
replace('const db = createOutcomeFixture(), errors = [];','const db = createOutcomeFixture(), errors = [], rpcReads = []; let externalRequests = 0; const networkFailure = new WeakSet();');
const mutationStart=source.indexOf("    if (mutation) await page.route"),mutationEnd=source.indexOf("    await page.route('**/config.json'",mutationStart);
assert.ok(mutationStart>0&&mutationEnd>mutationStart);
source=source.slice(0,mutationStart)+`    await page.route('**/*', async route => {
      if (new URL(route.request().url()).origin === new URL(base).origin) return route.fallback();
      externalRequests++; await route.abort();
    });
    if (mutation) await page.route('**/real-journey.mjs', async route => {
      const canonical = await fs.readFile('web_launch/real-journey.mjs', 'utf8');
      const start = canonical.indexOf('async function openOutcomes() {'), end = canonical.indexOf('async function recordOutcome(', start);
      const segment = canonical.slice(start, end), catchIndex = segment.indexOf('  } catch (error) {'), marker = '    if (epoch !== state.epoch) return;';
      assert.ok(catchIndex > 0); const tail = segment.slice(catchIndex); assert.equal(tail.split(marker).length, 2);
      await route.fulfill({contentType:'text/javascript',body:canonical.slice(0,start)+segment.slice(0,catchIndex)+tail.replace(marker,'')+canonical.slice(end)});
    });
`+source.slice(mutationEnd);
replace('      const response = await db.fetchFor(id)',`      if (url.pathname.startsWith('/api/neon/outcomes/')) {
        rpcReads.push({page,body:JSON.parse(request.postData())});
        if (networkFailure.has(page)) { networkFailure.delete(page); await route.abort(); return; }
      }
      const response = await db.fetchFor(id)`);
// Insert only after actual receiver approvals have produced seven server events.
replace('report.checks.both_receiver_acceptances_confirm_all_results = true;',`report.checks.both_receiver_acceptances_confirm_all_results = true;
    const snapshot = () => JSON.stringify({cases:db.cases,approvals:db.approvals,events:db.events,messages:db.messages,meetings:db.meetings});
    const unchanged = snapshot();
    const countReads = page => rpcReads.filter(row=>row.page===page).length;
    const room = async () => {
      const page = await pageFor(A); await open(page,'real-meetings-panel');
      await page.locator('#real-meetings').getByRole('button',{name:'Відкрити розмову'}).click(); await ready(page); await reload(page);
      assert.ok((await page.locator('#real-outcome-status').innerText()).includes('Усі результати прийняті'));
      return page;
    };
    const cleared = async page => {
      for (const id of ['real-outcome-cards','real-outcome-events','real-outcome-status']) assert.equal(await page.locator('#'+id).innerText(),'','Stale result survived failed read: '+id);
      for (const id of ['real-outcome-history','real-outcome-export-controls','real-social-controls','real-social-output']) assert.equal(await page.locator('#'+id).isHidden(),true,id);
      assert.equal(await page.locator('#real-social-text').inputValue(),''); assert.equal(await page.locator('#real-social-consent').isChecked(),false);
    };
    const chatKept = async (page,draft) => {
      assert.equal(await page.locator('#real-conversation').isVisible(),true,'Outcome read failure removed accepted private chat');
      assert.ok((await page.locator('#real-transcript').innerText()).includes(message),'Accepted transcript lost');
      assert.equal(await page.locator('#real-message').inputValue(),draft,'Message draft lost');
    };
    const purged = async page => {
      await page.locator('#real-auth').waitFor({state:'visible'}); await cleared(page);
      assert.equal(await page.locator('#real-transcript').innerText(),''); assert.equal(await page.locator('#real-message').inputValue(),'');
      assert.equal(await page.locator('#real-content-panel').isHidden(),true);
    };
    const recovery = await room();
    for (const failure of [503,409,429,500,'network']) {
      await open(recovery,'real-social-controls'); await recovery.locator('#real-social-consent').check(); await recovery.locator('#real-social-create').click(); await ready(recovery);
      assert.ok((await recovery.locator('#real-social-text').inputValue()).length>0);
      const draft = 'Збережена чернетка × '+failure+' 💛'; await recovery.locator('#real-message').fill(draft);
      const before = countReads(recovery),attempts = db.attempts.length;
      if (failure==='network') networkFailure.add(recovery); else db.controls.nextOutcomeStatus=failure;
      await reload(recovery); await chatKept(recovery,draft); await cleared(recovery);
      assert.equal(countReads(recovery)-before,1,'Failed read retried automatically');
      assert.equal(db.attempts.length-attempts,failure==='network'?0:1);
      const failedStatus=await recovery.locator('#real-status').innerText(); assert.ok(failedStatus.length>0);
      assert.equal(snapshot(),unchanged,'Optional read changed meeting, case, approvals, message or outcomes');
      const retryBefore=countReads(recovery); await reload(recovery); await chatKept(recovery,draft);
      assert.equal(countReads(recovery)-retryBefore,1,'Manual outcome read did not use one RPC');
      assert.notEqual(await recovery.locator('#real-status').innerText(),failedStatus,'Successful manual read left failed state visible');
      assert.ok((await recovery.locator('#real-outcome-status').innerText()).includes('Усі результати прийняті'));
      assert.equal(await recovery.locator('#real-outcome-cards [data-outcome-index]').count(),2); assert.equal(await recovery.locator('#real-outcome-events li').count(),7);
      assert.equal(await recovery.locator('#real-social-consent').isChecked(),false); assert.equal(await recovery.locator('#real-social-output').isHidden(),true);
    }
    report.checks.optional_read_errors_keep_chat_and_clear_stale_private_results = [503,409,429,500,'network'];
    report.checks.manual_retry_restores_only_fresh_read_and_replaces_error_status = true;
    assert.ok(rpcReads.filter(row=>row.page===recovery).every(row=>row.body.action==='state'),'Recovery sent a write RPC');
    report.checks.reads_do_not_write_or_auto_accept = true;
    await recovery.locator('#real-message').focus(); if(!mutation) await recovery.screenshot({path:proof+'/read-recovered-390x844.png'});
    await recovery.locator('#real-logout').click(); await recovery.close();
    for (const status of [401,403]) {
      const page=await room(); await page.locator('#real-message').fill('Чутлива чернетка');
      db.controls.nextOutcomeStatus=status; await reload(page); await purged(page); await page.close();
    }
    report.checks.auth_failures_purge_chat_draft_and_outcomes = [401,403];
    const late = await room(); let releaseFailure,reachedFailure;
    const held=new Promise(resolve=>{releaseFailure=resolve}),startedFailure=new Promise(resolve=>{reachedFailure=resolve});
    db.controls.beforeOutcome=async body=>{if(body.action==='state'){reachedFailure();await held;}}; db.controls.nextOutcomeStatus=500;
    await late.locator('#real-outcome-refresh').click(); await startedFailure; await late.locator('#real-logout').click();
    // The logout listener clears local DOM before its asynchronous server request
    // finishes. Compare against its settled state, not that intermediate frame.
    await late.waitForFunction(()=>document.getElementById('real-status').textContent==='Ти вийшов/вийшла з Synera.');
    const logoutStatus=await late.locator('#real-status').innerText(); releaseFailure(); db.controls.beforeOutcome=null; await ready(late);
    assert.equal(await late.locator('#real-status').innerText(),logoutStatus,'Late failed read changed logout status'); await purged(late); await late.close();
    report.checks.late_failed_read_does_not_change_logged_out_state = true;
    assert.equal(snapshot(),unchanged);
`);
replace("report.status = baseline ? 'PASS_PRESERVED_CHAT_BASELINE' : 'PASS_LOCAL_OUTCOME_BROWSER';","assert.equal(externalRequests,0); report.external_requests=externalRequests; report.status = 'PASS_LOCAL_OUTCOME_READ_BROWSER';");
replace("'tools/case-outcome-browser-acceptance.mjs'];","'tools/case-outcome-browser-acceptance.mjs','tools/outcome-read-browser.mjs'];");
replace("${baseline ? 'OUTCOME_UI_BASELINE' : mutation ? 'OUTCOME_UI_MUTATION' : 'CASE_OUTCOME_BROWSER'}","${mutation ? 'MUTATION_DETAIL' : 'BROWSER_DETAIL'}");
const runner=path.join(root,proof,mutation?'mutation-runner.mjs':'runner.mjs'); await fs.writeFile(runner,source);
const before=await read('web_launch/real-journey.mjs');
const result=spawnSync(process.execPath,[runner,...(mutation?['--mutate-late-error']:[])],{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:1024*1024});
report.exit_code=result.status;report.signal=result.signal;report.runner_sha256=hash(Buffer.from(source));
const detail=JSON.parse((await read(proof+'/'+(mutation?'MUTATION_DETAIL':'BROWSER_DETAIL')+'.json')).toString('utf8'));
report.browser=detail; report.source_sha256=Object.fromEntries(await Promise.all(['web_launch/real-journey.mjs','tools/outcome-read-browser.mjs'].map(async n=>[n,hash(await read(n))])));
assert.deepEqual(await read('web_launch/real-journey.mjs'),before,'Oracle changed canonical controller');
if(red){assert.notEqual(result.status,0);assert.match(detail.error,/Outcome read failure removed accepted private chat/);report.status='RED_CONFIRMED_CHAT_REMOVAL';}
else if(mutation){assert.notEqual(result.status,0);assert.match(detail.error,/Late failed read changed logout status/);report.status='MUTANT_REJECTED_LATE_FAILURE';}
else {assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(detail.status,'PASS_LOCAL_OUTCOME_READ_BROWSER');report.status='PASS_LOCAL_OUTCOME_READ_RECOVERY';}
await fs.writeFile(path.join(root,proof,red?'RED.json':mutation?'MUTATION.json':'BROWSER.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,checks:Object.keys(detail.checks).length,error:detail.error,external_requests:detail.external_requests}));
