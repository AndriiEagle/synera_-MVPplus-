import test from 'node:test';
import assert from 'node:assert/strict';
import { requiredSampleSize, pairedDifference } from './differentiation.mjs';

test('C12.L3: потужність — канонічна формула (d=0.5 -> 63/групу, d=0.8 -> 25)', () => {
  // n = 2*(z_a/2 + z_p)^2/d^2: d=0.5 -> 62.79 -> 63; d=0.8 -> 24.5 -> 25 (ceil).
  assert.equal(requiredSampleSize({ effectSize: 0.5 }).perGroup, 63);
  assert.equal(requiredSampleSize({ effectSize: 0.8 }).perGroup, 25);
  const biggerAlpha = requiredSampleSize({ effectSize: 0.5, alpha: 0.1 });
  assert.ok(biggerAlpha.perGroup < 63, 'мякший alpha -> менша вибірка');
  const morePower = requiredSampleSize({ effectSize: 0.5, power: 0.9 });
  assert.ok(morePower.perGroup > 63, 'більша потужність -> більша вибірка');
});

test('C12.L3: некоректні параметри потужності — reason codes, не throw', () => {
  assert.equal(requiredSampleSize({ effectSize: 0 }).reason, 'INVALID_EFFECT_SIZE');
  assert.equal(requiredSampleSize({ effectSize: -1 }).reason, 'INVALID_EFFECT_SIZE');
  assert.equal(requiredSampleSize({ effectSize: 9 }).reason, 'INVALID_EFFECT_SIZE');
  assert.equal(requiredSampleSize({ effectSize: 0.5, alpha: 0 }).reason, 'INVALID_ALPHA');
  assert.equal(requiredSampleSize({ effectSize: 0.5, alpha: 1 }).reason, 'INVALID_ALPHA');
  assert.equal(requiredSampleSize({ effectSize: 0.5, power: 0 }).reason, 'INVALID_POWER');
  assert.equal(requiredSampleSize({ effectSize: 0.5, power: 1 }).reason, 'INVALID_POWER');
});

test('C12.L3: парна різниця — hand-computed fixture', () => {
  // diffs=[3,0,5,0]: mean=2, var=(1+4+9+4)/3=6, se=sqrt(1.5)=1.2247, t=1.633 < 2.
  const result = pairedDifference([
    { pairId: 'p1', syneraOutcome: 8, manualOutcome: 5 },
    { pairId: 'p2', syneraOutcome: 6, manualOutcome: 6 },
    { pairId: 'p3', syneraOutcome: 9, manualOutcome: 4 },
    { pairId: 'p4', syneraOutcome: 5, manualOutcome: 5 },
  ]);
  assert.equal(result.valid, true);
  assert.equal(result.pairs, 4);
  assert.equal(result.meanDiff, 2);
  assert.equal(result.tStatistic, 1.633);
  assert.equal(result.preliminary, 'not_significant', 't=1.63 < 2 — чесно не значуще на 4 парах');
  // Більший узгоджений ефект — значущий.
  const strong = pairedDifference([
    { pairId: 'p1', syneraOutcome: 9, manualOutcome: 1 },
    { pairId: 'p2', syneraOutcome: 8, manualOutcome: 2 },
    { pairId: 'p3', syneraOutcome: 9, manualOutcome: 2 },
    { pairId: 'p4', syneraOutcome: 8, manualOutcome: 1 },
  ]);
  assert.equal(strong.preliminary, 'significant');
});

test('C12.L3: дублі пари і невалідні результати відхилені; порожній набір чесний', () => {
  const base = [{ pairId: 'p1', syneraOutcome: 8, manualOutcome: 5 }];
  assert.equal(pairedDifference(base.concat([{ pairId: 'p1', syneraOutcome: 1, manualOutcome: 1 }])).reason, 'DUPLICATE_PAIR');
  assert.equal(pairedDifference([{ pairId: 'p1', syneraOutcome: 'x', manualOutcome: 5 }]).reason, 'INVALID_OUTCOME');
  assert.equal(pairedDifference([{ pairId: '', syneraOutcome: 1, manualOutcome: 1 }]).reason, 'INVALID_PAIR');
  assert.equal(pairedDifference('nope').reason, 'INVALID_PAIRS');
  const empty = pairedDifference([]);
  assert.equal(empty.valid, true);
  assert.equal(empty.pairs, 0);
  assert.equal(empty.meanDiff, null);
  assert.equal(empty.reason, 'NO_PAIRS');
});

test('C12.L3: нульова дисперсія не ділить на нуль', () => {
  const result = pairedDifference([
    { pairId: 'p1', syneraOutcome: 5, manualOutcome: 5 },
    { pairId: 'p2', syneraOutcome: 7, manualOutcome: 7 },
  ]);
  assert.equal(result.valid, true);
  assert.equal(result.meanDiff, 0);
  assert.equal(result.tStatistic, 0);
  assert.equal(result.preliminary, 'not_significant');
});