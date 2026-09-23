import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { ATELIER_STYLE, ORIGINAL_STYLE, applyStyle, normalizeStyle, styleToggleCopy } from './style-switcher.mjs';

test('style switcher defaults malformed or absent preference to Atelier', () => {
  assert.equal(normalizeStyle(undefined), ATELIER_STYLE);
  assert.equal(normalizeStyle('unknown'), ATELIER_STYLE);
  assert.equal(normalizeStyle(ORIGINAL_STYLE), ORIGINAL_STYLE);
});

test('style switcher changes only the visual preference and exposes the alternate style', () => {
  const root = { dataset: {} };
  const attributes = new Map();
  const button = { textContent: '', setAttribute: (name, value) => attributes.set(name, value) };
  assert.equal(applyStyle(root, button, ORIGINAL_STYLE), ORIGINAL_STYLE);
  assert.equal(root.dataset.syneraStyle, ORIGINAL_STYLE);
  assert.equal(button.textContent, 'Стиль: Original');
  assert.equal(attributes.get('aria-pressed'), 'true');
  assert.match(attributes.get('aria-label'), /Увімкнути стиль Atelier/);
  assert.deepEqual(styleToggleCopy(ATELIER_STYLE), {
    text: 'Стиль: Atelier', label: 'Актуальний стиль Atelier. Увімкнути оригінальний стиль.', pressed: 'false'
  });
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
  assert.equal(cacheName, 'synera-shell-20260923-v3');
  assert.ok(cachedShell.includes('/style-switcher.mjs'));
});
