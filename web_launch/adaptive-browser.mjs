// Local Chromium acceptance. Fictional form data only; no hosted inference or physical-device claim.
import { chromium, devices } from 'file:///C:/Users/Andrii/Desktop/synera-premium-pwa-variant/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { PALETTES } from './adaptive-config.mjs';
const base=process.argv[2]||'http://127.0.0.1:49811';
const out=new URL('../docs/adaptive-20261029/shots/',import.meta.url);mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
if(process.argv.includes('--gallery')) {
  const files=readdirSync(out).filter(f=>f.endsWith('.png')&&!f.startsWith('sheet-')).sort();
  const p=await browser.newPage({viewport:{width:840,height:1200},deviceScaleFactor:1});
  const html=items=>'<meta charset="utf-8"><style>body{margin:0;background:#ddd;font:12px Arial}main{display:grid;grid-template-columns:repeat(3,280px);gap:0}figure{margin:0;padding:8px}img{width:264px;height:572px;object-fit:contain;object-position:top;background:white}figcaption{padding:8px 0;overflow-wrap:anywhere}</style><main>'+items.map(f=>`<figure><img src="data:image/png;base64,${readFileSync(new URL(f,out)).toString('base64')}"><figcaption>${f}</figcaption></figure>`).join('')+'</main>';
  for(let i=0;i<files.length;i+=6) {await p.setContent(html(files.slice(i,i+6)));await p.screenshot({path:new URL(`sheet-${i/6+1}.png`,out).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true});}
  writeFileSync(new URL('gallery.html',out),'<meta charset="utf-8"><title>Synera · перевірка вигляду</title><style>body{font:16px system-ui;background:#eee}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}img{width:100%;max-width:390px}figure{margin:0}figcaption{overflow-wrap:anywhere}</style><h1>Synera · усі скриншоти</h1><main>'+files.map(f=>`<figure><a href="${f}"><img loading="lazy" src="${f}"></a><figcaption>${f}</figcaption></figure>`).join('')+'</main>');
  await browser.close();console.log(`Gallery: ${files.length} screenshots`);process.exit(0);
}
const results=[],errors=[];
const check=(name,details={})=>{results.push({name,...details});console.log('PASS',name);};
const contrast=(a,b)=>{const lum=s=>{const c=s.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const ctx=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await ctx.newPage();page.on('pageerror',e=>errors.push(String(e)));
const posts=[];page.on('request',r=>{if(r.method()!=='GET')posts.push(r.url());});
const open=async()=>{if(!await page.locator('.header-preferences').evaluate(e=>e.open))await page.locator('.header-preferences>summary').click();};
const close=async()=>{if(await page.locator('.header-preferences').evaluate(e=>e.open))await page.locator('.header-preferences>summary').click();};
const noScroll=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
try {
  await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('button[data-personal-accent="by-look"]').waitFor({state:'attached'});
  assert.equal(await page.locator('html').getAttribute('data-synera-style'),'atelier');
  assert.equal(await page.locator('.tour-panel').isVisible(),false);
  await page.evaluate(()=>{document.querySelector('[name="offers"]').value='Fictional unchanged draft';});
  for(const style of ['atelier','night','synera'])for(const palette of PALETTES) {
    await open();await page.locator('#style-preset').selectOption(style);
    await page.locator(`button[data-personal-accent="${palette.id}"]`).click();await close();
    await page.waitForFunction(([accent])=>document.documentElement.dataset.personalAccent===accent,[palette.id]);
    await noScroll();
    const expected=palette[style==='atelier'?'light':'dark'];
    const rgb=hex=>'rgb('+hex.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')+')';
    await page.waitForFunction(([bg,fg])=>{const s=getComputedStyle(document.querySelector('#prepare-profile'));return s.backgroundColor===bg&&s.color===fg;},[rgb(expected['--accent']),rgb(expected['--on-accent'])]);
    const actual=await page.locator('#prepare-profile').evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,color:s.color,height:e.getBoundingClientRect().height};});
    assert.equal(actual.background,rgb(expected['--accent']));assert.equal(actual.color,rgb(expected['--on-accent']));
    await page.screenshot({path:new URL(`accent-${style}-${palette.id}.png`,out).pathname.replace(/^\/([A-Z]:)/,'$1')});
    check(`palette ${style}/${palette.id}`,actual);
  }
  await open();await page.locator('.adaptive-sizes>summary').click();
  for(const [density,min] of [['compact',44],['comfortable',48],['large',56]]) {
    await page.locator('[data-adaptive-density]').selectOption(density);
    const height=await page.locator('#prepare-profile').evaluate(e=>e.getBoundingClientRect().height);assert.ok(height>=min);
    const sample=await page.locator('html').evaluate(e=>getComputedStyle(e).getPropertyValue('--adaptive-desktop-detail-panel-preferred-width-px'));
    check(`density ${density}`,{height,panelWidth:sample.trim()});
  }
  await page.screenshot({path:new URL('preferences-large.png',out).pathname.replace(/^\/([A-Z]:)/,'$1')});
  for(const button of await page.locator('.adaptive-settings button:visible:not(:disabled)').all()) {
    const colors=await button.evaluate(e=>{const s=getComputedStyle(e);return [s.color,s.backgroundColor];});
    assert.ok(contrast(...colors)>=4.5,`settings button contrast: ${colors.join(' on ')}`);
  }
  await close();
  assert.equal(await page.locator('[name="offers"]').inputValue(),'Fictional unchanged draft');check('preferences preserve draft');
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('html').getAttribute('data-density'),'large');check('local preference survives reload');
  await open();await page.locator('#site-language').selectOption('de');
  await page.getByRole('heading',{name:'Dein Design',exact:true}).waitFor();
  assert.equal(await page.locator('button[data-personal-accent="ruby"]').textContent(),'Rubin');
  await page.locator('#site-language').selectOption('en');await page.getByRole('heading',{name:'Your appearance',exact:true}).waitFor();
  await page.locator('#site-language').selectOption('uk');await page.getByRole('heading',{name:'Особистий вигляд',exact:true}).waitFor();check('uk/de/en live controls');
  await page.locator('button[data-personal-accent="gold"]').focus();await page.locator('[data-adaptive-hint="appearance"]').waitFor();
  assert.equal(await page.locator('[data-adaptive-hint]').count(),1);
  await page.locator('[data-adaptive-hint]').scrollIntoViewIfNeeded();
  await page.screenshot({path:new URL('hint-appearance.png',out).pathname.replace(/^\/([A-Z]:)/,'$1')});
  await page.locator('[data-adaptive-hint] button').first().click();
  await page.locator('button[data-personal-accent="ruby"]').focus();assert.equal(await page.locator('[data-adaptive-hint]').count(),0);
  await close();await open();await page.locator('#tour-start').click();await page.locator('.tour-panel').waitFor();
  assert.equal(await page.locator('[data-adaptive-hint]').count(),0);await page.keyboard.press('Escape');check('one hint, permanent dismiss, tour exclusion');
  await open();await page.locator('.adaptive-sizes>summary').click();
  // Manual scale and reflow: actual 320 CSS-pixel layout with 200% text.
  while(!await page.getByRole('button',{name:'Збільшити текст тут',exact:true}).isDisabled())await page.getByRole('button',{name:'Збільшити текст тут',exact:true}).click();
  await close();await page.setViewportSize({width:320,height:844});await noScroll();
  await page.screenshot({path:new URL('reflow-320-text200.png',out).pathname.replace(/^\/([A-Z]:)/,'$1')});check('320px reflow / 200% text');
  await open();await noScroll();await close();check('320px / 200% text preferences reflow');
  assert.deepEqual(posts,[]);check('preferences send no requests');
  await page.setViewportSize({width:390,height:844});await open();await page.locator('.adaptive-reset>summary').click();
  await page.getByRole('button',{name:'Так, скинути персоналізацію',exact:true}).click();
  assert.equal(await page.locator('html').getAttribute('data-synera-style'),'synera');assert.equal(await page.locator('html').getAttribute('data-personal-accent'),'by-look');
  assert.equal(await page.locator('#site-language').inputValue(),'uk');check('reset Current / by-look / comfortable');
  await ctx.close();
  const denied=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}}));
  const dp=await denied.newPage();dp.on('pageerror',e=>errors.push(String(e)));await dp.goto(base,{waitUntil:'networkidle'});
  await dp.locator('.header-preferences>summary').click();await dp.locator('button[data-personal-accent="rose"]').click();
  assert.equal(await dp.locator('html').getAttribute('data-personal-accent'),'rose');check('storage denial keeps manual controls usable');await denied.close();
  const sessionBlocked=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await sessionBlocked.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('Denied','SecurityError');}}));
  const sp=await sessionBlocked.newPage();sp.on('pageerror',e=>errors.push(String(e)));await sp.goto(base,{waitUntil:'networkidle'});
  await sp.locator('.header-preferences>summary').click();
  assert.equal(await sp.locator('[data-hint-context="adaptive_permission"] input').isDisabled(),true);
  await sp.locator('button[data-personal-accent="gold"]').click();assert.equal(await sp.locator('html').getAttribute('data-personal-accent'),'gold');
  check('denied tab storage disables proposals, keeps manual accents');await sessionBlocked.close();

  // An eligible proposal is a synthetic local fixture, never forged user consent.
  const proposal=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await proposal.addInitScript(()=>{
    const date=offset=>{const d=new Date();d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
    if(!localStorage.getItem('synera.adaptive.preferences.v1'))localStorage.setItem('synera.adaptive.preferences.v1',JSON.stringify({version:1,density:'comfortable',accent:'by-look',textScale:1,hints:false,adaptation:{enabled:true,consentVersion:1,lastProposal:null,declined:[],days:[{date:date(-1),sessions:2,enlarge:2,enlargeSessions:1},{date:date(0),sessions:1,enlarge:1,enlargeSessions:1}]}}));
  });
  const pp=await proposal.newPage();pp.on('pageerror',e=>errors.push(String(e)));await pp.goto(base,{waitUntil:'networkidle'});
  await pp.locator('.site-brand').focus();await pp.locator('h1').click();await pp.locator('.adaptive-proposal').waitFor();
  assert.equal(await pp.locator('html').getAttribute('data-density'),'comfortable');
  await pp.getByRole('button',{name:'Переглянути',exact:true}).click();await pp.locator('dialog[open]').waitFor();
  assert.equal(await pp.locator('html').getAttribute('data-density'),'comfortable');
  for(const button of await pp.locator('dialog button').all()) {
    const colors=await button.evaluate(e=>{const s=getComputedStyle(e);return [s.color,s.backgroundColor];});
    assert.ok(contrast(...colors)>=4.5,`preview button contrast: ${colors.join(' on ')}`);
  }
  await pp.screenshot({path:new URL('proposal-preview.png',out).pathname.replace(/^\/([A-Z]:)/,'$1')});
  await pp.locator('dialog').getByRole('button',{name:'Ні, залишити',exact:true}).click();assert.equal(await pp.locator('html').getAttribute('data-density'),'comfortable');
  const sessions=await pp.evaluate(()=>JSON.parse(localStorage.getItem('synera.adaptive.preferences.v1')).adaptation.days.reduce((n,d)=>n+d.sessions,0));
  await pp.reload({waitUntil:'networkidle'});await pp.locator('h1').click();assert.equal(await pp.locator('.adaptive-proposal').count(),0);
  assert.equal(await pp.evaluate(()=>JSON.parse(localStorage.getItem('synera.adaptive.preferences.v1')).adaptation.days.reduce((n,d)=>n+d.sessions,0)),sessions,'reload must not fabricate a session');
  assert.ok(await pp.evaluate(()=>JSON.parse(localStorage.getItem('synera.adaptive.preferences.v1')).adaptation.declined.includes('large')));check('proposal preview / decline / reload');
  await pp.evaluate(()=>{const key='synera.adaptive.preferences.v1',s=JSON.parse(localStorage.getItem(key));s.adaptation.declined=[];s.adaptation.lastProposal=null;localStorage.setItem(key,JSON.stringify(s));});
  await pp.reload({waitUntil:'networkidle'});await pp.locator('h1').click();
  await pp.getByRole('button',{name:'Переглянути',exact:true}).click();await pp.getByRole('button',{name:'Так, застосувати',exact:true}).click();
  assert.equal(await pp.locator('html').getAttribute('data-density'),'large');
  await pp.locator('.header-preferences>summary').click();await pp.locator('[data-adaptive-undo]').click();
  assert.equal(await pp.locator('html').getAttribute('data-density'),'comfortable');check('confirmed proposal / one-click undo');
  await proposal.close();assert.deepEqual(errors,[]);check('no page errors');
} finally {
  await browser.close();writeFileSync(new URL('../docs/adaptive-20261029/browser.json',import.meta.url),JSON.stringify({results,errors},null,2));
}
