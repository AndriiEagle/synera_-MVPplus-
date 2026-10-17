import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='artifacts/journey-20261003/browser';await fs.mkdir(out,{recursive:true});
const child=spawn('node',['web_launch/server.mjs','--demo'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
try{
 const url=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server timeout')),10000);child.stdout.on('data',c=>{const m=String(c).match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});child.on('error',reject);});
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
 const audit=async phase=>{const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(a.violations.map(v=>v.id),[],phase);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),phase);checks.push(phase);};
 await page.goto(url+'/studio-journey.html?person=mara');await audit('discover current');await page.locator('#journey-fit-consent').check();await page.locator('#journey-visibility').check();await page.locator('#journey-fit button').click();await audit('map current');
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/map-current-390x844.png',fullPage:true});
 const before=await page.locator('#journey-discovery').innerText();await page.locator('.atelier-controls summary').click();await page.getByRole('button',{name:'Atelier 2026',exact:true}).click();await page.getByRole('button',{name:'Сливовий',exact:true}).click();await page.locator('.atelier-controls summary').click();
 assert.equal(await page.locator('html').getAttribute('data-synera-atelier'),'on');assert.equal(await page.locator('#journey-discovery').innerText(),before);assert.equal(await page.locator('#journey-fit-consent').isChecked(),true);await audit('map Atelier');
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/map-atelier-390x844.png',fullPage:true});
 await page.locator('.atelier-controls summary').click();await page.getByRole('button',{name:'Чинний',exact:true}).click();await page.locator('.atelier-controls summary').click();assert.equal(await page.locator('html').getAttribute('data-synera-atelier'),null);assert.equal(await page.locator('#journey-discovery').innerText(),before);
 await page.locator('#journey-markers button').filter({hasText:'Mara'}).click();await audit('conversation current');await page.locator('#journey-open-proposal').click();await audit('proposal current');
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/studio-sw.mjs'));await context.setOffline(true);await page.goto(url+'/studio-journey.html?person=noor');await page.waitForSelector('#journey-fit');assert.equal(await page.locator('#journey-fit-consent').isChecked(),false);assert.equal(await page.locator('#journey-ai-consent').isEnabled(),false);await audit('public shell offline, no cached consent or AI');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/SURFACE_ACCEPTANCE.json',JSON.stringify({status:'PASS',viewport:{width:390,height:844},checks,pageErrors:errors,physicalAndroid:false},null,2));console.log('PASS '+checks.length+' mobile surfaces / preserved toggle / offline journey');
}catch(error){await fs.writeFile(out+'/SURFACE_FAILURE.json',JSON.stringify({status:'FAIL',message:error.message},null,2));console.error(error.message);process.exitCode=1;}
finally{if(browser)await browser.close();child.kill();}
