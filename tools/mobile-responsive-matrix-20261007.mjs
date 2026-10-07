import { chromium, webkit } from 'playwright';
import fs from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
import { A, B, config, fields, createFixture } from './fixtures/real-journey-fixture.mjs';

// Local UI and synthetic transport evidence only. One browser; sequential contexts.
const option = (name) => process.argv.find(a=>a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const phase = option('phase') || process.env.MOBILE_PHASE || 'baseline';
const sizeFilter = option('sizes') || process.env.MOBILE_SIZES;
const temp='C:/Users/Andrii/.codex/tmp/synera-mobile-responsive';
await fs.mkdir(temp,{recursive:true});
for(const p of ['C:/Users/Andrii/.codex','C:/Users/Andrii/.codex/tmp',temp,'C:/Program Files/Google/Chrome/Application/chrome.exe'])assert.equal((await fs.lstat(p)).isSymbolicLink(),false,`C: runtime must not redirect: ${p}`);
process.env.TMP=temp;process.env.TEMP=temp;process.env.TMPDIR=temp;
const out = `artifacts/mobile-20261007/responsive/${phase}`;
await fs.mkdir(out, { recursive: true });
const sizes = [320,360,375,390,412,430,768].map(width => ({name:`${width}`,width,height:844}));
sizes.push({name:'landscape',width:844,height:390},{name:'large-text',width:390,height:844,large:true},{name:'reduced-motion',width:390,height:844,reduce:true});
sizes.push({name:'atelier-320',width:320,height:844,atelier:true},{name:'atelier-landscape',width:844,height:390,atelier:true});
const pages = Object.keys(PUBLIC_ASSETS).filter(p => p.endsWith('.html'));
const selected = (option('pages') || process.env.MOBILE_PAGES)?.split(',');
const mutation=option('mutation')||false;
if(option('capture-css')==='1')for(const name of ['style.css','summit.css'])await fs.copyFile('web_launch/'+name,out+'/'+name);
const results = {phase, temp, mutation, scope:'local source; isolated synthetic accounts, not live or physical devices', engines:[], rows:[], failures:[], sources:{}};
for (const file of Object.keys(PUBLIC_ASSETS).filter(p=>/\.(html|css|mjs)$/.test(p))) {
 results.sources[file]=createHash('sha256').update(await fs.readFile('web_launch/'+file)).digest('hex');
}
const server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{windowsHide:true,env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
const base=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error(log||'server timeout')),30000);server.stdout.on('data',b=>{log+=b;const m=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});server.on('error',reject);});
console.log('Server ready '+base);
let browser;
async function inspect(page, label, settings, engine) {
 const issues=[];
 const geometry=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main *,header *,footer *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.right>innerWidth+1||r.left < -1)&&getComputedStyle(e).position!=='absolute';}).slice(0,15).map(e=>({tag:e.tagName,id:e.id,class:e.className,text:e.textContent.slice(0,70),right:e.getBoundingClientRect().right}))}));
 if(geometry.document>geometry.viewport+1)issues.push({kind:'document-overflow',...geometry});
 const actions=await page.evaluate(()=>[...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary')].filter(e=>e.checkVisibility()&&!e.matches(':disabled')&&!e.closest('[inert]')&&!e.matches('.skip,.skip-link')).map(e=>{
  e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
  const r=e.getBoundingClientRect();
  // Wrapped inline links have empty space inside their union rectangle.
  const rect=[...e.getClientRects()].find(r=>r.width&&r.height)||r;
  const x=Math.max(0,Math.min(innerWidth-1,rect.x+rect.width/2)),y=Math.max(0,Math.min(innerHeight-1,rect.y+rect.height/2));
  const hit=document.elementFromPoint(x,y);
  return {id:e.id,tag:e.tagName,text:(e.innerText||e.getAttribute('aria-label')||e.name||'').slice(0,70),x:r.x,y:r.y,width:r.width,height:r.height,hit:!!hit&&(e===hit||e.contains(hit)),occluder:hit?`${hit.tagName}.${hit.className}`:null,clipped:r.x< -1||r.right>innerWidth+1||rect.y< -1||rect.bottom>innerHeight+1};
 }));
 const checked=actions.length;
 issues.push(...actions.filter(a=>!a.hit||a.clipped).map(a=>({kind:'unreachable-action',...a})));
 if(issues.some(i=>i.kind==='unreachable-action')) {
  const first=issues.find(i=>i.kind==='unreachable-action');
  await page.evaluate(a=>{const e=a.id?document.getElementById(a.id):[...document.querySelectorAll(a.tag)].find(e=>(e.innerText||e.getAttribute('aria-label')||e.name||'').slice(0,70)===a.text);e?.scrollIntoView({block:'center',behavior:'instant'});},first);
  await page.screenshot({path:`${out}/${engine}-${settings.name}-${label}-obstruction.png`});
 }
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
 const shot=`${engine}-${settings.name}-${label}.png`;
 await page.screenshot({path:`${out}/${shot}`,fullPage:true});
 const row={engine,size:settings.name,page:label,geometry,actionsChecked:checked,issues,screenshot:shot};results.rows.push(row);
 console.log(JSON.stringify({engine,size:settings.name,page:label,issues:issues.length}));
 return row;
}
const ready=p=>p.waitForFunction(()=>!document.body.dataset.realBusy);
async function open(p,id){const el=p.locator('#'+id);if(!await el.evaluate(e=>e.open))await el.locator('summary').first().click();}
async function peer(p,name){await ready(p);await open(p,'real-people-panel');await p.locator('#real-people article').filter({hasText:name}).getByRole('button').click();await ready(p);}
async function refresh(p){await p.locator('#real-refresh').click();await ready(p);}
async function approve(p){await p.locator('#real-approve-check').check();await p.locator('#real-approve').click();await ready(p);}
async function journey(context, settings, engine) {
 const db=createFixture();let actor=A;
 await context.route('**/config.json',r=>r.fulfill({json:config}));
 await context.route('**/api/neon/**',async r=>{const q=r.request(),u=new URL(q.url());const response=await db.fetchFor(actor)(u.pathname+u.search,{method:q.method(),headers:q.headers(),...(q.method()==='GET'?{}:{body:q.postData()})});await r.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});});
 const p=await context.newPage();
 const load=async()=>{await p.goto(base+'/real-journey.html');await p.locator('#real-content-panel').waitFor({state:'visible'});await enlarge(p,settings);};
 await load();await peer(p,'Тест Марія');await open(p,'real-editor');
 for(const [name,value] of Object.entries(fields())){const e=p.locator(`#real-terms-form [name="${name}"]`);if(await e.evaluate(e=>e.tagName==='SELECT'))await e.selectOption(value);else await e.fill(value);}
 await inspect(p,'journey-editor',settings,engine);
 await p.locator('#real-terms-form button[type=submit]').click();await ready(p);
 await inspect(p,'journey-review',settings,engine);await approve(p);
 actor=B;await load();await peer(p,'Тест Андрій');await approve(p);
 actor=A;await load();await peer(p,'Тест Марія');
 const invite=p.locator('#real-invite-form');
 await invite.locator('[name=note]').fill('Synthetic responsive acceptance');
 await invite.locator('[name=proposed_at]').fill(new Date(Date.now()+86400000).toISOString().slice(0,16));
 await invite.locator('[name=duration_minutes]').selectOption('30');await invite.locator('[name=meeting_place]').selectOption('Zürich');
 await inspect(p,'journey-invite',settings,engine);await invite.getByRole('button').click();await ready(p);
 actor=B;await load();await open(p,'real-meetings-panel');await p.locator('#real-meetings').getByRole('button',{name:'Прийняти',exact:true}).click();await ready(p);
 await p.locator('#real-meetings').getByRole('button',{name:'Відкрити розмову'}).click();await ready(p);
 const message='Перевірка мобільної розмови — '+ 'довгий_узгоджений_результат_'.repeat(12);
 await p.locator('#real-message').fill(message);await p.locator('#real-message-form button').click();await ready(p);
 assert.ok((await p.locator('#real-transcript').innerText()).includes(message));
 await inspect(p,'journey-chat',settings,engine);
 results.rows.at(-1).journey={bothApprovals:db.approvals.length,meetingAccepted:db.meetings[0].status,messageStored:db.messages.length};
 await p.close();
}
async function enlarge(p,s){if(s.large)await p.evaluate(()=>{const sizes=[...document.querySelectorAll('body *')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const [e,size] of sizes)e.style.fontSize=`${size*2}px`;});}
try {
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]) {
  // Never dereference unavailable D: browser cache. Previous metadata probe found no WebKit.
  if(engine==='webkit'){results.engines.push({engine,status:'UNAVAILABLE_CACHE_ON_D',boundary:'No installed C: WebKit selected; no install or D: probe'});continue;}
  console.log('Launching '+engine);
  browser=await type.launch({headless:true,args:['--enable-automation'],...(engine==='chromium'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
  const cdp=await browser.newBrowserCDPSession();
  const command=await cdp.send('Browser.getBrowserCommandLine');
  const profile=command.arguments.find(a=>a.startsWith('--user-data-dir='));
  assert.ok(profile?.replaceAll('\\','/').includes(temp),profile||'Missing isolated profile');
  results.engines.push({engine,status:'RUN',version:browser.version(),profile});await cdp.detach();
  for(const settings of sizes.filter(s=>!sizeFilter||sizeFilter.split(',').includes(s.name))) {
   const context=await browser.newContext({viewport:{width:settings.width,height:settings.height},reducedMotion:settings.reduce?'reduce':'no-preference',serviceWorkers:'block'});
   context.setDefaultTimeout(10000);
   if(settings.atelier)await context.addInitScript(()=>localStorage.setItem('synera.atelier.preferences.v1',JSON.stringify({version:1,enabled:true,accent:'gold',density:'comfortable',largeText:false,strongContrast:false})));
   await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
   if(mutation)for(const name of mutation==='extra'?['style.css','summit.css']:mutation==='all'?['triangle.css','real-journey.css','style.css','summit.css']:['triangle.css','real-journey.css']) {
    const body=['style.css','summit.css'].includes(name)?await fs.readFile(`artifacts/mobile-20261007/responsive/red-extra/${name}`,'utf8'):execFileSync('git',['show',`a284a1e:web_launch/${name}`],{encoding:'utf8',windowsHide:true});
    await context.route(`**/${name}`,r=>r.fulfill({status:200,contentType:'text/css',body}));
   }
   for(const file of pages.filter(p=>!selected||selected.includes(p))) {
    const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
    try{const response=await p.goto(base+'/'+file);assert.equal(response.status(),200);await p.waitForLoadState('networkidle');await enlarge(p,settings);const skip=p.getByRole('button',{name:'Пропустити',exact:true});if(await skip.isVisible()){await p.screenshot({path:`${out}/${engine}-${settings.name}-onboarding.png`});await skip.click();}const row=await inspect(p,file.replace('.html',''),settings,engine);row.pageErrors=errors;}
    catch(e){results.failures.push({engine,size:settings.name,page:file,error:e.message});}
    await p.close();
   }
   if(!selected||selected.includes('journey'))try{await journey(context,settings,engine);}catch(e){results.failures.push({engine,size:settings.name,page:'journey',error:e.message});console.log('JOURNEY FAILURE '+e.message);}
   await context.close();await fs.writeFile(out+'/matrix.json',JSON.stringify(results,null,2));
  }
  await browser.close();browser=null;
 }
} finally {if(browser)await browser.close();server.kill();results.cleanup={browserClosed:true,serverKillRequested:server.killed};results.summary={rows:results.rows.length,issues:results.rows.reduce((n,r)=>n+r.issues.length,0),failures:results.failures.length};await fs.writeFile(out+'/matrix.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.summary));}
if(results.failures.length||results.rows.some(r=>r.issues.length))process.exitCode=1;
// Imported app modules can keep timers alive after browser/server cleanup.
// This is a finite audit executable, never a background service.
process.exit(process.exitCode||0);
