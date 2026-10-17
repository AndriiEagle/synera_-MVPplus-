// M14 — Адаптація UI: Thompson sampling (Beta-Bernoulli) серед ПОГОДЖЕНИХ варіантів.
// Детерміновано за заданим seed: той самий seed → та сама послідовність виборів.
// Каталог: plan/readiness/MATH_AGENTS.uk.md, M14.
// Інваріант: заблокований варіант (WCAG-підлога / приховування згод) ніколи не обирається.

// --- Детермінований PRNG (власний LCG). Ніякого Math.random. ---
export function createRng(seed = 1) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function normal(rng) {
  let u = 0;
  let v = 0;
  while (u <= 0) u = rng();
  while (v <= 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Marsaglia–Tsang для Gamma(shape, scale=1), shape >= 1.
function gammaSample(shape, rng) {
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x;
    let v;
    do {
      x = normal(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function betaSample(a, b, rng) {
  const g1 = gammaSample(a, rng);
  const g2 = gammaSample(b, rng);
  const sum = g1 + g2;
  if (!(sum > 0)) return 0.5;
  return g1 / sum;
}

/**
 * Створює бандита з початковими пріорами Beta(1,1).
 * @param {string[]} variantIds
 * @param {{ blocked?: string[] }} options
 */
export function createBandit(variantIds, options = {}) {
  if (!Array.isArray(variantIds) || variantIds.length === 0) return { valid: false, reason: 'INVALID_VARIANTS' };
  const order = [];
  const variants = {};
  for (const id of variantIds) {
    if (typeof id !== 'string' || !id || Object.hasOwn(variants, id)) return { valid: false, reason: 'INVALID_VARIANTS' };
    order.push(id);
    variants[id] = { alpha: 1, beta: 1 };
  }
  const blocked = {};
  for (const id of Array.isArray(options.blocked) ? options.blocked : []) {
    if (!Object.hasOwn(variants, id)) return { valid: false, reason: 'UNKNOWN_BLOCKED_VARIANT' };
    blocked[id] = true;
  }
  return { valid: true, order, variants, blocked };
}

/**
 * Оновлює апостеріор Beta для одного варіанта. Повертає нового бандита (не мутує вхід).
 */
export function recordOutcome(bandit, variantId, success) {
  if (!bandit || bandit.valid !== true) return { valid: false, reason: 'INVALID_BANDIT' };
  if (!Object.hasOwn(bandit.variants, variantId)) return { valid: false, reason: 'UNKNOWN_VARIANT' };
  const previous = bandit.variants[variantId];
  const next = success === true
    ? { alpha: previous.alpha + 1, beta: previous.beta }
    : { alpha: previous.alpha, beta: previous.beta + 1 };
  return {
    valid: true,
    order: bandit.order,
    variants: { ...bandit.variants, [variantId]: next },
    blocked: bandit.blocked,
  };
}

/**
 * Вибирає варіант через Thompson sampling. Заблоковані ніколи не обираються.
 * @returns {{ valid: boolean, reason?: string, variantId?: string, samples?: object }}
 */
export function selectVariant(bandit, { rng = createRng(1) } = {}) {
  if (!bandit || bandit.valid !== true) return { valid: false, reason: 'INVALID_BANDIT' };
  if (typeof rng !== 'function') return { valid: false, reason: 'INVALID_RNG' };
  const available = bandit.order.filter(id => !bandit.blocked[id]);
  if (available.length === 0) return { valid: false, reason: 'ALL_VARIANTS_BLOCKED' };
  const samples = {};
  let best = null;
  for (const id of available) {
    const { alpha, beta } = bandit.variants[id];
    const sample = betaSample(alpha, beta, rng);
    samples[id] = sample;
    if (best === null || sample > samples[best]) best = id;
  }
  return { valid: true, variantId: best, samples };
}

/** Оракул для тесту: чи заблокований варіант. */
export function isBlocked(bandit, variantId) {
  return Boolean(bandit && bandit.blocked && bandit.blocked[variantId]);
}
