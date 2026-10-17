// Prepared Android Chrome CDP check; transport is synthetic. Device identity is verified separately.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {A,B,config,fields,createFixture} from './fixtures/real-journey-fixture.mjs';
const [endpoint,base]=process.argv.slice(2);
assert.match(endpoint,/^http:\/\/127\.0\.0\.1:\d+$/);
assert.match(base,/^http:\/\/localhost:\d+$/);
const out='artifacts/android-cloud-20261009/device';
await fs.mkdir(out,{recursive:true});
const result={scope:'Connected Android Chrome, synthetic auth/data; not live accounts. Physical identity requires separate device proof.',screens:[]};
const browser=await chromium.connectOverCDP(endpoint);
const context=browser.contexts()[0];
context.setDefaultTimeout(30000);
const page=await context.newPage();
const cdp=await context.newCDPSession(page);
await cdp.send('Network.setBypassServiceWorker',{bypass:true});
async function capture(name){
 const geometry=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,ua:navigator.userAgent}));
 assert.match(geometry.ua,/Android/,'Must be actual Android Chrome, not desktop viewport');
 assert.ok(geometry.scrollWidth<=geometry.width+1,JSON.stringify(geometry));
 await page.screenshot({path:`${out}/${name}.png`});
 result.screens.push({name,...geometry});console.log(name+' captured');
}
const ready=()=>page.waitForFunction(()=>!document.body.dataset.realBusy);
async function open(id){const el=page.locator('#'+id);if(!await el.evaluate(e=>e.open))await el.locator('summary').first().click();}
async function peer(name){await ready();await open('real-people-panel');await page.locator('#real-people article').filter({hasText:name}).getByRole('button').click();await ready();}
async function approve(){await page.locator('#real-approve-check').check();await page.locator('#real-approve').click();await ready();}
try{
 await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
 await page.goto(base+'/get.html');await capture('android-get');
 const db=createFixture();let actor=A;
 await context.route('**/config.json',r=>r.fulfill({json:config}));
 await context.route('**/api/neon/**',async r=>{const q=r.request(),u=new URL(q.url());const response=await db.fetchFor(actor)(u.pathname+u.search,{method:q.method(),headers:q.headers(),...(q.method()==='GET'?{}:{body:q.postData()})});await r.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});});
 const load=async()=>{await page.goto(base+'/real-journey.html');await page.locator('#real-content-panel').waitFor({state:'visible'});};
 await load();await peer('Тест Марія');await open('real-editor');
 for(const [name,value] of Object.entries(fields())){const e=page.locator(`#real-terms-form [name="${name}"]`);if(await e.evaluate(e=>e.tagName==='SELECT'))await e.selectOption(value);else await e.fill(value);}
 await capture('android-terms');await page.locator('#real-terms-form button[type=submit]').click();await ready();await approve();
 actor=B;await load();await peer('Тест Андрій');await approve();
 actor=A;await load();await peer('Тест Марія');
 const invite=page.locator('#real-invite-form');
 await invite.locator('[name=note]').fill('Synthetic Android acceptance');
 await invite.locator('[name=proposed_at]').fill(new Date(Date.now()+86400000).toISOString().slice(0,16));
 await invite.locator('[name=duration_minutes]').selectOption('30');await invite.locator('[name=meeting_place]').selectOption('Zürich');
 await invite.getByRole('button').click();await ready();
 actor=B;await load();await open('real-meetings-panel');
 await page.locator('#real-meetings').getByRole('button',{name:'Прийняти',exact:true}).click();await ready();
 await page.locator('#real-meetings').getByRole('button',{name:'Відкрити розмову'}).click();await ready();
 const message='Підтверджую домовленість — Android synthetic test.';
 await page.locator('#real-message').fill(message);await page.locator('#real-message-form button').click();await ready();
 assert.ok((await page.locator('#real-transcript').innerText()).includes(message));
 assert.equal(db.approvals.length,2);assert.equal(db.meetings[0].status,'accepted');assert.equal(db.messages.length,1);
 await capture('android-chat');result.journey={approvals:2,meeting:'accepted',messages:1};result.status='PASS_CLOUD_ANDROID_SYNTHETIC_FLOW';
}catch(error){result.status='FAIL';result.error=error.message;try{await page.screenshot({path:out+'/android-failure.png'});}catch{}process.exitCode=1;}
finally{await fs.writeFile(out+'/ANDROID_UI.json',JSON.stringify(result,null,2));await context.unrouteAll({behavior:'wait'});await cdp.detach();await page.close();await browser.close();}
