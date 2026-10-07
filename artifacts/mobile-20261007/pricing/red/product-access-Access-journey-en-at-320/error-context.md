# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-access.spec.mjs >> Access journey en at 320
- Location: tests\product-access.spec.mjs:23:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('main a.primary')
Expected: 1
Received: 3
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" locator('main a.primary') with timeout 5000ms
  - waiting for locator('main a.primary')
    14 × locator resolved to 3 elements
       - unexpected value "3"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { spawn } from 'node:child_process';
  3  | import AxeBuilder from '@axe-core/playwright';
  4  | 
  5  | let server, base;
  6  | test.beforeAll(async () => {
  7  |   server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  8  |   base = await new Promise((resolve, reject) => {
  9  |     let output = '';
  10 |     const timer = setTimeout(() => reject(new Error(output || 'Server timeout')), 30000);
  11 |     server.stdout.on('data', chunk => {
  12 |       output += chunk;
  13 |       const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
  14 |       if (match) { clearTimeout(timer); resolve(match[0]); }
  15 |     });
  16 |     server.stderr.on('data', chunk => { output += chunk; });
  17 |     server.on('exit', code => { clearTimeout(timer); reject(new Error(`Server exit ${code}: ${output}`)); });
  18 |   });
  19 | });
  20 | test.afterAll(() => { if (server?.exitCode === null) server.kill(); });
  21 | 
  22 | for (const width of [320, 390, 1440]) for (const language of ['en', 'de', 'uk']) {
  23 |   test(`Access journey ${language} at ${width}`, async ({ page }, testInfo) => {
  24 |     await page.setViewportSize({ width, height: 900 });
  25 |     const unexpected = [], errors = [];
  26 |     page.on('pageerror', error => errors.push(error.message));
  27 |     await page.route('**/*', async route => {
  28 |       const request = route.request();
  29 |       if (!request.url().startsWith(base + '/') || request.method() !== 'GET' || /\/api\//.test(request.url())) {
  30 |         unexpected.push(request.url()); return route.abort();
  31 |       }
  32 |       if (process.env.SYNERA_ACCESS_MUTATION === 'demo-primary' && new URL(request.url()).pathname === '/get.html') {
  33 |         const response = await route.fetch();
  34 |         return route.fulfill({ response, body: (await response.text()).replace('id="open-studio-app" class="small-link"', 'id="open-studio-app" class="primary"') });
  35 |       }
  36 |       return route.continue();
  37 |     });
  38 |     await page.goto(`${base}/get.html`);
  39 |     await page.locator('#access-language').selectOption(language);
  40 |     await expect(page.locator('html')).toHaveAttribute('lang', language);
  41 |     // One visual primary entry, encountered before demos in reading/tab order.
> 42 |     await expect(page.locator('main a.primary')).toHaveCount(1);
     |                                                  ^ Error: expect(locator).toHaveCount(expected) failed
  43 |     await expect(page.locator('main a').first()).toHaveAttribute('href', 'https://synera-pilot.pages.dev/');
  44 |     await expect(page.locator('main a.primary')).toHaveAttribute('id', 'open-live-app');
  45 |     await expect(page.locator('#payment-availability')).toContainText('CHF 0');
  46 |     await expect(page.locator('#payment-availability')).toHaveAttribute('data-state', 'free-pilot');
  47 |     await expect(page.locator('#pricing-scenario')).toContainText('CHF 12');
  48 |     await expect(page.locator('#pricing-scenario a, #pricing-scenario button, #pricing-scenario input')).toHaveCount(0);
  49 |     await expect(page.locator('#pricing-scenario')).toContainText(/scenario|Szenario|Сценарій/);
  50 |     await expect(page.locator('#feedback-note')).toContainText(/optional|freiwillig|добровільний/);
  51 |     await expect(page.locator('#open-studio-app')).toHaveAttribute('href', '/studio.html');
  52 |     await expect(page.locator('#open-demo-journey')).toHaveAttribute('href', '/studio-journey.html');
  53 |     for (const platform of ['android', 'ios']) {
  54 |       await page.locator(`[data-platform="${platform}"] summary`).click();
  55 |       await expect(page.locator(`[data-platform="${platform}"]`)).toHaveAttribute('open', '');
  56 |     }
  57 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  58 |     const translations = await page.locator('[data-product-copy]').allTextContents();
  59 |     expect(translations.every(text => text.trim() && text !== 'undefined')).toBe(true);
  60 |     if (language !== 'uk') expect((await page.locator('main').innerText()).match(/[А-Яа-яІіЇїЄє]/)).toBeNull();
  61 |     await expect(page.locator('form, iframe, a[href*="stripe"], a[href*="paypal"], input[type="email"]')).toHaveCount(0);
  62 |     expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  63 |     expect(unexpected).toEqual([]);
  64 |     expect(errors).toEqual([]);
  65 |     const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  66 |     expect(audit.violations).toEqual([]);
  67 |     await page.screenshot({ path: testInfo.outputPath(`access-${language}-${width}.png`), fullPage: true });
  68 |     // Follow the primary link into an explicit local fixture: no live-pilot request.
  69 |     await page.route('https://synera-pilot.pages.dev/', route => route.fulfill({ contentType: 'text/html', body: '<h1>Pilot destination fixture</h1>' }));
  70 |     await page.locator('#open-live-app').click();
  71 |     await expect(page).toHaveURL('https://synera-pilot.pages.dev/');
  72 |     await expect(page.locator('h1')).toHaveText('Pilot destination fixture');
  73 |   });
  74 | }
  75 | 
  76 | test('Access and scenario remain readable without JavaScript', async ({ browser }) => {
  77 |   const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  78 |   const page = await context.newPage();
  79 |   await page.goto(`${base}/get.html`);
  80 |   await expect(page.locator('main a.primary')).toHaveCount(1);
  81 |   await expect(page.locator('#payment-availability')).toContainText('CHF 0');
  82 |   await expect(page.locator('#pricing-scenario')).toContainText('CHF 12');
  83 |   await expect(page.locator('#feedback-note')).toContainText('optional');
  84 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  85 |   await context.close();
  86 | });
  87 | 
```