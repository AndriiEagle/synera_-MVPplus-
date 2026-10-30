// The ONLY observation store. No content, identifiers, routes, network or audio.
export const ADAPT_KEY='synera.adapt.v1';
const IDLE=30*60000, SECTIONS=['home','simulation','studio','triangle','rooms','journal','profile'];
const fields=['offers','seeks','goal','limits'], languages=['uk','de','en'];
const emptySignals=()=>({sections:{},input:{voice:0,text:0},hours:[0,0,0,0],zoom:{normal:0,large:0},firstAction:[0,0,0],fieldLanguage:{}});
const empty=()=>({version:1,enabled:false,sessions:0,lastActivity:null,sessionStart:0,acted:false,offeredSession:0,signals:emptySignals(),manual:{},choices:{},applied:[],declined:[],pending:null});
const choice=(key,value)=>key==='voiceFirst'&&typeof value==='boolean'||key==='density'&&['compact','comfortable','large'].includes(value);
export function createObserver({storage=null,now=Date.now,resume=true}={}) {
  let s=empty(),persisted=false,exists=false,available=Boolean(storage),lastRaw=null;
  try {lastRaw=storage?.getItem(ADAPT_KEY)||null;const raw=JSON.parse(lastRaw||'null');if(raw?.version===1){
    s.enabled=raw.enabled===true;s.sessions=Math.min(10000,Math.max(0,Math.floor(raw.sessions)||0));
    for(const key of ['manual','choices'])for(const [k,v] of Object.entries(raw[key]||{}))if(choice(k,v))s[key][k]=v;
    if(s.enabled) {
      const count=n=>Number.isInteger(n)&&n>=0?Math.min(n,10000):0;
      for(const key of ['lastActivity','sessionStart'])if(Number.isFinite(raw[key])&&raw[key]>=0&&raw[key]<=now())s[key]=raw[key];
      s.offeredSession=count(raw.offeredSession);
      s.acted=raw.acted===true;
      for(const section of SECTIONS)if(count(raw.signals?.sections?.[section]))s.signals.sections[section]=count(raw.signals.sections[section]);
      for(const key of ['voice','text'])s.signals.input[key]=count(raw.signals?.input?.[key]);
      for(const key of ['normal','large'])s.signals.zoom[key]=count(raw.signals?.zoom?.[key]);
      for(const key of ['hours','firstAction'])s.signals[key]=s.signals[key].map((_,i)=>count(raw.signals?.[key]?.[i]));
      for(const field of fields)for(const lang of languages)if(count(raw.signals?.fieldLanguage?.[field]?.[lang]))(s.signals.fieldLanguage[field]??={})[lang]=count(raw.signals.fieldLanguage[field][lang]);
    }
    s.applied=Array.isArray(raw.applied)?raw.applied.filter(p=>p&&choice(p.key,p.value)&&typeof p.id==='string').slice(-20).map(p=>({id:p.id,key:p.key,value:p.value,previous:choice(p.key,p.previous)?p.previous:null})):[];
    s.declined=['voiceFirst','density'].filter(k=>raw.declined?.includes(k));
    if(s.enabled&&raw.pending&&choice(raw.pending.key,raw.pending.value))s.pending={id:String(raw.pending.id).slice(0,80),key:raw.pending.key,value:raw.pending.value,previous:choice(raw.pending.key,raw.pending.previous)?raw.pending.previous:null};
    exists=true;
  }}catch{available=false;}
  const snapshot=()=>structuredClone(s);
  function save(){persisted=false;try{if(storage){lastRaw=JSON.stringify(s);storage.setItem(ADAPT_KEY,lastRaw);exists=true;persisted=true;}}catch{available=false;s.enabled=false;s.signals=emptySignals();}}
  function sync(){if(!storage)return;try{
    const raw=storage.getItem(ADAPT_KEY);
    if(raw===null&&exists){s=empty();exists=false;lastRaw=null;}
    else if(raw!==null&&raw!==lastRaw){const current=createObserver({storage,now,resume:false});s=current.state;available=current.available;exists=true;lastRaw=raw;}
  }catch{available=false;s.enabled=false;}}
  function activity(){sync();if(!s.enabled)return;const t=now();if(s.lastActivity===null||t<s.lastActivity||t-s.lastActivity>=IDLE){s.sessions=Math.min(10000,s.sessions+1);s.sessionStart=t;s.acted=false;s.pending=null;s.signals.hours[Math.floor(new Date(t).getHours()/6)]++;}s.lastActivity=t;save();}
  const api={get state(){return snapshot();},get persisted(){return persisted;},get available(){return available;},
    activity,
    enable(enabled){sync();s.enabled=enabled===true&&available;s.pending=null;if(!s.enabled){s.signals=emptySignals();s.lastActivity=null;s.sessions=0;}else activity();save();},
    record(kind,value){activity();if(!s.enabled)return;
      if(!s.acted){s.signals.firstAction[Math.min(2,Math.floor((now()-s.sessionStart)/10000))]++;s.acted=true;}
      if(kind==='section'&&SECTIONS.includes(value))s.signals.sections[value]=Math.min(10000,(s.signals.sections[value]||0)+1);
      if(kind==='input'&&['voice','text'].includes(value))s.signals.input[value]=Math.min(10000,s.signals.input[value]+1);
      if(kind==='zoom'&&Number.isFinite(value)&&value>0)s.signals.zoom[value>=1.25?'large':'normal']++;
      if(kind==='fieldLanguage'&&fields.includes(value?.field)&&languages.includes(value?.lang)){const row=s.signals.fieldLanguage[value.field]??={};row[value.lang]=Math.min(10000,(row[value.lang]||0)+1);}
      save();},
    manual(key,value){sync();if(!choice(key,value))return;s.manual[key]=value;s.choices[key]=value;if(s.pending?.key===key)s.pending=null;save();},
    propose({voiceAvailable=false,density='comfortable'}={}){activity();if(!s.enabled||s.pending||!s.sessions||s.sessions%3||s.offeredSession===s.sessions)return null;
      const candidates=[{key:'voiceFirst',value:true,eligible:voiceAvailable&&s.signals.input.voice>=3&&s.signals.input.voice>s.signals.input.text*2},{key:'density',value:'large',eligible:s.signals.zoom.large>=3&&density!=='large'}];
      const p=candidates.find(p=>p.eligible&&!Object.hasOwn(s.manual,p.key)&&!s.declined.includes(p.key)&&s.choices[p.key]!==p.value);if(!p)return null;
      s.pending={id:`adapt-${s.sessions}-${p.key}`,key:p.key,value:p.value,previous:s.choices[p.key]??(p.key==='density'?density:null)};s.offeredSession=s.sessions;save();return structuredClone(s.pending);},
    resolve(action){sync();const p=s.pending;if(!p||!['yes','no','stop'].includes(action))return false;s.pending=null;
      if(action==='stop'){api.enable(false);return true;}
      if(action==='no')s.declined.push(p.key);
      if(action==='yes'&&!Object.hasOwn(s.manual,p.key)){s.applied.push({...p});s.choices[p.key]=p.value;}
      save();return true;},
    undo(id){sync();const p=s.applied.find(p=>p.id===id);if(!p||Object.hasOwn(s.manual,p.key))return false;if(p.previous===null)delete s.choices[p.key];else s.choices[p.key]=p.previous;s.applied=s.applied.filter(x=>x.id!==id);save();return true;},
    reset(){sync();const manual={...s.manual};s=empty();s.manual=manual;s.choices={...manual};save();},
    forget(){s=empty();exists=false;persisted=false;},
  };
  if(resume)activity();return api;
}
