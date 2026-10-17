import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const proof='artifacts/mobile-20261007/install';
// The installed Playwright cache is on the currently unresponsive D: drive.
// Use a fresh profile with the existing C: Chrome; never a user's browser profile.
process.env.TEMP='C:/Users/Andrii/.codex/tmp/synera-mobile-install';
process.env.TMP=process.env.TEMP;
await fs.mkdir(process.env.TEMP,{recursive:true});
const server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
let browser;
const report={scope:'Desktop Chromium touch viewports, not native iOS or Android installation',checks:[],external:[]};
try{
 const base=await new Promise((resolve,reject)=>{let s='';const timer=setTimeout(()=>reject(Error('server timeout')),15000);server.stdout.on('data',b=>{s+=b;const u=s.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];if(u){clearTimeout(timer);resolve(u);}});});
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',timeout:30000});
 for(const [name,width,height] of [['compact',320,568],['iphone-sized',390,844],['android-sized',412,915]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();
  await page.route('**/*',r=>{if(new URL(r.request().url()).origin!==base){report.external.push(r.request().url());return r.abort();}return r.continue();});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  const button=page.locator('#install-app');await button.click();
  assert.match(await page.locator('#install-status').innerText(),/iPhone.*Safari/);
  assert.ok(await button.isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await button.scrollIntoViewIfNeeded();await page.screenshot({path:proof+'/'+name+'.png'});
  report.checks.push({name,width,height,manual_install_reachable:true});await context.close();
 }
 assert.deepEqual(report.external,[]);report.status='PASS_LOCAL_INSTALL_GUIDE';
}catch(e){report.status='FAIL';report.error=e.message;process.exitCode=1;}
finally{if(browser)await browser.close();server.kill();await fs.writeFile(proof+'/BROWSER.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report));
