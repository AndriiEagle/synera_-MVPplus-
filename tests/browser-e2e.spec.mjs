// C13.L3 — браузерний E2E реального сервера (web_launch/server.mjs --demo).
// Сервер спавниться з КОРЕНЯ репо (root-відносні шляхи, як у server.test.mjs),
// порт 0 → ОС дає вільний порт, URL парситься зі stdout сервера.
// Покриття: статична поверхня + конфіг-гейт + помилки сторінки. Без auth/backend.
import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';

let serverProcess;
let baseUrl;

test.beforeAll(async () => {
  serverProcess = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], {
    env: { ...process.env, SYNERA_PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  baseUrl = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('server did not print URL. output: ' + output)), 30000);
    serverProcess.stdout.on('data', chunk => {
      output += chunk.toString();
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); }
    });
    serverProcess.stderr.on('data', chunk => { output += chunk.toString(); });
    serverProcess.on('exit', code => { clearTimeout(timer); reject(new Error(`server exited early (code ${code}). output: ${output}`)); });
  });
});

test.afterAll(async () => {
  if (serverProcess && serverProcess.exitCode === null) serverProcess.kill();
});

test('index віддає 200 і показує бренд synera', async ({ page }) => {
  const response = await page.goto(`${baseUrl}/`);
  expect(response.status()).toBe(200);
  await expect(page.locator('.brand')).toBeVisible();
  await expect(page.locator('.brand')).toContainText('synera');
});

test('hero h1 видимий на desktop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${baseUrl}/`);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('hero h1 видимий на mobile viewport 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto(`${baseUrl}/`);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('клік табу profile перемикає видиму секцію workspace', async ({ page }) => {
  await page.goto(`${baseUrl}/`);
  // Ініціалізація app.mjs (top-level await fetch config.json) триває після load —
  // чекаємо маркер ініціалізації, інакше клік потрапляє в кнопку без обробника.
  await expect(page.locator('#mode')).toHaveText('Вхід ще не підключено', { timeout: 15000 });
  await expect(page.locator('#profile-view')).toBeHidden();
  // Таби живуть у #workspace, який hidden до входу/чернетки — входимо через шлях чернетки.
  await page.click('#prepare-profile');
  await page.click('button[data-tab="profile"]');
  await expect(page.locator('#profile-view')).toBeVisible();
  // Welcome-екран поступається місцем workspace-контенту.
  await expect(page.locator('#welcome')).toBeHidden();
});

test('catalogue.html віддає 200 і свій заголовок', async ({ page }) => {
  const response = await page.goto(`${baseUrl}/catalogue.html`);
  expect(response.status()).toBe(200);
  await expect(page).toHaveTitle(/Catalogue/);
});

test('config.json парситься з безпечними дефолтами демо-режиму', async ({ request }) => {
  const response = await request.get(`${baseUrl}/config.json`);
  expect(response.status()).toBe(200);
  const config = await response.json();
  expect(config.supabaseUrl).toBe('');
  expect(config.registrationEnabled).toBe(false);
});

test('/.git/config і /config.public.json відкидаються 404 (allowlist-сервер)', async ({ request }) => {
  expect((await request.get(`${baseUrl}/.git/config`)).status()).toBe(404);
  expect((await request.get(`${baseUrl}/config.public.json`)).status()).toBe(404);
});

test('жодна same-origin відповідь на index не має статусу ≥ 500', async ({ page }) => {
  const serverErrors = [];
  page.on('response', response => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(`${baseUrl}/`);
  await page.waitForLoadState('networkidle');
  expect(serverErrors).toEqual([]);
});

test('нуль pageerror-подій під час навігації по табах', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  await page.goto(`${baseUrl}/`);
  // Чекаємо завершення ініціалізації app.mjs — інакше кліки губляться до навішування обробників.
  await expect(page.locator('#mode')).toHaveText('Вхід ще не підключено', { timeout: 15000 });
  // Таби невидимі до showWorkspace() — відкриваємо через шлях чернетки (без входу).
  await page.click('#prepare-profile');
  for (const tab of ['profile', 'people', 'meetings', 'settings']) {
    await page.click(`button[data-tab="${tab}"]`);
    await page.waitForTimeout(100);
  }
  expect(pageErrors).toEqual([]);
});

// SYN_TOKEN_WIRED_E2E (2026-09-23, audit cycle 4): 146 var()-посилань style.css висіли
// в повітрі після семантичного перезапису tokens.css (c4a4210) — рендер мовчки падав
// у browser-дефолти (білий фон, невидимі інпути, нульові радіуси). Цей тест пінить
// computed-стилі, а не DOM-видимість: токени мають РОЗВИНЯТИСЬ у значення.
test("SYN_TOKEN_WIRED_E2E: tokens.css підключений і змінні розв'язуються в computed-стилях", async ({ page }) => {
  await page.goto(`${baseUrl}/`);
  const computed = await page.evaluate(() => {
    const cs = getComputedStyle(document.body);
    const input = document.querySelector('#email');
    return {
      bodyBg: cs.backgroundColor,
      rootColor254f3b: getComputedStyle(document.documentElement).getPropertyValue('--color-254f3b').trim(),
      inputBorderWidth: input ? getComputedStyle(input).borderTopWidth : '',
      inputBg: input ? getComputedStyle(input).backgroundColor : '',
    };
  });
  // Бренд-токен розв'язується (не порожній рядок = tokens.css завантажений).
  expect(computed.rootColor254f3b).toBe('#254f3b');
  // Фон body — теплий бренд-тон, не browser-дефолт (transparent/white = зламаний ланцюжок var()).
  expect(computed.bodyBg).not.toBe('rgba(0, 0, 0, 0)');
  expect(computed.bodyBg).not.toBe('rgb(255, 255, 255)');
  // Інпут має видиму рамку (0px = невидимий контроль, який ловив vision-рев'ю).
  expect(parseFloat(computed.inputBorderWidth)).toBeGreaterThan(0);
});