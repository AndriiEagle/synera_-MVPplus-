import { test, expect, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
let server, origin;
test.beforeAll(async () => {
  server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { cwd: process.cwd(), env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore','pipe','pipe'] });
  origin = await new Promise((resolve,reject) => {
    let out = ''; const timer = setTimeout(() => reject(Error(out)), 30000);
    server.stdout.on('data', b => { out += b; const m = out.match(/http:\/\/127\.0\.0\.1:\d+/); if (m) { clearTimeout(timer); resolve(m[0]); } });
    server.stderr.on('data', b => { out += b; }); server.on('exit', code => { clearTimeout(timer); reject(Error(`server ${code}: ${out}`)); });
  });
});
test.afterAll(() => { server?.kill(); });
const open = async (page, lang = 'en') => { await page.goto(`${origin}/simulation.html?lang=${lang}`); await expect(page.locator('#living-title')).toBeVisible(); };
async function join(page) {
  await page.locator('[data-view=join]').click();
  await page.locator('[name=name]').fill('Alex'); await page.locator('[name=offers]').fill('Customer interviews'); await page.locator('[name=seeks]').fill('Two page sketches');
  await page.locator('#visitor-start').click();
}
test('A1: home entry and real pacing, pause, manual reduced-motion, complete pairs/triads', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('synera.first-user-tour.v1','done'));
  await page.goto(origin);
  await expect(page.locator('#demo-journey a[href="/simulation.html"]')).toBeVisible();
  await expect(page.locator('.more-modes a[href="/simulation.html"]')).toHaveCount(1);
  await page.locator('#demo-journey a[href="/simulation.html"]').click();
  await expect(page.locator('.living-person')).toHaveCount(10);
  await page.clock.install();
  const before = await page.locator('#living-threads .living-bubble').count();
  await page.clock.runFor(3300);
  await expect(page.locator('#living-threads .living-bubble')).toHaveCount(before+1);
  await page.locator('#feed-pause').click(); await page.clock.runFor(10000);
  await expect(page.locator('#living-threads .living-bubble')).toHaveCount(before+1);
  await page.emulateMedia({ reducedMotion:'reduce' });
  await expect(page.locator('#motion-note')).not.toBeEmpty();
  while (await page.locator('#feed-next').isEnabled()) await page.locator('#feed-next').click();
  await expect(page.locator('.living-threads article')).toHaveCount(4);
  await expect(page.locator('#living-threads .living-bubble')).toHaveCount(30);
  for (const thread of await page.locator('.living-threads article').all()) await expect(thread).toContainText('Demo');
});
test('A2/A3: chips, typed counter-offer, independent confirmations, journal export, reload, erase', async ({ page }) => {
  const writes=[]; page.on('request', r => { if(r.method()!=='GET') writes.push(r.url()); });
  await page.emulateMedia({ reducedMotion:'reduce' }); await open(page); await join(page);
  await page.getByRole('button',{ name:'What will I receive?',exact:true }).click();
  await expect(page.locator('#visitor-wait')).toBeEmpty();
  await expect(page.locator('#visitor-approvals')).toContainText('not agreed yet');
  await page.locator('#visitor-text').fill('Yes, but only 10 minutes'); await page.locator('#visitor-send').click();
  await expect(page.locator('#visitor-wait')).toBeEmpty();
  await expect(page.locator('#visitor-terms')).toContainText('Yes, but only 10 minutes');
  await expect(page.locator('#visitor-result')).toBeHidden();
  await page.getByRole('button',{ name:'Yes, I agree',exact:true }).click();
  await expect(page.locator('#visitor-result')).toBeVisible();
  await page.locator('#visitor-result').click();
  await expect(page.locator('#visitor-messages')).toContainText('No real work');
  const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('synera.journal.v1')));
  const approvals = entries.filter(e=>e.data.source==='visitor'&&e.kind==='confirmation');
  expect(approvals.map(e=>e.actor)).toEqual(['visitor','bot-mira']);
  expect(entries.some(e=>e.kind==='consent')).toBe(true);
  expect(entries.every(e=>e.at&&e.kind&&e.actor&&e.text&&e.data)).toBe(true);
  await page.reload(); await page.locator('[data-view=join]').click();
  await expect(page.locator('[name=name]')).toHaveValue('Alex');
  await expect(page.locator('#visitor-messages')).toContainText('No real work');
  await page.locator('[data-view=journal]').click(); await page.locator('#journal-filter').selectOption('visitor');
  const download = page.waitForEvent('download'); await page.locator('#journal-export').click();
  const downloaded = await download; const exported = JSON.parse(await fs.readFile(await downloaded.path(),'utf8'));
  expect(exported.entries.every(e=>e.data.source==='visitor')).toBe(true);
  await page.emulateMedia({ media:'print' }); await expect(page.locator('#living-journal')).toBeVisible(); await expect(page.locator('#living-feed')).toBeHidden(); await page.emulateMedia({ media:'screen' });
  page.once('dialog',d=>d.accept()); await page.locator('#journal-erase').click();
  expect(await page.evaluate(()=>localStorage.getItem('synera.journal.v1'))).toBeNull();
  await expect(page.locator('#journal-events li')).toHaveCount(0); expect(writes).toEqual([]);
});
test('A2: typed decline remains terminal and never creates a meeting', async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' }); await open(page); await join(page);
  await page.locator('#visitor-text').fill('No thanks'); await page.locator('#visitor-send').click();
  await expect(page.locator('#visitor-wait')).toBeEmpty(); await expect(page.locator('#visitor-composer')).toBeHidden();
  const entries=await page.evaluate(()=>JSON.parse(localStorage.getItem('synera.journal.v1')));
  expect(entries.filter(e=>e.data.source==='visitor'&&e.kind==='meeting')).toEqual([]);
});
test('A3: home draft handed over only after explicit local save; journal profile filter', async ({ page }) => {
  await page.addInitScript(()=>localStorage.setItem('synera.first-user-tour.v1','done'));
  await page.goto(origin); await page.locator('#prepare-profile').click();
  await page.locator('#profile-form [name=display_name]').fill('Draft Alex');
  await page.locator('#profile-form [name=offers]').fill('Design'); await page.locator('#profile-form [name=seeks]').fill('Research');
  expect(await page.evaluate(()=>localStorage.getItem('synera.journal.v1'))).toBeNull();
  await page.locator('#draft-journal-save').click(); await open(page); await page.locator('[data-view=join]').click();
  await expect(page.locator('[name=name]')).toHaveValue('Draft Alex');
  await page.locator('[data-view=journal]').click(); await page.locator('#journal-filter').selectOption('profile');
  await expect(page.locator('#journal-events')).toContainText('Draft Alex');
});
test('A3: erasure in another tab cancels pending replies and autoplay without resurrecting the key', async ({ page, context }) => {
  // Install the clock before any application timers exist. Installing it after
  // cancellation can replay pre-install timers and is not an erasure oracle.
  await page.clock.install(); await page.clock.pauseAt(new Date());
  await open(page); await join(page);
  await page.getByRole('button',{name:'Yes, I agree',exact:true}).click();
  const other=await context.newPage(); await other.goto(origin);
  await other.evaluate(()=>localStorage.removeItem('synera.journal.v1'));
  expect(await other.evaluate(()=>localStorage.getItem('synera.journal.v1'))).toBeNull();
  await expect(page.locator('#visitor-chat')).toBeHidden();
  await page.clock.runFor(6000);
  expect(await page.evaluate(()=>localStorage.getItem('synera.journal.v1'))).toBeNull();
  await other.close();
});
test('A1/A2: first home load caches simulation; reload offline still replies with no API', async ({ browser }) => {
  const context=await browser.newContext({ serviceWorkers:'allow' }); const page=await context.newPage();
  try {
    await page.addInitScript(()=>localStorage.setItem('synera.first-user-tour.v1','done')); await page.goto(origin);
    await page.evaluate(()=>navigator.serviceWorker.ready); await page.reload();
    await context.setOffline(true); await page.goto(origin+'/simulation.html');
    await expect(page.locator('#living-title')).toBeVisible(); await join(page);
    await page.getByRole('button',{ name:'Так, погоджуюсь',exact:true }).click();
    await expect(page.locator('#visitor-result')).toBeVisible();
    await page.reload(); await page.locator('[data-view=join]').click(); await expect(page.locator('#visitor-result')).toBeVisible();
    const paths=await page.evaluate(async()=> (await Promise.all((await caches.keys()).map(async k=>(await(await caches.open(k)).keys()).map(r=>new URL(r.url).pathname)))).flat());
    expect(paths.some(p=>p.startsWith('/api/'))).toBe(false);
  } finally { await context.close(); }
});
test('A1/A4: direct simulation visit activates its worker even when every optional portrait is absent', async ({ browser }) => {
  const context=await browser.newContext({serviceWorkers:'allow', reducedMotion:'reduce'});
  try {
    await context.addInitScript(()=>localStorage.setItem('synera.real-journey.language.v1','de'));
    const page=await context.newPage(); await open(page,'de');
    await expect.poll(()=>page.evaluate(async()=>Boolean((await navigator.serviceWorker.getRegistration('/simulation'))?.active)),{timeout:12000}).toBe(true);
    await page.evaluate(()=>navigator.serviceWorker.ready);
    // C1: only canonical public URLs enter the shared offline cache. The chosen
    // language remains in the existing preference; query variants bypass SW.
    await page.evaluate(()=>history.replaceState(null,'',location.pathname));
    await context.setOffline(true); await page.reload();
    await expect(page.locator('#living-title')).toHaveText('Lebendige Simulation');
    await expect(page.locator('.living-person')).toHaveCount(10);
  } finally {await context.close();}
});
for (const lang of ['uk','de','en']) test(`A4/A5: ${lang} labels, portrait fallback, 320–430px and double text`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' }); await open(page,lang);
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/persona-*.webp',r=>r.fulfill({ status:404,body:'' })); await page.reload();
  await expect(page.locator('.living-person .living-avatar img')).toHaveCount(0);
  await expect(page.locator('.living-person .living-avatar span').first()).toBeVisible();
  for(const width of [320,375,390,412,430]) {
    await page.setViewportSize({ width,height:844 });
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  await join(page);
  await page.evaluate(()=>{const nodes=[...document.querySelectorAll('#living-simulation *')].filter(n=>n.checkVisibility()&&(['INPUT','TEXTAREA','SELECT','BUTTON'].includes(n.tagName)||[...n.childNodes].some(c=>c.nodeType===3&&c.textContent.trim()))); const sizes=nodes.map(n=>parseFloat(getComputedStyle(n).fontSize));nodes.forEach((n,i)=>n.style.fontSize=`${sizes[i]*2}px`);});
  await page.setViewportSize({width:320,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect((await page.locator('#visitor-text').boundingBox()).width).toBeGreaterThan(200);
  await page.screenshot({path:`docs/agents-20261029/${lang}-320-text200.png`,fullPage:true});
  await page.locator('#visitor-text').focus(); await page.setViewportSize({width:390,height:420}); await page.locator('#visitor-text').scrollIntoViewIfNeeded();
  const box=await page.locator('#visitor-text').boundingBox(); expect(box.y+box.height).toBeLessThanOrEqual(421);
  expect(errors).toEqual([]);
});
test('A5: iPhone 13 and Pixel 7 emulation screenshots, visible input, no serious axe issues', async ({ browser }) => {
  for (const device of ['iPhone 13','Pixel 7']) {
    const context=await browser.newContext({...devices[device], defaultBrowserType:undefined, serviceWorkers:'block', reducedMotion:'reduce'});
    try {
      const page=await context.newPage(); await open(page);
      await page.screenshot({path:`docs/agents-20261029/${device}-feed.png`,fullPage:true}); await join(page);
      await page.locator('#visitor-text').scrollIntoViewIfNeeded(); await page.screenshot({path:`docs/agents-20261029/${device}-join.png`,fullPage:true});
      const report=await new AxeBuilder({page}).analyze(); expect(report.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
    } finally { await context.close(); }
  }
});
