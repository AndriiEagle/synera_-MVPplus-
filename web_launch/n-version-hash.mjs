// C02.L8 — N-версійна перевірка критичного агента (дві незалежні реалізації канонізації + хешу).
// Ворота: hash and invalidation agree on 10k generated cases.
// Детерміновано: той самий вхід → той самий вихід. Без випадковості, без мережі, без Date.now().
import { createHash } from 'node:crypto';

const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');

// --- Реалізація A: рекурсивна перебудова з відсортованими ключами, потім JSON.stringify ---
function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = sortValue(value[key]);
    return out;
  }
  return value;
}

export function serializeA(value) {
  return JSON.stringify(sortValue(value));
}

// --- Реалізація B: ручний серіалізатор з явним сортуванням ключів вставками ---
function insertionSorted(keys) {
  const out = [...keys];
  for (let i = 1; i < out.length; i++) {
    const key = out[i];
    let j = i - 1;
    while (j >= 0 && out[j] > key) {
      out[j + 1] = out[j];
      j--;
    }
    out[j + 1] = key;
  }
  return out;
}

export function serializeB(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return '[' + value.map(serializeB).join(',') + ']';
  const type = typeof value;
  if (type === 'boolean') return value ? 'true' : 'false';
  if (type === 'number') return JSON.stringify(value);
  if (type === 'string') return JSON.stringify(value);
  if (type === 'object') {
    const keys = insertionSorted(Object.keys(value));
    return '{' + keys.map(key => JSON.stringify(key) + ':' + serializeB(value[key])).join(',') + '}';
  }
  throw new Error('Непідтримуваний тип значення для канонізації');
}

export function canonicalHashA(value) {
  return sha256(serializeA(value));
}

export function canonicalHashB(value) {
  return sha256(serializeB(value));
}

/**
 * Проганяє обидві реалізації на `count` згенерованих випадках і звіряє хеші.
 * @param {(index: number) => unknown} generator
 * @param {number} count
 */
export function verifyNVersions(generator, count) {
  if (typeof generator !== 'function') return { valid: false, reason: 'INVALID_GENERATOR', agree: false, checked: 0, mismatches: [] };
  if (!Number.isSafeInteger(count) || count < 1) return { valid: false, reason: 'INVALID_COUNT', agree: false, checked: 0, mismatches: [] };
  const mismatches = [];
  for (let i = 0; i < count; i++) {
    const value = generator(i);
    const a = canonicalHashA(value);
    const b = canonicalHashB(value);
    if (a !== b) mismatches.push({ index: i, a, b });
  }
  return { valid: true, agree: mismatches.length === 0, checked: count, mismatches: mismatches.slice(0, 10) };
}
