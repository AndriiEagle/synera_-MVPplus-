import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createMessageFixture } from './fixtures/message-intent-fixture.mjs';
import { A, B, config } from './fixtures/real-journey-fixture.mjs';
const mutation=process.argv.includes('--mutate'), proof='artifacts/message-intent-20261005/'+(mutation?'mutation':'browser');
const db=createMessageFixture(), meeting='44444444-4444-4444-8444-444444444444';
db.meetings.push({id:meeting,sender_id:A,recipient_id:B,status:'accepted',created_at:new Date().toISOString(),proposed_at:new Date(Date.now()+86400000).toISOString(),duration_minutes:20,meeting_place:'Онлайн',sender_name:'Тест Андрій',recipient_name:'Тест Марія',note:'Synthetic accepted invitation'});
const hash=b=>createHash('sha256').update(b).digest('hex'),source=await fs.readFile('web_launch/real-journey-client.mjs');
const report={status:'NOT_ACCEPTED',scope:'Actual desktop Chromium 390x844; same-origin gateway with synthetic accounts/persistence. Not SQL or signed JWT/physical Android/live proof',checks:[],external:[],provider_calls:0,provider_usd:0,client_sha256:hash(source)};
await fs.mkdir(proof,{recursive:true});
const server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});let browser;
try {
  const base=await new Promise((resolve,reject)=>{let out='';const timeout=setTimeout(()=>reject(Error(out||'Local server unavailable')),20000);server.stdout.on('data',c=>{out+=c;const url=out.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];if(url){clearTimeout(timeout);resolve(url);}});server.once('exit',code=>{clearTimeout(timeout);reject(Error('Server exit '+code));});});
  browser=await chromium.launch({headless:true,executablePath:process.env.SYNERA_CHROMIUM_EXECUTABLE||chromium.executablePath()});
  let fail=null,held=null;const errors=[];
  const ready=p=>p.waitForFunction(()=>!document.body.dataset.realBusy);
  async function pageFor(actor){
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),p=await context.newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));
    await p.route('**/*',async route=>{if(new URL(route.request().url()).origin!==base){report.external.push(route.request().url());await route.abort();}else await route.fallback();});
    if(mutation)await p.route('**/real-journey-client.mjs',r=>{const needle='this.#pendingMessages.get(key) || crypto.randomUUID()';assert.equal(source.toString().split(needle).length,2);return r.fulfill({contentType:'text/javascript',body:source.toString().replace(needle,'crypto.randomUUID()')});});
    await p.route('**/config.json',r=>r.fulfill({json:{...config,messageIntentsEnabled:true}}));
    await p.route('**/api/neon/**',async route=>{
      const request=route.request(),url=new URL(request.url()),method=request.method(),sending=url.pathname.includes('/messages/');
      const response=await db.fetchFor(actor)(url.pathname+url.search,{method,headers:request.headers(),...(method==='GET'?{}:{body:request.postData()})});const body=await response.text();
      if(actor===A&&sending&&held){const h=held;held=null;h.reached();await h.wait;}
      if(actor===A&&fail&&((fail==='post'&&sending)||(fail==='read'&&method==='GET'&&url.pathname.endsWith('/meeting_messages')))){fail=null;await route.fulfill({status:503,json:{error:'fixture lost response'}});return;}
      await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body});
    });
    await p.goto(base+'/real-journey.html');await p.locator('#real-content-panel').waitFor({state:'visible'});await ready(p);if(!await p.locator('#real-meetings-panel').evaluate(n=>n.open))await p.locator('#real-meetings-panel summary').click();await p.locator('#real-meetings').getByRole('button',{name:'Відкрити розмову',exact:true}).click();await ready(p);return p;
  }
  const a=await pageFor(A),b=await pageFor(B),send=async text=>{await a.locator('#real-message').fill(text);await a.locator('#real-message-form button').click();await ready(a);};
  for(const phase of ['post','read']){
    const text='Втрата відповіді × '+phase+' 💛 <script>literal</script>',before=db.messages.length;fail=phase;await send(text);
    assert.equal(db.messages.length,before+1);assert.equal(await a.locator('#real-message').inputValue(),text);
    await a.locator('#real-refresh').click();await ready(a);assert.equal(await a.locator('#real-message').inputValue(),text);
    await a.locator('#real-message-form button').click();await ready(a);
    assert.equal(db.messages.length,before+1,'Explicit retry duplicated an already delivered message');assert.equal(await a.locator('#real-message').inputValue(),'');assert.equal(await a.locator('#real-transcript script').count(),0);
    await b.locator('#real-refresh').click();await ready(b);assert.ok((await b.locator('#real-transcript').innerText()).includes(text));report.checks.push({name:phase+'_ambiguous_delivery_manual_recovery',pass:true});
  }
  let release,reached;const wait=new Promise(r=>{release=r;}),barrier=new Promise(r=>{reached=r;});held={wait,reached};const before=db.messages.length;
  await a.locator('#real-message').fill('Вже надсилається');await a.locator('#real-message-form button').click();await barrier;await a.locator('#real-message').fill('Наступна думка 💛');release();await ready(a);
  assert.equal(db.messages.length,before+1);assert.equal(await a.locator('#real-message').inputValue(),'Наступна думка 💛');
  await a.locator('#real-message-form button').click();await ready(a);assert.equal(db.messages.length,before+2);report.checks.push({name:'next_unsent_draft_kept_and_sent_only_on_next_click',pass:true});
  await send('Повторюю свідомо');await send('Повторюю свідомо');assert.equal(db.messages.filter(r=>r.body==='Повторюю свідомо').length,2);report.checks.push({name:'acknowledged_identical_text_can_be_new_message',pass:true});
  const preferences=await a.evaluate(()=>({skin:document.documentElement.dataset.skin||null,storage:Object.keys(localStorage),overflow:document.documentElement.scrollWidth-innerWidth}));assert.ok(preferences.skin!=='atelier');assert.equal(preferences.overflow,0);assert.ok(preferences.storage.every(k=>k==='synera.atelier.preferences.v1'));
  const axe=await new AxeBuilder({page:a}).analyze();assert.equal(axe.violations.length,0);report.checks.push({name:'current_default_layout_private_storage_and_axe',pass:true,axe_violations:0});
  await a.locator('#real-message').fill('Приватна чернетка');await a.locator('#real-conversation').scrollIntoViewIfNeeded();await a.screenshot({path:proof+'/chat-390x844.png'});await fs.writeFile(proof+'/chat.txt',await a.locator('body').innerText());
  await a.locator('#real-logout').click();await a.locator('#real-auth').waitFor({state:'visible'});assert.equal(await a.locator('#real-message').inputValue(),'');assert.equal(await a.locator('#real-transcript').innerText(),'');report.checks.push({name:'logout_purges_private_draft_and_transcript',pass:true});
  assert.deepEqual(errors,[]);assert.deepEqual(report.external,[]);report.status='PASS_LOCAL_MESSAGE_INTENT_BROWSER';
}catch(error){report.error=error.message;if(mutation&&error.message.includes('Explicit retry duplicated'))report.status='MUTANT_REJECTED_DUPLICATE_MESSAGE';else throw error;}
finally{if(browser)await browser.close();server.kill();assert.equal(hash(await fs.readFile('web_launch/real-journey-client.mjs')),hash(source));await fs.writeFile(proof+'/RESULT.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
