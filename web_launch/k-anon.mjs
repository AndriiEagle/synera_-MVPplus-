// C10.L5 — Публічна статистика з k-анонімністю (k=5).
// Gate: жодна підрахована група менша за k не показується; Laplace-шум детермінований (seed).
// Каталог: READINESS_DNA C10.L5. Детерміновано: без мережі, без Date.now().

export const DEFAULT_K = 5;

const VALID_ID = value => typeof value === 'string' && value.length >= 1 && value.length <= 64 && /^[A-Za-z0-9_:-]+$/.test(value);

// Детермінований Laplace-подібний шум: сімейство рівномірних зміщень, замірних за seed.
// (Повний Laplace потребував би лог-рівномірних знаків — тут достатньо відтворюваного шуму
//  з нульовим середнім, бо gate — це k-анонімність, а шум лише ускладнює реконструкцію окремиць.)
export function noisyCount(count, { k = DEFAULT_K, seed = 1 } = {}) {
  if (!Number.isSafeInteger(count) || count < 0) return { valid: false, reason: 'INVALID_COUNT' };
  if (!Number.isSafeInteger(k) || k < 2) return { valid: false, reason: 'INVALID_K' };
  let state = (seed >>> 0) || 1;
  state = (state * 1664525 + 1013904223) >>> 0;
  const unit = (state / 4294967296) * 2 - 1; // [-1, 1), нульове середнє по серії seed'ів
  const jitter = Math.round(unit * Math.max(1, Math.floor(k / 2)));
  return { valid: true, value: Math.max(0, count + jitter) };
}

/**
 * Публікує лише ті групи, де учасників >= k. Дрібні групи зливаються у 'інші'.
 * @param {Array<{group: string, count: number}>} buckets
 * @param {{ k?: number, seed?: number }} options
 */
export function publishStats(buckets, options = {}) {
  const k = options.k === undefined ? DEFAULT_K : options.k;
  if (!Array.isArray(buckets)) return { valid: false, reason: 'INVALID_BUCKETS' };
  if (!Number.isSafeInteger(k) || k < 2) return { valid: false, reason: 'INVALID_K' };
  const seen = new Set();
  for (const bucket of buckets) {
    if (!bucket || typeof bucket !== 'object' || !VALID_ID(bucket.group) || typeof bucket.group === 'string' && bucket.group === 'other') return { valid: false, reason: 'INVALID_BUCKET' };
    if (!Number.isSafeInteger(bucket.count) || bucket.count < 0) return { valid: false, reason: 'INVALID_COUNT' };
    if (seen.has(bucket.group)) return { valid: false, reason: 'DUPLICATE_GROUP' };
    seen.add(bucket.group);
  }
  let other = 0;
  const published = [];
  for (const bucket of [...buckets].sort((a, b) => b.count - a.count || a.group.localeCompare(b.group))) {
    if (bucket.count >= k) {
      const noisy = noisyCount(bucket.count, { k, seed: options.seed ?? 1 + bucket.group.length });
      published.push({ group: bucket.group, count: noisy.value });
    } else {
      other += bucket.count;
    }
  }
  // Сама зливаюча група теж підпорядкована k: дрібниці не показуємо взагалі.
  const result = other >= k
    ? [...published, { group: 'other', count: noisyCount(other, { k, seed: options.seed ?? 7 }).value }]
    : published;
  return { valid: true, k, stats: result };
}

/**
 * Чи можна показати одну конкретну цифру про людину? Ні, якщо вона ідентифікує менш ніж k осіб.
 * Використовується як оракул для інтеграцій (наприклад, картка спільноти).
 */
export function canPublish(groupSize, { k = DEFAULT_K } = {}) {
  if (!Number.isSafeInteger(groupSize) || groupSize < 0) return { valid: false, reason: 'INVALID_COUNT', allowed: false };
  if (!Number.isSafeInteger(k) || k < 2) return { valid: false, reason: 'INVALID_K', allowed: false };
  return { valid: true, allowed: groupSize >= k };
}