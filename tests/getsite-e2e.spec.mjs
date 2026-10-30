import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
let server, base;
test.beforeAll(async () => {
  server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore','pipe','pipe'] });
  base = await new Promise((resolve,reject) => {
    let output = ''; const timer = setTimeout(() => reject(Error(output)),30000);
    server.stdout.on('data', b => { output += b; const url = output.match(/http:\/\/127\.0\.0\.1:\d+/); if(url){clearTimeout(timer);resolve(url[0]);} });
    server.on('error',reject);
  });
});
test.afterAll(() => { if(server?.exitCode===null)server.kill(); });

test('a slow install module cannot swallow the first guide click',async({page})=>{
  let release;const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/getsite.mjs',async route=>{await gate;await route.continue();});
  try {
    await page.goto(`${base}/get.html?lang=en`,{waitUntil:'commit'});
    await expect(page.locator('#manual-install')).toBeDisabled();
    release();await page.locator('#manual-install').click();
    await expect(page.locator('#install-guide')).toBeVisible();
  } finally { release(); }
});

for (const [device, ua, width, height] of [
  ['Pixel-7','Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36',412,915],
  ['iPhone-13','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',390,844],
]) for(const lang of ['uk','de','en']) test(`${device} ${lang}: install guide, live QR, a11y and touch targets`, async ({browser},info) => {
  const context = await browser.newContext({userAgent:ua,viewport:{width,height},isMobile:true,hasTouch:true});
  const page = await context.newPage(), errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/get.html?next=profile&lang=${lang}`);
  await expect(page.locator('#install-primary')).toBeVisible();
  await expect(page.locator('#phone-qr svg')).toBeVisible();
  await expect(page.locator('#qr-link')).toHaveAttribute('href',`${base}/get.html?next=profile&lang=${lang}`);
  await page.locator('#install-primary').click();
  await expect(page.locator(device==='Pixel-7'?'#android-guide':'#ios-guide')).toBeVisible();
  expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});
  const small = await page.locator('a,button,summary,select').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).filter(n=>{const r=n.getBoundingClientRect();return r.width<44||r.height<44;}).map(n=>n.outerHTML));
  expect(small).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(lang!=='uk')expect(await page.locator('main').innerText()).not.toMatch(/[А-Яа-яІіЇїЄє]/);
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);expect(errors).toEqual([]);
  await page.locator('#install-guide-close').click();await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:info.outputPath(`${device}-${lang}.png`),fullPage:true});
  await context.close();
});

test('native prompt is consumed once; dismissal retains manual installation',async({page})=>{
  await page.goto(`${base}/get.html?lang=en`);
  await page.evaluate(()=>{let calls=0;window.promptCalls=()=>calls;const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=async()=>{calls++;};e.userChoice=Promise.resolve({outcome:'dismissed'});dispatchEvent(e);});
  await page.locator('#install-primary').click();expect(await page.evaluate(()=>window.promptCalls())).toBe(1);
  await page.locator('#install-guide-close').click();
  await page.locator('#install-primary').click();expect(await page.evaluate(()=>window.promptCalls())).toBe(1);
  await expect(page.locator('#android-guide')).toBeVisible();
});

test('failed prompt falls back; appinstalled switches to opening the draft',async({page})=>{
  await page.goto(`${base}/get.html?next=profile&lang=de`);
  await page.evaluate(()=>{const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=async()=>{throw Error('prompt unavailable');};dispatchEvent(e);});
  await page.locator('#install-primary').click();await expect(page.locator('#android-guide')).toBeVisible();
  await page.evaluate(()=>dispatchEvent(new Event('appinstalled')));
  await expect(page.locator('#install-guide')).not.toBeVisible();
  await expect(page.locator('#install-primary')).toHaveText('Synera öffnen');
  await page.locator('#install-primary').click();await expect(page).toHaveURL(`${base}/?draft=1&lang=de`);
});

test('oversize live URL retains a usable link instead of a broken QR',async({page})=>{
  await page.goto(`${base}/get.html?next=profile&lang=en&source=${'x'.repeat(220)}`);
  await expect(page.locator('#phone-qr')).toContainText('too long');
  await expect(page.locator('#phone-qr svg')).toHaveCount(0);
  await expect(page.locator('#qr-link')).toHaveAttribute('href',page.url());
  await page.locator('#install-primary').click();await expect(page.locator('#install-guide')).toBeVisible();
});

test('standalone opens same-origin draft with language; desktop QR and switch preserve next',async({page})=>{
  await page.goto(`${base}/get.html?next=profile&lang=de`);
  await expect(page.locator('body')).toHaveAttribute('data-device','desktop');
  await page.locator('.header-preferences > summary').click();await page.locator('#site-language').selectOption('en');
  await expect(page).toHaveURL(/next=profile&lang=en/);
  await page.emulateMedia({media:'screen'});
  await page.addInitScript(()=>{const native=window.matchMedia;window.matchMedia=q=>q==='(display-mode: standalone)'?{matches:true,addEventListener(){}}:native(q);});
  await page.reload();await expect(page.locator('#install-primary')).toHaveText('Open Synera');
  await page.locator('#install-primary').click();await expect(page).toHaveURL(/\/\?draft=1&lang=en/);
  await expect(page.locator('#profile-form')).toBeVisible();
});
