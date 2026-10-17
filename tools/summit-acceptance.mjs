import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';

const output = new URL('../artifacts/summit-20261001/', import.meta.url);
await fs.mkdir(output,{recursive:true});
const server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
let browser;
try {
  const base=await new Promise((resolve,reject)=>{let stdout='';const timer=setTimeout(()=>reject(new Error('server timeout')),15000);server.stdout.on('data',b=>{stdout+=b;const m=stdout.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});server.once('exit',code=>{clearTimeout(timer);reject(new Error('server exit '+code));});});
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(!request.url().startsWith(base))external.push(request.url());});
  await page.goto(base+'/summit.html',{waitUntil:'networkidle'});
  const checks=[];
  for(const width of [360,390,412,1440]) {
    await page.setViewportSize({width,height:844});
    for(const language of ['en','de','uk']) {
      await page.selectOption('#summit-language',language);
      assert.equal(await page.locator('html').getAttribute('lang'),language);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}/${language} overflow`);
    }
    checks.push(`no horizontal overflow ${width}px / EN DE UA`);
  }
  await page.setViewportSize({width:390,height:844}); await page.selectOption('#summit-language','en');
  await page.selectOption('#demo-need','finance'); assert.match(await page.locator('#match-result').innerText(),/No two-way fit/);
  assert.equal(await page.getByRole('button',{name:'Explore the first collaboration'}).count(),0);
  await page.selectOption('#demo-need','design'); assert.match(await page.locator('#match-result').innerText(),/Two-way relevance/);
  await page.getByRole('button',{name:'Explore the first collaboration'}).click();
  await page.selectOption('#demo-hours','12'); assert.match(await page.locator('#effort-result').innerText(),/effort differs/);
  await page.selectOption('#demo-hours','2'); assert.match(await page.locator('#effort-result').innerText(),/does not establish equal value/);
  await page.getByRole('button',{name:'See the meeting example'}).click();
  await page.fill('#demo-venue','Berlin Hauptbahnhof, Berlin, Germany');
  const url=new URL(await page.locator('#demo-directions').getAttribute('href'));
  assert.equal(url.searchParams.get('destination'),'Berlin Hauptbahnhof, Berlin, Germany');
  await page.fill('#demo-venue',' '); assert.equal(await page.locator('#demo-directions').getAttribute('href'),null);
  await page.fill('#demo-venue','Zürich Hauptbahnhof, Zürich, Switzerland');
  await page.screenshot({path:new URL('mobile-meeting.png',output).pathname.replace(/^\/(.:)/,'$1'),fullPage:true});
  for(const step of [0,1,2]) {
    await page.locator(`[data-stage="${step}"]`).click();
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],`accessibility stage ${step}`);
  }
  await page.locator('[data-stage="0"]').click();
  await page.locator('[data-stage="0"]').press('ArrowRight');
  assert.equal(await page.locator('[data-stage="1"]').getAttribute('aria-selected'),'true');
  await page.locator('[data-stage="1"]').press('Home');
  await page.screenshot({path:new URL('mobile.png',output).pathname.replace(/^\/(.:)/,'$1'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:new URL('desktop.png',output).pathname.replace(/^\/(.:)/,'$1'),fullPage:true});
  assert.deepEqual(errors,[]); assert.deepEqual(external,[],'no external traffic before a Maps click');
  checks.push('real matcher positive/negative','unequal effort shown','destination/empty-address handling','keyboard tabs','axe WCAG A/AA three stages','zero external requests before click','zero page errors');
  await context.close();
  const offline=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const op=await offline.newPage();
  await op.goto(base+'/summit.html');
  // The existing PWA reloads once on controller acquisition. Observe its settled state.
  await op.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:20000});
  await op.waitForLoadState('networkidle');
  await offline.setOffline(true); await op.reload();
  await op.locator('[data-stage="2"]').click();
  assert.equal(await op.locator('#demo-directions').count(),1);
  await op.locator('[data-stage="0"]').click();
  await op.selectOption('#demo-need','finance');
  assert.match(await op.locator('#match-result').innerText(),/No two-way fit/);
  checks.push('offline reload plus matcher and meeting UI (Maps itself needs internet)');
  await fs.writeFile(new URL('acceptance.json',output),JSON.stringify({at:new Date().toISOString(),verdict:'PASS',checks,physicalAndroid:false,published:false},null,2));
  console.log(JSON.stringify({verdict:'PASS',checks:checks.length,output:output.href}));
} finally {if(browser)await browser.close();server.kill();}
