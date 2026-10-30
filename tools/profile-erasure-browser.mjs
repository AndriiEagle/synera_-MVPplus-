// Real controls; synthetic account transport. No production account is erased.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { A, config, createFixture } from './fixtures/real-journey-fixture.mjs';

const proof = process.env.SYNERA_ACCEPTANCE_OUTPUT || 'artifacts/gemini-implementation-20261017';
await fs.mkdir(proof, { recursive: true });
const report = { status: 'NOT_ACCEPTED', checks: [], scope: 'Real Chromium 390x844; synthetic account/API, no signed JWT, live Neon or provider deletion', provider_calls: 0, provider_usd: 0 };
const server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
let browser;
try {
  const base = await new Promise((resolve, reject) => {
    let output = ''; const timer = setTimeout(() => reject(Error('Local server unavailable')), 20000);
    server.stdout.on('data', chunk => { output += chunk; const url = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]; if (url) { clearTimeout(timer); resolve(url); } });
    server.once('exit', code => { clearTimeout(timer); reject(Error('Server exit ' + code)); });
  });
  browser = await chromium.launch({ headless: true, timeout: 20000, executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE || chromium.executablePath() });
  for (const enabled of [false, true]) {
    const db = createFixture(), context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    await context.addInitScript(() => localStorage.setItem('synera.first-user-tour.v1', 'done'));
    const page = await context.newPage(), errors = [], requests = []; let fail = true, mismatch = false;
    page.setDefaultTimeout(12000); page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin !== base) { await route.abort(); return; }
      if (url.pathname === '/config.json') { await route.fulfill({ json: { ...config, profileErasureEnabled: enabled } }); return; }
      if (url.pathname === '/api/neon/health') { await route.fulfill({ json: { ok: true } }); return; }
      if (url.pathname === '/api/neon/profile-erasure') {
        requests.push(JSON.parse(request.postData()));
        await route.fulfill({ status: mismatch ? 409 : fail ? 503 : 200, json: mismatch ? {error:'profile_erasure_subject_mismatch'} : fail ? { error: 'profile_erasure_unconfirmed' } : { status: 'application_data_erased', providerDeletion: 'pending', retainedScope: 'bilateral_records_and_safety_evidence', repeated: false, sessionRevoked: true } }); return;
      }
      if (url.pathname.startsWith('/api/neon/')) {
        const response = await db.fetchFor(A)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() }); return;
      }
      await route.continue();
    });
    await page.goto(base + '/');
    try { try { await page.waitForFunction(() => !document.getElementById('workspace').hidden); } catch (error) { report.bootstrap = { errors, requests: db.requests, notice: await page.locator('#notice').innerText(), mode: await page.locator('#mode').innerText() }; throw error; } }
    catch (error) { report.bootstrap = { errors, requests: db.requests, notice: await page.locator('#notice').innerText(), mode: await page.locator('#mode').innerText() }; throw error; }
    await page.locator('[data-tab="settings"]').click();
    const controls = page.locator('#profile-erasure-controls');
    assert.equal(await controls.isHidden(), !enabled);
    assert.equal(await page.locator('#delete-profile').isVisible(), false);
    if (enabled) {
      await controls.locator('summary').click();
      assert.match(await controls.innerText(), /повідомлення, адреси та записи безпеки збережуться/);
      assert.match(await controls.innerText(), /облікового запису для входу ще потребує оператора/);
      const field = page.locator('#profile-erasure-confirmation'), submit = page.locator('#profile-erasure-form button');
      await field.fill('wrong'); await submit.click(); assert.equal(requests.length, 0);
      await field.fill('DELETE'); await submit.click(); await page.waitForFunction(() => document.querySelector('#auth-form').getAttribute('aria-busy') === 'false');
      assert.equal(await page.locator('#workspace').isVisible(), true); assert.equal(await field.inputValue(), 'DELETE');
      assert.equal(await page.locator('#profile-form [name="display_name"]').inputValue(), db.profiles[0].display_name);
      report.checks.push('error preserves account and form; invalid confirmation makes zero requests');
      await page.locator('.header-preferences > summary').click();
      await page.locator('#logout').click();
      await page.waitForFunction(() => document.getElementById('workspace').hidden);
      assert.equal(await field.inputValue(), '', 'typed deletion confirmation leaked through logout into the next account');
      await page.reload(); await page.waitForFunction(() => !document.getElementById('workspace').hidden);
      await page.locator('[data-tab="settings"]').click(); await controls.locator('summary').click(); await field.fill('DELETE');
      report.checks.push('normal logout clears typed destructive confirmation before another sign-in');
      report.focus_geometry = [];
      for (const width of [320,390]) {
        await page.setViewportSize({width,height:844});
        await field.evaluate(el=>{el.blur();window.scrollTo(0,0);el.focus();});
        const geometry=await field.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {width:innerWidth,top:r.top,bottom:r.bottom,height:innerHeight,focused:document.activeElement===el,unobscured:hit===el||el.contains(hit)};});
        report.focus_geometry.push(geometry);
        assert.ok(geometry.focused&&geometry.unobscured&&geometry.top>=0&&geometry.bottom<=geometry.height,'Focused erasure confirmation must remain visible above navigation');
        await page.keyboard.press('Tab');
        assert.equal(await submit.evaluate(el=>document.activeElement===el),true,'Keyboard must reach explicit erasure button');
      }
      report.checks.push('320/390 actual focus and keyboard reach erasure confirmation without navigation occlusion');
      assert.deepEqual((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.filter(row => ['critical', 'serious'].includes(row.impact)), []);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `${proof}/profile-erasure-390x844.png`, fullPage: true });
      mismatch = true; await submit.click(); await page.waitForFunction(() => document.getElementById('workspace').hidden);
      assert.equal(await field.inputValue(), ''); assert.equal(await page.locator('#profile-form [name="display_name"]').inputValue(), '');
      assert.equal(await page.locator('#people').evaluate(el=>el.childElementCount),0);
      assert.match(await page.locator('#notice').innerText(), /Нічого не стерто.*перевір акаунт/);
      report.checks.push('subject mismatch clears stale private UI and typed confirmation, asks for fresh account confirmation without success claim');
      mismatch = false; await page.reload(); await page.waitForFunction(() => !document.getElementById('workspace').hidden);
      await page.locator('[data-tab="settings"]').click(); await controls.locator('summary').click(); await field.fill('DELETE');
      fail = false; await submit.click(); await page.waitForFunction(() => document.getElementById('workspace').hidden);
      assert.equal(await field.inputValue(), ''); assert.equal(await page.locator('#profile-form [name="display_name"]').inputValue(), '');
      assert.equal(await page.locator('#consent-panel input:checked').count(), 0);
      assert.match(await page.locator('#notice').innerText(), /Видалення акаунта для входу очікує оператора/);
      assert.deepEqual(requests, Array.from({length:3},()=>({confirm:'ERASE_APPLICATION_DATA',expectedSubject:A})));
      report.checks.push('success purges current local form/consents and reports retained records plus pending provider deletion');
    } else report.checks.push('default off keeps direct DELETE disabled');
    assert.deepEqual(errors, []); await context.close();
  }
  report.source_sha256 = Object.fromEntries(await Promise.all(['web_launch/app.mjs', 'web_launch/index.html', 'web_launch/neon-store.mjs', 'tools/profile-erasure-browser.mjs'].map(async file => [file, createHash('sha256').update(await fs.readFile(file)).digest('hex')])));
  report.status = 'PASS_LOCAL_PROFILE_ERASURE_BROWSER';
} catch (error) { report.error = error.message; throw error; }
finally { await browser?.close(); server.kill(); await fs.writeFile(`${proof}/ERASURE_BROWSER.json`, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify(report));
