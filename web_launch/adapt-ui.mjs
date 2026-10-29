import { createObserver } from './adapt-observer.mjs';
import { adaptCopy } from './adapt-copy.mjs';
// Installs inside the existing useful path and existing appearance menu.
export function installObservation({doc=document,storage,personalization,now=Date.now}={}) {
  const host=doc.querySelector('[data-adaptive-ui]');if(!host||host.querySelector('[data-adapt-observer]'))return;
  const root=doc.documentElement,o=createObserver({storage,now}),t=()=>adaptCopy(root.lang);
  if(personalization.state.previous&&!o.state.applied.length&&!Object.hasOwn(o.state.manual,'density'))o.manual('density',personalization.state.density);
  let proposal=null,baseline=personalization.state.density;
  const el=(tag,text)=>{const e=doc.createElement(tag);if(text)e.textContent=text;return e;};
  const area=el('section');area.dataset.adaptObserver='';area.className='adaptive-settings';
  const label=el('label');label.className='adaptive-check';label.dataset.hintContext='adaptive_permission';const consent=el('input');consent.type='checkbox';const labelText=el('span');label.append(consent,labelText);
  const note=el('p'),title=el('h3'),list=el('ul'),resetNote=el('p'),reset=el('button'),status=el('p');reset.type='button';status.setAttribute('role','status');
  area.append(label,note,title,list,resetNote,reset,status);host.append(area);
  function apply(){
    const s=o.state;
    if(s.choices.density)personalization.choose({density:s.choices.density});
    root.dataset.voiceFirst=String(s.choices.voiceFirst===true);
    // A shared hook for the voice lane. Reorders only explicitly marked controls.
    for(const mic of doc.querySelectorAll('[data-voice-input]'))mic.classList.toggle('adapt-voice-first',s.choices.voiceFirst===true);
  }
  function paint(){
    const c=t(),s=o.state;labelText.textContent=c.consent;note.textContent=c.local;title.textContent=c.adapted;reset.textContent=c.reset;resetNote.textContent=c.resetNote;consent.checked=s.enabled;
    consent.disabled=!o.available;status.textContent=!o.available?c.unavailable:o.persisted?c.saved:c.idle;
    list.replaceChildren();if(!s.applied.length)list.append(el('li',c.empty));
    for(const p of s.applied){const row=el('li',c[p.key]),b=el('button',c.undo);b.type='button';b.disabled=Object.hasOwn(s.manual,p.key);
      b.addEventListener('click',()=>{if(o.undo(p.id)){if(p.key==='density')personalization.choose({density:p.previous||baseline});apply();paint();}});row.append(b);list.append(row);}
  }
  function removeProposal(){proposal?.remove();proposal=null;}
  function offer(){
    if(!o.state.enabled||proposal||root.classList.contains('tour-active')||doc.querySelector('dialog[open],.adaptive-hint,[aria-busy=true]')||doc.activeElement?.matches('input,textarea,select,[contenteditable=true]'))return;
    const p=o.state.pending||o.propose({voiceAvailable:!!doc.querySelector('[data-voice-input]'),density:personalization.state.density});if(!p)return;
    const c=t();proposal=el('aside');proposal.className='adaptive-proposal';proposal.dataset.adaptProposal=p.key;proposal.setAttribute('role','region');proposal.setAttribute('aria-label',c.adapted);
    proposal.append(el('p',c[p.key==='voiceFirst'?'voiceProposal':'densityProposal']));const buttons=el('div');buttons.className='adaptive-actions';
    for(const [key,action]of [['yes','yes'],['no','no'],['stop','stop']]){const b=el('button',c[key]);b.type='button';b.addEventListener('click',()=>{if(action==='yes')baseline=personalization.state.density;o.resolve(action);removeProposal();apply();paint();});buttons.append(b);}
    proposal.append(buttons);doc.querySelector('main')?.prepend(proposal);
  }
  consent.addEventListener('change',()=>{o.enable(consent.checked);removeProposal();paint();});
  reset.addEventListener('click',()=>{const density=o.state.applied.find(p=>p.key==='density'),manual=Object.hasOwn(o.state.manual,'density');o.reset();if(density&&!manual)personalization.choose({density:density.previous||baseline});removeProposal();apply();paint();});
  host.addEventListener('change',e=>{if(e.target.matches('[data-adaptive-density]')){o.manual('density',e.target.value);removeProposal();paint();}});
  doc.addEventListener('synera:input-mode',e=>{if(['voice','text'].includes(e.detail?.mode)){o.record('input',e.detail.mode);queueMicrotask(offer);}});
  doc.addEventListener('synera:field-language',e=>o.record('fieldLanguage',e.detail));
  doc.addEventListener('synera:text-scale',e=>o.record('zoom',e.detail?.scale));
  doc.addEventListener('synera:voice-preference',e=>{if(typeof e.detail?.first==='boolean'){o.manual('voiceFirst',e.detail.first);removeProposal();apply();paint();}});
  let lastText=0;
  doc.addEventListener('input',e=>{if(e.target.matches('input:not([type]),input[type=text],textarea')&&now()-lastText>1000){o.record('input',e.inputType==='insertFromDictation'?'voice':'text');o.record('fieldLanguage',{field:e.target.name,lang:e.target.lang||root.lang});lastText=now();}});
  doc.addEventListener('click',e=>{
    const section=e.target.closest('section[id], [data-view]');
    const raw=section?.dataset.view||section?.id||location.pathname.split('/').at(-1)?.replace('.html','')||'home';
    const value=raw.includes('journal')?'journal':raw.includes('simulation')||raw==='feed'||raw==='join'?'simulation':raw.includes('profile')?'profile':raw;
    // Do not repaint checkboxes between click and their subsequent change event.
    o.record('section',value);queueMicrotask(offer);
  });
  doc.addEventListener('synera:appearance-reset',()=>{o.manual('density',personalization.state.density);o.reset();removeProposal();apply();paint();});
  function erase(){o.forget();removeProposal();root.dataset.voiceFirst='false';paint();}
  window.addEventListener('synera:before-device-erase',erase);
  window.addEventListener('storage',e=>{if(e.key==='synera.adapt.v1'||e.key===null){if(e.newValue===null)erase();else{o.activity();removeProposal();apply();paint();}}});
  window.visualViewport?.addEventListener('resize',()=>o.record('zoom',window.visualViewport.scale));
  new MutationObserver(()=>{removeProposal();paint();}).observe(root,{attributes:true,attributeFilter:['lang']});
  apply();paint();return o;
}
