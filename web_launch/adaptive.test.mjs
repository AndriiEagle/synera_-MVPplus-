import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersonalization, applyPersonalization, PREFERENCE_KEY, paletteTokens } from './adaptive.mjs';
import { PALETTES, DENSITIES, HINTS } from './adaptive-config.mjs';
import { ADAPTIVE_ROWS } from './adaptive-i18n-table.mjs';
import { readFile } from 'node:fs/promises';

const memory = () => { const data = new Map(); return { data, getItem: k => data.get(k), setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) }; };
const root = () => ({ dataset: { syneraStyle: 'atelier' }, style: { values: new Map(), setProperty(k,v) { this.values.set(k,v); }, removeProperty(k) { this.values.delete(k); } } });
const ratio = (a,b) => { const lum = s => { const c = s.match(/\w\w/g).map(x => parseInt(x,16)/255).map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4); return .2126*c[0]+.7152*c[1]+.0722*c[2]; }; const x=lum(a.slice(1)),y=lum(b.slice(1)); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };

test('personal accents preserve base look, clear by-look overrides and cover every palette', () => {
  const r=root();
  for (const p of PALETTES) for (const style of ['atelier','synera','night','original']) {
    r.dataset.syneraStyle=style; applyPersonalization(r,{accent:p.id,density:'large',textScale:1});
    assert.equal(r.dataset.syneraStyle,style);
    assert.deepEqual(Object.fromEntries([...r.style.values].filter(([k]) => !k.startsWith('--adaptive-'))),paletteTokens(p.id,style));
  }
  applyPersonalization(r,{accent:'by-look',density:'comfortable',textScale:1});
  assert.equal(r.style.values.has('--accent'),false);
});

test('WCAG AA palette text/states/surfaces and meaningful borders on actual base surfaces', () => {
  for (const p of PALETTES) for (const mode of ['light','dark']) {
    const t=p[mode], backgrounds=mode==='light'?['#f5f2e9','#fffdf7','#faf8f1','#f6f5ef','#fffefa','#ffffff']:['#15161d','#2b3138','#22242d','#1b1d25'];
    for (const state of ['--accent','--accent-hover','--accent-active']) assert.ok(ratio(t[state],t['--on-accent'])>=4.5,`${p.id}/${mode}/${state}`);
    assert.ok(ratio(t['--accent-surface'],t['--on-accent-surface'])>=4.5);
    for (const bg of backgrounds) {
      assert.ok(ratio(t['--accent-text'],bg)>=4.5,`${p.id}/${mode}/text on ${bg}`);
      assert.ok(ratio(t['--accent-border'],bg)>=3);
      assert.ok(ratio(t['--focus-ring'],bg)>=3);
    }
  }
});

test('density and manual text size are independent, validated and local even when storage denied', () => {
  const storage=memory(), c=createPersonalization({storage});
  c.choose({density:'compact',textScale:1.5,accent:'rose'});
  const copy=createPersonalization({storage}).state;
  assert.equal(copy.density,'compact'); assert.equal(copy.textScale,1.5); assert.equal(copy.accent,'rose');
  assert.equal(copy.adaptation.enabled,false);
  assert.deepEqual(DENSITIES.map(x=>x.metrics.control_min_height_px),[44,48,56]);
  const denied=createPersonalization({storage:{getItem(){throw Error();},setItem(){throw Error();}}});
  denied.choose({density:'large'}); assert.equal(denied.state.density,'large'); assert.equal(denied.persisted,false);
  denied.choose({density:'bogus',accent:'gender',textScale:900});
  assert.equal(denied.state.density,'large'); assert.equal(denied.state.accent,'by-look'); assert.equal(denied.state.textScale,1);
});

function eligible() {
  let time=new Date(2026,9,26,10).getTime(); const storage=memory();
  let c=createPersonalization({storage,now:()=>time}); c.setAdaptation(true); c.signal('enlarge');
  time+=86400000; c=createPersonalization({storage,now:()=>time}); c.signal('enlarge');
  time+=31*60000; c.activity(); c.signal('enlarge');
  return {c,storage,advance:n=>time+=n};
}

test('proposals need explicit consent, three sessions/two days/signals; silence and preview never apply', () => {
  const c=createPersonalization({storage:memory()});
  for(let i=0;i<8;i++)c.signal('enlarge');
  assert.equal(c.proposal(),null); assert.deepEqual(c.state.adaptation.days,[]);
  const e=eligible(),before=e.c.state.density;
  assert.equal(e.c.proposal({busy:true}),null);
  assert.equal(e.c.proposal(),'large'); assert.equal(e.c.state.density,before);
  e.c.present('large'); assert.equal(e.c.state.density,before);
  e.c.resolve('large','apply'); assert.equal(e.c.state.density,'large');
  assert.equal(e.c.undo(),true); assert.equal(e.c.state.density,before);
});

test('declined proposal never applies or recurs after reload; stop clears counters and pending work', () => {
  const e=eligible(); e.c.present('large'); e.c.resolve('large','decline');
  e.advance(8*86400000);
  const c=createPersonalization({storage:e.storage,now:()=>new Date(2026,10,5).getTime()});
  assert.equal(c.state.density,'comfortable'); assert.equal(c.proposal(),null);
  assert.ok(c.state.adaptation.declined.includes('large'));
  c.setAdaptation(false); assert.deepEqual(c.state.adaptation.days,[]); assert.equal(c.state.adaptation.lastProposal,null);
});

test('all hints have bounded complete translations; dismiss forever, replay manually and reset independently', () => {
  const storage=memory(),c=createPersonalization({storage}); assert.equal(HINTS.length,17);
  for(const h of HINTS) {
    assert.ok(ADAPTIVE_ROWS.some(row=>row[0]===h.uk&&row[1]===h.de&&row[2]===h.en));
    for(const lang of ['uk','de','en']) assert.ok([...h[lang]].length<=90,`${h.id}/${lang}`);
  }
  assert.equal(c.hint('exchange'),'exchange'); assert.equal(c.hint('location'),null);
  c.dismissHint(); assert.equal(c.hint('exchange'),null);
  assert.equal(createPersonalization({storage}).hint('exchange'),null);
  assert.equal(c.hint('exchange',{manual:true}),'exchange'); c.dismissHint();
  c.setHints(false); assert.equal(c.hint('location'),null); c.resetHints(); assert.equal(c.hint('exchange'),'exchange');
});

test('reset is scoped to presentation; preserves language/profile/consent/tour and restores Current', () => {
  const storage=memory(); for(const k of ['profile','consent','synera.real-journey.language.v1','synera.first-user-tour.v1']) storage.setItem(k,'keep');
  const r=root(),c=createPersonalization({storage,root:r}); c.choose({accent:'ruby',density:'large'}); c.setAdaptation(true); c.reset();
  assert.equal(c.state.accent,'by-look'); assert.equal(c.state.density,'comfortable'); assert.equal(r.dataset.syneraStyle,'synera');
  assert.equal(storage.getItem('synera.style'),'synera');
  assert.equal(c.state.adaptation.enabled,false); assert.deepEqual(c.state.adaptation.days,[]);
  for(const k of ['profile','consent','synera.real-journey.language.v1','synera.first-user-tour.v1']) assert.equal(storage.getItem(k),'keep');
  assert.ok(storage.getItem(PREFERENCE_KEY));
});

test('one-day activity is insufficient, proposal cooldown is seven days, counters expire after 14 days', () => {
  let time=new Date(2026,9,26,10).getTime();const storage=memory();let c=createPersonalization({storage,now:()=>time});c.setAdaptation(true);
  for(let i=0;i<4;i++){time+=31*60000;c.activity();c.signal('enlarge');}
  assert.equal(c.proposal(),null,'three sessions on only one day are insufficient');
  time+=86400000;c.activity();c.signal('enlarge');assert.equal(c.proposal(),'large');
  c.present('large');c.resolve('large','apply');c.undo();assert.equal(c.proposal(),null,'accepted and undone cannot trigger a new offer this week');
  time+=15*86400000;c=createPersonalization({storage,now:()=>time});
  assert.equal(c.proposal(),null);assert.equal(c.state.adaptation.days.length,1);assert.equal(c.state.adaptation.days[0].enlarge,0);
});

test('legacy explicit choices migrate, malformed storage is safe and unapproved fields are discarded', () => {
  const storage=memory();storage.setItem('synera.atelier.preferences.v1',JSON.stringify({version:1,enabled:true,accent:'plum',density:'compact',largeText:true}));
  const c=createPersonalization({storage});assert.equal(c.state.accent,'violet');assert.equal(c.state.density,'compact');assert.equal(c.state.textScale,1.125);
  storage.setItem(PREFERENCE_KEY,'{broken');assert.doesNotThrow(()=>createPersonalization({storage}));
  storage.setItem(PREFERENCE_KEY,JSON.stringify({version:1,gender:'example',messages:'do not retain',adaptation:{enabled:true,consentVersion:0,days:[{date:'2026-10-29',sessions:80}]}}));
  const clean=createPersonalization({storage});assert.equal(clean.state.adaptation.enabled,false);assert.deepEqual(clean.state.adaptation.days,[]);
  clean.choose({accent:'gold'});assert.equal(storage.getItem(PREFERENCE_KEY).includes('messages'),false);
});

test('mutation oracle detects the removal of persistent proposal refusal', async () => {
  const source=await readFile(new URL('./adaptive.mjs',import.meta.url),'utf8');
  const mutation=source.replace('!a.declined.includes(id)','true').replace("'./adaptive-config.mjs'",JSON.stringify(new URL('./adaptive-config.mjs',import.meta.url).href));
  assert.notEqual(mutation,source);
  const mutant=await import('data:text/javascript;base64,'+Buffer.from(mutation).toString('base64'));
  const e=eligible();e.c.present('large');e.c.resolve('large','decline');
  const afterWeek=new Date(2026,10,5).getTime();
  assert.equal(createPersonalization({storage:e.storage,now:()=>afterWeek}).proposal(),null);
  assert.equal(mutant.createPersonalization({storage:e.storage,now:()=>afterWeek}).proposal(),'large','the same oracle exposes the reintroduced defect');
});

test('reload and cross-page navigation in one tab do not fabricate new sessions', () => {
  let time=new Date(2026,9,26,10).getTime();const storage=memory(),session=memory();
  let c=createPersonalization({storage,session,now:()=>time});c.setAdaptation(true);c.signal('enlarge');
  for(let i=0;i<5;i++){time+=60000;c=createPersonalization({storage,session,now:()=>time});c.signal('enlarge');}
  assert.equal(c.state.adaptation.days[0].sessions,1);
  assert.equal(c.state.adaptation.days[0].enlargeSessions,1);
  assert.equal(c.proposal(),null);
  time+=31*60000;c.activity();c.signal('enlarge');assert.equal(c.state.adaptation.days[0].sessions,2);
  time+=86400000;c=createPersonalization({storage,session,now:()=>time});c.signal('enlarge');
  assert.equal(c.proposal(),'large');c.setAdaptation(false);assert.equal(session.data.size,0);
});

test('midnight is not a new session; corrupt counter entries cannot break the controls', () => {
  let time=new Date(2026,9,26,23,55).getTime();const storage=memory(),session=memory();
  let c=createPersonalization({storage,session,now:()=>time});c.setAdaptation(true);
  time+=10*60000;c=createPersonalization({storage,session,now:()=>time});c.signal('enlarge');
  assert.deepEqual(c.state.adaptation.days.map(d=>d.sessions),[1,0]);
  const s=c.state;s.adaptation.days=[null,{},'broken'];storage.setItem(PREFERENCE_KEY,JSON.stringify(s));
  c=createPersonalization({storage,session,now:()=>time});assert.doesNotThrow(()=>c.signal('enlarge'));assert.equal(c.proposal(),null);
});
