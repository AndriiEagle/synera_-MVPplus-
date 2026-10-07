import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { checkAccessPage } from './product-access-checks.mjs';

let server, base;
test.beforeAll(async () => {
  server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  base = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(output || 'Server timeout')), 30000);
    server.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
    server.stderr.on('data', chunk => { output += chunk; });
    server.on('exit', code => { clearTimeout(timer); reject(new Error(`Server exit ${code}: ${output}`)); });
  });
});
test.afterAll(() => { if (server?.exitCode === null) server.kill(); });

for (const width of [320, 390, 1440]) for (const language of ['en', 'de', 'uk']) {
  test(`Access journey ${language} at ${width}`, async ({ page }, testInfo) => {
    await checkAccessPage(page, { width, language, base, screenshot: testInfo.outputPath(`access-${language}-${width}.png`) });
  });
}

test('Access and scenario remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/get.html`);
  await expect(page.locator('main a.primary')).toHaveCount(1);
  await expect(page.locator('#payment-availability')).toContainText('CHF 0');
  await expect(page.locator('#pricing-scenario')).toContainText('CHF 12');
  await expect(page.locator('#feedback-note')).toContainText('optional');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
