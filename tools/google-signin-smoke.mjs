import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Inspect redirects only. Never request Google's login page or exchange a verifier.
export async function googleSigninSmoke({ origin, clientId, fetchImpl = fetch }) {
  const site = new URL(origin);
  if (site.protocol !== 'https:' || site.username || site.password || site.port || site.pathname !== '/' || site.search || site.hash) throw Error('A public HTTPS origin is required');
  const get = async url => {
    try { return await fetchImpl(url, { method: 'GET', redirect: 'manual', cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(15000) }); }
    catch { throw Error('Google smoke network request failed; no sign-in attempted'); }
  };
  const response = await get(site.origin + '/config.json');
  if (!response.ok) throw Error('Public configuration unavailable');
  const config = await response.json();
  if (config.backend !== 'neon') throw Error('Neon backend is not configured');
  for (const key of ['registrationEnabled', 'googleOauthReady', 'googleOAuthEnabled', 'pilotSafetyEnabled', 'realPilotEnabled']) {
    if (config[key] !== true) throw Error('Google rollout gate is closed: ' + key);
  }
  const expectedClient = clientId || config.googleOAuthClientId;
  if (!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(expectedClient || '')) throw Error('Expected Google client ID missing; set SYNERA_GOOGLE_CLIENT_ID in Pages or pass --client-id=');
  if (clientId && config.googleOAuthClientId && clientId !== config.googleOAuthClientId) throw Error('Pinned client ID differs from the public deployment configuration');
  let init;
  try { init = new URL(config.googleOAuthInitUrl); } catch { throw Error('Neon OAuth init URL missing'); }
  if (!/^https:\/\/[a-z0-9.-]+\.neonauth\.[a-z0-9.-]+\.aws\.neon\.tech\/[A-Za-z0-9_-]+\/auth\/sign-in\/social\/init$/.test(init.href)) throw Error('Unsafe Neon OAuth init URL');
  const start = await get(site.origin + '/api/neon/oauth/google/start');
  if (start.status !== 303 || !start.headers.get('location')) throw Error('Google start must return a 303 redirect');
  const bridge = new URL(start.headers.get('location'), site);
  const token = bridge.searchParams.getAll('token');
  if (bridge.origin !== init.origin || bridge.pathname !== init.pathname || bridge.username || bridge.password || bridge.hash || token.length !== 1 ||
      !/^[A-Za-z0-9._~-]{16,2048}$/.test(token[0]) || [...bridge.searchParams.keys()].some(key => key !== 'token')) throw Error('Google start returned an unexpected bridge');
  const provider = await get(bridge.href);
  if (![302, 303, 307, 308].includes(provider.status) || !provider.headers.get('location')) throw Error('Neon did not redirect to Google; check its Google provider');
  const google = new URL(provider.headers.get('location'), bridge);
  if (google.protocol !== 'https:' || google.hostname !== 'accounts.google.com' || google.port || google.username || google.password || google.hash ||
      !['/o/oauth2/v2/auth', '/o/oauth2/auth'].includes(google.pathname)) throw Error('Neon returned an unexpected provider');
  if (google.searchParams.getAll('client_id').length !== 1 || google.searchParams.get('client_id') !== expectedClient) throw Error('Google redirect uses the wrong OAuth client');
  if (google.searchParams.getAll('redirect_uri').length !== 1 || google.searchParams.getAll('state').length !== 1 || !google.searchParams.get('state') || google.searchParams.get('response_type') !== 'code') throw Error('Google authorization parameters incomplete');
  const callback = new URL(google.searchParams.get('redirect_uri'));
  if (callback.protocol !== 'https:' || callback.origin !== init.origin || callback.username || callback.password || callback.search || callback.hash) throw Error('Google provider callback does not belong to the configured Neon Auth');
  return { status: 'PASS_REDIRECT_ONLY', origin: site.origin, clientId: expectedClient, providerCallback: callback.href, redirectHops: 2, signedIn: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = name => process.argv.find(value => value.startsWith(name + '='))?.slice(name.length + 1);
  try {
    console.log(JSON.stringify(await googleSigninSmoke({ origin: arg('--origin'), clientId: arg('--client-id') || process.env.SYNERA_GOOGLE_CLIENT_ID }), null, 2));
  } catch (error) { console.error(JSON.stringify({ status: 'HOLD', error: error.message, signedIn: false })); process.exitCode = 1; }
}
