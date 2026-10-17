import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

process.env.TMP = process.env.TEMP = 'C:/Users/Andrii/.codex/tmp/synera-mobile-pricing';
const tempStat = await fs.lstat(process.env.TMP);
if (!tempStat.isDirectory() || tempStat.isSymbolicLink()) throw new Error('Expected real C: temp directory');

// Same server and same semantic oracle, in one process to avoid worker startup stalls.
const output = new URL(process.env.SYNERA_ACCESS_MUTATION ? './mutation/' : './screens/', import.meta.url);
await fs.mkdir(output, { recursive: true });
process.argv.push('--demo');
process.env.SYNERA_PORT = '0';
const log = console.log;
let resolveBase;
const basePromise = new Promise(resolve => { resolveBase = resolve; });
console.log = (...args) => {
  const match = args.join(' ').match(/http:\/\/127\.0\.0\.1:\d+/);
  if (match) { resolveBase(match[0]); console.log = log; }
  log(...args);
};
let browser;
const results = [];
const timer = setTimeout(() => { console.error('Acceptance global timeout'); process.exit(2); }, 150000);
try {
  const { chromium, expect } = await import('@playwright/test');
  const { checkAccessPage } = await import('../../../tests/product-access-checks.mjs');
  await import('../../../web_launch/server.mjs');
  const base = await basePromise;
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, timeout: 20000 });
  for (const width of [320, 390, 1440]) for (const language of ['en', 'de', 'uk']) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const page = await context.newPage();
    await checkAccessPage(page, { width, language, base, screenshot: fileURLToPath(new URL(`access-${language}-${width}.png`, output)) });
    results.push({ width, language, passed: true });
    console.log(`PASS ${language} ${width}`);
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/get.html`);
  await expect(page.locator('main a.primary')).toHaveCount(1);
  await expect(page.locator('#pricing-scenario')).toContainText('CHF 12');
  await expect(page.locator('#payment-availability')).toContainText('CHF 0');
  await expect(page.locator('#feedback-note')).toContainText('optional');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  results.push({ javaScriptEnabled: false, width: 320, passed: true });
  await context.close();
  await fs.writeFile(new URL('./ACCEPTANCE.json', import.meta.url), JSON.stringify({ status: 'PASS', results, boundary: 'Local actual server and Chromium, pilot destination intercepted; no live/physical/payment acceptance.' }, null, 2));
  await browser.close(); clearTimeout(timer); process.exit(0);
} catch (error) {
  console.error(error.message);
  await fs.writeFile(new URL(process.env.SYNERA_ACCESS_MUTATION ? './MUTATION.json' : './FAILURE.json', import.meta.url), JSON.stringify({ status: 'REJECTED', results, error: error.message }, null, 2));
  if (browser) await browser.close(); clearTimeout(timer); process.exit(1);
}
