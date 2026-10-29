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
// Measure siblings/leaf controls, not their containing details/panel (which overlap by design).
const geometry=()=>{
 const header=document.querySelector('.site-header');
 const nodes=[...header.querySelectorAll('.site-brand,.header-preferences > summary,.header-preferences-content :is(button,select,input,.badge,.atelier-settings-title,.atelier-settings-note,.atelier-settings-status,legend)')].filter(e=>e.checkVisibility());
 const boxes=nodes.map(e=>{const r=e.getBoundingClientRect();return{id:e.id||e.className||e.tagName,left:r.left,right:r.right,top:r.top,bottom:r.bottom};});
 const overlap=[];for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){const x=boxes[a],y=boxes[b];if(x.left<y.right-0.5&&x.right>y.left+0.5&&x.top<y.bottom-0.5&&x.bottom>y.top+0.5)overlap.push([x.id,y.id]);}
 const bounds=[header,...header.querySelectorAll('.header-preferences-content,.header-preferences-content *')].filter(e=>e.checkVisibility()).map(e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right};});
 const button=document.querySelector('#back-login'),r=button.getBoundingClientRect();
 return{boxes,overlap,bounds,documentWidth:document.documentElement.scrollWidth,buttonHit:button.checkVisibility()&&button.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))};
};
try{for(const language of ['uk','de','en'])for(const atelier of [false,true])for(const width of [320,390]){
 const run={language,atelier,width,checks:[]};result.runs.push(run);const check=(name,pass)=>run.checks.push({name,pass:!!pass});
 const context=await browser.newContext({viewport:{width,height:700},serviceWorkers:'block',reducedMotion:'reduce'});context.setDefaultTimeout(15000);
 await context.addInitScript(()=>localStorage.setItem('synera.first-user-tour.v1','done'));
 await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());await context.route('**/config.json',r=>r.fulfill({json:{}}));
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));const writes=[];page.on('request',q=>{if(q.method()!=='GET')writes.push(q.method());});
 try{
  await page.goto(base+'/?lang=en',{waitUntil:'networkidle'});await page.locator('#prepare-profile').click();await page.locator('#profile-view').waitFor({state:'visible'});
  await page.locator('#profile-form [name=offers]').fill('SYNTHETIC UNSAVED prototype');await page.locator('#profile-form [name=display_name]').fill('Synthetic Review');const before=await page.evaluate(fields);
  await page.locator('.header-preferences > summary').click();await page.locator('#site-language').selectOption(language);await page.waitForFunction(l=>document.documentElement.lang===l,language);
  // Atelier is now the default: explicitly exercise Current too, plus the existing Atelier settings.
  const style=atelier?'atelier':'synera';await page.locator('#style-preset').selectOption(style);
  await page.locator('.adaptive-legacy > summary').click();
  await page.locator('.atelier-mode-choice button').nth(atelier?1:0).click();
  await page.waitForFunction(({language,style,atelier})=>document.documentElement.lang===language&&document.documentElement.dataset.syneraStyle===style&&(document.documentElement.dataset.syneraAtelier==='on')===atelier,{language,style,atelier});
  check('selected language and appearance applied',true);await page.evaluate(()=>document.fonts.ready);
  await page.locator('.header-preferences > summary').click();await page.evaluate(()=>{window.scrollTo(0,0);return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  if(variant==='mutant')await page.addStyleTag({content:'@media(max-width:360px){html[data-synera-style="synera"] .site-header > .site-brand{transform:translateX(140px);pointer-events:none}}'});
  run.closedGeometry=await page.evaluate(geometry);
  run.screenshot=`${language}-${atelier?'atelier':'current'}-${width}.png`;await page.screenshot({path:path.join(out,run.screenshot)});
  // The shared shell deliberately keeps status and session controls inside this scrollable panel.
  await page.locator('.header-preferences > summary').click();
  for(const selector of ['#site-language','#style-preset','.atelier-mode-choice button:nth-child(1)','.atelier-mode-choice button:nth-child(2)','#back-login'])await page.locator(selector).click({trial:true});
  check('language and appearance controls remain reachable',true);
  run.geometry=await page.evaluate(geometry);
  check('header controls and status do not overlap',run.closedGeometry.boxes.length===2&&run.closedGeometry.overlap.length===0&&run.geometry.boxes.some(b=>b.id==='back-login')&&run.geometry.overlap.length===0);
  check('document fits viewport',[run.closedGeometry,run.geometry].every(g=>g.documentWidth<=width&&g.boxes.every(b=>b.left>=0&&b.right<=width)&&g.bounds.every(b=>b.left>=0&&b.right<=width)));
  check('back-to-login button is unobstructed',run.geometry.buttonHit);
  run.preferencesScreenshot=`${language}-${atelier?'atelier':'current'}-${width}-preferences.png`;await page.screenshot({path:path.join(out,run.preferencesScreenshot)});
  await page.locator('.header-preferences > summary').click();
  await page.locator('#import-profile').click();await page.locator('#import-dialog').waitFor({state:'visible'});await page.locator('#import-cancel').click();check('Import remains reachable',true);
  await page.locator('#export-profile').click();await page.locator('#share-dialog').waitFor({state:'visible'});check('Card includes unsaved draft',(await page.locator('#profile-share-output').inputValue()).includes('SYNTHETIC UNSAVED prototype'));await page.locator('#share-cancel').click();assert.deepEqual(await page.evaluate(fields),before);check('fields and permissions preserved',true);check('no account writes',writes.length===0);
 }catch(e){run.error=e.message;result.errors.push(e.message);}finally{await context.close();run.pass=!run.error&&run.checks.every(c=>c.pass);}
}}finally{await browser.close();await new Promise(r=>server.close(r));}
result.status=result.errors.length||result.runs.some(r=>!r.pass)?'FAIL':'PASS';await fs.writeFile(path.join(out,'RESULT.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({variant,status:result.status,cases:result.runs.length,failed:result.runs.filter(r=>!r.pass).map(r=>({language:r.language,atelier:r.atelier,width:r.width,checks:r.checks.filter(c=>!c.pass),error:r.error})),errors:result.errors}));process.exitCode=result.status==='PASS'?0:1;
