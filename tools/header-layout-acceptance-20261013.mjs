// Semantic guard: rendered overlap, reachable controls and preserved drafts.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(path.resolve(process.env.SYNERA_TEST_MODULE_ROOT||'.','package.json'));
const {chromium,webkit}=require('playwright');
const engine=process.argv.includes('--webkit')?webkit:chromium;
const variant=process.argv.includes('--mutant')?'mutant':process.argv.includes('--baseline')?'baseline':'candidate';
const root=path.resolve(process.env.SYNERA_TEST_WEB_ROOT||'web_launch'),out=path.resolve(process.env.SYNERA_TEST_OUTPUT_ROOT||'artifacts/header-layout-20261015',variant+(engine===webkit?'-webkit':''));
await fs.mkdir(out,{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(q,r)=>{try{const u=new URL(q.url,'http://local'),f=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!f.startsWith(root+path.sep)){r.writeHead(403).end();return;}r.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'}).end(await fs.readFile(f));}catch{r.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await engine.launch({headless:true}),result={variant,engine:browser.version(),runs:[],errors:[],scope:'Synthetic local draft; no backend, production, physical-device or human-usability proof'};
const fields=()=>[...document.querySelectorAll('#profile-form input,#profile-form textarea,#profile-form select')].map(e=>({name:e.name,value:e.value,checked:['checkbox','radio'].includes(e.type)?e.checked:null}));
try{for(const language of ['uk','de','en'])for(const atelier of [false,true])for(const width of [320,390]){
 const run={language,atelier,width,checks:[]};result.runs.push(run);const check=(name,pass)=>run.checks.push({name,pass:!!pass});
 const context=await browser.newContext({viewport:{width,height:700},serviceWorkers:'block',reducedMotion:'reduce'});context.setDefaultTimeout(15000);
 await context.addInitScript(()=>localStorage.setItem('synera.first-user-tour.v1','done'));
 await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());await context.route('**/config.json',r=>r.fulfill({json:{}}));
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));const writes=[];page.on('request',q=>{if(q.method()!=='GET')writes.push(q.method());});
 try{
  await page.goto(base+'/?lang=en',{waitUntil:'networkidle'});await page.locator('#prepare-profile').click();await page.locator('#profile-view').waitFor({state:'visible'});
  await page.locator('#profile-form [name=offers]').fill('SYNTHETIC UNSAVED prototype');await page.locator('#profile-form [name=display_name]').fill('Synthetic Review');const before=await page.evaluate(fields);
  await page.locator('.header-preferences > summary').click();await page.locator('#lang-switcher [data-lang='+language+']').click();await page.waitForFunction(l=>document.documentElement.lang===l,language);
  if(atelier)await page.locator('.atelier-mode-choice button').nth(1).click();
  await page.locator('.header-preferences > summary').click();await page.evaluate(()=>{window.scrollTo(0,0);return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  if(variant==='mutant')await page.addStyleTag({content:'@media(max-width:360px){html[data-synera-style="synera"] .signed-in header .badge{grid-column:2;grid-row:1;max-width:190px}html[data-synera-style="synera"] .signed-in header .header-preferences{grid-row:2}}'});
  run.geometry=await page.evaluate(()=>{const nodes=[...document.querySelectorAll('header > .brand,header > .badge,header > #back-login,header > #logout,header > .header-preferences')].filter(e=>e.checkVisibility());const boxes=nodes.map(e=>{const r=e.getBoundingClientRect();return{id:e.id||e.className,left:r.left,right:r.right,top:r.top,bottom:r.bottom};});const overlap=[];for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){const x=boxes[a],y=boxes[b];if(x.left<y.right-0.5&&x.right>y.left+0.5&&x.top<y.bottom-0.5&&x.bottom>y.top+0.5)overlap.push([x.id,y.id]);}const button=document.querySelector('#back-login'),r=button.getBoundingClientRect();return{boxes,overlap,documentWidth:document.documentElement.scrollWidth,buttonHit:button.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))};});
  check('header controls and status do not overlap',run.geometry.overlap.length===0);check('document fits viewport',run.geometry.documentWidth<=width);check('back-to-login button is unobstructed',run.geometry.buttonHit);
  run.screenshot=`${language}-${atelier?'atelier':'current'}-${width}.png`;await page.screenshot({path:path.join(out,run.screenshot)});
  await page.locator('#import-profile').click();await page.locator('#import-dialog').waitFor({state:'visible'});await page.locator('#import-cancel').click();check('Import remains reachable',true);
  await page.locator('#export-profile').click();await page.locator('#share-dialog').waitFor({state:'visible'});check('Card includes unsaved draft',(await page.locator('#profile-share-output').inputValue()).includes('SYNTHETIC UNSAVED prototype'));await page.locator('#share-cancel').click();assert.deepEqual(await page.evaluate(fields),before);check('fields and permissions preserved',true);check('no account writes',writes.length===0);
 }catch(e){run.error=e.message;result.errors.push(e.message);}finally{await context.close();run.pass=!run.error&&run.checks.every(c=>c.pass);}
}}finally{await browser.close();await new Promise(r=>server.close(r));}
result.status=result.errors.length||result.runs.some(r=>!r.pass)?'FAIL':'PASS';await fs.writeFile(path.join(out,'RESULT.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({variant,status:result.status,cases:result.runs.length,failed:result.runs.filter(r=>!r.pass).map(r=>({language:r.language,atelier:r.atelier,width:r.width,checks:r.checks.filter(c=>!c.pass),error:r.error})),errors:result.errors}));process.exitCode=result.status==='PASS'?0:1;
