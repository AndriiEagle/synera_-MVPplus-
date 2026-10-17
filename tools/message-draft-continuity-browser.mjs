// Extend preserved actual browser interactions to verify a second, unsent draft.
// Actual Chromium message delivery recovery; the original two-participant oracle stays intact.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),proof='artifacts/product-status-20261004/draft-continuity';
const red=process.argv.includes('--red'),mutation=process.argv.includes('--mutate-late-error');
const hash=b=>createHash('sha256').update(b).digest('hex'),read=n=>fs.readFile(path.join(root,n));
await fs.mkdir(path.join(root,proof),{recursive:true});if(mutation)await fs.mkdir(path.join(root,proof,'mutation'),{recursive:true});
let source=(await read('tools/case-outcome-browser-acceptance.mjs')).toString('utf8');
const replace=(needle,replacement)=>{assert.equal(source.split(needle).length,2,'Extension seam drift: '+needle);source=source.replace(needle,replacement);};
for(const n of ['./fixtures/real-journey-fixture.mjs','./fixtures/case-outcome-fixture.mjs'])replace(`from '${n}'`,`from ${JSON.stringify(new URL(n,import.meta.url).href)}`);
replace("const baseline = process.argv.includes('--baseline'), proof = 'artifacts/overnight-20261004';",`const baseline=true,proof=${JSON.stringify(mutation?proof+'/mutation':proof)};`);
replace("const mutation = process.argv.includes('--mutate-purge');","const mutation=process.argv.includes('--mutate-late-error');");
replace('const db = createOutcomeFixture(), errors = [];','const db = createOutcomeFixture(), errors = [], external=[], messageRequests=[];let failNext=null,heldMessage=null;');
replace("const source = await fs.readFile('web_launch/real-journey.mjs', 'utf8'), marker = 'clearOutcomes(); outcomeUI.panel.hidden = true; state.conversationPeer = null;';",`const source=await fs.readFile('web_launch/real-journey.mjs','utf8'),marker='if (!draftChanged) ui.messageForm.reset();';`);
replace("body: source.replace(marker, 'outcomeUI.panel.hidden = true; state.conversationPeer = null;')","body: source.replace(marker,'ui.messageForm.reset();')");
replace("    await page.route('**/config.json'",`    await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==base){external.push(url.origin);await route.abort();return;}await route.fallback();});
    await page.route('**/config.json'`);
replace('      const response = await db.fetchFor(id)',`      if(url.pathname.endsWith('/meeting_messages')) {
        if(heldMessage?.actor===id&&heldMessage.method===request.method()&&(!heldMessage.afterBody||db.messages.some(row=>row.sender_id===id&&row.body===heldMessage.afterBody))){const held=heldMessage;heldMessage=null;held.reached();await held.wait;}
        messageRequests.push({actor:id,method:request.method()});
        if(failNext?.actor===id && failNext.method===request.method()) {
          const failure=failNext;failNext=null;if(failure.reached){failure.reached();await failure.wait;}
          if(failure.commit)await db.fetchFor(id)(url.pathname+url.search,{method:request.method(),headers:request.headers(),body:request.postData()});
          if(failure.status==='network'){await route.abort();return;}
          await route.fulfill({status:failure.status,json:{error:'fixture delivery unavailable'}});return;
        }
      }
      const response = await db.fetchFor(id)`);
replace('  if (!baseline) {',`  const kept=async draft=>{assert.equal(await a.locator('#real-conversation').isVisible(),true,'Send failure removed accepted private chat');assert.ok((await a.locator('#real-transcript').innerText()).includes(message));assert.equal(await a.locator('#real-message').inputValue(),draft);assert.equal(await a.locator('#real-blocked').isHidden(),true);};
  const purged=async()=>{await a.locator('#real-auth').waitFor({state:'visible'});assert.equal(await a.locator('#real-transcript').innerText(),'');assert.equal(await a.locator('#real-message').inputValue(),'');assert.equal(await a.locator('#real-conversation').isHidden(),true);};
  const reopen=async()=>{await a.reload();await a.locator('#real-content-panel').waitFor({state:'visible'});await open(a,'real-meetings-panel');await a.locator('#real-meetings').getByRole('button',{name:'Відкрити розмову',exact:true}).click();await ready(a);};
  const success=await a.locator('#real-status').innerText(),unchanged=JSON.stringify({cases:db.cases,approvals:db.approvals,meetings:db.meetings,events:db.events});
  const noOtherWrites=()=>assert.equal(JSON.stringify({cases:db.cases,approvals:db.approvals,meetings:db.meetings,events:db.events}),unchanged);
  for(const status of [503,409,429,500,'network']) {
    const draft='Не втратити × '+status+' 💛 <script>literal</script>',before=db.messages.length,requests=messageRequests.length;
    await a.locator('#real-message').fill(draft);failNext={actor:A,method:'POST',status};await a.locator('#real-message-form button').click();await ready(a);
    await kept(draft);assert.equal(db.messages.length,before);assert.notEqual(await a.locator('#real-status').innerText(),success);assert.equal(messageRequests.slice(requests).filter(row=>row.actor===A&&row.method==='POST').length,1,'Failed message retried automatically');noOtherWrites();
    await a.locator('#real-message-form button').click();await ready(a);assert.equal(db.messages.length,before+1);assert.equal(db.messages.at(-1).body,draft);assert.equal(await a.locator('#real-message').inputValue(),'');assert.ok((await a.locator('#real-transcript').innerText()).includes(draft));assert.equal(await a.locator('#real-transcript script').count(),0);await refresh(b);assert.ok((await b.locator('#real-transcript').innerText()).includes(draft));noOtherWrites();
  }
  report.checks.rejected_send_keeps_chat_and_draft_manual_retry_once=true;
  for(const phase of ['committed_post_response_lost','post_succeeded_read_failed']) {
    const draft='Доставка невідома × '+phase+' 💛',before=db.messages.length,requests=messageRequests.length;
    await a.locator('#real-message').fill(draft);failNext={actor:A,method:phase==='committed_post_response_lost'?'POST':'GET',status:503,commit:phase==='committed_post_response_lost'};
    await a.locator('#real-message-form button').click();await ready(a);await kept(draft);assert.equal(db.messages.length,before+1);assert.equal(db.messages.at(-1).body,draft);assert.notEqual(await a.locator('#real-status').innerText(),success);assert.equal(messageRequests.slice(requests).filter(row=>row.method==='POST').length,1);noOtherWrites();
    await refresh(a);await refresh(b);assert.ok((await a.locator('#real-transcript').innerText()).includes(draft));assert.ok((await b.locator('#real-transcript').innerText()).includes(draft));assert.equal(await a.locator('#real-message').inputValue(),draft);assert.equal(db.messages.length,before+1,'Readback resent delivered message');assert.equal(messageRequests.slice(requests).filter(row=>row.method==='POST').length,1);await a.locator('#real-message').fill('');
  }
  report.checks.ambiguous_delivery_keeps_draft_readback_without_resend=true;
  for(const status of [401,403]){await a.locator('#real-message').fill('Чутливий текст');const before=db.messages.length;failNext={actor:A,method:'POST',status};await a.locator('#real-message-form button').click();await ready(a);await purged();assert.equal(db.messages.length,before);await reopen();}
  report.checks.auth_failure_purges_private_state=true;
  for(const status of [500,401]) {
    let release,reached;const wait=new Promise(resolve=>{release=resolve}),started=new Promise(resolve=>{reached=resolve});
    const before=db.messages.length;await a.locator('#real-message').fill('Пізня відповідь '+status);failNext={actor:A,method:'POST',status,wait,reached};await a.locator('#real-message-form button').click();await started;
    await a.locator('#real-logout').click();await a.waitForFunction(()=>document.getElementById('real-status').textContent==='Ти вийшов/вийшла з Synera.');const afterLogout=await a.locator('#real-status').innerText();release();await ready(a);await purged();assert.equal(await a.locator('#real-status').innerText(),afterLogout,'Late failed send changed completed logout state');assert.equal(db.messages.length,before);await reopen();
  }
  report.checks.late_error_does_not_replace_logout_or_restore_chat=true;
  assert.equal(await a.evaluate(()=>document.documentElement.dataset.syneraAtelier||null),null);report.checks.current_default=true;
  const audit=await new AxeBuilder({page:a}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations,[]);report.checks.axe_violations=0;
  const transcript=a.getByRole('region',{name:'Приватні повідомлення',exact:true});await transcript.focus();assert.equal(await transcript.evaluate(node=>document.activeElement===node),true);await transcript.evaluate(node=>{node.scrollTop=0;});await a.keyboard.press('End');await a.waitForFunction(()=>document.getElementById('real-transcript').scrollTop>0);report.checks.keyboard_scrolls_private_history=true;
  const preferences=a.locator('[data-atelier-controls]');await preferences.locator('summary').click();await preferences.getByRole('button',{name:'Atelier 2026',exact:true}).click();assert.equal(await a.evaluate(()=>document.documentElement.dataset.syneraAtelier),'on');const atelierAudit=await new AxeBuilder({page:a}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(atelierAudit.violations,[]);await preferences.getByRole('button',{name:'Чинний',exact:true}).click();assert.equal(await a.evaluate(()=>document.documentElement.dataset.syneraAtelier||null),null);await preferences.locator('summary').click();assert.equal(await a.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);report.checks.atelier_reversible_quiet_motion=true;
  const layout=await a.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));assert.ok(layout.width<=layout.viewport);report.checks.no_overflow=layout;
  const storage=await a.evaluate(async()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage),caches:await caches.keys(),databases:await indexedDB.databases()}));assert.deepEqual(storage,{local:['synera.atelier.preferences.v1'],session:[],caches:[],databases:[]});report.checks.no_private_storage=true;
  await a.locator('#real-message').fill('Чернетка збережена × Zürich 💛');failNext={actor:A,method:'POST',status:503};await a.locator('#real-message-form button').click();await ready(a);await kept('Чернетка збережена × Zürich 💛');await a.locator('#real-conversation').scrollIntoViewIfNeeded();if(!mutation)await a.screenshot({path:proof+'/message-current-390x844.png'});
  assert.deepEqual(external,[]);report.external_requests=external;report.messages=db.messages.length;report.message_requests=messageRequests;noOtherWrites();
  if (!baseline) {`);
replace("report.status = baseline ? 'PASS_PRESERVED_CHAT_BASELINE' : 'PASS_LOCAL_OUTCOME_BROWSER';","report.status = 'PASS_LOCAL_MESSAGE_RECOVERY_BROWSER';");
replace("'tools/case-outcome-browser-acceptance.mjs'];","'tools/case-outcome-browser-acceptance.mjs','tools/message-recovery-browser.mjs','tools/message-draft-continuity-browser.mjs'];");
replace("`${proof}/${baseline ? 'OUTCOME_UI_BASELINE' : mutation ? 'OUTCOME_UI_MUTATION' : 'CASE_OUTCOME_BROWSER'}.json`","`${proof}/${mutation?'MUTATION_DETAIL':'BROWSER_DETAIL'}.json`");

replace('  report.checks.rejected_send_keeps_chat_and_draft_manual_retry_once=true;',String.raw`
  report.checks.rejected_send_keeps_chat_and_draft_manual_retry_once=true;
  for(const method of ['POST','GET']) {
    let release,reached;const wait=new Promise(resolve=>{release=resolve}),started=new Promise(resolve=>{reached=resolve});
    const priorText='Перше повідомлення × '+method+' 💛',nextDraft='Наступна думка × '+method+' 💛 <script>literal</script>  ',before=db.messages.length,requests=messageRequests.length;
    await a.locator('#real-message').fill(priorText);heldMessage={actor:A,method,wait,reached,afterBody:method==='GET'?priorText:null};await a.locator('#real-message-form button').click();await started;
    await a.locator('#real-message').fill(nextDraft);release();await ready(a);
    assert.equal(await a.locator('#real-message').inputValue(),nextDraft,'Previous send erased the next draft');assert.equal(db.messages.length,before+1);assert.equal(db.messages.at(-1).body,priorText);assert.ok((await a.locator('#real-transcript').innerText()).includes(priorText));assert.equal(messageRequests.slice(requests).filter(row=>row.actor===A&&row.method==='POST').length,1);
    await refresh(b);assert.ok((await b.locator('#real-transcript').innerText()).includes(priorText));assert.equal((await b.locator('#real-transcript').innerText()).includes(nextDraft.trim()),false,'New draft was sent without a click');noOtherWrites();
    if(method==='GET'&&!mutation){await a.locator('#real-conversation').scrollIntoViewIfNeeded();await a.screenshot({path:proof+'/next-draft-current-390x844.png'});}
    await a.locator('#real-message-form button').click();await ready(a);assert.equal(await a.locator('#real-message').inputValue(),'');assert.equal(db.messages.length,before+2);assert.equal(db.messages.at(-1).body,nextDraft.trim());await refresh(b);assert.ok((await b.locator('#real-transcript').innerText()).includes(nextDraft.trim()));noOtherWrites();
  }
  report.checks.next_draft_survives_previous_post_and_readback=true;
  report.checks.next_draft_only_sent_by_second_explicit_click=true;
`);

replace('  const a = await pageFor(A), b = await pageFor(B);',"  report.browser_engine={version:browser.version(),executable:process.env.SYNERA_CHROMIUM_EXECUTABLE||chromium.executablePath()};const a = await pageFor(A), b = await pageFor(B);");

const runner=path.join(root,proof,mutation?'mutation-runner.mjs':'runner.mjs');await fs.writeFile(runner,source);
const before=await read('web_launch/real-journey.mjs');const result=spawnSync(process.execPath,[runner,...(mutation?['--mutate-late-error']:[])],{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:1024*1024});
const detail=JSON.parse(await read(proof+'/'+(mutation?'mutation/MUTATION_DETAIL':'BROWSER_DETAIL')+'.json'));
assert.deepEqual(await read('web_launch/real-journey.mjs'),before);
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),provider_calls:0,provider_usd:0,exit_code:result.status,signal:result.signal,runner_sha256:hash(Buffer.from(source)),browser:detail,source_sha256:Object.fromEntries(await Promise.all(['web_launch/real-journey.mjs','tools/message-recovery-browser.mjs','tools/message-draft-continuity-browser.mjs'].map(async n=>[n,hash(await read(n))])))};
if(red){assert.notEqual(result.status,0);assert.match(detail.error,/Previous send erased the next draft/);report.status='RED_CONFIRMED_NEXT_DRAFT_LOSS';}
else if(mutation){assert.notEqual(result.status,0);assert.match(detail.error,/Previous send erased the next draft/);report.status='MUTANT_REJECTED_NEXT_DRAFT_LOSS';}
else{assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(detail.status,'PASS_LOCAL_MESSAGE_RECOVERY_BROWSER');report.status='PASS_LOCAL_PRIVATE_MESSAGE_DRAFT_CONTINUITY';}
await fs.writeFile(path.join(root,proof,red?'RED.json':mutation?'MUTATION.json':'BROWSER.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,checks:Object.keys(detail.checks).length,error:detail.error,external_requests:detail.external_requests}));
