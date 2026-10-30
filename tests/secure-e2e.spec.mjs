import {test,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
let child,base;
test.beforeAll(async()=>{
  child=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});
  base=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('server timeout')),30000);child.stdout.on('data',b=>{text+=b;const match=text.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});child.on('error',reject);});
});
test.afterAll(()=>child?.kill());
for(const lang of ['uk','de','en'])test('SECURE: exact visible consent evidence survives reload in '+lang,async({page})=>{
  await page.goto(base+'/simulation.html?lang='+lang);
  await page.locator('[data-view="join"]').click();
  await page.locator('#visitor-card [name="name"]').fill('Demo visitor');
  await page.locator('#visitor-card [name="offers"]').fill('Demo design');
  await page.locator('#visitor-card [name="seeks"]').fill('Demo review');
  const visible=await page.locator('#visitor-card [data-demo-input-notice]').textContent()+'\n'+await page.locator('#local-note').textContent();
  await page.locator('#visitor-start').click();
  await expect(page.locator('#visitor-chat')).toBeVisible();
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('synera.journal.v1')).findLast(e=>e.kind==='consent').data);
  const record=await read();expect(record.document_text).toBe(visible);expect(record.locale).toBe(lang);expect(record.action).toBe('grant');expect(record.recipient).toBe('this-device');expect(record.expires_at).toBeNull();
  const digest=await page.evaluate(async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join(''),visible);
  expect(record.document_sha256).toBe(digest);
  await page.reload();expect(await read()).toEqual(record);
  // The existing explicit erase UI clears documentary evidence as well.
  await page.locator('[data-view="journal"]').click();
  page.once('dialog',d=>d.accept());await page.locator('#journal-erase').click();
  expect(await page.evaluate(()=>localStorage.getItem('synera.journal.v1'))).toBeNull();
});
test('SECURE: erasure cancels a delayed consent digest without resurrecting data',async({page})=>{
  await page.goto(base+'/simulation.html?lang=en');await page.locator('[data-view="join"]').click();
  for(const [name,value]of [['name','Demo visitor'],['offers','Demo design'],['seeks','Demo review']])await page.locator(`#visitor-card [name="${name}"]`).fill(value);
  await page.evaluate(()=>{const digest=crypto.subtle.digest.bind(crypto.subtle);crypto.subtle.digest=(...args)=>new Promise(resolve=>{window.releaseConsentDigest=async()=>resolve(await digest(...args));});});
  await page.locator('#visitor-start').click();
  await expect.poll(()=>page.evaluate(()=>typeof window.releaseConsentDigest)).toBe('function');
  await page.locator('[data-view="journal"]').click();page.once('dialog',d=>d.accept());await page.locator('#journal-erase').click();
  await page.evaluate(()=>window.releaseConsentDigest());
  await expect(page.locator('#visitor-start')).toBeEnabled();
  expect(await page.evaluate(()=>localStorage.getItem('synera.journal.v1'))).toBeNull();
  await expect(page.locator('#visitor-chat')).toBeHidden();
});
test('SECURE: phone emulation screenshots of the consent flow and privacy inventory',async({browser})=>{
  await fs.mkdir('docs/secure-20261030/shots',{recursive:true});
  for(const [name,width,height,userAgent] of [
    ['iphone13',390,844,'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'],
    ['pixel7',412,915,'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36']]){
    const context=await browser.newContext({viewport:{width,height},userAgent,isMobile:true,deviceScaleFactor:1,serviceWorkers:'block'});
    try{
      const page=await context.newPage();await page.goto(base+'/simulation.html?lang=uk');await page.locator('[data-view="join"]').click();
      await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:`docs/secure-20261030/shots/${name}-consent.png`,fullPage:true});
      await page.goto(base+'/privacy.html?lang=uk');await page.evaluate(()=>document.fonts.ready);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:`docs/secure-20261030/shots/${name}-privacy.png`,fullPage:true});
    }finally{await context.close();}
  }
});
