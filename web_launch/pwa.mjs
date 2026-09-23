import { DICTIONARY, SUPPORTED_LOCALES, DEFAULT_LOCALE, setLocale } from './i18n.mjs';

export const DESIGN_STORAGE_KEY = 'synera-design-preference';
export const LOCALE_STORAGE_KEY = 'synera-locale';
export const THEME_COLORS = Object.freeze({ premium: '#15161d', classic: '#254f3b' });
export const DESIGN_CHOICES = Object.freeze(['premium', 'classic']);

export function normalizeDesign(value, fallback = 'premium') {
  return DESIGN_CHOICES.includes(value) ? value : fallback;
}

export function applyDesign(root, design, doc = root.ownerDocument) {
  const selected = normalizeDesign(design);
  root.dataset.design = selected;
  const meta = doc?.querySelector?.('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[selected]);
  return selected;
}

// Static labels only: text that app.mjs has already replaced with a live state
// (for example the auth badge) no longer equals the previous locale's label and is left alone.
export function localizedText(node, key, locale, dictionary = DICTIONARY) {
  if (key) return dictionary[locale]?.[key] ?? dictionary[DEFAULT_LOCALE]?.[key] ?? null;
  if (locale === DEFAULT_LOCALE) return node.dataset.uk ?? null;
  return node.dataset[locale] ?? null;
}

function writeLines(node, value, doc) {
  const lines = String(value).split('\n');
  const accent = node.querySelector('span') && lines.length > 1;
  node.replaceChildren();
  lines.forEach((line, index) => {
    if (index) node.append(doc.createElement('br'));
    if (accent && index === lines.length - 1) { const span = doc.createElement('span'); span.textContent = line; node.append(span); }
    else node.append(doc.createTextNode(line));
  });
}

// Compare without whitespace: the dictionary stores line breaks as \n, the markup as <br>.
const flat = value => String(value ?? '').replace(/\s+/g, '');

export function applyLocale(doc, locale, previous = DEFAULT_LOCALE, dictionary = DICTIONARY) {
  const target = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  for (const node of doc.querySelectorAll('[data-i18n], [data-de], [data-en]')) {
    const key = node.dataset.i18n;
    if (!key && node.dataset.uk === undefined) node.dataset.uk = node.textContent;
    const before = localizedText(node, key, previous, dictionary);
    const next = localizedText(node, key, target, dictionary);
    if (next === null || before === null) continue;
    if (flat(node.textContent) !== flat(before)) continue;
    writeLines(node, next, doc);
  }
  for (const node of doc.querySelectorAll('[data-i18n-placeholder]')) {
    const next = dictionary[target]?.[node.dataset.i18nPlaceholder];
    if (next) node.setAttribute('placeholder', next);
  }
  doc.documentElement.lang = target;
  setLocale(target);
  doc.querySelectorAll('[data-lang]').forEach(button => {
    const active = button.dataset.lang === target;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  return target;
}

// Interface copy written by index.html and app.mjs (Ukrainian source) is swapped text node by
// text node; the Ukrainian original is kept so switching back restores it exactly. User-written
// content (form fields, previews, chat, exported text) is never touched.
const PHRASE_SKIP = 'script, style, textarea, pre, code, [data-no-translate], [data-preview], [data-de], [data-en], .chat-message, #ai-payload';
const PHRASE_ATTRS = ['placeholder', 'aria-label', 'title'];
const originals = new WeakMap();   // text node -> Ukrainian original
const written = new WeakMap();     // text node -> value we wrote (to detect app rewrites)
const attrOriginals = new WeakMap(); // element -> Map(attr -> Ukrainian original)

export function translatePhrases(root, locale, translate) {
  const doc = root.ownerDocument || root;
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  let changed = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || parent.closest(PHRASE_SKIP)) continue;
    if (written.has(node) && written.get(node) !== node.nodeValue) { originals.delete(node); written.delete(node); }
    const source = originals.get(node) ?? node.nodeValue;
    if (!/[А-Яа-яІіЇїЄєҐґ]/.test(source)) continue;
    const out = locale === DEFAULT_LOCALE ? null : translate(source, locale);
    const lead = source.match(/^\s*/)[0], trail = source.match(/\s*$/)[0];
    const next = out === null ? source : lead + out + trail;
    if (next !== node.nodeValue) { node.nodeValue = next; changed++; }
    if (next === source) { originals.delete(node); written.delete(node); } else { originals.set(node, source); written.set(node, next); }
  }
  const scope = root.querySelectorAll ? root : doc;
  for (const el of scope.querySelectorAll(PHRASE_ATTRS.map(a => `[${a}]`).join(','))) {
    if (el.closest('[data-no-translate], [data-i18n-placeholder]')) continue;
    const store = attrOriginals.get(el) || new Map();
    for (const attr of PHRASE_ATTRS) {
      if (!el.hasAttribute(attr)) continue;
      const current = el.getAttribute(attr);
      const known = store.get(attr);
      const source = known && known.written === current ? known.source : current;
      if (!/[А-Яа-яІіЇїЄєҐґ]/.test(source)) continue;
      const out = locale === DEFAULT_LOCALE ? null : translate(source, locale);
      const next = out ?? source;
      if (next !== current) { el.setAttribute(attr, next); changed++; }
      store.set(attr, { source, written: next });
    }
    attrOriginals.set(el, store);
  }
  return changed;
}

let phraseModule = null;
async function loadPhrases() { phraseModule ||= await import('./i18n-phrases.mjs'); return phraseModule; }

export function initLocaleSwitch({ doc = document, storage = window.localStorage } = {}) {
  let current = DEFAULT_LOCALE;
  let observer = null, queued = false;
  const retranslate = async () => {
    const locale = current;
    if (locale === DEFAULT_LOCALE && !observer) return;
    const { translatePhrase } = await loadPhrases();
    if (locale !== current || !doc.body) return;
    observer?.disconnect();
    translatePhrases(doc.body, locale, translatePhrase);
    if (locale === DEFAULT_LOCALE) { observer = null; return; }
    if (typeof MutationObserver === 'undefined') return;
    observer ||= new MutationObserver(() => { if (queued) return; queued = true; (globalThis.requestAnimationFrame || setTimeout)(() => { queued = false; retranslate(); }); });
    observer.observe(doc.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: PHRASE_ATTRS });
  };
  const choose = locale => {
    const previous = current;
    current = applyLocale(doc, locale, previous);
    try { storage.setItem(LOCALE_STORAGE_KEY, current); } catch { /* the language still switches for this tab */ }
    if (current !== DEFAULT_LOCALE || previous !== DEFAULT_LOCALE) retranslate().catch(() => {});
  };
  doc.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => choose(button.dataset.lang)));
  let saved = null;
  try { saved = storage.getItem(LOCALE_STORAGE_KEY); } catch { saved = null; }
  if (saved && saved !== DEFAULT_LOCALE && SUPPORTED_LOCALES.includes(saved)) choose(saved);
  else applyLocale(doc, DEFAULT_LOCALE, DEFAULT_LOCALE);
  return { get locale() { return current; } };
}

export function initDesignSwitch({ doc = document, storage = window.localStorage } = {}) {
  const root = doc.documentElement;
  const controls = [...doc.querySelectorAll('[data-design-choice]')];
  const selected = applyDesign(root, (() => { try { return storage.getItem(DESIGN_STORAGE_KEY) || root.dataset.design; } catch { return root.dataset.design; } })());
  const sync = design => {
    const active = applyDesign(root, design);
    controls.forEach(control => control.setAttribute('aria-pressed', String(control.dataset.designChoice === active)));
    try { storage.setItem(DESIGN_STORAGE_KEY, active); } catch { /* The visual choice stays usable when storage is unavailable. */ }
  };
  controls.forEach(control => control.addEventListener('click', () => sync(control.dataset.designChoice)));
  sync(selected);
  return { selected, controls };
}

// Live preview of the user's own card, read from their own form fields only.
// Nothing is stored or sent; text is written with textContent.
export function renderProfilePreview(form, root) {
  if (!form || !root) return false;
  const value = name => String(form.elements?.namedItem?.(name)?.value ?? '').trim();
  for (const node of root.querySelectorAll('[data-preview]')) {
    const key = node.dataset.preview;
    if (key === 'initial') { node.textContent = (value('display_name').charAt(0) || '·').toLocaleUpperCase(); continue; }
    const text = value(key);
    node.textContent = text || node.dataset.empty || '';
    node.classList.toggle('is-empty', !text);
  }
  return true;
}

export function initProfilePreview({ doc = document } = {}) {
  const form = doc.querySelector('#profile-form');
  const root = doc.querySelector('#profile-preview');
  if (!form || !root) return null;
  let queued = false;
  const update = () => { if (queued) return; queued = true; (globalThis.requestAnimationFrame || setTimeout)(() => { queued = false; renderProfilePreview(form, root); }); };
  for (const type of ['input', 'change', 'reset']) form.addEventListener(type, update);
  // app.mjs fills the form programmatically (draft, import, sign-in): refresh when the view opens or after any click.
  doc.addEventListener('click', update);
  const view = doc.querySelector('#profile-view');
  if (view && typeof MutationObserver !== 'undefined') new MutationObserver(update).observe(view, { attributes: true, attributeFilter: ['hidden'] });
  renderProfilePreview(form, root);
  return { update };
}

// Cursor light: a soft gold light follows a fine pointer across the main surfaces (premium only).
// Only two custom properties are written through the CSSOM, which the page CSP allows.
export const LIGHT_SURFACES = '.person, .reciprocity, .welcome, .profile-preview, .trust-ledger';
export function initCursorLight({ doc = document, win = window } = {}) {
  if (!win.matchMedia?.('(pointer: fine)').matches) return false;
  let frame = 0, last = null;
  doc.addEventListener('pointermove', event => {
    last = event;
    if (frame) return;
    frame = win.requestAnimationFrame(() => {
      frame = 0;
      if (doc.documentElement.dataset.design !== 'premium' || win.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const surface = last.target instanceof Element ? last.target.closest(LIGHT_SURFACES) : null;
      if (!surface) return;
      const box = surface.getBoundingClientRect();
      surface.style.setProperty('--light-x', `${Math.round(last.clientX - box.left)}px`);
      surface.style.setProperty('--light-y', `${Math.round(last.clientY - box.top)}px`);
    });
  }, { passive: true });
  return true;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  initDesignSwitch();
  initLocaleSwitch();
  initProfilePreview();
  initCursorLight();
  let installEvent;
  const installButton = document.querySelector('#install-app');
  const status = document.querySelector('#install-status') || { textContent: '' };
  const installationHelp = 'Android: меню Chrome → Встановити застосунок / Додати на головний екран. iPhone: Safari → Поділитися → На початковий екран → Відкривати як вебпрограму. Windows: використай лише пропозицію встановлення у браузері. На кожному пристрої потрібне опубліковане HTTPS-посилання.';
  function installed() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
  if (installButton) installButton.hidden = true;
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installEvent = event; if (installButton) installButton.hidden = false; status.textContent = 'Synera можна встановити через браузерний PWA-запит.'; });
  window.addEventListener('appinstalled', () => { installEvent = null; status.textContent = 'Synera встановлена. Відкрий її з домашнього екрана або меню застосунків.'; if (installButton) installButton.hidden = true; });
  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (installEvent) { const pending = installEvent; installEvent = null; await pending.prompt(); return; }
      status.textContent = installed() ? 'Synera вже відкрита як застосунок.' : installationHelp;
    });
    if (installed()) installButton.hidden = true;
  }
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('/sw.mjs', { type: 'module', updateViaCache: 'none' })
    .then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            status.textContent = 'Synera оновлюється. Перезавантажуємо...';
            setTimeout(() => window.location.reload(), 1500);
          }
        });
      });
    })
    .catch(() => { status.textContent = 'Офлайн-режим недоступний у цьому браузері. Встановлення все одно потребує опублікованого HTTPS-сайту та браузерного PWA-запиту.'; });
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload(); }
    });
  }
  window.addEventListener('offline', () => { status.textContent = 'Немає інтернету. Незбережена чернетка залишається у вкладці. Завантаж JSON перед закриттям; серверні зміни потребують з’єднання.'; });
  window.addEventListener('online', () => { status.textContent = 'З’єднання відновлено.'; });
}
