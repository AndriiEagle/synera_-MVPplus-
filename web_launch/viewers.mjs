// C11.L5 — «Хто мене переглядав»: тільки взаємна опція.
// Gate: ти бачиш переглядачів лише якщо сам дозволяєш іншим бачити тебе. Одностороннього стеження немає.
// Детерміновано, чисто: без мережі, без Date.now() (час передається аргументом).

const VALID_ID = value => typeof value === 'string' && value.length >= 1 && value.length <= 64 && /^[A-Za-z0-9_:-]+$/.test(value);
const VALID_INSTANT = value => typeof value === 'string' && Number.isFinite(Date.parse(value));

function validView(view) {
  return Boolean(view
    && typeof view === 'object'
    && !Array.isArray(view)
    && VALID_ID(view.viewerId)
    && VALID_ID(view.ownerId)
    && view.viewerId !== view.ownerId
    && VALID_INSTANT(view.at));
}

/**
 * Реєструє перегляд. Запис зберігається завжди, але ВІДОБРАЖАЄТЬСЯ обом лише за взаємної опції.
 * Повертає новий масив (append-only), вхід не мутується.
 */
export function recordView(views, view) {
  if (!Array.isArray(views)) return { valid: false, reason: 'INVALID_VIEWS' };
  if (!validView(view)) return { valid: false, reason: 'INVALID_VIEW' };
  return { valid: true, views: [...views, { viewerId: view.viewerId, ownerId: view.ownerId, at: view.at }] };
}

/**
 * Хто переглядав власника — ВІДОБРАЖАЄТЬСЯ власнику лише якщо сам власник увімкнув
 * опцію, і показуємо лише тих переглядачів, які самі ввімкнули взаємність.
 * @param {Array} views
 * @param {{ id: string, mutualViewersEnabled: boolean }} owner
 * @param {{ mutualViewersEnabled: boolean }} viewerPrefs — за viewerId
 */
export function visibleViewers(views, owner, viewerPrefs = {}) {
  if (!Array.isArray(views)) return { valid: false, reason: 'INVALID_VIEWS' };
  if (!owner || typeof owner !== 'object' || !VALID_ID(owner.id)) return { valid: false, reason: 'INVALID_OWNER' };
  // Gate: власник вимкнув опцію -> не бачить нікого. Це і є відмова від стеження.
  if (owner.mutualViewersEnabled !== true) return { valid: true, viewers: [] };
  const seen = new Map();
  for (const view of views) {
    if (!validView(view) || view.ownerId !== owner.id) continue;
    const prefs = viewerPrefs[view.viewerId];
    // Переглядач бачимий, лише якщо він сам увімкнув взаємну опцію (взаємність).
    if (!prefs || prefs.mutualViewersEnabled !== true) continue;
    // Останній перегляд кожного переглядача.
    if (!seen.has(view.viewerId) || view.at > seen.get(view.viewerId).at) seen.set(view.viewerId, { viewerId: view.viewerId, at: view.at });
  }
  return { valid: true, viewers: [...seen.values()].sort((a, b) => b.at.localeCompare(a.at)) };
}

/** Скасовує взаємність: після виключення опції власник більше нікого не бачить, і його ховають іншим. */
export function optOut(views, { id }) {
  if (!Array.isArray(views)) return { valid: false, reason: 'INVALID_VIEWS' };
  if (!VALID_ID(id)) return { valid: false, reason: 'INVALID_OWNER' };
  return { valid: true, viewers: visibleViewers(views, { id, mutualViewersEnabled: false }).viewers };
}