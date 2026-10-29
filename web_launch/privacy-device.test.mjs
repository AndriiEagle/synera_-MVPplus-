import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

async function device(now = 1000) {
  class Storage {
    data = new Map();
    get length() { return this.data.size; }
    key(i) { return [...this.data.keys()][i] ?? null; }
    getItem(k) { return this.data.get(k) ?? null; }
    setItem(k, v) { this.data.set(String(k), String(v)); }
    removeItem(k) { this.data.delete(k); }
  }
  const localStorage = new Storage(), sessionStorage = new Storage();
  class Clock extends Date { static now() { return now; } }
  const context = vm.createContext({ Storage, localStorage, sessionStorage, Date: Clock, console });
  vm.runInContext(await fs.readFile('web_launch/privacy-retention.mjs', 'utf8'), context);
  return { api: context.SyneraDeviceRetention, localStorage, sessionStorage, now };
}
test('P2: mocked clock purges at 30 days; reads do not renew expiry; unrelated preferences survive', async () => {
  const { api, localStorage: s } = await device();
  const key = 'synera.sim.draft.v1:owner:bot-mira', day = 86400000;
  s.setItem(key, '{"message":"private draft"}');
  api.purgeLocal(s, 1000, { adopt: true });
  const stamp = JSON.parse(s.getItem(api.META_KEY))[key];
  s.setItem('synera.style', 'night'); s.setItem('another-app', 'keep');
  api.purgeLocal(s, stamp + 29 * day);
  assert.ok(s.getItem(key));
  api.purgeLocal(s, stamp + 30 * day);
  assert.equal(s.getItem(key), null);
  assert.equal(s.getItem('synera.style'), 'night');
  assert.equal(s.getItem('another-app'), 'keep');
});
test('P2: legacy drafts get one migration grace period; a second load cannot extend it', async () => {
  const { api, localStorage: s } = await device();
  s.data.set('synera.sim.draft.v1:owner:bot-mira', '{"terms":{}}');
  api.purgeLocal(s, 1000);
  api.purgeLocal(s, 1000 + 31 * 86400000);
  assert.equal(s.getItem('synera.sim.draft.v1:owner:bot-mira'), null);
});
test('P1: scoped inventory recognises only Synera storage and all three cache families', async () => {
  const { api } = await device();
  assert.equal(api.ownsKey('synera-session:https://example.invalid'), true);
  assert.equal(api.ownsKey('another-app'), false);
  assert.equal(api.ownsCache('synera-studio-old'), true);
  assert.equal(api.ownsCache('unrelated-cache'), false);
});
test('P1/P8: privacy language keys have exact uk/de/en symmetry and no missing values', async () => {
  const { PRIVACY_COPY } = await import('./privacy-content.mjs');
  for (const language of ['de', 'en']) assert.deepEqual(Object.keys(PRIVACY_COPY[language]).sort(), Object.keys(PRIVACY_COPY.uk).sort());
  for (const values of Object.values(PRIVACY_COPY)) for (const value of Object.values(values)) assert.ok(typeof value === 'string' && value.trim());
});
