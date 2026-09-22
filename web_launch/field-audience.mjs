// web_launch/field-audience.mjs — C04.L3: Рівні аудиторії на поле (public, community, after_meeting, self_only)
// Забезпечує серверний та клієнтський захист: чутливі поля не витікають стороні без відповідного статусу взаємодії.

export const AUDIENCE_LEVELS = Object.freeze([
  'public',
  'community',
  'after_meeting',
  'self_only',
]);

export const AUDIENCE_HIERARCHY = Object.freeze({
  public: 1,
  community: 2,
  after_meeting: 3,
  self_only: 4,
});

export const DEFAULT_FIELD_AUDIENCE = Object.freeze({
  id: 'public',
  display_name: 'public',
  city: 'public',
  offers: 'public',
  seeks: 'public',
  is_discoverable: 'public',
  map_visible: 'public',
  updated_at: 'public',
  brief: 'public',
  offer_tags: 'public',
  need_tags: 'public',
  languages: 'public',
  modes: 'community',
  mode_details: 'community',
  contact_email: 'after_meeting',
  contact_phone: 'after_meeting',
  portfolio_samples: 'after_meeting',
  private_notes: 'self_only',
  billing_account: 'self_only',
  auth_metadata: 'self_only',
});

/**
 * Визначає рівень доступу глядача (viewer) до профілю власника (owner).
 * @param {Object} viewerContext - { isOwner, inCommunity, hasMet }
 * @returns {string} Максимальний рівень аудиторії, до якого глядач має доступ
 */
export function resolveViewerAudienceLevel(viewerContext = {}) {
  if (viewerContext.isOwner === true) return 'self_only';
  if (viewerContext.hasMet === true) return 'after_meeting';
  if (viewerContext.inCommunity === true) return 'community';
  return 'public';
}

/**
 * Фільтрує об'єкт профілю згідно з рівнем аудиторії глядача.
 * @param {Object} profile - Вихідний об'єкт профілю
 * @param {Object} viewerContext - { isOwner, inCommunity, hasMet }
 * @param {Object} customOverrides - Користувацькі перевизначення аудиторій полів
 * @returns {Object} Відфільтрований профіль без недозволених полів
 */
export function filterProfileForAudience(profile, viewerContext = {}, customOverrides = {}) {
  if (!profile || typeof profile !== 'object') return null;

  const viewerLevel = resolveViewerAudienceLevel(viewerContext);
  const viewerRank = AUDIENCE_HIERARCHY[viewerLevel] || 1;

  const audiences = { ...DEFAULT_FIELD_AUDIENCE, ...customOverrides };
  const filtered = {};

  for (const [key, value] of Object.entries(profile)) {
    const requiredLevel = audiences[key] || 'self_only'; // За замовчуванням невідомі поля закриті (fail-closed)
    const requiredRank = AUDIENCE_HIERARCHY[requiredLevel] ?? AUDIENCE_HIERARCHY.self_only;

    if (viewerRank >= requiredRank) {
      filtered[key] = structuredClone(value);
    }
  }

  return filtered;
}

/**
 * Перевіряє, чи дозволено даному глядачеві бачити конкретне поле.
 */
export function canViewField(fieldName, viewerContext = {}, customOverrides = {}) {
  const viewerLevel = resolveViewerAudienceLevel(viewerContext);
  const viewerRank = AUDIENCE_HIERARCHY[viewerLevel] || 1;

  const audiences = { ...DEFAULT_FIELD_AUDIENCE, ...customOverrides };
  const requiredLevel = audiences[fieldName] || 'self_only';
  const requiredRank = AUDIENCE_HIERARCHY[requiredLevel] ?? AUDIENCE_HIERARCHY.self_only;

  return viewerRank >= requiredRank;
}
