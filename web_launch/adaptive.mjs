// Presentation only. No accounts, messages, analytics, network or profile inputs.
import { PALETTES, DENSITIES, HINTS } from './adaptive-config.mjs';
export const PREFERENCE_KEY = 'synera.adaptive.preferences.v1';
export const SESSION_KEY = 'synera.adaptive.session.v1';
const DAY = 86400000, IDLE = 30 * 60000;
const densityIds = DENSITIES.map(x => x.id), accentIds = ['by-look', ...PALETTES.map(x => x.id)];
const integer = n => Number.isInteger(n) && n >= 0 && n <= 10000 ? n : 0;
const dateKey = n => { const d = new Date(n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const appearance = value => ({ accent: accentIds.includes(value?.accent) ? value.accent : 'by-look', density: densityIds.includes(value?.density) ? value.density : 'comfortable', textScale: Number.isFinite(value?.textScale) && value.textScale >= 1 && value.textScale <= 2 ? value.textScale : 1 });
const adaptation = () => ({ enabled:false, consentVersion:1, days:[], lastProposal:null, declined:[] });
function normalize(value, now) {
  const v = value?.version === 1 ? value : {};
  const a = v.adaptation || {}, enabled = a.enabled === true && a.consentVersion === 1;
  const end = dateKey(now), start = dateKey(new Date(now).setDate(new Date(now).getDate()-13));
  return { version:1, ...appearance(v), previous:v.previous ? appearance(v.previous) : null,
    hints: v.hints !== false, dismissed:Object.fromEntries(HINTS.filter(h => v.dismissed?.[h.id] === 1).map(h => [h.id,1])),
    adaptation:{ ...adaptation(), enabled,
      days:enabled && Array.isArray(a.days) ? a.days.filter(d => d && typeof d==='object' && /^\d{4}-\d\d-\d\d$/.test(d.date) && d.date >= start && d.date <= end).slice(-14).map(d => ({date:d.date,...Object.fromEntries(['sessions','list','listSessions','expand','expandSessions','enlarge','enlargeSessions'].map(k=>[k,integer(d[k])]))})) : [],
      lastProposal:enabled && Number.isFinite(a.lastProposal) && a.lastProposal <= now ? a.lastProposal : null,
      declined:Array.isArray(a.declined) ? densityIds.filter(id=>a.declined.includes(id)) : [] } };
}

export function paletteTokens(id, base) {
  const palette = PALETTES.find(p=>p.id===id);
  return palette ? { ...palette[['atelier','original'].includes(base) ? 'light' : 'dark'] } : {};
}

export function applyPersonalization(root, value) {
  const p=appearance(value), tokens=paletteTokens(p.accent, root.dataset.syneraAtelier === 'on' ? 'night' : root.dataset.syneraStyle);
  const keys=Object.keys(PALETTES[0].light);
  for(const k of keys) { if(tokens[k]) root.style.setProperty(k,tokens[k]); else root.style.removeProperty(k); }
  const m=DENSITIES.find(d=>d.id===p.density).metrics;
  for(const [k,v] of Object.entries(m)) root.style.setProperty(`--adaptive-${k.replaceAll('_','-')}`, String(v)+(k.endsWith('_px')?'px':k.endsWith('_rem')?'rem':''));
  root.style.setProperty('--adaptive-text-scale',String(p.textScale));
  root.dataset.personalAccent=p.accent; root.dataset.density=p.density;
  root.dataset.adaptiveText=p.textScale>1?'large':'regular';
  return p;
}

export function createPersonalization({ storage=null, session=null, root=null, now=Date.now }={}) {
  let raw; try { raw=JSON.parse(storage?.getItem(PREFERENCE_KEY)||'null'); } catch {}
  // Preserve an explicitly enabled legacy presentation choice; never inspect profile fields.
  if(!raw) try {
    const old=JSON.parse(storage?.getItem('synera.atelier.preferences.v1')||'null');
    if(old?.version===1 && old.enabled===true) raw={version:1, accent:({gold:'gold',red:'ruby',plum:'violet'})[old.accent],density:old.density,textScale:old.largeText?1.125:1};
  } catch {}
  let state=normalize(raw,now()), persisted=false, activeHint=null, pending=null;
  let lastActivity=now(), sessionDate=null, signals=new Set();
  // Tab-scoped continuity only. No navigation history, account IDs or content are kept.
  try {
    const tab=JSON.parse(session?.getItem(SESSION_KEY)||'null');
    if(state.adaptation.enabled && tab?.version===1 && Number.isFinite(tab.lastActivity) && tab.lastActivity<=now() && now()-tab.lastActivity<IDLE && tab.date===dateKey(tab.lastActivity)) {
      lastActivity=tab.lastActivity;sessionDate=tab.date;signals=new Set(['list','expand','enlarge'].filter(k=>Array.isArray(tab.signals)&&tab.signals.includes(k)));
    }
  } catch {}
  function save() { persisted=false; try { if(storage) { storage.setItem(PREFERENCE_KEY,JSON.stringify(state)); persisted=true; } } catch {} }
  function saveSession() {try {session?.setItem(SESSION_KEY,JSON.stringify({version:1,lastActivity,date:sessionDate,signals:[...signals]}));}catch {}}
  function clearSession() {try {session?.removeItem(SESSION_KEY);}catch {}}
  function apply() { if(root) applyPersonalization(root,state); }
  function activity(force=false) {
    const t=now(); state=normalize(state,t);
    if(!state.adaptation.enabled) { lastActivity=t; return; }
    const date=dateKey(t);
    const fresh=force || sessionDate===null || t-lastActivity>=IDLE;
    if(fresh || sessionDate!==date || !state.adaptation.days.some(d=>d.date===date)) {
      sessionDate=date;signals=new Set();
      let day=state.adaptation.days.find(d=>d.date===date);
      if(!day) { day={date,sessions:0,list:0,listSessions:0,expand:0,expandSessions:0,enlarge:0,enlargeSessions:0}; state.adaptation.days.push(day); }
      if(fresh)day.sessions++; save();
    }
    lastActivity=t;saveSession();
  }
  activity(); apply();
  const api={
    get state(){return structuredClone(state);}, get persisted(){return persisted;}, get pending(){return pending;},
    activity,
    choose(patch) {
      const next=appearance({...state,...patch});
      // Invalid presets do not replace a known working density.
      if(patch.density && !densityIds.includes(patch.density)) next.density=state.density;
      state.previous=appearance(state); Object.assign(state,next); pending=null; apply(); save();
    },
    undo() { if(!state.previous)return false; const previous=state.previous; state.previous=appearance(state); Object.assign(state,previous); pending=null; apply(); save(); return true; },
    setAdaptation(enabled) {
      state.adaptation={...adaptation(),enabled:enabled===true,declined:state.adaptation.declined}; pending=null; sessionDate=null;
      clearSession();if(enabled===true)activity(true); save();
    },
    signal(kind) {
      if(!state.adaptation.enabled || !['list','expand','enlarge'].includes(kind))return;
      activity(); const d=state.adaptation.days.find(d=>d.date===sessionDate); d[kind]++;
      if(!signals.has(kind)) { signals.add(kind); d[kind+'Sessions']++; } saveSession();save();
    },
    proposal({busy=false}={}) {
      state=normalize(state,now()); const a=state.adaptation, sum=k=>a.days.reduce((n,d)=>n+d[k],0);
      if(busy || activeHint || pending || !a.enabled || a.days.filter(d=>d.sessions>0).length<2 || sum('sessions')<3 || (a.lastProposal!==null && now()-a.lastProposal<7*DAY))return null;
      const candidates=[['large',sum('enlarge')>=3&&sum('enlargeSessions')>=2],['comfortable',state.density==='compact'&&sum('expand')>=3&&sum('expandSessions')>=2],['compact',sum('listSessions')>=3]];
      return candidates.find(([id,eligible])=>eligible && id!==state.density && !a.declined.includes(id))?.[0]||null;
    },
    present(id) { if(api.proposal()!==id)return false; pending=id; state.adaptation.lastProposal=now(); save(); return true; },
    resolve(id,action) {
      if(pending!==id)return false;
      pending=null;
      if(action==='apply')api.choose({density:id});
      else if(action==='stop')api.setAdaptation(false);
      else if(!state.adaptation.declined.includes(id)) { state.adaptation.declined.push(id); save(); }
      return true;
    },
    hint(id,{manual=false,tour=false}={}) {
      if(tour || pending || activeHint || !state.hints || !HINTS.some(h=>h.id===id) || (!manual&&state.dismissed[id]===1))return null;
      activeHint=id; return id;
    },
    dismissHint() { if(activeHint) { state.dismissed[activeHint]=1; activeHint=null; save(); } },
    closeHint() {activeHint=null;},
    setHints(enabled) {state.hints=enabled===true; activeHint=null; save();},
    resetHints() {state.hints=true; state.dismissed={}; activeHint=null; save();},
    reset() {
      state=normalize(null,now()); pending=activeHint=null; sessionDate=null;
      clearSession();
      if(root) {
        root.dataset.syneraStyle='synera';
        for(const key of ['syneraAtelier','atelierAccent','atelierDensity','atelierType','atelierContrast'])delete root.dataset[key];
      }
      try { storage?.setItem('synera.style','synera'); storage?.removeItem('synera.atelier.preferences.v1'); } catch {}
      apply(); save();
    }
  };
  return api;
}
