export const STYLE_STORAGE_KEY = 'synera.style';
export const SYNERA_STYLE = 'synera';
export const ATELIER_STYLE = 'atelier';
export const ORIGINAL_STYLE = 'original';

export function normalizeStyle(value) {
  return [SYNERA_STYLE, ATELIER_STYLE, ORIGINAL_STYLE].includes(value) ? value : SYNERA_STYLE;
}

export function styleToggleCopy(style) {
  switch (normalizeStyle(style)) {
    case ATELIER_STYLE: return { text: 'Стиль: Atelier', label: 'Актуальний стиль Atelier. Увімкнути попередній вебстиль.' };
    case ORIGINAL_STYLE: return { text: 'Стиль: Web', label: 'Актуальний попередній вебстиль. Увімкнути стиль Synera.' };
    default: return { text: 'Стиль: Synera', label: 'Актуальний стиль Synera з оригінального макета. Увімкнути стиль Atelier.' };
  }
}

export function applyStyle(root, button, style) {
  const next = normalizeStyle(style);
  const copy = styleToggleCopy(next);
  root.dataset.syneraStyle = next;
  if (button) {
    button.textContent = copy.text;
    button.setAttribute('aria-label', copy.label);
  }
  return next;
}

export function installStyleSwitcher({ root = document.documentElement, button = document.querySelector('#style-toggle'), storage = window.localStorage } = {}) {
  const current = applyStyle(root, button, storage?.getItem(STYLE_STORAGE_KEY));
  if (!button) return current;
  button.addEventListener('click', () => {
    const next = root.dataset.syneraStyle === SYNERA_STYLE ? ATELIER_STYLE : root.dataset.syneraStyle === ATELIER_STYLE ? ORIGINAL_STYLE : SYNERA_STYLE;
    applyStyle(root, button, next);
    try { storage?.setItem(STYLE_STORAGE_KEY, next); } catch { /* visual preference remains in this page */ }
  });
  return current;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') installStyleSwitcher();
