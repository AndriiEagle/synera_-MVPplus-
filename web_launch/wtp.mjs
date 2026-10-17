// C11.L6 — Тест готовності платити (WTP): рамка експерименту на РЕАЛЬНИХ людях.
// Gate: не синтетичні дані; кожен учасник дав окрему згоду; ціна ніколи не приховується.
// Детерміновано, чисто: це аналізатор відповідей, не збирач.

export const WTP_STAGES = Object.freeze(['shown_price', 'considered', 'would_pay', 'would_not_pay']);

/**
 * Реєструє відповідь учасника. consent обов'язковий і окремий від участі.
 */
export function recordWtpResponse(responses, { participantId, priceChf, stage, consent, at } = {}) {
  if (!Array.isArray(responses)) return { valid: false, reason: 'INVALID_RESPONSES' };
  if (typeof participantId !== 'string' || !participantId || participantId.length > 64) return { valid: false, reason: 'INVALID_PARTICIPANT' };
  if (!Number.isFinite(priceChf) || priceChf < 0 || priceChf > 10000) return { valid: false, reason: 'INVALID_PRICE' };
  if (!WTP_STAGES.includes(stage)) return { valid: false, reason: 'INVALID_STAGE' };
  if (consent !== true) return { valid: false, reason: 'CONSENT_REQUIRED' };
  if (typeof at !== 'string' || !Number.isFinite(Date.parse(at))) return { valid: false, reason: 'INVALID_INSTANT' };
  if (responses.some(entry => entry.participantId === participantId)) return { valid: false, reason: 'DUPLICATE_PARTICIPANT' };
  return { valid: true, responses: [...responses, { participantId, priceChf, stage, consent, at }] };
}

/**
 * Результат WTP по ценах: частка would_pay на кожну ціну.
 * Публікується лише при >= k відповідях на ціну (зв'язка з C10.L5).
 */
export function wtpCurve(responses = [], { k = 5 } = {}) {
  if (!Array.isArray(responses)) return { valid: false, reason: 'INVALID_RESPONSES' };
  const byPrice = new Map();
  for (const entry of responses) {
    if (!entry || typeof entry !== 'object' || !Number.isFinite(entry.priceChf) || !WTP_STAGES.includes(entry.stage)) return { valid: false, reason: 'INVALID_RESPONSE' };
    const bucket = byPrice.get(entry.priceChf) ?? { asked: 0, wouldPay: 0 };
    bucket.asked++;
    if (entry.stage === 'would_pay') bucket.wouldPay++;
    byPrice.set(entry.priceChf, bucket);
  }
  const curve = [];
  for (const [priceChf, bucket] of [...byPrice.entries()].sort((a, b) => a[0] - b[0])) {
    curve.push({
      priceChf,
      asked: bucket.asked,
      publishable: bucket.asked >= k,
      wouldPayShare: bucket.asked >= k ? Math.round((bucket.wouldPay / bucket.asked) * 100) / 100 : null,
    });
  }
  return { valid: true, curve };
}

/** Мінімальна ціна, де частка would_pay >= поріг (наприклад 0.5); інакше reason. */
export function viablePrice(curve, { threshold = 0.5 } = {}) {
  if (!curve || curve.valid !== true) return { valid: false, reason: 'INVALID_CURVE' };
  if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) return { valid: false, reason: 'INVALID_THRESHOLD' };
  const candidates = curve.curve.filter(point => point.publishable && point.wouldPayShare >= threshold);
  if (candidates.length === 0) return { valid: true, viablePriceChf: null, reason: 'NO_VIABLE_PRICE' };
  return { valid: true, viablePriceChf: candidates[0].priceChf };
}