// German and English for the sign-in and profile page, laid over the page as it is. The page's own code is
// untouched and keeps writing Ukrainian; this module shows the same text in the chosen language and puts the
// Ukrainian back when asked. It never reads or changes field values, stored data or anything sent to the server.
// Loaded only after a person picks German or English, so a Ukrainian visit never runs it.
import { getLanguage, tr, hasSource } from './real-journey-i18n.mjs';
import { ROWS, PATTERNS } from './index-i18n-table.mjs';

const CYRILLIC = /[Ѐ-ӿ]/, norm = text => text.replace(/\s+/g, ' ').trim();
const maps = { de: new Map(), en: new Map() };
for (const [uk, de, en] of ROWS) { maps.de.set(uk, de); maps.en.set(uk, en); }
const patterns = PATTERNS.map(([source, de, en, groups, separator]) => ({ test: new RegExp(source, 'u'), de, en, groups, separator }));
// One of this page's own labels, or one shared with the two-person page.
const label = key => maps[getLanguage()]?.get(key) ?? (hasSource(key) ? tr(key) : undefined);

// A whole text first, then a text assembled from parts. Null means «leave it as written»: names, messages
// and anything else a person typed never match and are never touched.
export function translate(text) {
  const language = getLanguage(), key = norm(text);
  if (language === 'uk' || !key || !CYRILLIC.test(key)) return null;
  const whole = label(key); if (whole !== undefined) return whole;
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
  return null;
}

export function startOverlay(document) {
  const texts = new WeakMap(), attributes = new WeakMap(), generated = new WeakMap();
  // A message someone typed is theirs: it is shown as written even if it happens to equal a label.
  const NAMES = ['aria-label', 'placeholder', 'title', 'alt'], SKIP = 'script,style,textarea,.chat-message > p';
  function text(node) {
    if (!node.parentElement || node.parentElement.closest(SKIP)) return;
    // What the page itself wrote: either the current value, or the source we remembered when we replaced it.
    const entry = texts.get(node), now = node.nodeValue, source = entry && now === entry.out ? entry.source : now;
    const translated = translate(source), out = translated === null ? null : source.match(/^\s*/)[0] + translated + source.match(/\s*$/)[0];
    if (out === null) { texts.delete(node); if (now !== source) node.nodeValue = source; return; }
    texts.set(node, { source, out }); if (now !== out) node.nodeValue = out;
  }
  function attribute(element, name) {
    const now = element.getAttribute(name); if (now === null) return; // a field's hint is page text; its value is not, and is never read
    const known = attributes.get(element) || new Map(), entry = known.get(name), source = entry && now === entry.out ? entry.source : now, out = translate(source);
    if (out === null) { known.delete(name); if (now !== source) element.setAttribute(name, source); return; }
    known.set(name, { source, out }); attributes.set(element, known); if (now !== out) element.setAttribute(name, out);
  }
  // The business-case summary is text the page generates and shows in a read-only box. Nobody types into it
  // and nothing reads it back, so it is shown line by line in the chosen language. No other field is touched.
  const GENERATED = '#people textarea[readonly]';
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
  return { apply() { document.documentElement.lang = getLanguage(); sweep(document.documentElement); } };
}
