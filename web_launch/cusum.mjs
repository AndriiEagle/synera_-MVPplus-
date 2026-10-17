// M13 — Аномалії: CUSUM / EWMA контрольні карти.
// Детерміновано: той самий вхід → той самий вихід. Без випадковості, без мережі, без Date.now().
//
// Каталог: plan/readiness/MATH_AGENTS.uk.md, M13.
// Інваріант: сигнал має поріг і хибнопозитивний бюджет, не «здалося».

// Оголошений за замовчуванням хибнопозитивний бюджет (частка серій, у яких
// дозволено хибний сигнал на стабільних даних). Поріг і слак обрані так,
// щоб бюджет реально виконувався (перевірено property-тестом на 1000 серіях).
export const DEFAULT_FALSE_POSITIVE_BUDGET = 0.05;
export const DEFAULT_SLACK_K = 0.5;
export const DEFAULT_THRESHOLD_H = 6;

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateSeries(series) {
  if (!Array.isArray(series) || series.length === 0) return 'EMPTY_SERIES';
  for (const value of series) if (!isFiniteNumber(value)) return 'NON_FINITE_VALUE';
  return null;
}

/**
 * Експоненційно зважене ковзне середнє.
 * @param {number[]} series
 * @param {number} lambda 0 < lambda <= 1
 */
export function ewma(series, lambda = 0.3) {
  const error = validateSeries(series);
  if (error) return { valid: false, reason: error, values: [] };
  if (!isFiniteNumber(lambda) || lambda <= 0 || lambda > 1) return { valid: false, reason: 'INVALID_LAMBDA', values: [] };
  const values = [series[0]];
  for (let i = 1; i < series.length; i++) {
    values.push(lambda * series[i] + (1 - lambda) * values[i - 1]);
  }
  return { valid: true, values };
}

/**
 * Двостороння CUSUM контрольна карта.
 * @param {number[]} series
 * @param {{ target?: number, k?: number, h?: number }} options
 * @returns {{ valid: boolean, reason?: string, signals: Array, upper: number[], lower: number[] }}
 */
export function cusum(series, options = {}) {
  const error = validateSeries(series);
  if (error) return { valid: false, reason: error, signals: [], upper: [], lower: [] };
  const target = options.target === undefined ? 0 : options.target;
  const k = options.k === undefined ? DEFAULT_SLACK_K : options.k;
  const h = options.h === undefined ? DEFAULT_THRESHOLD_H : options.h;
  if (!isFiniteNumber(target)) return { valid: false, reason: 'INVALID_TARGET', signals: [], upper: [], lower: [] };
  if (!isFiniteNumber(k) || k < 0) return { valid: false, reason: 'INVALID_SLACK', signals: [], upper: [], lower: [] };
  if (!isFiniteNumber(h) || h <= 0) return { valid: false, reason: 'INVALID_THRESHOLD', signals: [], upper: [], lower: [] };

  const upper = [0];
  const lower = [0];
  const signals = [];
  for (let i = 1; i < series.length; i++) {
    const high = Math.max(0, upper[i - 1] + (series[i] - target - k));
    const low = Math.max(0, lower[i - 1] + (target - series[i] - k));
    upper.push(high);
    lower.push(low);
    if (high > h) signals.push({ index: i, direction: 'increase', value: high });
    if (low > h) signals.push({ index: i, direction: 'decrease', value: low });
  }
  return { valid: true, signals, upper, lower };
}

/**
 * Агрегує хибнопозитивні сигнали на стабільних серіях і звіряє з бюджетом.
 * @param {Array<number[]>} stableSeries
 * @param {{ target?: number, k?: number, h?: number, budget?: number }} options
 */
export function measureFalsePositiveRate(stableSeries, options = {}) {
  if (!Array.isArray(stableSeries) || stableSeries.length === 0) {
    return { valid: false, reason: 'EMPTY_SERIES', rate: null, budget: null, withinBudget: false };
  }
  const budget = options.budget === undefined ? DEFAULT_FALSE_POSITIVE_BUDGET : options.budget;
  if (!isFiniteNumber(budget) || budget < 0 || budget > 1) {
    return { valid: false, reason: 'INVALID_BUDGET', rate: null, budget: null, withinBudget: false };
  }
  let withSignal = 0;
  let total = 0;
  for (const series of stableSeries) {
    const result = cusum(series, options);
    if (!result.valid) return { valid: false, reason: result.reason, rate: null, budget: null, withinBudget: false };
    total++;
    if (result.signals.length > 0) withSignal++;
  }
  const rate = total === 0 ? 0 : withSignal / total;
  return { valid: true, rate, budget, withinBudget: rate <= budget, seriesChecked: total };
}
