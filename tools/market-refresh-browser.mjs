// Actual Chromium; synthetic accounts and loopback only. No live auth/capacity proof.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createMessageFixture } from './fixtures/message-intent-fixture.mjs';
import { A, B, config } from './fixtures/real-journey-fixture.mjs';
const phase=process.argv.includes('--mutate')?'mutation':process.argv.includes('--red')?'red':'green';
const proof=`artifacts/market-readiness-20261007/${phase}`;
const source=await fs.readFile('web_launch/real-journey.mjs'), hash=b=>createHash('sha256').update(b).digest('hex');
const report={status:'NOT_ACCEPTED',scope:'Chromium 390x844 synthetic transport; no physical Android/live users',checks:[],external:[],source_sha256:hash(source)};
await fs.mkdir(proof,{recursive:true});
const db=createMessageFixture(),meeting='44444444-4444-4444-8444-444444444444';
db.meetings.push({id:meeting,sender_id:A,recipient_id:B,status:'accepted',created_at:new Date().toISOString(),proposed_at:new Date(Date.now()+86400000).toISOString(),duration_minutes:20,meeting_place:'Онлайн'});
const server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
let browser;
try {
 const base=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Server unavailable')),15000);server.stdout.on('data',b=>{out+=b;const url=out.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];if(url){clearTimeout(timer);resolve(url);}});server.on('exit',()=>{clearTimeout(timer);reject(Error('Server exited'));});});
 browser=await chromium.launch({headless:true});
 const errors=[];let fail=null,hold=null;
 const ready=p=>p.waitForFunction(()=>!document.body.dataset.realBusy);
 async function page(){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),p=await context.newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',async r=>{if(new URL(r.request().url()).origin!==base){report.external.push(r.request().url());await r.abort();}else await r.fallback();});
  if(phase==='mutation')await p.route('**/real-journey.mjs',r=>r.fulfill({contentType:'text/javascript',body:execFileSync('git',['show','841af1c:web_launch/real-journey.mjs'])}));
  await p.route('**/config.json',r=>r.fulfill({json:{...config,messageIntentsEnabled:true}}));
  await p.route('**/api/neon/**',async r=>{
   const req=r.request(),url=new URL(req.url()),method=req.method();
   if(fail&&url.pathname.endsWith(fail.path)){
    const chosen=fail;fail=null;if(hold){const h=hold;hold=null;h.reached();await h.wait;}
    if(chosen.status==='network')await r.abort('failed');else await r.fulfill({status:chosen.status,json:{error:'synthetic temporary failure'}});return;
   }
   const response=await db.fetchFor(A)(url.pathname+url.search,{method,headers:req.headers(),...(method==='GET'?{}:{body:req.postData()})});
   await r.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
  });
  try { await p.goto(base+'/real-journey.html',{waitUntil:'domcontentloaded',timeout:20000}); } catch(error) { report.navigation_failure=await p.locator('body').innerText({timeout:1000}).catch(()=>null); await p.screenshot({path:proof+'/navigation-failure.png',timeout:3000}).catch(()=>{}); throw error; } return p;
 }
 const p=await page();await p.locator('#real-content-panel').waitFor({state:'visible'});
 await p.locator('#real-meetings').getByRole('button',{name:'Відкрити розмову',exact:true}).click();await ready(p);
 const draft='Моя наступна думка — без повторного написання 💛';
 for(const status of [503,'network']){
  await p.locator('#real-message').fill(draft);fail={path:'/session',status};await p.locator('#real-refresh').click();await ready(p);
  assert.equal(await p.locator('#real-message').inputValue(),draft,'Transient refresh erased the private draft');
  assert.equal(await p.locator('#real-conversation').isVisible(),true);
  assert.match(await p.locator('#real-status').innerText(),/не вдалося оновити/i);
  assert.equal(db.messages.length,0);report.checks.push({name:`draft_survives_${status}_without_send`,pass:true});
 }
 await p.locator('#real-refresh').click();await ready(p);assert.equal(await p.locator('#real-message').inputValue(),draft);assert.match(await p.locator('#real-status').innerText(),/оновлено з сервера/);
 await p.locator('#real-conversation').scrollIntoViewIfNeeded();await p.screenshot({path:proof+'/chat.png'});
 const terms=await page();await terms.locator('#real-content-panel').waitFor({state:'visible'});await terms.locator('#real-people').getByRole('button',{name:'Відкрити умови'}).first().click();await ready(terms);
 await terms.locator('[name="give_target"]').fill('Незбережена пропозиція');fail={path:'/profiles',status:503};await terms.locator('#real-refresh').click();await ready(terms);
 assert.equal(await terms.locator('[name="give_target"]').inputValue(),'Незбережена пропозиція');assert.match(await terms.locator('#real-status').innerText(),/не вдалося оновити/i);report.checks.push({name:'terms_draft_survives_later_dashboard_failure',pass:true});
 await terms.close();
 let release,reached;hold={wait:new Promise(r=>release=r),reached:()=>reached()};const barrier=new Promise(r=>reached=r);fail={path:'/session',status:503};
 await p.locator('#real-refresh').click();await barrier;await p.locator('#real-logout').click();release();await ready(p);
 assert.equal(await p.locator('#real-auth').isVisible(),true);assert.equal(await p.locator('#real-message').inputValue(),'');assert.equal(await p.locator('#real-content-panel').isVisible(),false);report.checks.push({name:'late_failure_does_not_resurrect_logout',pass:true});
 for(const status of [401,403]){const q=await page();await q.locator('#real-content-panel').waitFor({state:'visible'});await q.locator('#real-meetings').getByRole('button',{name:'Відкрити розмову',exact:true}).click();await ready(q);await q.locator('#real-message').fill('Private');fail={path:'/session',status};await q.locator('#real-refresh').click();await ready(q);assert.equal(await q.locator('#real-message').inputValue(),'');assert.equal(await q.locator('#real-auth').isVisible(),true);await q.close();report.checks.push({name:`access_${status}_purges_draft`,pass:true});}
 fail={path:'/session',status:503};const cold=await page();await cold.locator('#real-blocked').waitFor({state:'visible'});assert.equal(await cold.locator('#real-content-panel').isVisible(),false);report.checks.push({name:'cold_start_still_fails_closed',pass:true});
 assert.deepEqual(errors,[]);assert.deepEqual(report.external,[]);assert.equal(db.messages.length,0);report.status='PASS_LOCAL_REFRESH_RECOVERY';
}catch(error){report.error=error.message;report.status=phase!=='green'&&error.message.includes('Transient refresh erased')?'EXPECTED_DEFECT_CAUGHT':'FAIL';if(report.status==='FAIL')process.exitCode=1;}
finally {if(browser)await browser.close();server.kill();assert.equal(hash(await fs.readFile('web_launch/real-journey.mjs')),hash(source));await fs.writeFile(proof+'/RESULT.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
