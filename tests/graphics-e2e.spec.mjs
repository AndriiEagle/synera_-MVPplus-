import { test, expect, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const out = resolve('docs/graphics-20261029/shots');
const keys = ['mira','leo','nora','felix','ines','sam','tessa','noah','lina','omar'];
let server, base;
test.beforeAll(async () => {
  await mkdir(out, { recursive: true });
  server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore','pipe','pipe'] });
  base = await new Promise((accept, reject) => {
    let log = '';
    const timeout = setTimeout(() => reject(new Error(log)), 30000);
    server.stdout.on('data', chunk => { log += chunk; const match = log.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timeout); accept(match[0]); } });
    server.stderr.on('data', chunk => { log += chunk; });
    server.on('exit', code => { clearTimeout(timeout); reject(new Error(`server ${code}: ${log}`)); });
  });
});
test.afterAll(() => server?.kill());

for (const [name, device] of [['iphone13',devices['iPhone 13']],['pixel7',devices['Pixel 7']]]) {
  test(`${name}: graphics decode, CTA stays above fold, Demo faces remain fictional`, async ({ browser }) => {
    const viewport = name === 'iphone13' ? { width:390, height:844 } : { width:412, height:915 };
    const context = await browser.newContext({ ...device, viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(base);
    const action = page.locator('#prepare-profile');
    await expect(action).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator('html')).toHaveAttribute('data-synera-style','synera');
    const scene = page.locator('.signature-scene img');
    await expect(scene).toHaveAttribute('alt','');
    await expect.poll(() => scene.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
    // A width-descriptor srcset reports density-corrected naturalWidth (342 on iPhone).
    // Decode currentSrc without srcset to check the actual selected raster dimensions.
    expect(await scene.evaluate(async el => { const raster = new Image(); raster.src = el.currentSrc; await raster.decode(); return raster.naturalWidth; })).toBe(1536);
    expect(await scene.evaluate(el => el.width > 0 && el.height > 0 && getComputedStyle(el).animationName === 'none')).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${out}/${name}-home-first.png` });
    await page.screenshot({ path: `${out}/${name}-home-full.png`, fullPage: true });
    await expect(page.locator('#demo-journey .demo-portrait')).toHaveCount(2);
    await expect(page.locator('#demo-journey .demo-face-tag')).toHaveText(['Demo','Demo']);
    await page.locator('#demo-journey').screenshot({ path: `${out}/${name}-home-demo.png` });
    // The original finite draft-only journey still completes without any send.
    for (let i = 0; i < 3; i++) await page.locator('#demo-journey-stage button').click();
    await expect(page.locator('#demo-journey-stage textarea')).toHaveValue(/НЕ ВІДПРАВЛЕНО/);
    await page.goto(`${base}/summit.html`);
    await expect(page.locator('.floating-card img')).toHaveCount(2);
    for (const card of await page.locator('.floating-card').all()) expect(await card.evaluate(card => {
      const portrait=card.querySelector('img'), copy=card.querySelector(':scope > div');
      return portrait.offsetLeft + portrait.offsetWidth <= copy.offsetLeft;
    }), 'portrait must leave the name and role clear').toBe(true);
    await expect(page.locator('#stage .person img')).toHaveCount(2);
    for (const img of await page.locator('.floating-card img, #stage .person img').all()) expect(await img.evaluate(el => el.complete && el.naturalWidth === 320)).toBe(true);
    await page.screenshot({ path: `${out}/${name}-summit-first.png` });
    await page.screenshot({ path: `${out}/${name}-summit-full.png`, fullPage: true });
    await page.locator('.connection-art').screenshot({ path: `${out}/${name}-summit-cards.png` });
    // Asset-in-card QA fixture: simulation rendering belongs to the agents lane.
    // Every served portrait is decoded inside an actual Summit person card.
    for (const key of keys) {
      await page.locator('#stage .person').first().evaluate((card, key) => {
        const image = card.querySelector('img'); image.src = `/persona-${key}.webp`; image.alt = '';
        card.querySelector('b').textContent = `${key} · Demo`;
      }, key);
      await expect.poll(() => page.locator('#stage .person img').first().evaluate(el => el.complete && el.naturalWidth === 320)).toBe(true);
      await page.locator('#stage .person').first().screenshot({ path: `${out}/${name}-portrait-${key}.png` });
    }
    // A same-origin intercepted QA document has no production CSP and no saved app mutation.
    await page.route('**/__graphics-sheet', route => route.fulfill({ contentType: 'text/html', body: `<meta charset="utf-8"><style>body{margin:0;background:#15161d;color:#e7bd87;font:16px system-ui}.grid{display:grid;grid-template-columns:repeat(5,200px);gap:16px;padding:24px}figure{margin:0}img{width:200px;height:200px;object-fit:cover}figcaption{padding:8px 0}</style><div class="grid">${keys.map(key => `<figure><img src="${base}/persona-${key}.webp"><figcaption>${key} · Demo</figcaption></figure>`).join('')}</div>` }));
    await page.setViewportSize({ width: 1112, height: 560 });
    await page.goto(`${base}/__graphics-sheet`);
    expect(await page.locator('.grid').evaluate(el => getComputedStyle(el).display)).toBe('grid');
    await expect(page.locator('figure')).toHaveCount(10);
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    if (name === 'iphone13') await page.screenshot({ path: resolve('docs/graphics-20261029/contact-sheet.png'), scale: 'css' });
    await context.close();
  });
}

test('all portraits and both responsive scene variants are served and decoded', async ({ page }) => {
  await page.goto(base);
  for (const file of [...keys.map(key => `persona-${key}.webp`),'synera-thread.webp','synera-thread@2x.webp']) {
    const response = await page.request.get(`${base}/${file}`);
    expect(response.status(), file).toBe(200);
    expect(response.headers()['content-type']).toContain('image/webp');
    if (!file.includes('@2x')) expect((await response.body()).length).toBeLessThanOrEqual(file.startsWith('persona') ? 45000 : 140000);
  }
});

test('image slots reserve their layout while images are delayed; translated Demo names survive switching',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  let release; const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/synera-thread*.webp',async route=>{await gate;await route.continue();});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#prepare-profile')).toBeInViewport({ratio:1});
  const before=await page.locator('.signature-scene img').boundingBox();
  expect(before.height).toBeGreaterThan(200);
  release(); await page.locator('.signature-scene img').evaluate(image=>image.decode());
  expect(await page.locator('.signature-scene img').boundingBox()).toEqual(before);
  for(const [language,names] of [['de',['Maria','Oleksii']],['en',['Maria','Oleksii']],['uk',['Марія','Олексій']]]) {
    await page.locator('.header-preferences').evaluate(el=>{el.open=true;});
    await page.locator('#site-language').selectOption(language);
    await expect(page.locator('.demo-people figcaption > span')).toHaveText(names);
  }
});
