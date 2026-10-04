// Extend the accepted private-social oracle without changing original assets.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),proof='artifacts/overnight-20261004/social-recovery';
const red=process.argv.includes('--red'),mutation=process.argv.includes('--mutate-late-error');
const read=n=>fs.readFile(path.join(root,n)),hash=b=>createHash('sha256').update(b).digest('hex');
await fs.mkdir(path.join(root,proof),{recursive:true});if(mutation)await fs.mkdir(path.join(root,proof,'mutation'),{recursive:true});
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),provider_calls:0,provider_usd:0,
  scope:'Actual Chromium private social draft recovery; seeded synthetic accounts and RPC. No live JWT, SQL execution, OAuth, OS clipboard or publication.'};
let source=(await read('tools/case-social-draft-browser.mjs')).toString('utf8');
const replace=(needle,replacement)=>{assert.equal(source.split(needle).length,2,'Extension seam drift: '+needle);source=source.replace(needle,replacement);};
for(const n of ['./fixtures/real-journey-fixture.mjs','./fixtures/case-outcome-fixture.mjs','../web_launch/real-journey-client.mjs'])replace(`from '${n}'`,`from ${JSON.stringify(new URL(n,import.meta.url).href)}`);
replace("const proof = 'artifacts/overnight-20261004', red = process.argv.includes('--red');",`const proof=${JSON.stringify(mutation?proof+'/mutation':proof)}, red=false, mutation=process.argv.includes('--mutate-late-error');`);
replace('const names = [',`const message='Приватний текст × Zürich 💛 <script>literal</script>';
await stores[A].sendConversation(dashboard.meetings[0].id,message);
const names = [`);
replace("'tools/case-social-draft-browser.mjs'];","'tools/case-social-draft-browser.mjs','tools/social-draft-recovery-browser.mjs'];");
replace('const page = await context.newPage(), errors = [], external = [];','const page = await context.newPage(), errors = [], external = [], outcomeRequests=[];let networkFailure=false;');
replace("    if (url.pathname.startsWith('/api/neon/')) {",`    if (mutation && url.pathname==='/real-journey.mjs') {
      const canonical=await fs.readFile('web_launch/real-journey.mjs','utf8');
      const start=canonical.indexOf('async function createOutcomeSocialDraft() {'),end=canonical.indexOf('function renderReview(',start);
      const segment=canonical.slice(start,end),catchIndex=segment.indexOf('  } catch (error) {'),marker='    if (generation !== state.socialGeneration || !outcomeUI.socialConsent.checked) return;';
      assert.ok(catchIndex>0);const tail=segment.slice(catchIndex);assert.equal(tail.split(marker).length,2);
      await route.fulfill({contentType:'text/javascript',body:canonical.slice(0,start)+segment.slice(0,catchIndex)+tail.replace(marker,'')+canonical.slice(end)});return;
    }
    if (url.pathname.startsWith('/api/neon/')) {
      if(url.pathname.startsWith('/api/neon/outcomes/')){outcomeRequests.push(JSON.parse(request.postData()));if(networkFailure){networkFailure=false;await route.abort();return;}}`);
replace("await page.waitForFunction(() => !document.getElementById('real-content').hidden);","await page.locator('#real-content-panel').waitFor({state:'visible'});");
replace("report.checks.push('LinkedIn format requires new choice; edited text selected without OS clipboard or publication');",`report.checks.push('LinkedIn format requires new choice; edited text selected without OS clipboard or publication');
  const originalState=JSON.stringify({cases:db.cases,approvals:db.approvals,events:db.events,meetings:db.meetings,messages:db.messages});
  const unchanged=()=>assert.equal(JSON.stringify({cases:db.cases,approvals:db.approvals,events:db.events,meetings:db.meetings,messages:db.messages}),originalState,'Draft wrote participant data');
  const openControls=async()=>{if(!await controls.evaluate(node=>node.open))await controls.locator('summary').click();};
  const reread=async()=>{await page.locator('#real-outcome-refresh').click();await ready();await openControls();};
  const reopen=async()=>{await page.reload();await page.locator('#real-content-panel').waitFor({state:'visible'});await page.getByRole('button',{name:'Відкрити розмову',exact:true}).click();await ready();await reread();};
  const empty=async()=>{assert.equal(await output.isHidden(),true);assert.equal(await text.inputValue(),'');};
  const kept=async draft=>{assert.equal(await page.locator('#real-conversation').isVisible(),true,'Draft failure removed accepted private chat');assert.ok((await page.locator('#real-transcript').innerText()).includes(message));assert.equal(await page.locator('#real-message').inputValue(),draft);};
  const purged=async()=>{await page.locator('#real-auth').waitFor({state:'visible'});await empty();assert.equal(await controls.isHidden(),true);assert.equal(await consent.isChecked(),false);assert.equal(await page.locator('#real-message').inputValue(),'');for(const id of ['real-outcome-cards','real-outcome-events','real-transcript'])assert.equal(await page.locator('#'+id).innerText(),'');};
  const privateDraft=async()=>{const value=await text.inputValue();assert.ok(value.includes(own.target));assert.equal(value.includes(other.target),false);for(const forbidden of ['PRIVATE EVIDENCE','PRIVATE CHECKS','private.example',A,B])assert.equal(value.includes(forbidden),false);};
  const recoveryRequests=outcomeRequests.length;
  for(const failure of [503,409,429,500,'network']) {
    const draft='Чернетка чату × '+failure+' 💛';await page.locator('#real-message').fill(draft);await consent.check();const before=outcomeRequests.length;
    if(failure==='network')networkFailure=true;else db.controls.nextOutcomeStatus=failure;
    await create.click();await ready();await kept(draft);await empty();unchanged();assert.equal(outcomeRequests.length-before,1,'Draft request retried automatically');
    const failedStatus=await page.locator('#real-status').innerText();assert.ok(failedStatus.length>0);
    if(failure===409){assert.equal(await controls.isHidden(),true);assert.equal(await consent.isChecked(),false);await reread();}else{assert.equal(await controls.isVisible(),true);assert.equal(await consent.isChecked(),true);assert.equal(await create.isEnabled(),true);}
    const retryBefore=outcomeRequests.length;await createDraft();await privateDraft();await kept(draft);unchanged();assert.equal(outcomeRequests.length-retryBefore,1);
    assert.notEqual(await page.locator('#real-status').innerText(),failedStatus,'Successful draft retry left failed state visible');
  }
  assert.ok(outcomeRequests.slice(recoveryRequests).every(body=>body.action==='state'),'Recovery sent a write RPC');
  report.checks.push('503/409/429/500/network preserve chat and clear stale draft; explicit retry reads once, excludes private partner data, no writes');
  for(const status of [401,403]){await page.locator('#real-message').fill('Чутлива чернетка');db.controls.nextOutcomeStatus=status;await create.click();await ready();await purged();unchanged();await reopen();await createDraft();}
  report.checks.push('401/403 purge private chat, outcomes, social text and permission');
  for(const status of [401,403]) {
    let releaseAuth,reachedAuth;const heldAuth=new Promise(resolve=>{releaseAuth=resolve}),startedAuth=new Promise(resolve=>{reachedAuth=resolve});
    db.controls.beforeOutcome=async body=>{if(body.action==='state'){reachedAuth();await heldAuth;}};db.controls.nextOutcomeStatus=status;
    await create.click();await startedAuth;await consent.uncheck();releaseAuth();db.controls.beforeOutcome=null;await ready();await purged();unchanged();await reopen();await createDraft();
  }
  report.checks.push('401/403 still purge the active session after draft consent is revoked');
  for(const mode of ['consent','wording','logout']) {
    let releaseFailure,reachedFailure;const held=new Promise(resolve=>{releaseFailure=resolve}),started=new Promise(resolve=>{reachedFailure=resolve});
    db.controls.beforeOutcome=async body=>{if(body.action==='state'){reachedFailure();await held;}};db.controls.nextOutcomeStatus=500;
    await create.click();await started;
    if(mode==='consent')await consent.uncheck();else if(mode==='wording'){const format=page.locator('#real-social-wording');await format.selectOption(await format.inputValue()==='general'?'linkedin':'general');}else{await page.locator('#real-logout').click();await page.waitForFunction(()=>document.getElementById('real-status').textContent==='Ти вийшов/вийшла з Synera.');}
    const afterUserAction=await page.locator('#real-status').innerText();releaseFailure();db.controls.beforeOutcome=null;await ready();
    assert.equal(await page.locator('#real-status').innerText(),afterUserAction,'Late failed draft changed '+mode+' state');await empty();assert.equal(await consent.isChecked(),false);unchanged();
    if(mode==='logout'){await purged();await reopen();}await createDraft();
  }
  report.checks.push('late failed draft cannot change revoked consent, changed format or completed logout state');
`);
replace("report.status = 'PASS_LOCAL_CASE_SOCIAL_BROWSER';","report.status = 'PASS_LOCAL_SOCIAL_RECOVERY_BROWSER';");
replace('`${proof}/CASE_SOCIAL_BROWSER${red ? \'_RED\' : \'\'}.json`',"`${proof}/${mutation?'MUTATION_DETAIL':'BROWSER_DETAIL'}.json`");
const runner=path.join(root,proof,mutation?'mutation-runner.mjs':'runner.mjs');await fs.writeFile(runner,source);
const before=await read('web_launch/real-journey.mjs');const result=spawnSync(process.execPath,[runner,...(mutation?['--mutate-late-error']:[])],{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:1024*1024});
report.exit_code=result.status;report.signal=result.signal;report.runner_sha256=hash(Buffer.from(source));report.browser=JSON.parse((await read(proof+'/'+(mutation?'mutation/MUTATION_DETAIL':'BROWSER_DETAIL')+'.json')).toString('utf8'));
report.source_sha256=Object.fromEntries(await Promise.all(['web_launch/real-journey.mjs','tools/social-draft-recovery-browser.mjs'].map(async n=>[n,hash(await read(n))])));assert.deepEqual(await read('web_launch/real-journey.mjs'),before);
if(red){assert.notEqual(result.status,0);assert.match(report.browser.error,/Draft failure removed accepted private chat/);report.status='RED_CONFIRMED_DRAFT_CHAT_REMOVAL';}
else if(mutation){assert.notEqual(result.status,0);assert.match(report.browser.error,/Late failed draft changed (consent|wording|logout) state/);report.status='MUTANT_REJECTED_LATE_DRAFT_FAILURE';}
else{assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(report.browser.status,'PASS_LOCAL_SOCIAL_RECOVERY_BROWSER');report.status='PASS_LOCAL_PRIVATE_SOCIAL_RECOVERY';}
await fs.writeFile(path.join(root,proof,red?'RED.json':mutation?'MUTATION.json':'BROWSER.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,checks:report.browser.checks.length,error:report.browser.error,external_requests:report.browser.external_requests}));
