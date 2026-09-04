import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoStore, SupabaseStore, ServiceError } from './data.mjs';
import { validateConfig, securityHeaders } from './config.mjs';

test('demo: anonymous reads fail and hidden profiles stay undiscoverable', async () => {
  const store = new DemoStore();
  await assert.rejects(store.discover());
  await store.signIn('demo-b');
  await store.saveProfile({ ...(await store.ownProfile()), is_discoverable: false });
  await store.signIn('demo-a');
  assert.equal((await store.discover()).some(p => p.id === 'demo-b'), false);
  await assert.rejects(store.invite('demo-b', 'Synthetic note'));
});

test('demo: request is visible only to participants and only recipient can respond', async () => {
  const store = new DemoStore();
  await store.signIn('demo-a');
  await store.invite('demo-b', 'Synthetic note');
  const [request] = await store.meetings();
  await assert.rejects(store.respond(request.id, 'accepted'));
  await assert.rejects(store.invite('demo-b', 'Duplicate'));
  await assert.rejects(store.invite('demo-a', 'Self'));
  await store.signIn('demo-c');
  assert.deepEqual(await store.meetings(), []);
  await assert.rejects(store.respond(request.id, 'accepted'));
  await store.signIn('demo-b');
  await store.respond(request.id, 'accepted');
  await assert.rejects(store.respond(request.id, 'declined'));
  await store.signIn('demo-a');
  assert.equal((await store.meetings())[0].status, 'accepted');
});

test('demo: signout removes access and profile validation rejects oversized data', async () => {
  const store = new DemoStore(); await store.signIn();
  await assert.rejects(store.saveProfile({ ...(await store.ownProfile()), offers: 'x'.repeat(301) }));
  await store.signOut(); await assert.rejects(store.ownProfile());
});

const config = { supabaseUrl: 'https://synthetic.supabase.co', publishableKey: 'sb_publishable_synthetic' };
const session = () => ({ access_token: 'synthetic-access', refresh_token: 'synthetic-refresh', expires_in: 3600, user: { id: 'synthetic-user' } });
const json = value => new Response(JSON.stringify(value), { status: 200 });

test('online adapter rejects secret keys and unexpected origins before a request', () => {
  assert.throws(() => new SupabaseStore({ ...config, publishableKey: 'sb_secret_not_allowed' }));
  assert.throws(() => new SupabaseStore({ ...config, supabaseUrl: 'https://synthetic.supabase.co.attacker.example' }));
  assert.throws(() => new SupabaseStore({ ...config, supabaseUrl: 'http://synthetic.supabase.co' }));
});

test('online adapter derives owner from session and excludes extra fields', async () => {
  const calls = [];
  const store = new SupabaseStore(config, async (url, options) => { calls.push({ url, options }); return url.includes('/token?') ? json(session()) : new Response(null, { status: 204 }); });
  await store.signIn('synthetic@example.invalid', 'not-a-real-password');
  await store.saveProfile({ id: 'another-user', display_name: 'Synthetic', city: '', offers: '', seeks: '', is_discoverable: false, private_field: 'do-not-send' });
  const body = JSON.parse(calls[1].options.body);
  assert.equal(body.id, 'synthetic-user');
  assert.equal('private_field' in body, false);
  assert.equal(calls[1].options.headers.Authorization, 'Bearer synthetic-access');
  assert.equal(calls[0].options.headers.Authorization, undefined);
});

test('online adapter coalesces expired-session refresh and clears memory on logout failure', async () => {
  let refreshCalls = 0;
  const store = new SupabaseStore(config, async (url) => {
    if (url.includes('grant_type=password')) return json({ ...session(), expires_at: 1 });
    if (url.includes('grant_type=refresh_token')) { refreshCalls++; return json(session()); }
    if (url.includes('/logout')) return new Response(null, { status: 503 });
    return json([]);
  });
  await store.signIn('synthetic@example.invalid', 'not-a-real-password');
  await Promise.all([store.discover(), store.meetings()]);
  assert.equal(refreshCalls, 1);
  await assert.rejects(store.signOut());
  assert.equal(store.user, null);
  await assert.rejects(store.discover());
});

test('online adapter does not report a zero-row response as successful acceptance', async () => {
  const store = new SupabaseStore(config, async url => url.includes('/token?') ? json(session()) : json([]));
  await store.signIn('synthetic@example.invalid', 'not-a-real-password');
  await assert.rejects(store.respond('missing-request', 'accepted'));
});

test('provider restriction is detected before credentials, with no retry or response-body exposure', async () => {
  const paths = [];
  const store = new SupabaseStore(config, async (url, options) => {
    paths.push(new URL(url).pathname);
    assert.equal(options.body, undefined);
    assert.equal(options.headers.Authorization, undefined);
    return new Response(JSON.stringify({ message: 'sensitive upstream diagnostic' }), { status: 402 });
  });
  await assert.rejects(store.availability(), error => error instanceof ServiceError && error.status === 402 && !error.message.includes('sensitive'));
  assert.deepEqual(paths, ['/auth/v1/settings']);
  assert.equal(store.user, null);
});

test('release config strips unrelated values and keeps client access within its Supabase origin', () => {
  const safe = validateConfig({ ...config, service_role: 'must-not-export', registrationEnabled: false });
  assert.equal('service_role' in safe, false);
  assert.equal(safe.registrationEnabled, false);
  assert.throws(() => validateConfig({ ...config, publishableKey: 'sb_secret_forbidden' }));
  assert.throws(() => validateConfig({ supabaseUrl: config.supabaseUrl }));
  const csp = securityHeaders(safe)['Content-Security-Policy'];
  assert.ok(csp.includes("connect-src 'self' https://synthetic.supabase.co;"));
  assert.equal(csp.includes('*'), false);
  assert.equal(csp.includes('unsafe-inline'), false);
});
