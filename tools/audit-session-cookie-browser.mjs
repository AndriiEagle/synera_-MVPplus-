// Real Chromium cookies over loopback HTTP. The bridge upgrades only the worker's
// origin view to HTTPS because the worker correctly refuses an HTTP site origin.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { handleNeon } from '../neon/worker.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const proof = path.join(root, 'artifacts', 'audit-followup-20261019');
const A = { id: 'audit_actor_a', email: 'a@audit.test', token: 'token-a' };
const B = { id: 'audit_actor_b', email: 'b@audit.test', token: 'token-b' };
const sources = ['neon/worker.mjs', 'web_launch/neon-store.mjs', 'tools/audit-session-cookie-browser.mjs'];
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  command: 'node tools/audit-session-cookie-browser.mjs', runtime: { node: process.version },
  scope: 'Actual Chromium two-tab cookie jar and actual handleNeon over local loopback HTTP. Upstream auth/RPC is synthetic; no production, live Neon, SQL, accounts, or secrets.', source_sha256: {}, checks: [] };
for (const name of sources) report.source_sha256[name] = createHash('sha256').update(await fs.readFile(path.join(root, name))).digest('hex');
await fs.mkdir(proof, { recursive: true });

let delayed = null, rpcCalls = 0, upstreamCalls = [], generation = 0, signOutStatus = 200;
const sessions = new Map();
const json = (value, init = {}) => Response.json(value, init);
async function upstream(url, init = {}) {
  const target = new URL(url), cookie = new Headers(init.headers).get('Cookie') || '';
  upstreamCalls.push({ path: target.pathname, cookie });
  const token = /__Secure-neon-auth\.session_token=([^;]+)/.exec(cookie)?.[1];
  if (target.pathname.endsWith('/sign-in/email-otp')) {
    const body = JSON.parse(init.body), actor = body.email === A.email ? A : body.email === B.email ? B : null;
    if (!actor) return json({}, { status: 401 });
    const session = `${actor.token}-${++generation}`; sessions.set(session, actor);
    return json({ user: { id: actor.id, email: actor.email, emailVerified: true } }, { headers: { 'Set-Cookie': `__Secure-neon-auth.session_token=${session}; Path=/; Secure; HttpOnly` } });
  }
  if (target.pathname.endsWith('/get-session')) {
    if (delayed?.token === token) { const gate = delayed; delayed = null; await gate.promise; return gate.kind === 'null' ? json({ session: null }) : json({}, { status: 401 }); }
    const actor = sessions.get(token);
    return actor ? json({ session: { id: actor.id }, user: { id: actor.id, email: actor.email, emailVerified: true } }, { headers: { 'set-auth-jwt': 'header.payload.signature' } }) : json({}, { status: 401 });
  }
  if (target.pathname.endsWith('/sign-out')) return json({}, { status: signOutStatus });
  if (target.pathname.endsWith('/rpc/synera_erase_profile_data')) { rpcCalls++; return json({ status: 'application_data_erased', providerDeletion: 'pending', retainedScope: 'bilateral_records_and_safety_evidence', repeated: false }); }
  return json({}, { status: 404 });
}
function arm(token, kind) { let resolve; const promise = new Promise(done => { resolve = done; }); delayed = { token, kind, promise, release: resolve }; return resolve; }
async function observedAfter(start, predicate) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) { if (upstreamCalls.slice(start).some(predicate)) return; await new Promise(resolve => setTimeout(resolve, 5)); }
  throw Error('delayed upstream request was not observed');
}
function headers(req) { return Object.fromEntries(Object.entries(req.headers).filter(([, value]) => value !== undefined)); }
async function read(req) { const chunks = []; for await (const chunk of req) chunks.push(chunk); return Buffer.concat(chunks); }
const env = { SYNERA_SITE_URL: 'https://localhost', SYNERA_NEON_AUTH_URL: 'https://audit.neonauth.local.aws.neon.tech/project/auth', SYNERA_NEON_DATA_URL: 'https://audit.apirest.local.aws.neon.tech/project/rest/v1', SYNERA_PILOT_EMAILS: `${A.email},${B.email}`, SYNERA_PILOT_READY: 'true', SYNERA_PROFILE_ERASURE_READY: 'true', SYNERA_REGISTRATION_ENABLED: 'true' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/') return void res.end('<script type="module">import {NeonStore} from "/web_launch/neon-store.mjs"; window.makeStore=()=>new NeonStore({backend:"neon",profileErasureEnabled:true,realPilotEnabled:true,pilotSafetyEnabled:true},fetch)</script>');
  if (url.pathname === '/test-invalid-cookie') return void res.writeHead(200, { 'Set-Cookie': '__Host-synera-session=invalid-token; Path=/; Secure; HttpOnly; SameSite=Lax' }).end('synthetic invalid session fixture');
  if (url.pathname.startsWith('/web_launch/')) {
    const file = path.resolve(root, '.' + url.pathname); if (!file.startsWith(path.join(root, 'web_launch') + path.sep)) return void res.writeHead(403).end();
    try { res.writeHead(200, { 'Content-Type': 'text/javascript' }); return void res.end(await fs.readFile(file)); } catch { return void res.writeHead(404).end(); }
  }
  const body = await read(req);
  // Chromium accepts Secure cookies on localhost. This preserves actual Set-Cookie processing;
  // only the test bridge's Request URL and Origin are HTTPS so handleNeon's production check runs.
  const requestHeaders = new Headers(headers(req)); requestHeaders.set('Origin', 'https://localhost');
  const request = new Request(`https://localhost${req.url}`, { method: req.method, headers: requestHeaders, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
  const response = await handleNeon(request, env, upstream); const out = new Headers(response.headers);
  for (const value of out.getSetCookie()) res.appendHeader('Set-Cookie', value);
  for (const [key, value] of out) if (key.toLowerCase() !== 'set-cookie') res.setHeader(key, value);
  res.writeHead(response.status); res.end(Buffer.from(await response.arrayBuffer()));
});
const listen = () => new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
const cookie = async context => (await context.cookies()).find(value => value.name === '__Host-synera-session')?.value || null;
let browser;
try {
  const port = await listen(), base = `http://localhost:${port}`;
  browser = await chromium.launch({ headless: true, executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE || chromium.executablePath() });
  const context = await browser.newContext(), a = await context.newPage(), b = await context.newPage();
  const browserRequests = []; context.on('request', request => browserRequests.push(request.url()));
  await Promise.all([a.goto(base), b.goto(base)]);
  report.runtime.chromium = browser.version();
  // JS handles cannot cross the page boundary, so keep each store on its tab.
  await a.evaluate(async value => { window.store = window.makeStore(); await window.store.verifyOtp(value.email, '123456'); }, A);
  assert.match(await cookie(context), /^token-a-\d+$/, 'A login did not create an accepted __Host cookie');
  await b.evaluate(async value => { window.store = window.makeStore(); await window.store.verifyOtp(value.email, '123456'); }, B);
  assert.match(await cookie(context), /^token-b-\d+$/, 'B login did not replace the shared browser cookie');
  const beforeMismatch = rpcCalls;
  const mismatch = await a.evaluate(async () => { try { await window.store.eraseProfileData(); } catch (error) { return { status: error.status, code: error.code, user: window.store.user }; } });
  assert.deepEqual({ status: mismatch.status, code: mismatch.code, user: mismatch.user }, { status: 409, code: 'profile_erasure_subject_mismatch', user: null });
  assert.equal(rpcCalls, beforeMismatch, 'wrong displayed A dispatched destructive RPC for B'); report.checks.push('TA01 two tabs: A display + B shared cookie returns 409 and makes zero RPC');
  await a.evaluate(async value => { window.store = window.makeStore(); await window.store.verifyOtp(value.email, '123456'); }, A);
  const beforeOwn = rpcCalls; await a.evaluate(() => window.store.eraseProfileData()); assert.equal(rpcCalls, beforeOwn + 1); report.checks.push('TA01 own displayed subject reaches exactly one synthetic RPC');
  for (const kind of ['401', 'null']) for (const next of [B, A]) for (const order of ['before', 'after']) {
    await a.evaluate(async value => { window.store = window.makeStore(); await window.store.verifyOtp(value.email, '123456'); }, A);
    const old = await cookie(context), beforeRestore = upstreamCalls.length, release = arm(old, kind);
    const pending = a.evaluate(() => window.store.restore().then(() => ({ ok: true, user: window.store.user })).catch(error => ({ ok: false, status: error.status, user: window.store.user }))).catch(error => ({ transport: error.message }));
    await observedAfter(beforeRestore, value => value.path.endsWith('/get-session') && value.cookie.includes(old));
    if (order === 'before') { release(); await pending; assert.equal(await cookie(context), old, `stale ${kind} response cleared old A cookie before re-login`); }
    await b.evaluate(async value => { window.store = window.makeStore(); await window.store.verifyOtp(value.email, '123456'); }, next);
    const fresh = await cookie(context); if (next === A) assert.notEqual(fresh, old, 'same-A re-login did not create a new session generation');
    if (order === 'after') { release(); await pending; }
    assert.equal(await cookie(context), fresh, `stale ${kind} ${order} response cleared ${next.id} cookie`);
    assert.deepEqual(await b.evaluate(async () => ({ restored: await window.store.restore(), id: window.store.user?.id })), { restored: true, id: next.id });
    report.checks.push(`TA03 delayed ${kind} ${order} A-to-${next.id} preserves generated cookie and fresh session`);
  }
  await b.evaluate(() => window.store.signOut()); assert.equal(await cookie(context), null, 'explicit successful logout did not clear __Host cookie'); report.checks.push('explicit successful logout clears actual browser cookie');
  await a.goto(base + '/test-invalid-cookie'); assert.equal(await cookie(context), 'invalid-token', 'synthetic HTTP invalid cookie was not accepted');
  assert.deepEqual(await b.evaluate(async () => { try { await window.store.restore(); } catch (error) { return { status: error.status, user: window.store.user }; } }), { status: 401, user: null });
  assert.equal(await cookie(context), 'invalid-token', 'invalid provider credential response cleared browser cookie'); report.checks.push('actual browser invalid token returns 401 without clearing cookie');
  await b.evaluate(async value => { window.store = window.makeStore(); await window.store.verifyOtp(value.email, '123456'); }, A);
  signOutStatus = 503;
  assert.deepEqual(await b.evaluate(async () => { try { await window.store.signOut(); } catch (error) { return { status: error.status, user: window.store.user }; } }), { status: 503, user: null });
  assert.equal(await cookie(context), null, 'explicit logout after upstream 503 did not clear cookie'); report.checks.push('actual browser explicit logout clears cookie after upstream 503');
  assert.ok(browserRequests.every(value => new URL(value).origin === base), `browser reached external URL: ${browserRequests.find(value => new URL(value).origin !== base)}`);
  report.browser_request_origins = [...new Set(browserRequests.map(value => new URL(value).origin))]; report.checks.push('browser made only loopback-origin requests');
  await b.evaluate(() => { document.body.innerHTML = '<pre id="audit-summary">PASS: Chromium HTTP cookie harness only; not product UI evidence.</pre>'; });
  await b.screenshot({ path: path.join(proof, 'session-cookie-browser.png') });
  report.status = 'PASS_LOCAL_BROWSER_HTTP_COOKIE'; report.cookie_name = '__Host-synera-session'; report.rpc_calls = rpcCalls;
  report.screenshot_scope = 'Harness summary only; not product UI, UX, accessibility, or visual acceptance evidence.';
} catch (error) { report.status = 'RED_OR_FAILED'; report.error = error.stack || error.message; report.upstream_calls = upstreamCalls; throw error; }
finally { delayed?.release?.(); if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); await fs.writeFile(path.join(proof, 'session-cookie-browser.json'), JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ status: report.status, checks: report.checks.length, rpc_calls: rpcCalls }));
