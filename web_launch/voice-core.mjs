// No DOM, audio upload, AI or network. Keep source phrases verbatim.
export const SPEECH_LOCALES = Object.freeze({ uk: 'uk-UA', de: 'de-CH', en: 'en-GB' });
export const speechLanguage = code => Object.hasOwn(SPEECH_LOCALES, code) ? code : 'uk';
const markers = /(?<![\p{L}\p{N}_])(?:я\s+|ich\s+|i(?:\s+am|['’]m)?\s+)?(можу|вмію|пропоную|шукаю|потрібно|хочу|мета|ціль|kann|biete|suche|brauche|möchte|ziel|can|offer|looking for|need|want|goal)(?![\p{L}\p{N}_])/giu;
const offers = new Set(['можу','вмію','пропоную','kann','biete','can','offer']);
const goals = new Set(['мета','ціль','ziel','goal']);
export function splitCapture(value) {
  const text = String(value ?? ''), found = [...text.matchAll(markers)].filter(m => !/(?:не|not|nicht)\s*$/iu.test(text.slice(0, m.index)));
  const out = { offers: [], seeks: [], goal: [], unassigned: [] };
  if (!found.length) out.unassigned.push(text);
  else if (found[0].index) out.unassigned.push(text.slice(0, found[0].index));
  for (let i = 0; i < found.length; i++) {
    const m = found[i], key = m[1].toLocaleLowerCase();
    out[offers.has(key) ? 'offers' : goals.has(key) ? 'goal' : 'seeks'].push(text.slice(m.index, found[i + 1]?.index ?? text.length));
  }
  return Object.fromEntries(Object.entries(out).map(([k, parts]) => [k, parts.map(p => p.trim()).filter(Boolean).join('\n')]));
}

// An utterance edits only the chosen range; final result IDs are deduplicated by the UI.
export function insertPhrase(value, phrase, start = value.length, end = start, maxLength = -1) {
  const words = String(phrase).trim();
  if (!words) return { value, start, end, changed: false };
  const left = value.slice(0, start), right = value.slice(end);
  const added = (left && !/\s$/.test(left) && !/^[,.;:!?]/.test(words) ? ' ' : '') + words + (right && !/^\s|^[,.;:!?]/.test(right) ? ' ' : '');
  const result = left + added + right;
  if (maxLength >= 0 && result.length > maxLength) return { value, start, end, changed: false, full: true };
  return { value: result, start: start + added.length, end: start + added.length, changed: true };
}
