import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { unpackArchive } from '../web_launch/archive-codec.mjs';
import { importSessionArchive } from '../web_launch/session-value.mjs';
const out='artifacts/journey-20261003/browser';await fs.mkdir(out,{recursive:true});
const red=process.argv.includes('--red-map');
const child=spawn('node',['web_launch/server.mjs','--demo'],{cwd:process.cwd(),windowsHide:true,stdio:['ignore','pipe','pipe']});
const url=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server did not start')),10000);child.stdout.on('data',chunk=>{const m=String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});child.on('error',reject);});
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(url+'/triangle.html#atlas');await page.getByRole('button',{name:'Mara · вигаданий приклад',exact:true}).click();
 assert.equal(await page.getByRole('link',{name:'Почати розмову з Mara ↗',exact:true}).count(),1,'Mara opens continuous journey');
 if(red)throw Error('Baseline unexpectedly connected');
 await page.getByRole('link',{name:'Почати розмову з Mara ↗',exact:true}).click();await page.waitForURL(/studio-journey/);
 assert.equal(await page.locator('#journey-fit-consent').isChecked(),false);assert.equal(await page.locator('#journey-visibility').isChecked(),false);
 await page.getByRole('button',{name:'Знайти взаємну користь ↗',exact:true}).click();assert.equal(await page.locator('#journey-discovery').isVisible(),false);
 await page.locator('#journey-fit-consent').check();await page.locator('#journey-visibility').check();await page.getByRole('button',{name:'Знайти взаємну користь ↗',exact:true}).click();
 await page.locator('#journey-markers button').filter({hasText:'Mara'}).click();assert.ok((await page.locator('#conversation-title').innerText()).includes('Mara'));
 const words='Я можу зробити код MVP, мені потрібен дизайн першого екрана.';await page.locator('#journey-message').fill(words);await page.locator('#journey-send').click();
 assert.equal(await page.locator('.journey-message[data-author="you"] p').last().innerText(),words);assert.ok((await page.locator('.journey-message[data-author="profile"]').last().innerText()).includes('Mara'));
 await page.locator('#journey-open-proposal').click();const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10)+'T18:00';await page.locator('#journey-when').fill(tomorrow);await page.locator('#journey-scope').fill('Погодити макет і структуру MVP.');
 await page.getByRole('button',{name:'Запропонувати ці умови ↗',exact:true}).click();assert.equal(await page.locator('#journey-complete').isVisible(),false);
 await page.getByRole('button',{name:'Mara: сценарне «так»',exact:true}).click();assert.equal(await page.locator('#journey-complete').isVisible(),false);
 await page.getByRole('button',{name:'Я підтверджую цю версію',exact:true}).click();assert.equal(await page.locator('#journey-complete').isVisible(),true);
 await page.locator('#journey-scope').fill('Нова версія: тільки перший екран.');await page.getByRole('button',{name:'Запропонувати ці умови ↗',exact:true}).click();assert.equal(await page.locator('#journey-complete').isVisible(),false);
 await page.getByRole('button',{name:'Mara: сценарне «так»',exact:true}).click();await page.getByRole('button',{name:'Я підтверджую цю версію',exact:true}).click();await page.locator('#journey-complete').click();
 const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(a.violations.map(v=>v.id),[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/connected-result-390x844.png',fullPage:true});
 const download=page.waitForEvent('download');await page.locator('#journey-export').click();const f=await download,raw=await fs.readFile(await f.path(),'utf8'),archive=importSessionArchive(await unpackArchive(raw));assert.ok(archive.session.notes.some(n=>n.text.includes(words)));assert.equal(archive.session.participantIds[1],'mara');
 await page.locator('#journey-open-studio').click();await page.waitForURL(/studio\.html#session/);assert.ok((await page.locator('#session-notes').innerText()).includes(words));assert.equal(await page.evaluate(()=>sessionStorage.getItem('synera.studio.journey-handoff.v1')),null);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/handoff-studio-390x844.png',fullPage:true});assert.deepEqual(errors,[]);
 await fs.writeFile(out+'/ACCEPTANCE.json',JSON.stringify({status:'PASS',viewport:{width:390,height:844},checks:['real Atlas CTA -> same Mara','consents default off and enforced','real user/scenario transcript','no completion before both current approvals','revised terms reset approvals','local demo result','archive exact quote and participant roundtrip','same session handed to Studio','result axe zero violations and no overflow'],pageErrors:errors,physicalAndroid:false,publicAI:false},null,2));console.log('PASS connected real-browser journey');
}catch(e){await fs.writeFile(out+(red?'/BASELINE_RED.json':'/FAILURE.json'),JSON.stringify({status:red&&e.message.includes('Mara opens continuous journey')?'EXPECTED_RED':'FAIL',message:e.message,pageErrors:errors},null,2));console.error(e.message);process.exitCode=red&&e.message.includes('Mara opens continuous journey')?0:1;}
finally{await browser.close();child.kill();}
