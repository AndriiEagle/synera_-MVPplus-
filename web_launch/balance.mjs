import { adaptCopy } from './adapt-copy.mjs';
// Counts are observable events, never personality, intent, financial value or trust scores.
export function collaborationEvents({parties=[],events=[],collaborationId}={}) {
  const ids=new Set(parties.map(p=>p.id)),seen=new Set();
  if(!collaborationId||ids.size<2||ids.size!==parties.length)return [];
  return events.filter(e=>e&&typeof e.id==='string'&&e.collaborationId===collaborationId&&ids.has(e.actor)&&(!e.to||ids.has(e.to))&&!seen.has(e.id)&&seen.add(e.id));
}
export function analyzeBalance(context={}) {
  const {parties=[],lang='uk',now=0}=context,events=collaborationEvents(context),ids=parties.map(p=>p.id).sort(),t=adaptCopy(lang),signals=[];
  if(!events.length)return signals;
  const counts=rows=>Object.fromEntries(ids.map(id=>[id,rows.filter(e=>e.actor===id).length]));
  function add(kind,rows){if(rows.length)signals.push({kind,text:t[kind],why:`${t.evidence}: ${rows.map(e=>e.id).join(', ')}`,counts:counts(rows),evidence:rows.map(e=>e.id)});}
  const delivered=[],unique=new Set();
  for(const e of events)if(e.type==='contribution'&&e.concrete===true&&e.delivered===true&&typeof e.contributionId==='string'&&e.contributionId&&!unique.has(`${e.actor}:${e.contributionId}`)){unique.add(`${e.actor}:${e.contributionId}`);delivered.push(e);}
  if(new Set(Object.values(counts(delivered))).size>1){
    add('contributions',delivered);
    signals.at(-1).giveTake=Object.fromEntries(ids.map(id=>{
      const given=delivered.filter(e=>e.actor===id).length,received=delivered.filter(e=>e.to===id||!e.to&&ids.length===2&&e.actor!==id).length;
      return [id,{given,received,ratio:received?given/received:null}];
    }));
  }
  const asks=events.filter(e=>e.type==='ask'&&e.hasOffer===false),askCounts=counts(asks);
  if(Math.max(...Object.values(askCounts))>=2&&new Set(Object.values(askCounts)).size>1)add('asks',asks);
  const pressure=events.filter(e=>e.type==='message'&&typeof e.text==='string'&&/do it now|or else|must immediately|sofort nötig|sonst sagen wir ab|негайно|інакше скасу/u.test(e.text.toLowerCase()));
  if(new Set(Object.values(counts(pressure))).size>1)add('pressure',pressure);
  const changes=events.filter(e=>['deadline_moved','cancel'].includes(e.type)&&e.agreementId&&delivered.some(d=>d.actor!==e.actor&&d.agreementId===e.agreementId&&events.indexOf(d)<events.indexOf(e)));
  if(new Set(Object.values(counts(changes))).size>1)add('after_delivery',changes);
  const terms=events.filter(e=>e.type==='terms_changed'&&e.agreed===false);
  if(Math.max(...Object.values(counts(terms)))>=2&&new Set(Object.values(counts(terms))).size>1)add('terms',terms);
  const confirms=events.filter(e=>e.type==='confirmed'&&e.revision&&Number.isFinite(e.at)&&now-e.at>86400000);
  const delayed=confirms.filter(e=>ids.some(id=>!events.some(other=>other.type==='confirmed'&&other.actor===id&&other.revision===e.revision)));
  add('delayed',delayed);
  return signals;
}
