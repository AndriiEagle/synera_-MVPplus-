import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
let child, base;
test.beforeAll(async () => {
  child = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  base = await new Promise((resolve, reject) => { let out = ''; const timer = setTimeout(() => reject(Error('server timeout')), 30000); child.stdout.on('data', chunk => { out += chunk; const match = out.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } }); child.on('error', reject); });
});
test.afterAll(() => child?.kill());
for (const [lang, title] of [['uk', 'Твої дані'], ['de', 'Deine Daten'], ['en', 'Your data']]) {
  test('P1/P8: signed-out centre and legal copy in ' + lang, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/privacy.html?lang=' + lang);
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('#privacy-download')).toBeEnabled(); await expect(page.locator('#privacy-erase')).toBeEnabled();
    await expect(page.locator('#privacy-notice')).toContainText('Neon / Databricks');
    await expect(page.locator('#privacy-notice')).toContainText('30');
    const axe = await new AxeBuilder({ page }).analyze(); expect(axe.violations.filter(v => ['serious', 'critical'].includes(v.impact))).toEqual([]);
    await page.goto(base + '/legal.html?lang=' + lang);
    await expect(page.locator('#privacy-notice .privacy-draft')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
test('P1: each shared product page has header and footer access', async ({ page }) => {
  for (const name of Object.keys(PUBLIC_ASSETS).filter(name => name.endsWith('.html') && name !== 'simulation.html')) {
    await page.goto(base + '/' + name);
    await expect(page.locator('.header-preferences [data-privacy-link]')).toHaveCount(1);
    await expect(page.locator('footer [data-privacy-link]')).toHaveCount(1);
  }
});
test('P1/P2: complete local export, real IndexedDB expiry, cancel and scoped erasure', async ({ page }) => {
  await page.goto(base + '/privacy.html?lang=en');
  await page.evaluate(async () => {
    localStorage.setItem('synera.sim.draft.v1:owner:bot-mira', '{"message":"synthetic private draft"}');
    localStorage.setItem('synera.style', 'night'); localStorage.setItem('another-app', 'keep');
    sessionStorage.setItem('synera.message-intent-retry.v1', 'synthetic-retry'); sessionStorage.setItem('another-tab-key', 'keep');
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('synera-studio-v1', 1); r.onupgradeneeded = () => r.result.createObjectStore('sessions', { keyPath: 'id' }); r.onsuccess = () => resolve(r.result); r.onerror = reject; });
    await new Promise((resolve, reject) => { const tx = db.transaction('sessions', 'readwrite'); tx.objectStore('sessions').put({ id: 'fresh', at: Date.now(), json: 'synthetic studio archive' }); tx.objectStore('sessions').put({ id: 'old', at: Date.now() - 31 * 86400000, json: 'expired' }); tx.oncomplete = resolve; tx.onerror = reject; }); db.close();
    await (await caches.open('synera-shell-test')).put('/synthetic-public', new Response('public shell'));
    await (await caches.open('another-cache')).put('/unrelated', new Response('keep'));
  });
  await page.reload();
  await expect.poll(() => page.evaluate(async () => (await import('/privacy-device.mjs')).studioData())).toEqual([{ id: 'fresh', at: expect.any(Number), json: 'synthetic studio archive' }]);
  const downloaded = page.waitForEvent('download'); await page.locator('#privacy-download').click(); const file = await downloaded;
  const data = JSON.parse(await fs.readFile(await file.path(), 'utf8'));
  expect(data.localStorage['synera.sim.draft.v1:owner:bot-mira']).toContain('synthetic private draft');
  expect(data.localStorage['another-app']).toBeUndefined();
  expect(data.sessionStorage['synera.message-intent-retry.v1']).toBe('synthetic-retry');
  expect(data.indexedDB['synera-studio-v1'].sessions[0].id).toBe('fresh');
  expect(data.caches['synera-shell-test'][0].bodyBase64).toBe(Buffer.from('public shell').toString('base64')); expect(data.unavailable).toEqual([]);
  page.once('dialog', dialog => dialog.dismiss()); await page.locator('#privacy-erase').click();
  expect(await page.evaluate(() => localStorage.getItem('synera.style'))).toBe('night');
  page.once('dialog', dialog => dialog.accept()); await page.locator('#privacy-erase').click();
  await expect(page.locator('#privacy-status')).toContainText('erased');
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('synera.')))).toEqual([]);
  expect(await page.evaluate(() => sessionStorage.getItem('synera.message-intent-retry.v1'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('another-app'))).toBe('keep');
  expect(await page.evaluate(() => caches.keys())).toEqual(['another-cache']);
  expect(await page.evaluate(async () => (await import('/privacy-device.mjs')).studioData())).toEqual([]);
});
test('P1: browser storage denied is an explicit partial result', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } }));
  await page.goto(base + '/privacy.html?lang=en');
  page.once('dialog', dialog => dialog.accept()); await page.locator('#privacy-erase').click();
  await expect(page.locator('#privacy-status')).toContainText('incomplete');
});
test('P1: privacy page works from the real offline shell', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  try {
    const page = await context.newPage(); await page.goto(base + '/privacy.html?lang=en');
    await page.evaluate(async () => { const r = await navigator.serviceWorker.register('/sw.mjs'); await navigator.serviceWorker.ready; if (!r.active) await new Promise(resolve => setTimeout(resolve, 300)); });
    await expect.poll(() => page.evaluate(() => caches.match('/privacy.html').then(Boolean))).toBe(true);
    await context.setOffline(true); await page.goto(base + '/privacy.html');
    await expect(page.locator('h1')).toHaveText('Your data'); await expect(page.locator('#privacy-download')).toBeEnabled();
  } finally { await context.close(); }
});
test('P1/P8: phone screenshots show the default dark centre and legal notice', async ({ browser }) => {
  await fs.mkdir('docs/privacy-20261029/shots', { recursive: true });
  for (const [name, width, height, userAgent] of [['iphone13', 390, 844, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'], ['pixel7', 412, 915, 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36']]) {
    const context = await browser.newContext({ viewport: { width, height }, userAgent, isMobile: true, deviceScaleFactor: 1, serviceWorkers: 'block' });
    try { const page = await context.newPage(); for (const route of ['privacy', 'legal']) { await page.goto(base + '/' + route + '.html'); await page.evaluate(() => document.fonts.ready); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await expect(page.locator('html')).toHaveAttribute('data-synera-style', 'synera'); await page.screenshot({ path: 'docs/privacy-20261029/shots/' + name + '-' + route + '.png', fullPage: true }); } } finally { await context.close(); }
  }
});
