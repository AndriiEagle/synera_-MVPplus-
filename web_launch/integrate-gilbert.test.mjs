import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createJournal, JOURNAL_KEY } from './journal.mjs';

const storage = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,String(v)), removeItem: k => map.delete(k) }; };
test('I1: opening the journal purges expired entries before profile/session recovery, without renewing fresh data', () => {
  const s = storage(), now = '2026-10-29T20:00:00Z';
  const row = (at, name) => ({ at, kind:'profile', actor:'visitor', text:name, data:{ source:'profile', profile:{name} } });
  s.setItem(JOURNAL_KEY, JSON.stringify([row('2026-09-29T20:00:00Z','Expired'), row('2026-10-28T20:00:00Z','Fresh')]));
  const j = createJournal(s, () => now);
  assert.equal(j.profile().name, 'Fresh'); assert.equal(j.entries().length, 1);
  assert.equal(JSON.parse(s.getItem(JOURNAL_KEY)).length, 1);
  assert.equal(JSON.parse(s.getItem(JOURNAL_KEY))[0].at, '2026-10-28T20:00:00Z');
  const later = createJournal(s, () => '2026-11-27T20:00:00Z');
  assert.equal(later.profile(), null); assert.equal(s.getItem(JOURNAL_KEY), null);
});
test('I1: the head retention boundary expires the journal even on a non-simulation page', async () => {
  class Storage { data = new Map(); get length(){return this.data.size;} key(i){return [...this.data.keys()][i];} getItem(k){return this.data.get(k)??null;} setItem(k,v){this.data.set(k,String(v));} removeItem(k){this.data.delete(k);} }
  const s = new Storage(); s.setItem(JOURNAL_KEY, JSON.stringify([{ at:'2000-01-01T00:00:00Z', kind:'profile', actor:'visitor', text:'old', data:{} }]));
  vm.runInNewContext(await readFile('web_launch/privacy-retention.mjs','utf8'), { Storage, localStorage:s, Date });
  assert.equal(s.getItem(JOURNAL_KEY),null);
});
test('I3: all worker installations include their new public dependencies and invalidate the prior cache', async () => {
  const { PUBLIC_ASSETS } = await import('./assets.mjs');
  for (const [file, family, old] of [['sw','shell','synera-shell-20261029-argon1'],['studio-sw','studio','synera-studio-20261029-argon1'],['simulation-sw','simulation','synera-simulation-20261020-v1']]) {
    let name, assets; const listeners={},deleted=[];
    vm.runInNewContext(await readFile(`web_launch/${file}.mjs`,'utf8'), { URL, self:{location:{origin:'https://example.test'},skipWaiting(){},clients:{claim:async()=>{}},addEventListener:(event,fn)=>{listeners[event]=fn;}}, caches:{open:async key=>{name=key;return {addAll:async list=>{assets=list;}};},keys:async()=>[old,`synera-${family}-20261029-gilbert1`,'another-app-cache'],delete:async key=>deleted.push(key)} });
    const promises=[];listeners.install({waitUntil:p=>promises.push(p)});await Promise.all(promises);
    assert.equal(name,`synera-${family}-20261029-gilbert1`); assert.notEqual(name,old);
    listeners.activate({waitUntil:p=>promises.push(p)});await Promise.all(promises);assert.deepEqual(deleted,[old]);
    for (const asset of assets) assert.ok(asset==='/' || PUBLIC_ASSETS[asset.slice(1)],`${file}: unserved ${asset}`);
    for (const dep of ['/privacy-common.mjs','/privacy-device.mjs','/privacy-content.mjs','/privacy-retention.mjs','/pilot-consent.html','/legal-documents.mjs','/legal-documents.css','/demo-device-controls.mjs']) assert.ok(assets.includes(dep), `${file}: missing ${dep}`);
  }
});
