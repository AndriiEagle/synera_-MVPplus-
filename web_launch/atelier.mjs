// A visual preference only: no profile, consent, transcript, telemetry or AI access.
// The established synera.style owner and its Synera / Atelier / Web cycle stay intact.
export const ATELIER_PREFERENCE_KEY = 'synera.atelier.preferences.v1';
const accents = ['gold', 'red', 'plum'];
const densities = ['comfortable', 'compact'];
const defaults = Object.freeze({ version: 1, enabled: false, accent: 'gold', density: 'comfortable', largeText: false, strongContrast: false });

export function normalizeAtelier(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1) return { ...defaults };
  return { version: 1, enabled: value.enabled === true,
    accent: accents.includes(value.accent) ? value.accent : defaults.accent,
    density: densities.includes(value.density) ? value.density : defaults.density,
    largeText: value.largeText === true, strongContrast: value.strongContrast === true };
}

export function applyAtelier(root, value) {
  const preference = normalizeAtelier(value);
  const attributes = ['syneraAtelier', 'atelierAccent', 'atelierDensity', 'atelierType', 'atelierContrast'];
  if (!preference.enabled) attributes.forEach(key => { delete root.dataset[key]; });
  else Object.assign(root.dataset, { syneraAtelier: 'on', atelierAccent: preference.accent,
    atelierDensity: preference.density, atelierType: preference.largeText ? 'large' : 'regular',
    atelierContrast: preference.strongContrast ? 'strong' : 'normal' });
  return preference;
}

function readPreference(storage) {
  try { return normalizeAtelier(JSON.parse(storage?.getItem(ATELIER_PREFERENCE_KEY) || 'null')); }
  catch { return { ...defaults }; }
}

function node(document, tag, text, attrs = {}) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  return element;
}

export function installAtelier({ document = window.document, root = document.documentElement, storage } = {}) {
  if (document.querySelector('[data-atelier-controls]')) return;
  if (storage === undefined) { try { storage = window.localStorage; } catch { storage = null; } }
  let preference = applyAtelier(root, readPreference(storage));
  const existingPreferences = document.querySelector('.header-preferences-content');
  const main = document.querySelector('main');
  if (!existingPreferences && !main) return;
  const host = node(document, existingPreferences ? 'section' : 'details', '', { class: 'atelier-controls', 'data-atelier-controls': '' });
  if (existingPreferences) host.append(node(document, 'h3', 'Atelier 2026', { class: 'atelier-settings-title' }));
  else host.append(node(document, 'summary', 'Вигляд', { 'aria-label': 'Вигляд Synera: чинний або Atelier 2026' }));
  const panel = node(document, 'div', '', { class: 'atelier-settings' });
  panel.append(node(document, 'p', 'Твій простір. Твій темп.', { class: 'atelier-settings-title' }));
  const modes = node(document, 'div', '', { class: 'atelier-mode-choice', role: 'group', 'aria-label': 'Версія вигляду' });
  const current = node(document, 'button', 'Чинний', { type: 'button' });
  const atelier = node(document, 'button', 'Atelier 2026', { type: 'button' });
  modes.append(current, atelier); panel.append(modes);
  const accentGroup = node(document, 'fieldset', '', { class: 'atelier-accent-choice' });
  accentGroup.append(node(document, 'legend', 'Акцент'));
  const accentButtons = accents.map((accent, i) => {
    const button = node(document, 'button', ['Золото', 'Червоний', 'Сливовий'][i], { type: 'button', 'data-accent-choice': accent });
    button.addEventListener('click', () => change({ accent })); accentGroup.append(button); return button;
  });
  panel.append(accentGroup);
  const densityLabel = node(document, 'label', 'Простір між елементами');
  const density = node(document, 'select', '', { 'aria-label': 'Простір між елементами' });
  density.append(node(document, 'option', 'Вільний', { value: 'comfortable' }), node(document, 'option', 'Компактний', { value: 'compact' }));
  densityLabel.append(density); panel.append(densityLabel);
  const checkboxes = [['largeText', 'Більший текст'], ['strongContrast', 'Чіткіші межі']].map(([key, label]) => {
    const wrapper = node(document, 'label', '', { class: 'atelier-checkbox' });
    const input = node(document, 'input', '', { type: 'checkbox' });
    wrapper.append(input, node(document, 'span', label)); panel.append(wrapper);
    input.addEventListener('change', () => change({ [key]: input.checked })); return { key, input };
  });
  const hint = node(document, 'p', 'Зберігається лише вигляд у цьому браузері. Налаштування Atelier діють після його вибору.', { class: 'atelier-settings-note' });
  const status = node(document, 'p', '', { class: 'atelier-settings-status', role: 'status', 'aria-live': 'polite' });
  panel.append(hint, status); host.append(panel);
  if (existingPreferences) existingPreferences.append(host);
  else { host.classList.add('atelier-main-controls'); main.prepend(host); }
  current.addEventListener('click', () => change({ enabled: false }));
  atelier.addEventListener('click', () => change({ enabled: true }));
  density.addEventListener('change', () => change({ density: density.value }));
  function update() {
    current.setAttribute('aria-pressed', String(!preference.enabled));
    atelier.setAttribute('aria-pressed', String(preference.enabled));
    accentButtons.forEach(button => {
      button.disabled = !preference.enabled;
      button.setAttribute('aria-pressed', String(button.dataset.accentChoice === preference.accent));
    });
    density.disabled = !preference.enabled; density.value = preference.density;
    checkboxes.forEach(({ key, input }) => { input.checked = preference[key]; input.disabled = !preference.enabled; });
  }
  function change(patch) {
    preference = applyAtelier(root, { ...preference, ...patch }); update();
    let saved = false;
    try { storage?.setItem(ATELIER_PREFERENCE_KEY, JSON.stringify(preference)); saved = Boolean(storage); } catch { /* Works without persistence. */ }
    status.textContent = `${preference.enabled ? 'Atelier увімкнено' : 'Чинний вигляд повернуто'}. ${saved ? 'Вигляд збережено.' : 'Лише в цій вкладці.'}`;
  }
  update();
  return { getPreference: () => ({ ...preference }), setPreference: change };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') installAtelier();
