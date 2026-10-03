// A real local-model reply through the same browser and endpoint used by Studio.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { unpackArchive } from '../web_launch/archive-codec.mjs';
import { importSessionArchive } from '../web_launch/session-value.mjs';
const out='artifacts/journey-20261003/local-ai';await fs.mkdir(out,{recursive:true});
const child=spawn('node',['web_launch/server.mjs','--demo','--local-ai'],{cwd:process.cwd(),windowsHide:true,stdio:['ignore','pipe','pipe']});
let browser;
try {
 const url=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Local server did not start')),10000);child.stdout.on('data',chunk=>{const m=String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});child.on('error',reject);});
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url+'/studio-journey.html?person=mara');await page.locator('#journey-fit-consent').check();await page.locator('#journey-visibility').check();await page.locator('#journey-fit button[type=submit]').click();await page.locator('#journey-markers button').filter({hasText:'Mara'}).click();
 await page.locator('#journey-conversation details').evaluate(el=>el.open=true);
 await page.waitForFunction(()=>!document.querySelector('#journey-ai-consent').disabled);assert.equal(await page.locator('#journey-ai-consent').isChecked(),false);await page.locator('#journey-ai-consent').check();
 const words='Я можу автоматизувати бронювання кавових зустрічей для підприємців. Мені потрібен дизайн першого екрана. Який один конкретний результат нам варто погодити на 30 хвилин?';
 await page.locator('#journey-message').fill(words);
 const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/journey-ai'),{timeout:100000});const began=Date.now();await page.locator('#journey-send').click();const response=await responsePromise,value=await response.json();
 assert.equal(response.status(),200,JSON.stringify(value));assert.equal(value.receipt.engine,'local-domovyk');assert.equal(value.receipt.providerCalls,0);assert.equal(value.receipt.actualUsd,0);assert.equal(value.receipt.finishReason,'stop');assert.equal(createHash('sha256').update(value.text).digest('hex'),value.replySha256);
 await page.waitForFunction(()=>document.querySelector('.journey-message[data-author="L"]'));assert.equal(await page.locator('.journey-message[data-author="L"] p').innerText(),value.text);assert.equal(await page.locator('#journey-complete').isVisible(),false);assert.equal(await page.locator('#journey-message').inputValue(),'');
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/real-reply-390x844.png',fullPage:true});
 await page.locator('#journey-open-proposal').click();await page.locator('#journey-when').fill(new Date(Date.now()+86400000).toISOString().slice(0,10)+'T18:00');await page.locator('#journey-scope').fill('Підготувати схему першого екрана бронювання.');await page.locator('#journey-proposal-form button[type=submit]').click();
 await page.getByRole('button',{name:'Mara: сценарне «так»',exact:true}).click();assert.equal(await page.locator('#journey-complete').isVisible(),false);await page.getByRole('button',{name:'Я підтверджую цю версію',exact:true}).click();await page.locator('#journey-complete').click();
 const pendingDownload=page.waitForEvent('download');await page.locator('#journey-export').click();const download=await pendingDownload,archive=importSessionArchive(await unpackArchive(await fs.readFile(await download.path(),'utf8'))),provenance=JSON.parse(archive.session.notes.find(n=>n.sourceId.startsWith('receipt-')).text);
 assert.equal(provenance.actualModel,value.receipt.actualModel);assert.equal(provenance.replySha256,value.replySha256);assert(archive.session.notes.some(n=>n.text===value.text));assert.deepEqual(errors,[]);
 const report={status:'PASS_LOCAL_RUNTIME_REQUIRES_HUMAN_CONTENT_REVIEW',physicalAndroid:false,publicAI:false,localInferenceCalls:1,providerCalls:0,actualUsd:0,elapsedMs:Date.now()-began,syntheticInput:words,reply:value.text,receipt:provenance,checks:['explicit separate local AI consent','actual canonical DOMOVYK inference','reply SHA-256 bound to displayed text and last turn','exact model and stop completion','no AI approval or completed meeting','receipt and exact reply survive downloaded archive'],pageErrors:errors};
 await fs.writeFile(out+'/ACCEPTANCE.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,actualModel:provenance.actualModel,usage:provenance.usage,elapsedMs:report.elapsedMs,providerCalls:0,actualUsd:0}));
}catch(error){await fs.writeFile(out+'/FAILURE.json',JSON.stringify({status:'FAIL',message:error.message,providerCalls:0,paidFallback:false},null,2));console.error(error.message);process.exitCode=1;}
finally{if(browser)await browser.close();child.kill();}
