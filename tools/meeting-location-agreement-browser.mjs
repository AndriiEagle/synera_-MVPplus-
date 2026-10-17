// Actual app consumer and accepted GPS oracle; keep original harness/proofs intact.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url)), proof = 'artifacts/overnight-20261004/location-agreement';
const mutation = process.argv.includes('--mutate-consumer'), red = process.argv.includes('--red');
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Local Chromium with synthetic Auth/Data API/KV and browser-emulated GPS; not Google, physical Android, live people or SQL/JWT' };
const hash = b => createHash('sha256').update(b).digest('hex'), originalName = 'tools/location-browser-acceptance.mjs';
await fs.mkdir(path.join(root, proof), { recursive: true });
let source = await fs.readFile(path.join(root, originalName), 'utf8');
const replace = (needle, replacement) => { assert.equal(source.split(needle).length, 2, 'Oracle seam drift: ' + needle); source = source.replace(needle, replacement); };
source = source.replaceAll('artifacts/location-browser-failure.json', proof + (mutation ? '/MUTATION_DETAIL.json' : red ? '/RED_DETAIL.json' : '/FAILURE_DETAIL.json'))
  .replaceAll('artifacts/location-browser-20261002.json', proof + '/BROWSER_DETAIL.json').replaceAll('artifacts/location-mobile-20261002.png', proof + '/legacy-location-390x844.png');
replace('async function pageFor(id) {', 'let external = 0; const extraChecks = [];\nasync function pageFor(id, agreementEnabled = false) {');
replace("serviceWorkers: 'block', permissions", "reducedMotion: 'reduce', serviceWorkers: 'block', permissions");
replace('  pages.push(page);', `  pages.push(page); page.setDefaultTimeout(8000);
  await page.route('**/*', async route => { if (new URL(route.request().url()).origin !== base) { external++; await route.abort(); } else await route.fallback(); });
  if (process.argv.includes('--mutate-consumer')) await page.route('**/app.mjs', async route => {
    const original = await fs.readFile('web_launch/app.mjs', 'utf8'), marker = 'addressAgreementRequired: store.meetingAddressEnabled === true';
    assert.equal(original.split(marker).length, 2);
    await route.fulfill({ contentType: 'text/javascript', body: original.replace(marker, 'addressAgreementRequired: false') });
  });`);
replace('registrationEnabled:true,liveLocationEnabled:true,publicSiteUrl:origin', 'registrationEnabled:true,liveLocationEnabled:true,realJourneyEnabled:true,meetingAddressEnabled:agreementEnabled,publicSiteUrl:origin');
replace("  const address='Bahnhofplatz 15, Zürich';", `  const c = await pageFor(A, true), d = await pageFor(B, true);
  for (const page of [c, d]) {
    assert.equal(await page.locator('[name="meeting-address"]').count(), 0, 'Bilateral mode still exposes unilateral address editor');
    assert.equal(await page.getByRole('button', { name: 'Зберегти адресу', exact: true }).count(), 0);
    assert.equal(await page.locator('.meeting-nav').count(), 0, 'Legacy venue navigation bypassed bilateral review');
    const link = page.getByRole('link', { name: 'Погодити адресу в приватній розмові', exact: true });
    assert.equal(new URL(await link.getAttribute('href'), base).pathname, '/real-journey.html');
    assert.equal(await page.evaluate(() => window.__gpsStarts), 0);
    assert.equal(await page.locator('[name="location-consent"]').isChecked(), false);
    assert.equal(await page.getByRole('button', { name: 'Дозволити на час зустрічі', exact: true }).isEnabled(), false);
  }
  extraChecks.push('actual app flag removes unilateral editor and venue navigation without GPS consent');
  assert.equal(await c.evaluate(() => document.documentElement.dataset.syneraAtelier || null), null);
  assert.ok(await c.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const axe = async page => (await new AxeBuilder({ page }).include('.meeting-location').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations;
  assert.deepEqual(await axe(c), []); await c.locator('.meeting-location').scrollIntoViewIfNeeded();
  if (!process.argv.includes('--mutate-consumer')) await c.screenshot({ path: '${proof}/bilateral-current-390x844.png' });
  const preferences = c.locator('.header-preferences'); await preferences.locator('summary').click(); await preferences.getByRole('button', { name: 'Atelier 2026', exact: true }).click();
  assert.equal(await c.evaluate(() => document.documentElement.dataset.syneraAtelier), 'on'); assert.deepEqual(await axe(c), []);
  await c.locator('.meeting-location').scrollIntoViewIfNeeded(); if (!process.argv.includes('--mutate-consumer')) await c.screenshot({ path: '${proof}/bilateral-atelier-390x844.png' });
  await preferences.getByRole('button', { name: 'Чинний', exact: true }).click(); await preferences.locator('summary').click();
  assert.equal(await c.evaluate(() => document.documentElement.dataset.syneraAtelier || null), null);
  assert.equal(await c.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
  extraChecks.push('Current default and optional Atelier, reduced motion, no overflow and Axe zero');
  await c.locator('[name="location-consent"]').check(); await c.getByRole('button', { name: 'Дозволити на час зустрічі', exact: true }).click(); await wait(() => samples >= 1);
  await d.getByRole('button', { name: 'Оновити локацію', exact: true }).click();
  const peerRoute = d.getByRole('link', { name: 'Пішки до співрозмовника в Google Maps ↗', exact: true }); await peerRoute.waitFor();
  assert.equal(await d.evaluate(() => window.__gpsStarts), 0); assert.equal(grants.has(B), false);
  await c.getByRole('button', { name: 'Відкликати дозвіл', exact: true }).click(); await wait(() => grants.get(A).status === 'revoked');
  await d.getByRole('button', { name: 'Оновити локацію', exact: true }).click(); await peerRoute.waitFor({ state: 'detached' });
  assert.ok(await c.evaluate(() => window.__gpsStops) >= 1); extraChecks.push('GPS remains independent and explicit; revocation erases peer route');
  await d.getByRole('link', { name: 'Погодити адресу в приватній розмові', exact: true }).click(); await d.waitForURL(base + '/real-journey.html');
  await d.waitForLoadState('networkidle'); assert.equal(await d.locator('#real-address').count(), 1); extraChecks.push('explicit internal link reaches existing real journey');
  await c.context().close(); await d.context().close(); pages.splice(2, 2);
  const sampleOffset = samples;
  const address='Bahnhofplatz 15, Zürich';`);
replace('await wait(()=>samples>=1);', 'await wait(()=>samples>=sampleOffset+1);');
replace('await wait(()=>samples>=2);', 'await wait(()=>samples>=sampleOffset+2);');
replace('  assert.deepEqual(errors,[]);', '  assert.deepEqual(errors,[]); assert.equal(external, 0);');
replace('provider_calls:0};', 'provider_calls:0, external_requests:external, extra_checks:extraChecks};');
source = source.replace(/from (['"])(\.[^'"]+)\1/g, (m, q, n) => 'from ' + JSON.stringify(pathToFileURL(path.resolve(root, 'tools', n)).href))
  .replace(/from (['"])(playwright|@axe-core\/playwright)\1/g, (m, q, n) => 'from ' + JSON.stringify(import.meta.resolve(n)));
const runner = path.join(root, proof, mutation ? 'mutation-runner.mjs' : 'runner.mjs');
report.oracle_sha256 = hash(await fs.readFile(path.join(root, originalName))); report.extended_runner_sha256 = hash(Buffer.from(source));
try {
  await fs.writeFile(runner, source); const result = spawnSync(process.execPath, [runner, ...process.argv.slice(2)], { cwd: root, encoding: 'utf8', timeout: 60000, maxBuffer: 1024 * 1024 });
  report.process_exit = result.status;
  const detailName = result.status === 0 ? '/BROWSER_DETAIL.json' : mutation ? '/MUTATION_DETAIL.json' : red ? '/RED_DETAIL.json' : '/FAILURE_DETAIL.json';
  report.browser = JSON.parse(await fs.readFile(path.join(root, proof + detailName), 'utf8'));
  assert.equal(result.status, 0, report.browser.error || result.stderr); assert.equal(report.browser.external_requests, 0);
  report.status = 'PASS_LOCAL_LEGACY_LOCATION_AGREEMENT';
} catch (error) { report.error = error.message; process.exitCode = 1; }
finally {
  report.source_sha256 = Object.fromEntries(await Promise.all(['web_launch/app.mjs','web_launch/meeting-location.mjs','web_launch/neon-store.mjs',originalName,'tools/meeting-location-agreement-browser.mjs'].map(async n => [n, hash(await fs.readFile(path.join(root, n)))])));
  await fs.writeFile(path.join(root, proof, mutation ? 'MUTATION.json' : red ? 'RED.json' : 'BROWSER.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ status: report.status, legacy_checks: report.browser?.checks?.length, checks: report.browser?.extra_checks?.length, error: report.error }));
