import { BOT_PROFILES } from './simulation-personas.mjs';
import { solveBMatching } from './b-matching.mjs';

export const OPENNESS_KEY = 'synera.radar.openness.v1';
export const DEMO_KEY = 'synera.radar.demo-start.v1';
export const EVENTS_KEY = 'synera.radar.events.v1';
export const DISTRICTS = ['altstadt','kreis4','kreis5','seefeld','wiedikon'];
const text = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 180;
const zurichDate = now => new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export function endOfWindow(window, now = Date.now()) {
  if (window === '1h' || window === '3h') return now + (window === '1h' ? 1 : 3)*3600000;
  if (window !== 'today') throw Error('Invalid window');
  // Find the first instant of the next Zurich date, including 23/25-hour days.
  const day = zurichDate(now); let low=now, high=now+27*3600000;
  while(high-low>1) { const mid=Math.floor((low+high)/2); if(zurichDate(mid)===day) low=mid; else high=mid; }
  return high;
}
export function makeOpenness(input, window, now = Date.now()) {
  if (!input || !text(input.user) || !text(input.give) || !text(input.need) || !['city','district'].includes(input.precision) || (input.precision==='district'&&!DISTRICTS.includes(input.district))) throw Error('Invalid openness');
  return {user:input.user, until:new Date(endOfWindow(window,now)).toISOString(), precision:input.precision, district:input.precision==='district'?input.district:null, give:input.give.trim(), need:input.need.trim()};
}
export function isOpen(row, now = Date.now()) {
  return Boolean(row && text(row.user) && text(row.give) && text(row.need) && ['city','district'].includes(row.precision) && (row.precision==='city'?row.district===null:DISTRICTS.includes(row.district)) && Number.isFinite(Date.parse(row.until)) && Date.parse(row.until)>now && Date.parse(row.until)<=now+27*3600000);
}
export function readOpenness(raw, now = Date.now()) {
  try { const row=JSON.parse(raw); if(!isOpen(row,now)) return null; return {user:row.user,until:row.until,precision:row.precision,district:row.district,give:row.give,need:row.need}; } catch { return null; }
}
export function demoOpenness(start) {
  const pairs=[['UX design','B2B sales'],['B2B sales','UX design'],['AI automation','Finance'],['Finance','AI automation'],['Video','B2B sales'],['Community events','Video'],['Customer research','UX design'],['Prototypes','Customer research'],['Brand design','Community events'],['Partnerships','Brand design']];
  return BOT_PROFILES.map((p,i)=>({user:p.id,until:i===6||i===7?null:new Date(start+(i>=8?-1:30+i*20)*60000).toISOString(), precision:i===5?'city':'district', district:i===5?null:DISTRICTS[i%5],give:pairs[i][0],need:pairs[i][1]}));
}
export function visiblePeople(own, rows, now = Date.now()) {
  return isOpen(own,now)?rows.filter(row=>row.user!==own.user&&isOpen(row,now)):[];
}
const patterns = {
  design:/design|дизайн|figma|ux|бренд|brand/iu,
  sales:/sales|продаж|vertrieb|інтро|intro/iu,
  research:/research|interview|дослідж|інтерв|forschung/iu,
  automation:/automat|автомат|crm|\bai\b|\bki\b/iu,
  finance:/financ|pricing|budget|фінанс|ціна|бюджет|preis/iu,
  video:/video|відео|монтаж/iu,
  community:/community|events|спільнот|поді|gemeinschaft|veranstalt/iu,
};
export const skillTags = value => Object.entries(patterns).filter(([,pattern])=>pattern.test(String(value))).map(([key])=>key);
export function fitFor(own, rows) {
  const offer=skillTags(own.give), need=skillTags(own.need);
  const explained=rows.map(row=>({...row,gives:skillTags(row.give).filter(tag=>need.includes(tag)),receives:offer.filter(tag=>skillTags(row.need).includes(tag))}));
  // The existing quota solver allocates up to two suggested introductions, never a promise.
  const edges=explained.filter(row=>row.gives.length&&row.receives.length).map(row=>({partyA:own.user,partyB:row.user,weight:row.gives.length+row.receives.length}));
  const matched=new Set(solveBMatching(edges,{[own.user]:2},{defaultQuota:1}).matched.map(e=>e.partyB));
  return explained.map(row=>({...row,recommended:matched.has(row.user)})).sort((a,b)=>Number(b.recommended)-Number(a.recommended)||a.user.localeCompare(b.user));
}
export function distanceBand(own, row) {
  if(own.precision==='city'||row.precision==='city') return 'cityBand';
  if(own.district===row.district) return 'nearBand';
  const adjacent=new Set(['altstadt:kreis4','altstadt:kreis5','altstadt:seefeld','kreis4:kreis5','kreis4:wiedikon']);
  return adjacent.has([own.district,row.district].sort().join(':'))?'middleBand':'cityBand';
}
export function relevantEvents(events, own, now = Date.now()) {
  const day=zurichDate(now), noon=Date.parse(day+'T12:00:00Z');
  const monday=noon-((new Date(noon).getUTCDay()+6)%7)*86400000;
  const first=new Date(monday).toISOString().slice(0,10), last=new Date(monday+6*86400000).toISOString().slice(0,10);
  const tags=skillTags(own.give+' '+own.need);
  return events.filter(e=>e.date>=first&&e.date<=last&&DISTRICTS.includes(e.district)&&(own.precision==='city'||own.district===e.district)&&e.topics.some(tag=>tags.includes(tag))).sort((a,b)=>a.date.localeCompare(b.date));
}
export function validateDraft(input) {
  const topic=input.topic??input.topics?.[0];
  if(!text(input.title)||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!Number.isFinite(Date.parse(input.date))||new Date(input.date).toISOString().slice(0,10)!==input.date||!DISTRICTS.includes(input.district)||!Object.hasOwn(patterns,topic)) throw Error('Invalid event');
  return {title:input.title.trim(),date:input.date,district:input.district,topics:[topic],local:true};
}
