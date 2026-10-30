import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';

let server, base;
test.beforeAll(async () => {
  server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  base = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(Error('Google test server unavailable: ' + output)), 30000);
    server.stdout.on('data', chunk => { output += chunk; const url = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]; if (url) { clearTimeout(timer); resolve(url); } });
    server.once('exit', () => { clearTimeout(timer); reject(Error('Google test server exited')); });
  });
});
test.afterAll(() => server?.kill());

async function fixture(page, { language = 'uk', ready = true, restored = false, policy = false, name = 'Demo Ada', saved = '', fail = false, preview = false } = {}) {
  const writes = [], starts = [];
  let signedIn = restored, accepted = policy;
  await page.addInitScript(code => { localStorage.setItem('synera.real-journey.language.v1', code); }, language);
  await page.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin !== base) return route.abort();
    if (url.pathname === '/config.json') return route.fulfill({ json: preview ? {} : { backend: 'neon', registrationEnabled: true, googleOauthReady: ready, googleOAuthEnabled: ready, googleOAuthInitUrl: 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth/sign-in/social/init', realPilotEnabled: true, pilotSafetyEnabled: true } });
    if (url.pathname === '/api/neon/health') return route.fulfill({ json: { ok: true } });
    if (url.pathname === '/api/neon/oauth/google/start') {
      starts.push(req.method());
      if (fail) return route.fulfill({ status: 303, headers: { location: base + '/?signin=google-error' }, body: '' });
      return route.fulfill({ contentType: 'text/html', body: '<a href="/?google_fixture_return=1">Choose Demo Ada</a>' });
    }
    if (url.pathname === '/' && url.searchParams.get('google_fixture_return') === '1') signedIn = true;
    if (url.pathname === '/api/neon/session') return route.fulfill({ json: { user: signedIn ? { id: 'demo-user', email: 'private@example.com', name } : null } });
    if (url.pathname === '/api/neon/logout') { signedIn = false; return route.fulfill({ json: { signedOut: true } }); }
    if (url.pathname.startsWith('/api/neon/data/')) {
      if (req.method() !== 'GET') writes.push({ path: url.pathname, body: req.postDataJSON() });
      if (url.pathname.endsWith('/pilot_consents')) {
        if (req.method() === 'POST') accepted = true;
        return route.fulfill({ json: req.method() === 'GET' && accepted ? [{ policy_version: '2026-09-05-pilot-3' }] : [] });
      }
      if (url.pathname.endsWith('/profiles') && url.searchParams.get('id') === 'eq.demo-user') return route.fulfill({ json: saved ? [{ id: 'demo-user', display_name: saved, city: '', offers: '', seeks: '', is_discoverable: false, map_visible: false }] : [] });
      return route.fulfill({ json: [] });
    }
    return route.continue();
  });
  return { writes, starts };
}

for (const [device, width, height] of [['iphone13', 390, 844], ['pixel7', 412, 915]]) {
  test(`Google first action and private editable draft within three taps (${device})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const { writes, starts } = await fixture(page);
    await page.goto(base);
    const google = page.getByRole('button', { name: 'Продовжити з Google', exact: true });
    await expect(google).toBeInViewport();
    await expect(page.locator('#email')).toBeHidden();
    await expect(page.locator('#prepare-profile')).toBeHidden();
    await fs.mkdir('docs/google-20261030', { recursive: true });
    await page.screenshot({ path: `docs/google-20261030/${device}-signin.png` });
    let taps = 1; // Installed icon; navigation above represents launch.
    await google.click(); taps++;
    await page.getByRole('link', { name: 'Choose Demo Ada' }).click(); taps++;
    await expect(page.locator('#workspace')).toBeVisible();
    const displayName = page.locator('[name="display_name"]');
    await expect(displayName).toHaveValue('Demo Ada');
    await expect(displayName).toBeEditable();
    expect(taps).toBeLessThanOrEqual(3); // Extra Google security challenges require separate live acceptance.
    await displayName.fill('My chosen name');
    await expect(page.locator('#policy-dialog')).not.toBeVisible();
    await expect(page.locator('[name="is_discoverable"]')).not.toBeChecked();
    await expect(page.locator('[name="map_visible"]')).not.toBeChecked();
    expect(writes).toEqual([]); expect(starts).toEqual(['GET']);
    await page.locator('#profile-policy').click();
    await expect(page.locator('#policy-dialog')).toBeVisible();
    await expect(page.locator('#accept-terms')).not.toBeChecked();
    await expect(page.locator('#accept-privacy')).not.toBeChecked();
    await page.locator('#policy-form button[type=submit]').click();
    expect(writes).toEqual([]);
    await page.locator('#accept-terms').check();
    await page.locator('#accept-privacy').check();
    await page.locator('#policy-form button[type=submit]').click();
    await expect(page.locator('#policy-dialog')).not.toBeVisible();
    await expect(displayName).toHaveValue('My chosen name');
    expect(writes.map(row => row.path)).toEqual(['/api/neon/data/pilot_consents']);
    await expect(page.locator('[name="is_discoverable"]')).not.toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.screenshot({ path: `docs/google-20261030/${device}-draft.png` });
  });
}

test('Returning session restores without taps, preserves saved name and signs out from header', async ({ page }) => {
  await fixture(page, { restored: true, policy: true, saved: 'Chosen before Google' });
  await page.goto(base);
  await expect(page.locator('#workspace')).toBeVisible();
  await expect(page.locator('[name="display_name"]')).toHaveValue('Chosen before Google');
  await page.locator('.header-preferences > summary').click();
  await page.locator('#logout').click();
  await expect(page.locator('#workspace')).toBeHidden();
  await expect(page.locator('#google-signin')).toBeVisible();
  await page.reload();
  await expect(page.locator('#workspace')).toBeHidden();
});

test('Google cancellation opens email fallback with an honest message', async ({ page }) => {
  await fixture(page, { fail: true });
  await page.goto(base); await page.locator('#google-signin').click();
  await expect(page.locator('#notice')).toContainText('Google');
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#policy-dialog')).not.toBeVisible();
});

for (const [language, label, fallback] of [['uk', 'Продовжити з Google', 'або код на пошту'], ['de', 'Weiter mit Google', 'oder Code per E-Mail'], ['en', 'Continue with Google', 'or email code']]) {
  test(`Google and email actions follow locale ${language}`, async ({ page }) => {
    await fixture(page, { language }); await page.goto(base);
    await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
    await page.getByRole('button', { name: fallback, exact: true }).click();
    await expect(page.locator('#email')).toBeVisible();
  });
}

test('Preview shows local draft and Demo with no dead Google action', async ({ page }) => {
  await fixture(page, { preview: true }); await page.goto(base);
  await expect(page.locator('#auth-closed')).toContainText('Demo');
  await expect(page.locator('#google-signin')).toBeHidden();
  await page.locator('#auth-closed a').click();
  await expect(page.locator('[name="display_name"]')).toBeEditable();
});

test('No ready flag means no Google action; email-shaped names never prefill', async ({ page }) => {
  await fixture(page, { ready: false, restored: true, name: 'private@example.com' });
  await page.goto(base);
  await expect(page.locator('#google-signin')).toBeHidden();
  await expect(page.locator('[name="display_name"]')).toHaveValue('');
});
