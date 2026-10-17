// Local Chromium only. This proves the additive visual preference, not Android hardware or live services.
import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PUBLIC_ASSETS} from '../web_launch/assets.mjs';
const out='artifacts/design-20261003/variant';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const records=[],errors=[];
const viewport={width:390,height:844};
const offlineOnly=process.argv.includes('--offline-only');
const withoutOverlay=process.argv.includes('--without-overlay');
let server;

async function openControls(page){
  const preferences=page.locator('.header-preferences');
  if(await preferences.count()) {if(!await preferences.evaluate(e=>e.open))await preferences.locator('summary').click();}
  else {const detail=page.locator('details.atelier-controls');if(!await detail.evaluate(e=>e.open))await detail.locator('summary').click();}
}
async function closeControls(page){
  const detail=page.locator('.header-preferences,details.atelier-controls').first();
  if(await detail.evaluate(e=>e.open))await detail.locator('summary').click();
}
async function state(page){return page.evaluate(()=>({
  fields:[...document.querySelectorAll('input,textarea,select')].filter(e=>!e.closest('[data-atelier-controls]')).map(e=>({id:e.id,value:e.value,checked:e.checked,disabled:e.disabled})),
  panes:[...document.querySelectorAll('.studio-pane')].map(e=>({id:e.id,hidden:e.hidden})),
  oldTheme:document.documentElement.dataset.syneraStyle||null,
}));}
async function style(page){return page.evaluate(()=>{
  const root=document.body,card=[...document.querySelectorAll('.panel,.studio-card,.demo-panel')].find(e=>e.getBoundingClientRect().height>0),input=[...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea,select')].find(e=>!e.closest('[data-atelier-controls],.header-preferences')&&e.getBoundingClientRect().height>0);
  const get=(e,key)=>e?getComputedStyle(e)[key]:null;
  return {body:get(root,'backgroundColor'),family:get(root,'fontFamily'),card:get(card,'backgroundColor'),padding:get(card,'paddingLeft'),text:get(input,'fontSize'),border:get(input,'borderColor')};
});}
async function snapshot(page,name){await closeControls(page);await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo({top:0,behavior:'instant'});});await page.screenshot({path:out+'/'+name+'.png',fullPage:true});}
async function audit(page,name){await closeControls(page);const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  await fs.writeFile(out+'/'+name+'-axe.json',JSON.stringify({violations:a.violations},null,2));
  assert.deepEqual(a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],name+' accessibility');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' horizontal overflow');
}

async function offlineAcceptance(){
  const canonical=http.createServer(async(req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname,name=['/studio','/studio/'].includes(pathname)?'studio.html':pathname.slice(1);
    if(!Object.hasOwn(PUBLIC_ASSETS,name)){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':PUBLIC_ASSETS[name],'Cache-Control':'no-store'});res.end(await fs.readFile('web_launch/'+name));
  });
  await new Promise(resolve=>canonical.listen(0,'127.0.0.1',resolve));
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,serviceWorkers:'allow',reducedMotion:'reduce'});
  const page=await context.newPage();
  try{
    await page.goto('http://127.0.0.1:'+canonical.address().port+'/studio');
    await page.locator('[data-atelier-controls]').waitFor();
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/studio-sw.mjs'));
    await openControls(page);await page.getByRole('button',{name:'Atelier 2026',exact:true}).click();
    await page.getByRole('button',{name:'Сливовий',exact:true}).click();
    await closeControls(page);const online=await style(page);
    await context.setOffline(true);await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-synera-atelier','on');
    await expect(page.locator('html')).toHaveAttribute('data-atelier-accent','plum');
    assert.deepEqual(await style(page),online,'Offline reload preserves rendered Atelier styles');
    await page.locator('[data-step=memory]').click();await expect(page.locator('#memory-title')).toBeVisible();
    await snapshot(page,'studio-offline-plum');
    const paths=await page.evaluate(async()=>{const all=[];for(const key of await caches.keys())for(const request of await(await caches.open(key)).keys())all.push(new URL(request.url).pathname);return all;});
    for(const asset of ['/atelier.css','/atelier.mjs','/tokens.css'])assert.ok(paths.includes(asset),'Offline dependency '+asset);
    assert.equal(paths.some(p=>p.startsWith('/api/')||p==='/config.json'),false);
    records.push({route:'/studio',check:'explicit Atelier preference survives actual offline clean-URL reload',pass:true,cache_paths:paths});
  } finally {await context.setOffline(false);await context.close();await new Promise(resolve=>canonical.close(resolve));}
}

async function captureScenes(base){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(base+'/studio.html');await openControls(page);await page.getByRole('button',{name:'Atelier 2026',exact:true}).click();await closeControls(page);
    await snapshot(page,'fit-atelier-gold');await audit(page,'fit-atelier-gold');
    await page.locator('#fit-consent').check();await page.locator('#fit-public').check();await page.locator('#fit-form button').click();
    await expect(page.locator('#fit-results')).toContainText('Mara');await snapshot(page,'fit-result-atelier-gold');await audit(page,'fit-result-atelier-gold');
    await page.goto(base+'/triangle.html');
    await page.locator('#room-goal').fill('Узгодити перший перевірний крок');await page.locator('#local-understood').check();await page.locator('#room-setup button').click();
    await expect(page.locator('#room-workspace')).toBeVisible();await snapshot(page,'triangle-workspace-atelier-gold');await audit(page,'triangle-workspace-atelier-gold');
    await page.getByRole('button',{name:/Жива карта/}).click();await expect(page.locator('#pane-atlas')).toBeVisible();
    await snapshot(page,'atlas-atelier-gold');await audit(page,'atlas-atelier-gold');
    records.push({check:'real local fit, fit result, Triangle workspace and Atlas states; axe and overflow',pass:true});
  }finally{await context.close();}
}

try{
  if(!offlineOnly){
    server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
    const base=await new Promise((resolve,reject)=>{let s='';const timer=setTimeout(()=>reject(Error('Local demo server timeout')),10000);server.stdout.on('data',c=>{s+=c;const m=s.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});});
    for(const [route,name] of [['/','main'],['/studio.html','studio'],['/triangle.html','triangle'],['/summit.html','summit']]){
      const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
      await context.addInitScript(()=>localStorage.setItem('synera.first-user-tour.v1','done'));
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      try{
        if(withoutOverlay)await page.route('**/atelier.css',async route=>route.fulfill({contentType:'text/css',body:(await fs.readFile('web_launch/atelier.css','utf8')).split('/* An independent layer:')[0]}));
        await page.goto(base+route,{waitUntil:'networkidle'});await page.locator('[data-atelier-controls]').waitFor({state:'attached'});
        await snapshot(page,name+'-current');
        if(name==='studio'){await page.locator('#fit-give').selectOption('sales');await page.locator('#fit-language').selectOption('uk');await page.locator('#fit-consent').check();}
        if(name==='triangle'){await page.locator('#room-goal').fill('Незбережена мета — зберегти точні слова');await page.locator('#name-b').fill('Тестовий учасник');}
        const before=await state(page),baseStyle=await style(page);
        await openControls(page);await page.getByRole('button',{name:'Atelier 2026',exact:true}).click();
        await expect(page.locator('html')).toHaveAttribute('data-synera-atelier','on');
        assert.deepEqual(await state(page),before,'Atelier must preserve every existing field, choice and pane');
        const gold=await style(page);assert.notDeepEqual(gold,baseStyle,'Atelier has a visible effect');
        await snapshot(page,name+'-atelier-gold');await audit(page,name+'-gold');
        await openControls(page);await page.getByRole('button',{name:'Червоний',exact:true}).click();
        const red=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--atelier-accent'));
        await page.getByRole('button',{name:'Сливовий',exact:true}).click();
        const plum=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--atelier-accent'));
        assert.notEqual(red,plum,'Accent switches rendered colour');
        const cardBefore=(await style(page)).padding;
        await page.getByLabel('Простір між елементами',{exact:true}).selectOption('compact');
        if(cardBefore)assert.notEqual((await style(page)).padding,cardBefore,'Density changes actual card space');
        const regular=(await style(page)).text;await page.getByLabel('Більший текст',{exact:true}).check();
        if(regular)assert.ok(parseFloat((await style(page)).text)>parseFloat(regular),'Larger text affects real input');
        const border=(await style(page)).border;await page.getByLabel('Чіткіші межі',{exact:true}).check();
        if(border)assert.notEqual((await style(page)).border,border,'Stronger contrast changes the actual boundary');
        await snapshot(page,name+'-atelier-plum-large');await audit(page,name+'-plum');
        assert.deepEqual(await state(page),before,'All visual controls preserve drafts, existing choices and active step');
        await openControls(page);await page.getByRole('button',{name:'Чинний',exact:true}).click();await closeControls(page);
        assert.deepEqual(await state(page),before,'Turning Atelier off preserves drafts and consent');
        assert.deepEqual(await style(page),baseStyle,'Returning to current restores real original styles');
        await openControls(page);await page.getByRole('button',{name:'Atelier 2026',exact:true}).click();await closeControls(page);
        await page.reload({waitUntil:'networkidle'});await expect(page.locator('html')).toHaveAttribute('data-atelier-accent','plum');
        await expect(page.locator('html')).toHaveAttribute('data-atelier-type','large');
        await openControls(page);await page.getByRole('button',{name:'Чинний',exact:true}).click();await closeControls(page);
        assert.deepEqual(await style(page),baseStyle,'Returning to current restores real original styles');
        await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('html').getAttribute('data-synera-atelier'),null);
        records.push({route,check:'current → Atelier → current, unchanged fields/consent/panes, visible knobs, persisted preference, 390px and axe',pass:true});
      }finally{await context.close();}
    }
    if(withoutOverlay)throw Error('Mutation survived: removed overlay must fail the visible-effect guard');
    await captureScenes(base);
  }
  await offlineAcceptance();assert.deepEqual(errors,[]);
  const source={};for(const file of ['atelier.css','atelier.mjs','index.html','studio.html','triangle.html','summit.html','assets.mjs','studio-sw.mjs'])source[file]=createHash('sha256').update(await fs.readFile('web_launch/'+file)).digest('hex');
  await fs.writeFile(out+'/ACCEPTANCE.json',JSON.stringify({status:'PASS',viewport,records,source,provider_calls:0,scope:'Local real Chromium; public/demo states only, not physical Android or deployed/live account proof'},null,2));
  console.log(JSON.stringify({pass:true,checks:records.length,viewport,provider_calls:0}));
}catch(error){
  if(withoutOverlay&&error.message==='Atelier has a visible effect'){
    await fs.writeFile(out+'/MUTATION_REJECTED.json',JSON.stringify({status:'PASS',mutation:'Served atelier.css without opt-in overlay rules; source files unchanged',guard:'Actual rendered style must change',observed_rejection:error.message,provider_calls:0},null,2));
    console.log(JSON.stringify({mutation_rejected:true,guard:error.message}));
  }else{await fs.writeFile(out+(offlineOnly?'/OFFLINE_RED.json':'/FAILURE.json'),JSON.stringify({status:'FAIL',error:error.message,stack:error.stack,records,errors},null,2));throw error;}
}
finally{await browser.close();server?.kill();}
