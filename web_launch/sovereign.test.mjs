import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggest, suggestAll } from './sovereign.mjs';
import { analyzeBalance } from './balance.mjs';
import { similarPeople } from './journal-matching.mjs';
import { ADAPT_COPY, MATCH_COPY } from './adapt-copy.mjs';
const parties=[{id:'a',give:['design'],need:['sales'],goal:'MVP',limits:['1h'],formats:['remote']},{id:'b',give:['sales'],need:['design'],goal:'MVP',limits:['1h'],formats:['remote']}];
const base={parties,collaborationId:'one',lang:'uk',now:1000000000};
const ev=(id,type,actor='a',extra={})=>({id,type,actor,to:actor==='a'?'b':'a',collaborationId:'one',at:1,...extra});
test('neutral engine is permutation/viewer invariant, frozen input unchanged, gives matching evidence',()=>{
  const input=structuredClone(base), original=structuredClone(input);const a=suggestAll(input);
  assert.deepEqual(a,suggestAll({...input,parties:[...parties].reverse(),viewerId:'b'}));assert.deepEqual(input,original);
  assert.ok(a.some(s=>s.kind==='common'&&s.why.includes('design')&&s.why.includes('sales')));
  assert.deepEqual(Object.keys(suggest(base)).sort(),['confidence','kind','text','why']);
  assert.ok(a.every(s=>s.text&&s.why&&s.confidence==='rule'));
  assert.equal(suggestAll({...base,dismissed:a.map(s=>s.id)}).length,0);
});
test('clarity flags missing concrete ask/offer/time/limit and ignores outsiders',()=>{
  const events=[ev('m','message','a',{text:'Hello',concrete:{}})];
  assert.ok(suggestAll({...base,events}).some(s=>s.kind==='clarity'));
  events[0].concrete={ask:true,offer:true,time:true,limit:true};assert.ok(!suggestAll({...base,events}).some(s=>s.kind==='clarity'));
  assert.deepEqual(analyzeBalance({...base,events:[ev('x','ask','outsider')]}),[]);
});
test('clarity recognizes supported concrete wording in uk/de/en without requiring a model',()=>{
  for(const [lang,text]of [['uk','Можеш надіслати ескіз? Я можу зробити продажі завтра о 10:00, максимум 1 година.'],['de','Kannst du die Skizze senden? Ich biete Vertrieb morgen um 10:00, höchstens 1 Stunde.'],['en','Can you send the sketch? I offer sales tomorrow 10:00, max 1 hour.']]){
    assert.ok(!suggestAll({...base,lang,events:[ev('m','message','a',{text})]}).some(s=>s.kind==='clarity'),lang);
  }
});
test('empty/new collaboration yields no balance signal; contribution counts are symmetric and deduplicated',()=>{
  assert.deepEqual(analyzeBalance({...base,events:[]}),[]);
  const contribution=ev('d','contribution','a',{concrete:true,delivered:true,contributionId:'sketch',agreementId:'v1'});
  assert.ok(analyzeBalance({...base,events:[contribution,contribution]}).some(s=>s.kind==='contributions'&&s.counts.a===1&&s.counts.b===0));
  assert.deepEqual(analyzeBalance({...base,events:[{...contribution,collaborationId:'other'}]}),[]);
  assert.deepEqual(analyzeBalance({...base,events:[{...contribution,concrete:false}]}),[]);
  assert.deepEqual(analyzeBalance({...base,events:[contribution]})[0].giveTake,{a:{given:1,received:0,ratio:null},b:{given:0,received:1,ratio:0}});
});
test('each balance signal has event evidence, calm symmetric text and a false-positive guard',()=>{
  const fixtures={
    asks:[ev('a1','ask','b',{hasOffer:false}),ev('a2','ask','b',{hasOffer:false})],
    pressure:[ev('p','message','b',{text:'Do it now or else'})],
    after_delivery:[ev('d','contribution','a',{concrete:true,delivered:true,contributionId:'draft',agreementId:'v1'}),ev('c','cancel','b',{agreementId:'v1'})],
    terms:[ev('t1','terms_changed','b',{agreed:false}),ev('t2','terms_changed','b',{agreed:false})],
    delayed:[ev('v','confirmed','a',{revision:'v1'})],
  };
  for(const [kind,events]of Object.entries(fixtures)) {
    const signals=analyzeBalance({...base,events});const signal=signals.find(s=>s.kind===kind);assert.ok(signal,kind);assert.ok(signal.evidence.length);
    assert.deepEqual(signals,analyzeBalance({...base,events,parties:[...parties].reverse(),viewerId:'b'}));
  }
  assert.ok(!analyzeBalance({...base,events:[ev('a','ask','b',{hasOffer:true})]}).length);
  assert.ok(!analyzeBalance({...base,events:[ev('p','message','a',{text:'No pressure, take your time'})]}).length);
  assert.ok(!analyzeBalance({...base,events:[ev('c','cancel','b',{agreementId:'v1'})]}).length);
  assert.ok(!analyzeBalance({...base,events:[ev('t1','terms_changed','b',{agreed:true}),ev('t2','terms_changed','b',{agreed:true})]}).length);
  assert.ok(!analyzeBalance({...base,events:[ev('a','confirmed','a',{revision:'v1'}),ev('b','confirmed','b',{revision:'v1'})]}).length);
});
test('Triangle includes all three sides and no inferred delivery from a pledge',()=>{
  const tri=[...parties,{id:'c',give:['research'],need:['design'],limits:[],formats:[]}];
  const suggestions=suggestAll({...base,parties:tri});assert.ok(suggestions.some(s=>s.kind==='triangle'&&tri.every(p=>s.why.includes(p.id))));
  assert.deepEqual(analyzeBalance({...base,parties:tri,events:[ev('x','pledge','a')]}),[]);
});
test('declared format incompatibility does not become a common match, goals and limits remain visible',()=>{
  const events=[];assert.ok(!suggestAll({...base,events,parties:[parties[0],{...parties[1],formats:['in-person']}]}).some(s=>s.kind==='common'));
  assert.ok(suggestAll(base).find(s=>s.kind==='common').why.includes('1h'));
  const d=ev('d','contribution','a',{concrete:true,delivered:true,contributionId:'one',agreementId:'v1'});
  assert.ok(analyzeBalance({...base,events:[d,ev('m','deadline_moved','b',{agreementId:'v1'})]}).some(s=>s.kind==='after_delivery'));
  assert.ok(!analyzeBalance({...base,events:[d,ev('m','deadline_moved','b',{agreementId:'other'})]}).some(s=>s.kind==='after_delivery'));
});
test('own journal only, explicit useful result and opt-in, no outsiders, similarity cannot bypass current match',()=>{
  const candidate={id:'c',give:['sales'],need:['design'],formats:['remote'],limits:[]};
  const entry={kind:'result',at:'2026-10-29T00:00:00Z',data:{source:'visitor',ownerId:'a',matchingConsent:true,useful:true,partner:{...parties[1],id:'b'}}};
  const context={owner:parties[0],candidates:[candidate],journal:[entry],enabled:true,lang:'en'};
  assert.equal(similarPeople(context).length,1);assert.ok(similarPeople(context)[0].why.includes('sales'));
  for(const patch of [{enabled:false},{journal:[]},{journal:[{...entry,data:{...entry.data,ownerId:'other'}}]},{journal:[{...entry,data:{...entry.data,matchingConsent:false}}]},{candidates:[{...candidate,give:['finance']}]}])assert.deepEqual(similarPeople({...context,...patch}),[]);
});
test('uk/de/en key symmetry and every suggestion localized',()=>{
  for(const lang of ['de','en']){assert.deepEqual(Object.keys(ADAPT_COPY[lang]).sort(),Object.keys(ADAPT_COPY.uk).sort());assert.deepEqual(Object.keys(MATCH_COPY[lang]).sort(),Object.keys(MATCH_COPY.uk).sort());}
  for(const lang of ['uk','de','en'])assert.ok(suggest({...base,lang}).text);
});
