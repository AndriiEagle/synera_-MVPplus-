import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const output = 'artifacts/design-20261003/video';
await fs.mkdir(output, { recursive: true });
const server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
const base = await new Promise((resolve, reject) => {
  let text = ''; const timer = setTimeout(() => reject(new Error('server timeout')), 10000);
  server.stdout.on('data', chunk => { text += chunk; const found = text.match(/http:\/\/127\.0\.0\.1:\d+/); if (found) { clearTimeout(timer); resolve(found[0]); } });
  server.on('exit', () => { clearTimeout(timer); reject(new Error('server stopped')); });
});
async function capture(name, configure) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: output, size: { width: 390, height: 844 } }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage(); const external = [];
  page.on('request', request => { if (!request.url().startsWith(base)) external.push(request.url()); });
  await page.goto(base + '/studio.html'); await page.waitForTimeout(700);
  await configure(page); await page.waitForTimeout(900);
  const video = page.video(); await page.close(); await context.close(); await browser.close();
  const path = await video.path(); const target = `${output}/${name}.webm`; await fs.rename(path, target);
  if (external.length) throw new Error(`external request: ${external.join(', ')}`);
  return target;
}
const current = await capture('01-current-studio', async page => {
  await page.locator('#fit-consent').check(); await page.locator('#fit-public').check(); await page.waitForTimeout(400);
  await page.locator('#fit-form button').click(); await page.waitForTimeout(700);
  await page.locator('[data-step=session]').click(); await page.waitForTimeout(700);
});
const atelier = await capture('02-atelier-studio', async page => {
  await page.getByText('Вигляд', { exact: true }).click(); await page.waitForTimeout(350);
  await page.getByRole('button', { name: 'Atelier 2026', exact: true }).click(); await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Сливовий', exact: true }).click(); await page.waitForTimeout(500);
  await page.getByText('Вигляд', { exact: true }).click(); await page.waitForTimeout(400);
  await page.locator('#fit-consent').check(); await page.locator('#fit-public').check(); await page.locator('#fit-form button').click(); await page.waitForTimeout(700);
});
await fs.writeFile(`${output}/RECEIPT.json`, JSON.stringify({ status: 'PASS', source: 'real local Synera Studio', viewport: '390x844', clips: [current, atelier], externalRequests: 0, notes: ['local demo data only', 'no voice, map SDK, live people, video call, or external AI shown'] }, null, 2) + '\n');
server.kill(); console.log(JSON.stringify({ status: 'PASS', clips: [current, atelier] }));
