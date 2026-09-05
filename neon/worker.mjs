import { consentRecord, POLICY_VERSION } from '../web_launch/pilot-policy.mjs';

// Deployment adapter, not an auth implementation: Neon verifies OTPs and owns sessions.
// All provider tokens stay here. No owner API key, SQL password, or service-role key is used.
const SESSION_COOKIE = '__Host-synera-session';
// Exact upstream name from neondatabase/neon-js packages/auth/src/server/constants.ts.
// The overview docs still show an older spelling; accepting it loses successful OTP sessions.
const NEON_COOKIE = '__Secure-neon-auth.session_token';
const TABLES = new Set(['profiles', 'pilot_consents', 'meeting_requests', 'meeting_messages', 'profile_blocks', 'profile_reports']);
const METHODS = new Set(['GET', 'POST', 'PATCH', 'DELETE']);
const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const answer = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { ...jsonHeaders, ...headers } });
class GatewayError extends Error { constructor(status, code = 'service_unavailable') { super('Gateway request rejected'); this.status = status; this.code = code; } }

function originValue(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new GatewayError(503);
  return url.origin;
}
export function neonEndpoints(env) {
  const auth = new URL(env.SYNERA_NEON_AUTH_URL), data = new URL(env.SYNERA_NEON_DATA_URL);
  for (const url of [auth, data]) {
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash || !/^[a-z0-9.-]+\.aws\.neon\.tech$/.test(url.hostname)) throw new GatewayError(503);
  }
  if (!auth.hostname.includes('.neonauth.') || !data.hostname.includes('.apirest.') || !/^\/[a-zA-Z0-9_-]+\/auth$/.test(auth.pathname) || !/^\/[a-zA-Z0-9_-]+\/rest\/v1$/.test(data.pathname)) throw new GatewayError(503);
  if (auth.hostname.replace('.neonauth.', '.') !== data.hostname.replace('.apirest.', '.') || auth.pathname.split('/')[1] !== data.pathname.split('/')[1]) throw new GatewayError(503);
  return { auth: auth.href, data: data.href, origin: originValue(env.SYNERA_SITE_URL) };
}
function participants(env) {
  const emails = String(env.SYNERA_PILOT_EMAILS || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
  if (!emails.length || emails.length > 10 || emails.some(v => !/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(v))) throw new GatewayError(503);
  return new Set(emails);
}
function cookieValue(request) {
  const matches = (request.headers.get('cookie') || '').split(';').map(v => v.trim()).filter(v => v.startsWith(SESSION_COOKIE + '='));
  if (matches.length > 1) throw new GatewayError(401);
  const value = matches[0]?.slice(SESSION_COOKIE.length + 1) || '';
  if (value.length > 4096 || /[^\x21-\x3a\x3c-\x7e]/.test(value)) throw new GatewayError(401);
  return value;
}
function providerCookie(response) {
  const values = response.headers.getSetCookie();
  const found = values.map(v => v.split(';')[0]).filter(v => v.startsWith(NEON_COOKIE + '='));
  if (found.length !== 1) throw new GatewayError(503, 'session_cookie_unavailable');
  const value = found[0].slice(NEON_COOKIE.length + 1);
  if (!value || value.length > 4096 || /[^\x21-\x3a\x3c-\x7e]/.test(value)) throw new GatewayError(503, 'session_cookie_unavailable');
  return value;
}
function sessionCookie(value) { return `${SESSION_COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax${value ? '' : '; Max-Age=0'}`; }
function publicUser(data, allowed) {
  const user = data?.user;
  if (!user || typeof user.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(user.id) || typeof user.email !== 'string' || user.emailVerified !== true || !allowed.has(user.email.toLowerCase())) throw new GatewayError(401);
  return { id: user.id, email: user.email };
}
async function readJson(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) throw new GatewayError(415);
  if (Number(request.headers.get('content-length')) > 4096) throw new GatewayError(413);
  if (!request.body) return {};
  const reader = request.body.getReader(); let size = 0, chunks = [];
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.length;
    if (size > 4096) { await reader.cancel(); throw new GatewayError(413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value; }
  catch { throw new GatewayError(400); }
}
function checkKeys(body, expected) { if (Object.keys(body).some(key => !expected.includes(key))) throw new GatewayError(400); }
function checkedEmail(body, allowed) {
  if (typeof body.email !== 'string' || body.email.length > 254) throw new GatewayError(400);
  const email = body.email.trim().toLowerCase();
  if (!allowed.has(email)) throw new GatewayError(403);
  return email;
}
async function checkedFetch(fetchImpl, url, init, code = 'service_unavailable') {
  let response;
  try { response = await fetchImpl(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(12000), cache: 'no-store' }); }
  catch { throw new GatewayError(503, code); }
  if (!response.ok) throw new GatewayError([400, 401, 403, 409, 422, 429].includes(response.status) ? response.status : 503,
    code === 'otp_verification_unavailable' && [400, 401, 422].includes(response.status) ? 'otp_invalid' : code);
  return response;
}
async function authRequest(fetchImpl, endpoints, path, { method = 'GET', body, cookie = '' } = {}) {
  return checkedFetch(fetchImpl, endpoints.auth + path, { method, headers: { 'Content-Type': 'application/json', Origin: endpoints.origin,
    'X-Neon-Auth-Middleware': 'true', ...(cookie ? { Cookie: `${NEON_COOKIE}=${cookie}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) },
    path === '/sign-in/email-otp' ? 'otp_verification_unavailable' : path === '/email-otp/send-verification-otp' ? 'otp_delivery_unavailable' : 'session_unavailable');
}
async function getSession(fetchImpl, endpoints, cookie, allowed) {
  if (!cookie) return null;
  const response = await authRequest(fetchImpl, endpoints, '/get-session', { cookie });
  const data = await response.json();
  if (!data?.session) return null;
  const user = publicUser(data, allowed), jwt = response.headers.get('set-auth-jwt');
  // Shape validation only. The Neon Data API, not this proxy, verifies the signature.
  if (!jwt || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jwt) || jwt.length > 16384) throw new GatewayError(503, 'session_token_unavailable');
  return { user, jwt };
}

export async function handleNeon(request, env, fetchImpl = fetch) {
  try {
    const url = new URL(request.url), endpoints = neonEndpoints(env);
    if (url.origin !== endpoints.origin || request.headers.get('X-Synera-Client') !== '1' || request.headers.get('Sec-Fetch-Site') === 'cross-site') throw new GatewayError(403);
    const origin = request.headers.get('Origin');
    if ((request.method !== 'GET' && origin !== endpoints.origin) || (origin && origin !== endpoints.origin)) throw new GatewayError(403);
    if (!METHODS.has(request.method)) throw new GatewayError(405);
    const path = url.pathname.slice('/api/neon'.length), cookie = cookieValue(request);
    if (path === '/logout' && request.method === 'POST') {
      if (cookie) await authRequest(fetchImpl, endpoints, '/sign-out', { method: 'POST', body: {}, cookie });
      return answer({ signedOut: true }, 200, { 'Set-Cookie': sessionCookie('') });
    }
    if (env.SYNERA_PILOT_READY !== 'true') throw new GatewayError(503);
    const allowed = participants(env);
    if (path === '/health' && request.method === 'GET' && !url.search) {
      await authRequest(fetchImpl, endpoints, '/get-session');
      return answer({ authGateway: 'reachable', backend: 'neon', policyVersion: POLICY_VERSION });
    }
    if (path === '/otp/request' && request.method === 'POST' && !url.search) {
      if (env.SYNERA_REGISTRATION_ENABLED !== 'true') throw new GatewayError(403);
      const body = await readJson(request); checkKeys(body, ['email', 'consent']);
      if (body.consent?.policy_version !== POLICY_VERSION) throw new GatewayError(400);
      try { consentRecord(body.consent); } catch { throw new GatewayError(400); }
      const email = checkedEmail(body, allowed);
      await authRequest(fetchImpl, endpoints, '/email-otp/send-verification-otp', { method: 'POST', body: { email, type: 'sign-in' } });
      return answer({ sent: true });
    }
    if (path === '/otp/verify' && request.method === 'POST' && !url.search) {
      if (env.SYNERA_REGISTRATION_ENABLED !== 'true') throw new GatewayError(403);
      const body = await readJson(request); checkKeys(body, ['email', 'otp']); const email = checkedEmail(body, allowed);
      if (typeof body.otp !== 'string' || !/^\d{6}$/.test(body.otp)) throw new GatewayError(400);
      const response = await authRequest(fetchImpl, endpoints, '/sign-in/email-otp', { method: 'POST', body: { email, otp: body.otp } });
      const user = publicUser(await response.json(), allowed);
      if (user.email.toLowerCase() !== email) throw new GatewayError(401);
      return answer({ user }, 200, { 'Set-Cookie': sessionCookie(providerCookie(response)) });
    }
    if (path === '/session' && request.method === 'GET' && !url.search) {
      const session = await getSession(fetchImpl, endpoints, cookie, allowed);
      return answer({ user: session?.user || null }, 200, session ? {} : { 'Set-Cookie': sessionCookie('') });
    }
    const match = path.match(/^\/data\/([a-z_]+)$/);
    if (!match || !TABLES.has(match[1]) || url.search.length > 4096) throw new GatewayError(404);
    const session = await getSession(fetchImpl, endpoints, cookie, allowed);
    if (!session) throw new GatewayError(401);
    const body = ['POST', 'PATCH'].includes(request.method) ? await readJson(request) : undefined;
    const prefer = request.headers.get('Prefer');
    if (prefer && !/^(return=(minimal|representation)|resolution=(merge|ignore)-duplicates)(,(return=(minimal|representation)|resolution=(merge|ignore)-duplicates))*$/.test(prefer)) throw new GatewayError(400);
    const response = await checkedFetch(fetchImpl, endpoints.data + '/' + match[1] + url.search, { method: request.method,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.jwt, ...(prefer ? { Prefer: prefer } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, 'data_unavailable');
    // RLS and column grants enforce ownership even if somebody bypasses the browser UI.
    return new Response(response.body, { status: response.status, headers: jsonHeaders });
  } catch (error) {
    const status = error instanceof GatewayError ? error.status : 503;
    const clear = status === 401 || new URL(request.url).pathname === '/api/neon/logout';
    return answer({ error: error instanceof GatewayError ? error.code : 'service_unavailable', status }, status, clear ? { 'Set-Cookie': sessionCookie('') } : {});
  }
}

export function createNeonWorker(publicAssets) {
  // Pages redirects .html URLs to extensionless paths. Admit only aliases of
  // already-public HTML files, otherwise /legal.html redirects into our 404.
  const allowedAssets = new Set(['/', ...publicAssets.flatMap(name => name.endsWith('.html') ? ['/' + name, '/' + name.slice(0, -5)] : ['/' + name])]);
  return { async fetch(request, env) {
    const url = new URL(request.url);
    let response;
    if (url.pathname.startsWith('/api/neon/')) response = await handleNeon(request, env);
    else if (url.pathname === '/config.json' && request.method === 'GET') {
      const ready = env.SYNERA_PILOT_READY === 'true';
      response = answer({ backend: 'neon', supabaseUrl: '', publishableKey: '', pilotSafetyEnabled: ready, realPilotEnabled: ready,
        registrationEnabled: ready && env.SYNERA_REGISTRATION_ENABLED === 'true', publicSiteUrl: url.origin });
    } else if (allowedAssets.has(url.pathname) && ['GET', 'HEAD'].includes(request.method)) response = await env.ASSETS.fetch(request);
    else response = answer({ error: 'not_found' }, 404);
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store'); headers.set('X-Content-Type-Options', 'nosniff'); headers.set('Referrer-Policy', 'no-referrer');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data: https://tile.openstreetmap.org; worker-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    return new Response(response.body, { status: response.status, headers });
  } };
}
