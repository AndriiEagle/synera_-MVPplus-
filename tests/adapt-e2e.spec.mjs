import { test, expect, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
let server,base;
test.beforeAll(async()=>{
  server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{cwd:process.cwd(),env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
  base=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error(out)),30000);server.stdout.on('data',b=>{out+=b;const m=out.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});server.stderr.on('data',b=>out+=b);server.on('exit',code=>{clearTimeout(timer);reject(Error(`${code}: ${out}`));});});
});
test.afterAll(()=>server?.kill());
test('public simulation waits for its shell without flashing the legacy LAB while modules load',async({page})=>{
  let release;const gate=new Promise(resolve=>release=resolve);
  await page.route('**/simulation-living-ui.mjs',async route=>{await gate;await route.continue();});
  try {
    await page.goto(`${base}/simulation.html`,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#simulation-lab')).not.toBeVisible();
    await expect(page.locator('figure.scene-simulation')).not.toBeVisible();
    release();await expect(page.locator('#living-title')).toBeVisible();
    expect(await page.locator('figure.scene-simulation').evaluate(e=>e.previousElementSibling.id)).toBe('living-status');
  }finally{release();}
});
test('third-session consent/decline/accept/undo/reset, draft preserved, no outbound payload',async({page})=>{
  const posts=[],errors=[];page.on('request',r=>{if(r.method()!=='GET')posts.push(r.url());});page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{
    localStorage.setItem('synera.first-user-tour.v1','done');
    if(!localStorage.getItem('synera.adapt.v1'))localStorage.setItem('synera.adapt.v1',JSON.stringify({version:1,enabled:true,sessions:2,lastActivity:Date.now()-31*60000,sessionStart:Date.now()-31*60000,signals:{zoom:{large:3}},manual:{},choices:{},applied:[],declined:[]}));
    localStorage.setItem('synera.adaptive.preferences.v1',JSON.stringify({version:1,hints:false}));
  });
  await page.goto(base);await expect(page.locator('[data-adapt-observer]')).toBeAttached();
  await page.locator('#prepare-profile').click();await page.locator('[name=offers]').fill('Demo draft remains');await page.locator('.header-preferences>summary').click();
  await expect(page.locator('[data-adapt-proposal=density]')).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-density','comfortable');
  await page.locator('[data-adapt-proposal] button').first().click();await expect(page.locator('html')).toHaveAttribute('data-density','large');
  await expect(page.locator('[name=offers]')).toHaveValue('Demo draft remains');
  await page.reload();await page.locator('.header-preferences>summary').click();
  await expect(page.locator('[data-adapt-observer] li')).toContainText('Більші кнопки');
  await page.locator('[data-adapt-observer] li button').click();await expect(page.locator('html')).toHaveAttribute('data-density','comfortable');
  const prefs=page.locator('.header-preferences');if(!await prefs.evaluate(e=>e.open))await prefs.locator('> summary').click();
  const sizes=page.locator('.adaptive-sizes');if(!await sizes.evaluate(e=>e.open))await sizes.locator('> summary').click();
  await page.locator('[data-adaptive-density]').selectOption('compact');
  if(!await prefs.evaluate(e=>e.open))await prefs.locator('> summary').click();
  await page.locator('[data-adapt-observer] > button').click();await expect(page.locator('html')).toHaveAttribute('data-density','compact');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('synera.adapt.v1')).enabled)).toBe(false);
  expect(posts).toEqual([]);expect(errors).toEqual([]);
});
for(const lang of ['uk','de','en'])test(`Demo balance, explain/dismiss, pause/report, Triangle and journal opt-in ${lang}`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`${base}/simulation.html?lang=${lang}`);await page.locator('[data-demo-balance]>summary').click();
  const panel=page.locator('[data-demo-balance]');await expect(panel.locator('[data-balance-signal]')).toHaveCount(6);
  await panel.locator('[data-balance-signal=contributions] summary').click();await expect(panel.locator('[data-balance-signal=contributions] details')).toContainText('bot-mira: 1');
  await panel.locator('[data-balance-signal=asks] button').click();await expect(panel.locator('[data-balance-signal=asks]')).toHaveCount(0);
  const requests=[];page.on('request',r=>{if(r.method()!=='GET')requests.push(r.url());});
  await panel.locator('[data-collaboration-pause]').click();await expect(panel.locator('[role=status]')).not.toBeEmpty();
  await panel.locator('[data-sovereign] > button').last().click();await expect(panel.locator('a[href="/legal.html"]')).toBeVisible();expect(requests).toEqual([]);
  await page.locator('[data-view=join]').click();await page.locator('[name=name]').fill('Alex · Demo');await page.locator('[name=offers]').fill('Demo sales');await page.locator('[name=seeks]').fill('Demo design');await page.locator('#visitor-start').click();
  await expect(page.locator('#visitor-chat [data-sovereign]')).toBeVisible();await expect(page.locator('[data-similar-consent]')).not.toBeChecked();
  await page.locator('#visitor-chat [data-suggestion=next] button').click();
  await page.locator('[data-matching-field=give]').selectOption('sales');await page.locator('[data-matching-field=need]').selectOption('design');await page.locator('[data-similar-consent]').check();
  await page.locator('#visitor-chips button').first().click();await expect(page.locator('#visitor-result')).toBeVisible();await page.locator('#visitor-result').click();
  await expect(page.locator('#visitor-chat [data-suggestion=next]')).toHaveCount(0);
  await page.locator('[data-similar-consent]').locator('xpath=ancestor::section[1]').locator('> button').click();
  await expect(page.locator('[data-similar-consent]').locator('xpath=ancestor::section[1]')).toContainText('Lina');
  await page.locator('[data-similar-consent]').uncheck();await expect(page.locator('[data-similar-consent]').locator('xpath=ancestor::section[1]')).not.toContainText('Lina');
  expect(errors).toEqual([]);
});
test('Triangle shows three-party prompts, completed local tasks and symmetric counts',async({page})=>{
  await page.goto(`${base}/triangle.html`);await page.locator('#room-goal').fill('Demo prototype');
  for(const [id,name]of [['a','Alex Demo'],['b','Bo Demo'],['c','Cam Demo']])await page.locator(`#name-${id}`).fill(name);
  await page.locator('#local-understood').check();
  await page.locator('#room-setup button').click();await expect(page.locator('#triangle-sovereign [data-suggestion=triangle]')).toBeVisible();
  await expect(page.locator('#triangle-sovereign [data-balance]')).toHaveCount(0);
  await page.locator('#task-title').fill('Demo sketch delivered');await page.locator('#task-owner').selectOption('a');await page.locator('#task-form button').click();await page.locator('#room-tasks input').check();
  await expect(page.locator('#triangle-sovereign [data-balance-signal=contributions]')).toBeVisible();
  await page.locator('#triangle-sovereign [data-balance-signal=contributions] summary').click();
  await expect(page.locator('#triangle-sovereign [data-balance-signal=contributions]')).toContainText('a: 1 · b: 0 · c: 0');
});
for(const device of ['iPhone 13','Pixel 7'])test(`screenshots and no horizontal overflow ${device}`,async({browser})=>{
  const context=await browser.newContext({...devices[device],reducedMotion:'reduce'}),page=await context.newPage();
  await fs.mkdir('docs/adapt-20261030/shots',{recursive:true});
  await page.goto(`${base}/simulation.html?lang=uk`);await page.locator('[data-demo-balance]>summary').click();await page.locator('[data-demo-balance] [data-balance] > h3').scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`docs/adapt-20261030/shots/${device.replaceAll(' ','-')}-balance.png`});
  await page.goto(base);await page.locator('.header-preferences>summary').click();await page.locator('[data-adapt-observer] label').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-adapt-observer] label')).toBeInViewport({ratio:0.95});
  await page.screenshot({path:`docs/adapt-20261030/shots/${device.replaceAll(' ','-')}-adaptation.png`});
  await page.locator('[data-adapt-observer] input').check();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('synera.adapt.v1')).enabled)).toBe(true);
  await page.locator('.adaptive-sizes > summary').click();
  await page.getByRole('button',{name:'Збільшити текст тут',exact:true}).click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('synera.adapt.v1')).signals.zoom.normal)).toBeGreaterThan(0);
  await context.close();
});
