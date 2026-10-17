import test from 'node:test';
import assert from 'node:assert/strict';
import { createBandit, createRng, recordOutcome, selectVariant, isBlocked } from './thompson.mjs';

test('M14: кращий варіант обирається частіше за 200 детермінованих спроб', () => {
  const rng = createRng(42);
  let bandit = createBandit(['A', 'B']);
  const trueRate = { A: 0.8, B: 0.2 };
  const counts = { A: 0, B: 0 };
  for (let i = 0; i < 200; i++) {
    const pick = selectVariant(bandit, { rng });
    assert.equal(pick.valid, true);
    counts[pick.variantId]++;
    const success = rng() < trueRate[pick.variantId];
    bandit = recordOutcome(bandit, pick.variantId, success);
  }
  assert.ok(counts.A > counts.B, `A=${counts.A}, B=${counts.B}`);
});

test('M14: заблокований варіант не обирається навіть із alpha=1000', () => {
  const bandit = {
    valid: true,
    order: ['A', 'B'],
    variants: { A: { alpha: 1000, beta: 0 }, B: { alpha: 1, beta: 1 } },
    blocked: { A: true },
  };
  for (let i = 0; i < 100; i++) {
    const pick = selectVariant(bandit, { rng: createRng(i + 1) });
    assert.equal(pick.valid, true);
    assert.equal(pick.variantId, 'B');
    assert.equal(isBlocked(bandit, 'A'), true);
  }
});

test('M14: той самий seed дає ідентичну послідовність виборів', () => {
  const sequence = seed => {
    let bandit = createBandit(['A', 'B', 'C']);
    const rng = createRng(seed);
    const picks = [];
    for (let i = 0; i < 50; i++) {
      const pick = selectVariant(bandit, { rng });
      picks.push(pick.variantId);
      bandit = recordOutcome(bandit, pick.variantId, i % 3 === 0);
    }
    return picks;
  };
  assert.deepEqual(sequence(7), sequence(7));
});

test('M14: невідомий варіант і некоректний вхід повертають valid=false, не кидають', () => {
  const bandit = createBandit(['A', 'B']);
  assert.equal(recordOutcome(bandit, 'C', true).valid, false);
  assert.equal(recordOutcome(bandit, 'C', true).reason, 'UNKNOWN_VARIANT');
  assert.equal(selectVariant({ valid: false }).valid, false);
  assert.equal(selectVariant(bandit, { rng: 'not a function' }).valid, false);
  assert.equal(createBandit([]).valid, false);
  assert.equal(createBandit(['A', 'A']).valid, false);
  assert.equal(createBandit(['A'], { blocked: ['Z'] }).valid, false);
  const allBlocked = { valid: true, order: ['A'], variants: { A: { alpha: 1, beta: 1 } }, blocked: { A: true } };
  assert.equal(selectVariant(allBlocked).reason, 'ALL_VARIANTS_BLOCKED');
});

test('M14: апостеріор Beta оновлюється правильно і вхід не мутується', () => {
  const original = createBandit(['A']);
  let bandit = original;
  bandit = recordOutcome(bandit, 'A', true);
  bandit = recordOutcome(bandit, 'A', true);
  bandit = recordOutcome(bandit, 'A', true);
  bandit = recordOutcome(bandit, 'A', false);
  assert.deepEqual(bandit.variants.A, { alpha: 4, beta: 2 });
  assert.deepEqual(original.variants.A, { alpha: 1, beta: 1 });
});
