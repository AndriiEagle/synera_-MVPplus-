import { CAPABILITIES } from './matching.mjs';

export const PORTABLE_PROFILE_FORMAT = 'synera-profile-1';

const LIMITS = Object.freeze({ display_name: 60, city: 80, offers: 300, seeks: 300 });
const EMPTY_PROFILE = Object.freeze({ display_name: '', city: '', offers: '', seeks: '', is_discoverable: false });
const FIELD_NAMES = Object.freeze({ display_name: 'ім’я', city: 'місто', offers: 'можу допомогти', seeks: 'шукаю' });
const SENSITIVE = Object.freeze({
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu,
  phone: /(?<![A-Za-z0-9_-])(?:\+?\d[\s().-]*){9,}(?![A-Za-z0-9_-])/u,
  secret: /\b(?:sb_secret_|sk-[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{20,}|ya29\.)/u,
});
const TOPIC_PATTERNS = Object.freeze({
  automation: /\b(?:ai|workflow|zapier|make|bot|bots|automation|automate|no-code|автоматизац|автоматиз|бот|боти|процес|процеси|штучн|шi|ші)\b/iu,
  design: /\b(?:design|designer|ux|ui|figma|brand|branding|product)\b|дизайн|бренд|продукт|інтерфейс|интерфейс/iu,
  research: /\b(?:research|interview|interviews|validation|customer|customers|market|survey)\b|дослідж|интерв|інтерв|валідац|ринок|клієнт|клиент/iu,
  sales: /\b(?:sales|sell|selling|b2b|crm|lead|leads|outreach|deal|deals)\b|продаж|прода|лід|ліди|угод|аутріч/iu,
  video: /\b(?:video|shorts|reels|youtube|tiktok|presentation|editing)\b|відео|видео|шорт|рилс|монтаж|презентац|фото|photography/iu,
  finance: /\b(?:finance|financial|budget|pricing|price|subscription|revenue|cashflow)\b|фінанс|финанс|бюджет|ціна|цена|підписк|виручк|дохід/iu,
  events: /\b(?:event|events|workshop|community|meetup|meeting)\b|зустріч|зустрiч|івент|ивент|воркшоп|спільнот|комьюн|ком'юн|комʼюн|поді/iu,
});

function compact(value, max, { multiline = false } = {}) {
  const text = String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/\r/g, '\n')
    .replace(multiline ? /[ \t]+/g : /\s+/g, ' ')
    .replace(multiline ? /\n{3,}/g : /$^/, '\n\n')
    .trim();
  return text.length > max ? text.slice(0, max).trim() : text;
}

export function cleanProfileFields(profile = {}) {
  return {
    display_name: compact(profile.display_name, LIMITS.display_name),
    city: compact(profile.city, LIMITS.city),
    offers: compact(profile.offers, LIMITS.offers, { multiline: true }),
    seeks: compact(profile.seeks, LIMITS.seeks, { multiline: true }),
    is_discoverable: profile.is_discoverable === true,
  };
}

function blankProfile() {
  return { ...EMPTY_PROFILE };
}

export function sensitiveFindings(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? {});
  return Object.entries(SENSITIVE).filter(([, pattern]) => pattern.test(text)).map(([name]) => name).sort();
}

export function profileSafetyFindings(profile = {}) {
  const cleaned = cleanProfileFields(profile);
  return [...new Set(Object.entries(cleaned)
    .filter(([key]) => key in FIELD_NAMES)
    .flatMap(([key, value]) => sensitiveFindings(value).map(type => `${FIELD_NAMES[key]}:${type}`)))].sort();
}

function keyForLabel(value) {
  const label = value.toLowerCase().replace(/[.。…]/g, '').trim();
  if (/^(ім['’]?я|name|full name|display name|profile name|профіль|profilname)$/iu.test(label)) return 'display_name';
  if (/^(місто|city|location|локація|ort|standort)$/iu.test(label)) return 'city';
  if (/^(можу допомогти( з)?|пропоную|i can help( with)?|i offer|offers?|skills?|expertise|ich biete|ich kann helfen)$/iu.test(label)) return 'offers';
  if (/^(шукаю|потрібно|потреба|looking for|i need|needs?|seeks?|request|ich suche|suche)$/iu.test(label)) return 'seeks';
  return '';
}

function parseLabeledText(input) {
  const buckets = { display_name: [], city: [], offers: [], seeks: [] };
  let active = '';
  for (const raw of input.split(/\n/)) {
    const line = raw.trim();
    if (!line) { active = ''; continue; }
    const paired = line.match(/^(.{1,42}?)(?:\s*[:\-–]\s*)(.*)$/u);
    const direct = paired ? keyForLabel(paired[1]) : '';
    const labelOnly = direct || keyForLabel(line);
    if (labelOnly) {
      active = labelOnly;
      if (paired?.[2]) buckets[active].push(paired[2]);
      continue;
    }
    if (active) buckets[active].push(line);
  }
  return cleanProfileFields(Object.fromEntries(Object.entries(buckets).map(([key, lines]) => [key, lines.join('\n')])));
}

function parseJsonProfile(input) {
  let parsed;
  try { parsed = JSON.parse(input); }
  catch { return null; }
  if (![parsed?.format, parsed?.version].includes(PORTABLE_PROFILE_FORMAT)) return null;
  return { ...cleanProfileFields(parsed.profile ?? parsed), is_discoverable: false };
}

// One user-selected Profile.csv from the member's official LinkedIn export.
// No Connections.csv, ZIP archive, URL fetching, or arbitrary account dump.
export function parseProfileCsv(input, { authorized = false } = {}) {
  if (!authorized) return parseProfileImport('', { authorized });
  const text = String(input ?? '').replace(/^\uFEFF/, '');
  if (text.length > 50000) throw new Error('Файл завеликий. Вибери лише Profile.csv свого профілю.');
  if (sensitiveFindings(text).includes('secret')) return { status: 'blocked_sensitive', profile: blankProfile(), warnings: ['У файлі виявлено можливий ключ. Імпорт зупинено.'] };
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 0; i <= text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && (c === ',' || c === '\n' || c === undefined)) {
      row.push(value.replace(/\r$/, '')); value = '';
      if (c !== ',') { if (row.some(Boolean)) rows.push(row); row = []; }
    } else if (c !== undefined) value += c;
  }
  if (quoted || rows.length !== 2 || rows[0].length !== rows[1].length) throw new Error('Потрібен CSV з одним власним профілем: заголовок і один запис.');
  const fields = Object.fromEntries(rows[0].map((key, i) => [key.trim().toLowerCase(), rows[1][i]]));
  if (!('first name' in fields) || !('last name' in fields) || !('headline' in fields || 'summary' in fields)) throw new Error('Це не Profile.csv. Файл контактів не імпортується.');
  const profile = cleanProfileFields({ display_name: `${fields['first name']} ${fields['last name']}`, city: fields['geo location'] || fields['location'] || '', offers: fields['headline'] || fields['summary'] || '', seeks: '' });
  if (profileSafetyFindings(profile).length) return { status: 'blocked_sensitive', profile: blankProfile(), warnings: ['У публічних полях є приватні контакти. Відредагуй файл перед імпортом.'] };
  return { status: 'needs_review', profile, warnings: ['Взято лише ім’я, місто й заголовок. Приватні колонки пропущено. Уточни свою пропозицію та заповни «Шукаю».'] };
}

function firstLineCandidate(input) {
  return input.split(/\n/).map(line => line.trim()).find(line => line.length >= 2 && line.length <= LIMITS.display_name && !/[@:/\\]/u.test(line)) || '';
}

export function parseProfileImport(input, { authorized = false } = {}) {
  if (!authorized) return { status: 'consent_required', profile: blankProfile(), warnings: ['Потрібне підтвердження, що це власний профіль або є дозвіл.'] };
  if (String(input ?? '').length > 5000) return { status: 'needs_review', profile: blankProfile(), warnings: ['Текст завеликий. Перенеси тільки короткий профіль, до 5000 символів.'] };
  const text = compact(String(input ?? '').replace(/^\s*```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i, '$1'), 5000, { multiline: true });
  if (!text) return { status: 'needs_review', profile: blankProfile(), warnings: ['Встав текст профілю або Synera JSON.'] };
  const sensitive = sensitiveFindings(text);
  if (sensitive.length) return { status: 'blocked_sensitive', profile: blankProfile(), warnings: ['Знайдено email, телефон або ключ. Прибери приватні контакти/секрети перед імпортом.'] };
  const json = parseJsonProfile(text);
  if (/^[\[{]/.test(text) && !json) return { status: 'needs_review', profile: blankProfile(), warnings: ['Потрібен JSON формату synera-profile-1, а не повний архів акаунта.'] };
  const profile = json ?? parseLabeledText(text);
  const warnings = [];
  if (!json && !Object.values(profile).some(Boolean)) {
    profile.display_name = firstLineCandidate(text);
    warnings.push('Формат неочевидний. Заповнено лише те, що можна безпечно впізнати; перевір прев’ю вручну.');
  }
  const missing = profileCompletion(profile).missing;
  if (missing.length) warnings.push(`Не вистачає: ${missing.join(', ')}.`);
  profile.is_discoverable = false;
  return { status: profile.display_name && (profile.offers || profile.seeks) ? 'ready' : 'needs_review', profile, warnings };
}

export function createPortableProfile(profile, { exportedAt = new Date().toISOString() } = {}) {
  const cleaned = cleanProfileFields(profile);
  if (!cleaned.display_name) throw new Error('Ім\'я профілю є обов\'язковим');
  const sensitive = profileSafetyFindings(cleaned);
  if (sensitive.length) throw new Error('Прибери контакти, ключі та приватні дані перед поширенням');
  return {
    format: PORTABLE_PROFILE_FORMAT,
    exported_at: exportedAt,
    profile: { display_name: cleaned.display_name, city: cleaned.city, offers: cleaned.offers, seeks: cleaned.seeks, is_discoverable: false },
  };
}

export function createPortableProfileJson(profile, options) {
  return JSON.stringify(createPortableProfile(profile, options), null, 2);
}

function publicOrigin(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.|\[::1\])/u.test(url.hostname)) return '';
    return url.origin;
  } catch { return ''; }
}

export function createShareCard(profile, { publicUrl = '' } = {}) {
  const exported = createPortableProfile(profile).profile;
  const link = publicOrigin(publicUrl);
  const lines = [
    `Synera profile: ${exported.display_name}`,
    exported.city ? `City: ${exported.city}` : '',
    exported.offers ? `I can help with: ${exported.offers}` : '',
    exported.seeks ? `Looking for: ${exported.seeks}` : '',
    'If this looks mutually useful, suggest a short conversation.',
    link ? `Open Synera: ${link}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

export function profileCompletion(profile = {}) {
  const cleaned = cleanProfileFields(profile);
  const checks = [
    ['display_name', 'ім’я'],
    ['city', 'місто'],
    ['offers', 'що можеш дати'],
    ['seeks', 'що шукаєш'],
  ];
  const missing = checks.filter(([key]) => !cleaned[key]).map(([, label]) => label);
  return { completed: checks.length - missing.length, total: checks.length, missing };
}

function topicTags(value) {
  const text = String(value ?? '');
  return Object.entries(TOPIC_PATTERNS).filter(([, pattern]) => pattern.test(text)).map(([tag]) => tag).sort();
}

function intersect(a, b) {
  const second = new Set(b);
  return a.filter(value => second.has(value)).sort();
}

function topicLabels(tags) {
  return tags.map(tag => CAPABILITIES[tag] ?? tag);
}

export function profileMatchHint(left = {}, right = {}) {
  const leftNeeds = topicTags(left.seeks), leftOffers = topicTags(left.offers);
  const rightNeeds = topicTags(right.seeks), rightOffers = topicTags(right.offers);
  const helpsLeft = intersect(leftNeeds, rightOffers), helpsRight = intersect(rightNeeds, leftOffers);
  const all = [...new Set([...helpsLeft, ...helpsRight])].sort();
  if (helpsLeft.length && helpsRight.length) {
    return { status: 'reciprocal', tags: all, label: topicLabels(all).join(', '), summary: `Є двостороння тема: ${topicLabels(all).join(', ')}.` };
  }
  if (helpsLeft.length || helpsRight.length) {
    return { status: 'one_way', tags: all, label: topicLabels(all).join(', '), summary: `Є корисний напрям: ${topicLabels(all).join(', ')}. Другий напрям треба уточнити.` };
  }
  return { status: 'no_signal', tags: [], label: '', summary: 'Потрібно більше конкретики в профілях.' };
}

export function createInvitationDraft(left, right) {
  const hint = profileMatchHint(left, right);
  return hint.status === 'no_signal'
    ? 'Привіт! Пропоную коротко познайомитись і перевірити, чи можемо бути корисні одне одному.'
    : `Привіт! ${hint.summary} Пропоную 20 хвилин поговорити й знайти один маленький наступний крок.`;
}
