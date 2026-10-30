import { suggestAll } from './sovereign.mjs';
import { analyzeBalance } from './balance.mjs';
import { adaptCopy } from './adapt-copy.mjs';
const views=new WeakMap();
// Shared-screen renderer. No remote sharing, profile publication, or automatic blocking.
export function mountSovereign(target,context,{onPause=()=>{},onResume=()=>{}}={}) {
  if(!target)return;
  const doc=target.ownerDocument,t=adaptCopy(context.lang);
  let view=views.get(target);if(!view||view.collaborationId!==context.collaborationId){view={collaborationId:context.collaborationId,dismissed:new Set(),paused:false};views.set(target,view);}
  const dismissed=view.dismissed;
  const el=(tag,text)=>{const n=doc.createElement(tag);if(text)n.textContent=text;return n;};
  const button=(label,fn)=>{const b=el('button',label);b.type='button';b.addEventListener('click',fn);return b;};
  const section=el('section');section.className='adaptive-proposal sovereign-panel';section.dataset.sovereign='';
  section.append(el('h3',t.sovereign),el('p',t.rules));
  for(const s of suggestAll({...context,dismissed:[...dismissed]})){
    const item=el('article');item.dataset.suggestion=s.kind;item.append(el('h4',t[s.kind]),el('p',s.text));
    const why=el('details');why.append(el('summary',t.why),el('p',s.why));item.append(why,button(t.dismiss,()=>{dismissed.add(s.id);item.remove();}));section.append(item);
  }
  const signals=analyzeBalance(context);
  if(signals.length){const balance=el('section');balance.dataset.balance='';balance.append(el('h3',t.balance),el('p',t.balanceNote));
    for(const s of signals){if(dismissed.has(`balance-${s.kind}`))continue;const item=el('article');item.dataset.balanceSignal=s.kind;item.append(el('p',s.text));const why=el('details');
      why.append(el('summary',t.why),el('p',Object.entries(s.counts).map(([id,n])=>`${id}: ${n}`).join(' · ')),el('p',s.why));
      if(s.giveTake)for(const [id,row]of Object.entries(s.giveTake))why.append(el('p',`${id} · ${t.given}: ${row.given} · ${t.received}: ${row.received} · ${t.ratio}: ${row.ratio===null?t.unknown:row.ratio.toFixed(2)}`));
      item.append(why,button(t.dismiss,()=>{dismissed.add(`balance-${s.kind}`);item.remove();}));balance.append(item);}
    section.append(balance);
  }
  const notice=el('p');notice.setAttribute('role','status');
  const pause=button(view.paused?t.resume:t.pause,()=>{view.paused=!view.paused;pause.textContent=view.paused?t.resume:t.pause;notice.textContent=view.paused?t.paused:'';view.paused?onPause():onResume();});pause.dataset.collaborationPause='';
  section.append(pause,button(t.report,()=>{notice.replaceChildren(el('span',t.reportNotice+' '));const link=el('a',t.operator);link.href='/legal.html';notice.append(link);}),notice);
  target.replaceChildren(section);if(view.paused){notice.textContent=t.paused;onPause();}return {get paused(){return view.paused;},dismissed};
}
