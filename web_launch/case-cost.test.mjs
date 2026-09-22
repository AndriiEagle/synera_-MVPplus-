import test from 'node:test';
import assert from 'node:assert/strict';
import { caseCost, pilotCost, perCaseAverage } from './case-cost.mjs';

const cost = overrides => ({ caseId: 'c-1', operatorMinutes: 30, operatorCategory: 'moderation', aiCalls: 2, cashMinor: 500, currency: 'CHF', ...overrides });

test('C11.L1: кошторис кейса — точні значення', () => {
  const result = caseCost(cost());
  assert.equal(result.valid, true);
  assert.equal(result.operatorMinutes, 30);
  assert.equal(result.aiCalls, 2);
  assert.equal(result.cashMinor, 500);
  assert.equal(result.cashKnown, true);
});

test('C11.L1: невиміряні гроші — unknown, а не нуль (gate)', () => {
  const result = caseCost(cost({ cashMinor: null, currency: undefined }));
  assert.equal(result.valid, true);
  assert.equal(result.cashKnown, false);
  assert.equal(result.cashMinor, null);
  assert.equal(result.currency, null);
});

test('C11.L1: некоректний вхід — reason codes, не throw', () => {
  for (const bad of [cost({ caseId: '' }), cost({ operatorMinutes: -1 }), cost({ operatorMinutes: 1.5 }), cost({ aiCalls: -2 }), cost({ cashMinor: -100 }), cost({ cashMinor: 100, currency: 'chf' }), cost({ cashMinor: 100, currency: 'CHF!' })]) {
    assert.equal(caseCost(bad).valid, false, JSON.stringify(bad));
  }
});

test('C11.L1: агрегат пілота — суми + чесний unknownCashCases', () => {
  const result = pilotCost([cost(), cost({ caseId: 'c-2', cashMinor: null, currency: undefined }), cost({ caseId: 'c-3', operatorMinutes: 10, aiCalls: 0, cashMinor: 250 })]);
  assert.equal(result.valid, true);
  assert.equal(result.caseCount, 3);
  assert.equal(result.operatorMinutes, 70);
  assert.equal(result.aiCalls, 4);
  assert.equal(result.cashMinor, 750);
  assert.equal(result.unknownCashCases, 1);
  assert.equal(result.currency, 'CHF');
});

test('C11.L1: змішані валюти відхилені; порожній пілот; середнє', () => {
  assert.equal(pilotCost([cost(), cost({ caseId: 'c-2', currency: 'EUR' })]).reason, 'MIXED_CURRENCIES');
  const empty = pilotCost([]);
  assert.equal(empty.valid, true);
  assert.equal(empty.cashMinor, null);
  assert.equal(perCaseAverage(empty).reason, 'NO_CASES');
  assert.equal(perCaseAverage(null).reason, 'INVALID_PILOT');
  const avg = perCaseAverage(pilotCost([cost(), cost({ caseId: 'c-2', operatorMinutes: 10, aiCalls: 4, cashMinor: 100 })]));
  assert.equal(avg.operatorMinutesPerCase, 20);
  assert.equal(avg.aiCallsPerCase, 3);
  assert.equal(avg.cashMinorPerCase, 300);
  assert.equal(avg.currency, 'CHF');
});