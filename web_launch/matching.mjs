// Local, deterministic baseline. This is not an LLM, a probability model or an arbitrator.
export const CAPABILITIES = Object.freeze({ automation: 'Автоматизація процесів', design: 'Дизайн продукту', research: 'Інтерв’ю з клієнтами', sales: 'B2B-продажі', video: 'Відеопрезентація', finance: 'Бюджетування', events: 'Організація подій' });
export const CITIES = Object.freeze({ zurich: { label: 'Zürich', lat: 47.3769, lon: 8.5417 }, winterthur: { label: 'Winterthur', lat: 47.499, lon: 8.7241 }, zug: { label: 'Zug', lat: 47.1662, lon: 8.5155 }, basel: { label: 'Basel', lat: 47.5596, lon: 7.5886 }, bern: { label: 'Bern', lat: 46.948, lon: 7.4474 } });
const LANGUAGES = ['de', 'en', 'uk', 'fr'];
const MODES = ['exchange', 'joint_project'];
const cleanSet = (input, allowed) => Array.isArray(input) ? [...new Set(input.filter(v => allowed.includes(v)))].sort() : [];
const validDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const intersect = (a, b) => a.filter(value => b.includes(value)).sort();
const dayNumber = value => Date.parse(value) / 86400000;

// Explicit projection: names, contacts, journals, billing tier and arbitrary instructions never enter the decision.
export function normalizeProfile(input = {}) {
  if (!input || typeof input !== 'object') input = {};
  const skills = Object.keys(CAPABILITIES), needs = new Map();
  for (const need of Array.isArray(input.needs) ? input.needs.slice(0, 20) : []) {
    if (skills.includes(need?.tag) && [1, 2, 3].includes(need.priority)) needs.set(need.tag, Math.max(needs.get(need.tag) || 0, need.priority));
  }
  return {
    id: typeof input.id === 'string' && /^[a-z0-9-]{1,40}$/.test(input.id) ? input.id : '',
    city: Object.hasOwn(CITIES, input.city) ? input.city : '',
    offers: cleanSet(input.offers, skills),
    needs: [...needs].sort(([a], [b]) => a.localeCompare(b)).map(([tag, priority]) => ({ tag, priority })),
    languages: cleanSet(input.languages, LANGUAGES), modes: cleanSet(input.modes, MODES),
    availableFrom: validDay(input.availableFrom) ? input.availableFrom : '',
    availableUntil: validDay(input.availableUntil) ? input.availableUntil : '',
    updatedAt: validDay(input.updatedAt) ? input.updatedAt : '',
    consent: input.consent === true, mapConsent: input.mapConsent === true,
    remote: input.remote === true, maxKm: [0, 25, 50, 100, 300].includes(input.maxKm) ? input.maxKm : null,
    requiresConfidentiality: input.requiresConfidentiality === true,
    acceptsConfidentiality: input.acceptsConfidentiality === true,
  };
}

export function cityDistance(a, b) {
  if (!Object.hasOwn(CITIES, a) || !Object.hasOwn(CITIES, b)) return null;
  const first = CITIES[a], second = CITIES[b], rad = value => value * Math.PI / 180;
  const h = Math.sin(rad(second.lat - first.lat) / 2) ** 2 + Math.cos(rad(first.lat)) * Math.cos(rad(second.lat)) * Math.sin(rad(second.lon - first.lon) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function nearbyProfiles(profiles, city, maxKm) {
  if (!Object.hasOwn(CITIES, city) || !Number.isFinite(maxKm) || maxKm < 0) return [];
  return profiles.map(normalizeProfile).filter(p => p.consent && p.mapConsent && p.city)
    .map(p => ({ id: p.id, city: p.city, distanceKm: cityDistance(city, p.city) }))
    .filter(p => p.distanceKm <= maxKm).sort((a, b) => a.distanceKm - b.distanceKm || a.id.localeCompare(b.id));
}

function coverage(receiver, giver) {
  const total = receiver.needs.reduce((sum, n) => sum + n.priority, 0);
  const met = receiver.needs.filter(n => giver.offers.includes(n.tag)).sort((a, b) => b.priority - a.priority || a.tag.localeCompare(b.tag));
  return { receiver: receiver.id, giver: giver.id, percent: total ? Math.round(100 * met.reduce((sum, n) => sum + n.priority, 0) / total) : 0,
    matched: met.map(n => ({ tag: n.tag, priority: n.priority, evidence: [`${receiver.id}.needs.${n.tag}`, `${giver.id}.offers.${n.tag}`] })),
    unmet: receiver.needs.filter(n => !giver.offers.includes(n.tag)).map(n => n.tag) };
}

export function compareProfiles(left, right, { asOf = new Date().toISOString().slice(0, 10) } = {}) {
  if (!validDay(asOf)) throw new Error('Invalid comparison date');
  const parties = [normalizeProfile(left), normalizeProfile(right)].sort((a, b) => a.id.localeCompare(b.id));
  const base = { version: 'synera-baseline-1', asOf, engine: 'deterministic-local', status: 'needs_information', reasons: [], score: null, directions: [], logistics: null, plan: [], consentForIntroduction: false };
  const stop = (status, reasons) => ({ ...base, status, reasons: [...new Set(reasons)].sort() });
  if (parties.some(p => !p.id) || parties[0].id === parties[1].id) return stop('needs_information', ['Потрібні два різні профілі.']);
  // Consent check happens before any content is emitted.
  if (parties.some(p => !p.consent)) return stop('consent_required', ['Обидві сторони мають дозволити порівняння.']);
  const missing = [];
  for (const p of parties) {
    if (!p.offers.length || !p.needs.length) missing.push(`${p.id}: заповніть пропозиції та потреби.`);
    if (!p.languages.length || !p.modes.length) missing.push(`${p.id}: вкажіть мову і формат співпраці.`);
    if ((!p.city && !p.remote) || p.maxKm === null) missing.push(`${p.id}: вкажіть місто або онлайн і прийнятну відстань.`);
    if (!p.availableFrom || !p.availableUntil || p.availableFrom > p.availableUntil) missing.push(`${p.id}: уточніть період доступності.`);
    if (!p.updatedAt || p.updatedAt > asOf || dayNumber(asOf) - dayNumber(p.updatedAt) > 30) missing.push(`${p.id}: актуальність профілю не підтверджена за останні 30 днів.`);
  }
  if (missing.length) return stop('needs_information', missing);
  const [a, b] = parties, languages = intersect(a.languages, b.languages), modes = intersect(a.modes, b.modes);
  const distanceKm = cityDistance(a.city, b.city), remote = a.remote && b.remote;
  const from = [a.availableFrom, b.availableFrom, asOf].sort().at(-1), until = [a.availableUntil, b.availableUntil].sort()[0];
  const conflicts = [];
  if (!languages.length) conflicts.push('Не вказано спільної мови.');
  if (!modes.length) conflicts.push('Формати співпраці не збігаються.');
  if (from > until) conflicts.push('Немає спільного періоду доступності.');
  if (!remote && distanceKm === null) conflicts.push('Для особистої зустрічі уточніть міста обох сторін.');
  if (!remote && distanceKm > Math.min(a.maxKm, b.maxKm)) conflicts.push('Відстань перевищує обмеження принаймні однієї сторони.');
  if ((a.requiresConfidentiality && !b.acceptsConfidentiality) || (b.requiresConfidentiality && !a.acceptsConfidentiality)) conflicts.push('Є незгода щодо конфіденційності.');
  if (conflicts.length) return stop('incompatible', conflicts);
  const directions = [coverage(a, b), coverage(b, a)], score = Math.min(...directions.map(d => d.percent));
  const result = { ...base, score, directions, logistics: { languages, modes, from, until, remote, distanceKm: distanceKm === null ? null : Math.round(distanceKm) } };
  if (!score) return { ...result, status: 'insufficient_mutual_value', reasons: ['В одному з напрямків не знайдено покриття заявлених потреб. Це не оцінка цінності людини.'] };
  return { ...result, status: 'review_candidate', reasons: ['Є заявлена користь для обох. Компетентність і результат ще не перевірені.'],
    plan: directions.map(d => ({ giver: d.giver, receiver: d.receiver, topic: d.matched[0].tag, action: `Показати один приклад роботи: ${CAPABILITIES[d.matched[0].tag]}. Узгодити один вимірюваний результат пробної співпраці.` })) };
}

export function reviewIntroduction(result, approvals) {
  const ids = result.directions.map(d => d.receiver);
  return { allowed: result.status === 'review_candidate' && ids.length === 2 && ids.every(id => approvals?.[id] === true), binding: false };
}

export function caseWithoutIdentity(left, right, options) {
  // IDs become labels only here; retained city/skills can still be identifying in a small community.
  const pair = [normalizeProfile(left), normalizeProfile(right)];
  if (pair.some(p => !p.consent)) return { status: 'consent_required', profiles: [] };
  const profiles = pair.map((p, index) => ({ ...p, id: `party-${index + 1}`, mapConsent: false }));
  return { privacy: 'Pseudonymous, not guaranteed anonymous. Local use by default.', profiles, comparison: compareProfiles(...profiles, options) };
}
