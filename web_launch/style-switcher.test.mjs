import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { SYNERA_STYLE, ATELIER_STYLE, ORIGINAL_STYLE, COMPACT_PRESETS, ALL_STYLES, applyStyle, normalizeStyle, styleToggleCopy, installStyleSwitcher } from './style-switcher.mjs';

test('style switcher defaults malformed or absent preference to the original Synera visual language', () => {
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
  assert.equal(cacheName, 'synera-shell-20261002-triangle-v11');
  assert.ok(cachedShell.includes('/style-switcher.mjs'));
  assert.ok(cachedShell.includes('/onboarding-tour.mjs'));
  assert.ok(cachedShell.includes('/demo-journey.mjs'));
});
