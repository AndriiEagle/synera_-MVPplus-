import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { probeServiceWorkerOffline } from './pwa-checks.mjs';
const read = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

test('positive fixture: shell precached, root served from cache offline, config answers 503 offline JSON', async () => {
  const probe = await probeServiceWorkerOffline(read('./fixtures/positive/sw.mjs'));
  assert.ok(probe.shellCached.includes('/') && probe.shellCached.includes('/index.html'));
  assert.equal(probe.rootOffline, 'cache');
  assert.equal(probe.configOffline.status, 503);
  assert.deepEqual(JSON.parse(probe.configOffline.body), { offline: true });
});

test('negative fixture: network-only worker caches nothing and has no offline answer', async () => {
  const probe = await probeServiceWorkerOffline(read('./fixtures/negative/sw.mjs'));
  assert.deepEqual(probe.shellCached, []);
  assert.equal(probe.rootOffline, 'none');
  assert.equal(probe.configOffline, null);
});
