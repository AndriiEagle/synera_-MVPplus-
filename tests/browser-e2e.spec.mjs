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

async function openPreferences(page) {
  await page.locator('.header-preferences summary').click();
  await expect(page.locator('#style-toggle')).toBeVisible();
}

test('Google entry explains consent, sends no request before acceptance, and shows recoverable failure', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.addInitScript(() => localStorage.setItem('synera.first-user-tour.v1', 'done'));
  await page.route('**/config.json', route => route.fulfill({ json: {
    backend: 'neon', pilotSafetyEnabled: true, realPilotEnabled: true,
    registrationEnabled: true, googleOAuthEnabled: true,
    googleOAuthInitUrl: 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth/sign-in/social/init',
    googleOAuthInitUrl: 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth/sign-in/social/init',
  } }));
  let starts = 0;
  await page.route('**/api/neon/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/oauth/google/start')) {
      starts++;
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON().consent.terms_accepted).toBe(true);
      expect(route.request().postDataJSON().consent.privacy_acknowledged).toBe(true);
      await route.fulfill({ status: 503, json: { error: 'service_unavailable' } });
    } else await route.fulfill({ json: path.endsWith('/session') ? { user: null } : {} });
  });
  await page.goto(`${baseUrl}/?signin=google-error`);
  await expect(page).toHaveURL(`${baseUrl}/`);
  await expect(page.locator('#notice')).toContainText('Не вдалося завершити Google-вхід');
  await expect(page.locator('#google-signin')).toBeEnabled();
  await expect(page.locator('#google-signin')).toHaveText('Продовжити з Google');
  await page.locator('#google-signin').click();
  await expect(page.locator('#policy-dialog')).toBeVisible();
  expect(starts).toBe(0);
  await page.locator('#policy-cancel').click();
  expect(starts).toBe(0);
  await page.locator('#google-signin').click();
  await page.locator('#accept-terms').check();
  await page.locator('#accept-privacy').check();
  await page.locator('#policy-form button[type="submit"]').click();
  await expect.poll(() => starts).toBe(1);
  await expect(page.locator('#google-signin')).toBeEnabled();
  await expect(page.locator('#policy-dialog')).not.toBeVisible();
  await expect(page.locator('#auth-submit')).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('google-entry-mobile.png') });
  await page.locator('#auth-form').screenshot({ path: testInfo.outputPath('google-auth-mobile.png') });
});

test('index віддає 200 і показує бренд synera', async ({ page }) => {
  const response = await page.goto(`${baseUrl}/`);
  expect(response.status()).toBe(200);
  await expect(page.locator('.brand')).toBeVisible();
  await expect(page.locator('.brand')).toContainText('synera');
});

test('hero h1 видимий на desktop viewport', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${baseUrl}/`);
  await expect(page.locator('h1').first()).toBeVisible();
  const hero = await page.locator('h1').first().boundingBox();
  const demo = await page.locator('#demo-journey').boundingBox();
  expect(hero.y).toBeLessThan(demo.y);
  await page.screenshot({ path: testInfo.outputPath('desktop-landing.png') });
});

test('hero h1 видимий на mobile viewport 375px', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto(`${baseUrl}/`);
  await expect(page.locator('h1').first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mobile-landing.png') });
});

test('mobile first visit gives one visible action and keeps appearance settings available on demand', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.addInitScript(() => localStorage.setItem('synera.first-user-tour.v1', 'done'));
  await page.goto(`${baseUrl}/`);
  const action = page.locator('#prepare-profile');
  await expect(action).toBeVisible();
  expect((await action.boundingBox()).y).toBeLessThan(700);
  await expect(page.locator('#style-toggle')).toBeHidden();
  await page.locator('.header-preferences summary').click();
  await expect(page.locator('#style-toggle')).toBeVisible();
  await expect(page.locator('#style-preset')).toBeVisible();
  await page.locator('#style-preset').selectOption('noir');
  await expect(page.locator('html')).toHaveAttribute('data-synera-style', 'noir');
});

test('Synera, Atelier and previous Web design remain reversible choices', async ({ page }) => {
  await page.goto(`${baseUrl}/`);
  await openPreferences(page);
  const toggle = page.locator('#style-toggle');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveText('Стиль: Synera');
  await expect(page.locator('html')).toHaveAttribute('data-synera-style', 'synera');
  await toggle.click();
  await expect(toggle).toHaveText('Стиль: Atelier');
  await expect(page.locator('html')).toHaveAttribute('data-synera-style', 'atelier');
  await toggle.click();
  await expect(toggle).toHaveText('Стиль: Web');
  await expect(page.locator('html')).toHaveAttribute('data-synera-style', 'original');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-synera-style', 'synera');
});

test('compact presets are visual-only choices alongside the preserved three-style switch', async ({ page }) => {
  await page.goto(`${baseUrl}/`);
  await openPreferences(page);
  await page.locator('#style-preset').selectOption('noir');
  await expect(page.locator('html')).toHaveAttribute('data-synera-style', 'noir');
  await expect(page.locator('#style-toggle')).toHaveText('Стиль: Noir');
  await page.locator('#style-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-synera-style', 'synera');
});

test('all ten compact presets visibly change the desktop surface without changing the document flow', async ({ page }) => {
  await page.goto(`${baseUrl}/`);
  await openPreferences(page);
  const values = ['noir', 'alpine', 'copper', 'azure', 'orchid', 'terracotta', 'citrus', 'slate', 'ink', 'harvest'];
  const backgrounds = [];
  for (const value of values) {
    await page.locator('#style-preset').selectOption(value);
    backgrounds.push(await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor));
    await expect(page.locator('#demo-journey')).toBeVisible();
  }
  expect(new Set(backgrounds).size).toBe(10);
});

test('a compact preset remains selectable and visibly distinct at a 375px mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto(`${baseUrl}/`);
  await openPreferences(page);
  const base = await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor);
  await page.locator('#style-preset').selectOption('noir');
  const noir = await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor);
  expect(noir).not.toBe(base);
  await expect(page.locator('#style-preset')).toBeVisible();
});

test('synthetic demo walks people, mutual benefit, conditions and an unsent invitation draft', async ({ page }) => {
  await page.goto(`${baseUrl}/`);
  await expect(page.getByText('ДЕМОНСТРАЦІЯ · СИНТЕТИЧНИЙ ПРИКЛАД')).toBeVisible();
  await page.getByRole('button', { name: 'Показати взаємну користь' }).click();
  await expect(page.getByText('Причина для розмови в обидва боки')).toBeVisible();
  await page.getByRole('button', { name: 'Перевірити умови' }).click();
  await expect(page.getByText('Умови до контакту')).toBeVisible();
  await page.getByRole('button', { name: 'Підготувати чернетку запрошення' }).click();
  await expect(page.getByText('Чернетка — не відправлення')).toBeVisible();
  await expect(page.getByText('НЕ ВІДПРАВЛЕНО · лише локальна демонстрація')).toBeVisible();
});

test('first-user tour highlights guidance without blocking the local profile draft', async ({ page }) => {
  await page.goto(`${baseUrl}/`);
  await openPreferences(page);
  await page.locator('#tour-start').click();
  await expect(page.getByRole('heading', { name: 'Твій профіль — під твоїм контролем' })).toBeVisible();
  await page.locator('#prepare-profile').click();
  await expect(page.locator('#profile-view')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Далі' })).toBeVisible();
});

test('draft tour reaches the usable demo and preserves the profile when returning to login', async ({ page }) => {
  await page.goto(`${baseUrl}/`);
  await expect(page.locator('#mode')).toHaveText('Вхід ще не підключено', { timeout: 15000 });
  await page.locator('#prepare-profile').click();
  await page.getByRole('textbox', { name: 'Ім’я для профілю', exact: true }).fill('Тестова чернетка');
  await openPreferences(page);
  await page.locator('#tour-start').click();
  for (let step = 1; step < 6; step++) await page.getByRole('button', { name: 'Далі', exact: true }).click();
  await expect(page.locator('#demo-journey')).toBeVisible();
  await page.getByRole('button', { name: 'Завершити', exact: true }).click();
  await page.getByRole('button', { name: 'Показати взаємну користь', exact: true }).click();
  await expect(page.getByRole('heading', { name: '2. Причина для розмови в обидва боки', exact: true })).toBeVisible();
  await page.locator('#back-login').click();
  await expect(page.locator('#demo-journey')).toBeVisible();
  await page.locator('#prepare-profile').click();
  await expect(page.getByRole('textbox', { name: 'Ім’я для профілю', exact: true })).toHaveValue('Тестова чернетка');
});

test('Synera keeps the disabled login action on the readable disabled surface', async ({ page }) => {
  await page.goto(`${baseUrl}/`);
  await expect(page.locator('#mode')).toHaveText('Вхід ще не підключено', { timeout: 15000 });
  const state = await page.locator('#auth-submit').evaluate(button => {
    const style = getComputedStyle(button);
    const token = getComputedStyle(document.documentElement).getPropertyValue('--synera-disabled-bg').trim();
    const probe = document.createElement('div');
    probe.style.backgroundColor = token;
    document.body.append(probe);
    const expected = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { disabled: button.matches(':disabled'), background: style.backgroundColor, expected };
  });
  expect(state.disabled).toBe(true);
  await expect.poll(() => page.locator('#auth-submit').evaluate(button => getComputedStyle(button).backgroundColor)).toBe(state.expected);
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

test('mobile profile presents its first action without scrolling past the first screen', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 412, height: 850 });
  await page.goto(`${baseUrl}/`);
  await expect(page.locator('#mode')).toHaveText('Вхід ще не підключено', { timeout: 15000 });
  await page.locator('#prepare-profile').click();
  await page.evaluate(() => scrollTo(0, 0));
  const action = await page.locator('#start-chatgpt-transfer').boundingBox();
  expect(action).not.toBeNull();
  expect(action.y + action.height).toBeLessThan(850);
  await page.screenshot({ path: testInfo.outputPath('mobile-profile.png') });
});

test('small mobile view keeps the profile navigation and style control on screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(`${baseUrl}/`);
  await expect(page.locator('#mode')).toHaveText('Вхід ще не підключено', { timeout: 15000 });
  await page.locator('#prepare-profile').click();
  await openPreferences(page);
  const geometry = await page.evaluate(() => {
    const rect = selector => document.querySelector(selector).getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      nav: { left: rect('.workspace-bar nav').left, right: rect('.workspace-bar nav').right, bottom: rect('.workspace-bar nav').bottom },
      style: { left: rect('#style-toggle').left, right: rect('#style-toggle').right },
    };
  });
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.nav.left).toBeGreaterThanOrEqual(0);
  expect(geometry.nav.right).toBeLessThanOrEqual(320);
  expect(geometry.nav.bottom).toBeLessThanOrEqual(700);
  expect(geometry.style.left).toBeGreaterThanOrEqual(0);
  expect(geometry.style.right).toBeLessThanOrEqual(320);
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
  await openPreferences(page);
  const computed = await page.evaluate(() => {
    const cs = getComputedStyle(document.body);
    const input = document.querySelector('#email');
    return {
      bodyBg: cs.backgroundColor,
      bodyBgImage: cs.backgroundImage,
      rootColor254f3b: getComputedStyle(document.documentElement).getPropertyValue('--color-254f3b').trim(),
      inputBorderWidth: input ? getComputedStyle(input).borderTopWidth : '',
      inputBg: input ? getComputedStyle(input).backgroundColor : '',
    };
  });
  // Обрана Synera зберігає палітру оригінального Flutter, обидва вебстилі доступні окремо.
  expect(computed.rootColor254f3b).toBe('#e7bd87');
  await page.locator('#style-toggle').click();
  const atelierToken = await page.locator('html').evaluate(root => getComputedStyle(root).getPropertyValue('--color-254f3b').trim());
  expect(atelierToken).toBe('#173f32');
  await page.locator('#style-toggle').click();
  const originalToken = await page.locator('html').evaluate(root => getComputedStyle(root).getPropertyValue('--color-254f3b').trim());
  expect(originalToken).toBe('#254f3b');
  // Фон має бути реальною поверхнею, а не browser-дефолтом.
  expect(computed.bodyBgImage !== 'none' || !['rgba(0, 0, 0, 0)', 'rgb(255, 255, 255)'].includes(computed.bodyBg)).toBe(true);
  // Інпут має видиму рамку (0px = невидимий контроль, який ловив vision-рев'ю).
  expect(parseFloat(computed.inputBorderWidth)).toBeGreaterThan(0);
});

// SYN_PHASE9_A11Y_E2E (2026-09-23, audit cycle 5): поліш N1–N6. Пинить computed-стилі:
// N3/N6 — --synera-border-control у рамці інпута (3.88:1 vs #fff, WCAG 1.4.11);
// N1/N2/N4 — disabled без opacity-гасіння: підписи чіткі, єдина disabled-поверхня;
// N5 — клавіатурний фокус дає піксельне кільце 2px бренд-зеленим.
test('SYN_PHASE9_A11Y_E2E: N1-N6 — контрол-рамки, disabled-поверхня, focus-visible', async ({ page }) => {
  await page.goto(`${baseUrl}/`);
  await openPreferences(page);
  await page.locator('#style-toggle').click(); // Atelier
  await page.locator('#style-toggle').click(); // Previous Web; the original Phase-9 tokens remain proven here.
  await expect(page.locator('html')).toHaveAttribute('data-synera-style', 'original');
  await expect.poll(() => page.locator('#auth-submit').evaluate(button => getComputedStyle(button).backgroundColor)).toBe('rgb(230, 235, 231)');
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
