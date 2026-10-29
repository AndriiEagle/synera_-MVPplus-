// Bounded local browser acceptance; no credentials, provider calls or network writes.
import { chromium, devices } from 'file:///C:/Users/Andrii/Desktop/synera-premium-pwa-variant/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:49711';
const out = 'docs/design-pass-20261029';
const pages = ['index','summit','studio','studio-journey','real-journey','rooms','triangle','legal','catalogue','get','outcome-archive','lab'];
const styles = ['atelier','synera','night'];
const browser = await chromium.launch({ channel:'chrome', headless:true });
const report = [];
try {
  for (const style of styles) {
    const ctx = await browser.newContext({ ...devices['iPhone 13'], viewport:{ width:390,height:844 }, serviceWorkers:'block', reducedMotion:'reduce' });
    await ctx.addInitScript(style => { localStorage.setItem('synera.style',style); localStorage.setItem('synera.first-user-tour.v1','done'); },style);
    // LAB is deliberately excluded from the product server. Preview only its synthetic local files.
    const labFiles = new Map([['/lab.html','text/html'],['/lab.mjs','text/javascript'],['/lab-fixtures.mjs','text/javascript'],['/lab.css','text/css'],['/economics.mjs','text/javascript']]);
    await ctx.route(url=>labFiles.has(url.pathname),route=>route.fulfill({body:fs.readFileSync('web_launch'+new URL(route.request().url()).pathname),contentType:labFiles.get(new URL(route.request().url()).pathname)}));
    for (const name of pages) {
      const page = await ctx.newPage(), errors = [];
      page.on('pageerror', e=>errors.push(String(e)));
      page.on('response', r=>{if(r.status()>=400 && !r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});
      await page.goto(base+'/'+(name==='index'?'':name+'.html'),{waitUntil:'networkidle'});
      const values = await page.evaluate(()=>({style:document.documentElement.dataset.syneraStyle,language:document.documentElement.lang,
        scroll:document.documentElement.scrollWidth>innerWidth,headers:document.querySelectorAll('body > header').length,
        controls:document.querySelectorAll('.header-preferences').length,modes:document.querySelectorAll('.more-modes').length,
        openModes:document.querySelectorAll('.more-modes[open]').length,display:document.querySelector('h1') ? getComputedStyle(document.querySelector('h1')).fontFamily : null,
        body:getComputedStyle(document.body).fontFamily}));
      assert.deepEqual(errors,[],name);
      assert.equal(values.style,style,name); assert.equal(values.language,'uk',name); assert.equal(values.scroll,false,name);
      assert.equal(values.headers,1,name); assert.equal(values.controls,1,name); assert.equal(values.modes,1,name); assert.equal(values.openModes,0,name);
      assert.ok(values.display,name+' needs a page heading');
      assert.deepEqual(errors,[],name);
      assert.equal(await page.evaluate(()=>scrollY),0,name+' starts at top');
      const file=`matrix-${style}-${name}.png`;
      await page.screenshot({path:out+'/shots/'+file});
      // Expanded settings must fit and remain keyboard dismissible in every look.
      await page.locator('.header-preferences > summary').click();
      assert.equal(await page.locator('#site-language').isVisible(),true,name);
      assert.equal(await page.locator('#style-preset').inputValue(),style,name);
      const bounds=await page.locator('.header-preferences-content').boundingBox();
      assert.ok(bounds.x>=0 && bounds.x+bounds.width<=390,name+' preference bounds');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.header-preferences').getAttribute('open'),null,name);
      report.push({file,layer:name==='lab'?'local-synthetic-preview':'product-http',...values,errors}); await page.close();
    }
    await ctx.close();
  }
  // Native translated pages: explicit choice, reload persistence and exact Ukrainian restoration.
  for (const name of ['index','summit','real-journey','get','legal']) {
    const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
    await ctx.addInitScript(()=>localStorage.setItem('synera.first-user-tour.v1','done'));
    const page=await ctx.newPage(), errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(base+'/'+(name==='index'?'':name+'.html'),{waitUntil:'networkidle'});
    assert.equal(await page.getAttribute('html','data-synera-style'),'atelier',name+' no-preference default');
    const uk=await page.locator('h1').innerText();
    for(const lang of ['de','en','uk']) {
      await page.locator('.header-preferences > summary').click();
      await page.locator('#site-language').selectOption(lang);
      await page.waitForFunction(lang=>document.documentElement.lang===lang,lang);
      await page.waitForTimeout(200);
      const heading=await page.locator('h1').innerText();
      if(lang==='uk')assert.equal(heading,uk,name+' restore');else assert.notEqual(heading,uk,name+' translation');
      await page.reload({waitUntil:'networkidle'});
      assert.equal(await page.getAttribute('html','lang'),lang,name+' persistence');
    }
    assert.deepEqual(errors,[],name); await ctx.close();
  }
  // A draft survives language and look changes. Text equal to a UI label is still the person's text.
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await ctx.addInitScript(()=>localStorage.setItem('synera.first-user-tour.v1','done'));
  const page=await ctx.newPage();await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('#prepare-profile').click();
  const field=page.locator('#profile-form [name="display_name"]');
  await field.fill('Знайдіть взаємність');
  await page.locator('.header-preferences > summary').click();
  await page.locator('#site-language').selectOption('en');
  await page.locator('#style-preset').selectOption('night');
  assert.equal(await field.inputValue(),'Знайдіть взаємність');
  assert.equal(await page.getAttribute('html','data-synera-style'),'night');
  assert.equal(await page.evaluate(()=>localStorage.getItem('synera.style')),'night');
  await ctx.close();
  fs.writeFileSync(out+'/browser-report.json',JSON.stringify({status:'pass',matrix:report,nativeLanguages:5,draftPreserved:true},null,2));
  console.log('PASS: 33 product HTTP + 3 local LAB previews, five native language roundtrips, draft persistence.');
} finally { await browser.close(); }
