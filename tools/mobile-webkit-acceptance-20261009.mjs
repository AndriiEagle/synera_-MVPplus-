// Desktop WebKit with iPhone browser settings; never physical iOS/PWA-install proof.
// Reuses the accepted two-party fixture and journey from the 20261007 matrix.
import { webkit, chromium, devices } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { A, B, config, fields, createFixture } from './fixtures/real-journey-fixture.mjs';

const option = name => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const phase = option('phase') || 'baseline';
assert.match(phase, /^[a-z0-9-]+$/);
const root = path.resolve(option('candidate') || 'web_launch/dist-neon-mobile-final-20261007');
assert.equal(path.dirname(root),path.resolve('web_launch'));
assert.match(path.basename(root),/^dist-neon-[a-z0-9-]+$/);
const out = path.resolve('artifacts/mobile-webkit-20261009', phase);
await fs.mkdir(out, { recursive: true });
const sha = b => createHash('sha256').update(b).digest('hex');
const releaseBytes = await fs.readFile(path.join(root, 'release.json'));
const releaseHash = sha(releaseBytes);
assert.equal(releaseHash,option('release-sha') || 'a80d283892665eaf3800060f5154e3f37eae545ff5f9186fcbb35efd18b7315c');
const manifest = JSON.parse(releaseBytes).files;
async function verifyCandidate() {
  for(const file of manifest) {
    assert.equal(path.basename(file.name),file.name,'Flat candidate assets only');
    const bytes=await fs.readFile(path.join(root,file.name));
    assert.equal(bytes.length,file.bytes,file.name+' size');
    assert.equal(sha(bytes),file.sha256,file.name+' hash');
  }
}
await verifyCandidate();
const mutation = option('mutation') === 'overflow';
const cssOverride = option('css');
const cssBytes = cssOverride ? await fs.readFile(cssOverride) : null;
const engine = option('engine') || 'webkit';
assert.ok(['webkit','chromium'].includes(engine));
const result = { phase, mutation, scope: 'Desktop browser, emulated iPhone browser settings, synthetic Auth/Data; no physical iOS, Android, PWA installation or live accounts', candidate:path.relative(process.cwd(),root),releaseHash, cssOverride:cssOverride?{file:cssOverride,sha256:sha(cssBytes)}:null, manifestFilesVerified:manifest.length, engine: null, rows: [], journeys: [], failures: [], provider_calls: 0, usd: 0 };
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.mjs':'text/javascript', '.js':'text/javascript', '.json':'application/json', '.webmanifest':'application/manifest+json', '.png':'image/png', '.svg':'image/svg+xml', '.webp':'image/webp', '.woff2':'font/woff2' };
const server = http.createServer(async (req,res) => {
  try {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const bytes = await fs.readFile(file);
    res.writeHead(200, {'content-type':mime[path.extname(file)] || 'application/octet-stream'}).end(bytes);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const profiles = [
  {name:'small',width:320,height:568}, {name:'compact',width:375,height:667},
  {name:'standard',width:390,height:844}, {name:'large',width:430,height:932},
  {name:'landscape',width:844,height:390}, {name:'tablet',width:768,height:1024},
  {name:'large-text',width:390,height:844,large:true},
  {name:'atelier',width:390,height:844,atelier:true},
];
const selected = option('sizes')?.split(',');
const selectedPages = option('pages')?.split(',');
const ready = p => p.waitForFunction(() => !document.body.dataset.realBusy);
async function open(p,id) { const el=p.locator('#'+id); if (!await el.evaluate(e=>e.open)) await el.locator('summary').first().click(); }
async function peer(p,name) { await ready(p); await open(p,'real-people-panel'); await p.locator('#real-people article').filter({hasText:name}).getByRole('button').click(); await ready(p); }
async function approve(p) { await p.locator('#real-approve-check').check(); await p.locator('#real-approve').click(); await ready(p); }
async function enlarge(p,s) { if(s.large) await p.evaluate(()=>{const items=[...document.querySelectorAll('body *')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const [e,n] of items)e.style.fontSize=`${n*2}px`;}); }
async function inspect(p,label,s) {
  const geometry=await p.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return e.checkVisibility()&&r.width&&(r.right>innerWidth+1||r.left < -1||e.scrollWidth>e.clientWidth+1);}).slice(0,20).map(e=>({tag:e.tagName,id:e.id,name:e.getAttribute('name'),class:e.className,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width,scrollWidth:e.scrollWidth,grid:getComputedStyle(e).gridTemplateColumns}))}));
  const actions=await p.evaluate(()=>[...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary')].filter(e=>e.checkVisibility()&&!e.matches(':disabled')&&!e.closest('[inert]')&&!e.matches('.skip,.skip-link')).map(e=>{
    e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
    const r=e.getBoundingClientRect(), rect=[...e.getClientRects()].find(r=>r.width&&r.height)||r;
    const x=Math.max(0,Math.min(innerWidth-1,rect.x+rect.width/2)),y=Math.max(0,Math.min(innerHeight-1,rect.y+rect.height/2)),hit=document.elementFromPoint(x,y);
    return {id:e.id,tag:e.tagName,text:(e.innerText||e.getAttribute('aria-label')||e.name||'').slice(0,60),hit:!!hit&&(e===hit||e.contains(hit)),clipped:r.x < -1||r.right > innerWidth+1||rect.y < -1||rect.bottom > innerHeight+1};
  }));
  const issues=actions.filter(a=>!a.hit||a.clipped).map(a=>({kind:'unreachable-action',...a}));
  if(geometry.document > geometry.viewport+1) issues.push({kind:'document-overflow',...geometry});
  await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  const shot=`${s.name}-${label}.png`;
  const capture=issues.length || label==='get' || label==='journey-chat' || option('capture-editor')==='1'&&label==='journey-editor';
  if(capture) await p.screenshot({path:path.join(out,shot),fullPage:true});
  const row={profile:s.name,page:label,geometry,actions:actions.length,issues,screenshot:capture?shot:null};
  result.rows.push(row); console.log(JSON.stringify({profile:s.name,page:label,issues:issues.length}));
}
async function journey(context,s) {
  const db=createFixture(); let actor=A;
  await context.route('**/config.json',r=>r.fulfill({json:config}));
  await context.route('**/api/neon/**',async r=>{const q=r.request(),u=new URL(q.url()),response=await db.fetchFor(actor)(u.pathname+u.search,{method:q.method(),headers:q.headers(),...(q.method()==='GET'?{}:{body:q.postData()})});await r.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});});
  const p=await context.newPage();
  const load=async()=>{await p.goto(base+'/real-journey.html');await p.locator('#real-content-panel').waitFor({state:'visible'});await enlarge(p,s);};
  try {
    await load(); await peer(p,'Тест Марія'); await open(p,'real-editor');
    for(const [name,value] of Object.entries(fields())){const e=p.locator(`#real-terms-form [name="${name}"]`);if(await e.evaluate(e=>e.tagName==='SELECT'))await e.selectOption(value);else await e.fill(value);}
    if(option('diagnose')==='1') await fs.writeFile(path.join(out,`${s.name}-form-diagnostic.json`),JSON.stringify(await p.locator('#real-terms-form').evaluate(e=>[e,...e.querySelectorAll('*')].map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {tag:e.tagName,name:e.getAttribute('name'),type:e.getAttribute('type'),label:e.tagName==='LABEL'?e.firstChild?.textContent:null,width:r.width,right:r.right,client:e.clientWidth,scroll:e.scrollWidth,display:c.display,grid:c.gridTemplateColumns,whiteSpace:c.whiteSpace,overflow:c.overflow,minWidth:c.minWidth,maxWidth:c.maxWidth,font:c.fontSize};})),null,2)+'\n');
    if(option('isolate')==='1') await fs.writeFile(path.join(out,`${s.name}-isolation.json`),JSON.stringify(await p.evaluate(()=>{const rows=[];for(const rule of ['.real-form select{display:none!important}', '.real-form option{display:none!important}', '.real-form label{display:block!important}', '.real-form fieldset{display:block!important}', '.real-form{display:block!important}', '.real-form select{appearance:none!important;-webkit-appearance:none!important;overflow:hidden!important}', '.real-form select{text-overflow:ellipsis!important;white-space:normal!important}']){const style=document.createElement('style');style.textContent=rule;document.head.append(style);rows.push({rule,width:document.documentElement.scrollWidth});style.remove();}return {baseline:document.documentElement.scrollWidth,rows};}),null,2)+'\n');
    await inspect(p,'journey-editor',s); await p.locator('#real-terms-form button[type=submit]').click(); await ready(p); await approve(p);
    actor=B; await load(); await peer(p,'Тест Андрій'); await approve(p);
    actor=A; await load(); await peer(p,'Тест Марія');
    const invite=p.locator('#real-invite-form');
    await invite.locator('[name=note]').fill('Synthetic WebKit acceptance');
    await invite.locator('[name=proposed_at]').fill(new Date(Date.now()+86400000).toISOString().slice(0,16));
    await invite.locator('[name=duration_minutes]').selectOption('30'); await invite.locator('[name=meeting_place]').selectOption('Zürich');
    await inspect(p,'journey-invite',s); await invite.getByRole('button').click(); await ready(p);
    actor=B; await load(); await open(p,'real-meetings-panel'); await p.locator('#real-meetings').getByRole('button',{name:'Прийняти',exact:true}).click(); await ready(p);
    await p.locator('#real-meetings').getByRole('button',{name:'Відкрити розмову'}).click(); await ready(p);
    const message='WebKit: узгоджений результат — '+ 'довгий_текст_'.repeat(12);
    await p.locator('#real-message').fill(message); await p.locator('#real-message-form button').click(); await ready(p);
    assert.ok((await p.locator('#real-transcript').innerText()).includes(message));
    assert.equal(db.approvals.length,2); assert.equal(db.meetings[0].status,'accepted'); assert.equal(db.messages.length,1);
    await inspect(p,'journey-chat',s); result.journeys.push({profile:s.name,approvals:2,accepted:1,messages:1});
  } finally { await p.close(); }
}
let browser;
try {
  const type=engine==='webkit'?webkit:chromium;
  browser=await type.launch({headless:true,timeout:30000,...(engine==='chromium'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})}); result.engine={name:engine,version:browser.version(),executable:engine==='chromium'?'C:/Program Files/Google/Chrome/Application/chrome.exe':webkit.executablePath()};
  for(const s of profiles.filter(s=>!selected||selected.includes(s.name))) {
    const context=await browser.newContext({...devices['iPhone 13'],viewport:{width:s.width,height:s.height},serviceWorkers:'block',reducedMotion:'reduce'});
    context.setDefaultTimeout(12000);
    await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
    if(cssBytes) await context.route('**/real-journey.css',r=>r.fulfill({contentType:'text/css',body:cssBytes}));
    if(s.atelier) await context.addInitScript(()=>localStorage.setItem('synera.atelier.preferences.v1',JSON.stringify({version:1,enabled:true,accent:'gold',density:'comfortable',largeText:false,strongContrast:false})));
    if(mutation) await context.addInitScript(()=>addEventListener('DOMContentLoaded',()=>{document.body.style.minWidth='1200px';}));
    for(const file of ['get.html','studio.html','triangle.html','outcome-archive.html'].filter(f=>!selectedPages||selectedPages.includes(f))) {
      const p=await context.newPage();
      try { const response=await p.goto(base+'/'+file); assert.equal(response.status(),200); await p.waitForLoadState('networkidle'); await enlarge(p,s); const skip=p.getByRole('button',{name:'Пропустити',exact:true}); if(await skip.isVisible())await skip.click(); await inspect(p,file.replace('.html',''),s); }
      catch(e){result.failures.push({profile:s.name,page:file,error:e.message});}
      finally {await p.close();}
    }
    try {await journey(context,s);} catch(e){result.failures.push({profile:s.name,page:'journey',error:e.message});}
    await context.close();
  }
} catch(e) {result.failures.push({stage:'launch',error:e.message});}
finally {
  if(browser)await browser.close(); await new Promise(resolve=>server.close(resolve));
  assert.equal(sha(await fs.readFile(path.join(root,'release.json'))),releaseHash,'Candidate changed during test');
  await verifyCandidate();
  result.summary={observations:result.rows.length,issues:result.rows.reduce((n,r)=>n+r.issues.length,0),failures:result.failures.length,journeys:result.journeys.length};
  result.status=result.summary.failures||result.summary.issues?'NEEDS_REVIEW':`PASS_DESKTOP_${engine.toUpperCase()}_SYNTHETIC`;
  await fs.writeFile(path.join(out,'RESULT.json'),JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify({status:result.status,...result.summary}));
}
process.exit(result.status.startsWith('PASS_DESKTOP_')?0:1);
