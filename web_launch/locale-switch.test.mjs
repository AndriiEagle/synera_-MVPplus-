import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDesign, applyLocale, initLocaleSwitch, LOCALE_STORAGE_KEY, THEME_COLORS } from './pwa.mjs';
import { DICTIONARY } from './i18n.mjs';

// Minimal DOM double: enough for the static-label switcher, nothing more.
class Node {
  constructor(tag, text = '', attrs = {}) { this.tagName = tag; this.children = []; this._text = text; this.dataset = { ...attrs.dataset }; this.attrs = new Map(); this.listeners = new Map(); this.classSet = new Set(); }
  get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
  set textContent(v) { this._text = v; this.children = []; }
  replaceChildren() { this._text = ''; this.children = []; }
  append(...nodes) { this.children.push(...nodes); }
  querySelector(sel) { return sel === 'span' ? this.children.find(c => c.tagName === 'SPAN') || null : null; }
  setAttribute(k, v) { this.attrs.set(k, v); }
  getAttribute(k) { return this.attrs.get(k); }
  addEventListener(t, h) { this.listeners.set(t, h); }
  get classList() { return { toggle: (c, on) => (on ? this.classSet.add(c) : this.classSet.delete(c)) }; }
}
function makeDoc(nodes, buttons) {
  const root = { lang: 'uk' };
  return {
    documentElement: root,
    createElement: tag => new Node(tag.toUpperCase()),
    createTextNode: text => new Node('#text', text),
    querySelectorAll: sel => (sel.includes('data-i18n-placeholder') ? [] : sel.includes('data-lang') ? buttons : nodes),
  };
}

test('static labels switch UA → DE → UA and keep the accent span of the headline', () => {
  const h1 = new Node('H1', '', { dataset: { i18n: 'intro.title' } });
  h1.append(new Node('#text', 'Твоя майстерність.'), new Node('BR'), Object.assign(new Node('SPAN', 'Ваш спільний результат.')));
  const slot = new Node('B', 'Даю', { dataset: { de: 'Biete', en: 'Give' } });
  const doc = makeDoc([h1, slot], []);
  applyLocale(doc, 'de', 'uk');
  assert.equal(doc.documentElement.lang, 'de');
  assert.equal(slot.textContent, 'Biete');
  const [first, br, accent] = h1.children;
  assert.equal(first.textContent + br.tagName + accent.tagName + accent.textContent, DICTIONARY.de['intro.title'].replace('\n', 'BRSPAN'));
  applyLocale(doc, 'uk', 'de');
  assert.equal(slot.textContent, 'Даю');
  assert.equal(h1.textContent, DICTIONARY.uk['intro.title'].replace('\n', ''));
});

test('a label already replaced by live app state is never overwritten by the switcher', () => {
  const badge = new Node('SPAN', 'Вхід тимчасово недоступний', { dataset: { i18n: 'header.check_access' } });
  const doc = makeDoc([badge], []);
  applyLocale(doc, 'en', 'uk');
  assert.equal(badge.textContent, 'Вхід тимчасово недоступний');
});

test('language choice is remembered, marked pressed, and survives blocked storage', () => {
  const de = new Node('BUTTON', 'DE', { dataset: { lang: 'de' } });
  const uk = new Node('BUTTON', 'UA', { dataset: { lang: 'uk' } });
  const writes = new Map();
  const doc = makeDoc([], [uk, de]);
  const sw = initLocaleSwitch({ doc, storage: { getItem: () => null, setItem: (k, v) => writes.set(k, v) } });
  de.listeners.get('click')();
  assert.equal(sw.locale, 'de');
  assert.equal(writes.get(LOCALE_STORAGE_KEY), 'de');
  assert.equal(de.getAttribute('aria-pressed'), 'true');
  assert.equal(uk.getAttribute('aria-pressed'), 'false');
  const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.doesNotThrow(() => initLocaleSwitch({ doc: makeDoc([], [uk, de]), storage: blocked }));
});

test('design choice also sets the PWA theme colour for each variant', () => {
  const meta = new Node('META');
  const doc = { querySelector: () => meta };
  const root = { dataset: {}, ownerDocument: doc };
  applyDesign(root, 'classic');
  assert.equal(meta.getAttribute('content'), THEME_COLORS.classic);
  applyDesign(root, 'premium');
  assert.equal(meta.getAttribute('content'), THEME_COLORS.premium);
});
