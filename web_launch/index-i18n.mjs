// German and English for the sign-in and profile page, laid over the page as it is. The page's own code is
// untouched and keeps writing Ukrainian; this module shows the same text in the chosen language and puts the
// Ukrainian back when asked. It never reads or changes field values, stored data or anything sent to the server.
// Loaded only after a person picks German or English, so a Ukrainian visit never runs it.
import { getLanguage, tr, hasSource } from './real-journey-i18n.mjs';
import { ROWS, PATTERNS } from './index-i18n-table.mjs';

const CYRILLIC = /[Ѐ-ӿ]/, norm = text => text.replace(/\s+/g, ' ').trim();
export const MAX_ASSEMBLED = 1200;
const maps = { de: new Map(), en: new Map() };
for (const [uk, de, en] of ROWS) { maps.de.set(uk, de); maps.en.set(uk, en); }
const patterns = PATTERNS.map(([source, de, en, groups, separator]) => ({ test: new RegExp(source, 'u'), de, en, groups, separator }));
// The page always writes dates the Ukrainian way («11 жовт. 2026 р., 23:26»); they are shown the way the
// chosen language writes them. Because the source never changes, switching back restores it exactly.
const MONTHS = ['січ', 'лют', 'бер', 'квіт', 'трав', 'черв', 'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'];
const ENGLISH_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const UKRAINIAN_DATE = new RegExp(`(\\d{1,2}) (${MONTHS.join('|')})[а-яіїє]*\\.? (\\d{4})(?: р\\.)?(,? \\d{1,2}:\\d{2})?`, 'gu');
const dates = (text, language) => text.replace(UKRAINIAN_DATE, (whole, day, month, year, time = '') => {
  const number = MONTHS.indexOf(month) + 1;
  return language === 'de' ? `${day.padStart(2, '0')}.${String(number).padStart(2, '0')}.${year}${time}` : `${Number(day)} ${ENGLISH_MONTHS[number - 1]} ${year}${time}`;
});
// One of this page's own labels, or one shared with the two-person page.
const label = key => maps[getLanguage()]?.get(key) ?? (hasSource(key) ? tr(key) : undefined);

// A whole text first, then a text assembled from parts. Null means «leave it as written»: names, messages
// and anything else a person typed never match and are never touched.
export function translate(text) {
  const language = getLanguage(), key = norm(text);
  if (language === 'uk' || !key || !CYRILLIC.test(key)) return null;
  const shown = dates(wording(key, language), language);
  return shown === key ? null : shown;
}
function wording(key, language) {
  const whole = label(key); if (whole !== undefined) return whole;
  // Assembled labels are short. A long text is something a person wrote: it is not run through the patterns,
  // which also keeps a very long profile or note from costing time on every redraw.
  if (key.length > MAX_ASSEMBLED) return key;
  for (const pattern of patterns) {
    const match = pattern.test.exec(key); if (!match) continue;
    return pattern[language].replace(/\$(\d{1,2})/g, (reference, digits) => {
      // «$12» is group 12 when the pattern has one, otherwise group 1 followed by the digit 2.
      const number = Number(digits) < match.length ? Number(digits) : Number(digits[0]), rest = Number(digits) < match.length ? '' : digits.slice(1);
      const value = match[number] ?? '';
      if (!pattern.groups.includes(number)) return value + rest;
      if (pattern.separator) return value.split(pattern.separator).map(item => label(item.trim()) ?? item).join(pattern.separator) + rest;
      return (label(value) ?? value) + rest;
    });
  }
  // A plain list of this page's own labels, such as skills or languages joined by commas.
  const items = key.split(', ');
  // Items already written in Latin letters (a language's own name, a city) stay as they are.
  if (items.length > 1 && items.some(item => label(item) !== undefined) && items.every(item => !CYRILLIC.test(item) || label(item) !== undefined)) return items.map(item => label(item) ?? item).join(', ');
  return key;
}

export function startOverlay(document) {
  const texts = new WeakMap(), attributes = new WeakMap(), generated = new WeakMap();
  // What a person wrote is marked translate="no" by the page and is shown exactly as written, even when it
  // happens to equal one of the page's labels.
  const NAMES = ['aria-label', 'placeholder', 'title', 'alt'], SKIP = 'script,style,textarea,[translate="no"]';
  function text(node) {
    if (!node.parentElement || node.parentElement.closest(SKIP)) return;
    // What the page itself wrote: either the current value, or the source we remembered when we replaced it.
    const entry = texts.get(node), now = node.nodeValue, source = entry && now === entry.out ? entry.source : now;
    const translated = translate(source), out = translated === null ? null : source.match(/^\s*/)[0] + translated + source.match(/\s*$/)[0];
    if (out === null) { texts.delete(node); if (now !== source) node.nodeValue = source; return; }
    // A choice in a list is sent by its value. If the page gave it none, the value is its Ukrainian label:
    // pin that before the label changes, so the same data is sent in every language.
    const option = node.parentElement.tagName === 'OPTION' ? node.parentElement : null;
    if (option && !option.hasAttribute('value') && now === source) option.setAttribute('value', option.value);
    texts.set(node, { source, out }); if (now !== out) node.nodeValue = out;
  }
  function attribute(element, name) {
    const now = element.getAttribute(name); if (now === null) return; // a field's hint is page text; its value is not, and is never read
    const known = attributes.get(element) || new Map(), entry = known.get(name), source = entry && now === entry.out ? entry.source : now, out = translate(source);
    if (out === null) { known.delete(name); if (now !== source) element.setAttribute(name, source); return; }
    known.set(name, { source, out }); attributes.set(element, known); if (now !== out) element.setAttribute(name, out);
  }
  // The business-case summary and the demo's sample draft are text the page generates and shows in a read-only
  // box. Nobody types into them and nothing reads them back, so they are shown line by line in the chosen
  // language. No other field is touched.
  const GENERATED = '#people textarea[readonly], #demo-journey-stage textarea[readonly]';
  function field(element) {
    const entry = generated.get(element), now = element.value, source = entry && now === entry.out ? entry.source : now;
    const out = getLanguage() === 'uk' ? source : source.split('\n').map(line => translate(line) ?? line).join('\n');
    generated.set(element, { source, out }); if (now !== out) element.value = out;
  }
  function sweep(root) {
    if (root.nodeType === 3) { text(root); return; }
    if (root.nodeType !== 1) return;
    const walker = document.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) text(node);
    for (const name of NAMES) { if (root.hasAttribute(name)) attribute(root, name); for (const element of root.querySelectorAll(`[${name}]`)) attribute(element, name); }
    if (root.matches(GENERATED)) field(root); for (const element of root.querySelectorAll(GENERATED)) field(element);
  }
  // Text the page writes later is handled as it arrives; our own writes are recognised and left alone.
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') text(record.target);
      else if (record.type === 'attributes') attribute(record.target, record.attributeName);
      else for (const node of record.addedNodes) sweep(node);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: NAMES });
  return { apply() {
    document.documentElement.lang = getLanguage(); sweep(document.documentElement);
    // The rules page reads the same saved choice; the link also carries it for browsers that keep no storage.
    for (const link of document.querySelectorAll('a[href^="/legal.html"]')) link.setAttribute('href', getLanguage() === 'uk' ? '/legal.html' : '/legal.html?lang=' + getLanguage());
  } };
}
