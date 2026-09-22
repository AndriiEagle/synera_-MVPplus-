import test from 'node:test';
import assert from 'node:assert/strict';
import { ewma, cusum, measureFalsePositiveRate, DEFAULT_FALSE_POSITIVE_BUDGET } from './cusum.mjs';

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function standardNormal(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

test('M13: EWMA дорівнює порахованому вручну значенню', () => {
  const result = ewma([1, 2, 3], 0.5);
  assert.equal(result.valid, true);
  assert.equal(result.values[0], 1);
  assert.equal(result.values[1], 1.5);
  assert.equal(result.values[2], 2.25);
});

test('M13: CUSUM виявляє зсув середнього після 20 стабільних точок', () => {
  const series = [...Array(20).fill(0), ...Array(10).fill(3)];
  const result = cusum(series, { target: 0, k: 0.5, h: 6 });
  assert.equal(result.valid, true);
  const increases = result.signals.filter(s => s.direction === 'increase');
  assert.ok(increases.length > 0, 'мав бути сигнал про зростання');
  assert.ok(increases[0].index >= 21 && increases[0].index <= 24, `індекс сигналу ${increases[0].index}`);
});

test('M13: стабільна серія не дає хибного сигналу в межах бюджету', () => {
  const stable = Array(20).fill(0);
  const result = cusum(stable, { target: 0, k: 0.5, h: 6 });
  assert.equal(result.valid, true);
  assert.deepEqual(result.signals, []);
});

test('M13: некоректний вхід повертає valid=false з кодом причини, не кидає', () => {
  assert.deepEqual(ewma([], 0.3).reason, 'EMPTY_SERIES');
  assert.deepEqual(ewma([1, Number.NaN], 0.3).reason, 'NON_FINITE_VALUE');
  assert.deepEqual(ewma([1, 2], 0).reason, 'INVALID_LAMBDA');
  assert.deepEqual(ewma([1, 2], 1.5).reason, 'INVALID_LAMBDA');
  assert.deepEqual(cusum([]).reason, 'EMPTY_SERIES');
  assert.deepEqual(cusum([1, 2], { k: -1 }).reason, 'INVALID_SLACK');
  assert.deepEqual(cusum([1, 2], { h: 0 }).reason, 'INVALID_THRESHOLD');
  assert.deepEqual(cusum([1, 2], { target: Number.POSITIVE_INFINITY }).reason, 'INVALID_TARGET');
  for (const bad of [ewma([], 0.3), cusum([]), cusum([1, 2], { k: -1 })]) assert.equal(bad.valid, false);
});

test('M13: властивість — хибнопозитивна частка на 1000 стабільних серіях у межах бюджету', () => {
  const rng = createRng(20260922);
  const stableSeries = [];
  for (let i = 0; i < 1000; i++) {
    const series = [];
    for (let j = 0; j < 20; j++) series.push(standardNormal(rng));
    stableSeries.push(series);
  }
  const measured = measureFalsePositiveRate(stableSeries, { target: 0, k: 0.5, h: 6 });
  assert.equal(measured.valid, true);
  assert.equal(measured.seriesChecked, 1000);
  assert.ok(measured.rate <= DEFAULT_FALSE_POSITIVE_BUDGET, `частка ${measured.rate} > бюджет ${measured.budget}`);
  assert.equal(measured.withinBudget, true);
});
