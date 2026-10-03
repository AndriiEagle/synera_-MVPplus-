import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = process.cwd();
const out = path.join(root, 'artifacts', 'ux-20261003', 'regression');
const red = process.argv.includes('--red');
const mutationConsent = process.argv.includes('--mutation-consent');
await fs.mkdir(out, { recursive: true });
const server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { cwd: root, env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
const origin = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(output || 'Server did not start.')), 10000);
  server.stdout.on('data', chunk => { output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } });
  server.on('error', reject);
});
const browser = await chromium.launch({ headless: true, executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE || chromium.executablePath() });
const page = await browser.newPage({ viewport: { width: 320, height: 720 }, reducedMotion: 'reduce' });
const checks = [];
try {
  await page.goto(`${origin}/studio-journey.html`, { waitUntil: 'networkidle' });
  await page.locator('#journey-give').selectOption('automation');
  await page.locator('#journey-need').selectOption('design');
  await page.locator('#journey-language').selectOption('uk');
  await page.locator('#journey-communication').selectOption('video');
  await page.locator('#journey-fit-consent').check();
  await page.locator('#journey-visibility').check();
  await page.getByRole('button', { name: 'Знайти взаємну користь ↗', exact: true }).click();
  await page.locator('#journey-markers button').filter({ hasText: 'Mara' }).click();
  const typed = 'Я збережу typed контекст і принесу код першого екрана.';
  await page.locator('#journey-message').fill(typed);
  await page.locator('#journey-send').click();
  await page.locator('#journey-open-proposal').click();
  const when = new Date(Date.now() + 86400000).toISOString().slice(0, 10) + 'T18:00';
  await page.locator('#journey-when').fill(when);
  await page.locator('#journey-place').selectOption('Центр Цюриха — умовне місце');
  await page.locator('#journey-duration').selectOption('60');
  await page.locator('#journey-scope').fill('Перевірити перший екран MVP разом.');
  await page.getByRole('button', { name: 'Запропонувати ці умови ↗', exact: true }).click();
  await page.getByRole('button', { name: 'Mara: сценарне «так»', exact: true }).click();
  await page.getByRole('button', { name: 'Я підтверджую цю версію', exact: true }).click();
  assert.equal(await page.locator('#journey-fit-consent').isChecked(), true);
  assert.equal(await page.locator('#journey-visibility').isChecked(), true);
  assert.equal(await page.locator('.journey-message[data-author="you"] p').last().innerText(), typed);
  assert.equal(await page.locator('#journey-complete').isVisible(), true);
  checks.push('existing consents, typed message, and current approvals survive baseline flow');
  const toggle = page.getByRole('button', { name: 'Спокійний режим', exact: true });
  if (red) {
    assert.equal(await toggle.count(), 0, 'Baseline has no quiet toggle yet.');
    await fs.writeFile(path.join(out, 'BASELINE_RED.json'), JSON.stringify({ status: 'EXPECTED_RED', checks, missing: 'Спокійний режим accessible toggle' }, null, 2));
  } else {
    assert.equal(await toggle.count(), 1, 'QUIET_TOGGLE_REQUIRED');
    if (mutationConsent) await toggle.evaluate(button => button.addEventListener('click', () => { document.querySelector('#journey-fit-consent').checked = false; }, { once: true }));
    await toggle.click();
    assert.equal(await page.locator('html').getAttribute('data-synera-focus'), 'on');
    const preserved = async () => {
      assert.equal(await page.locator('#journey-fit-consent').isChecked(), true);
      assert.equal(await page.locator('#journey-visibility').isChecked(), true);
      assert.equal(await page.locator('#journey-language').inputValue(), 'uk');
      assert.equal(await page.locator('#journey-communication').inputValue(), 'video');
      assert.equal(await page.locator('#journey-place').inputValue(), 'Центр Цюриха — умовне місце');
      assert.equal(await page.locator('#journey-duration').inputValue(), '60');
      assert.equal(await page.locator('.journey-message[data-author="you"] p').last().innerText(), typed);
      assert.equal(await page.locator('#journey-complete').isVisible(), true);
    };
    if (mutationConsent) {
      let cause = '';
      try { await preserved(); } catch (error) { cause = error.message; }
      assert.ok(cause, 'MUTATION_CONSENT_RESET_WAS_NOT_REJECTED');
      checks.push('mutation reset consent and guard rejected the changed checkbox');
      await fs.writeFile(path.join(out, 'MUTATION.json'), JSON.stringify({ status: 'EXPECTED_REJECTION', mutation: 'toggle listener reset #journey-fit-consent', cause, checks }, null, 2));
    } else {
      await preserved();
      checks.push('quiet toggle preserves non-default preferences, terms, consents, typed message, and current approvals');
      await fs.writeFile(path.join(out, 'ACCEPTANCE.json'), JSON.stringify({ status: 'PASS', viewport: { width: 320, height: 720 }, reducedMotion: true, checks }, null, 2));
    }
  }
  console.log(red ? 'EXPECTED_RED quiet toggle absent; existing invariants pass' : 'PASS quiet regression');
} catch (error) {
  await fs.writeFile(path.join(out, red ? 'FAILURE_RED.json' : 'FAILURE.json'), JSON.stringify({ status: 'FAIL', message: error.message, checks }, null, 2));
  console.error(error.stack || error.message); process.exitCode = 1;
} finally {
  await browser.close(); server.kill();
}
