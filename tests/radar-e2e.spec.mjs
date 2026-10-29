import { test, expect, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
let server,base;const evidence=[];
const out='docs/radar-20261030';
test.beforeAll(async()=>{
  await mkdir(`${out}/shots`,{recursive:true});
  server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
  base=await new Promise((accept,reject)=>{let log='';const timeout=setTimeout(()=>reject(Error(log)),30000);server.stdout.on('data',chunk=>{log+=chunk;const m=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timeout);accept(m[0]);}});server.stderr.on('data',chunk=>{log+=chunk;});server.once('exit',code=>{clearTimeout(timeout);reject(Error(`server ${code}: ${log}`));});});
});
test.afterAll(async()=>{
  const pid=server?.pid;if(server&&server.exitCode===null){const done=new Promise(resolve=>server.once('exit',resolve));server.kill();await done;}
  await writeFile(`${out}/runtime-evidence.json`,JSON.stringify({pid,serverStopped:server?.exitCode!==null||server?.signalCode!==null,evidence},null,2)+'\n');
});
for(const [deviceName,device] of [['iphone13',devices['iPhone 13']],['pixel7',devices['Pixel 7']]]){
 test(`${deviceName}: private by default, pin to local conversation and meeting, revoke`,async({browser})=>{
  const context=await browser.newContext({...device,serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base))external.push(r.url());});
  await page.goto(`${base}/radar.html`);await expect(page.locator('#radar-open')).not.toBeChecked();await expect(page.locator('.radar-pin')).toHaveCount(0);
  await page.locator('#radar-open').check();await expect(page.locator('.radar-pin')).toHaveCount(6);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`${out}/shots/${deviceName}-radar.png`,fullPage:true,scale:'css'});
  await page.locator('[data-person="bot-leo"]').click();await expect(page.locator('#radar-detail')).toContainText('Продажі');await expect(page.locator('#radar-detail')).toContainText('Дизайн');
  await page.getByRole('button',{name:'Написати · Demo',exact:true}).click();await page.locator('.radar-chat textarea').fill('Що саме ти пропонуєш?');await page.locator('.radar-chat button[type=submit]').click();await expect(page.locator('.radar-messages p')).toHaveCount(3);
  await page.getByRole('button',{name:'Запропонувати зустріч · чернетка',exact:true}).click();
  const link=page.locator('.radar-meeting a');await expect(link).toHaveAttribute('href',/https:\/\/www.google.com\/maps\/dir\//);expect(new URL(await link.getAttribute('href')).searchParams.get('destination')).toBe('Zürich Hauptbahnhof');expect(external).toEqual([]);
  await page.screenshot({path:`${out}/shots/${deviceName}-conversation.png`,fullPage:true,scale:'css'});
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  // Tick does not replace a focused pin and steal keyboard focus.
  const pin=page.locator('[data-person="bot-leo"]');await pin.focus();await page.waitForTimeout(1100);await expect(pin).toBeFocused();
  await page.locator('#radar-open').uncheck();await expect(page.locator('.radar-pin')).toHaveCount(0);await expect(page.locator('#radar-detail')).toBeHidden();
  expect(await page.evaluate(()=>localStorage.getItem('synera.radar.openness.v1'))).toBeNull();
  expect(errors).toEqual([]);evidence.push({device:deviceName,pins:6,external,errors});await context.close();
 });
}
test('expiry and cross-tab revocation close details and conversations',async({browser})=>{
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
 await page.clock.install({time:new Date('2026-10-29T18:00:00Z')});await page.goto(`${base}/radar.html`);await page.locator('#radar-open').check();
 await page.locator('[data-person="bot-leo"]').click();
 await page.clock.fastForward(3600001);await expect(page.locator('.radar-pin')).toHaveCount(0);await expect(page.locator('#radar-open')).not.toBeChecked();await expect(page.locator('#radar-detail')).toBeHidden();
 await page.locator('#radar-open').check();const other=await context.newPage();await other.goto(`${base}/radar.html`);await expect(other.locator('#radar-open')).toBeChecked();await other.locator('#radar-open').uncheck();await expect(page.locator('#radar-open')).not.toBeChecked();await context.close();
});
test('local event draft survives reload as literal text, exports and erases',async({page})=>{
 await page.goto(`${base}/radar.html`);await page.locator('.radar-draft summary').click();await page.locator('[name=title]').fill('<img src=x onerror=alert(1)>');await page.locator('[name=date]').fill('2026-10-30');await page.locator('#event-form button').click();
 await expect(page.locator('#event-drafts')).toContainText('<img src=x onerror=alert(1)>');await page.reload();await page.locator('.radar-draft summary').click();await expect(page.locator('#event-drafts')).toContainText('<img src=x onerror=alert(1)>');await expect(page.locator('#event-drafts img')).toHaveCount(0);
 const exported=await page.evaluate(async()=>{const {exportDevice}=await import('/privacy-device.mjs');return exportDevice();});expect(exported.localStorage['synera.radar.events.v1']).toContain('onerror');
 await page.evaluate(async()=>{const {eraseDevice}=await import('/privacy-device.mjs');await eraseDevice();});await page.reload();await expect(page.locator('#event-drafts article')).toHaveCount(0);await expect(page.locator('#radar-open')).not.toBeChecked();
});
for(const [lang,title] of [['uk','Радар'],['de','Radar'],['en','Radar']])test(`${lang}: translated controls, Demo data and events`,async({page})=>{
 await page.clock.install({time:new Date('2026-10-29T18:00:00Z')});await page.goto(`${base}/radar.html?lang=${lang}`);await expect(page.locator('h1')).toHaveText(title);await expect(page.locator('html')).toHaveAttribute('lang',lang);
 await page.locator('#radar-open').check();await expect(page.locator('.radar-pin')).toHaveCount(6);await expect(page.locator('#radar-events article')).toHaveCount(1);
 if(lang!=='uk')expect(await page.locator('main').innerText()).not.toMatch(/[А-Яа-яІіЇїЄє]/u);
});
test('storage denied retains a clearly labelled in-tab demo',async({browser})=>{
 const context=await browser.newContext({serviceWorkers:'block'});await context.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}});});const page=await context.newPage();await page.goto(`${base}/radar.html`);await expect(page.locator('#storage-status')).not.toBeEmpty();await page.locator('#radar-open').check();await expect(page.locator('.radar-pin')).toHaveCount(6);await page.locator('#radar-open').uncheck();await expect(page.locator('.radar-pin')).toHaveCount(0);await context.close();
});
test('fresh service-worker shell reopens Radar and samples offline',async({browser})=>{
 const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();await page.goto(`${base}/radar.html`);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 await page.locator('#radar-open').check();await context.setOffline(true);await page.reload();await expect(page.locator('.radar-pin')).toHaveCount(6);await page.locator('[data-person="bot-leo"]').click();await expect(page.locator('#radar-detail')).toBeVisible();
 expect(await page.evaluate(async()=>Boolean(await caches.match('/radar-events.json')))).toBe(true);await context.close();
});
