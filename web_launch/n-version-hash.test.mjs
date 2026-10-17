import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeA, serializeB, canonicalHashA, canonicalHashB, verifyNVersions } from './n-version-hash.mjs';

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// Генератор лише «добре вихованих» JSON-значень: без NaN, Infinity і функцій.
function randomValue(rng, depth) {
  const roll = rng();
  if (depth <= 0 || roll < 0.12) return null;
  if (roll < 0.26) return rng() < 0.5;
  if (roll < 0.46) return Math.floor(rng() * 2001) - 1000;
  if (roll < 0.6) return Math.round((rng() * 200 - 100) * 100) / 100;
  if (roll < 0.78) return ['alpha', 'бета', 'γ', 'ключ', 'value', 'Ölçüm'][Math.floor(rng() * 6)] + Math.floor(rng() * 100);
  if (roll < 0.9) {
    const length = Math.floor(rng() * 4);
    return Array.from({ length }, () => randomValue(rng, depth - 1));
  }
  const length = Math.floor(rng() * 4);
  const object = {};
  for (let i = 0; i < length; i++) {
    const key = ['a', 'b', 'ключ', 'z', 'name', 'нотатка'][Math.floor(rng() * 6)] + Math.floor(rng() * 50);
    object[key] = randomValue(rng, depth - 1);
  }
  return object;
}

test('C02.L8: обидві реалізації дають однаковий рядок і хеш на малій фікстурі', () => {
  const fixture = { b: 2, a: [1, { z: 'останній', a: true }], n: null };
  assert.equal(serializeA(fixture), serializeB(fixture));
  assert.equal(canonicalHashA(fixture), canonicalHashB(fixture));
  assert.match(canonicalHashA(fixture), /^[a-f0-9]{64}$/);
});

test('C02.L8: порядок ключів не змінює хеш (обидві реалізації)', () => {
  const first = { alpha: 1, beta: { inner: 2, outer: 3 }, gamma: [1, 2, 3] };
  const second = { gamma: [1, 2, 3], beta: { outer: 3, inner: 2 }, alpha: 1 };
  assert.equal(canonicalHashA(first), canonicalHashA(second));
  assert.equal(canonicalHashB(first), canonicalHashB(second));
});

test('C02.L8: зміна значення змінює хеш (обидві реалізації)', () => {
  const base = { alpha: 1, beta: { inner: 2 } };
  const changed = { alpha: 1, beta: { inner: 3 } };
  assert.notEqual(canonicalHashA(base), canonicalHashA(changed));
  assert.notEqual(canonicalHashB(base), canonicalHashB(changed));
});

test('C02.L8: 10 000 згенерованих випадків — реалізації збігаються', () => {
  const rng = createRng(20260922);
  const generator = () => randomValue(rng, 3);
  const result = verifyNVersions(generator, 10000);
  assert.equal(result.valid, true);
  assert.equal(result.agree, true);
  assert.equal(result.checked, 10000);
  assert.deepEqual(result.mismatches, []);
});

test('C02.L8: некоректні аргументи повертають valid=false, не кидають', () => {
  assert.equal(verifyNVersions(null, 10).valid, false);
  assert.equal(verifyNVersions(null, 10).reason, 'INVALID_GENERATOR');
  assert.equal(verifyNVersions(() => ({}), 0).reason, 'INVALID_COUNT');
  assert.equal(verifyNVersions(() => ({}), 0).valid, false);
});
