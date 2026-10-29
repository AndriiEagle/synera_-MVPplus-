// Task-scoped local capture. The external canonical script is unchanged.
import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { openSync, closeSync } from 'node:fs';

const out = 'docs/argon-fixes-20261029/shots';
const base = 'http://127.0.0.1:49611';
await mkdir(out, { recursive: true });
const serverLog = openSync(out + '/server.log', 'w');
const server = spawn(process.execPath, ['web_launch/server.mjs'], { env: { ...process.env, SYNERA_PORT: '49611' }, stdio: ['ignore', serverLog, serverLog] });
let browser;
try {
  for (let i = 0; ; i++) {
    if (server.exitCode !== null) throw new Error('capture server exited: ' + server.exitCode);
    try { if ((await fetch(base)).ok) break; } catch {}
    if (i === 100) throw new Error('capture server startup timeout');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const log = openSync(out + '/canonical-shots.log', 'w');
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['C:/Users/Andrii/.claude/skills/synera/scripts/shots.mjs', out, 'main=' + base], { stdio: ['ignore', log, log] });
      child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error('canonical shots exit=' + code)));
    });
  } finally { closeSync(log); }
  const report = JSON.parse(await readFile(out + '/report.json', 'utf8'));
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  // The canonical script captures these four screens on iPhone only. Complete the Pixel set.
  for (const screen of ['summit', 'studio', 'triangle', 'rooms']) {
    const context = await browser.newContext({ ...devices['Pixel 7'], viewport: { width: 412, height: 915 }, serviceWorkers: 'block' });
    try {
      await context.addInitScript(() => localStorage.setItem('synera.first-user-tour.v1', 'done'));
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      const response = await page.goto(base + '/' + screen + '.html', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, innerW: innerWidth }));
      const file = `main-android-${screen}.png`;
      await page.screenshot({ path: out + '/' + file });
      report.push({ file, target: 'main', phone: 'android', screen, status: response.status(), ...geometry, hscroll: geometry.scrollW > geometry.innerW, errors });
    } finally { await context.close(); }
  }
  for (const [phone, device] of [['iphone', 'iPhone 13'], ['android', 'Pixel 7']]) {
    const context = await browser.newContext({ ...devices[device], serviceWorkers: 'block' });
    try {
      const page = await context.newPage(); await page.goto(base + '/triangle.html', { waitUntil: 'networkidle' });
      await page.locator('.triangle-card').screenshot({ path: `${out}/main-${phone}-triangle-diagram.png` });
    } finally { await context.close(); }
  }
  for (const phone of ['iphone', 'android']) for (const screen of ['home', 'summit', 'studio', 'triangle', 'real-journey', 'rooms']) {
    if (!report.some(row => row.phone === phone && row.screen === screen && row.status === 200 && !row.hscroll && !row.failed && row.errors.length === 0)) throw new Error('missing clean screenshot: ' + phone + '/' + screen);
  }
  await writeFile(out + '/complete-report.json', JSON.stringify(report, null, 2));
  console.log('PASS: all six pages on both emulated phones; ' + report.length + ' page captures + 2 diagram details');
} finally {
  await browser?.close();
  if (server.exitCode === null) { server.kill(); await new Promise(resolve => server.once('exit', resolve)); }
  closeSync(serverLog);
}
