// Local, deterministic baseline. This is not an LLM, a probability model or an arbitrator.
export const CAPABILITIES = Object.freeze({ automation: 'Автоматизація процесів', design: 'Дизайн продукту', research: 'Інтерв’ю з клієнтами', sales: 'B2B-продажі', video: 'Відеопрезентація', finance: 'Бюджетування', events: 'Організація подій' });
export const CITIES = Object.freeze({ zurich: { label: 'Zürich', lat: 47.3769, lon: 8.5417 }, winterthur: { label: 'Winterthur', lat: 47.499, lon: 8.7241 }, zug: { label: 'Zug', lat: 47.1662, lon: 8.5155 }, basel: { label: 'Basel', lat: 47.5596, lon: 7.5886 }, bern: { label: 'Bern', lat: 46.948, lon: 7.4474 } });
const LANGUAGES = ['de', 'en', 'uk', 'fr'];
export const COLLABORATION_MODES = Object.freeze(['exchange', 'hybrid', 'joint_project', 'paid_service', 'referral']);
const MODES = COLLABORATION_MODES;
const cleanSet = (input, allowed) => Array.isArray(input) ? [...new Set(input.filter(v => allowed.includes(v)))].sort() : [];
const validDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const intersect = (a, b) => a.filter(value => b.includes(value)).sort();
const dayNumber = value => Date.parse(value) / 86400000;
export const ALGORITHMIC_NOT_SCORED = Object.freeze(['skills', 'resources', 'industries', 'goals', 'projects', 'network', 'desired_connections', 'current_priorities']);

export function normalizeModeDetails(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
  const paidRole = ['buyer', 'supplier'].includes(input.paid_service?.role) ? input.paid_service.role : '';
  const referralRole = ['introducer', 'seeker'].includes(input.referral?.role) ? input.referral.role : '';
  const thirdPartyStatus = ['not_consulted', 'consented'].includes(input.referral?.thirdPartyStatus) ? input.referral.thirdPartyStatus : 'not_consulted';
  return {
    paid_service: { role: paidRole },
    referral: {
      role: referralRole,
      benefitTags: cleanSet(input.referral?.benefitTags, Object.keys(CAPABILITIES)),
      sourceDeclared: input.referral?.sourceDeclared === true,
      recipientScopeDeclared: input.referral?.recipientScopeDeclared === true,
      thirdPartyStatus,
    },
    hybrid: { components: cleanSet(input.hybrid?.components, ['exchange', 'paid_service', 'referral']) },
  };
}

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
    languages: cleanSet(input.languages, LANGUAGES), modes: cleanSet(input.modes, MODES), modeDetails: normalizeModeDetails(input.modeDetails),
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

// Adapted from the user-provided Algorithmic Machines reference bundle.
// This stays inside Synera's existing matcher: no provider, filesystem, scheduler,
// state mutation, human-value score, or autonomous action is introduced here.
const emptyAlgorithmicResult = (status, reasonCodes = []) => ({
  schema_version: 'synera.algorithmic-match.v1', status,
  benefit_A_from_B: null, benefit_B_from_A: null, mutual_score: null, asymmetry: null,
  links: [], topics: [], first_steps: [], reason_codes: [...reasonCodes],
  not_scored: [...ALGORITHMIC_NOT_SCORED], provider_calls: 0,
});

const roundedRatio = (numerator, denominator) => {
  if (!denominator) return null;
  return Math.floor((2 * numerator * 10000 + denominator) / (2 * denominator)) / 10000;
};

function algorithmicDirection(receiver, supplier, direction, receiverLabel, supplierLabel) {
  const needs = [...receiver.needs].sort((a, b) => a.tag.localeCompare(b.tag));
  const total = needs.reduce((sum, need) => sum + need.priority * 100, 0);
  if (!total) return { score: null, links: [], ranked: [] };
  const offers = new Set(supplier.offers);
  let covered = 0;
  const links = [], ranked = [];
  for (const need of needs) {
    if (!offers.has(need.tag)) continue;
    const effective = need.priority * 100;
    const link = {
      direction,
      need_id: `${receiverLabel}-need-${need.tag}`,
      offer_id: `${supplierLabel}-offer-${need.tag}`,
      tag: need.tag,
      contribution: roundedRatio(100 * effective, total),
      evidence_ids: [`${receiverLabel}-declared-need-${need.tag}`, `${supplierLabel}-declared-offer-${need.tag}`],
    };
    covered += effective;
    links.push(link);
    ranked.push({ numerator: 100 * effective, denominator: total, link });
  }
  return { score: { numerator: 100 * covered, denominator: total }, links, ranked };
}

// Safe for direct use with the public, normalized profile shape. It intentionally
// receives no display names, contacts, journals, billing tier, free text or prompts.
export function evaluateAlgorithmicMatch(left, right, { asOf = new Date().toISOString().slice(0, 10) } = {}) {
  if (!validDay(asOf)) throw new Error('Некоректна дата порівняння');
  const parties = [normalizeProfile(left), normalizeProfile(right)].sort((a, b) => a.id.localeCompare(b.id));
  if (parties.some(p => !p.id) || parties[0].id === parties[1].id) return emptyAlgorithmicResult('rejected', ['INVALID_PAIR']);
  if (parties.some(p => !p.consent)) return emptyAlgorithmicResult('ineligible', ['CONSENT_DENIED']);
  if (parties.some(p => !p.offers.length && !p.needs.length)) return emptyAlgorithmicResult('needs_information', ['PROFILE_INCOMPLETE']);

  const [a, b] = parties;
  const fromA = algorithmicDirection(a, b, 'A_from_B', 'party-a', 'party-b');
  const fromB = algorithmicDirection(b, a, 'B_from_A', 'party-b', 'party-a');
  const result = emptyAlgorithmicResult('scored');
  if (fromA.score === null) result.reason_codes.push('NO_ACTIVE_NEEDS_A');
  else result.benefit_A_from_B = roundedRatio(fromA.score.numerator, fromA.score.denominator);
  if (fromB.score === null) result.reason_codes.push('NO_ACTIVE_NEEDS_B');
  else result.benefit_B_from_A = roundedRatio(fromB.score.numerator, fromB.score.denominator);

  if (fromA.score !== null && fromB.score !== null) {
    const aScore = fromA.score, bScore = fromB.score;
    const mutualDenominator = aScore.numerator * bScore.denominator + bScore.numerator * aScore.denominator;
    result.mutual_score = mutualDenominator ? roundedRatio(2 * aScore.numerator * bScore.numerator, mutualDenominator) : 0;
    result.asymmetry = roundedRatio(Math.abs(aScore.numerator * bScore.denominator - bScore.numerator * aScore.denominator), aScore.denominator * bScore.denominator);
  } else result.reason_codes.push('MUTUAL_AND_ASYMMETRY_UNDEFINED');

  result.links = [...fromA.links, ...fromB.links].sort((a, b) => a.direction.localeCompare(b.direction) || a.need_id.localeCompare(b.need_id) || a.offer_id.localeCompare(b.offer_id));
  const ranked = [...fromA.ranked, ...fromB.ranked].sort((a, b) => (b.numerator * a.denominator - a.numerator * b.denominator) || a.link.direction.localeCompare(b.link.direction) || a.link.need_id.localeCompare(b.link.need_id) || a.link.offer_id.localeCompare(b.link.offer_id));
  for (const { link } of ranked.slice(0, 3)) {
    const identity = `${link.direction.toLowerCase()}-${link.need_id}-${link.offer_id}`;
    const capability = CAPABILITIES[link.tag];
    result.topics.push({ topic_id: `topic-${identity}`, text: `${link.direction}: уточніть обсяг і доступність для «${capability}».`, link_need_id: link.need_id, link_offer_id: link.offer_id });
    result.first_steps.push({ step_id: `step-${identity}`, text: `${link.direction}: попросіть один релевантний приклад роботи для «${capability}».`, priority: 100 - 10 * result.first_steps.length, expected_value_usd: null });
  }
  if (result.first_steps.length) result.reason_codes.push('EXPECTED_VALUE_UNKNOWN');
  return result;
}

function reciprocalCandidate(parties, directions, mode = 'exchange') {
  if (parties.some(party => !party.offers.length || !party.needs.length)) return { mode, status: 'needs_information', reasonCodes: ['RECIPROCAL_PROFILE_FIELDS_REQUIRED'] };
  if (directions.every(direction => direction.matched.length)) return { mode, status: 'eligible', reasonCodes: ['RECIPROCAL_VALUE_DECLARED'] };
  return { mode, status: 'insufficient_mutual_value', reasonCodes: ['RECIPROCAL_VALUE_MISSING'] };
}

function paidCandidate(parties, directions) {
  const [a, b] = parties, aRole = a.modeDetails.paid_service.role, bRole = b.modeDetails.paid_service.role;
  if (!aRole || !bRole) return { mode: 'paid_service', status: 'needs_information', reasonCodes: ['PAID_ROLES_REQUIRED'] };
  if (aRole === bRole) return { mode: 'paid_service', status: 'incompatible', reasonCodes: ['PAID_ROLE_CONFLICT'] };
  const buyer = aRole === 'buyer' ? a : b, supplier = aRole === 'supplier' ? a : b;
  const direction = directions.find(item => item.receiver === buyer.id && item.giver === supplier.id);
  if (!direction?.matched.length) return { mode: 'paid_service', status: 'incompatible', reasonCodes: ['PAID_NEED_NOT_COVERED'] };
  return {
    mode: 'paid_service', status: 'eligible', reasonCodes: ['COMPENSATION_REQUIRES_TERMS'],
    giver: supplier.id, receiver: buyer.id, matchedTags: direction.matched.map(item => item.tag),
    unresolved: ['amount', 'currency', 'invoice', 'acceptance'],
  };
}

function referralCandidate(parties) {
  const [a, b] = parties, aRole = a.modeDetails.referral.role, bRole = b.modeDetails.referral.role;
  if (!aRole || !bRole) return { mode: 'referral', status: 'needs_information', reasonCodes: ['REFERRAL_ROLES_REQUIRED'] };
  if (aRole === bRole) return { mode: 'referral', status: 'incompatible', reasonCodes: ['REFERRAL_ROLE_CONFLICT'] };
  const introducer = aRole === 'introducer' ? a : b, seeker = aRole === 'seeker' ? a : b, details = introducer.modeDetails.referral;
  const missing = [];
  if (!details.sourceDeclared) missing.push('REFERRAL_SOURCE_REQUIRED');
  if (!details.recipientScopeDeclared) missing.push('REFERRAL_RECIPIENT_SCOPE_REQUIRED');
  if (!details.benefitTags.length) missing.push('REFERRAL_BENEFIT_REQUIRED');
  if (missing.length) return { mode: 'referral', status: 'needs_information', reasonCodes: missing.sort() };
  const needs = new Set(seeker.needs.map(item => item.tag));
  const matchedTags = details.benefitTags.filter(tag => needs.has(tag));
  if (!matchedTags.length) return { mode: 'referral', status: 'incompatible', reasonCodes: ['REFERRAL_BENEFIT_NOT_RELEVANT'] };
  const reasonCodes = [details.thirdPartyStatus === 'consented' ? 'THIRD_PARTY_CONSENT_SELF_DECLARED' : 'THIRD_PARTY_NOT_CONSULTED', 'REFERRAL_COMPENSATION_REQUIRES_TERMS'];
  return {
    mode: 'referral', status: 'eligible', reasonCodes,
    introducer: introducer.id, seeker: seeker.id, matchedTags,
    thirdPartyStatus: details.thirdPartyStatus,
    unresolved: [details.thirdPartyStatus === 'consented' ? 'third_party_consent_verification' : 'third_party_agreement', 'referral_compensation'],
  };
}

function hybridCandidate(parties, directions) {
  const left = parties[0].modeDetails.hybrid.components, right = parties[1].modeDetails.hybrid.components;
  if (left.length < 2 || right.length < 2) return { mode: 'hybrid', status: 'needs_information', reasonCodes: ['HYBRID_COMPONENTS_REQUIRED'] };
  if (left.join('|') !== right.join('|')) return { mode: 'hybrid', status: 'incompatible', reasonCodes: ['HYBRID_COMPONENTS_CONFLICT'] };
  const legs = left.map(component => component === 'exchange' ? reciprocalCandidate(parties, directions) : component === 'paid_service' ? paidCandidate(parties, directions) : referralCandidate(parties));
  const blocked = legs.filter(leg => leg.status !== 'eligible');
  if (blocked.length) return {
    mode: 'hybrid', status: blocked.some(leg => leg.status === 'needs_information') ? 'needs_information' : 'incompatible',
    reasonCodes: blocked.flatMap(leg => leg.reasonCodes.map(code => `${leg.mode.toUpperCase()}:${code}`)).sort(), components: left, legs,
  };
  return { mode: 'hybrid', status: 'eligible', reasonCodes: ['HYBRID_COMPONENTS_ELIGIBLE'], components: left, legs };
}

function evaluateModes(parties, directions, modes) {
  return modes.map(mode => {
    if (mode === 'exchange' || mode === 'joint_project') return reciprocalCandidate(parties, directions, mode);
    if (mode === 'paid_service') return paidCandidate(parties, directions);
    if (mode === 'referral') return referralCandidate(parties);
    return hybridCandidate(parties, directions);
  });
}

export function compareProfiles(left, right, { asOf = new Date().toISOString().slice(0, 10) } = {}) {
  if (!validDay(asOf)) throw new Error('Некоректна дата порівняння');
  const parties = [normalizeProfile(left), normalizeProfile(right)].sort((a, b) => a.id.localeCompare(b.id));
  const base = { version: 'synera-business-modes-1', legacyBaselineVersion: 'synera-baseline-1', businessModeVersion: 1, asOf, engine: 'deterministic-local', status: 'needs_information', reasons: [], score: null, directions: [], logistics: null, plan: [], modeCandidates: [], consentForIntroduction: false, binding: false, algorithmic: null };
  const stop = (status, reasons) => ({ ...base, status, reasons: [...new Set(reasons)].sort() });
  if (parties.some(p => !p.id) || parties[0].id === parties[1].id) return stop('needs_information', ['Потрібні два різні профілі.']);
  // Consent check happens before any content is emitted.
  if (parties.some(p => !p.consent)) return stop('consent_required', ['Обидві сторони мають дозволити порівняння.']);
  const missing = [];
  for (const p of parties) {
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
  const modeCandidates = evaluateModes(parties, directions, modes), eligible = modeCandidates.filter(candidate => candidate.status === 'eligible');
  const result = { ...base, score, directions, modeCandidates, algorithmic: evaluateAlgorithmicMatch(a, b, { asOf }), logistics: { languages, modes, from, until, remote, distanceKm: distanceKm === null ? null : Math.round(distanceKm) } };
  if (!eligible.length) {
    if (modeCandidates.some(candidate => candidate.status === 'needs_information')) return { ...result, status: 'needs_information', reasons: ['Для вибраного бізнес-режиму бракує явних полів.'] };
    if (modeCandidates.every(candidate => candidate.status === 'insufficient_mutual_value')) return { ...result, status: 'insufficient_mutual_value', reasons: ['В одному з напрямків не знайдено покриття заявлених потреб. Це не оцінка цінності людини.'] };
    return { ...result, status: 'incompatible', reasons: ['Заявлені ролі або компоненти бізнес-режиму несумісні.'] };
  }
  const plan = directions.filter(direction => direction.matched.length).map(direction => ({ giver: direction.giver, receiver: direction.receiver, topic: direction.matched[0].tag, action: `Показати один релевантний приклад роботи: ${CAPABILITIES[direction.matched[0].tag]}. Узгодити один вимірюваний результат, умови й прийняття.` }));
  return { ...result, status: 'review_candidate', reasons: ['Є заявлений кандидат для обговорення. Компетентність, умови, згода та результат ще не підтверджені.'], plan };
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
