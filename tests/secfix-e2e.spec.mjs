import {test,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {A,config,createFixture} from '../tools/fixtures/real-journey-fixture.mjs';
import fs from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

let server,base;
test.beforeAll(async()=>{
  server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
  base=await new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(Error('Server unavailable')),20000);
    server.stdout.on('data',chunk=>{output+=chunk;const url=output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];if(url){clearTimeout(timeout);resolve(url);}});
    server.once('exit',()=>{clearTimeout(timeout);reject(Error('Server exited'));});});
});
test.afterAll(()=>server?.kill());

for(const [device,width,height] of [['iphone13',390,844],['pixel7',412,915]])test(`SECFIX complete-erasure gate, typed confirmation, failed/successful receipts and honest copy ${device}`,async({page})=>{
  await page.setViewportSize({width,height});
  const db=createFixture(),requests=[],errors=[];let enabled=false,fail=true;
  for(const profile of db.profiles)profile.display_name='Demo '+profile.id[0];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('synera.first-user-tour.v1','done');localStorage.setItem('synera.real-journey.language.v1','uk');});
  await page.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin!==base){await route.abort();return;}
    if(url.pathname==='/config.json'){await route.fulfill({json:{...config,profileErasureEnabled:true,completeErasureEnabled:enabled}});return;}
    if(url.pathname==='/api/neon/health'){await route.fulfill({json:{ok:true}});return;}
    if(url.pathname==='/api/neon/privacy-erasure'){
      requests.push(JSON.parse(req.postData()));
      await route.fulfill({status:fail?503:200,json:fail?{error:'profile_erasure_unconfirmed'}:{status:'application_data_completely_erased',providerDeletion:'pending',staleSessionTombstone:'retained',repeated:false,sessionRevoked:false}});return;
    }
    if(url.pathname.startsWith('/api/neon/')){
      const response=await db.fetchFor(A)(url.pathname+url.search,{method:req.method(),headers:req.headers(),...(req.method()==='GET'?{}:{body:req.postData()})});
      await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});return;
    }
    await route.continue();
  });
  await page.goto(base+'/');await expect(page.locator('#workspace')).toBeVisible();
  await page.locator('[data-tab="settings"]').click();
  await expect(page.locator('#complete-erasure-controls')).toBeHidden();await expect(page.locator('#delete-profile')).toBeHidden();
  enabled=true;await page.reload();await expect(page.locator('#workspace')).toBeVisible();await page.locator('[data-tab="settings"]').click();
  const controls=page.locator('#complete-erasure-controls');await expect(controls).toBeVisible();await controls.locator('summary').click();
  const field=page.locator('#complete-erasure-confirmation'),submit=page.locator('#complete-erasure-form button');
  await field.fill('DELETE');await submit.click();expect(requests).toHaveLength(0);
  await field.fill('DELETE ALL');await submit.click();await expect(page.locator('#auth-form')).toHaveAttribute('aria-busy','false');
  expect(requests).toHaveLength(1);await expect(page.locator('#workspace')).toBeVisible();
  await expect(controls).toContainText('90 днів');await expect(controls).toContainText('Акаунт входу');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await fs.mkdir('docs/secfix-20261030',{recursive:true});
  await controls.scrollIntoViewIfNeeded();await page.screenshot({path:`docs/secfix-20261030/${device}.png`,fullPage:true});
  const audit=await new AxeBuilder({page}).analyze();expect(audit.violations.filter(v=>['critical','serious'].includes(v.impact))).toEqual([]);
  fail=false;await submit.click();await expect(page.locator('#workspace')).toBeHidden();
  expect(requests[1]).toEqual({confirm:'ERASE_ALL_APPLICATION_DATA',expectedSubject:A});
  await expect(page.locator('#notice')).toContainText('90 днів');await expect(page.locator('#notice')).toContainText('не відкликано');
  await expect(page.locator('#erasure-session-signout')).toBeVisible();
  expect(errors).toEqual([]);
});
