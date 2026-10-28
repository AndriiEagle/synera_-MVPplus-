import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkServiceWorkerRegistration } from './pwa-checks.mjs';
const read = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

test('positive fixture registers a module worker at the root scope with guards', () => {
  const result = checkServiceWorkerRegistration(read('./fixtures/positive/pwa.mjs'));
  assert.deepEqual(result.problems, []);
  assert.equal(result.scriptURL, '/sw.mjs');
});

test('negative fixture: unguarded, relative, reload-on-update registration is rejected', () => {
  const result = checkServiceWorkerRegistration(read('./fixtures/negative/pwa.mjs'));
  assert.equal(result.ok, false);
  for (const expected of ['not guarded by ("serviceWorker" in navigator)', 'isSecureContext', 'not root-relative', 'type: "module"', 'no .catch', 'reloads the page'])
    assert.ok(result.problems.some(p => p.includes(expected)), `expected "${expected}" in ${JSON.stringify(result.problems)}`);
});

test('a page without any registration is reported, not silently passed', () => {
  assert.deepEqual(checkServiceWorkerRegistration('console.log("no worker")').problems, ['navigator.serviceWorker.register(...) not called']);
});
