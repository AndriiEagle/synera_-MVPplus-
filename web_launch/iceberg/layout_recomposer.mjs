// C15.L2 — Layout Recomposer: реєстр екранів + перестановки порядку + regression gate.
// Канон: plan/readiness/ICEBERG_ARCHITECTURE.uk.md §2.3 (вхід: funnel drop-offs + cohort метрики).
// Інваріант: набір екранів незмінний; settings-view (панель згод) НІКОЛИ не приховується.
// Мапа: screen 'welcome' ↔ #welcome, 'people' ↔ #people-view, 'profile' ↔ #profile-view,
//       'meetings' ↔ #meetings-view, 'settings' ↔ #settings-view (index.html).

export const SCREENS = Object.freeze(['welcome', 'people', 'profile', 'meetings', 'settings']);
const DOM_ID = Object.freeze({ welcome: 'welcome', people: 'people-view', profile: 'profile-view', meetings: 'meetings-view', settings: 'settings-view' });

export function listScreens() {
  return [...SCREENS];
}

export function domId(screenId) {
  if (!SCREENS.includes(screenId)) throw new Error('Невідомий екран: ' + screenId);
  return DOM_ID[screenId];
}

function isPermutation(order) {
  return Array.isArray(order)
    && order.length === SCREENS.length
    && new Set(order).size === SCREENS.length
    && order.every(s => SCREENS.includes(s));
}

export function validateOrder(order) {
  if (!Array.isArray(order) || order.length !== SCREENS.length) return { valid: false, reason: 'НЕВІДПОВІДНА ДОВЖИНА' };
  if (new Set(order).size !== SCREENS.length) return { valid: false, reason: 'ДУБЛІКАТ ЕКРАНУ' };
  if (!order.every(s => SCREENS.includes(s))) return { valid: false, reason: 'НЕВІДОМИЙ ЕКРАН' };
  return { valid: true, reason: null };
}

/** Правила: { move: screenId, toIndex: n } або { promote: screenId }. Вхід не мутується. */
export function recomposeOrder(currentOrder, rule) {
  const check = validateOrder(currentOrder);
  if (!check.valid) throw new Error('Некоректний порядок екранів: ' + check.reason);
  const next = [...currentOrder];
  if (rule && typeof rule === 'object' && 'move' in rule) {
    const from = next.indexOf(rule.move);
    if (from < 0) throw new Error('Невідомий екран: ' + rule.move);
    const to = Math.max(0, Math.min(SCREENS.length - 1, rule.toIndex));
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
  } else if (rule && typeof rule === 'object' && 'promote' in rule) {
    const from = next.indexOf(rule.promote);
    if (from < 0) throw new Error('Невідомий екран: ' + rule.promote);
    const [item] = next.splice(from, 1);
    next.unshift(item);
  } else {
    throw new Error('Некоректне правило перекомпоновки');
  }
  const check2 = validateOrder(next);
  if (!check2.valid) throw new Error('Некоректний порядок екранів: ' + check2.reason);
  return next;
}

const INVARIANT_SCREENS = Object.freeze(['settings']);

/** Видимість: settings (панель згод) — завжди видимий; це інваріант канону §1.2. */
export function toggleVisibility(currentVisible, screenId, visible) {
  if (!SCREENS.includes(screenId)) throw new Error('Невідомий екран: ' + screenId);
  if (INVARIANT_SCREENS.includes(screenId) && visible === false) {
    throw new Error('Екран приватності не можна приховати');
  }
  const next = new Set(currentVisible);
  if (visible) next.add(screenId); else next.delete(screenId);
  return [...next];
}

/** Regression gate: набір екранів до/після має збігатися — міняються тільки порядок і видимість. */
export function regressionGate(before, after) {
  const beforeScreens = [...new Set([...(before?.order ?? []), ...SCREENS])].sort();
  const afterScreens = [...new Set([...(after?.order ?? []), ...SCREENS])].sort();
  const reasons = [];
  if (JSON.stringify(beforeScreens) !== JSON.stringify(afterScreens)) {
    reasons.push('НАБІР ЕКРАНІВ ЗМІНИВСЯ');
  }
  const beforeInvariant = INVARIANT_SCREENS.filter(s => !(before?.visible ?? SCREENS).includes(s));
  const afterInvariant = INVARIANT_SCREENS.filter(s => !(after?.visible ?? SCREENS).includes(s));
  if (afterInvariant.length > 0) reasons.push('ЕКРАН ПРИВАТНОСТІ ПРИХОВАНИЙ');
  return { pass: reasons.length === 0, reasons };
}

export function describeLayout(order, visible) {
  const check = validateOrder(order);
  if (!check.valid) throw new Error('Некоректний порядок екранів: ' + check.reason);
  const visibleSet = new Set(visible ?? SCREENS);
  for (const s of INVARIANT_SCREENS) visibleSet.add(s);
  return 'layout:order=' + order.join('>') + ';visible=' + SCREENS.filter(s => visibleSet.has(s)).join(',');
}