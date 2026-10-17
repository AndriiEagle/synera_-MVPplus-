// Comparable travel durations must come from the same mode/time window.
// A local calculation over user-entered estimates; no route/weather API is called.
export function chooseMeetingPlace(candidates, limits) {
  if (!Array.isArray(limits) || ![2,3].includes(limits.length) || limits.some(n => !Number.isFinite(n) || n < 0)) throw new Error('Вкажи межі часу для двох або трьох учасників.');
  if (!Array.isArray(candidates)) throw new Error('Потрібен список місць.');
  const valid = candidates.filter(c => c.acceptable === true && typeof c.name === 'string' && c.name.trim() &&
    Array.isArray(c.minutes) && c.minutes.length === limits.length && c.minutes.every((n,i) => Number.isFinite(n) && n >= 0 && n <= limits[i]));
  const ranked = valid.map(c => ({ ...c, minutes: [...c.minutes], max: Math.max(...c.minutes),
    spread: Math.max(...c.minutes)-Math.min(...c.minutes), total: c.minutes.reduce((a,b)=>a+b,0) }))
    .sort((a,b)=>a.max-b.max || a.spread-b.spread || a.total-b.total || a.name.localeCompare(b.name));
  return { status: ranked.length ? 'proposal' : 'no_feasible_place', candidate: ranked[0] ?? null,
    source: 'manual_estimates', objective: 'minimize_max_travel_then_spread_then_total', binding: false };
}
// Price snapshot: Google global pay-as-you-go, retrieved 2026-10-02.
// This bounded scenario covers only the first paid volume band, not a provider quote.
export function googleMapScenario({ loads, matrixElements }) {
  if (![loads,matrixElements].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=100000)) throw new Error('Сценарій підтримує до 100 000 одиниць кожного SKU.');
  const mapUSD = Math.max(0,loads-10000)*7/1000;
  const matrixUSD = Math.max(0,matrixElements-10000)*5/1000;
  return { currency:'USD', mapUSD, matrixUSD, totalUSD:mapUSD+matrixUSD, scenario:true,
    excludes:['places','geocoding','ai','hosting','operator','tax'], snapshot:'2026-10-02' };
}
export function complimentarySkills(people, selectedId) {
  const selected=people.find(p=>p.id===selectedId);
  if(!selected)return [];
  return people.filter(p=>p.id!==selectedId&&p.visible===true)
    .map(p=>({id:p.id,name:p.name,gives:p.offers.filter(x=>selected.needs.includes(x)),
      receives:selected.offers.filter(x=>p.needs.includes(x))}))
    .filter(p=>p.gives.length||p.receives.length);
}
