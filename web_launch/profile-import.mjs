// SYN_IMPORT: local, deterministic, in-memory only. Zero model calls, zero persistence, zero network.
// Untrusted rule: export text is DATA, never instructions. Only whitelisted fields are read.
import { CAPABILITIES, CITIES, COLLABORATION_MODES, normalizeModeDetails } from './matching.mjs';
import { LANGUAGES } from './profile-brief.mjs';

const MAX_EXPORT_CHARS = 20000;
const MAX_HINT_LENGTH = 300;
const MAX_HINTS_PER_LIST = 20;
const INSTRUCTION_KEYS = new Set(['instructions', 'instruction', 'system', 'prompt', 'assistant']);
const INSTRUCTION_PATTERN = /ignore (?:all |any )?(?:previous|prior)|disregard (?:all |any )?(?:previous|prior)|system prompt|ignore the above/i;

const CHATGPT_ALIASES = Object.freeze({
  spheres: ['profession', 'occupation', 'sphere', 'field', 'skills', 'offers', 'experience', 'city', 'format', 'formats', 'collaboration'],
  languages: ['languages', 'language', 'langs', 'spoken_languages'],
  needs: ['looking_for', 'lookingFor', 'needs', 'seeking', 'searching', 'wants', 'gaps'],
  prose: ['summary', 'about', 'notes', 'bio'],
});
const CLAUDE_ALIASES = Object.freeze({
  spheres: ['expertise', 'summary_of_expertise', 'strengths', 'competencies', 'skills', 'profession', 'city', 'location', 'formats', 'collaboration'],
  languages: ['working_languages', 'languages', 'spoken_languages'],
  needs: ['current_needs', 'needs', 'looking_for', 'goals'],
  prose: ['profile_summary', 'summary', 'about', 'context', 'notes'],
});

const fold = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const cleanValue = value => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, MAX_HINT_LENGTH) : '';
const hint = (value, confidence) => ({ value, confidence });

function parseExport(jsonText, aliases) {
  const empty = () => ({ sphereHints: [], languageHints: [], needHints: [], warnings: [] });
  if (typeof jsonText !== 'string' || !jsonText.trim()) return { ...empty(), warnings: ['Порожній або некоректний експорт: очікували JSON.'] };
  let text = jsonText;
  if (text.length > MAX_EXPORT_CHARS) { text = text.slice(0, MAX_EXPORT_CHARS); }
  let parsed;
  try { parsed = JSON.parse(text); } catch { return { ...empty(), warnings: ['Не вдалося прочитати JSON. Встав відповідь як JSON без пояснень.'] }; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...empty(), warnings: ['Експорт має бути JSON-об\'єктом, а не списком або текстом.'] };
  const warnings = [];
  const rawKeys = Object.keys(parsed).map(key => key.toLowerCase());
  if (rawKeys.some(key => INSTRUCTION_KEYS.has(key)) || INSTRUCTION_PATTERN.test(text)) {
    warnings.push('Інструкції всередині експорту проігноровано: експорт — це дані, не команди.');
  }
  const buckets = { spheres: [], languages: [], needs: [] };
  const aliasIndex = new Map();
  for (const [bucket, keys] of Object.entries(aliases)) for (const key of keys) aliasIndex.set(key, bucket);
  let usedProse = false;
  for (const [rawKey, rawValue] of Object.entries(parsed)) {
    const key = rawKey.toLowerCase();
    const bucket = aliasIndex.get(key);
    if (!bucket) continue;
    if (bucket === 'prose') { usedProse = true; continue; }
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const entry of values) {
      const value = cleanValue(entry);
      if (value) buckets[bucket].push(hint(value, 'high'));
      else if (entry !== undefined && entry !== null && typeof entry !== 'string') warnings.push(`Поле «${key}» пропущено: очікували текст або список текстів.`);
    }
    if (buckets[bucket].length > MAX_HINTS_PER_LIST) { buckets[bucket] = buckets[bucket].slice(0, MAX_HINTS_PER_LIST); warnings.push(`Поле «${key}» обрізано до ${MAX_HINTS_PER_LIST} пунктів.`); }
  }
  if (!buckets.spheres.length && usedProse) {
    for (const [rawKey, rawValue] of Object.entries(parsed)) {
      if (!aliases.prose.includes(rawKey.toLowerCase())) continue;
      const value = cleanValue(rawValue);
      if (value) buckets.spheres.push(hint(value, 'low'));
    }
    if (buckets.spheres.length) warnings.push('Тільки вільний опис без явних пунктів: розпізнано слабко, потрібне уточнення навичок.');
  }
  const dedupe = hints => {
    const seen = new Set();
    return hints.filter(item => {
      const key = fold(item.value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  return { sphereHints: dedupe(buckets.spheres), languageHints: dedupe(buckets.languages), needHints: dedupe(buckets.needs), warnings };
}

// SYN_IMPORT_CHATGPT_PARSED
export function parseChatGptExport(jsonText) {
  return parseExport(jsonText, CHATGPT_ALIASES);
}

// SYN_IMPORT_CLAUDE_PARSED
export function parseClaudeExport(jsonText) {
  return parseExport(jsonText, CLAUDE_ALIASES);
}

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_PATTERN = /\+\d[\d\s().-]{7,}\d/g;
const IBAN_PATTERN = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}\s?[A-Z0-9]{1,3}\b/g;
const API_KEY_PATTERN = /\b(?:sk-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{12,}|gh[pousr]_[A-Za-z0-9]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{30,})\b/g;
const PRIVATE_KEY_PATTERN = /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g;
const THIRD_PARTY_NAMES = Object.freeze(['Nestlé', 'Nestle', 'Roche', 'Novartis', 'UBS', 'Credit Suisse', 'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'OpenAI', 'Anthropic', 'ChatGPT', 'Claude', 'LinkedIn']);
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const THIRD_PARTY_PATTERN = new RegExp(`(?<![\\p{L}\\p{N}])(?:${THIRD_PARTY_NAMES.map(escapeRegExp).join('|')})(?![\\p{L}\\p{N}])`, 'gu');

function redactText(value) {
  let removed = 0;
  const blocked = [];
  let text = value.replace(EMAIL_PATTERN, () => { removed++; return ' '; });
  text = text.replace(PHONE_PATTERN, () => { removed++; return ' '; });
  text = text.replace(THIRD_PARTY_PATTERN, () => { removed++; return ' '; });
  text = text.replace(IBAN_PATTERN, () => { blocked.push('iban'); return ' '; });
  text = text.replace(API_KEY_PATTERN, () => { blocked.push('api_key'); return ' '; });
  text = text.replace(PRIVATE_KEY_PATTERN, () => { blocked.push('private_key'); return ' '; });
  return { text: text.replace(/\s+/g, ' ').trim(), removed, blocked };
}

// SYN_IMPORT_REDACTED
export function redactHints(input = {}) {
  const lists = ['sphereHints', 'languageHints', 'needHints'];
  const hints = {};
  let removedCount = 0;
  const blockedSecrets = new Set();
  for (const listName of lists) {
    const source = Array.isArray(input?.[listName]) ? input[listName] : [];
    const kept = [];
    for (const item of source) {
      const value = typeof item?.value === 'string' ? item.value : '';
      if (!value) continue;
      const result = redactText(value);
      removedCount += result.removed;
      for (const secret of result.blocked) blockedSecrets.add(secret);
      if (!result.text) continue;
      kept.push({ value: result.text, confidence: item.confidence === 'low' ? 'low' : 'high' });
    }
    hints[listName] = kept;
  }
  return { hints, removedCount, blockedSecrets: [...blockedSecrets].sort() };
}

const CAPABILITY_RULES = Object.freeze({
  automation: ['автоматизац', 'automation', 'nocode', 'no-code', 'automatisierung', 'скрипт'],
  design: ['дизайн', 'design', 'figma', 'grafik'],
  research: ['інтерв', 'interview', 'research', 'дослідж', 'umfrage', 'befragung'],
  sales: ['продаж', 'b2b', 'sales', 'vertrieb', 'verkauf'],
  video: ['відео', 'video', 'ролик', 'montage', 'film'],
  finance: ['бюджет', 'budget', 'фінанс', 'finance', 'finanzen', 'buchhaltung'],
  events: ['подій', 'події', 'захід', 'заход', 'event', 'veranstaltung'],
});
const LANGUAGE_RULES = Object.freeze({
  uk: ['ukrainian', 'украин', 'україн'],
  en: ['english', 'англ', 'englisch'],
  de: ['german', 'deutsch', 'німец'],
  fr: ['french', 'francais', 'franzosisch', 'француз'],
});
const MODE_RULES = Object.freeze({
  exchange: ['обмін', 'exchange', 'tausch', 'бартер'],
  joint_project: ['спільн', 'joint', 'проєкт', 'projekt', 'project'],
  paid_service: ['платн', 'paid', 'оплата', 'bezahlung', 'bezahlt'],
  referral: ['рекоменд', 'referral', 'empfehlung', 'introduc'],
  hybrid: ['hybrid', 'змішан', 'gemischt', 'комбінов'],
});
const ROLE_RULES = Object.freeze({
  'paid_service.role': { buyer: ['покупець', 'покупц', 'buyer', 'замовник'], supplier: ['постачальник', 'постачал', 'supplier', 'anbieter'] },
  'referral.role': { introducer: ['інтродюсер', 'introducer', 'рекомендую', 'empfehle', 'vermittele'], seeker: ['seeker', 'шукаю рекомендац', 'шукача рекомендац', 'suche empfehlung'] },
});
const COMPONENT_RULES = Object.freeze({ exchange: MODE_RULES.exchange, paid_service: MODE_RULES.paid_service, referral: MODE_RULES.referral });
const CITY_TOKENS = Object.freeze(Object.keys(CITIES).map(code => [code, fold(code), fold(CITIES[code].label)]));
const canonical = (order, set) => order.filter(item => set.has(item));
const firstMatch = (text, rules) => Object.keys(rules).find(key => rules[key].some(stem => text.includes(stem)));

function scanHint(item, kind, state) {
  const text = fold(item.value);
  if (item.confidence !== 'high') {
    state.needsInformation = true;
    state.warnings.push('Опис розпізнано слабко, тому його не перенесено автоматично: підтверди навички та умови вручну.');
    return;
  }
  let found = false;
  const city = CITY_TOKENS.find(([, ...tokens]) => tokens.some(token => text.includes(token)));
  if (city) { state.city = state.city || city[0]; found = true; }
  const capability = firstMatch(text, CAPABILITY_RULES);
  if (capability) {
    state[kind].add(capability);
    for (const extra of Object.keys(CAPABILITY_RULES)) if (extra !== capability && CAPABILITY_RULES[extra].some(stem => text.includes(stem))) state[kind].add(extra);
    found = true;
  }
  const mode = firstMatch(text, MODE_RULES);
  if (mode) { state.modes.add(mode); found = true; }
  for (const [path, rules] of Object.entries(ROLE_RULES)) {
    const role = firstMatch(text, rules);
    if (role) { state.roles[path] = state.roles[path] || role; found = true; }
  }
  if (state.modes.has('hybrid')) for (const component of Object.keys(COMPONENT_RULES)) if (COMPONENT_RULES[component].some(stem => text.includes(stem))) state.components.add(component);
  if (!found) {
    state.needsInformation = true;
    state.warnings.push(`«${item.value.slice(0, 60)}» не розпізнано в навичках пілота: додай вручну.`);
  }
}

function scanLanguage(item, state) {
  if (item.confidence !== 'high') { state.needsInformation = true; state.warnings.push('Мову розпізнано слабко: підтверди мови вручну.'); return; }
  const text = fold(item.value);
  const code = text.split(/[-_\s]/)[0];
  if (Object.hasOwn(LANGUAGE_RULES, code) && code.length <= 3) { state.languages.add(code); return; }
  const language = firstMatch(text, LANGUAGE_RULES);
  if (language) { state.languages.add(language); return; }
  state.needsInformation = true;
  state.warnings.push(`Мову «${item.value.slice(0, 40)}» не додано: її немає в пілоті (uk, en, de, fr).`);
}

// SYN_IMPORT_MAPPED
export function mapHintsToProfileDraft(input = {}) {
  const state = {
    offers: new Set(), needs: new Set(), languages: new Set(), modes: new Set(), components: new Set(),
    city: '', roles: {}, needsInformation: false,
    warnings: Array.isArray(input?.warnings) ? [...input.warnings] : [],
  };
  for (const item of Array.isArray(input?.sphereHints) ? input.sphereHints : []) scanHint(item, 'offers', state);
  for (const item of Array.isArray(input?.needHints) ? input.needHints : []) scanHint(item, 'needs', state);
  for (const item of Array.isArray(input?.languageHints) ? input.languageHints : []) scanLanguage(item, state);
  const offer_tags = canonical(Object.keys(CAPABILITIES), state.offers);
  const need_tags = canonical(Object.keys(CAPABILITIES), state.needs);
  const languages = canonical(Object.keys(LANGUAGES), state.languages);
  const modes = COLLABORATION_MODES.filter(mode => state.modes.has(mode));
  if (!offer_tags.length && !need_tags.length) state.needsInformation = true;
  if (!languages.length) state.needsInformation = true;
  if (!modes.length) state.needsInformation = true;
  const mode_details = normalizeModeDetails({
    paid_service: { role: state.roles['paid_service.role'] ?? '' },
    referral: {
      role: state.roles['referral.role'] ?? '',
      benefitTags: [],
      sourceDeclared: false,
      recipientScopeDeclared: false,
    },
    hybrid: { components: state.modes.has('hybrid') ? canonical(['exchange', 'paid_service', 'referral'], state.components) : [] },
  });
  return {
    offer_tags, need_tags, languages, city_code: state.city, modes, mode_details,
    needsInformation: state.needsInformation,
    warnings: [...new Set(state.warnings)],
  };
}
