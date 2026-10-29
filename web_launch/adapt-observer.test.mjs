import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createObserver, ADAPT_KEY } from './adapt-observer.mjs';
const store = () => { const map = new Map(); return { getItem:k=>map.get(k)??null, setItem:(k,v)=>map.set(k,v), removeItem:k=>map.delete(k), map }; };
test('opt-in, coarse allowlisted signals, third real session, one suggestion, reload continuity', () => {
  const storage=store(); let time=Date.UTC(2026,9,29,12); const now=()=>time;
  let o=createObserver({storage,now}); o.record('input','voice'); assert.equal(storage.map.size,0);
  o.enable(true);
  for(let session=1;session<=3;session++) {
    if(session>1) {time+=31*60000;o.activity();}
    o.record('input','voice');o.record('input','voice');o.record('section','simulation');
    o.record('fieldLanguage',{field:'offers',lang:'de',text:'MUST NEVER BE SAVED'});
    o.record('section','private/person/42');
    if(session<3)assert.equal(o.propose({voiceAvailable:true}),null);
  }
  const p=o.propose({voiceAvailable:true});assert.equal(p.key,'voiceFirst');
  assert.equal(o.propose({voiceAvailable:true}),null);assert.equal(o.state.choices.voiceFirst,undefined);
  o=createObserver({storage,now});assert.equal(o.state.sessions,3);assert.equal(o.state.pending.id,p.id);
  assert.equal(o.resolve('yes'),true);assert.equal(o.state.choices.voiceFirst,true);assert.equal(o.state.applied.length,1);
  assert.equal(o.propose({voiceAvailable:true}),null);assert.equal(o.undo(p.id),true);assert.equal(o.state.choices.voiceFirst,undefined);
  assert.deepEqual([...storage.map.keys()],[ADAPT_KEY]);assert.ok(!storage.getItem(ADAPT_KEY).includes('MUST NEVER'));
  assert.ok(!storage.getItem(ADAPT_KEY).includes('private/person'));
});
test('manual choices survive undo/reset, no/stop persist, revocation erases observations',()=>{
  const storage=store();let time=0;const o=createObserver({storage,now:()=>time});o.enable(true);
  for(let i=0;i<3;i++){if(i)time+=31*60000;o.record('input','voice');o.record('input','voice');}
  const p=o.propose({voiceAvailable:true});o.resolve('yes');o.manual('voiceFirst',false);
  assert.equal(o.undo(p.id),false);o.reset();assert.equal(o.state.manual.voiceFirst,false);
  o.enable(true);for(let i=0;i<3;i++){time+=31*60000;o.record('input','voice');}
  assert.equal(o.propose({voiceAvailable:true}),null);o.enable(false);assert.deepEqual(o.state.signals.input,{voice:0,text:0});
});
test('decline and never ask cannot be reversed by reload, denied storage and reset do not crash',()=>{
  const storage=store();let time=0;let o=createObserver({storage,now:()=>time});o.enable(true);
  for(let i=0;i<3;i++){if(i)time+=31*60000;o.record('zoom',1.5);}
  assert.ok(o.propose());o.resolve('no');assert.equal(o.propose(),null);
  time+=3*31*60000;o.activity();assert.equal(o.state.sessions,4);
  o.enable(false);o=createObserver({storage,now:()=>time});assert.equal(o.state.enabled,false);
  const blocked=createObserver({storage:{getItem(){throw Error();},setItem(){throw Error();}},now:()=>0});blocked.enable(true);assert.equal(blocked.persisted,false);blocked.reset();
});
test('other-tab erasure cannot be resurrected by queued observer writes',()=>{
  const storage=store();const o=createObserver({storage,now:()=>0});o.enable(true);storage.removeItem(ADAPT_KEY);o.record('input','voice');assert.equal(storage.getItem(ADAPT_KEY),null);assert.equal(o.state.enabled,false);
});
test('another tab revoking consent or choosing manually wins over queued old-tab writes',()=>{
  const storage=store();const a=createObserver({storage,now:()=>0});a.enable(true);
  const b=createObserver({storage,now:()=>0});b.enable(false);a.record('input','voice');
  assert.equal(JSON.parse(storage.getItem(ADAPT_KEY)).enabled,false);assert.equal(a.state.signals.input.voice,0);
  b.manual('density','compact');a.record('input','text');assert.equal(a.state.manual.density,'compact');
  const fresh=store(),beforeConsent=createObserver({storage:fresh,now:()=>0}),granting=createObserver({storage:fresh,now:()=>0});granting.enable(true);beforeConsent.record('input','voice');assert.equal(beforeConsent.state.signals.input.voice,1);
});
