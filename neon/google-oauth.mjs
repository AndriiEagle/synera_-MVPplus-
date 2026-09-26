import { consentRecord, POLICY_VERSION } from '../web_launch/pilot-policy.mjs';

const START_PATH = '/api/neon/oauth/google/start';
const CALLBACK_PATH = '/api/neon/oauth/google/callback';
const VERIFIER = 'neon_auth_session_verifier';
const CANONICAL_CHALLENGE = '__Secure-neon-auth.session_challenge';
const LEGACY_CHALLENGE = '__Secure-neon-auth.session_challange';
const SESSION_TOKEN = '__Secure-neon-auth.session_token';
const LOCAL_CHALLENGES = new Map([
  [CANONICAL_CHALLENGE, '__Host-synera-google-challenge'],
  [LEGACY_CHALLENGE, '__Host-synera-google-challange'],
]);
const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
const answer = (data, status, headers = {}, cookies = []) => {
  const responseHeaders = new Headers({ ...jsonHeaders, ...headers });
  for (const cookie of cookies) responseHeaders.append('Set-Cookie', cookie);
  return new Response(JSON.stringify(data), { status, headers: responseHeaders });
};
class OAuthError extends Error { constructor(status, code = 'google_oauth_unavailable') { super('Google OAuth rejected'); this.status = status; this.code = code; } }

function clearChallenges() {
  return [...LOCAL_CHALLENGES.values()].map(name => `${name}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`);
}
function localChallenge(name, value, maxAge) {
  const encoded = btoa(JSON.stringify({ name, value })).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  if (encoded.length > 3800) throw new OAuthError(503);
  return `${LOCAL_CHALLENGES.get(name)}=${encoded}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}
function parseCookieValues(request, name) {
  return (request.headers.get('cookie') || '').split(';').map(value => value.trim()).filter(value => value.startsWith(name + '=')).map(value => value.slice(name.length + 1));
}
function decodeLocalChallenge(request) {
  const matches = [...LOCAL_CHALLENGES.values()].flatMap(name => parseCookieValues(request, name).map(value => ({ name, value })));
  if (matches.length !== 1 || matches[0].value.length > 3800) throw new OAuthError(400, 'google_oauth_invalid_callback');
  try {
    const base64 = matches[0].value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - matches[0].value.length % 4) % 4);
    const data = JSON.parse(atob(base64));
    if (LOCAL_CHALLENGES.get(data?.name) !== matches[0].name || typeof data?.value !== 'string' || !/^[^\x00-\x20;]{1,2048}$/.test(data.value)) throw new Error();
    return data;
  } catch { throw new OAuthError(400, 'google_oauth_invalid_callback'); }
}
function setCookies(response) {
  const values = response.headers.getSetCookie?.() || [];
  if (!Array.isArray(values)) throw new OAuthError(503);
  return values;
}
function parseSetCookie(value) {
  const [first, ...attributes] = value.split(';').map(part => part.trim());
  const match = /^([^=]+)=([^\s;]+)$/.exec(first || '');
  if (!match) return null;
  const fields = new Map(attributes.map(attribute => {
    const index = attribute.indexOf('=');
    return [index < 0 ? attribute.toLowerCase() : attribute.slice(0, index).toLowerCase(), index < 0 ? true : attribute.slice(index + 1)];
  }));
  return { name: match[1], value: match[2], fields };
}
function upstreamChallenge(response) {
  const parsed = setCookies(response).map(parseSetCookie);
  if (parsed.length !== 1 || !parsed[0] || !LOCAL_CHALLENGES.has(parsed[0].name)) throw new OAuthError(503);
  const cookie = parsed[0], maxAge = Number(cookie.fields.get('max-age'));
  if (!Number.isInteger(maxAge) || maxAge < 1 || maxAge > 600 || cookie.fields.get('secure') !== true || cookie.fields.get('httponly') !== true || !/^[^\x00-\x20;]{1,2048}$/.test(cookie.value)) throw new OAuthError(503);
  return { name: cookie.name, value: cookie.value, maxAge };
}
function upstreamSession(response) {
  const parsed = setCookies(response).map(parseSetCookie).filter(cookie => cookie?.name === SESSION_TOKEN);
  if (parsed.length !== 1 || !/^[^\x00-\x20;]{1,4096}$/.test(parsed[0].value)) throw new OAuthError(503);
  return parsed[0].value;
}
function publicUser(data, allowed) {
  const user = data?.user;
  if (!data?.session || !user || typeof user.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(user.id) || typeof user.email !== 'string' || user.emailVerified !== true || !allowed?.has(user.email.toLowerCase())) throw new OAuthError(401, 'google_oauth_denied');
  return { id: user.id, email: user.email };
}
function safeNeonInitUrl(value, endpoints) {
  let url;
  try { url = new URL(value); } catch { throw new OAuthError(503); }
  const expected = new URL(endpoints.auth + '/sign-in/social/init');
  const token = url.searchParams.getAll('token');
  if (url.protocol !== 'https:' || url.origin !== expected.origin || url.pathname !== expected.pathname || url.username || url.password || url.hash ||
    token.length !== 1 || !/^[A-Za-z0-9._~-]{16,2048}$/.test(token[0]) || [...url.searchParams.keys()].some(key => key !== 'token')) throw new OAuthError(503);
  return url.href;
}
function enabled(env) { return env.SYNERA_PILOT_READY === 'true' && env.SYNERA_REGISTRATION_ENABLED === 'true' && env.SYNERA_GOOGLE_OAUTH_READY === 'true'; }
async function readConsent(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) throw new OAuthError(415, 'google_oauth_invalid_request');
  if (Number(request.headers.get('content-length')) > 4096) throw new OAuthError(413, 'google_oauth_invalid_request');
  if (!request.body) throw new OAuthError(400, 'google_oauth_invalid_request');
  const reader = request.body.getReader(), chunks = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 4096) { await reader.cancel(); throw new OAuthError(413, 'google_oauth_invalid_request'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let body;
  try { body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw new OAuthError(400, 'google_oauth_invalid_request'); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || !Object.hasOwn(body, 'consent') || body.consent?.policy_version !== POLICY_VERSION) throw new OAuthError(400, 'google_oauth_invalid_consent');
  try { consentRecord(body.consent); } catch { throw new OAuthError(400, 'google_oauth_invalid_consent'); }
}
async function upstream(fetchImpl, url, init) {
  try {
    const response = await fetchImpl(url, { ...init, redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new OAuthError(response.status === 401 || response.status === 403 ? 401 : 503);
    return response;
  } catch (error) { if (error instanceof OAuthError) throw error; throw new OAuthError(503); }
}
async function start(request, env, endpoints, fetchImpl) {
  if (!enabled(env)) throw new OAuthError(404, 'not_found');
  await readConsent(request);
  const response = await upstream(fetchImpl, endpoints.auth + '/sign-in/social', { method: 'POST', headers: {
    'Content-Type': 'application/json', Origin: endpoints.origin, 'X-Neon-Auth-Middleware': 'true'
  }, body: JSON.stringify({ provider: 'google', callbackURL: endpoints.origin + CALLBACK_PATH, errorCallbackURL: endpoints.origin + '/', disableRedirect: true }) });
  const challenge = upstreamChallenge(response);
  let data;
  try { data = await response.json(); } catch { throw new OAuthError(503); }
  return answer({ url: safeNeonInitUrl(data?.url, endpoints) }, 200, { 'Set-Cookie': localChallenge(challenge.name, challenge.value, challenge.maxAge) });
}
async function callback(request, env, endpoints, allowed, fetchImpl) {
  if (!enabled(env)) throw new OAuthError(403, 'google_oauth_disabled');
  const url = new URL(request.url), values = url.searchParams.getAll(VERIFIER);
  if (values.length !== 1 || !/^[A-Za-z0-9._~-]{16,1024}$/.test(values[0]) || [...url.searchParams.keys()].some(key => key !== VERIFIER)) throw new OAuthError(400, 'google_oauth_invalid_callback');
  const challenge = decodeLocalChallenge(request);
  const exchangeUrl = new URL(endpoints.auth + '/get-session');
  exchangeUrl.searchParams.set(VERIFIER, values[0]);
  const response = await upstream(fetchImpl, exchangeUrl.href, { method: 'GET', headers: {
    Origin: endpoints.origin, Cookie: `${challenge.name}=${challenge.value}`, 'X-Neon-Auth-Middleware': 'true'
  } });
  let data;
  try { data = await response.json(); } catch { throw new OAuthError(503); }
  publicUser(data, allowed);
  const session = upstreamSession(response);
  const headers = new Headers({ Location: endpoints.origin + '/', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
  headers.append('Set-Cookie', `__Host-synera-session=${session}; Path=/; Secure; HttpOnly; SameSite=Lax`);
  for (const cookie of clearChallenges()) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers });
}

export async function handleGoogleOAuth(request, env, endpoints, allowed, fetchImpl = fetch) {
  const path = new URL(request.url).pathname;
  try {
    if (path === START_PATH && request.method === 'POST') return await start(request, env, endpoints, fetchImpl);
    if (path === CALLBACK_PATH && request.method === 'GET') return await callback(request, env, endpoints, allowed, fetchImpl);
    throw new OAuthError(404, 'not_found');
  } catch (error) {
    const status = error instanceof OAuthError ? error.status : 503;
    const code = error instanceof OAuthError ? error.code : 'google_oauth_unavailable';
    return answer({ error: code, status }, status, {}, clearChallenges());
  }
}
