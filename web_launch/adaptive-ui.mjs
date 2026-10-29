import { createPersonalization, applyPersonalization } from './adaptive.mjs';
import { PALETTES, DENSITIES, HINTS } from './adaptive-config.mjs';
import { ADAPTIVE_ROWS } from './adaptive-i18n-table.mjs';

// This UI owns its small translation table on every shared-shell page. It never reads form values.
export function installAdaptive({ document:doc=document, storage, now=Date.now }={}) {
  const root=doc.documentElement, host=doc.querySelector('.header-preferences-content');
  if(!host || host.querySelector('[data-adaptive-ui]'))return;
  if(storage===undefined)try {storage=window.localStorage;}catch {storage=null;}
  let session=null;
  try {
    session=window.sessionStorage;
    session.setItem('synera.adaptive.session-check','1');session.removeItem('synera.adaptive.session-check');
  }catch {session=null;}
  const c=createPersonalization({storage,session,root,now});
  if(!session&&c.state.adaptation.enabled)c.setAdaptation(false);
  const maps={uk:0,de:1,en:2};
  const t=source=>ADAPTIVE_ROWS.find(row=>row[0]===source)?.[maps[root.lang]??0]??source;
  const labels=[];
  function node(tag,text,attrs={}) {
    const e=doc.createElement(tag);
    if(text) {e.textContent=t(text); labels.push([e,text]);}
    for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);
    return e;
  }
  const section=node('section','',{'data-adaptive-ui':'',class:'adaptive-settings',translate:'no'});
  section.append(node('h3','Особистий вигляд'));
  const accentGroup=node('fieldset','',{class:'adaptive-accents','data-hint-context':'appearance'});
  accentGroup.append(node('legend','Акцент для тебе'));
  const accents=[['by-look','За виглядом'],...PALETTES.map(p=>[p.id,p.name_uk])].map(([id,label])=>{
    const b=node('button',label,{type:'button','data-personal-accent':id});
    const palette=PALETTES.find(p=>p.id===id);
    if(palette) {b.style.setProperty('--swatch-dark',palette.dark['--accent']);b.style.setProperty('--swatch-light',palette.light['--accent']);}
    b.addEventListener('click',()=>{c.choose({accent:id});update();}); accentGroup.append(b);return b;
  });
  section.append(accentGroup);
  const sizes=node('details','',{class:'adaptive-sizes'}), sizeSummary=node('summary','Розміри і текст',{'data-hint-context':'density'});
  sizes.append(sizeSummary);
  const densityLabel=node('label'),density=node('select','',{'aria-label':t('Щільність'),'data-adaptive-density':''});
  labels.push([density,'Щільність','aria-label']);
  densityLabel.append(node('span','Щільність'),density);
  for(const d of DENSITIES)density.append(node('option',d.name_uk,{value:d.id}));
  density.addEventListener('change',()=>{c.choose({density:density.value});update();});
  const enlarge=node('button','Збільшити текст тут',{type:'button'}), textReset=node('button','Звичайний масштаб тексту',{type:'button'});
  enlarge.addEventListener('click',()=>{ c.signal('enlarge'); c.choose({textScale:Math.min(2,c.state.textScale+.125)}); update(); });
  textReset.addEventListener('click',()=>{c.choose({textScale:1});update();});
  sizes.append(densityLabel,enlarge,textReset);section.append(sizes);
  const undo=node('button','Повернути попереднє',{type:'button','data-adaptive-undo':''});
  undo.addEventListener('click',()=>{c.undo();update();});section.append(undo);
  function checkbox(source,fn,context) {
    const label=node('label','',{class:'adaptive-check',...(context?{'data-hint-context':context}:{})}),input=node('input','',{type:'checkbox'});
    label.append(input,node('span',source));input.addEventListener('change',()=>fn(input.checked));section.append(label);return input;
  }
  const consent=checkbox('Дозволити підказки вигляду за моїми діями на цьому пристрої. Дані не надсилаються.',enabled=>{c.setAdaptation(enabled);closeProposal();update();},'adaptive_permission');
  consent.disabled=!session;
  const hintToggle=checkbox('Показувати підказки',enabled=>{c.setHints(enabled);clearHint();update();});
  const help=node('button','Допомога на цьому екрані',{type:'button'}), replay=node('button','Показати підказки знову',{type:'button'});
  help.addEventListener('click',()=>{clearHint(); showHint(lastHint||'welcome',help,true);});
  replay.addEventListener('click',()=>{clearHint();c.resetHints();update();});section.append(help,replay);
  const resetDetails=node('details','',{class:'adaptive-reset','data-hint-context':'reset'});
  resetDetails.append(node('summary','Скинути персоналізацію'));
  resetDetails.append(node('p','Поверне Current, акцент за виглядом і комфортні розміри. Очистить локальні підказки та їхні лічильники. Мова, профіль і дозволи не зміняться.'));
  const reset=node('button','Так, скинути персоналізацію',{type:'button'});
  reset.addEventListener('click',()=>{
    clearHint();closeProposal();c.reset();
    doc.dispatchEvent(new CustomEvent('synera:appearance-reset'));
    const style=doc.querySelector('#style-preset');if(style)style.value='synera';
    resetDetails.open=false;update();
  });resetDetails.append(reset);section.append(resetDetails);
  const status=node('p','',{class:'adaptive-storage',role:'status','aria-live':'polite'});section.append(status);
  host.append(section);
  // Keep saved legacy controls available, without presenting two competing accent pickers on first use.
  const legacy=host.querySelector('[data-atelier-controls]');
  if(legacy) {const details=node('details','',{class:'adaptive-legacy'});details.append(node('summary','Попередні налаштування Atelier'),legacy);host.append(details);}

  let hintBox=null, hintTarget=null, lastHint=null, proposalBox=null, proposed=null, dialog=null;
  function clearHint(dismiss=false,restore=false) {
    if(dismiss)c.dismissHint();else c.closeHint();
    hintBox?.remove();hintBox=null;
    if(restore && hintTarget?.isConnected)hintTarget.focus({preventScroll:true});hintTarget=null;
  }
  function showHint(id,target,manual=false) {
    if(!target || target.closest('[hidden]') || !c.hint(id,{manual,tour:root.classList.contains('tour-active')}))return;
    const h=HINTS.find(h=>h.id===id);lastHint=id;hintTarget=target;
    hintBox=node('aside','',{class:'adaptive-hint',role:'note',translate:'no','data-adaptive-hint':id});
    hintBox.append(node('p',h.uk));
    const actions=node('div','',{class:'adaptive-actions'});
    for(const label of ['Зрозуміло','Закрити підказку']) {const b=node('button',label,{type:'button'});b.addEventListener('click',()=>clearHint(true,true));actions.append(b);}
    hintBox.append(actions);
    const anchor=target.closest('fieldset,label,.draft-entry,.real-card,.adaptive-reset')||target;
    anchor.after(hintBox);
  }
  function busy() {
    return root.classList.contains('tour-active') || !!doc.querySelector('dialog[open], [aria-busy="true"]') || !!doc.activeElement?.closest('form,input,textarea,select,[contenteditable="true"]');
  }
  function closeProposal() {proposalBox?.remove();proposalBox=null;proposed=null;if(dialog){dialog.close();dialog.remove();dialog=null;}}
  function resolve(action) {const id=proposed;if(id)c.resolve(id,action);closeProposal();update();}
  function preview() {
    if(!proposed)return;
    dialog=node('dialog','',{class:'adaptive-preview',translate:'no','aria-labelledby':'adaptive-preview-title'});
    dialog.append(node('h2','Перегляд розмірів',{id:'adaptive-preview-title'}));
    const samples=node('div','',{class:'adaptive-comparison'});
    for(const [id,label] of [[c.state.density,'Зараз'],[proposed,'Пропозиція']]) {
      const sample=node('section','',{class:'adaptive-sample'}),m=DENSITIES.find(d=>d.id===id).metrics;
      sample.style.padding=m.panel_padding_px+'px';sample.style.fontSize=`calc(${m.body_font_rem}rem * ${c.state.textScale})`;
      sample.append(node('h3',label),node('p','Можу допомогти · Шукаю допомогу'));
      const action=node('span','Наступний крок',{class:'adaptive-sample-action'});action.style.minHeight=m.control_min_height_px+'px';sample.append(action);samples.append(sample);
    }
    dialog.append(samples,node('p','Робочий екран зміниться лише після підтвердження.'));
    const yes=node('button','Так, застосувати',{type:'button',class:'primary'}),no=node('button','Ні, залишити',{type:'button'});
    yes.addEventListener('click',()=>resolve('apply'));no.addEventListener('click',()=>resolve('decline'));
    dialog.addEventListener('cancel',event=>{event.preventDefault();resolve('decline');});dialog.append(yes,no);doc.body.append(dialog);dialog.showModal();no.focus();
  }
  function offer() {
    const id=c.proposal({busy:busy()});if(!id || hintBox || !c.present(id))return;
    proposed=id;proposalBox=node('aside','',{class:'adaptive-proposal',role:'region',translate:'no','aria-label':t('Пропозиція вигляду')});
    labels.push([proposalBox,'Пропозиція вигляду','aria-label']);
    proposalBox.append(node('p',DENSITIES.find(d=>d.id===id).proposal.copy_uk));
    const actions=node('div','',{class:'adaptive-actions'});
    for(const [label,fn] of [['Переглянути',preview],['Ні, залишити',()=>resolve('decline')],['Не пропонувати',()=>resolve('stop')]]) {
      const b=node('button',label,{type:'button'});b.addEventListener('click',fn);actions.append(b);
    }
    proposalBox.append(actions);doc.querySelector('main')?.prepend(proposalBox);
  }
  function update() {
    const s=c.state;accents.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.personalAccent===s.accent)));
    density.value=s.density;consent.checked=s.adaptation.enabled;hintToggle.checked=s.hints;undo.disabled=!s.previous;
    enlarge.disabled=s.textScale>=2;textReset.disabled=s.textScale===1;
    status.textContent=t(c.persisted?'Збережено тільки в цьому браузері.':'Налаштування діють тут. Якщо сховище недоступне, після закриття вкладки вони зникнуть.');
  }
  const contexts=[
    ['#prepare-profile','welcome'],['[name="offers"],[name="seeks"]','exchange'],['[name="city"],#city','location'],
    ['.brief-details>summary','match_reason'],['.case-terms>summary,#real-editor>summary','invitation'],
    ['#invite-note,#real-invite-form textarea','send'],['[name="is_discoverable"],[name="map_visible"]','visibility'],
    ['[data-hint-context="appearance"] button','appearance'],['[data-hint-context="density"]','density'],
    ['[data-hint-context="adaptive_permission"] input','adaptive_permission'],['[data-hint-context="reset"]>summary','reset'],
    ['#install-hint-install:not([hidden]),#install:not([hidden])','install'],['#install-hint-guide:not([hidden])','install_ios']
  ];
  doc.addEventListener('focusin',event=>{
    c.activity();
    // Keep the hint until dismissal: removing it on focus moves the next pointer target before click.
    if(hintBox && !hintBox.checkVisibility())clearHint();
    for(const [selector,id] of contexts)if(event.target.matches(selector)){showHint(id,event.target);break;}
  });
  doc.addEventListener('click',()=>{c.activity();queueMicrotask(offer);});
  doc.addEventListener('focusout',()=>queueMicrotask(offer));
  doc.addEventListener('toggle',event=>{if(event.target.matches('.brief-details[open]'))c.signal('expand');},true);
  doc.addEventListener('keydown',event=>{if(event.key==='Escape'&&hintBox){event.preventDefault();clearHint(true,true);}});
  new MutationObserver(records=>{
    if(records.some(r=>r.attributeName==='lang')) {
      for(const [element,source,attr] of labels)if(element.isConnected) {if(attr)element.setAttribute(attr,t(source));else element.textContent=t(source);}
      update();
    }
    if(root.classList.contains('tour-active')) {clearHint();if(proposed)resolve('decline');}
    if(records.some(r=>r.attributeName==='data-synera-style'||r.attributeName==='data-synera-atelier'))applyPersonalization(root,c.state);
  }).observe(root,{attributes:true,attributeFilter:['lang','class','data-synera-style','data-synera-atelier']});
  update();return c;
}

if(typeof document!=='undefined'&&typeof window!=='undefined')installAdaptive();
