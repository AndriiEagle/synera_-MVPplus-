import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { DemoStore, SupabaseStore } from './data.mjs';
import { BOT_PROFILES, simulationAt, simulatedReply, demoCollaborations } from './simulation.mjs';
import { parseProfileImport, parseProfileCsv } from './profile-portability.mjs';
import { consentRecord } from './pilot-policy.mjs';
import { visibleTiles, cityLocation } from './map.mjs';
import { validateConfig } from './config.mjs';
import { PUBLIC_ASSETS } from './assets.mjs';
import { buildBotHourPlan, validateBotHour } from '../tools/bot-hour-pack.mjs';
const at = new Date('2026-09-05T12:00:00Z');

test('ten identifiable synthetic bots change only with the hour and rest at night', () => {
  assert.equal(BOT_PROFILES.length, 10); assert.equal(new Set(BOT_PROFILES.map(p => p.id)).size, 10);
  const first = simulationAt(at), same = simulationAt('2026-09-05T12:59:59Z'), next = simulationAt('2026-09-05T13:00:00Z');
  assert.deepEqual(first, same); assert.notDeepEqual(first.map(b => b.place), next.map(b => b.place));
  assert.ok(first.every(b => b.is_bot && b.location_kind === 'synthetic'));
  assert.ok(simulationAt('2026-09-05T01:00:00Z').every(b => b.state === 'offline'));
  assert.ok(demoCollaborations(at).every(pair => pair.simulated && pair.summary.includes('двостороння')));
});
test('bot meetings respond next hour, remain idempotent and never pretend every request is a match', async () => {
  const store = new DemoStore({ bots: true }); await store.signIn();
  assert.equal((await store.discover()).length, 10);
  await store.invite('bot-leo', 'Synthetic meeting'); await store.tick();
  assert.equal((await store.meetings())[0].status, 'pending');
  await store.advanceHour(); const request = (await store.meetings())[0];
  assert.equal(request.status, 'accepted'); assert.equal(request.simulated, true);
  await store.tick(); assert.deepEqual((await store.meetings())[0], request);
  assert.equal(simulatedReply({ offers: '', seeks: '' }, BOT_PROFILES[0], at).status, 'declined');
  assert.throws(() => simulatedReply({}, { id: 'real-user' }, at));
});
test('consent cannot be accepted by default and contains no forged server timestamp', async () => {
  assert.throws(() => consentRecord()); assert.throws(() => consentRecord({ terms: true }));
  const record = consentRecord({ terms: true, privacy: true, accepted_at: 'fake' });
  assert.equal('accepted_at' in record, false);
  const store = new DemoStore({ bots: true }); await store.signIn(); await store.acceptPolicy(record);
  assert.equal(store.consents[0].demo_only, true);
});
test('LinkedIn Profile.csv maps one owned profile, ignores private columns and rejects contacts/multiple people', () => {
  const csv = 'First Name,Last Name,Headline,Geo Location,Birth Date,Email Address\nSynthetic,Founder,"Design, research",Zürich,1900-01-01,synthetic@example.invalid';
  assert.equal(parseProfileCsv(csv).status, 'consent_required');
  const result = parseProfileCsv(csv, { authorized: true });
  assert.equal(result.profile.display_name, 'Synthetic Founder'); assert.equal(result.profile.offers, 'Design, research');
  assert.equal(result.profile.is_discoverable, false); assert.equal(JSON.stringify(result.profile).includes('example.invalid'), false);
  assert.throws(() => parseProfileCsv(csv + '\nSecond,Person,Sales,Baden,,', { authorized: true }));
  assert.throws(() => parseProfileCsv('First Name,Last Name,Email Address\nA,B,test@example.invalid', { authorized: true }));
});
test('GPT JSON fences are parsed, import visibility is always off, archive JSON is rejected', () => {
  const input = '```json\n' + JSON.stringify({ format: 'synera-profile-1', profile: { display_name: 'Synthetic', offers: 'AI', is_discoverable: true } }) + '\n```';
  assert.equal(parseProfileImport(input, { authorized: true }).profile.is_discoverable, false);
  assert.equal(parseProfileImport('[{"conversations":[]}]', { authorized: true }).profile.display_name, '');
});
test('map uses a bounded visible tile area and never invents precise real-user locations', () => {
  assert.ok(visibleTiles({ lat: 47.376, lon: 8.536 }, 390, 360, 13).length <= 9);
  assert.equal(cityLocation({ city: 'Zürich', lat: 1, lon: 2 }), null);
  const located = cityLocation({ city: 'Zürich', lat: 1, lon: 2, map_visible: true, is_discoverable: true });
  assert.equal(located.location_kind, 'city'); assert.notEqual(located.lat, 1);
  assert.equal(cityLocation({ city: 'Unknown' }), null);
});
test('registration fails closed without verified schema, site and explicit consent', async () => {
  const config = { supabaseUrl: 'https://synthetic.supabase.co', publishableKey: 'sb_publishable_synthetic' };
  assert.throws(() => validateConfig({ ...config, registrationEnabled: true }));
  let calls = 0; const store = new SupabaseStore(config, async () => { calls++; });
  await assert.rejects(store.signUp('test@example.invalid', 'synthetic-password', { terms: true, privacy: true })); assert.equal(calls, 0);
});
test('saved session contains only refresh token, rotates on restore and is cleared after failed logout', async () => {
  const rows = new Map(), storage = { getItem: k => rows.get(k) ?? null, setItem: (k,v) => rows.set(k,v), removeItem: k => rows.delete(k) };
  const config = { supabaseUrl: 'https://synthetic.supabase.co', publishableKey: 'sb_publishable_synthetic' };
  const fetcher = async url => url.includes('/logout') ? new Response(null, { status: 503 }) : new Response(JSON.stringify({ access_token: 'test-access', refresh_token: url.includes('refresh_token') ? 'rotated' : 'original', expires_in: 3600, user: { id: 'test-user' } }));
  const first = new SupabaseStore(config, fetcher); first.remember(storage); await first.signIn('test@example.invalid', 'test');
  assert.deepEqual(JSON.parse(rows.get(first.storageKey)), { refresh_token: 'original' });
  const second = new SupabaseStore(config, fetcher); assert.equal(await second.restore(storage), true);
  assert.equal(JSON.parse(rows.get(first.storageKey)).refresh_token, 'rotated');
  await assert.rejects(second.signOut()); assert.equal(rows.size, 0);
});
test('email recovery rejects malformed hashes before network and strips client timestamps from consent writes', async () => {
  const calls = [], store = new SupabaseStore({ supabaseUrl: 'https://synthetic.supabase.co', publishableKey: 'sb_publishable_synthetic', pilotSafetyEnabled: true }, async (url, options) => {
    calls.push({ url, options }); return url.includes('/verify') ? new Response(JSON.stringify({ access_token: 'test', refresh_token: 'test', expires_in: 3600, user: { id: 'test-user' } })) : new Response(null, { status: 204 });
  });
  await assert.rejects(store.verifyEmailToken('bad', 'recovery')); assert.equal(calls.length, 0);
  await store.verifyEmailToken('a'.repeat(64), 'recovery'); await store.acceptPolicy({ terms: true, privacy: true, user_id: 'other', accepted_at: 'fake' });
  const body = JSON.parse(calls[1].options.body); assert.equal(body.user_id, 'test-user'); assert.equal('accepted_at' in body, false);
});
test('service worker intercepts only public shell/config; online API, query tokens and map tiles pass through', async () => {
  const listeners = {}; const context = { self: { location: { origin: 'https://synera.example' }, addEventListener: (name, fn) => { listeners[name] = fn; } }, URL, Response,
    fetch: async () => { throw new Error('offline'); }, caches: { match: async () => new Response('shell') } };
  vm.runInNewContext(await fs.readFile(new URL('./sw.mjs', import.meta.url), 'utf8'), context);
  for (const url of ['https://synthetic.supabase.co/auth/v1/token', 'https://tile.openstreetmap.org/13/1/1.png', 'https://synera.example/?token_hash=private', 'https://synera.example/rest/v1/profiles']) {
    let intercepted = false; listeners.fetch({ request: new Request(url), respondWith() { intercepted = true; } }); assert.equal(intercepted, false, url);
  }
  let response; listeners.fetch({ request: new Request('https://synera.example/config.json'), respondWith(value) { response = value; } });
  const unavailable = await response; assert.equal(unavailable.status, 503);
  const config = await unavailable.json(); assert.deepEqual(config, { offline: true });
});
test('PWA manifest icons exist and public shell imports are all included in the release allowlist', async () => {
  const manifest = JSON.parse(await fs.readFile(new URL('./manifest.webmanifest', import.meta.url), 'utf8')); assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const bytes = await fs.readFile(new URL('.' + icon.src, import.meta.url)); const size = Number(icon.sizes.split('x')[0]);
    assert.equal(bytes.readUInt32BE(16), size); assert.equal(bytes.readUInt32BE(20), size); assert.ok(PUBLIC_ASSETS[icon.src.slice(1)]);
  }
  for (const name of Object.keys(PUBLIC_ASSETS).filter(name => name.endsWith('.mjs'))) {
    const content = await fs.readFile(new URL(name, import.meta.url), 'utf8');
    for (const match of content.matchAll(/from ['"]\.\/([^'"]+)['"]/g)) assert.ok(PUBLIC_ASSETS[match[1]], `${name} imports ${match[1]}`);
  }
});
test('one API pack uses only ten synthetic personas, low reasoning and one attempt; malformed output never passes', () => {
  const plan = buildBotHourPlan(at); assert.equal(plan.length, 1); assert.equal(plan[0].retries, 1); assert.equal(plan[0].effort, 'low'); assert.deepEqual(plan[0].files, []);
  assert.equal(plan[0].prompt.includes('andriipokrovskyi'), false);
  const value = { hour: Math.floor(at.getTime() / 3600000), bots: BOT_PROFILES.map(b => ({ id: b.id, place_id: 'west', state: 'working', activity: 'Перевіряє демопрототип' })) };
  assert.equal(validateBotHour(value, at).bots.length, 10);
  assert.throws(() => validateBotHour({ ...value, hour: value.hour - 1 }, at));
  const duplicate = structuredClone(value); duplicate.bots[1].id = duplicate.bots[0].id; assert.throws(() => validateBotHour(duplicate, at));
  const secret = structuredClone(value); secret.bots[0].activity = 'contact@example.invalid'; assert.throws(() => validateBotHour(secret, at));
});
test('SYN_CONSENT_STATE_BEFORE_USE: no top-level binding of app.mjs is declared after the startup await', async () => {
  // Session restore runs inside the startup await and calls fillProfileForm/renderPeople; any top-level
  // const/let/class declared below that await is still in its temporal dead zone at that moment.
  const lines = (await fs.readFile(new URL('./app.mjs', import.meta.url), 'utf8')).split(/\r?\n/);
  const startup = lines.findIndex(line => line.includes("await fetch('/config.json'"));
  assert.ok(startup > 0, 'startup await not found');
  const late = lines.slice(startup).filter(line => /^(const|let|class)\s/.test(line));
  assert.deepEqual(late, []);
  const source = lines.join('\n');
  assert.ok(source.indexOf('const consentState') < source.indexOf('consentState.'), 'consentState is read before it is declared');
});
test('SYN_CONSENT_PANEL_MARKUP: every consent id app.mjs looks up exists once in index.html, off by default, recording locked', async () => {
  // The app null-guards these lookups, so missing markup degrades silently into a gate nobody can open.
  const app = await fs.readFile(new URL('./app.mjs', import.meta.url), 'utf8');
  const html = await fs.readFile(new URL('./index.html', import.meta.url), 'utf8');
  const ids = [...new Set([...app.matchAll(/getElementById\('(consent-[a-z-]+)'\)/g)].map(match => match[1]))];
  assert.equal(ids.length, 7);
  for (const id of ids) assert.equal(html.split(`id="${id}"`).length - 1, 1, id);
  const inputs = [...html.matchAll(/<input id="consent-[^>]*>/g)].map(match => match[0]);
  assert.equal(inputs.length, 7);
  for (const input of inputs) assert.equal(/\schecked\b/.test(input), false, input);
  assert.match(inputs.find(input => input.includes('consent-recording')), /\sdisabled\b/);
});
test('SYN_RUN_KEEPS_GATES: run() restores each button instead of enabling every gated one', async () => {
  // Executes the real run() from app.mjs with stub buttons; a blanket re-enable reopened the introduction gate.
  const source = await fs.readFile(new URL('./app.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('async function run(action) {');
  const end = source.indexOf('\n}\n', start);
  assert.ok(start >= 0 && end > start, 'run() not found');
  const gated = { disabled: true }, open = { disabled: false }, created = { disabled: true };
  const buttons = [gated, open];
  const context = {
    busy: false, store: null, own: null, onlineReady: true, ServiceError: class {}, Map,
    document: { querySelectorAll: () => buttons },
    $: () => ({ setAttribute() {}, textContent: '' }),
    message: () => {}, showSignedOut: () => {}, applyAuthState: () => {},
  };
  vm.runInNewContext(source.slice(start, end + 2) + '\nglobalThis.run = run;', context);
  let during;
  await context.run(async () => { during = [gated.disabled, open.disabled]; buttons.push(created); });
  assert.deepEqual(during, [true, true]);
  assert.equal(gated.disabled, true, 'a gated button was re-enabled');
  assert.equal(open.disabled, false);
  assert.equal(created.disabled, true, 'a button rendered during the action lost its own state');
  await context.run(async () => { throw new Error('boom'); });
  assert.equal(gated.disabled, true);
  assert.equal(open.disabled, false);
});
test('SYN_CASE_ACTION_NOT_NESTED: a case button click reaches the domain action through btn() -> run()', async () => {
  // Executes the real btn/run/caseAction trio; a nested run() inside caseAction returned early and dropped every approval.
  const source = await fs.readFile(new URL('./app.mjs', import.meta.url), 'utf8');
  const slice = header => { const start = source.indexOf(header); const end = source.indexOf('\n}\n', start); assert.ok(start >= 0 && end > start, header); return source.slice(start, end + 2); };
  const fnLine = header => { const start = source.indexOf(header); assert.ok(start >= 0, header); return source.slice(start, source.indexOf('\n', start) + 1); };
  const listeners = [], messages = [];
  const context = {
    busy: false, store: null, own: null, onlineReady: true, ServiceError: class {}, Map,
    document: { querySelectorAll: () => [] },
    $: () => ({ setAttribute() {}, textContent: '' }),
    el: () => ({ type: '', addEventListener: (_, handler) => listeners.push(handler) }),
    knownError: text => new Error(text), renderPeople: () => {},
    message: text => messages.push(text), showSignedOut: () => {}, applyAuthState: () => {},
  };
  vm.runInNewContext([fnLine('function btn('), slice('async function run(action) {'), slice('function caseAction(')].join('\n') + '\nglobalThis.btn = btn;', context);
  const calls = [];
  context.btn('Підтвердити умови', () => context.caseAction('person-b', key => calls.push(key), 'saved'));
  await listeners[0]();
  assert.deepEqual(calls, ['person-b']);
  assert.deepEqual(messages, ['saved']);
});
test('SYN_INTRODUCTION_NEEDS_CONSENT: no code path can open the invite button without the introduction consent', async () => {
  // caseSection renders asynchronously after the consent gate; an assignment there must not reopen it.
  const source = await fs.readFile(new URL('./app.mjs', import.meta.url), 'utf8');
  const assignments = [...source.matchAll(/inviteButton\.disabled\s*=\s*([^;]+);/g)].map(match => match[1].trim());
  assert.ok(assignments.length >= 2);
  const opening = assignments.filter(value => value !== 'true');
  assert.ok(opening.length >= 1);
  for (const value of opening) {
    const variable = value.replace(/^!/, '');
    const decided = source.match(new RegExp('const ' + variable + ' = ([^;]+);'))?.[1] ?? value;
    assert.match(decided, /consentState\.introduction/, value);
  }
});

test('SYN_CONSENT_PANEL_7: seven toggles in index.html, defaults off, recording locked, revokes instant', async () => {
  const html = await fs.readFile(new URL('./index.html', import.meta.url), 'utf8');
  const ids = ['consent-visibility','consent-comparison','consent-introduction','consent-external-ai','consent-recording','consent-summary','consent-analytics-sync'];
  for (const id of ids) assert.ok(html.includes(`id="${id}"`), `toggle ${id} missing`);
  // recording toggle is disabled (locked OFF)
  const recInput = html.match(/<input id="consent-recording"[^>]*>/)[0];
  assert.ok(recInput.includes('disabled'), 'recording must be disabled');
  // each toggle has microcopy "що це дає тобі"
  const panel = html.slice(html.indexOf('SYN_CONSENT_PANEL_MARKUP'), html.indexOf('SYN_CONSENT_PANEL_MARKUP') + 5000);
  assert.equal((panel.match(/що це дає тобі/g) || []).length, 7);
  const app = await fs.readFile(new URL('./app.mjs', import.meta.url), 'utf8');
  // revoke comparison -> case output hidden
  assert.ok(app.includes('!consentState.comparison'), 'comparison revoke guard missing');
  // revoke introduction -> invite button disabled
  assert.ok(app.includes('!consentState.introduction'), 'introduction revoke guard missing');
  // analytics off -> zero telemetry writes (no writeEventsLog call in app.mjs)
  assert.ok(!app.includes('writeEventsLog'), 'app.mjs must not call telemetry writer');
  // consentState initialized with all defaults false
  assert.ok(app.includes('comparison: false') && app.includes('introduction: false') && app.includes('analytics_sync: false'), 'consent defaults not all false');
});
