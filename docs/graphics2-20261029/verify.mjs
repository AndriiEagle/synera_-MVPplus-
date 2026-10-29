import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync, spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { scenes } from './integrate-scenes.mjs';
const out=import.meta.dirname,baseline='2d564d8f2927dc88dffb39fc566e78fc63ec938e';
const source=[];
for(const row of scenes){
  let html;try{html=await readFile(`web_launch/${row.page}`,'utf8');}catch(error){if(error.code==='ENOENT'){source.push({page:row.page,status:'PENDING_OWNING_LANE_MERGE'});continue;}throw error;}
  const old=execFileSync('git',['show',`${baseline}:web_launch/${row.page}`],{encoding:'utf8'});
  const removed=html.replace(/\r?\n<figure class="scene scene-[^"]+">[\s\S]*?<\/figure>/,'').replace(/<link rel="stylesheet" href="\/scenes.css">\r?\n/,'');
  assert.equal(removed.replace(/\r\n/g,'\n'),old.replace(/\r\n/g,'\n'),`Only scene + stylesheet may change ${row.page}`);
  source.push({page:row.page,status:'ORIGINAL_AFTER_REMOVING_TWO_INSERTIONS',lineEndings:'git/checkout CRLF normalized'});
}
for(const file of ['sw.mjs','studio-sw.mjs','simulation-sw.mjs']){
  const current=await readFile(`web_launch/${file}`,'utf8'),old=execFileSync('git',['show',`${baseline}:web_launch/${file}`],{encoding:'utf8'});
  assert.equal(current.match(/const CACHE\s*=\s*([^;]+)/)[1],old.match(/const CACHE\s*=\s*([^;]+)/)[1]);
  assert.equal(current.replace(/^(?:SHELL|ASSETS)\.push\('\/scenes\.css'[^\n]*\r?\n/m,'').replace(/\r\n/g,'\n'),old.replace(/\r\n/g,'\n'),`Only one asset-list line may change ${file}`);
}
const server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
let browser;
const runtime={source,baseline,serverPid:server.pid,offline:[],mutation:{}};
try{
  const base=await new Promise((resolve,reject)=>{let log='';const timeout=setTimeout(()=>reject(new Error(log)),30000);server.stdout.on('data',part=>{log+=part;const match=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timeout);resolve(match[0]);}});server.stderr.on('data',part=>{log+=part;});server.on('exit',code=>{clearTimeout(timeout);reject(new Error(`server exited ${code}`));});});
  browser=await chromium.launch({headless:true,executablePath:process.env.SYNERA_CHROMIUM_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  for(const [worker,scope,pagePath,name] of [['sw.mjs','/','summit.html','summit'],['studio-sw.mjs','/studio','studio.html','studio'],['simulation-sw.mjs','/simulation','simulation.html','simulation']]){
    const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});const page=await context.newPage();
    await page.goto(`${base}/${pagePath}`);
    await page.evaluate(async({worker,scope})=>{
      const registration=await navigator.serviceWorker.register(`/${worker}`,{scope,type:'module'});
      if(registration.active)return;
      await new Promise((resolve,reject)=>{const worker=registration.installing||registration.waiting;if(!worker)return reject(new Error('No worker'));worker.addEventListener('statechange',()=>{if(worker.state==='activated')resolve();if(worker.state==='redundant')reject(new Error('Worker redundant'));});});
    },{worker,scope});
    const cached=await page.evaluate(async files=>{const keys=await caches.keys();const result={};for(const file of files)result[file]=(await Promise.all(keys.map(async key=>Boolean(await(await caches.open(key)).match(file))))).some(Boolean);return result;},['/scenes.css',`/scene-${name}.webp`,`/scene-${name}@2x.webp`]);
    assert.ok(Object.values(cached).every(Boolean),`${worker} caches scenes`);
    await page.reload();await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
    const scene=page.locator('figure.scene img');await scene.scrollIntoViewIfNeeded();await scene.evaluate(el=>el.decode());
    assert.equal(await scene.evaluate(el=>el.complete&&el.naturalWidth>0),true);
    runtime.offline.push({worker,scope,page:pagePath,cached,decodedOffline:true});await context.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const page=await context.newPage();
  await page.goto(`${base}/legal.html`);const original=await page.locator('main .primary').boundingBox();
  assert.ok(original.y>=0&&original.y+original.height<=844,'Original legal CTA visible');
  await page.route('**/scenes.css',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nfigure.scene{height:1000px;aspect-ratio:auto}\n'});});
  await page.reload();const mutant=await page.locator('main .primary').boundingBox();
  assert.ok(mutant.y+mutant.height>844,'Mutation must be rejected by the first-screen oracle');
  runtime.mutation={kind:'route-only oversized scene',originalAction:original,mutantAction:mutant,viewportHeight:844,guardDetectsFailure:true,sourceFilesMutated:false};
  await context.close();
}finally{
  await browser?.close();if(server.exitCode===null){const stopped=new Promise(resolve=>server.once('exit',resolve));server.kill();await stopped;}runtime.serverStopped=true;
  await writeFile(`${out}/verification.json`,JSON.stringify(runtime,null,2)+'\n');
}
console.log('PASS: exact markup preservation, unchanged CACHE names, three offline workers, adverse CTA mutation detected.');
