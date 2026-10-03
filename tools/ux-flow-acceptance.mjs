import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const phase=process.argv.includes('--after')?'after':'before';
const out=`artifacts/ux-20261003/${phase}`;
await fs.mkdir(out,{recursive:true});
const server=spawn('node',['web_launch/server.mjs','--demo'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
let browser;
try {
 const origin=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server timeout')),10000);server.stdout.on('data',b=>{const m=String(b).match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});server.on('error',reject);});
 browser=await chromium.launch({headless:true,executablePath:process.env.SYNERA_CHROMIUM_EXECUTABLE||chromium.executablePath()});const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();const errors=[],steps=[];page.on('pageerror',e=>errors.push(e.message));
 const capture=async(name,target)=>{await page.waitForLoadState('networkidle');await page.evaluate(()=>scrollTo(0,0));if(target)await page.locator(target).scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${name}.png`});const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();const metrics=await page.evaluate(()=>({visibleWords:document.body.innerText.trim().split(/\s+/u).length,pageHeight:document.documentElement.scrollHeight,noOverflow:document.documentElement.scrollWidth<=innerWidth}));assert.ok(metrics.noOverflow,name);assert.deepEqual(audit.violations.map(v=>v.id),[],name);steps.push({name,...metrics,axeViolations:0});};
 await page.goto(origin+'/summit.html');await capture('01-landing');
 await page.goto(origin+'/studio-journey.html');
 if(phase==='after')await page.getByRole('button',{name:'Спокійний режим',exact:true}).click();
 await capture('02-brief','#journey-fit');
 await page.locator('#journey-fit-consent').check();await page.locator('#journey-visibility').check();await page.locator('#journey-fit button[type=submit]').click();await capture('03-map','#journey-discovery');
 await page.locator('#journey-markers button').filter({hasText:'Mara'}).click();await capture('04-chat','#journey-conversation');
 const words='Я зроблю код першого екрана. Мені потрібен макет, який ми разом перевіримо.';await page.locator('#journey-message').fill(words);await page.locator('#journey-send').click();assert.equal(await page.locator('[data-author=you] p').last().innerText(),words);
 await page.locator('#journey-open-proposal').click();await capture('05-proposal','#journey-terms');
 const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10)+'T18:00';await page.locator('#journey-when').fill(tomorrow);await page.locator('#journey-scope').fill('Перевірити перший екран MVP.');await page.locator('#journey-proposal-form button[type=submit]').click();assert.equal(await page.locator('#journey-complete').isVisible(),false);
 await page.getByRole('button',{name:'Mara: сценарне «так»',exact:true}).click();assert.equal(await page.locator('#journey-complete').isVisible(),false);await page.getByRole('button',{name:'Я підтверджую цю версію',exact:true}).click();await page.locator('#journey-complete').click();await capture('06-result','#journey-result');
 await page.goto(origin+'/get.html');await capture('07-install');
 await page.goto(origin+'/triangle.html#atlas');await capture('08-atlas');
 await page.goto(origin+'/studio.html#fit');await capture('09-studio');
 if(phase==='after'){
  await page.goto(origin+'/studio-journey.html',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
  const cachePaths=await page.evaluate(async()=>{const names=(await caches.keys()).filter(n=>n.startsWith('synera-studio-'));return (await Promise.all(names.map(async n=>(await(await caches.open(n)).keys()).map(r=>new URL(r.url).pathname)))).flat();});
  assert.ok(!cachePaths.some(p=>p.startsWith('/api/')||p==='/config.json'));
  await context.setOffline(true);await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#journey-fit-consent').isChecked(),false);assert.equal(await page.locator('#journey-visibility').isChecked(),false);
  await page.getByRole('button',{name:'Спокійний режим',exact:true}).click();await page.locator('#journey-fit-consent').check();await page.locator('#journey-visibility').check();await page.locator('#journey-fit button[type=submit]').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.journey-match-photo,.journey-action-icon')].every(i=>i.complete&&i.naturalWidth>0));
  const assets=await page.locator('.journey-match-photo,.journey-action-icon').evaluateAll(images=>images.map(i=>({path:new URL(i.src).pathname,loaded:i.complete&&i.naturalWidth>0,filter:getComputedStyle(i).filter})));
  assert.equal(assets.filter(i=>i.path.includes('portrait-')).length,3);assert.ok(assets.every(i=>i.loaded));
  await fs.writeFile(`${out}/OFFLINE.json`,JSON.stringify({status:'PASS',physicalAndroid:false,cachePaths,privateResponsesCached:false,consentsRestored:false,assets},null,2));await page.screenshot({path:`${out}/offline-map.png`});await context.setOffline(false);
 }
 assert.deepEqual(errors,[]);await fs.writeFile(`${out}/ACCEPTANCE.json`,JSON.stringify({status:'PASS',phase,source:'local current checkout',viewport:{width:390,height:844},physicalAndroid:false,steps,pageErrors:errors},null,2));console.log(`PASS ${phase}: ${steps.length} screens, real clicks, consent and no axe violations`);
}catch(e){await fs.writeFile(`${out}/FAILURE.json`,JSON.stringify({status:'FAIL',message:e.message},null,2));console.error(e);process.exitCode=1;}finally{if(browser)await browser.close();server.kill();}
