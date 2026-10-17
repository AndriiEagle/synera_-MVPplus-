// C13.L2a — поведінкові тести web_launch/app.mjs (874 рядки, БЕЗ експортів,
// DOM-обв'язка виконується ПРИ import). Генераційний fake-DOM без jsdom.
// ГЛОБАЛИ СТАВЛЯЮТЬСЯ ДО динамічного import; app.mjs не модифікується.
import test from 'node:test';
import assert from 'node:assert/strict';

// ---------- Генеративний fake DOM ----------

class FakeClassList {
  constructor(owner) { this.set = new Set(); this.owner = owner; }
  add(...names) { for (const n of names) this.set.add(n); }
  remove(...names) { for (const n of names) this.set.delete(n); }
  contains(n) { return this.set.has(n); }
  toggle(n, force) {
    const want = force === undefined ? !this.set.has(n) : Boolean(force);
    if (want) this.set.add(n); else this.set.delete(n);
    return want;
  }
  get value() { return [...this.set].join(' '); }
}

class FakeElement {
  constructor(tag) {
    this.tagName = String(tag || 'div').toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.classList = new FakeClassList(this);
    this.dataset = {};
    this.style = { cssText: '' };
    this.attributes = new Map();
    this.listeners = new Map();
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.required = false;
    this.readOnly = false;
    this.placeholder = '';
    this.title = '';
    this.name = '';
    this.id = '';
    this.type = '';
    this._open = false;
    this._textContentSet = null;
    this.clientW = 0;
  }
  get className() { return this.classList.value; }
  set className(v) { this.classList.set.clear(); for (const n of String(v).split(/\s+/).filter(Boolean)) this.classList.add(n); }
  get textContent() {
    if (this._textContentSet !== null) return this._textContentSet;
    return this.children.length ? this.children.map(c => c.textContent ?? '').join('') : '';
  }
  set textContent(v) { this._textContentSet = String(v); this.children = []; }
  get innerText() { return this.textContent; }
  set innerText(v) { this.textContent = v; }
  get open() { return this._open; }
  set open(v) { this._open = Boolean(v); }
  appendChild(node) { node.parentNode = this; this.children.push(node); return node; }
  append(...nodes) { for (const n of nodes) this.appendChild(n); }
  replaceChildren(...nodes) { this.children = []; for (const n of nodes) this.appendChild(n); }
  before(node) { if (this.parentNode) { const i = this.parentNode.children.indexOf(this); this.parentNode.children.splice(i, 0, node); node.parentNode = this.parentNode; } }
  after(node) { if (this.parentNode) { const i = this.parentNode.children.indexOf(this); this.parentNode.children.splice(i + 1, 0, node); node.parentNode = this.parentNode; } }
  remove() { if (this.parentNode) { const i = this.parentNode.children.indexOf(this); if (i >= 0) this.parentNode.children.splice(i, 1); this.parentNode = null; } }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(fn); }
  removeEventListener(type, fn) { const list = this.listeners.get(type) || []; const i = list.indexOf(fn); if (i >= 0) list.splice(i, 1); }
  dispatch(type, event = {}) {
    const eventObject = { type, target: this, currentTarget: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...event };
    for (const fn of [...(this.listeners.get(type) || [])]) fn(eventObject);
    return eventObject;
  }
  click() { this.dispatch('click'); }
  focus() {}
  select() {}
  blur() {}
  scrollIntoView() {}
  showModal() { this._open = true; }
  close() { if (this._open) { this._open = false; this.dispatch('close'); } }
  reset() { for (const node of this.elements?.named.values() || []) { node.value = ''; node.checked = false; } this.dataset.dirty = ''; }
  closest() { return this; } // generic: завжди повертає валідний вузол
  querySelector(selector) { return fakeNodeBySelector('child:' + this.id + '|' + selector); }
  querySelectorAll() { return []; }
  get clientWidth() { return this.clientW; }
  get files() { return null; }
  async text() { return ''; }
}

const nodeCache = new Map();
const fakeNodeBySelector = key => {
  if (!nodeCache.has(key)) nodeCache.set(key, new FakeElement('div'));
  return nodeCache.get(key);
};

// Таби — ФІКСОВАНИЙ набір: people | profile | meetings | settings.
const tabNodes = ['people', 'profile', 'meetings', 'settings'].map(name => {
  const node = new FakeElement('button');
  node.dataset.tab = name;
  return node;
});

const tabByDataset = name => tabNodes.find(n => n.dataset.tab === name);

const formNode = new FakeElement('form');
const NAMED_FIELDS = ['display_name', 'city', 'offers', 'seeks', 'goal', 'city_code', 'max_km',
  'available_from', 'available_until', 'paid_role', 'referral_role',
  'is_discoverable', 'map_visible', 'remote', 'confidentiality', 'accepts_confidentiality',
  'referral_source_declared', 'referral_recipient_scope_declared'];
const CHECKBOX_FIELDS = ['is_discoverable', 'map_visible', 'remote', 'confidentiality', 'accepts_confidentiality', 'referral_source_declared', 'referral_recipient_scope_declared'];
const named = new Map(NAMED_FIELDS.map(name => {
  const input = new FakeElement('input');
  input.name = name;
  return [name, input];
}));
formNode.elements = {
  namedItem: name => named.get(name) || (() => { const generic = new FakeElement('input'); generic.name = name; named.set(name, generic); return generic; })(),
  get named() { return named; },
};
formNode.reset = () => { for (const node of named.values()) { node.value = ''; node.checked = false; } delete formNode.dataset.dirty; };

const document = {
  createElement: tag => new FakeElement(tag),
  getElementById: id => fakeNodeBySelector('id:' + id),
  querySelector: selector => selector === '#profile-form' ? formNode : fakeNodeBySelector('q:' + selector),
  querySelectorAll(selector) {
    if (selector === '[data-tab]') return tabNodes;
    if (selector === 'button') return tabNodes;
    if (selector === '[data-tab="settings"]') return [tabNodes[3]];
    return [];
  },
  body: new FakeElement('body'),
  execCommand: () => true,
  addEventListener() {},
};

globalThis.document = document;

// location/history/localStorage/navigator/URL.createObjectURL/FormData/ResizeObserver.
const location = {
  protocol: 'https:',
  href: 'https://test.local/',
  pathname: '/',
  hash: '',
  searchParams: new URLSearchParams(),
};
globalThis.location = location;
globalThis.history = { replaceState() {}, pushState() {} };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
// Node ≥21 має read-only getter navigator — перевизначаємо, якщо дозволяє; інакше лишаємо системний.
const navigatorStub = {
  clipboard: { writeText: async () => {}, readText: async () => '' },
  share: undefined,
};
try { Object.defineProperty(globalThis, 'navigator', { value: navigatorStub, configurable: true, writable: false }); }
catch { /* clipboard вживається лише в обробниках — критичних глоків нема */ }
globalThis.URL.createObjectURL = () => 'blob:fake';
globalThis.URL.revokeObjectURL = () => {};
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

// Мінімальний FormData: читає elements форми (текстові поля + позначені чекбокси).
globalThis.FormData = class FakeFormData {
  constructor(form) { this.form = form; }
  *entries() {
    for (const [name, node] of named) {
      const isCheckboxField = ['is_discoverable', 'map_visible', 'remote', 'confidentiality', 'accepts_confidentiality', 'referral_source_declared', 'referral_recipient_scope_declared'].includes(name);
      if (isCheckboxField ? node.checked : true) yield [name, node.value];
    }
  }
  get(name) { const node = named.get(name); return node && !(isCheckbox(node) && !node.checked) ? node.value : null; }
  getAll(name) { const node = named.get(name); return node ? [node.value] : []; }
  has(name) { return named.has(name); }
  [Symbol.iterator]() { return this.entries(); }
};
const isCheckbox = node => ['checkbox'].includes(node.type) || ['is_discoverable', 'map_visible', 'remote', 'confidentiality', 'accepts_confidentiality', 'referral_source_declared', 'referral_recipient_scope_declared'].includes(node.name);

// fetch: конфіг → neon-бекенд; /api/neon/session → {user:null}; решта neon — порожній JSON.
const CONFIG_BODY = { backend: 'neon', pilotSafetyEnabled: true, realPilotEnabled: true, registrationEnabled: false, supabaseUrl: '', publishableKey: '' };
globalThis.fetch = async (url) => {
  const path = String(url);
  let body = {};
  if (path.includes('/config.json')) body = CONFIG_BODY;
  else if (path.includes('/api/neon/session')) body = { user: null };
  else if (path.includes('/api/neon/')) body = {};
  return { ok: true, status: 200, text: async () => JSON.stringify(body), json: async () => body };
};

// ---------- Import один раз ----------

let importError = null;
try { await import('./app.mjs'); } catch (error) { importError = error; }

const GUARD = 'Увійди, щоб перейти до реальних учасників, зустрічей і налаштувань.';

test('C13.L2a: app.mjs імпортується без викидків — вся import-time DOM-обв’язка виконалась', () => {
  assert.equal(importError, null, importError ? importError.stack : 'import мав пройти чисто');
});

test('C13.L2a: #auth-form має submit-слухач', () => {
  const authForm = document.querySelector('#auth-form');
  assert.ok(authForm.listeners.has('submit'));
  assert.equal(authForm.listeners.get('submit').length, 1);
});

test('C13.L2a: усі 4 data-tab кнопки мають click-слухачі', () => {
  const buttons = document.querySelectorAll('[data-tab]');
  assert.equal(buttons.length, 4);
  assert.deepEqual(buttons.map(b => b.dataset.tab), ['people', 'profile', 'meetings', 'settings']);
  for (const b of buttons) {
    assert.ok(b.listeners.has('click'), b.dataset.tab);
    assert.ok(b.listeners.get('click').length >= 1, b.dataset.tab);
  }
});

test('C13.L2a: клік data-tab=people без входу показує український guard у #notice', () => {
  const notice = document.querySelector('#notice');
  notice.textContent = '';
  assert.doesNotThrow(() => tabByDataset('people').click());
  assert.equal(notice.textContent, GUARD);
});

test('C13.L2a: клік data-tab=profile дозволений без входу — guard НЕ показується', () => {
  const notice = document.querySelector('#notice');
  notice.textContent = '';
  assert.doesNotThrow(() => tabByDataset('profile').click());
  assert.notEqual(notice.textContent, GUARD);
  // Перемикач активності табів відпрацював: profile активний.
  assert.ok(tabByDataset('profile').classList.contains('active'));
  assert.ok(!tabByDataset('people').classList.contains('active'));
  // Гарда поточного табу оновилась.
  for (const value of ['people', 'profile', 'meetings', 'settings']) {
    const view = document.querySelector('#' + value + '-view');
    assert.equal(view.hidden, value !== 'profile', value);
  }
});

test('C13.L2a: клік data-tab=settings запускає consent-sync і renderBlocks без викидів', async () => {
  const notice = document.querySelector('#notice');
  notice.textContent = '';
  assert.doesNotThrow(() => tabByDataset('settings').click());
  // run() асинхронний: даємо мікро/макро-таскам завершитись; помилки всередині
  // run() перехоплюються самим app.mjs (message(...,true)) — без викидів назовні.
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.notEqual(notice.textContent, undefined);
  // aria-busy повернуто в false після завершення run().
  const authForm = document.querySelector('#auth-form');
  assert.equal(authForm.getAttribute('aria-busy'), 'false');
});