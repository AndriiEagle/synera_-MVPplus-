import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const integrationCwd = path.resolve(root, '..', '..');
const phases = [
  ['before-e39', process.env.SYNERA_BASELINE_CWD || path.resolve(integrationCwd, '..', 'synera-qr-bill-guard')],
  ['after-integration', integrationCwd],
];

async function startServer(cwd) {
  const child = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], {
    cwd, env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const url = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`Server start timeout: ${output}`)), 15000);
    child.stdout.on('data', chunk => {
      output += String(chunk);
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
    child.stderr.on('data', chunk => { output += String(chunk); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exit ${code}: ${output}`)); });
  });
  return { child, url };
}

const browser = await chromium.launch({ headless: true });
const rows = [];
try {
  for (const [phase, cwd] of phases) {
    const folder = path.join(root, phase);
    await mkdir(folder, { recursive: true });
    const { child, url } = await startServer(cwd);
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
      const page = await context.newPage();
      const shot = async (name, expected, actual) => {
        const file = path.join(folder, `${name}.png`);
        await page.screenshot({ path: file, fullPage: true });
        rows.push({ phase, step: name, expected, actual, screenshot: path.relative(root, file) });
      };
      await page.goto(url);
      await page.locator('#mode').filter({ hasText: 'Вхід ще не підключено' }).waitFor();
      await shot('01-landing', 'Landing loads and login remains gated', await page.locator('#mode').innerText());
      await page.locator('#prepare-profile').click();
      await shot('02-guest-draft', 'Guest draft opens without real login', `workspace visible=${await page.locator('#workspace').isVisible()}`);
      for (const [tab, n] of [['profile', '03'], ['people', '04'], ['meetings', '05'], ['settings', '06']]) {
        await page.locator(`button[data-tab="${tab}"]`).click();
        await shot(`${n}-${tab}`, `Click ${tab} tab`, `notice=${await page.locator('#notice').innerText()}; view=${await page.locator(`#${tab}-view`).isVisible()}`);
      }
      if (phase === 'after-integration') {
        await page.locator('#style-toggle').click();
        await shot('07-original-toggle', 'Original style selected', await page.locator('html').getAttribute('data-synera-style'));
        await page.locator('#style-toggle').click();
        await shot('08-atelier-toggle', 'Atelier style restored', await page.locator('html').getAttribute('data-synera-style'));
      }
      await page.goto(`${url}/legal.html`);
      await shot('09-active-legal', 'Served legal version matches login policy', await page.locator('.badge').innerText());
      await page.goto(`${url}/catalogue.html`);
      await shot('10-catalogue', 'Catalogue loads', await page.title());
      await page.setViewportSize({ width: 375, height: 700 });
      await page.goto(url);
      await page.locator('#mode').filter({ hasText: 'Вхід ще не підключено' }).waitFor();
      await shot('11-mobile-landing', 'Landing remains readable at 375px', `h1 visible=${await page.locator('h1').first().isVisible()}`);
      await context.close();
    } finally { child.kill(); }
  }
} finally { await browser.close(); }
await writeFile(path.join(root, 'journey.json'), JSON.stringify({ capturedAt: new Date().toISOString(), rows, unreachable: ['real login without backend', 'live match without authorized participants', 'two-party terms without live acceptance', 'payment without agreed invoice and receipt'] }, null, 2));
console.log(JSON.stringify({ screenshots: rows.length, before: rows.filter(row => row.phase === 'before-e39').length, after: rows.filter(row => row.phase === 'after-integration').length }));
