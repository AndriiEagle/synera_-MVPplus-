import { OPENNESS_KEY, DEMO_KEY, EVENTS_KEY, DISTRICTS, makeOpenness, readOpenness, isOpen, demoOpenness, visiblePeople, fitFor, distanceBand, relevantEvents, validateDraft } from './radar.mjs';
import { RADAR_COPY } from './radar-copy.mjs';
import { BOT_PROFILES } from './simulation-personas.mjs';
import { startVisitor, visitorMessage, personaRespond } from './simulation-living.mjs';
import { meetingDirectionsUrl } from './live-location.mjs';
const $=id=>document.getElementById(id), el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
let storage=null, persistent=true;
try{storage=localStorage; const probe='synera.radar.probe';storage.setItem(probe,'1');storage.removeItem(probe);}catch{persistent=false;storage=null;}
const get=key=>{try{return storage?.getItem(key);}catch{return null;}};
const save=(key,value)=>{try{if(storage){if(value===null)storage.removeItem(key);else storage.setItem(key,value);return true;}}catch{}persistent=false;storage=null;return false;};
let lang='uk', own=readOpenness(get(OPENNESS_KEY)), selected=null, session=null, meeting=false;
let start=Number(get(DEMO_KEY)); if(!start||!Number.isFinite(start)||start>Date.now()){start=Date.now();save(DEMO_KEY,String(start));}
let drafts=[];try{drafts=JSON.parse(get(EVENTS_KEY))||[];if(!Array.isArray(drafts))drafts=[];drafts=drafts.slice(0,50).map(validateDraft);}catch{drafts=[];}
let sampleEvents=[];
let pinsFingerprint='';
const t=(key,values={})=>Object.entries(values).reduce((s,[k,v])=>s.replaceAll(`{${k}}`,v),RADAR_COPY[lang][key]??key);
const time=value=>new Intl.DateTimeFormat(lang,{timeZone:'Europe/Zurich',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value));
const input=()=>({user:'local',give:$('radar-give').value,need:$('radar-need').value,precision:$('radar-precision').value,district:$('radar-district').value});
const rows=()=>fitFor(own,visiblePeople(own,demoOpenness(start)));
const current=id=>isOpen(own)?rows().find(row=>row.user===id):null;
const personKey=row=>row.user.replace('bot-','');
const nameOf=row=>BOT_PROFILES.find(p=>p.id===row.user)?.display_name||'Demo';
const button=(text,action)=>{const node=el('button',text);node.type='button';node.addEventListener('click',action);return node;};
function refreshOwn(){
  if(storage){const raw=get(OPENNESS_KEY);own=readOpenness(raw);if(raw&&!own)save(OPENNESS_KEY,null);}
  else if(!isOpen(own))own=null;
}
function setFields(){if(own){$('radar-give').value=own.give;$('radar-need').value=own.need;$('radar-precision').value=own.precision;$('radar-district').value=own.district||'kreis4';}}
setFields();
function render(){
  refreshOwn();
  const active=isOpen(own);$('radar-open').checked=active;
  for(const id of ['radar-give','radar-need','radar-window','radar-precision','radar-district'])$(id).disabled=active;
  $('district-field').hidden=$('radar-precision').value==='city';
  $('openness-status').textContent=active?t('until',{time:time(own.until)}):t('off');
  $('storage-status').textContent=persistent?'':t('memoryOnly');
  const people=active?rows():[];
  $('people-heading').textContent=t('people',{count:people.length});$('radar-empty').textContent=active?(people.length?'':t('empty')):t('locked');
  $('radar-restart').hidden=!active||demoOpenness(start).some(row=>isOpen(row));
  const fingerprint=JSON.stringify([lang,people,own]);
  if(fingerprint!==pinsFingerprint){pinsFingerprint=fingerprint;$('radar-people').replaceChildren(...people.map(row=>{
    const key=personKey(row), card=button('',()=>openPerson(row.user));card.className='radar-pin quiet';card.dataset.person=row.user;
    const head=el('div',undefined,'radar-person'),image=el('img');image.className='radar-portrait';image.src=`/persona-${key}.webp`;image.alt='';image.width=52;image.height=62;
    const label=el('div');label.append(el('strong',nameOf(row)),el('small',t(key+'Role')));head.append(image,label);
    card.append(head,el('p',`${t('give')} · ${t(key+'Give')}`),el('p',`${t('need')} · ${t(key+'Need')}`),el('p',t('until',{time:time(row.until)}),'radar-muted'),el('p',`${row.precision==='city'?'Zürich':t(row.district)} · ${t(distanceBand(own,row))}`,'radar-muted'));
    if(row.recommended)card.append(el('span',t('suggested'),'radar-tag'));
    return card;
  }));}
  if(selected&&!current(selected)){selected=null;session=null;meeting=false;$('radar-detail').hidden=true;$('radar-detail').replaceChildren();}
  renderEvents();
}
$('openness-form').addEventListener('submit',e=>e.preventDefault());
$('radar-open').addEventListener('change',()=>{
  if($('radar-open').checked){
    if(!$('openness-form').reportValidity()){$('radar-open').checked=false;return;}
    try{own=makeOpenness(input(),$('radar-window').value);save(OPENNESS_KEY,JSON.stringify(own));}catch{$('radar-open').checked=false;$('openness-status').textContent=t('error');return;}
  }else{own=null;save(OPENNESS_KEY,null);}
  render();
});
for(const id of ['radar-give','radar-need','radar-precision','radar-district'])$(id).addEventListener('change',render);
$('radar-restart').addEventListener('click',()=>{start=Date.now();save(DEMO_KEY,String(start));render();});
function openPerson(id){
  refreshOwn();if(!current(id)){render();return;}selected=id;session=null;meeting=false;renderDetail();$('radar-detail').focus();$('radar-detail').scrollIntoView({block:'start'});
}
function renderDetail(){
  const row=selected&&current(selected), root=$('radar-detail');root.hidden=!row;if(!row)return;
  const key=personKey(row), title=el('h2',t('why'));title.id='fit-title';
  root.replaceChildren(el('p',nameOf(row),'radar-eyebrow'),title);
  if(row.gives.length)root.append(el('p',t('givesMatch',{tags:row.gives.map(tag=>t(tag)).join(', ')})));
  if(row.receives.length)root.append(el('p',t('receivesMatch',{tags:row.receives.map(tag=>t(tag)).join(', ')})));
  if(!row.gives.length&&!row.receives.length)root.append(el('p',t('noMatch')));
  root.append(el('p',t('fitRule'),'radar-muted'));
  const actions=el('div',undefined,'radar-actions');actions.append(button(t('write'),()=>{refreshOwn();if(!current(selected)){render();return;}session||=startVisitor(selected,{name:'Demo',offers:own.give,seeks:own.need},String(start),lang);renderDetail();root.querySelector('textarea')?.focus();}),button(t('meet'),()=>{refreshOwn();if(!current(selected)){render();return;}meeting=true;renderDetail();}));root.append(actions);
  if(session){
    const chat=el('section',undefined,'radar-chat');chat.append(el('h3',t('chatTitle',{name:nameOf(row)})),el('p',t('scripted'),'radar-muted'));
    const messages=el('div',undefined,'radar-messages');messages.setAttribute('role','log');messages.setAttribute('aria-live','polite');
    for(const message of session.messages){const p=el('p'),who=el('strong',message.actor==='visitor'?'Demo':nameOf(row));p.append(who,document.createTextNode(message.text));messages.append(p);}chat.append(messages);
    if(session.status!=='declined'&&session.status!=='result'){
      const form=el('form'),label=el('label',t('message')),area=el('textarea');area.required=true;area.maxLength=2000;label.append(area);const submit=el('button',t('send'));submit.type='submit';form.append(label,submit);
      form.addEventListener('submit',e=>{e.preventDefault();refreshOwn();if(!current(selected)){render();return;}if(!area.value.trim())return;session=personaRespond(visitorMessage(session,area.value,lang),lang);renderDetail();root.querySelector('textarea')?.focus();});chat.append(form);
    }root.append(chat);
  }
  if(meeting){
    const section=el('section',undefined,'radar-meeting'),label=el('label',t('meeting')),select=el('select');
    for(const value of ['Zürich Hauptbahnhof','Helvetiaplatz Zürich','Sechseläutenplatz Zürich']){const option=el('option',value);option.value=value;select.append(option);}label.append(select);
    const link=el('a',t('google'),'radar-action');link.href=meetingDirectionsUrl(select.value);link.target='_blank';link.rel='noopener noreferrer';select.addEventListener('change',()=>{link.href=meetingDirectionsUrl(select.value);});
    section.append(el('p',t('meetingNote')),label,el('p',t('googleNotice'),'radar-muted'),link);root.append(section);
  }
}
function renderEvents(){
  const events=relevantEvents(sampleEvents,input());$('radar-events').replaceChildren(...(events.length?events.map(event=>{
    const card=el('article',undefined,'event-card');card.append(el('p',`${event.date} · ${t(event.district)}`,'radar-muted'),el('h3',event.title[lang]),el('p',event.topics.map(tag=>t(tag)).join(' · '),'radar-muted'));return card;
  }):[el('p',t('noEvents'))]));
}
function renderDrafts(){
  $('event-drafts').replaceChildren(...drafts.map((draft,i)=>{const card=el('article',undefined,'event-card');card.append(el('h4',draft.title),el('p',`${draft.date} · ${t(draft.district)} · ${draft.topics.map(tag=>t(tag)).join(', ')}`),button(t('remove'),()=>{drafts.splice(i,1);save(EVENTS_KEY,JSON.stringify(drafts));renderDrafts();}));return card;}));
}
$('event-form').addEventListener('submit',e=>{
  e.preventDefault();try{if(drafts.length>=50)throw Error();const form=new FormData(e.currentTarget),draft=validateDraft(Object.fromEntries(form));drafts.push(draft);save(EVENTS_KEY,JSON.stringify(drafts));e.currentTarget.reset();renderDrafts();$('event-status').textContent=t(persistent?'saved':'memoryOnly');}catch{$('event-status').textContent=t('error');}
});
function language(){
  const asked=new URLSearchParams(location.search).get('lang');lang=$('site-language').value||asked||'uk';if(!RADAR_COPY[lang])lang='uk';
  document.documentElement.lang=lang;document.title=`Synera · ${t('title')}`;
  for(const node of document.querySelectorAll('[data-radar-copy]'))node.textContent=t(node.dataset.radarCopy);
  const selectedDistrict=$('event-district').value,selectedTopic=$('event-topic').value;
  for(const [id,keys] of [['event-district',DISTRICTS],['event-topic',['design','sales','research','automation','finance','video','community']]])$(id).replaceChildren(...keys.map(key=>{const option=el('option',t(key));option.value=key;return option;}));
  if(selectedDistrict)$('event-district').value=selectedDistrict;if(selectedTopic)$('event-topic').value=selectedTopic;
  render();renderDrafts();if(selected)renderDetail();
}
$('site-language').addEventListener('change',language);language();
fetch('/radar-events.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(value=>{sampleEvents=value;renderEvents();}).catch(()=>{});
setInterval(render,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
window.addEventListener('storage',e=>{if([OPENNESS_KEY,DEMO_KEY,EVENTS_KEY,null].includes(e.key)){refreshOwn();setFields();render();}});
window.addEventListener('synera:before-device-erase',()=>{own=null;selected=null;session=null;drafts=[];});
window.addEventListener('synera:device-erased',()=>{own=null;selected=null;session=null;drafts=[];render();renderDrafts();});
