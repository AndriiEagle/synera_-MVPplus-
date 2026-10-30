// Repeatable local audit; warm service-worker cache, Pixel 7, CDP CPU x4.
// Event Timing plus click -> next frame is a lab proxy, not field INP.
import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { openSync, closeSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
const label = process.argv[2] || 'after';
if (!/^[a-z0-9-]+$/i.test(label)) throw Error('Use a simple audit label');
const out = 'docs/voice-20261030';
await mkdir(out, { recursive: true });
await mkdir('tmp', { recursive: true });
const logPath = `tmp/voice-performance-${label}-server.log`, pidPath = `tmp/voice-performance-${label}-server.json`;
const log = openSync(logPath, 'w');
const server = spawn(process.execPath, [process.env.VOICE_AUDIT_SERVER || 'web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', log, log] });
closeSync(log);
await writeFile(pidPath, JSON.stringify({ pid:server.pid, parentPid:process.pid, script:process.env.VOICE_AUDIT_SERVER || 'web_launch/server.mjs' }));
let spawnError; server.on('error', error => { spawnError = error; });
const deadline = Date.now() + Number(process.env.VOICE_AUDIT_TIMEOUT_MS || 120000);
const watchdog = setTimeout(() => { server.kill(); console.error('Voice audit deadline exceeded'); process.exit(124); }, Math.max(1, deadline - Date.now()));
let browser;
try {
  let base;
  const startDeadline = Math.min(deadline, Date.now() + 30000);
  while (!base) {
    if (spawnError) throw spawnError;
    const text = await readFile(logPath, 'utf8');
    if (server.exitCode !== null) throw Error(`Audit server exited ${server.exitCode}: ${text}`);
    base = text.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    if (!base && Date.now() >= startDeadline) throw Error('Audit server startup timeout');
    if (!base) await delay(100);
  }
  console.error(`Audit server ready (PID ${server.pid})`);
  browser = await chromium.launch({ headless: true, executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE });
  const context = await browser.newContext({ ...devices['Pixel 7'] });
  context.setDefaultTimeout(15000); context.setDefaultNavigationTimeout(20000);
  await context.addInitScript(() => {
    localStorage.setItem('synera.first-user-tour.v1', 'done');
    window.audit = { shifts: [], events: [], paints: [], clicks: [] };
    new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) audit.shifts.push({ value: e.value, at:e.startTime, nodes: e.sources?.map(s => ({tag:s.node?.tagName,id:s.node?.id,previous:s.previousRect,current:s.currentRect})) }); }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(list => { for (const e of list.getEntries()) audit.paints.push({ name: e.name, time: e.startTime }); }).observe({ type: 'paint', buffered: true });
    new PerformanceObserver(list => { for (const e of list.getEntries()) if (e.interactionId) audit.events.push({ name: e.name, duration: e.duration,tab:Boolean(e.target?.closest('[data-tab],[data-view]')) }); }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    document.addEventListener('click', e => {
      if (!e.target.closest('[data-tab],[data-view]')) return;
      const at = performance.now(); requestAnimationFrame(() => requestAnimationFrame(() => audit.clicks.push(performance.now() - at)));
    }, true);
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Performance.enable');
  await page.goto(base);
  // A rejected/failed SW installation must time out, rather than await ready forever.
  await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout:20000 });
  const runs = [];
  for (let i = 0; i < 3; i++) {
    console.error(`Home navigation ${i+1}/3`);
    await page.goto(base, { waitUntil: 'networkidle' });
    const beforeInput = await page.evaluate(() => ({ cls:audit.shifts.reduce((n,s)=>n+s.value,0), at:performance.now() }));
    await page.locator('#prepare-profile').click();
    // Other home tabs require an account. Denied attempts are not tab-switch measurements.
    await page.waitForTimeout(100);
    const run = await page.evaluate(() => ({
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      navigation: performance.getEntriesByType('navigation')[0]?.toJSON(),
      cls: audit.shifts.reduce((n, s) => n + s.value, 0), shifts: audit.shifts,
      events: audit.events, tabNextPaint: audit.clicks,
      imagesWithoutDimensions: [...document.images].filter(i => !i.getAttribute('width') || !i.getAttribute('height')).map(i => i.getAttribute('src')),
      modules: performance.getEntriesByType('resource').filter(r => r.name.endsWith('.mjs')).map(r => ({ path: new URL(r.name).pathname, duration: r.duration, bytes: r.decodedBodySize })),
      controlled: Boolean(navigator.serviceWorker.controller),
    }));
    run.beforeInput = beforeInput; runs.push(run);
  }
  const simulationTabs=[], tabWork=[];
  await page.goto(base+'/simulation.html', { waitUntil:'networkidle' });
  await page.evaluate(()=>document.fonts.ready);
  console.error('Simulation ready');
  for (let i=0;i<2;i++) for (const name of ['join','journal','feed']) {
    const before = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
    await page.locator(`[data-view="${name}"]`).click();
    await page.locator(`#living-${name}`).waitFor({ state:'visible' });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const after = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
    tabWork.push({ name, ...Object.fromEntries(['ScriptDuration','LayoutDuration','RecalcStyleDuration','TaskDuration','LayoutCount','RecalcStyleCount'].map(k=>[k,after[k]-before[k]])) });
  }
  await page.waitForTimeout(100);
  simulationTabs.push(...await page.evaluate(()=>audit.clicks));
  const simulationEvents = await page.evaluate(()=>audit.events.filter(e=>e.tab));
  const fcp = runs.map(r => r.fcp).sort((a,b) => a-b);
  const receipt = { label, at: new Date().toISOString(), environment: 'System Chrome; Pixel 7 UA/viewport; CDP CPU x4; warm SW cache; local HTTP; 3 home navigations and 6 real simulation tab switches after network/font readiness', browserVersion:browser.version(), fcpMedianMs: fcp[1], tabNextPaintMaxMs: Math.max(...simulationTabs), eventTimingMaxMs: Math.max(0, ...runs.flatMap(r => r.events.map(e => e.duration))), tabEventTimingMaxMs:Math.max(0,...simulationEvents.map(e=>e.duration)), preInputMaxCls:Math.max(...runs.map(r=>r.beforeInput.cls)), maxCls: Math.max(...runs.map(r => r.cls)), simulationTabs, simulationEvents, tabWork, runs };
  receipt.targets = { cachedFcp:receipt.fcpMedianMs <= 1500, tabNextPaint:receipt.tabNextPaintMaxMs <= 100, tabEventTiming:receipt.tabEventTimingMaxMs <= 100, imageDimensions:runs.every(r=>!r.imagesWithoutDimensions.length) };
  receipt.status = Object.values(receipt.targets).every(Boolean) ? 'PASS_LOCAL_TARGETS' : 'HOLD_LOCAL_TARGETS';
  await writeFile(`${out}/performance-${label}.json`, JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify({ ...receipt, runs: undefined }));
  process.exitCode = receipt.status === 'PASS_LOCAL_TARGETS' ? 0 : 1;
} finally {
  // Kill by the owned PID even when browser shutdown stalls. The outer runner also kills this process tree.
  if (server.exitCode === null) server.kill();
  await browser?.close(); clearTimeout(watchdog);
}
