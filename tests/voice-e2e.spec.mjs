import { test, expect, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
let server, base;
test.beforeAll(async () => {
  server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore','pipe','pipe'] });
  base = await new Promise((resolve, reject) => { let log = ''; const timer = setTimeout(() => reject(Error(log || 'Server timeout')), 30000); server.stdout.on('data', c => { log += c; const m = log.match(/http:\/\/127\.0\.0\.1:\d+/); if (m) { clearTimeout(timer); resolve(m[0]); } }); server.on('error', reject); });
});
async function mockSpeech(page) {
  await page.addInitScript(() => {
    window.speechMock = { instances:[], starts:0, stops:0, aborts:0 };
    window.SpeechRecognition = class {
      constructor() { speechMock.instances.push(this); }
      start() { speechMock.starts++; this.onstart?.(); }
      stop() { speechMock.stops++; }
      abort() { speechMock.aborts++; }
    };
    speechMock.emit = (items, which = speechMock.instances.length - 1) => {
      const results = items.map(([transcript,isFinal]) => Object.assign([{ transcript }],{ isFinal }));
      speechMock.instances[which].onresult?.({ results, resultIndex:0 });
    };
  });
}
const toolsFor = (page, id) => page.locator(`[data-voice-for="${id}"]`);
async function allow(page, remember = false) {
  if (remember) await page.locator('#voice-notice-remember').check();
  await page.locator('#voice-notice .actions button').first().click();
}
test('specific notice precedes capture; interim, stop tail and undo never send or duplicate words', async ({ page }) => {
  const writes = []; page.on('request',r => { if (r.method() !== 'GET') writes.push(r.url()); });
  await mockSpeech(page); await ready(page);
  const bar = toolsFor(page,'capture-home'), raw = page.locator('#capture-home');
  await raw.fill('Мій текст.'); await raw.evaluate(e => e.setSelectionRange(e.value.length,e.value.length));
  await bar.locator('[data-voice-mic]').click();
  await expect(page.locator('#voice-notice')).toBeVisible(); expect(await page.evaluate(()=>speechMock.starts)).toBe(0);
  await expect(page.locator('#voice-notice-text')).toContainText('Google');
  await page.locator('#voice-notice .actions button').last().click(); expect(await page.evaluate(()=>speechMock.starts)).toBe(0);
  await bar.locator('[data-voice-mic]').click(); await allow(page,true);
  await page.evaluate(()=>speechMock.emit([['Можу креслити',false]]));
  await expect(bar.locator('output')).toHaveText('Можу креслити'); await expect(raw).toHaveValue('Мій текст.');
  await page.evaluate(()=>speechMock.emit([['Можу креслити.',true],['Шукаю',false]]));
  await page.evaluate(()=>speechMock.emit([['Можу креслити.',true],['Шукаю фото.',true]]));
  await expect(raw).toHaveValue('Мій текст. Можу креслити. Шукаю фото.');
  await bar.locator('[data-voice-mic]').click(); expect(await page.evaluate(()=>speechMock.stops)).toBe(1);
  await page.evaluate(()=>{ speechMock.emit([['Можу креслити.',true],['Шукаю фото.',true],['Мета: тест.',true]]); speechMock.instances.at(-1).onend(); });
  await expect(raw).toHaveValue('Мій текст. Можу креслити. Шукаю фото. Мета: тест.');
  await bar.locator('[data-voice-undo]').click(); await expect(raw).toHaveValue('Мій текст. Можу креслити. Шукаю фото.');
  expect(writes).toEqual([]);
  await bar.locator('[data-voice-mic]').click(); await expect(page.locator('#voice-notice')).not.toBeVisible();
  expect(await page.evaluate(()=>speechMock.starts)).toBe(2);
});
test('missing recognition API uses keyboard hint and never requests microphone access', async ({ page }) => {
  await page.addInitScript(()=>{ Object.defineProperty(window,'SpeechRecognition',{ value:undefined }); Object.defineProperty(window,'webkitSpeechRecognition',{ value:undefined }); });
  await ready(page); const bar = toolsFor(page,'capture-home'); await bar.locator('[data-voice-mic]').click();
  await expect(bar.locator('output')).toHaveText('Утримуй мікрофон на клавіатурі');
  await expect(page.locator('#capture-home')).toBeFocused(); await expect(page.locator('#voice-notice')).toHaveCount(0);
});

test('an enhanced dynamic text field has a visible associated label', async ({ page }) => {
  await ready(page);
  await page.evaluate(()=>{
    const input=document.createElement('input'); input.type='text'; input.placeholder='Demo query'; document.querySelector('main').prepend(input);
  });
  const input=page.getByRole('textbox',{name:'Demo query',exact:true});
  await expect(input).toBeVisible();
  await expect.poll(()=>input.evaluate(e=>e.labels.length>0 && [...e.labels].some(l=>l.checkVisibility()))).toBe(true);
});
test('permission errors preserve text and late results cannot edit after revocation or manual typing', async ({ page }) => {
  await mockSpeech(page); await ready(page); const bar = toolsFor(page,'capture-home'), raw = page.locator('#capture-home');
  await raw.fill('Мої слова'); await bar.locator('[data-voice-mic]').click(); await allow(page,true);
  await page.evaluate(()=>speechMock.instances[0].onerror({ error:'not-allowed' }));
  await expect(bar.locator('output')).toContainText('недоступне');
  await page.evaluate(()=>speechMock.emit([['пізній текст',true]],0)); await expect(raw).toHaveValue('Мої слова');
  await bar.locator('[data-voice-mic]').click(); await raw.fill('Виправлено вручну');
  await page.evaluate(()=>speechMock.emit([['інший пізній текст',true]])); await expect(raw).toHaveValue('Виправлено вручну');
  await bar.locator('[data-voice-mic]').click();
  await page.evaluate(()=>window.dispatchEvent(new Event('synera:before-device-erase')));
  await page.evaluate(()=>speechMock.emit([['Після стирання',true]])); await expect(raw).toHaveValue('');
});
test('dictation defaults to UI language, one tap changes it, UI change revokes current capture', async ({ page }) => {
  await mockSpeech(page); await ready(page,'/?lang=de'); const bar=toolsFor(page,'capture-home');
  await expect(page.locator('html')).toHaveAttribute('lang','de');
  await bar.locator('[data-voice-mic]').click(); await allow(page,true);
  expect(await page.evaluate(()=>speechMock.instances.at(-1).lang)).toBe('de-CH');
  await bar.locator('[data-voice-lang=en]').click();
  await bar.locator('[data-voice-mic]').click(); expect(await page.evaluate(()=>speechMock.instances.at(-1).lang)).toBe('en-GB');
  await page.locator('.header-preferences > summary').first().click(); await page.locator('#site-language').selectOption('uk');
  await expect(bar.locator('[data-voice-lang=uk]')).toHaveAttribute('aria-pressed','true');
  await expect(bar.locator('[data-voice-mic]')).toHaveAttribute('aria-pressed','false');
});
test('quick capture preserves source, previews editable fields and makes no server write', async ({ page }) => {
  const writes=[]; page.on('request',r=>{ if(r.method()!=='GET')writes.push(r.url()); }); await ready(page);
  const card=page.locator('[data-quick-capture=home]'), raw=page.locator('#capture-home');
  await raw.fill('Demo. Можу зробити фото. Шукаю сайт. Мета: два клієнти.');
  await card.locator('button[data-voice-copy=review]').click();
  await expect(card.locator('[data-capture-field=offers]')).toHaveValue('Можу зробити фото.');
  await expect(card).toContainText('Demo.');
  await card.locator('[data-capture-field=seeks]').fill('Шукаю простий сайт.');
  await card.locator('[data-capture-apply]').click();
  await expect(page.locator('#profile-form [name=offers]')).toHaveValue('Можу зробити фото.');
  await expect(page.locator('#profile-form [name=seeks]')).toHaveValue('Шукаю простий сайт.');
  await expect(page.locator('#profile-form [name=goal]')).toHaveValue('Мета: два клієнти.');
  await page.reload(); await expect(raw).toHaveValue('Demo. Можу зробити фото. Шукаю сайт. Мета: два клієнти.');
  await page.locator('#prepare-profile').click(); await expect(page.locator('#profile-form [name=seeks]')).toHaveValue('Шукаю простий сайт.');
  await expect(page.locator('#profile-form [name=is_discoverable]')).not.toBeChecked(); expect(writes).toEqual([]);
});
test('oversize capture remains complete and requires correction before application', async ({ page }) => {
  await ready(page); const card=page.locator('[data-quick-capture=home]');
  await page.locator('#capture-home').fill('Можу '+ 'довгий текст '.repeat(40)); await card.locator('button[data-voice-copy=review]').click();
  await expect(card.locator('[data-capture-field=offers]')).toHaveValue('Можу '+ 'довгий текст '.repeat(40).trim());
  await card.locator('[data-capture-apply]').click(); await expect(card.locator('[role=status]')).toContainText('не обрізано');
  await expect(page.locator('#workspace')).toBeHidden();
});
test('journal note and composer draft restore; Enter inserts newline and never sends', async ({ page }) => {
  await ready(page,'/simulation.html?lang=uk'); await page.locator('[data-view=join]').click();
  await page.locator('[name=name]').fill('Demo'); await page.locator('[name=offers]').fill('Фото'); await page.locator('[name=seeks]').fill('Сайт'); await page.locator('#visitor-start').click();
  const text=page.locator('#visitor-text'); await text.fill('Перша думка'); await text.press('End'); await text.press('Enter'); await text.press('a');
  await expect(text).toHaveValue('Перша думка\na');
  await page.reload(); await page.locator('[data-view=join]').click(); await expect(text).toHaveValue('Перша думка\na');
  await page.locator('[data-view=journal]').click(); await page.locator('#journal-note').fill('Моя точна нотатка.');
  await page.reload(); await page.locator('[data-view=journal]').click(); await expect(page.locator('#journal-note')).toHaveValue('Моя точна нотатка.');
  await page.locator('[data-voice-journal] button[type=submit]').click(); await expect(page.locator('#journal-events')).toContainText('Моя точна нотатка.');
  const note=await page.evaluate(()=>JSON.parse(localStorage.getItem('synera.journal.v1')).findLast(e=>e.kind==='note'));
  expect(note.text).toBe('Моя точна нотатка.'); expect(note.data.localOnly).toBe(true);
});
test('privacy reset restores notice and new device/context never inherits the old choice', async ({ page, browser }) => {
  await mockSpeech(page); await ready(page); await toolsFor(page,'capture-home').locator('[data-voice-mic]').click(); await allow(page,true);
  await page.goto(base+'/privacy.html'); await expect(page.locator('#privacy-notice')).toContainText('Google');
  await page.locator('#voice-reset-notice').click(); await page.goto(base);
  await toolsFor(page,'capture-home').locator('[data-voice-mic]').click(); await expect(page.locator('#voice-notice')).toBeVisible();
  const context=await browser.newContext(); try { const other=await context.newPage(); await mockSpeech(other); await ready(other); await toolsFor(other,'capture-home').locator('[data-voice-mic]').click(); await expect(other.locator('#voice-notice')).toBeVisible(); } finally { await context.close(); }
});
for (const device of ['iPhone 13','Pixel 7']) test(`phone voice UI ${device}: 44px controls, reduced viewport composer, screenshots and a11y`, async ({ browser }) => {
  await fs.mkdir('docs/voice-20261030',{recursive:true});
  const context=await browser.newContext({ ...devices[device], serviceWorkers:'block', reducedMotion:'reduce' });
  try {
    const page=await context.newPage(); await mockSpeech(page); await ready(page);
    await page.locator('[data-quick-capture=home]').scrollIntoViewIfNeeded();
    await page.screenshot({ path:`docs/voice-20261030/${device.replaceAll(' ','-')}-capture.png` });
    const bad=await page.locator('.quick-capture').first().locator('button:visible').evaluateAll(bs=>bs.filter(b=>b.getBoundingClientRect().width<44||b.getBoundingClientRect().height<44).map(b=>b.textContent)); expect(bad).toEqual([]);
    const axe=await new AxeBuilder({page}).include('.quick-capture').analyze(); expect(axe.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
    await page.goto(base+'/simulation.html?lang=uk'); await page.locator('[data-view=join]').click();
    await page.locator('[name=name]').fill('Demo'); await page.locator('[name=offers]').fill('Фото'); await page.locator('[name=seeks]').fill('Сайт'); await page.locator('#visitor-start').click();
    await page.setViewportSize({ width:devices[device].viewport.width,height:500 });
    await page.locator('#visitor-text').fill('Думка, яку можна дописати.');
    await page.locator('#visitor-composer').evaluate(e=>e.scrollIntoView({block:'end'}));
    const box=await page.locator('#visitor-composer').boundingBox(); expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y+box.height).toBeLessThanOrEqual(501);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const smallComposerControls=await page.locator('#visitor-composer button:visible').evaluateAll(bs=>bs.filter(b=>b.getBoundingClientRect().width<44||b.getBoundingClientRect().height<44).map(b=>b.textContent));
    expect(smallComposerControls).toEqual([]);
    const composerAxe=await new AxeBuilder({page}).include('#visitor-composer').analyze();
    expect(composerAxe.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
    await page.screenshot({ path:`docs/voice-20261030/${device.replaceAll(' ','-')}-composer.png` });
  } finally { await context.close(); }
});
test.afterAll(() => { if (server?.exitCode === null) server.kill(); });
async function ready(page, path = '/') {
  await page.addInitScript(() => localStorage.setItem('synera.first-user-tour.v1', 'done'));
  await page.goto(base + path);
}

for (const lang of ['uk','de','en']) test(`V1 readonly revokes ongoing dictation ${lang}`, async ({page}) => {
  await mockSpeech(page); await ready(page, `/?lang=${lang}`);
  const raw=page.locator('#capture-home'), bar=toolsFor(page,'capture-home');
  await raw.fill('Demo original'); await bar.locator('[data-voice-mic]').click(); await allow(page);
  // The callback may arrive before MutationObserver reconciles the toolbar.
  await raw.evaluate(e=>{e.readOnly=true; speechMock.emit([['late words',true]]);});
  await expect(raw).toHaveValue('Demo original');
  await expect(bar.locator('[data-voice-mic]')).toBeDisabled();
});

for (const device of ['iPhone 13','Pixel 7']) for (const lang of ['uk','de','en']) test(`V4 overlay keyboard ${device} ${lang}: focused composer stays visible and resets on blur`, async ({browser}) => {
  const context=await browser.newContext({...devices[device],serviceWorkers:'block'});
  try {
    const page=await context.newPage(); await ready(page,`/simulation.html?lang=${lang}`);
    await page.locator('[data-view=join]').click();
    for (const [name,text] of Object.entries({name:'Demo',offers:'Photos',seeks:'Website'})) await page.locator(`#visitor-card [name=${name}]`).fill(text);
    await page.locator('#visitor-start').click();
    await page.locator('#visitor-text').fill('Demo unsent draft');
    await page.locator('#visitor-composer').evaluate(e=>e.scrollIntoView({block:'end'}));
    await page.evaluate(()=>{
      Object.defineProperty(visualViewport,'height',{configurable:true,value:500});
      Object.defineProperty(visualViewport,'offsetTop',{configurable:true,value:0});
      visualViewport.dispatchEvent(new Event('resize'));
    });
    await expect.poll(()=>page.locator('#visitor-composer').evaluate(e=>e.getBoundingClientRect().bottom)).toBeLessThanOrEqual(501);
    await expect(page.locator('#visitor-text')).toHaveValue('Demo unsent draft');
    await page.locator('#visitor-text').evaluate(e=>e.blur());
    await expect.poll(()=>page.locator('#visitor-composer').evaluate(e=>parseFloat(getComputedStyle(e).bottom))).toBe(0);
  } finally {await context.close();}
});
test('home defers the optional tour and memory parser until needed; tour still opens', async ({ page }) => {
  const modules=[]; page.on('request',r=>{ if(r.url().endsWith('.mjs')) modules.push(new URL(r.url()).pathname); });
  await ready(page); await page.waitForLoadState('networkidle');
  expect(modules).not.toContain('/onboarding-tour.mjs'); expect(modules).not.toContain('/profile-import.mjs');
  await page.locator('.header-preferences > summary').first().click(); await page.locator('#tour-start').click();
  await expect(page.locator('.tour-panel')).toBeVisible(); await expect(page.locator('.tour-panel h2')).not.toBeEmpty();
});

test('home renders its Demo notice while voice enhancement is still loading', async ({ page }) => {
  let release;
  const held = new Promise(resolve=>{ release=resolve; });
  await page.route('**/voice-ui.mjs', async route=>{ await held; await route.continue(); });
  const requested=page.waitForRequest('**/voice-ui.mjs');
  try {
    await page.goto(base,{waitUntil:'commit'}); await requested;
    await expect(page.locator('[data-demo-marker]')).toBeVisible({timeout:1500});
    await expect(page.locator('#capture-home')).toBeVisible({timeout:1500});
    await page.locator('#capture-home').fill('Можу дописати думку до завантаження мікрофона.');
    await expect.poll(()=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('synera.voice.draft.v1:capture:home')||'null')?.text)).toBe('Можу дописати думку до завантаження мікрофона.');
  } finally { release(); }
  await expect(page.locator('#capture-home')).toBeVisible();
  await expect(page.locator('#capture-home')).toHaveValue('Можу дописати думку до завантаження мікрофона.');
  await expect(toolsFor(page,'capture-home').locator('[data-voice-mic]')).toBeVisible();
  await expect(page.locator('#capture-home')).toBeFocused();
});
test('profile fields offer dictation and restore the edited words after reload', async ({ page }) => {
  await ready(page); await page.locator('#prepare-profile').click();
  const field = page.locator('[name="offers"]');
  await expect(page.locator(`[data-voice-for="${await field.getAttribute('id') || 'profile-offers'}"] [data-voice-mic]`)).toBeVisible();
  await field.fill('Можу зробити сайт із твоїх слів.');
  await page.reload(); await page.locator('#prepare-profile').click();
  await expect(field).toHaveValue('Можу зробити сайт із твоїх слів.');
});

test('corrected capture preview survives reload without replacing the source paragraph', async ({ page }) => {
  await ready(page);
  const card = page.locator('[data-quick-capture=home]');
  await page.locator('#capture-home').fill('Можу робити фото. Шукаю сайт.');
  await card.locator('button[data-voice-copy=review]').click();
  await card.locator('[data-capture-field=seeks]').fill('Шукаю сайт за два тижні.');
  await page.reload();
  await expect(card.locator('[data-capture-field=seeks]')).toBeVisible();
  await expect(card.locator('[data-capture-field=seeks]')).toHaveValue('Шукаю сайт за два тижні.');
  await expect(page.locator('#capture-home')).toHaveValue('Можу робити фото. Шукаю сайт.');
  await card.locator('[data-capture-apply]').click();
  await expect(page.locator('#profile-form [name=seeks]')).toHaveValue('Шукаю сайт за два тижні.');
});

test('unsent simulation profile restores every text field before a session is started', async ({ page }) => {
  await ready(page, '/simulation.html?lang=uk');
  await page.locator('[data-view=join]').click();
  for (const [name, text] of Object.entries({ name:'Demo', offers:'Можу фото.', seeks:'Шукаю сайт.' })) {
    await page.locator(`#visitor-card [name=${name}]`).fill(text);
  }
  await page.reload(); await page.locator('[data-view=join]').click();
  await expect(page.locator('#visitor-card [name=name]')).toHaveValue('Demo');
  await expect(page.locator('#visitor-card [name=offers]')).toHaveValue('Можу фото.');
  await expect(page.locator('#visitor-card [name=seeks]')).toHaveValue('Шукаю сайт.');
  await expect(page.locator('#visitor-chat')).toBeHidden();
  await page.locator('[data-view=journal]').click();
  page.once('dialog',d=>d.accept()); await page.locator('#journal-erase').click();
  await page.reload(); await page.locator('[data-view=join]').click();
  await expect(page.locator('#visitor-card [name=name]')).toHaveValue('');
  await expect(page.locator('#visitor-card [name=offers]')).toHaveValue('');
  await expect(page.locator('#visitor-card [name=seeks]')).toHaveValue('');
});

for (const [lang, offer, seek] of [
  ['uk','Можу зробити фото.','Шукаю сайт.'],
  ['de','Ich kann Fotos machen.','Ich suche eine Webseite.'],
  ['en','I can take photos.','I need a website.'],
]) test(`voice and capture use ${lang}; search and profile restore; hidden fields reject late dictation`, async ({ page }) => {
  await mockSpeech(page); await ready(page, `/?lang=${lang}`);
  const card=page.locator('[data-quick-capture=home]');
  await page.locator('#capture-home').fill(`${offer} ${seek}`);
  await card.locator('button[data-voice-copy=review]').click();
  await card.locator('[data-capture-apply]').click();
  const field=page.locator('#profile-form [name=offers]'), bar=toolsFor(page,'profile-offers');
  await expect(field).toHaveValue(offer);
  await bar.locator('[data-voice-mic]').click(); await allow(page);
  expect(await page.evaluate(()=>speechMock.instances.at(-1).lang)).toBe({uk:'uk-UA',de:'de-CH',en:'en-GB'}[lang]);
  await page.locator('.header-preferences > summary').first().click();
  await page.locator('#back-login').click();
  await page.evaluate(()=>speechMock.emit([['late text',true]]));
  await page.locator('#prepare-profile').click(); await expect(field).toHaveValue(offer);
  // Search is a signed-in surface. Exercise its local draft binding without fabricating account access.
  await page.locator('#people-search').evaluate(e=>{ e.value='Demo query'; e.dispatchEvent(new Event('input',{bubbles:true})); });
  await page.reload(); await page.locator('#prepare-profile').click();
  await expect(field).toHaveValue(offer);
  await expect(page.locator('#people-search')).toHaveValue('Demo query');
});

test('switching views revokes dictation without rewriting unchanged microphone labels', async ({ page }) => {
  await mockSpeech(page); await ready(page,'/simulation.html?lang=uk');
  await page.locator('[data-view=join]').click();
  const input=page.locator('#visitor-card [name=offers]');
  const bar=toolsFor(page,await input.getAttribute('id'));
  await bar.locator('[data-voice-mic]').click(); await allow(page);
  await page.evaluate(()=>{
    window.unchangedVoiceLabels=0;
    for (const b of document.querySelectorAll('[data-voice-undo]')) new MutationObserver(records=>{ unchangedVoiceLabels+=records.length; }).observe(b,{childList:true});
  });
  await page.locator('[data-view=journal]').click();
  await expect(bar.locator('[data-voice-mic]')).toHaveAttribute('aria-pressed','false');
  await page.evaluate(()=>speechMock.emit([['must be rejected',true]]));
  await expect(input).toHaveValue('');
  expect(await page.evaluate(()=>unchangedVoiceLabels)).toBe(0);
});

test('prelaid input panels stay outside accessibility and keyboard navigation; journal prints from the feed', async ({ page }) => {
  await ready(page,'/simulation.html?lang=uk');
  await expect(page.locator('#visitor-card')).toBeHidden();
  await expect(page.locator('#living-journal')).toBeHidden();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await page.keyboard.press('Tab');
  expect(await page.evaluate(()=>Boolean(document.activeElement.closest('#living-join,#living-journal')))).toBe(false);
  await page.emulateMedia({media:'print'});
  await expect(page.locator('#living-journal')).toBeVisible();
  await expect(page.locator('#living-join')).toBeHidden();
});
