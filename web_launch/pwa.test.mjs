import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

test('cache-only presentation remains usable through browser lifecycle events without install controls', async () => {
  const listeners = {};
  const context = { document: { querySelector: () => null }, navigator: {},
    window: { addEventListener: (name, fn) => { listeners[name] = fn; } },
    matchMedia: () => ({ matches: false }) };
  vm.runInNewContext(await fs.readFile(new URL('./pwa.mjs', import.meta.url), 'utf8'), context);
  for (const event of ['appinstalled', 'offline', 'online']) assert.doesNotThrow(() => listeners[event]());
});
