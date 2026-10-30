import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeOpenness, isOpen, visiblePeople, demoOpenness, fitFor, readOpenness, endOfWindow, relevantEvents, DISTRICTS } from './radar.mjs';
import { RADAR_COPY } from './radar-copy.mjs';
const now = Date.parse('2026-10-29T22:00:00Z');
const input = {user:'local', precision:'district', district:'kreis4', give:'UX design', need:'B2B sales'};
test('specific opt-in: allowlist, bounded expiry, no coordinates, no stale access', () => {
  const own = makeOpenness({...input, lat:47, lon:8}, '1h', now);
  assert.deepEqual(Object.keys(own).sort(), ['district','give','need','precision','until','user']);
  assert.equal(own.until, new Date(now+3600000).toISOString());
  assert.equal(isOpen(own,now), true); assert.equal(isOpen(own,now+3600000),false);
  assert.equal(visiblePeople(null,demoOpenness(now),now).length,0);
  assert.equal(visiblePeople(own,demoOpenness(now),now).length,6);
  assert.equal(visiblePeople(own,demoOpenness(now),now+3600000).length,0);
  assert.throws(()=>makeOpenness({...input,precision:'gps'},'1h',now));
  assert.throws(()=>makeOpenness(input,'forever',now));
});
test('ten Demo profiles have six on, two off and two expired; expiry never resets', () => {
  const rows=demoOpenness(now); assert.equal(rows.length,10);
  assert.equal(rows.filter(r=>isOpen(r,now)).length,6);
  assert.equal(rows.filter(r=>isOpen(r,now+4*3600000)).length,0);
});
test('storage rejects malformed and expired rows; city precision strips district', () => {
  assert.equal(readOpenness('{oops',now),null);
  assert.equal(readOpenness(JSON.stringify({...input,until:'bad'}),now),null);
  assert.equal(readOpenness(JSON.stringify(makeOpenness(input,'1h',now)),now+3600000),null);
  assert.equal(makeOpenness({...input,precision:'city'},'1h',now).district,null);
});
test('today ends at Zurich midnight across DST, not a rolling 24 hours', () => {
  assert.equal(endOfWindow('today',Date.parse('2026-10-29T22:00Z')),Date.parse('2026-10-29T23:00Z'));
  assert.equal(endOfWindow('today',Date.parse('2026-03-29T00:30Z')),Date.parse('2026-03-29T22:00Z'));
  assert.equal(endOfWindow('today',Date.parse('2026-10-25T00:30Z')),Date.parse('2026-10-25T23:00Z'));
});
test('b-matching explains both directions and never invents a fit', () => {
  const own=makeOpenness(input,'3h',now), rows=visiblePeople(own,demoOpenness(now),now);
  const fit=fitFor(own,rows); const leo=fit.find(r=>r.user==='bot-leo');
  assert.ok(leo.gives.length);assert.ok(leo.receives.length);assert.equal(leo.recommended,true);
  const none=fitFor({...own,give:'pottery',need:'beekeeping'},rows);
  assert.ok(none.every(r=>!r.recommended&&!r.gives.length&&!r.receives.length));
});
test('events require current Zurich week, matching skill and selected district or city', () => {
  const events=[{id:'yes',date:'2026-10-30',district:'kreis4',topics:['sales']},{id:'old',date:'2026-10-20',district:'kreis4',topics:['sales']},{id:'other',date:'2026-10-30',district:'kreis5',topics:['sales']},{id:'irrelevant',date:'2026-10-30',district:'kreis4',topics:['video']}];
  assert.deepEqual(relevantEvents(events,input,now).map(e=>e.id),['yes']);
  assert.deepEqual(relevantEvents(events,{...input,precision:'city'},now).map(e=>e.id),['yes','other']);
});
test('all Radar copy, persona text and district labels have uk/de/en symmetry', () => {
  for(const lang of ['de','en']) assert.deepEqual(Object.keys(RADAR_COPY[lang]).sort(),Object.keys(RADAR_COPY.uk).sort());
  for(const lang of ['uk','de','en']) for(const value of Object.values(RADAR_COPY[lang])) assert.equal(typeof value,'string');
  assert.equal(DISTRICTS.length,5);
});
