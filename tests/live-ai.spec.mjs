import { test,expect,devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
let server,origin;
test.beforeAll(async()=>{
  server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
  origin=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error(out)),30000);server.stdout.on('data',b=>{out+=b;const m=out.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});server.stderr.on('data',b=>out+=b);server.on('exit',()=>reject(Error(out)));});
});
test.afterAll(()=>server?.kill());
async function open(page,ready=true,lang='en',runtime='worker') {
  await page.route('**/config.json',r=>r.fulfill({json:{liveAiReady:ready,liveAiModel:'z-ai/glm-5.3-flash',liveAiProvider:'Fixture Inference',liveAiRuntime:runtime,liveAiUnavailableReason:ready?null:'operator_setup_required'}}));
  await page.emulateMedia({reducedMotion:'reduce'}); await page.goto(origin+'/simulation.html?lang='+lang);
  await page.locator('[data-view=join]').click();
  await page.locator('[name=name]').fill('PRIVATE PROFILE NAME'); await page.locator('[name=offers]').fill('PRIVATE PROFILE OFFER'); await page.locator('[name=seeks]').fill('PRIVATE PROFILE NEED'); await page.locator('#visitor-start').click();
}
const enable=async page=>{await page.locator('#live-ai-toggle').click();await expect(page.locator('#live-ai-notice')).toBeVisible();await page.locator('#live-ai-accept').click();};
const send=async(page,text='Can you propose a small draft?')=>{await page.locator('#visitor-text').fill(text);await page.locator('#visitor-send').click();};
test('default-off, explicit consent, exact visitor-only payload, AI tag, revocation and reload',async({page})=>{
  const calls=[]; await page.route('**/api/ai/persona-reply',r=>{calls.push(r.request().postDataJSON());return r.fulfill({json:{text:'Demo · A sketch for one interview. Shall we try?',model:'z-ai/glm-5.3-flash',promptTokens:30,completionTokens:20,costUsd:0.0001,requestId:'fixture'}});});
  await open(page); await expect(page.locator('#live-ai-toggle')).not.toBeChecked();
  await send(page); await expect(page.locator('#visitor-wait')).toBeEmpty(); expect(calls).toHaveLength(0);
  await page.locator('#live-ai-toggle').click();await expect(page.locator('#live-ai-notice')).toContainText('OpenRouter');await expect(page.locator('#live-ai-notice')).toContainText('Z.ai');expect(calls).toHaveLength(0);
  await page.locator('#live-ai-decline').click();await expect(page.locator('#live-ai-toggle')).not.toBeChecked();
  await enable(page);await send(page,'One draft, please');await expect(page.locator('#visitor-chat [data-ai-tag]')).toHaveCount(1);
  expect(calls).toHaveLength(1); expect(Object.keys(calls[0]).sort()).toEqual(['conversation','locale','persona','visitorText']);expect(JSON.stringify(calls[0])).not.toContain('PRIVATE PROFILE');
  await expect(page.locator('#visitor-result')).toBeHidden();await page.locator('#live-ai-toggle').click();
  const events=await page.evaluate(()=>JSON.parse(localStorage.getItem('synera.journal.v1')).filter(e=>e.kind==='consent'&&e.data.purpose==='live_ai_persona_reply'));
  expect(events.map(e=>e.data.decision)).toEqual(['grant','revoke']);expect(events[1].data.previousEventId).toBe(events[0].data.eventId);
  await send(page);await expect(page.locator('#visitor-wait')).toBeEmpty();expect(calls).toHaveLength(1);
  await page.reload();await page.locator('[data-view=join]').click();await expect(page.locator('#live-ai-toggle')).not.toBeChecked();await expect(page.locator('#visitor-chat [data-ai-tag]')).toHaveCount(1);
  await page.locator('[data-view=journal]').click();await expect(page.locator('#journal-events [data-ai-tag]')).toHaveCount(1);
});
test('cap reached falls back visibly; AI never signs persona agreement',async({page})=>{
  await page.route('**/api/ai/persona-reply',r=>r.fulfill({status:503,json:{error:'live_ai_cap_reached'}}));await open(page);await enable(page);await send(page);
  await expect(page.locator('#live-ai-status')).toContainText('daily');await expect(page.locator('#visitor-wait')).toBeEmpty();await expect(page.locator('[data-ai-tag]')).toHaveCount(0);
});
test('Vercel health hides the switch when the runtime key is missing',async({page})=>{
  await page.route('**/api/ai/health',r=>r.fulfill({json:{liveAiReady:false,error:'live_ai_not_configured'}}));
  await open(page);
  await page.route('**/config.json',r=>r.fulfill({json:{liveAiReady:true,liveAiModel:'z-ai/glm-5.3-flash',liveAiProvider:'OpenRouter',liveAiRuntime:'vercel'}}));
  await page.reload();await page.locator('[data-view=join]').click();
  await expect(page.locator('#live-ai-toggle')).toBeHidden();
});
test('Jev rejection uses the existing script and never gets an AI tag',async({page})=>{
  await page.route('**/api/ai/persona-reply',r=>r.fulfill({json:{text:'Demo · Scripted fallback',model:'z-ai/glm-5.3-flash',requestId:'rejected',judged:'rejected',scripted:true}}));
  await open(page);await enable(page);await send(page);await expect(page.locator('#visitor-wait')).toBeEmpty();
  await expect(page.locator('#visitor-chat')).not.toContainText('Scripted fallback');await expect(page.locator('[data-ai-tag]')).toHaveCount(0);
});
test('withdrawal and device erasure discard late model output',async({page})=>{
  let release;const held=new Promise(r=>release=r);await page.route('**/api/ai/persona-reply',async r=>{await held;await r.fulfill({json:{text:'Demo late AI',model:'z-ai/glm-5.3-flash',requestId:'late'}}).catch(()=>{});});
  await open(page);await enable(page);await send(page);await page.locator('#live-ai-toggle').click();release();await expect(page.locator('#visitor-wait')).toBeEmpty();await expect(page.locator('[data-ai-tag]')).toHaveCount(0);
  await page.evaluate(()=>window.dispatchEvent(new Event('synera:before-device-erase')));await page.evaluate(()=>{localStorage.removeItem('synera.journal.v1');window.dispatchEvent(new Event('synera:device-erased'));});
  await expect(page.locator('#visitor-chat')).toBeHidden();expect(await page.evaluate(()=>localStorage.getItem('synera.journal.v1'))).toBeNull();
});
test('config off hides switch and explains operator setup',async({page})=>{
  await open(page,false);await expect(page.locator('#live-ai-toggle')).toBeHidden();await expect(page.locator('#live-ai-status')).toContainText('operator');
});
test('failed configuration fetch reports unverified connection without claiming operator state',async({page})=>{
  await page.route('**/config.json',r=>r.abort('failed'));
  await page.goto(origin+'/simulation.html?lang=en');await page.locator('[data-view=join]').click();
  await expect(page.locator('#live-ai-toggle')).toBeHidden();await expect(page.locator('#live-ai-status')).toContainText('connection');
});
for(const [name,device] of [['iPhone13',devices['iPhone 13']],['Pixel7',devices['Pixel 7']]]) test(`${name}: notice and marked answer fit phone`,async({browser})=>{
  const context=await browser.newContext({...device,defaultBrowserType:undefined,serviceWorkers:'block'});const page=await context.newPage();
  await page.route('**/api/ai/persona-reply',r=>r.fulfill({json:{text:'Demo · Один ескіз за коротке інтерв’ю. Почнемо з чернетки?',model:'z-ai/glm-5.3-flash',promptTokens:30,completionTokens:20,costUsd:0.0001,requestId:'shot'}}));
  await page.route('**/api/ai/health',r=>r.fulfill({json:{liveAiReady:true,model:'z-ai/glm-5.3-flash',provider:'OpenRouter'}}));
  await open(page,true,'uk','vercel');await page.locator('#live-ai-toggle').click();await page.locator('#live-ai-notice').scrollIntoViewIfNeeded();
  expect((await new AxeBuilder({page}).include('#live-ai-notice').analyze()).violations.filter(v=>['critical','serious'].includes(v.impact))).toEqual([]);
  await fs.mkdir('docs/live-ai-vercel-20261030/shots',{recursive:true});await page.screenshot({path:`docs/live-ai-vercel-20261030/shots/${name}-notice.png`,fullPage:true});
  await page.locator('#live-ai-accept').click();await send(page,'Що можемо спробувати?');await expect(page.locator('[data-ai-tag]')).toHaveCount(1);await page.locator('[data-ai-tag]').scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`docs/live-ai-vercel-20261030/shots/${name}-answer.png`,fullPage:true});await context.close();
});
