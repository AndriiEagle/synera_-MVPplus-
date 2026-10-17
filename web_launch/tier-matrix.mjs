// C11.L2 — Матриця тарифів: free / pro / organizer / credits.
// Gate з DNA: базовий матчинг лишається безкоштовним; довіра ніколи не продається.
// Детерміновано, чисто.

export const TIERS = Object.freeze(['free', 'pro', 'organizer']);
export const CREDIT_ACTIONS = Object.freeze(['intro_request', 'community_case_post', 'priority_match', 'export_pack']);

// Ціни в кредитах (не в грошах — гроші окремий канал). 0 = входить у тариф.
const MATRIX = Object.freeze({
  free: { intro_request: 1, community_case_post: 2, priority_match: null, export_pack: null },
  pro: { intro_request: 0, community_case_post: 1, priority_match: 2, export_pack: 3 },
  organizer: { intro_request: 0, community_case_post: 0, priority_match: 1, export_pack: 1 },
});

/** Що дозволено тарифом і скільки кредитів дія коштує. null = недоступно взагалі. */
export function actionCost(tier, action) {
  if (!TIERS.includes(tier)) return { valid: false, reason: 'INVALID_TIER' };
  if (!CREDIT_ACTIONS.includes(action)) return { valid: false, reason: 'INVALID_ACTION' };
  const cost = MATRIX[tier][action];
  return { valid: true, tier, action, cost, allowed: cost !== null };
}

/** Перевірка дії: тариф + баланс кредитів (з леджера C11.L3). */
export function canPerform(tier, action, creditBalance) {
  const cost = actionCost(tier, action);
  if (!cost.valid) return cost;
  if (!cost.allowed) return { valid: true, allowed: false, reason: 'ACTION_NOT_IN_TIER', cost: null };
  if (!Number.isSafeInteger(creditBalance) || creditBalance < 0) return { valid: false, reason: 'INVALID_BALANCE' };
  if (creditBalance < cost.cost) return { valid: true, allowed: false, reason: 'INSUFFICIENT_CREDITS', cost: cost.cost };
  return { valid: true, allowed: true, cost: cost.cost };
}

/**
 * Матриця як публічний опис (для UI). Довіра/безпека поза матрицею і ніколи не продаються.
 */
export function tierMatrix() {
  const publicDescription = {};
  for (const tier of TIERS) {
    publicDescription[tier] = {};
    for (const action of CREDIT_ACTIONS) {
      const cost = MATRIX[tier][action];
      publicDescription[tier][action] = cost === null ? 'unavailable' : cost;
    }
  }
  return Object.freeze({
    tiers: TIERS,
    actions: CREDIT_ACTIONS,
    matrix: Object.freeze(publicDescription),
    guarantees: Object.freeze(['matching_is_free', 'trust_never_sold', 'safety_never_sold']),
  });
}