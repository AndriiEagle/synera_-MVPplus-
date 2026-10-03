// Screenshot-first visual audit of the current local product. It intentionally
// uses no sign-in, production endpoint, private profile or provider service.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = process.cwd();
const out = path.join(root, 'artifacts', 'design-20261003', 'audit');
await fs.mkdir(out, { recursive: true });
const relevant = ['index.html','app.mjs','style.css','summit.html','summit.mjs','summit.css','studio.html','studio.mjs','studio.css','triangle.html','triangle.mjs','triangle.css','map.mjs','config.mjs'];
const source = {};
for (const file of relevant) {
  const data = await fs.readFile(path.join(root, 'web_launch', file));
  source['web_launch/' + file] = createHash('sha256').update(data).digest('hex');
}
const server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { cwd: root, env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore','pipe','pipe'] });
const base = await new Promise((resolve, reject) => {
  let log = ''; const timer = setTimeout(() => reject(Error('Local server did not start: ' + log)), 12000);
  server.stdout.on('data', chunk => { log += chunk; const found = log.match(/http:\/\/127\.0\.0\.1:\d+/); if (found) { clearTimeout(timer); resolve(found[0]); } });
  server.stderr.on('data', chunk => { log += chunk; }); server.on('exit', code => reject(Error('Local server exited ' + code + ': ' + log)));
});
const browser = await chromium.launch({ headless: true });
const viewport = { width: 390, height: 844 };
const entries = [];
async function pageAt(route) {
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, serviceWorkers: 'block', reducedMotion: 'reduce', colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto(base + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(120);
  return { page, context };
}
async function shot(name, route, state, prepare) {
  const { page, context } = await pageAt(route);
  try {
    if (prepare) await prepare(page);
    await page.waitForTimeout(180);
    const file = path.join(out, name + '.png');
    await page.screenshot({ path: file, fullPage: true });
    const stat = await fs.stat(file); assert.ok(stat.size > 5000, name + ' screenshot was unexpectedly small');
    entries.push({ file: name + '.png', route, state, bytes: stat.size, sha256: createHash('sha256').update(await fs.readFile(file)).digest('hex') });
  } finally { await context.close(); }
}
try {
  await shot('01-main-welcome','/','Unauthenticated local demo entry; no profile or map data is asserted.');
  await shot('02-summit-hero','/summit.html','Public product-preview hero; fictional profiles.', async page => { await page.locator('main').waitFor(); });
  await shot('03-summit-discover','/summit.html#experience','Public synthetic Discover demo; nothing is sent or saved.', async page => { await page.locator('#experience').scrollIntoViewIfNeeded(); });
  await shot('04-studio-fit','/studio.html','Studio 04 initial give-and-take form; fictional/local only.');
  await shot('05-studio-fit-result','/studio.html','Studio 04 local fit explanation after explicit consented synthetic input.', async page => {
    await page.locator('#fit-consent').check(); await page.locator('#fit-public').check(); await page.locator('#fit-form button[type=submit]').click();
    await page.locator('#fit-results article').first().waitFor();
  });
  await shot('06-studio-session','/studio.html','Studio local shared-screen session setup, before any saved notes.', async page => { await page.getByRole('button', { name: /Сесія/ }).click(); await page.locator('#step-session:not([hidden])').waitFor(); });
  await shot('07-studio-result','/studio.html','Studio result screen; social package is disabled before current-result confirmation.', async page => { await page.getByRole('button', { name: /Результат/ }).click(); await page.locator('#step-value:not([hidden])').waitFor(); });
  await shot('08-studio-memory','/studio.html','Studio archive/device consent screen; plaintext/local limitations are visibly stated.', async page => { await page.getByRole('button', { name: /Пам’ять/ }).click(); await page.locator('#step-memory:not([hidden])').waitFor(); });
  await shot('09-triangle-intro','/triangle.html','Triangle L initial local-room setup; explicit shared-screen acknowledgement.', async page => { await page.locator('#room-setup').waitFor(); });
  await shot('10-triangle-workspace','/triangle.html','Triangle L after locally creating one workspace; no remote participants.', async page => {
    await page.locator('#room-goal').fill('Узгодити перший перевірний крок'); await page.locator('#local-understood').check(); await page.locator('#room-setup button[type=submit]').click(); await page.locator('#room-workspace:not([hidden])').waitFor();
  });
  await shot('11-atlas-map','/triangle.html','Atlas opportunity map with fictional cards and filters; not a live people map.', async page => { await page.getByRole('button', { name: /Жива карта/ }).click(); await page.locator('#pane-atlas:not([hidden])').waitFor(); });
  await shot('12-launch-permissions','/triangle.html','Launch/economics and five-context trust model; future permission model is labelled as such.', async page => { await page.getByRole('button', { name: /Запуск/ }).click(); await page.locator('#pane-launch:not([hidden])').waitFor(); });
  const manifest = { captured_at: new Date().toISOString(), base, viewport, source, entries, limits: ['Chromium computer emulation only; not a physical Android device.', 'All captured states use local --demo server and no authenticated production account.', 'Studio/Triangle data shown is local or fictional; no independent participant, meeting or result was created.', 'Screenshot review cannot prove accessibility compliance, live RLS, Maps SDK, voice/video, AI assistant or social publishing.'], provider_calls: 0, media_generation_calls: 0 };
  await fs.writeFile(path.join(out, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ pass: true, captures: entries.length, directory: out, base, provider_calls: 0 }));
} finally { await browser.close(); server.kill(); }
