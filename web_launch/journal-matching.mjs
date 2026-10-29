import { commonLinks } from './sovereign.mjs';
import { adaptCopy } from './adapt-copy.mjs';
// Reads only caller-supplied own journal; does not write, infer tags from private text, or fetch.
export function similarPeople({owner,candidates=[],journal=[],enabled=false,lang='uk'}={}) {
  if(!enabled||!owner?.id)return [];
  const successes=journal.filter(e=>e.kind==='result'&&e.data?.ownerId===owner.id&&e.data.source==='visitor'&&e.data.matchingConsent===true&&e.data.useful===true&&e.data.partner?.id!==owner.id).map(e=>e.data.partner).filter(Boolean);
  const results=[];
  for(const candidate of candidates){
    if(!candidate?.id||candidate.id===owner.id||successes.some(p=>p.id===candidate.id))continue;
    const links=commonLinks([owner,candidate]);
    // Similarity supplements current two-way relevance; it never waives a person's limits.
    if(!links.some(l=>l.giver===owner.id)||!links.some(l=>l.giver===candidate.id))continue;
    if(owner.formats?.length&&candidate.formats?.length&&!owner.formats.some(f=>candidate.formats.includes(f)))continue;
    if(owner.limits?.some(l=>l.startsWith('exclude:')&&candidate.give?.includes(l.slice(8))))continue;
    const tags=[...new Set(successes.flatMap(p=>(p.give||[]).filter(tag=>candidate.give?.includes(tag))))].sort();
    if(tags.length)results.push({id:candidate.id,why:`${adaptCopy(lang).similarWhy}: ${tags.join(', ')}`,tags});
  }
  return results.sort((a,b)=>b.tags.length-a.tags.length||a.id.localeCompare(b.id));
}
