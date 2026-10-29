import { test, expect, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { scenes } from '../docs/graphics2-20261029/integrate-scenes.mjs';
const out=resolve('docs/graphics2-20261029');
const available=[];for(const row of scenes){try{await access(`web_launch/${row.page}`);available.push(row);}catch{}}
let server,base;const evidence=[];
test.beforeAll(async()=>{
  await mkdir(`${out}/shots`,{recursive:true});
  server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
  base=await new Promise((accept,reject)=>{let log='';const timeout=setTimeout(()=>reject(new Error(log)),30000);server.stdout.on('data',chunk=>{log+=chunk;const m=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timeout);accept(m[0]);}});server.stderr.on('data',chunk=>{log+=chunk;});server.on('exit',code=>{clearTimeout(timeout);reject(new Error(`server ${code}: ${log}`));});});
});
test.afterAll(async()=>{
  const pid=server?.pid;if(server&&server.exitCode===null){const stopped=new Promise(resolve=>server.once('exit',resolve));server.kill();await stopped;}
  await writeFile(`${out}/runtime-evidence.json`,JSON.stringify({serverPid:pid,serverStopped:server?.exitCode!==null||server?.signalCode!==null,pages:evidence,pending:scenes.filter(row=>!available.includes(row)).map(row=>row.page)},null,2)+'\n');
});
for(const [deviceName,device] of [['iphone13',devices['iPhone 13']],['pixel7',devices['Pixel 7']]])for(const row of available){
  test(`${deviceName} / ${row.page}: scene, first action, reduced motion, no shift`,async({browser})=>{
    const context=await browser.newContext({...device,viewport:deviceName==='iphone13'?{width:390,height:844}:{width:412,height:915},serviceWorkers:'block',reducedMotion:'reduce'});
    const page=await context.newPage();const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
    await page.addInitScript(()=>localStorage.setItem('synera.first-user-tour.v1','done'));
    let release;const gate=new Promise(resolve=>{release=resolve;});
    await page.route('**/scene-*.webp',async route=>{await gate;await route.continue();});
    try{
      await page.goto(`${base}/${row.page}`,{waitUntil:'domcontentloaded'});
      const scene=page.locator('figure.scene');await expect(scene).toHaveCount(1);
      await expect(scene).toBeVisible();
      await expect(scene).toHaveClass(`scene scene-${row.name}`);
      await expect(page.locator('link[href="/scenes.css"]')).toHaveCount(1);
      const living=row.page==='simulation.html'&&await page.locator('body').evaluate(el=>el.classList.contains('living'));
      const previous=living?'#living-status':row.heading;
      expect(await scene.evaluate((el,selector)=>el.previousElementSibling.matches(selector),previous)).toBe(true);
      const image=scene.locator('img');await expect(image).toHaveAttribute('alt','');await expect(image).toHaveAttribute('width','768');await expect(image).toHaveAttribute('height','512');
      const action=page.locator(living?'.living-tabs button':row.action).first();await expect(action).toBeVisible();await expect(action).toBeInViewport({ratio:1});
      expect(await page.evaluate(()=>scrollY)).toBe(0);
      const before=await scene.boundingBox();expect(before.height).toBeGreaterThan(60);
      release();await scene.scrollIntoViewIfNeeded();await image.evaluate(el=>el.decode());
      expect(await scene.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}))).toEqual({width:before.width,height:before.height});
      expect(await image.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await scene.screenshot({path:`${out}/shots/${deviceName}-${row.page}-scene.png`,scale:'css'});
      await page.evaluate(()=>scrollTo(0,0));await expect(action).toBeInViewport({ratio:1});
      await page.screenshot({path:`${out}/shots/${deviceName}-${row.page}-first.png`,scale:'css'});
      await page.screenshot({path:`${out}/shots/${deviceName}-${row.page}-full.png`,fullPage:true,scale:'css'});
      expect(pageErrors).toEqual([]);
      evidence.push({device:deviceName,page:row.page,scene:row.name,box:before,action:await action.boundingBox(),currentSrc:await image.evaluate(el=>el.currentSrc),pageErrors});
    }finally{release();await context.close();}
  });
}
test('all scene variants are public WebP and 1x stays under 140 KB',async({page})=>{
  for(const name of [...new Set(scenes.map(row=>row.name))])for(const suffix of ['', '@2x']){
    const response=await page.request.get(`${base}/scene-${name}${suffix}.webp`);expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('image/webp');if(!suffix)expect((await response.body()).length).toBeLessThanOrEqual(140000);
  }
});
