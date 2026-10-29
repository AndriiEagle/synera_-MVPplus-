import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { A, B, config, fields } from './fixtures/real-journey-fixture.mjs';
import { createOutcomeFixture } from './fixtures/case-outcome-fixture.mjs';
import { compareRealProfiles } from '../web_launch/profile-brief.mjs';

const dir = 'artifacts/audit-followup-20261019/paid-journey-browser';
await fs.mkdir(dir, { recursive: true });
const sourceFiles = ['web_launch/real-journey.html', 'web_launch/real-journey.mjs', 'web_launch/real-journey-client.mjs', 'web_launch/real-journey-i18n.mjs', 'web_launch/action-scoper.mjs', 'tools/audit-paid-journey-browser.mjs'];
const sourceHashes = Object.fromEntries(await Promise.all(sourceFiles.map(async file => [file, createHash('sha256').update(await fs.readFile(file)).digest('hex')])));
const db = createOutcomeFixture(), errors = [], checks = {}; let rejectNextSave = false;
const buyerProfile = db.profiles.find(profile => profile.id === A), supplierProfile = db.profiles.find(profile => profile.id === B);
Object.assign(buyerProfile.brief, { offer_tags: [], need_tags: ['design'], modes: ['paid_service'], mode_details: { paid_service: { role: 'buyer' } } });
Object.assign(supplierProfile.brief, { offer_tags: ['design'], need_tags: [], modes: ['paid_service'], mode_details: { paid_service: { role: 'supplier' } } });
const paidMatch = compareRealProfiles(buyerProfile, supplierProfile, { asOf: buyerProfile.updated_at.slice(0, 10) });
assert.equal(paidMatch.modeCandidates.find(candidate => candidate.mode === 'paid_service')?.status, 'eligible'); checks.buyer_profile_has_no_offer_and_paid_match_is_eligible = true;
const server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { cwd: process.cwd(), env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
const base = await new Promise((resolve, reject) => { let text = ''; const timer = setTimeout(() => reject(Error(text || 'Local server unavailable')), 30000); server.stdout.on('data', chunk => { text += chunk; const found = text.match(/http:\/\/127\.0\.0\.1:\d+/); if (found) { clearTimeout(timer); resolve(found[0]); } }); server.on('exit', code => reject(Error('Server exit ' + code))); });
const browser = await chromium.launch({ headless: true, executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE || chromium.executablePath() });
const contexts = [];
async function pageFor(id, viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' }); contexts.push(context);
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  await page.route('**/config.json', route => route.fulfill({ json: { ...config, caseOutcomesEnabled: true } }));
  await page.route('**/api/neon/**', async route => {
    const request = route.request(), url = new URL(request.url());
    if (rejectNextSave && request.method() !== 'GET' && url.pathname.endsWith('/match_cases')) { rejectNextSave = false; return route.fulfill({ status: 413, contentType: 'application/json', body: '{}' }); }
    const response = await db.fetchFor(id)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
    return route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  await page.goto(base + '/real-journey.html'); await page.locator('#real-content-panel').waitFor({ state: 'visible' }); return page;
}
const ready = page => page.waitForFunction(() => !document.body.dataset.realBusy);
async function open(page, id) { const panel = page.locator('#' + id); if (!await panel.evaluate(node => node.open)) await panel.locator('summary').first().click(); }
async function choose(page, name) { await open(page, 'real-people-panel'); await page.locator('#real-people article').filter({ hasText: name }).getByRole('button').click(); await ready(page); }
async function fill(page, values) { await open(page, 'real-editor'); for (const [name, value] of Object.entries(values)) { const input = page.locator(`#real-terms-form [name="${name}"]`); if (await input.evaluate(node => node.tagName === 'SELECT')) await input.selectOption(value); else await input.fill(value); } }
async function approve(page) { await page.locator('#real-approve-check').check(); await page.locator('#real-approve').click(); await ready(page); }
async function refresh(page) { await page.locator('#real-refresh').click(); await ready(page); }
try {
  const buyer = await pageFor(A), supplier = await pageFor(B);
  await choose(buyer, 'Тест Марія');
  const paid = fields({ mode: 'paid_service', paid_direction: 'buyer', give_tag: '', give_target: '', give_criteria: '', compensation_status: 'agreed_money', amount: '125.50', currency: 'CHF', invoice: 'yes' });
  await fill(buyer, paid);
  assert.equal(await buyer.locator('#real-give-terms').isHidden(), true);
  await buyer.locator('#real-terms-form button[type=submit]').click(); await ready(buyer);
  assert.equal(db.cases.length, 1); assert.equal(db.cases[0].material.trial.deliverables.length, 1); assert.deepEqual(db.cases[0].material.trial.deliverables[0].giver_id, B); checks.buyer_no_offer_one_supplier_deliverable = true;
  await buyer.screenshot({ path: dir + '/01-buyer-paid-terms.png', fullPage: true });
  await approve(buyer); await refresh(supplier); await choose(supplier, 'Тест Андрій');
  assert.equal(await supplier.locator('[name=paid_direction]').inputValue(), 'supplier'); assert.equal(await supplier.locator('#real-take-terms').isHidden(), true); await approve(supplier); assert.equal(db.approvals.length, 2); checks.two_independent_approvals = true;
  await buyer.locator('#real-outcome-refresh').click(); await ready(buyer); await supplier.locator('#real-outcome-refresh').click(); await ready(supplier);
  const card = supplier.locator('[data-outcome-index="0"]'); await card.getByRole('textbox').fill('Private supplier evidence'); await card.getByRole('button', { name: 'Подати доказ' }).click(); await ready(supplier);
  await buyer.locator('#real-outcome-refresh').click(); await ready(buyer); const buyerCard = buyer.locator('[data-outcome-index="0"]');
  await buyerCard.getByRole('textbox').fill('Buyer checked the agreed result'); await buyerCard.getByRole('button', { name: 'Зберегти перевірку' }).click(); await ready(buyer);
  await buyerCard.locator('input[type=checkbox]').check(); await buyerCard.getByRole('button', { name: 'Прийняти результат' }).click(); await ready(buyer); assert.equal(db.events.filter(event => event.kind === 'accept').length, 1); assert.equal(await buyer.locator('.real-steps li').nth(4).getAttribute('aria-current'), 'step'); assert.match(await buyer.locator('#real-next-action').innerText(), /переглянути прийнятий результат/); checks.accepted_result_step_is_current = true; await supplier.locator('#real-outcome-refresh').click(); await ready(supplier);
  await supplier.locator('#real-social-controls summary').click(); await supplier.locator('#real-social-consent').check(); await supplier.locator('#real-social-create').click(); await ready(supplier);
  assert.ok(await supplier.locator('#real-social-output').isVisible()); assert.ok((await supplier.locator('#real-social-text').inputValue()).includes(paid.take_target)); assert.equal((await supplier.locator('#real-social-text').inputValue()).includes('Private supplier evidence'), false); checks.supplier_private_card_after_genuine_buyer_acceptance = true;
  const download = supplier.waitForEvent('download'); await supplier.locator('#real-social-card').click();
  const downloaded = await download, html = await fs.readFile(await downloaded.path(), 'utf8'); await ready(supplier);
  assert.ok(html.includes(paid.take_target)); assert.equal(html.includes('Private supplier evidence'), false);
  assert.ok(html.includes("default-src 'none'")); checks.supplier_card_downloads_with_private_CSP = true;
  await supplier.screenshot({ path: dir + '/02-supplier-private-card.png', fullPage: true });

  const oversize = await pageFor(A); const unicode = 'Ж'.repeat(2000);
  await choose(oversize, 'Тест Марія'); await open(oversize, 'real-editor'); await oversize.locator('[name=mode]').selectOption('exchange'); rejectNextSave = true;
  const draft = fields({ give_target: unicode, give_criteria: 'Критерій Ж', take_target: 'Результат Ж', take_criteria: 'Перевірка Ж' }); await fill(oversize, draft);
  await oversize.locator('#real-terms-form button[type=submit]').click(); await ready(oversize);
  assert.ok((await oversize.locator('#real-status').innerText()).includes('Забагато тексту. Скороти умови'));
  for (const [name, value] of Object.entries(draft)) if (typeof value === 'string') assert.equal(await oversize.locator(`[name="${name}"]`).inputValue(), value, name);
  checks.server_413_keeps_all_manual_unicode_fields = true; await oversize.screenshot({ path: dir + '/03-413-draft-retained.png', fullPage: true });

  const profiles = structuredClone(db.profiles), empty = await pageFor(A); db.profiles.splice(1);
  await empty.locator('#real-refresh').click(); await ready(empty); await open(empty, 'real-people-panel');
  await empty.getByRole('link', { name: 'Відкрити вхід і профіль' }).focus(); assert.equal(await empty.evaluate(() => document.activeElement?.getAttribute('href')), '/index.html');
  await empty.keyboard.press('Tab'); assert.equal(await empty.evaluate(() => document.activeElement?.tagName), 'BUTTON'); checks.empty_action_and_keyboard = true;
  db.profiles.splice(0, db.profiles.length, ...profiles);

  await open(buyer, 'real-editor'); await buyer.locator('[name=mode]').selectOption('paid_service'); await buyer.locator('[name=paid_direction]').selectOption('buyer');
  await buyer.locator('[name=take_target]').fill('Revised buyer-owned result'); await buyer.locator('#real-terms-form button[type=submit]').click(); await ready(buyer);
  assert.notEqual(await buyer.locator('.real-steps li').nth(4).getAttribute('aria-current'), 'step'); checks.accepted_result_step_clears_on_revision = true;
  await buyer.locator('#real-logout').click(); await buyer.locator('#real-auth').waitFor({ state: 'visible' }); assert.notEqual(await buyer.locator('.real-steps li').nth(4).getAttribute('aria-current'), 'step'); checks.accepted_result_step_clears_on_logout = true;

  for (const [language, width, zoom] of [['uk', 320, false], ['de', 390, true], ['en', 1440, false]]) for (const view of ['current', 'atelier']) {
    const page = await pageFor(A, { width, height: 844 });
    await page.locator('.header-preferences > summary').click();
    await page.locator('#site-language').selectOption(language);
    await page.waitForFunction(value => document.documentElement.lang === value, language);
    const style = view === 'atelier' ? 'atelier' : 'synera';
    await page.locator('#style-preset').selectOption(style);
    await page.locator('.adaptive-legacy > summary').click();
    await page.locator('.atelier-mode-choice button').nth(view === 'atelier' ? 1 : 0).click();
    assert.equal(await page.locator('html').getAttribute('data-synera-style'), style);
    assert.equal(await page.locator('html').getAttribute('data-synera-atelier'), view === 'atelier' ? 'on' : null);
    await page.locator('.header-preferences > summary').click();
    await choose(page, 'Тест Марія'); await open(page, 'real-editor');
    const text = zoom ? await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('#real-content-panel *')].filter(node => node.checkVisibility() && (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(node.tagName) || [...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim())));
      const sizes = nodes.map(node => parseFloat(getComputedStyle(node).fontSize));
      nodes.forEach((node, index) => { node.style.fontSize = `${sizes[index] * 2}px`; });
      return { method: 'all_visible_text_and_controls_dom_style', count: nodes.length, allDoubled: nodes.every((node, index) => parseFloat(getComputedStyle(node).fontSize) >= sizes[index] * 2) };
    }) : null;
    if (text) assert.ok(text.count > 20 && text.allDoubled, JSON.stringify(text));
    const layout = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth })); assert.ok(layout.width <= layout.viewport, JSON.stringify({ language, view, zoom, layout }));
    const key = `layout_${view}_${language}_${width}${zoom ? '_200pct' : ''}`; checks[key] = { ...layout, text };
    await page.screenshot({ path: `${dir}/visual-${view}-${language}-${width}${zoom ? '-200pct' : ''}.png`, fullPage: true });
  }
  assert.deepEqual(errors, []); checks.page_errors = errors;
  await fs.writeFile(dir + '/BROWSER_ACCEPTANCE.json', JSON.stringify({ status: 'PASS', runtime: { node: process.version, chromium: browser.version() }, sourceHashes, scope: 'Actual local Chromium with isolated synthetic Auth/Data/outcome transport. Not live Neon, SQL/RLS/JWT, payment, deployment, device, or independent quality proof.', checks }, null, 2));
  console.log(JSON.stringify({ status: 'PASS', checks }));
} catch (error) { await fs.writeFile(dir + '/BROWSER_FAILURE.json', JSON.stringify({ status: 'FAIL', error: error.message, checks, page_errors: errors }, null, 2)); throw error; }
finally { await browser.close(); for (const context of contexts) await context.close(); server.kill(); }
