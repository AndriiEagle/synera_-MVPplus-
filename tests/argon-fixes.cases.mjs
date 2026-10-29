import { test, expect, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
import { resolve } from 'node:path';

const sourceRoot = process.env.ARGON_SOURCE_ROOT || process.cwd();
const readSource = path => readFile(resolve(sourceRoot, path), 'utf8');

test.describe('Argon regression acceptance', () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  let server, base;
  const metrics = {};
  test.beforeAll(async () => {
    server = spawn(process.execPath, ['web_launch/server.mjs'], { cwd: sourceRoot, env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
    base = await new Promise((resolve, reject) => {
      let out = '';
      const timer = setTimeout(() => reject(new Error('server startup timeout: ' + out)), 30000);
      server.stdout.on('data', chunk => { out += chunk; const url = out.match(/http:\/\/127\.0\.0\.1:\d+/); if (url) { clearTimeout(timer); resolve(url[0]); } });
      server.on('exit', code => { clearTimeout(timer); reject(new Error('server exited: ' + code)); });
    });
  });
  test.afterAll(async () => {
    server?.kill();
    const dir = process.env.ARGON_EVIDENCE;
    if (dir) {
      await mkdir(dir, { recursive: true });
      let previous = {}; try { previous = JSON.parse(await readFile(dir + '/metrics.json', 'utf8')); } catch {}
      await writeFile(dir + '/metrics.json', JSON.stringify({ ...previous, ...metrics }, null, 2));
    }
  });
  async function home(page) { await page.goto(base); await expect(page.locator('#notice')).toContainText('Вхід відкриється'); }
  async function preferences(page) { await page.locator('.header-preferences > summary').click(); }

  test('F1 all six tour targets are visible and usable from a fresh visit', async ({ page }) => {
    await home(page); await preferences(page); await page.locator('#tour-start').click();
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      await expect(page.locator('.tour-panel .eyebrow')).toHaveText(`КРОК ${i + 1} / 6`);
      const target = page.locator('.tour-target');
      boxes.push(await target.boundingBox()); metrics.F1 = boxes;
      expect.soft(await target.isVisible(), `step ${i + 1} visibility`).toBe(true);
      expect.soft(boxes[i]?.height ?? 0, `step ${i + 1} height`).toBeGreaterThan(0);
      if (i === 0) expect.soft(await target.locator(':disabled').count()).toBe(0);
      await page.locator('.tour-panel .actions button').nth(1).click();
    }
    await expect(page.locator('.tour-panel')).toBeHidden();
  });

  test('F2 closed paths expose an editable draft and a local triangle prototype', async ({ page }) => {
    await page.goto(base + '/real-journey.html');
    await expect(page.locator('#real-blocked')).toBeVisible();
    await page.locator('#real-blocked > a').click();
    await expect(page.locator('#workspace')).toBeVisible();
    metrics.F2 = { draftVisible: await page.locator('#workspace').isVisible() };
    await page.locator('[name=offers]').fill('Мій власний внесок');
    await expect(page.locator('[name=offers]')).toHaveValue('Мій власний внесок');
    await page.goto(base + '/rooms.html');
    await expect(page.locator('#rooms-blocked a[href="/triangle.html"]')).toBeVisible();
  });

  test('F3 closed sign-in is compact; a ready server restores the full form', async ({ page }) => {
    await home(page);
    metrics.F3 = { visibleInputs: await page.locator('#auth-form input:visible').count() };
    await expect(page.locator('#auth-form')).toBeHidden();
    await expect(page.locator('#auth-closed')).toBeVisible();
    await page.locator('#auth-closed a').click();
    await expect(page.locator('#workspace')).toBeVisible();
    await page.route('**/config.json', route => route.fulfill({ json: { backend: 'neon', pilotSafetyEnabled: true, realPilotEnabled: true, registrationEnabled: true, googleOAuthEnabled: true } }));
    await page.route('**/api/neon/**', route => route.fulfill({ json: { user: null } }));
    await page.goto(base);
    await expect(page.locator('#auth-form')).toBeVisible();
    await expect(page.locator('#email')).toBeEnabled();
    await expect(page.locator('#google-signin')).toBeVisible();
    await expect(page.locator('#auth-closed')).toBeHidden();
  });

  test('F4 at most one installation surface on iPhone, Android and desktop', async ({ browser }) => {
    const counts = {};
    for (const device of ['iPhone 13', 'Pixel 7', 'Desktop Chrome']) {
      const context = await browser.newContext({ ...devices[device], serviceWorkers: 'block' });
      try {
        const page = await context.newPage(); await home(page);
        counts[device] = await page.locator('#install-hint:visible,.install-bar:visible').count();
        metrics.F4 = counts;
        expect(counts[device], device).toBeLessThanOrEqual(1);
        await page.evaluate(() => { const event = new Event('beforeinstallprompt'); event.prompt = async () => {}; window.dispatchEvent(event); });
        expect(await page.locator('#install-hint:visible,.install-bar:visible').count(), device + ' install event').toBeLessThanOrEqual(1);
      } finally { await context.close(); }
    }
  });

  test('F5 all static pages and every style match browser chrome to their canvas', async ({ page }) => {
    const files = (await readdir(resolve(sourceRoot, 'web_launch'))).filter(file => file.endsWith('.html'));
    metrics.F5 = { pages: files.length, staticMismatch: 0, styles: {} };
    for (const file of files) {
      const html = await readSource('web_launch/' + file);
      const theme = html.match(/<meta name="theme-color" content="([^"]+)"/)?.[1];
      const scheme = html.match(/<meta name="color-scheme" content="([^"]+)"/)?.[1];
      if (theme !== '#15161d' || scheme !== 'dark') metrics.F5.staticMismatch++;
    }
    expect(metrics.F5.staticMismatch).toBe(0);
    await home(page); await preferences(page);
    const styles = await page.locator('#style-preset option').evaluateAll(nodes => nodes.map(node => node.value));
    for (const style of styles) {
      await page.locator('#style-preset').selectOption(style);
      const data = await page.evaluate(() => {
        const probe = document.createElement('div'); probe.style.background = document.querySelector('meta[name=theme-color]').content; document.body.append(probe);
        const theme = getComputedStyle(probe).backgroundColor; probe.remove();
        return { theme, canvas: getComputedStyle(document.documentElement).backgroundColor, scheme: document.querySelector('meta[name=color-scheme]').content };
      });
      metrics.F5.styles[style] = data;
      expect(data.theme, style).toBe(data.canvas);
      expect(data.scheme, style).toBe(['atelier', 'original'].includes(style) ? 'light' : 'dark');
    }
  });

  test('F6 all shared-shell mobile headings share a 24px gutter and accented eyebrows', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const values = {};
    for (const path of ['/', '/summit.html', '/studio.html', '/triangle.html', '/real-journey.html', '/rooms.html', '/get.html', '/studio-journey.html', '/outcome-archive.html', '/catalogue.html', '/legal.html', '/lab.html']) {
      if (path === '/lab.html') await page.route(base + path, async route => route.fulfill({ contentType: 'text/html', body: await readSource('web_launch/lab.html') }));
      await page.goto(base + path);
      const h1 = await page.locator('h1').boundingBox();
      const colour = path === '/real-journey.html' ? await page.locator('h1').evaluate(node => getComputedStyle(node.parentElement.querySelector('.eyebrow')).color) : null;
      values[path] = h1.x; metrics.F6 = values;
      expect(h1.x, path).toBeCloseTo(24, 0);
      if (path === '/real-journey.html') expect(colour).toBe('rgb(231, 189, 135)');
    }
  });

  test('F7 diagram segments never intersect participant labels at 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base + '/triangle.html');
    const intersections = await page.evaluate(() => {
      const labels = [...document.querySelectorAll('.seat b,.seat small')].map(node => ({ text: node.textContent, box: node.getBoundingClientRect() }));
      const hits = [];
      for (const path of document.querySelectorAll('.triangle-art path')) {
        const matrix = path.getScreenCTM();
        for (let length = 0; length <= path.getTotalLength(); length += 0.25) {
          const point = path.getPointAtLength(length).matrixTransform(matrix);
          for (const { text, box } of labels) if (point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom) { hits.push(text); break; }
        }
      }
      return [...new Set(hits)];
    });
    metrics.F7 = intersections; expect(intersections).toEqual([]);
  });

  test('F8 mobile primary CTAs fill the common content width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); const widths = {};
    for (const path of ['/', '/summit.html', '/studio.html', '/triangle.html']) {
      await page.goto(base + path);
      const box = await page.locator(path === '/' ? '#prepare-profile' : '.primary').first().boundingBox();
      widths[path] = box.width; metrics.F8 = widths; expect(box.width, path).toBeCloseTo(342, 0);
    }
  });

  test('F9 summit avatars use the display font', async ({ page }) => {
    await page.goto(base + '/summit.html');
    metrics.F9 = await page.locator('.avatar').first().evaluate(node => getComputedStyle(node).fontFamily);
    expect(metrics.F9).toContain('Montserrat'); expect(metrics.F9).not.toContain('Georgia');
  });

  test('F10 every modes list marks both account-only destinations in all languages', async ({ page }) => {
    const files = (await readdir(resolve(sourceRoot, 'web_launch'))).filter(file => file.endsWith('.html'));
    let marked = 0;
    for (const file of files) {
      const html = await readSource('web_launch/' + file); if (!html.includes('more-modes-links')) continue;
      // Lab is a source-only reference page, deliberately outside the public server allowlist.
      if (!Object.hasOwn(PUBLIC_ASSETS, file)) await page.route(base + '/' + file, route => route.fulfill({ contentType: 'text/html', body: html }));
      await page.goto(base + '/' + file); await page.locator('.more-modes > summary').click();
      for (const href of ['/real-journey.html', '/rooms.html']) {
        const tag = page.locator(`.more-modes-links a[href="${href}"] .mode-status`);
        await expect(tag).toBeVisible(); await expect(tag).toHaveText('потрібен вхід'); marked++;
      }
    }
    metrics.F10 = { marked };
    await page.goto(base); await preferences(page);
    await page.locator('#site-language').selectOption('de'); await expect(page.locator('.mode-status').first()).toHaveText('Anmeldung nötig');
    await page.locator('#site-language').selectOption('en'); await expect(page.locator('.mode-status').first()).toHaveText('sign-in required');
  });

  test('F11 dated design correction preserves the original historical default', async () => {
    const doc = await readSource('docs/DESIGN-PASS-20261029.uk.md');
    metrics.F11 = { correction: /29\.10\.2026.*b083c07.*Synera.*Atelier/.test(doc) };
    expect(metrics.F11.correction).toBe(true);
    expect(doc).toContain('Atelier — стартовий вигляд');
  });
});
