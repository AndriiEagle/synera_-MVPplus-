import test from 'node:test';
import assert from 'node:assert/strict';
import { actionCost, canPerform, tierMatrix, TIERS, CREDIT_ACTIONS } from './tier-matrix.mjs';

test('C11.L2: вартість дії по тарифах — hand-computed', () => {
  assert.deepEqual(actionCost('free', 'intro_request'), { valid: true, tier: 'free', action: 'intro_request', cost: 1, allowed: true });
  assert.equal(actionCost('pro', 'intro_request').cost, 0, 'pro включає intro');
  assert.equal(actionCost('free', 'priority_match').allowed, false, 'free без пріоритету');
  assert.equal(actionCost('organizer', 'community_case_post').cost, 0);
});

test('C11.L2: gate — базовий матчинг безкоштовний, довіра ніколи не продається', () => {
  const matrix = tierMatrix();
  assert.deepEqual(matrix.guarantees, ['matching_is_free', 'trust_never_sold', 'safety_never_sold']);
  // Жоден тариф не може «купити» вихід за межі дозволених дій.
  for (const tier of TIERS) {
    assert.equal(actionCost(tier, 'buy_trust').reason, 'INVALID_ACTION');
    assert.equal(actionCost(tier, 'bypass_safety').reason, 'INVALID_ACTION');
  }
});

test('C11.L2: canPerform — баланс кредитів учитувається', () => {
  assert.deepEqual(canPerform('free', 'intro_request', 5), { valid: true, allowed: true, cost: 1 });
  assert.deepEqual(canPerform('free', 'intro_request', 1), { valid: true, allowed: true, cost: 1 });
  assert.deepEqual(canPerform('free', 'intro_request', 0), { valid: true, allowed: false, reason: 'INSUFFICIENT_CREDITS', cost: 1 });
  assert.deepEqual(canPerform('free', 'priority_match', 100), { valid: true, allowed: false, reason: 'ACTION_NOT_IN_TIER', cost: null });
  assert.equal(canPerform('free', 'intro_request', -1).reason, 'INVALID_BALANCE');
  assert.equal(canPerform('vip', 'intro_request', 5).reason, 'INVALID_TIER');
});

test('C11.L2: матриця повна і заморожена', () => {
  const matrix = tierMatrix();
  assert.deepEqual(matrix.tiers, TIERS);
  assert.deepEqual(matrix.actions, CREDIT_ACTIONS);
  for (const tier of TIERS) {
    for (const action of CREDIT_ACTIONS) {
      assert.ok(action in matrix.matrix[tier], `${tier}.${action}`);
      assert.ok(typeof matrix.matrix[tier][action] === 'number' || matrix.matrix[tier][action] === 'unavailable');
    }
  }
  assert.equal(Object.isFrozen(matrix), true);
  assert.equal(Object.isFrozen(matrix.matrix), true);
});