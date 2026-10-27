// web_launch/i18n-ch.mjs — Swiss locale helper (de-CH, fr-CH, it-CH): CHF, dates, times,
// calendar slots in Europe/Zurich and Accept-Language negotiation.
// Pure functions, no DOM, no state. Formatting follows CLDR for the three Swiss locales:
//   de-CH / it-CH  CHF 1’250.50   (U+2019 grouping, point decimal, NBSP after the code)
//   fr-CH          1 250.50 CHF   (U+202F grouping, point decimal, NBSP before the code)
// Numeric dates are dd.mm.yyyy and times are 24-hour in all three; those parts are built by
// hand so that output is identical across browser ICU versions. Month and weekday names come
// from Intl and may differ slightly between engines; callers that need byte-stable text
// (ICS, CSV) use the numeric variants.
import { getCantonInfo } from './swiss-compliance.mjs';

export const CH_LOCALES = Object.freeze(['de-CH', 'fr-CH', 'it-CH']);
export const DEFAULT_CH_LOCALE = 'de-CH';
export const ZURICH_TZ = 'Europe/Zurich';
const NBSP = ' ', APOSTROPHE = '’', NARROW_NBSP = ' ', EN_DASH = '–';
const LANGUAGE_ALIASES = Object.freeze({ gsw: 'de' }); // Swiss German reads German-script UI.

function assertLocale(locale) {
  if (!CH_LOCALES.includes(locale)) throw new TypeError(`unsupported Swiss locale: ${locale}`);
  return locale;
}

/** CHF from integer minor units (Rappen / centimes). Throws on anything that is not a safe non-negative integer. */
export function formatCHF(amountMinor, locale = DEFAULT_CH_LOCALE) {
  assertLocale(locale);
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) throw new TypeError('amountMinor must be a non-negative safe integer');
  const francs = String(Math.floor(amountMinor / 100));
  const rappen = String(amountMinor % 100).padStart(2, '0');
  const minGroupingDigits = locale === 'it-CH' ? 2 : 1; // CLDR: Italian groups only from 5 integer digits.
  const separator = locale === 'fr-CH' ? NARROW_NBSP : APOSTROPHE;
  const grouped = francs.length >= 4 + (minGroupingDigits - 1) ? francs.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : francs;
  const number = `${grouped}.${rappen}`;
  return locale === 'fr-CH' ? `${number}${NBSP}CHF` : `CHF${NBSP}${number}`;
}

/** ASCII-only CHF for ICS, CSV and logs: "CHF 1250.50". */
export function formatCHFPlain(amountMinor) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) throw new TypeError('amountMinor must be a non-negative safe integer');
  return `CHF ${Math.floor(amountMinor / 100)}.${String(amountMinor % 100).padStart(2, '0')}`;
}

function toDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.valueOf())) throw new TypeError(`invalid date: ${String(value)}`);
  return date;
}

/** Wall-clock parts of an instant in a time zone, numeric and engine-independent. */
export function zoneParts(value, timeZone = ZURICH_TZ) {
  const date = toDate(value);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date);
  const get = type => Number(parts.find(p => p.type === type).value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24, minute: get('minute'), second: get('second') };
}

/** UTC offset of a time zone at an instant, in minutes (Zurich: +60 in winter, +120 in summer). */
export function zoneOffsetMinutes(value, timeZone = ZURICH_TZ) {
  const date = toDate(value);
  const p = zoneParts(date, timeZone);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** Numeric Swiss date dd.mm.yyyy (same in all three languages) or a long date with the locale's month name. */
export function formatDate(value, locale = DEFAULT_CH_LOCALE, { timeZone = ZURICH_TZ, style = 'numeric' } = {}) {
  assertLocale(locale);
  const date = toDate(value);
  if (style === 'long') return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'long' }).format(date);
  if (style !== 'numeric') throw new TypeError(`unknown date style: ${style}`);
  const p = zoneParts(date, timeZone);
  return `${String(p.day).padStart(2, '0')}.${String(p.month).padStart(2, '0')}.${p.year}`;
}

/** 24-hour HH:mm in the zone; Swiss locales never use am/pm. */
export function formatTime(value, locale = DEFAULT_CH_LOCALE, { timeZone = ZURICH_TZ } = {}) {
  assertLocale(locale);
  const p = zoneParts(toDate(value), timeZone);
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}

export function formatDateTime(value, locale = DEFAULT_CH_LOCALE, options = {}) {
  return `${formatDate(value, locale, options)}, ${formatTime(value, locale, options)}`;
}

/**
 * Calendar slot in the zone: "05.11.2026, 14:05–14:35". A slot that crosses midnight repeats the date:
 * "05.11.2026, 23:30 – 06.11.2026, 00:00". Accepts {start, end} or {start, durationMinutes}.
 */
export function formatSlot({ start, end, durationMinutes } = {}, locale = DEFAULT_CH_LOCALE, { timeZone = ZURICH_TZ } = {}) {
  assertLocale(locale);
  const from = toDate(start);
  const to = end !== undefined ? toDate(end) : Number.isFinite(durationMinutes) && durationMinutes > 0 ? new Date(from.getTime() + durationMinutes * 60000) : null;
  if (!to) throw new TypeError('slot needs end or a positive durationMinutes');
  if (to <= from) throw new TypeError('slot end must be after start');
  const sameDay = formatDate(from, locale, { timeZone }) === formatDate(to, locale, { timeZone });
  return sameDay
    ? `${formatDateTime(from, locale, { timeZone })}${EN_DASH}${formatTime(to, locale, { timeZone })}`
    : `${formatDateTime(from, locale, { timeZone })} ${EN_DASH} ${formatDateTime(to, locale, { timeZone })}`;
}

/** Parses an Accept-Language header or a navigator.languages array into ordered tags (q=0 dropped). */
export function parseAcceptLanguage(input) {
  const raw = Array.isArray(input) ? input.map(tag => ({ tag: String(tag), q: 1 })) : String(input ?? '').split(',').map(part => {
    const [tag, ...params] = part.trim().split(';').map(s => s.trim());
    const qParam = params.find(p => /^q=/i.test(p));
    const q = qParam ? Number(qParam.slice(2)) : 1;
    return { tag, q: Number.isFinite(q) ? Math.min(Math.max(q, 0), 1) : 0 };
  });
  return raw
    .map((entry, index) => ({ ...entry, index, tag: entry.tag.toLowerCase() }))
    .filter(entry => entry.q > 0 && /^(\*|[a-z]{2,3}(-[a-z0-9]{2,8})*)$/.test(entry.tag))
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map(entry => entry.tag);
}

/**
 * Picks a supported locale: exact tag first, then same language (fr-FR → fr-CH, gsw → de-CH),
 * else the fallback. Returns { locale, matched: 'exact' | 'language' | 'fallback', requested }.
 */
export function negotiateLocale(input, { supported = CH_LOCALES, fallback = DEFAULT_CH_LOCALE } = {}) {
  if (!supported.includes(fallback)) throw new TypeError('fallback must be one of the supported locales');
  const requested = parseAcceptLanguage(input);
  const byLower = new Map(supported.map(locale => [locale.toLowerCase(), locale]));
  for (const tag of requested) {
    if (tag === '*') break;
    if (byLower.has(tag)) return { locale: byLower.get(tag), matched: 'exact', requested };
  }
  for (const tag of requested) {
    if (tag === '*') break;
    const language = LANGUAGE_ALIASES[tag.split('-')[0]] ?? tag.split('-')[0];
    const hit = supported.find(locale => locale.toLowerCase().split('-')[0] === language);
    if (hit) return { locale: hit, matched: 'language', requested };
  }
  return { locale: fallback, matched: 'fallback', requested };
}

/** Swiss locale for a canton code via its primary language (TI → it-CH, GE → fr-CH, ZH → de-CH); null for unknown. */
export function localeForCanton(code) {
  const info = getCantonInfo(code);
  if (!info) return null;
  const locale = `${info.primaryLang}-CH`;
  return CH_LOCALES.includes(locale) ? locale : DEFAULT_CH_LOCALE;
}
