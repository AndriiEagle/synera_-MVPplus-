import test from 'node:test';
import assert from 'node:assert/strict';
import { publishStats, canPublish, noisyCount, DEFAULT_K } from './k-anon.mjs';

test('C10.L5: групи < k зливаються в other, >= k публікуються', () => {
  const result = publishStats([
    { group: 'zurich', count: 40 },
    { group: 'winterthur', count: 3 },
    { group: 'zug', count: 7 },
    { group: 'basel', count: 1 },
  ]);
  assert.equal(result.valid, true);
  assert.equal(result.k, DEFAULT_K);
  const groups = result.stats.map(s => s.group);
  assert.ok(groups.includes('zurich'));
  assert.ok(groups.includes('zug'));
  assert.ok(!groups.includes('winterthur'), 'дрібна група не публікується');
  assert.ok(!groups.includes('basel'));
});

test('C10.L5: шум детермінований — той самий seed дає те саме значення; межі [0, count + k/2]', () => {
  const first = noisyCount(40, { seed: 42 }).value;
  const second = noisyCount(40, { seed: 42 }).value;
  assert.equal(first, second);
  for (let seed = 1; seed <= 50; seed++) {
    const value = noisyCount(40, { seed }).value;
    assert.ok(value >= 0 && value <= 40 + Math.floor(DEFAULT_K / 2), `seed ${seed}: ${value}`);
  }
});

test('C10.L5: публікація не розкриває окремицю — 1 людина ніколи не публікується при будь-якому seed', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const result = publishStats([{ group: 'tiny', count: 1 }], { seed });
    assert.deepEqual(result.stats, [], `seed ${seed} витік`);
  }
});

test('C10.L5: зливаюча група other теж поважає k', () => {
  const result = publishStats([{ group: 'a', count: 10 }, { group: 'b', count: 2 }]);
  const other = result.stats.find(s => s.group === 'other');
  assert.equal(other, undefined, '2 < k: other не публікується');
  const big = publishStats([{ group: 'a', count: 10 }, { group: 'b', count: 2 }, { group: 'c', count: 3 }]);
  assert.ok(big.stats.find(s => s.group === 'other'), '5 >= k: other публікується');
});

test('C10.L5: canPublish — оракул для однієї цифри', () => {
  assert.equal(canPublish(5).allowed, true);
  assert.equal(canPublish(4).allowed, false);
  assert.equal(canPublish(0).allowed, false);
  assert.equal(canPublish(-1).valid, false);
  assert.equal(canPublish(10, { k: 10 }).allowed, true);
  assert.equal(canPublish(9, { k: 10 }).allowed, false);
  assert.equal(canPublish(5, { k: 1 }).reason, 'INVALID_K');
});

test('C10.L5: некоректний вхід — reason codes, не throw', () => {
  assert.equal(publishStats(null).reason, 'INVALID_BUCKETS');
  assert.equal(publishStats([{ group: 'a', count: -1 }]).reason, 'INVALID_COUNT');
  assert.equal(publishStats([{ group: 'a', count: 5 }, { group: 'a', count: 5 }]).reason, 'DUPLICATE_GROUP');
  assert.equal(publishStats([{ group: 'other', count: 5 }]).reason, 'INVALID_BUCKET');
  assert.equal(publishStats([{ group: '', count: 5 }]).reason, 'INVALID_BUCKET');
  assert.equal(publishStats([], { k: 1 }).reason, 'INVALID_K');
  assert.equal(noisyCount(-1).reason, 'INVALID_COUNT');
  assert.equal(noisyCount(5, { k: 1 }).reason, 'INVALID_K');
});