import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNeedFreshness,
  filterAndLimitNeeds,
  DEFAULT_TAU_DAYS,
  DEFAULT_CUTOFF_SCORE,
  MAX_ACTIVE_NEEDS_PER_PERSON
} from './need-decay.mjs';

test('need-decay: freshly created need has score near 1.0', () => {
  const now = new Date('2026-09-19T12:00:00Z');
  const fresh = calculateNeedFreshness(now, now);
  assert.equal(fresh.score, 1.0);
  assert.equal(fresh.is_stale, false);
  assert.equal(fresh.age_days, 0);
});

test('need-decay: future timestamp is explicitly invalid/stale', () => {
  const now = new Date('2026-09-19T12:00:00Z');
  const future = new Date('2026-09-20T12:00:00Z');
  const res = calculateNeedFreshness(future, now);
  assert.equal(res.score, 0.0);
  assert.equal(res.is_stale, true);
  assert.equal(res.age_days, 0);
});

test('need-decay: decaying follows exponential curve', () => {
  const t0 = new Date('2026-08-01T00:00:00Z');
  const t30d = new Date('2026-08-31T00:00:00Z'); // 30 days later = 1 tau
  const res = calculateNeedFreshness(t0, t30d, 30);
  
  // exp(-1) ~= 0.3679
  assert.ok(Math.abs(res.score - 0.3679) < 0.01);
  assert.equal(res.is_stale, false);

  // 90 days later = 3 tau -> exp(-3) ~= 0.0498 < 0.10 cutoff
  const t90d = new Date('2026-10-30T00:00:00Z');
  const resStale = calculateNeedFreshness(t0, t90d, 30);
  assert.ok(resStale.score < DEFAULT_CUTOFF_SCORE);
  assert.equal(resStale.is_stale, true);
});

test('need-decay: filterAndLimitNeeds discards stale needs and limits per-user quota', () => {
  const now = new Date('2026-09-19T12:00:00Z');
  const oneDayAgo = new Date('2026-09-18T12:00:00Z').toISOString();
  const ninetyDaysAgo = new Date('2026-06-21T12:00:00Z').toISOString();

  const needs = [
    { id: '1', owner_id: 'user_a', created_at: oneDayAgo },
    { id: '2', owner_id: 'user_a', created_at: oneDayAgo },
    { id: '3', owner_id: 'user_a', created_at: oneDayAgo },
    { id: '4', owner_id: 'user_a', created_at: oneDayAgo }, // 4th should be capped (max 3)
    { id: '5', owner_id: 'user_b', created_at: ninetyDaysAgo }, // should be discarded (stale)
    { id: '6', owner_id: 'user_b', created_at: oneDayAgo }
  ];

  const filtered = filterAndLimitNeeds(needs, { now, maxPerPerson: 3 });
  assert.equal(filtered.length, 4); // 3 from user_a, 1 from user_b
  assert.deepEqual(filtered.map(n => n.id), ['1', '2', '3', '6']);
});
