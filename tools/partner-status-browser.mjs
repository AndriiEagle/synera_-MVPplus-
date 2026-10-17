// Real mobile Chromium; synthetic transport reuses the existing gateway oracle.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { A, B, C, config, fields, createFixture } from './fixtures/real-journey-fixture.mjs';

const statusRed=process.argv.includes('--red-status'), red=process.argv.includes('--red'), mutation=process.argv.includes('--mutate');
const phase=statusRed?'status-red':red?'red':mutation?'mutation':'green', proof='artifacts/partner-status-20261005/'+phase;
const hash=b=>createHash('sha256').update(b).digest('hex');
await fs.mkdir(proof,{recursive:true});
const before=await fs.readFile('web_launch/real-journey.mjs');
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),phase,checks:{},external_requests:[],provider_calls:0,provider_usd:0,scope:'Desktop Chromium 390x844, synthetic accounts through handleNeon; no live JWT/account/Android/production acceptance'};
const server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
let browser;
try {
  const base=await new Promise((resolve,reject)=>{let out='';const timeout=setTimeout(()=>reject(Error(out||'Local server unavailable')),20000);server.stdout.on('data',c=>{out+=c;const url=out.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];if(url){clearTimeout(timeout);resolve(url);}});server.once('exit',code=>{clearTimeout(timeout);reject(Error('Server exit '+code));});});
  browser=await chromium.launch({headless:true,executablePath:process.env.SYNERA_CHROMIUM_EXECUTABLE||chromium.executablePath()});
  const db=createFixture(),errors=[];let held=null,failure=null;
  const snapshot=()=>JSON.stringify({cases:db.cases,approvals:db.approvals,meetings:db.meetings,messages:db.messages});
  const writes=actor=>db.requests.filter(r=>r.actor===actor&&r.method!=='GET'&&!r.path.endsWith('/sign-out')).length;
  const ready=p=>p.waitForFunction(()=>!document.body.dataset.realBusy);
  const open=async(p,id)=>{const panel=p.locator('#'+id);if(!await panel.evaluate(n=>n.open))await panel.locator('summary').click();};
  const peer=async(p,name)=>{await open(p,'real-people-panel');await p.locator('#real-people article').filter({hasText:name}).getByRole('button',{name:'Відкрити умови'}).click();await ready(p);};
  const refresh=async p=>{await p.locator('#real-refresh').click();await ready(p);};
  const poll=p=>p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  const review=p=>p.locator('#real-terms-review');
  const waitText=async(p,text)=>{try{await p.waitForFunction(t=>document.querySelector('#real-terms-review').innerText.includes(t),text,{timeout:11000});}catch{assert.fail('Partner state did not update automatically: '+text);}};
  const capture=async(p,name,target)=>{if(red||mutation)return;await p.locator(target).scrollIntoViewIfNeeded();await p.screenshot({path:proof+'/'+name+'.png'});await fs.writeFile(proof+'/'+name+'.txt',await p.locator('body').innerText());};
  async function pageFor(id) {
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),p=await context.newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));
    await p.route('**/*',async route=>{if(new URL(route.request().url()).origin!==base){report.external_requests.push(route.request().url());await route.abort();}else await route.fallback();});
    if(mutation)await p.route('**/real-journey.mjs',async route=>{const source=before.toString('utf8'),marker='if (!state.meetingId) {';assert.equal(source.split(marker).length,2);await route.fulfill({contentType:'text/javascript',body:source.replace(marker,'if (!state.meetingId) { return; // mutant: disable partner reads\n')});});
    await p.route('**/config.json',r=>r.fulfill({json:config}));
    await p.route('**/api/neon/**',async route=>{
      const request=route.request(),url=new URL(request.url()),method=request.method();
      if(failure&&id===A&&method==='GET'&&url.pathname.endsWith('/match_cases')){const status=failure;failure=null;await route.fulfill({status,json:{error:'fixture unavailable'}});return;}
      const response=await db.fetchFor(id)(url.pathname+url.search,{method,headers:request.headers(),...(method==='GET'?{}:{body:request.postData()})});
      const body=await response.text();
      if(held&&id===A&&method==='GET'&&url.pathname.endsWith(held.path)){const h=held;held=null;h.reached();await h.wait;}
      await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body});
    });
    await p.goto(base+'/real-journey.html');await p.locator('#real-content-panel').waitFor({state:'visible'});return p;
  }
  const a=await pageFor(A),b=await pageFor(B);
  const fill=async(p,overrides={})=>{await open(p,'real-editor');for(const[name,value]of Object.entries(fields(overrides))){const input=p.locator(`#real-terms-form [name="${name}"]`);if(await input.evaluate(n=>n.tagName==='SELECT'))await input.selectOption(String(value));else await input.fill(String(value));}};
  const save=async p=>{await p.locator('#real-terms-form button[type=submit]').click();await ready(p);};
  const approve=async p=>{await p.locator('#real-approve-check').check();await p.locator('#real-approve').click();await ready(p);};
  await peer(a,'Тест Марія');await fill(a);await save(a);await approve(a);
  await refresh(b);await peer(b,'Тест Андрій');
  await a.locator('#real-invite-form [name=note]').evaluate(n=>{n.value='Не надсилати чернетку × 💛';});
  await open(a,'real-editor');await a.locator('#real-terms-form [name=give_target]').fill('Моя незавершена чернетка × Zürich 💛');
  await a.locator('#real-approve-check').check();
  const aWrites=writes(A);await approve(b);const accepted=snapshot();
  // First assertion uses the real five-second scheduler, with no A refresh click.
  await waitText(a,'Погоджено обома');
  assert.equal(await a.locator('#real-invite').isVisible(),true);
  assert.equal(await a.locator('#real-terms-form [name=give_target]').inputValue(),'Моя незавершена чернетка × Zürich 💛');
  assert.equal(await a.locator('#real-editor').evaluate(n=>n.open),true);
  assert.equal(await a.locator('#real-invite-form [name=note]').inputValue(),'Не надсилати чернетку × 💛');
  assert.equal(snapshot(),accepted);assert.equal(writes(A),aWrites);
  report.checks.scheduled_partner_approval_updates_without_refresh_or_write=true;
  await capture(a,'01-partner-approved','#real-terms-review');
  const readState=await a.evaluate(()=>{const n=document.querySelector('#real-terms-review dd'),r=document.createRange();r.selectNodeContents(n);getSelection().removeAllRanges();getSelection().addRange(r);return {text:getSelection().toString(),node:n.textContent};});
  await a.locator('#real-terms-form [name=give_target]').focus();
  const response=a.waitForResponse(r=>r.url().includes('/match_case_approvals')&&r.request().method()==='GET');await poll(a);await response;
  await a.waitForTimeout(150);
  assert.equal(await a.evaluate(()=>getSelection().toString()),readState.text);
  assert.equal(await a.evaluate(()=>document.activeElement?.name),'give_target');
  assert.equal(await a.locator('#real-editor').evaluate(n=>n.open),true);assert.equal(writes(A),aWrites);
  report.checks.unchanged_read_keeps_focus_selection_and_editor=true;
  // A edits v1; B submits v2. A must see v2 but cannot silently rebase its v1 draft.
  await fill(b,{give_target:'Партнерська редакція × <script>literal</script>'});await save(b);await poll(a);await waitText(a,'Редакція 2');
  assert.equal(await a.locator('#real-approve-check').isChecked(),false);assert.equal(await a.locator('#real-approve').isDisabled(),true);assert.equal(await a.locator('#real-invite').isHidden(),true);
  assert.equal(await a.locator('#real-terms-form [name=give_target]').inputValue(),'Моя незавершена чернетка × Zürich 💛');
  assert.equal(await review(a).locator('script').count(),0);
  const version=db.cases[0].version,prior=snapshot();await save(a);
  assert.equal(db.cases[0].version,version,'Old draft silently rebased onto partner revision');assert.equal(snapshot(),prior);
  assert.match(await a.locator('#real-status').innerText(),/Умови змінилися/);
  assert.equal(await a.locator('#real-terms-form [name=give_target]').inputValue(),'Моя незавершена чернетка × Zürich 💛');
  report.checks.partner_revision_resets_consent_keeps_draft_and_compare_swap=true;
  await capture(a,'02-revision-keeps-draft','#real-status');
  // Explicit re-opening reads the newer form; no draft is accepted by the timer.
  await peer(a,'Тест Марія');assert.equal(await a.locator('#real-terms-form [name=take_target]').inputValue(),'Партнерська редакція × <script>literal</script>');
  await approve(a);await approve(b);await poll(a);await waitText(a,'Погоджено обома');
  await a.locator('#real-invite-form [name=note]').fill('Запрошення вручну × Zürich');await a.locator('#real-invite-form [name=proposed_at]').fill(new Date(Date.now()+86400000).toISOString().slice(0,16));
  await a.locator('#real-invite-form button').click();await ready(a);assert.equal(db.meetings.length,1,await a.locator('#real-status').innerText());const invited=snapshot();await poll(b);
  await open(b,'real-meetings-panel');await b.locator('#real-meetings').getByRole('button',{name:'Прийняти',exact:true}).waitFor({state:'visible'});
  assert.equal(snapshot(),invited);assert.equal(db.meetings[0].status,'pending');
  await open(b,'real-meetings-panel');await b.locator('#real-meetings').getByRole('button',{name:'Прийняти',exact:true}).click();await ready(b);await poll(a);
  await open(a,'real-meetings-panel');await a.locator('#real-meetings').getByRole('button',{name:'Відкрити розмову'}).waitFor({state:'visible'});
  assert.equal(await a.locator('#real-conversation').isHidden(),true,'Read opened chat for the user');
  const currentLabel=(await a.locator('#real-meetings article h3').innerText()).split(' · ').at(-1);
  assert.ok((await a.locator('#real-status').innerText()).includes(currentLabel),'Live hint contradicts the accepted invitation card');
  report.checks.invitation_arrives_and_acceptance_updates_without_auto_actions=true;
  await capture(a,'03-accepted-invitation','#real-meetings-panel');
  await b.locator('#real-withdraw').click();await ready(b);await poll(a);await waitText(a,'Очікує підтвердження');assert.equal(await a.locator('#real-invite').isHidden(),true);report.checks.withdrawal_removes_invitation_action=true;
  // Delay an old read, perform an explicit newer action, then release the old read.
  let release,reached;const wait=new Promise(r=>release=r),started=new Promise(r=>reached=r);held={path:'/match_case_approvals',wait,reached};await poll(a);await started;
  await a.locator('#real-withdraw').click();await ready(a);const afterWithdrawal=snapshot();release();await a.waitForTimeout(200);
  assert.ok(!(await review(a).innerText()).includes('Тест Андрій: підтвердив'));assert.equal(snapshot(),afterWithdrawal);report.checks.late_read_cannot_restore_withdrawn_approval=true;
  const old=snapshot();failure=503;await poll(a);await a.waitForTimeout(200);assert.equal(await a.locator('#real-content-panel').isVisible(),true);assert.equal(snapshot(),old);await poll(a);await a.waitForTimeout(200);report.checks.transient_read_failure_preserves_private_drafts=true;
  // A separate actor avoids counting already-started reads on the active page.
  const hidden=await pageFor(C);await peer(hidden,'Тест Андрій');
  await hidden.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
  const count=db.requests.length;await hidden.waitForTimeout(5500);assert.equal(db.requests.slice(count).some(r=>r.actor===C),false);await hidden.context().close();report.checks.hidden_page_does_not_read=true;
  // Changing peer invalidates an in-flight read, even when it would enable actions.
  let releasePeer,reachedPeer;const waitPeer=new Promise(r=>releasePeer=r),startedPeer=new Promise(r=>reachedPeer=r);held={path:'/match_case_approvals',wait:waitPeer,reached:reachedPeer};await poll(a);await startedPeer;
  await peer(a,'Тест Олег');releasePeer();await a.waitForTimeout(200);assert.equal(await review(a).innerText(),'');assert.equal(await a.locator('#real-invite').isHidden(),true);report.checks.late_read_cannot_restore_another_peer=true;
  const audit=await new AxeBuilder({page:a}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations,[]);assert.equal(await a.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await a.evaluate(()=>document.documentElement.dataset.syneraAtelier||null),null);report.checks.current_default_mobile_accessibility=true;
  await peer(a,'Тест Марія');let releaseLogout,reachedLogout;const waitLogout=new Promise(r=>releaseLogout=r),startedLogout=new Promise(r=>reachedLogout=r);held={path:'/match_case_approvals',wait:waitLogout,reached:reachedLogout};await poll(a);await startedLogout;
  await a.locator('#real-logout').click();releaseLogout();await a.waitForTimeout(200);assert.equal(await a.locator('#real-content-panel').isHidden(),true);assert.equal(await review(a).innerText(),'');assert.equal(await a.locator('#real-terms-form [name=give_target]').inputValue(),'');report.checks.logout_purges_private_ui_and_late_reads=true;
  assert.deepEqual(errors,[]);assert.deepEqual(report.external_requests,[]);report.status='PASS_LOCAL_PARTNER_STATUS_BROWSER';report.browser={version:browser.version(),viewport:[390,844]};
}catch(error){report.error=error.message;}
finally{if(browser)await browser.close();server.kill();}
assert.deepEqual(await fs.readFile('web_launch/real-journey.mjs'),before,'Test changed canonical controller');
report.source_sha256=Object.fromEntries(await Promise.all(['web_launch/real-journey.mjs','web_launch/real-journey-client.mjs','web_launch/real-journey.html','neon/worker.mjs','tools/fixtures/real-journey-fixture.mjs','tools/partner-status-browser.mjs'].map(async n=>[n,hash(await fs.readFile(n))])));
const expected=statusRed?/Live hint contradicts the accepted invitation card/:/Partner state did not update automatically/;
if(red||statusRed||mutation){assert.match(report.error||'',expected);report.status=statusRed?'RED_HINT_CONTRADICTS_ACCEPTED_INVITATION':red?'RED_PARTNER_STATUS_REQUIRES_REFRESH':'MUTANT_REJECTED_PARTNER_STATUS_REQUIRES_REFRESH';}
await fs.writeFile('artifacts/partner-status-20261005/'+phase.toUpperCase()+'.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,checks:Object.keys(report.checks).length,error:report.error}));
if(!red&&!statusRed&&!mutation)assert.equal(report.status,'PASS_LOCAL_PARTNER_STATUS_BROWSER',report.error);
