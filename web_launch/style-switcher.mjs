export const STYLE_STORAGE_KEY = 'synera.style';
export const ATELIER_STYLE = 'atelier';
export const ORIGINAL_STYLE = 'original';

export function normalizeStyle(value) {
  return value === ORIGINAL_STYLE ? ORIGINAL_STYLE : ATELIER_STYLE;
}

export function styleToggleCopy(style) {
  return normalizeStyle(style) === ORIGINAL_STYLE
    ? { text: 'Стиль: Original', label: 'Актуальний оригінальний стиль. Увімкнути стиль Atelier.', pressed: 'true' }
    : { text: 'Стиль: Atelier', label: 'Актуальний стиль Atelier. Увімкнути оригінальний стиль.', pressed: 'false' };
}

export function applyStyle(root, button, style) {
  const next = normalizeStyle(style);
  const copy = styleToggleCopy(next);
  root.dataset.syneraStyle = next;
  if (button) {
    button.textContent = copy.text;
    button.setAttribute('aria-label', copy.label);
    button.setAttribute('aria-pressed', copy.pressed);
  }
  return next;
}

export function installStyleSwitcher({ root = document.documentElement, button = document.querySelector('#style-toggle'), storage = window.localStorage } = {}) {
  const current = applyStyle(root, button, storage?.getItem(STYLE_STORAGE_KEY));
  if (!button) return current;
  button.addEventListener('click', () => {
    const next = root.dataset.syneraStyle === ATELIER_STYLE ? ORIGINAL_STYLE : ATELIER_STYLE;
    applyStyle(root, button, next);
    try { storage?.setItem(STYLE_STORAGE_KEY, next); } catch { /* visual preference remains in this page */ }
  });
  return current;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') installStyleSwitcher();
