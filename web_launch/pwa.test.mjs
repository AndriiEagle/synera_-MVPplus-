import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

test('cache-only presentation remains usable through browser lifecycle events without install controls', async () => {
  const listeners = {};
  const context = { createInstallHint: () => ({ update() {} }), document: { querySelector: () => null }, navigator: {},
    window: { addEventListener: (name, fn) => { listeners[name] = fn; } },
    matchMedia: () => ({ matches: false }) };
  // The install strip is its own unit (install-hint.test.mjs); its import is dropped so pwa.mjs runs as a script.
  vm.runInNewContext((await fs.readFile(new URL('./pwa.mjs', import.meta.url), 'utf8')).replace(/^import \{ createInstallHint \} from '\.\/install-hint\.mjs';\r?\n/, ''), context);
  for (const event of ['appinstalled', 'offline', 'online']) assert.doesNotThrow(() => listeners[event]());
});
