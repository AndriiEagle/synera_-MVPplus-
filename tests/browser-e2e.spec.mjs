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

// SYN_PHASE9_A11Y_E2E (2026-09-23, audit cycle 5): поліш N1–N6. Пинить computed-стилі:
// N3/N6 — --synera-border-control у рамці інпута (3.88:1 vs #fff, WCAG 1.4.11);
// N1/N2/N4 — disabled без opacity-гасіння: підписи чіткі, єдина disabled-поверхня;
// N5 — клавіатурний фокус дає піксельне кільце 2px бренд-зеленим.
// Значення N1–N6 належать класичному вигляду (переможець за замовчуванням — «Новий», див. SYN_NIGHT_A11Y_E2E нижче).
test('SYN_PHASE9_A11Y_E2E: N1-N6 — контрол-рамки, disabled-поверхня, focus-visible', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('synera-design-preference', 'classic'); } catch {} });
  // Без цього читання кольорів потрапляло в середину 0.3-с переходів кнопок (флейк і до редизайну).
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${baseUrl}/`);
  await expect(page.locator('#mode')).toHaveText('Вхід ще не підключено', { timeout: 15000 });
  const computed = await page.evaluate(() => {
    const input = document.querySelector('#email');
    const label = document.querySelector('#auth-fields label');
    const submit = document.querySelector('#auth-submit');
    const fs = document.querySelector('#auth-fields');
    const style = (el) => getComputedStyle(el);
    // Знімаємо показники DISABLED-стану ДО проби...
    const result = {
      controlToken: style(document.documentElement).getPropertyValue('--synera-border-control').trim(),
      disabledBgToken: style(document.documentElement).getPropertyValue('--synera-disabled-bg').trim(),
      disabledInputBorder: style(input).borderTopColor,
      labelColor: style(label).color,
      fieldsetOpacity: style(fs).opacity,
      submitBg: style(submit).backgroundColor,
      submitOpacity: style(submit).opacity,
      submitCursor: style(submit).cursor,
    };
    // ...далі проба: тимчасово вмикаємо fieldset і читаємо ENABLED-рамку того ж інпута.
    fs.disabled = false;
    result.enabledInputBorder = style(input).borderTopColor;
    fs.disabled = true;
    return result;
  });
  // Токени фази 9 на місці.
  expect(computed.controlToken).toBe('#6f8779');
  expect(computed.disabledBgToken).toBe('#e6ebe7');
  // N3: рамка інпута в ENABLED-стані = контрол-токен (3.88:1 vs #fff, WCAG 1.4.11).
  expect(computed.enabledInputBorder).toBe('rgb(111, 135, 121)');
  // N4: disabled-інпут показує єдину disabled-поверхню, не контрол-токен.
  expect(computed.disabledInputBorder).toBe('rgb(179, 193, 182)');
  // N1/N2: підписи в disabled fieldset читабельні, поле не гаситься.
  expect(computed.labelColor).toBe('rgb(78, 95, 80)');
  expect(computed.fieldsetOpacity).toBe('1');
  // N4: єдина disabled-поверхня кнопки замість opacity 0.5.
  expect(computed.submitBg).toBe('rgb(230, 235, 231)');
  expect(computed.submitOpacity).toBe('1');
  expect(computed.submitCursor).toBe('default');
  // N5: клавіатурний Tab-фокус дає видиме кільце (перший фокусабельний елемент).
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const isInteractive = await page.evaluate(() => {
      const el = document.activeElement;
      return el && el.matches('button, a, input, select, textarea, [tabindex]');
    });
    if (isInteractive) break;
  }
  const focusRing = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement);
    return `${s.outlineWidth}|${s.outlineStyle}|${s.outlineColor}`;
  });
  expect(focusRing).toBe('2px|solid|rgb(25, 81, 62)');
});
// SYN_NIGHT_A11Y_E2E: вигляд «Новий» — рамки ≥3:1 на графіті, заблокований вхід видно як заблокований,
// клавіатурний фокус — золоте кільце 2px; «Початковий» лишається робочим перемикачем.
test('SYN_NIGHT_A11Y_E2E: premium night variant — control lines, blocked sign-in, gold focus, classic switch', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${baseUrl}/`);
  await expect(page.locator('html')).toHaveAttribute('data-design', 'premium');
  await expect(page.locator('#mode')).toHaveText('Вхід ще не підключено', { timeout: 15000 });
  const computed = await page.evaluate(() => {
    const fs = document.querySelector('#auth-fields');
    const input = document.querySelector('#email');
    const submit = document.querySelector('#auth-submit');
    const style = el => getComputedStyle(el);
    const result = { disabledInputStyle: style(input).borderTopStyle, submitCursor: style(submit).cursor, submitStyle: style(submit).borderTopStyle, lockLabel: style(fs, '::before').content };
    fs.disabled = false; result.enabledInputBorder = style(input).borderTopColor; fs.disabled = true;
    return result;
  });
  expect(computed.enabledInputBorder).toBe('rgb(126, 133, 148)');
  expect(computed.disabledInputStyle).toBe('dashed');
  expect(computed.submitStyle).toBe('dashed');
  expect(computed.submitCursor).toBe('not-allowed');
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement?.matches('button, a, input, select, textarea'))) break;
  }
  const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return `${s.outlineWidth}|${s.outlineStyle}|${s.outlineColor}`; });
  expect(ring).toBe('2px|solid|rgb(231, 189, 135)');
  await page.click('[data-design-choice="classic"]');
  await expect(page.locator('html')).toHaveAttribute('data-design', 'classic');
  await expect(page.locator('.reciprocity')).toBeHidden();
  await page.click('[data-design-choice="premium"]');
  await expect(page.locator('.reciprocity')).toBeVisible();
});

// SYN_LOCALE_E2E: UA/DE/EN switch translates interface copy (static and app-written), keeps user text,
// and switching back restores the Ukrainian original exactly. Montserrat is served from this origin.
test('SYN_LOCALE_E2E: DE/EN switch translates the interface and restores Ukrainian exactly', async ({ page }) => {
  await page.goto(`${baseUrl}/`);
  await expect(page.locator('#mode')).toHaveText('Вхід ще не підключено', { timeout: 15000 });
  const ukTitle = await page.locator('h1').evaluate(el => el.innerHTML);
  await page.click('[data-lang="de"]');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#prepare-profile')).toContainText('Zuerst das Profil vorbereiten');
  await expect(page.locator('#mode')).toHaveText('Anmeldung noch nicht verbunden');
  await page.click('#prepare-profile');
  await page.fill('textarea[name="offers"]', 'Зберегти профіль');
  await expect(page.locator('#save-profile')).toHaveText('Profil speichern');
  await expect(page.locator('textarea[name="offers"]')).toHaveValue('Зберегти профіль');
  await page.click('[data-lang="en"]');
  await expect(page.locator('#save-profile')).toHaveText('Save profile');
  await page.click('[data-lang="uk"]');
  await expect(page.locator('#save-profile')).toHaveText('Зберегти профіль');
  await page.click('#back-login');
  expect(await page.locator('h1').evaluate(el => el.innerHTML)).toBe(ukTitle);
  const font = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('500 16px "Synera Montserrat"'); });
  expect(font).toBe(true);
  const woff = await page.request.get(`${baseUrl}/montserrat-500.woff2`);
  expect(woff.status()).toBe(200);
});
