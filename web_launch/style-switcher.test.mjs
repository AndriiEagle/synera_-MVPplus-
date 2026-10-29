import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { SYNERA_STYLE, ATELIER_STYLE, ORIGINAL_STYLE, COMPACT_PRESETS, ALL_STYLES, applyStyle, normalizeStyle, styleToggleCopy, installStyleSwitcher } from './style-switcher.mjs';

test('style switcher defaults malformed or absent preference to the dark-with-gold Synera look; Atelier stays a choice', () => {
  assert.equal(normalizeStyle(undefined), SYNERA_STYLE);
  assert.equal(normalizeStyle('unknown'), SYNERA_STYLE);
  assert.equal(normalizeStyle(ATELIER_STYLE), ATELIER_STYLE);
  assert.equal(normalizeStyle(ORIGINAL_STYLE), ORIGINAL_STYLE);
  assert.equal(normalizeStyle('noir'), 'noir');
  assert.equal(COMPACT_PRESETS.length, 10);
  assert.equal(ALL_STYLES.length, 14);
  assert.ok(ALL_STYLES.includes('night'), 'premium night design is a selectable style');
});

test('style switcher changes only the visual preference and exposes the alternate style', () => {
  const root = { dataset: {} };
  const attributes = new Map();
  const button = { textContent: '', setAttribute: (name, value) => attributes.set(name, value) };
  assert.equal(applyStyle(root, button, ORIGINAL_STYLE), ORIGINAL_STYLE);
  assert.equal(root.dataset.syneraStyle, ORIGINAL_STYLE);
  assert.equal(button.textContent, 'Стиль: Web');
  assert.match(attributes.get('aria-label'), /Увімкнути стиль Synera/);
  assert.deepEqual(styleToggleCopy(ATELIER_STYLE), {
    text: 'Стиль: Atelier', label: 'Актуальний стиль Atelier. Увімкнути попередній вебстиль.'
  });
});

test('visual controls work when browser storage is denied and preserve an available preference', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const deniedWindow = {}; Object.defineProperty(deniedWindow, 'localStorage', { get() { throw new Error('storage denied'); } });
  Object.defineProperty(globalThis, 'window', { value: deniedWindow, configurable: true });
  try {
    for (const mode of ['getter-denied', 'read-denied', 'available']) {
      const events = {}, root = { dataset: { consent: 'private' } }, saved = new Map([['synera.style', ATELIER_STYLE]]);
      const button = { setAttribute() {}, addEventListener: (name, fn) => { events[name] = fn; } };
      const storage = mode === 'getter-denied' ? undefined : mode === 'read-denied' ? { getItem() { throw new Error('read denied'); }, setItem() { throw new Error('write denied'); } } : { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
      const current = installStyleSwitcher({ root, button, select: null, storage });
      assert.equal(current, mode === 'available' ? ATELIER_STYLE : SYNERA_STYLE, mode);
      events.click(); assert.equal(root.dataset.syneraStyle, mode === 'available' ? ORIGINAL_STYLE : ATELIER_STYLE, mode);
      assert.equal(root.dataset.consent, 'private', 'visual choice cannot change consent');
      if (mode === 'available') assert.equal(saved.get('synera.style'), ORIGINAL_STYLE, 'available storage still remembers the choice');
    }
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('the PWA refresh caches the visual module with a new shell version', async () => {
  const listeners = {};
  let cacheName = '';
  let cachedShell = [];
  const context = {
    URL, Response,
    fetch: async () => new Response('online'),
    self: { location: { origin: 'https://synera.example' }, skipWaiting() {}, addEventListener: (name, fn) => { listeners[name] = fn; } },
    caches: {
      open: async name => ({ addAll: async shell => { cacheName = name; cachedShell = shell; } }),
      keys: async () => [], match: async () => undefined
    }
  };
  vm.runInNewContext(await fs.readFile(new URL('./sw.mjs', import.meta.url), 'utf8'), context);
  let installation;
  listeners.install({ waitUntil: promise => { installation = promise; } });
  await installation;
  assert.equal(cacheName, 'synera-shell-20261029-darkgold1');
  for (const asset of ["/site-shell.css","/site-shell.mjs","/premium-match.webp","/premium-calendar.webp","/premium-terms.webp","/premium-signature.webp"]) assert.ok(cachedShell.includes(asset), asset);
  for (const previous of ['synera-shell-20261002-triangle-v11', 'synera-shell-20261019-audit-followup1', 'synera-shell-20261027-phone-v12', 'synera-shell-20261028-phone-merge1', 'synera-shell-20261029-adaptive1'])
    assert.notEqual(cacheName, previous, 'changed shell dependencies invalidate the previous cache');
  assert.ok(cachedShell.includes('/install-hint.mjs'));
  assert.ok(cachedShell.includes('/style-switcher.mjs'));
  assert.ok(cachedShell.includes('/onboarding-tour.mjs'));
  assert.ok(cachedShell.includes('/demo-journey.mjs'));
});


test('the PWA cache remains public and never answers offline account writes', async () => {
  const listeners = {}, matched = [], writes = [], network = [];
  let precached = [];
  const context = {
    URL, Response,
    fetch: async request => { network.push(new URL(request.url).pathname); throw new Error('synthetic offline'); },
    self: { location: { origin: 'https://synera.example' }, skipWaiting() {}, addEventListener: (name, fn) => { listeners[name] = fn; } },
    caches: {
      open: async () => ({ addAll: async shell => { precached = shell; }, put: async request => { writes.push(request.url); } }),
      match: async request => { matched.push(request.url); return new Response('public shell'); }
    }
  };
  vm.runInNewContext(await fs.readFile(new URL('./sw.mjs', import.meta.url), 'utf8'), context);
  let installation; listeners.install({ waitUntil: value => { installation = value; } }); await installation;
  assert.ok(precached.every(value => !value.includes('?') && !value.startsWith('/api/') && value !== '/config.json'));
  for (const module of ['/profile-import.mjs', '/index-language.mjs', '/atelier.mjs', '/atelier.css', '/index-i18n.mjs', '/index-i18n-table.mjs', '/real-journey-i18n.mjs', '/legal-language.mjs', '/legal-i18n.mjs']) assert.ok(precached.includes(module), module);
  async function dispatch(path, method = 'GET') {
    let response;
    const url = path.startsWith('https:') ? path : 'https://synera.example' + path;
    listeners.fetch({ request: { url, method }, respondWith: value => { response = value; } });
    return response === undefined ? undefined : await response;
  }
  assert.equal(await (await dispatch('/app.mjs')).text(), 'public shell');
  const before = matched.length;
  const config = await dispatch('/config.json');
  assert.equal(config.status, 503); assert.deepEqual(await config.json(), { offline: true });
  assert.equal(config.headers.get('cache-control'), 'no-store');
  assert.equal(matched.length, before, 'config never consults public shell cache');
  for (const [url, method] of [
    ['/api/neon/data/profiles', 'GET'], ['/app.mjs?draft=synthetic-local', 'GET'],
    ['https://other.example/app.mjs', 'GET'], ['/api/neon/data/profiles', 'POST'],
    ['/api/neon/data/profiles', 'PUT'], ['/api/neon/data/profiles', 'PATCH'],
    ['/api/neon/data/profiles', 'DELETE'], ['/app.mjs', 'POST']
  ]) assert.equal(await dispatch(url, method), undefined, `${method} ${url} is not answered by SW`);
  assert.equal(matched.length, before, 'private queries/API/writes never enter CacheStorage');
  assert.deepEqual(writes, []); assert.deepEqual(network, ['/app.mjs', '/config.json']);
});
