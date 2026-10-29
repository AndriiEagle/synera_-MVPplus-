import { solveBMatching } from './b-matching.mjs';
import { collaborationEvents } from './balance.mjs';
import { adaptCopy, MATCH_COPY } from './adapt-copy.mjs';
const strings=value=>Array.isArray(value)?[...new Set(value.filter(s=>typeof s==='string'&&s.trim()).map(s=>s.trim().toLowerCase()))].sort():[];
export function clarityFields(message={}) {
  if(message.concrete&&typeof message.concrete==='object')return Object.fromEntries(['ask','offer','time','limit'].map(k=>[k,message.concrete[k]===true]));
  const text=String(message.text||'').toLowerCase();
  return {
    ask:/can you\s+\S{3}|could you\s+\S{3}|please\s+\S{3}|можеш\s+\S{3}|потрібн\S*\s+\S{3}|kannst du\s+\S{3}|bitte\s+\S{3}/u.test(text),
    offer:/i (can|offer|will)\s+\S{3}|я (можу|пропоную|зроблю)\s+\S{3}|ich (kann|biete|werde)\s+\S{3}/u.test(text),
    time:/\d{1,2}[:.]\d{2}|\d{4}-\d\d-\d\d|tomorrow|today|завтра|сьогодні|morgen|heute/u.test(text),
    limit:/(?:max(?:imum)?|at most|up to|не більше|максимум|лише|höchstens|bis zu)\s+\d/u.test(text),
  };
}
export function commonLinks(parties=[]) {
  const sorted=[...parties].sort((a,b)=>String(a.id).localeCompare(String(b.id))),candidates=[];
  for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length;j++) {
    const a=sorted[i],b=sorted[j],links=[];
    if(a.formats?.length&&b.formats?.length&&!a.formats.some(f=>b.formats.includes(f)))continue;
    for(const [giver,receiver]of [[a,b],[b,a]])for(const tag of strings(giver.give))if(strings(receiver.need).includes(tag))links.push({giver:giver.id,receiver:receiver.id,tag});
    if(links.length)candidates.push({partyA:a.id,partyB:b.id,weight:links.length,links});
  }
  return solveBMatching(candidates,{}, {defaultQuota:Math.max(1,sorted.length-1)}).matched.flatMap(e=>e.links);
}
export function suggestAll(context={}) {
  const {parties=[],lang='uk',dismissed=[]}=context,t=adaptCopy(lang),ids=parties.map(p=>p.id).sort();
  if(parties.length<2||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!id))return [];
  const suggestions=[],put=(id,kind,text,why)=>suggestions.push({id,kind,text,why,confidence:'rule'});
  const links=commonLinks(parties);
  const m=MATCH_COPY[lang]||MATCH_COPY.uk;
  const boundaries=[...parties].sort((a,b)=>a.id.localeCompare(b.id)).map(p=>[p.id,...['goal','limits','formats'].filter(k=>p[k]?.length).map(k=>`${m[k]}: ${Array.isArray(p[k])?p[k].join(', '):p[k]}`)].join(' · ')).join('; ');
  if(links.length)put('common','common',t.commonText,`${t.commonWhy}: ${links.map(l=>`${l.giver} → ${l.receiver}: ${l.tag}`).join('; ')}. ${boundaries}`);
  put('next','next',t.nextText,t.nextWhy);
  const message=collaborationEvents(context).filter(e=>e.type==='message').at(-1);
  if(message){const fields=clarityFields(message),missing=['ask','offer','time','limit'].filter(key=>!fields[key]);if(missing.length)put(`clarity-${message.id}`,'clarity',t.clarityText,`${t.clarityWhy}: ${missing.map(k=>t[k]).join(', ')}`);}
  if(parties.length===3)put('triangle','triangle',t.triangleText,`${t.triangleWhy}: ${ids.join(', ')}`);
  return suggestions.filter(s=>!dismissed.includes(s.id));
}
// Stable live-AI seam: a single suggestion has exactly this four-field contract.
export function suggest(context={}) {
  const first=suggestAll(context)[0];return first?{text:first.text,why:first.why,kind:first.kind,confidence:first.confidence}:null;
}
