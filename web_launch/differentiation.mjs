// C12.L3 — Тест відмінності: парне порівняння з ручним знайомством у пілоті.
// Gate: статистична потужність розрахована ДО експерименту; пари не підрізаються.
// Детерміновано, чисто.

const VALID_ID = value => typeof value === 'string' && value.length >= 1 && value.length <= 64 && /^[A-Za-z0-9_:-]+$/.test(value);

/**
 * Потужність: мінімальний розмір вибірки на групу для виявлення ефекту d
 * (нормальна апроксимація, двобічний тест, alpha=0.05 за замовчуванням).
 * n ≈ 2 * (z_alpha/2 + z_power)^2 / d^2 — канонічна формула для двох середніх.
 */
export function requiredSampleSize({ effectSize, alpha = 0.05, power = 0.8 } = {}) {
  if (!Number.isFinite(effectSize) || effectSize <= 0 || effectSize > 5) return { valid: false, reason: 'INVALID_EFFECT_SIZE' };
  if (!Number.isFinite(alpha) || alpha <= 0 || alpha >= 1) return { valid: false, reason: 'INVALID_ALPHA' };
  if (!Number.isFinite(power) || power <= 0 || power >= 1) return { valid: false, reason: 'INVALID_POWER' };
  const zAlpha = inverseNormalCdf(1 - alpha / 2);
  const zPower = inverseNormalCdf(power);
  const n = 2 * Math.pow(zAlpha + zPower, 2) / (effectSize * effectSize);
  return { valid: true, perGroup: Math.ceil(n), alpha, power, effectSize };
}

/** Апроксимація оберненої нормальної CDF (Acklam), без зовнішніх залежностей. */
function inverseNormalCdf(p) {
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pLow = 0.02425;
  if (p <= 0 || p >= 1) throw new Error('Некоректна ймовірність');
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pLow) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/**
 * Аналіз завершених пар: різниця результатів synera vs manual на тих самих учасниках.
 * @param {Array<{ pairId: string, syneraOutcome: number, manualOutcome: number }>} pairs
 */
export function pairedDifference(pairs = []) {
  if (!Array.isArray(pairs)) return { valid: false, reason: 'INVALID_PAIRS' };
  const seen = new Set();
  const diffs = [];
  for (const pair of pairs) {
    if (!pair || typeof pair !== 'object' || !VALID_ID(pair.pairId)) return { valid: false, reason: 'INVALID_PAIR' };
    if (seen.has(pair.pairId)) return { valid: false, reason: 'DUPLICATE_PAIR' };
    seen.add(pair.pairId);
    if (!Number.isFinite(pair.syneraOutcome) || !Number.isFinite(pair.manualOutcome)) return { valid: false, reason: 'INVALID_OUTCOME' };
    diffs.push(pair.syneraOutcome - pair.manualOutcome);
  }
  if (diffs.length === 0) return { valid: true, pairs: 0, meanDiff: null, reason: 'NO_PAIRS' };
  const mean = diffs.reduce((sum, v) => sum + v, 0) / diffs.length;
  const variance = diffs.length > 1 ? diffs.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (diffs.length - 1) : 0;
  const se = Math.sqrt(variance / diffs.length);
  const t = se > 0 ? mean / se : 0;
  return {
    valid: true,
    pairs: diffs.length,
    meanDiff: Math.round(mean * 10000) / 10000,
    standardError: Math.round(se * 10000) / 10000,
    tStatistic: Math.round(t * 10000) / 10000,
    // Попередній вердикт: сигнальний, не фінальний — фінальне рішення за оператором (H2).
    preliminary: Math.abs(t) > 2 ? 'significant' : 'not_significant',
  };
}