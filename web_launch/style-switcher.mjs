export const STYLE_STORAGE_KEY = 'synera.style';
export const SYNERA_STYLE = 'synera';
export const ATELIER_STYLE = 'atelier';
export const ORIGINAL_STYLE = 'original';
export const COMPACT_PRESETS = Object.freeze([
  ['noir', 'Noir'], ['alpine', 'Alpine'], ['copper', 'Copper'], ['azure', 'Azure'], ['orchid', 'Orchid'],
  ['terracotta', 'Terracotta'], ['citrus', 'Citrus'], ['slate', 'Slate'], ['ink', 'Ink'], ['harvest', 'Harvest'],
]);
export const ALL_STYLES = Object.freeze([SYNERA_STYLE, ATELIER_STYLE, ORIGINAL_STYLE, ...COMPACT_PRESETS.map(([id]) => id)]);

export function normalizeStyle(value) {
  return ALL_STYLES.includes(value) ? value : SYNERA_STYLE;
}

export function styleToggleCopy(style) {
  switch (normalizeStyle(style)) {
    case ATELIER_STYLE: return { text: 'Стиль: Atelier', label: 'Актуальний стиль Atelier. Увімкнути попередній вебстиль.' };
    // Keep the established visible Web label; Classic describes its compatibility role,
    // rather than silently replacing a working preference users already recognize.
    case ORIGINAL_STYLE: return { text: 'Стиль: Web', label: 'Актуальний попередній вебстиль Classic. Увімкнути стиль Synera.' };
    default: {
      const preset = COMPACT_PRESETS.find(([id]) => id === normalizeStyle(style));
      if (preset) return { text: 'Стиль: ' + preset[1], label: 'Актуальний компактний стиль ' + preset[1] + '. Увімкнути наступний стиль.' };
    }
    return { text: 'Стиль: Synera', label: 'Актуальний базовий стиль Synera. Увімкнути стиль Atelier.' };
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

export function installStyleSwitcher({ root = document.documentElement, button = document.querySelector('#style-toggle'), select = document.querySelector('#style-preset'), storage = window.localStorage } = {}) {
  const current = applyStyle(root, button, storage?.getItem(STYLE_STORAGE_KEY));
  if (select) {
    select.value = COMPACT_PRESETS.some(([id]) => id === current) ? current : '';
    select.addEventListener('change', () => {
      if (!select.value) return;
      applyStyle(root, button, select.value);
      try { storage?.setItem(STYLE_STORAGE_KEY, select.value); } catch { /* visual preference remains in this page */ }
    });
  }
  if (!button) return current;
  button.addEventListener('click', () => {
    const currentIndex = [SYNERA_STYLE, ATELIER_STYLE, ORIGINAL_STYLE].indexOf(root.dataset.syneraStyle);
    const next = [SYNERA_STYLE, ATELIER_STYLE, ORIGINAL_STYLE][(currentIndex + 1) % 3];
    applyStyle(root, button, next);
    if (select) select.value = '';
    try { storage?.setItem(STYLE_STORAGE_KEY, next); } catch { /* visual preference remains in this page */ }
  });
  return current;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') installStyleSwitcher();
