// Local browser oracle, not a physical-phone or Lighthouse certification.
import { chromium, devices } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const out='docs/getsite-20261030';fs.mkdirSync(out+'/shots',{recursive:true});
const server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
let browser;
try {
  const base=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error(text||'Server timeout')),30000);server.stdout.on('data',b=>{text+=b;const u=text.match(/http:\/\/127\.0\.0\.1:\d+/);if(u){clearTimeout(timer);resolve(u[0]);}});server.on('error',reject);});
  browser=await chromium.launch({headless:true,...(process.env.SYNERA_CHROMIUM_EXECUTABLE?{executablePath:process.env.SYNERA_CHROMIUM_EXECUTABLE}:{channel:'chrome'})});
  const result={status:'RUNNING',engine:browser.version(),physicalDevice:false,cache:'Service Worker public shell',cpuThrottle:4,checks:[]};
  for(const name of ['Pixel 7','iPhone 13']) {
    const context=await browser.newContext({...devices[name],defaultBrowserType:'chromium'});
    const page=await context.newPage();
    for(const lang of ['uk','de','en']) {
      await page.goto(`${base}/get.html?next=profile&lang=${lang}`);await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({path:`${out}/shots/${name.replace(' ','-')}-${lang}-first.png`});
      await page.screenshot({path:`${out}/shots/${name.replace(' ','-')}-${lang}-full.png`,fullPage:true});
      const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      assert.equal(audit.violations.length,0,`${name} ${lang} axe violations`);
      const rect=await page.locator('#install-primary').boundingBox();assert(rect.y+rect.height<=devices[name].viewport.height,'Primary action must be on the first screen');
      await page.locator('.header-preferences > summary').click();
      const tooSmall=await page.locator('a,button,select,summary').evaluateAll(nodes=>nodes.filter(n=>n.checkVisibility()).filter(n=>{const r=n.getBoundingClientRect();return r.width<44||r.height<44;}).map(n=>n.id||n.textContent));assert.deepEqual(tooSmall,[]);
      await page.locator('.header-preferences > summary').click();await page.locator('#install-primary').click();
      await page.screenshot({path:`${out}/shots/${name.replace(' ','-')}-${lang}-guide.png`});
      await page.locator('#install-guide-close').click();
      const manifest=await page.locator('#install-manifest').getAttribute('href');
      const body=await (await context.request.get(base+manifest)).json();
      assert.equal(body.id,'/');assert.equal(body.start_url,`/?draft=1&lang=${lang}`);
      await page.goto(base+body.start_url);await page.waitForLoadState('networkidle');
      assert(await page.locator('#profile-form').isVisible());assert.equal(await page.locator('html').getAttribute('lang'),lang);
      result.checks.push({name,lang,axeViolations:0,tapTargets:'>=44 CSS px (header open)',manifestStart:body.start_url,draftVisible:true});
    }
    if(name==='Pixel 7') {
      await page.goto(base+'/get.html');await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
      await page.waitForFunction(async()=>Boolean(await caches.match('/getsite.mjs')));
      const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
      await page.addInitScript(()=>{window.getMetrics={cls:0,lcp:0,shifts:[]};new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput){window.getMetrics.cls+=e.value;window.getMetrics.shifts.push({value:e.value,sources:e.sources.map(s=>({node:s.node?.id||s.node?.className,before:s.previousRect.toJSON(),after:s.currentRect.toJSON()}))});}}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())window.getMetrics.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});});
      await context.setOffline(true);const samples=[];
      for(let i=0;i<3;i++) {
        await page.goto(base+'/get.html',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
        await page.waitForFunction(()=>window.getMetrics.lcp>0&&document.querySelector('#phone-qr svg'));
        const metrics=await page.evaluate(()=>({...window.getMetrics,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,sw:performance.getEntriesByType('navigation')[0].workerStart>0}));
        console.log('CACHE_SAMPLE',JSON.stringify(metrics));
        assert(metrics.lcp<1500,`Cached Pixel 7 / CPU 4x LCP ${metrics.lcp} ms`);assert.equal(metrics.cls,0);assert(metrics.sw);samples.push(metrics);
      }
      result.performance={samples,limitMs:1500,offline:true};await context.setOffline(false);
    }
    await context.close();
  }
  const context=await browser.newContext();const page=await context.newPage();
  await page.goto(base+'/get.html?lang=de');await page.waitForLoadState('networkidle');
  const desktopQR=await page.locator('#phone-qr').boundingBox();assert(desktopQR.width>=208&&desktopQR.y+desktopQR.height<=720,'Desktop QR must be large and entirely on the first screen');
  await page.screenshot({path:out+'/shots/desktop-de-first.png'});await page.screenshot({path:out+'/shots/desktop-de-full.png',fullPage:true});
  for(const path of ['/privacy.html','/legal.html','/pilot-consent.html']) {
    const selector=path==='/privacy.html'?'.privacy-print-link svg':'.legal-qr svg';
    await page.goto(base+path+'?lang=de');await page.locator(selector).first().waitFor({state:'attached'});await page.emulateMedia({media:'print'});
    assert(await page.locator(selector).first().isVisible());
    await page.screenshot({path:`${out}/shots/${path.slice(1,-5)}-print.png`,fullPage:true});
    await page.pdf({path:`${out}/${path.slice(1,-5)}.pdf`,format:'A4',printBackground:true});
    await page.emulateMedia({media:'screen'});
    result.checks.push({path,printQR:true});
  }
  await context.close();result.status='PASS';fs.writeFileSync(out+'/acceptance.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
} finally { await browser?.close();if(server.exitCode===null)server.kill(); }
