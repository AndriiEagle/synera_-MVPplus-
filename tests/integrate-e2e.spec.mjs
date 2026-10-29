import { test, expect, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
let child,base;
test.beforeAll(async()=>{
 child=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
 base=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error(out)),30000);child.stdout.on('data',b=>{out+=b;const m=out.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});child.on('error',reject);child.on('exit',code=>{clearTimeout(timer);reject(Error(String(code)));});});
});
test.afterAll(()=>child?.kill());
async function join(page){await page.locator('[data-view=join]').click();for(const [k,v]of Object.entries({name:'Fictional Alex',offers:'Demo design',seeks:'Demo research'}))await page.locator(`[name=${k}]`).fill(v);await page.locator('#visitor-start').click();}
test('I1/I2: simulation notices, full JSON, optional end cleanup and no resurrection of pending reply',async({page})=>{
 await page.clock.install({time:new Date('2026-10-29T20:00:00Z')});await page.clock.pauseAt(new Date('2026-10-29T20:00:01Z'));
 const writes=[];page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
 await page.goto(base+'/simulation.html?lang=en');await expect(page.locator('[data-demo-marker]')).toContainText('fictional');
 await expect(page.locator('footer [data-privacy-link]').first()).toBeVisible();
 await join(page);await expect(page.locator('#visitor-card [data-demo-input-notice]')).toContainText('host');
 await page.getByRole('button',{name:'Yes, I agree',exact:true}).click();
 const get=page.waitForEvent('download');await page.locator('[data-device-download]').click();
 const json=JSON.parse(await fs.readFile(await(await get).path(),'utf8'));
 const rows=JSON.parse(json.localStorage['synera.journal.v1']);expect(rows.some(e=>e.data.profile?.name==='Fictional Alex')).toBe(true);expect(rows.some(e=>e.data.state?.pendingIntent)).toBe(true);
 await page.locator('[data-demo-finish]').click();await expect(page.locator('[data-demo-end]')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('synera.journal.v1'))).not.toBeNull();
 await page.locator('[data-demo-keep]').click();await expect(page.locator('[data-demo-end]')).toBeHidden();
 page.once('dialog',d=>d.dismiss());await page.locator('[data-device-erase]').click();expect(await page.evaluate(()=>localStorage.getItem('synera.journal.v1'))).not.toBeNull();
 page.once('dialog',d=>d.accept());await page.locator('[data-device-erase]').click();await expect(page.locator('[data-device-status]')).toContainText('erased');
 await page.clock.runFor(6000);expect(await page.evaluate(()=>localStorage.getItem('synera.journal.v1'))).toBeNull();await expect(page.locator('#visitor-chat')).toBeHidden();expect(writes).toEqual([]);
});
test('I1/I2: unsaved profile export and erase are direct; cleared memory cannot restore draft',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('synera.first-user-tour.v1','done'));
 await page.goto(base+'/?lang=en');await page.locator('#prepare-profile').click();await page.locator('#profile-form [name=display_name]').fill('Unsaved Fiction');
 await expect(page.locator('#profile-form [data-demo-input-notice]')).toBeVisible();
 const get=page.waitForEvent('download');await page.locator('[data-device-download]').click();const json=JSON.parse(await fs.readFile(await(await get).path(),'utf8'));expect(json.unsavedProfileDraft.display_name).toBe('Unsaved Fiction');
 await page.locator('#draft-journal-save').click();page.once('dialog',d=>d.accept());await page.locator('[data-device-erase]').click();await page.locator('#prepare-profile').click();await expect(page.locator('#profile-form [name=display_name]')).toHaveValue('');
 expect(await page.evaluate(()=>localStorage.getItem('synera.journal.v1'))).toBeNull();
});
test('I1: a fresh load purges old profile/session before UI recovery, and direct simulation links work',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('synera.journal.v1',JSON.stringify([{at:'2000-01-01T00:00:00Z',kind:'profile',actor:'visitor',text:'expired',data:{source:'profile',profile:{name:'Expired Secret'}}}])));
 await page.goto(base+'/simulation.html?lang=de');await page.locator('[data-view=join]').click();await expect(page.locator('[name=name]')).toHaveValue('');
 expect(await page.evaluate(()=>localStorage.getItem('synera.journal.v1'))).not.toContain('Expired Secret');
 await page.locator('.header-preferences summary').click();await page.locator('.header-preferences [data-privacy-link]').click();await expect(page.locator('#privacy-notice')).toContainText('synera.journal.v1');
});
for(const lang of ['de','uk','en'])test(`I4: ${lang} notice checklist, paper-only consent, accessible and one printed page`,async({page})=>{
 const writes=[];page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
 await page.goto(base+'/legal.html?lang='+lang);await expect(page.locator('#legal-documents')).toHaveAttribute('lang',lang);
 const check=JSON.parse(await fs.readFile('docs/integrate-20261029/notice-must-checklist.json','utf8'));
 for(const item of check.items){const section=page.locator(`[data-notice-item=${item.section}]`);await expect(section).toBeVisible();for(const term of item.terms)await expect(section).toContainText(new RegExp(term,'iu'));}
 await expect(page.locator('#draft-impressum')).toContainText('[ADDRESS]');await expect(page.locator('#draft-terms')).toContainText('EXPERT_REQUIRED');
 await page.goto(base+'/pilot-consent.html?lang='+lang);await expect(page.locator('.pilot-paper h1')).toBeVisible();expect(await page.locator('form,input,textarea').count()).toBe(0);
 const axe=await new AxeBuilder({page}).analyze();expect(axe.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
 const pdf=await page.pdf({format:'A4',preferCSSPageSize:true});await fs.mkdir('docs/integrate-20261029/print',{recursive:true});await fs.writeFile(`docs/integrate-20261029/print/pilot-${lang}.pdf`,pdf);
 const pages=pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[];expect(pages.length).toBe(1);expect(writes).toEqual([]);
});
test('I3: direct simulation installs the complete dependency graph and opens legal/consent offline',async({browser})=>{
 const context=await browser.newContext({serviceWorkers:'allow',reducedMotion:'reduce'});
 try{const page=await context.newPage();await page.goto(base+'/simulation.html');await expect.poll(()=>page.evaluate(async()=>Boolean((await navigator.serviceWorker.getRegistration('/simulation'))?.active))).toBe(true);
 await expect.poll(()=>page.evaluate(async()=>Boolean((await navigator.serviceWorker.getRegistration('/'))?.active))).toBe(true);
 await context.setOffline(true);await page.reload();await expect(page.locator('#living-title')).toBeVisible();await join(page);await page.getByRole('button',{name:'Так, погоджуюсь',exact:true}).click();await expect(page.locator('#visitor-result')).toBeVisible();
 // The simulation scope stays narrow; the root shell also makes linked privacy/legal pages usable offline.
 for(const path of ['/privacy.html','/legal.html','/pilot-consent.html','/legal-documents.mjs'])expect(await page.evaluate(p=>caches.match(p).then(Boolean),path)).toBe(true);
 await page.goto(base+'/privacy.html');await expect(page.locator('#privacy-download')).toBeVisible();
 await page.goto(base+'/legal.html');await expect(page.locator('[data-notice-item=controller]')).toBeVisible();
 await page.goto(base+'/pilot-consent.html');await expect(page.locator('.pilot-paper h1')).toBeVisible();
 }finally{await context.close();}
});
test('I6: iPhone 13 and Pixel 7 screenshots of all six requested surfaces',async({browser})=>{
 await fs.mkdir('docs/integrate-20261029/shots',{recursive:true});
 for(const device of ['iPhone 13','Pixel 7']){
  const context=await browser.newContext({...devices[device],defaultBrowserType:'chromium',deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'});
  try{const page=await context.newPage();await page.addInitScript(()=>localStorage.setItem('synera.first-user-tour.v1','done'));
   for(const [name,path]of [['home','/'],['simulation','/simulation.html?lang=uk'],['journal','/simulation.html?lang=uk'],['privacy','/privacy.html?lang=uk'],['legal','/legal.html'],['pilot-consent','/pilot-consent.html']]){
    await page.goto(base+path);if(name==='simulation'||name==='journal'){await join(page);await page.getByRole('button',{name:'Так, погоджуюсь',exact:true}).click();await expect(page.locator('#visitor-result')).toBeVisible();if(name==='journal')await page.locator('[data-view=journal]').click();}
    await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name).toBe(true);
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`docs/integrate-20261029/shots/${device.replaceAll(' ','-')}-${name}.png`,fullPage:true});
   }
  }finally{await context.close();}
 }
});
