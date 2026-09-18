import test from 'node:test';
import assert from 'node:assert/strict';
import { createInvitationDraft, createPortableProfile, createPortableProfileJson, createShareCard, parseProfileImport, profileCompletion, profileMatchHint, profileSafetyFindings } from './profile-portability.mjs';
import { ProfileStore } from './profile-store.mjs';
import { SupabaseStore } from './online-store.mjs';
import { NeonStore } from './neon-store.mjs';
import { createCaseState } from './business-case.mjs';
import { normalizeBrief } from './profile-brief.mjs';
import { mapHintsToProfileDraft, redactHints } from './profile-import.mjs';

// B3/B4/F6 harness: ProfileStore with a captured _send; remote stores with a fake fetch.
function wireStore(store, handler) {
  store.user = { id: 'u-1', email: 'u@example.invalid' };
  store.pilotSafetyEnabled = true;
  store.realPilotEnabled = true;
  const calls = [];
  store._send = async (path, options = {}) => { calls.push({ path, options }); return handler(path, options); };
  return calls;
}
const material = (overrides = {}) => ({
  mode: 'paid_service', components: ['paid_service'],
  outcomes: [{ receiver_id: 'a', capability_tag: 'sales', target: 'Review one synthetic offer' }],
  trial: { starts_on: '2026-09-08', due_on: '2026-09-12', deliverables: [{ giver_id: 'b', receiver_id: 'a', capability_tag: 'sales', target: 'One review', acceptance_criteria: 'Receiver explicitly accepts this version' }] },
  compensation: { status: 'agreed_money', amount_minor: 12000, currency: 'CHF', invoice_required: true },
  terms: { revision_limit: 1, confidentiality: 'required', intellectual_property: 'receiver', cancellation: 'mutual_written_notice' },
  ...overrides,
});
const pilotBrief = () => normalizeBrief({ goal: 'Відео для мого продукту', offer_tags: ['sales'], need_tags: ['video'], languages: ['de'], modes: ['paid_service'], mode_details: { paid_service: { role: 'buyer' } }, available_from: '2026-10-01', available_until: '2026-12-31', remote: true });
const profileRow = brief => ({ id: 'u-1', display_name: 'Anna', city: 'Zürich', offers: 'Sales', seeks: 'Video', is_discoverable: false, map_visible: false, brief });
const saveProfileInput = brief => ({ display_name: 'Anna', city: 'Zürich', offers: 'Sales', seeks: 'Video', is_discoverable: false, map_visible: false, brief });

const profile = { display_name: 'Anna Keller', city: 'Zürich', offers: 'AI workflow automation for small teams', seeks: 'B2B sales intros and pricing feedback', is_discoverable: true };

test('profile import: consent is required before profile content is emitted', () => {
  const result = parseProfileImport('Name: Anna\nCity: Zürich\nI can help with: Design', { authorized: false });
  assert.equal(result.status, 'consent_required');
  assert.deepEqual(result.profile, { display_name: '', city: '', offers: '', seeks: '', is_discoverable: false });
});

test('profile import: labeled text is mapped into the existing profile fields', () => {
  const result = parseProfileImport('Ім’я: Анна\nМісто: Zürich\nМожу допомогти: UX design\nШукаю: B2B sales', { authorized: true });
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.profile, { display_name: 'Анна', city: 'Zürich', offers: 'UX design', seeks: 'B2B sales', is_discoverable: false });
});

test('profile import: generic pasted profile stays in review mode', () => {
  const result = parseProfileImport('Anna Keller\nFounder building AI matchmaking in Zurich', { authorized: true });
  assert.equal(result.status, 'needs_review');
  assert.equal(result.profile.display_name, 'Anna Keller');
  assert.equal(result.profile.offers, '');
});

test('profile import: contacts and provider secrets block import before preview', () => {
  const contact = parseProfileImport('Name: Anna\nEmail: anna@example.invalid\nI can help with: design', { authorized: true });
  assert.equal(contact.status, 'blocked_sensitive');
  assert.deepEqual(contact.profile, { display_name: '', city: '', offers: '', seeks: '', is_discoverable: false });
  assert.equal(parseProfileImport('Name: Anna\nKey: sb_secret_abcdef', { authorized: true }).status, 'blocked_sensitive');
});

test('profile export: JSON roundtrip uses only portable public fields and disables visibility', () => {
  const json = createPortableProfileJson({ ...profile, id: 'owner-id', email: 'hidden@example.invalid' }, { exportedAt: '2026-09-04T12:00:00.000Z' });
  assert.equal(json.includes('owner-id'), false);
  assert.equal(json.includes('hidden@example'), false);
  const imported = parseProfileImport(json, { authorized: true });
  assert.equal(imported.status, 'ready');
  assert.equal(imported.profile.is_discoverable, false);
  assert.deepEqual(createPortableProfile(profile, { exportedAt: '2026-09-04T12:00:00.000Z' }).profile.is_discoverable, false);
});

test('profile sharing: localhost is omitted and sensitive fields are rejected', () => {
  const card = createShareCard(profile, { publicUrl: 'http://127.0.0.1:50877/' });
  assert.ok(card.includes('Synera profile: Anna Keller'));
  assert.equal(card.includes('127.0.0.1'), false);
  assert.throws(() => createShareCard({ ...profile, offers: 'Write me at anna@example.invalid' }));
  assert.deepEqual(profileSafetyFindings({ display_name: 'Anna', city: '', offers: 'sk-123456789012345678901234', seeks: '' }), ['можу допомогти:secret']);
});

test('profile completion: reports the four public fields users need for matchmaking', () => {
  assert.deepEqual(profileCompletion({ display_name: 'Anna', city: '', offers: '', seeks: 'Sales' }), { completed: 2, total: 4, missing: ['місто', 'що можеш дати'] });
});

test('profile match hint: distinguishes reciprocal, one-way and missing signal', () => {
  const left = { offers: 'UX design and AI automation', seeks: 'B2B sales intros' };
  const right = { offers: 'B2B sales and outreach', seeks: 'product design help' };
  assert.equal(profileMatchHint(left, right).status, 'reciprocal');
  assert.equal(profileMatchHint(left, { offers: 'B2B sales', seeks: '' }).status, 'one_way');
  assert.equal(profileMatchHint({ offers: 'gardening', seeks: 'hiking' }, { offers: 'cooking', seeks: 'music' }).status, 'no_signal');
  assert.ok(createInvitationDraft(left, right).includes('20 хвилин'));
});

test('profile match hint: Ukrainian compound words produce a reciprocal demo signal', () => {
  const left = { offers: 'Відеопрезентація і дизайн профілю', seeks: 'B2B-продажі та перші інтро' };
  const right = { offers: 'B2B-продажі та customer interviews', seeks: 'Відеопрезентація продукту' };
  const hint = profileMatchHint(left, right);
  assert.equal(hint.status, 'reciprocal');
  assert.ok(hint.label.includes('Відеопрезентація'));
  assert.ok(hint.label.includes('B2B-продажі'));
});

test('SYN_STORE_CARRIES_MODE_DETAILS: brief v2 with mode_details round-trips byte-identically; legacy v1 stays v1', async () => {
  const brief = pilotBrief();
  assert.equal(brief.version, 2);
  assert.equal(brief.mode_details?.paid_service?.role, 'buyer');
  const store = new ProfileStore();
  const calls = wireStore(store, () => []);
  await store.saveProfile(saveProfileInput(brief));
  const posted = calls.find(call => call.path.startsWith('/rest/v1/profiles'));
  assert.ok(posted, 'saveProfile posts to the profiles endpoint');
  assert.deepEqual(posted.options.body.brief, brief); // normalizeBrief is canonical: nothing reshaped, mode_details intact
  assert.equal(posted.options.body.brief.version, 2);
  // read path returns the stored brief as-is: no version upgrade, no reshaping
  const readStore = new ProfileStore();
  wireStore(readStore, () => [profileRow(posted.options.body.brief)]);
  const loaded = await readStore.ownProfile();
  assert.equal(JSON.stringify(loaded.brief), JSON.stringify(brief)); // byte-identical
  // legacy v1 profile without mode_details round-trips identically and is never silently upgraded
  const legacy = normalizeBrief({ goal: 'Старе знайомство', offer_tags: ['sales'], need_tags: ['video'], languages: ['de'], modes: ['exchange'], available_from: '2026-10-01', available_until: '2026-12-31', remote: true });
  assert.equal(legacy.version, 1);
  assert.equal('mode_details' in legacy, false);
  await store.saveProfile(saveProfileInput(legacy));
  const legacyPosted = calls.filter(call => call.path.startsWith('/rest/v1/profiles')).pop();
  assert.equal(legacyPosted.options.body.brief.version, 1);
  assert.equal('mode_details' in legacyPosted.options.body.brief, false);
  // an unknown future brief field never crashes the store path
  await store.saveProfile(saveProfileInput({ ...legacy, future_field: 'x' }));
});

test('SYN_STORE_CARRIES_CASE_STATE: store persists exactly what createCaseState returns, hash never recomputed', async () => {
  const state = await createCaseState({ caseId: 'case-a-b', participants: ['a', 'b'], material: material(), now: '2026-09-08T10:00:00.000Z', expiresAt: '2026-09-15T10:00:00.000Z' });
  const store = new ProfileStore();
  const calls = wireStore(store, () => []);
  await store.saveCaseState({ ...state, smuggled: 'extra' });
  const posted = calls.find(call => call.options?.method === 'POST');
  assert.equal(posted.path, '/rest/v1/match_cases?on_conflict=case_id');
  assert.equal(posted.options.method, 'POST');
  assert.equal(posted.options.body.case_id, 'case-a-b');
  const clean = posted.options.body.state;
  assert.equal(clean.schema, 'synera.case-state.v1');
  assert.deepEqual(Object.keys(clean).sort(), ['approvalAttestation', 'approvals', 'binding', 'caseId', 'closeReason', 'closedAt', 'closedBy', 'createdAt', 'events', 'expiresAt', 'material', 'participants', 'schema', 'status', 'termsHash', 'timeAuthority', 'updatedAt', 'version']);
  assert.equal('smuggled' in clean, false); // only what createCaseState returns
  assert.equal(clean.termsHash, state.termsHash);
  // read path returns the state untouched; the terms hash is never recomputed on read
  const readStore = new ProfileStore();
  wireStore(readStore, path => path.includes('case-a-b') ? [{ state: clean }] : []);
  const loaded = await readStore.caseState('case-a-b');
  assert.equal(JSON.stringify(loaded), JSON.stringify(clean));
  assert.equal(await readStore.caseState('case-none'), null);
  // fail closed on invalid shapes
  await assert.rejects(() => store.saveCaseState({ ...state, schema: 'other.v9' }));
  await assert.rejects(() => store.saveCaseState({ ...state, termsHash: 'short' }));
  await assert.rejects(() => store.saveCaseState({ ...state, participants: ['u-1'] }));
});

test('SYN_REMOTE_STORE_SHAPE_MATCHES: Neon/Supabase inherit the store bodies and post identical field names', async () => {
  // no duplicated read/write bodies: subclasses never override the store contract
  for (const Store of [SupabaseStore, NeonStore]) {
    for (const method of ['ownProfile', 'saveProfile', 'saveCaseState', 'caseState', 'discover']) {
      assert.equal(Store.prototype[method], ProfileStore.prototype[method], `${Store.name}.${method} must be inherited, not copied`);
    }
  }
  const brief = pilotBrief();
  const state = await createCaseState({ caseId: 'case-a-b', participants: ['a', 'b'], material: material(), now: '2026-09-08T10:00:00.000Z', expiresAt: '2026-09-15T10:00:00.000Z' });
  const localStore = new ProfileStore();
  const localCalls = wireStore(localStore, () => []);
  await localStore.saveProfile(saveProfileInput(brief));
  await localStore.saveCaseState(state);
  const supaCalls = [];
  const tokenResponse = { ok: true, status: 200, text: async () => JSON.stringify({ access_token: 'test-access', refresh_token: 'test-refresh', expires_in: 3600, user: { id: 'u-1' } }) };
  const emptyResponse = { ok: true, status: 200, text: async () => '' };
  const supa = new SupabaseStore({ supabaseUrl: 'https://demo.supabase.co', publishableKey: 'sb_publishable_synthetic', pilotSafetyEnabled: true, realPilotEnabled: true }, async (url, options) => { supaCalls.push({ url, options }); return url.includes('/auth/v1/token') ? tokenResponse : emptyResponse; });
  await supa.signIn('test@example.invalid', 'synthetic-password');
  await supa.saveProfile(saveProfileInput(brief));
  await supa.saveCaseState(state);
  const neonCalls = [];
  const neon = new NeonStore({ backend: 'neon', pilotSafetyEnabled: true, realPilotEnabled: true }, async (url, options) => { neonCalls.push({ url, options }); return url.includes('/api/neon/session') ? { ok: true, status: 200, text: async () => JSON.stringify({ user: { id: 'u-1' } }) } : emptyResponse; });
  await neon.restore();
  await neon.saveProfile(saveProfileInput(brief));
  await neon.saveCaseState(state);
  // local _send receives the raw body object; remote transports serialize it — field names must match
  const localBrief = JSON.stringify(localCalls.find(call => call.path.startsWith('/rest/v1/profiles')).options.body.brief);
  const localState = JSON.stringify(localCalls.find(call => call.path.startsWith('/rest/v1/match_cases?on_conflict')).options.body.state);
  const remoteBrief = calls => JSON.parse(calls.find(call => typeof call.options.body === 'string' && call.options.body.includes('"brief"')).options.body).brief;
  const remoteState = calls => JSON.parse(calls.find(call => typeof call.options.body === 'string' && call.options.body.includes('"caseId"')).options.body).state;
  assert.equal(JSON.stringify(remoteBrief(supaCalls)), localBrief);
  assert.equal(JSON.stringify(remoteBrief(neonCalls)), localBrief);
  assert.equal(JSON.stringify(remoteState(supaCalls)), localState);
  assert.equal(JSON.stringify(remoteState(neonCalls)), localState);
});

test('SYN_PORTABILITY_ROUNDTRIP_PROVEN: legacy export unchanged, v2 brief byte-identical, future field safe', async () => {
  // legacy version-1 export imports unchanged
  const legacyJson = createPortableProfileJson({ display_name: 'Anna Keller', city: 'Zürich', offers: 'AI automation', seeks: 'Sales intros' }, { exportedAt: '2026-09-04T12:00:00.000Z' });
  const imported = parseProfileImport(legacyJson, { authorized: true });
  assert.equal(imported.status, 'ready');
  assert.deepEqual(imported.profile, { display_name: 'Anna Keller', city: 'Zürich', offers: 'AI automation', seeks: 'Sales intros', is_discoverable: false });
  // version-2 brief with mode_details round-trips the store byte-identically
  const brief = pilotBrief();
  const store = new ProfileStore();
  const calls = wireStore(store, () => []);
  await store.saveProfile(saveProfileInput(brief));
  const savedBrief = calls[0].options.body.brief;
  const readStore = new ProfileStore();
  wireStore(readStore, () => [profileRow(savedBrief)]);
  const loaded = await readStore.ownProfile();
  assert.equal(JSON.stringify(loaded.brief), JSON.stringify(brief));
  assert.equal(loaded.brief.version, 2);
  assert.deepEqual(loaded.brief.mode_details, brief.mode_details);
  // an export with an unknown future field does not crash the import
  const futuristic = JSON.stringify({ format: 'synera-profile-1', profile: { display_name: 'Anna', city: 'Zürich', offers: 'Sales', seeks: 'Video', mode_details: { paid_service: { role: 'buyer' } }, future_unknown_field: { nested: [1, 2, 3] } } });
  const future = parseProfileImport(futuristic, { authorized: true });
  assert.equal(future.status, 'ready');
  assert.equal(future.profile.display_name, 'Anna');
});

test('SYN_IMPORT_STORED: confirmed import draft round-trips through the store; rejected draft leaves it untouched', async () => {
  const parsed = mapHintsToProfileDraft({
    sphereHints: [{ value: 'paid service for a buyer: B2B sales', confidence: 'high' }],
    needHints: [{ value: 'video montage', confidence: 'high' }],
    languageHints: [{ value: 'deutsch', confidence: 'high' }],
    warnings: [],
  });
  assert.deepEqual(parsed.offer_tags, ['sales']);
  assert.deepEqual(parsed.need_tags, ['video']);
  assert.deepEqual(parsed.languages, ['de']);
  assert.deepEqual(parsed.modes, ['paid_service']);
  assert.equal(parsed.mode_details?.paid_service?.role, 'buyer');
  assert.equal(parsed.needsInformation, false);
  // mapped draft passes normalizeBrief without modification (F4 contract holds through the store)
  const brief = normalizeBrief(parsed);
  assert.deepEqual(normalizeBrief(brief), brief);
  const store = new ProfileStore();
  const calls = wireStore(store, () => []);
  await store.saveProfile({ display_name: 'Marko', city: 'Winterthur', offers: 'Video', seeks: 'Sales', is_discoverable: false, map_visible: false, brief });
  const posted = calls.find(call => call.path.startsWith('/rest/v1/profiles'));
  assert.equal(posted.options.body.brief.version, 2);
  assert.deepEqual(posted.options.body.brief.mode_details.paid_service.role, 'buyer');
  const readStore = new ProfileStore();
  wireStore(readStore, () => [profileRow(posted.options.body.brief)]);
  const loaded = await readStore.ownProfile();
  assert.equal(JSON.stringify(loaded.brief), JSON.stringify(brief));
  // a rejected draft (blocked secrets) never reaches the store: no _send call is made
  const dirty = redactHints({ sphereHints: [{ value: 'sales sk-abcdefghijklmnop1234', confidence: 'high' }], languageHints: [], needHints: [] });
  assert.ok(dirty.blockedSecrets.includes('api_key'));
  const rejectedStore = new ProfileStore();
  const rejectCalls = wireStore(rejectedStore, () => []);
  assert.equal(rejectCalls.length, 0); // no save call was made for the rejected draft
});
