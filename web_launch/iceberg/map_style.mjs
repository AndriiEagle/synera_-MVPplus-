// C15.L3 — Map Style Switcher: шар підкладок + маркер-токени + GEO-01 guard.
// Канон: plan/readiness/ICEBERG_ARCHITECTURE.uk.md §3. Правила: превʼязаність вибору
// user > event > cohort > default; місто-рівень only (GEO-01), live GPS — ніколи без гранту;
// маркер-кольори — токени з tokens.css, consent-гейти не торкаються.

export const TILE_STYLES = Object.freeze([
  Object.freeze({ id: 'osm', label: 'OpenStreetMap', attribution: '© OpenStreetMap contributors', urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' }),
  Object.freeze({ id: 'satellite', attribution: '© Esri, Maxar, Earthstar Geographics', urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' }),
  Object.freeze({ id: 'schematic', attribution: 'Synera schematic', urlTemplate: 'local:schematic' }),
]);

const DEFAULT_RADIUS_KM = 15;
const MIN_RADIUS_KM = 15; // GEO-01: груба межа міста — точність нижче 15 км заборонена
const MAX_RADIUS_KM = 25;

export function listTileStyles() {
  return TILE_STYLES.map(style => Object.freeze({ ...style }));
}

/** Превʼязаність: явний вибір user > event > cohort > 'osm'. */
export function resolveTileLayer(styleId, context = {}) {
  if (styleId) return requireStyle(styleId).id;
  if (context.eventStyle) return requireStyle(context.eventStyle).id;
  if (context.cohortDefault) return requireStyle(context.cohortDefault).id;
  return 'osm';
}

function requireStyle(styleId) {
  const style = TILE_STYLES.find(s => s.id === styleId);
  if (!style) throw new Error('Невідома карта-підкладка: ' + String(styleId));
  return style;
}

export function markerTokens(styleId) {
  const style = requireStyle(styleId);
  const tokenSets = {
    osm: { '--color-bg-map-marker': '#254f3b', '--color-bg-map': '#e8eddf' },
    satellite: { '--color-bg-map-marker': '#94ad66', '--color-bg-map': '#20301f' },
    schematic: { '--color-bg-map-marker': '#305b45', '--color-bg-map': '#f6f5ef' },
  };
  return Object.freeze({ ...tokenSets[style.id] });
}

/**
 * Точність рівня міста (GEO-01 §4): без згоди — null; зі згодою — грубий радіус 15..25 км.
 * Live GPS НІКОЛИ не повертається з цієї функції.
 */
export function viewportRadius(profile, opts = {}) {
  if (!profile || profile.map_visible !== true || profile.is_discoverable !== true) return null;
  const km = opts.radiusKm === undefined ? DEFAULT_RADIUS_KM : opts.radiusKm;
  if (typeof km !== 'number' || Number.isNaN(km)) throw new Error('Некоректний радіус видимості');
  return Math.max(MIN_RADIUS_KM, Math.min(MAX_RADIUS_KM, km));
}

/**
 * GEO-01 guard для пропонованої зміни карти.
 * @param {{tileStyle?: string, markers?: object, featureFlags?: object, liveGps?: boolean}} event
 * @returns {{pass: boolean, violations: string[]}}
 */
export function geoGuard(event = {}) {
  const violations = [];
  const style = event.tileStyle ?? event.mapStyle ?? event.style;
  if (style !== undefined && !TILE_STYLES.some(s => s.id === style)) {
    violations.push('НЕВІДОМА КАРТА-ПІДКЛАДКА');
  }
  if (event.liveGps === true) violations.push('LIVE GPS БЕЗ ЯВНОГО ГРАНТУ');
  const flags = event.featureFlags ?? {};
  for (const key of Object.keys(flags)) {
    if (/^consent\./.test(key) || key.startsWith('consent.')) violations.push('ТОРКАЄТЬСЯ ГЕЙТУ ЗГОДИ: ' + key);
  }
  const markers = event.markers ?? {};
  for (const key of Object.keys(markers)) {
    if (!key.startsWith('--color-')) violations.push('Маркер-токен має бути кольоровим токеном: ' + key);
  }
  return { pass: violations.length === 0, violations };
}