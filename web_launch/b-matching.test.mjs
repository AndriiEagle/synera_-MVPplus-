import test from 'node:test';
import assert from 'node:assert/strict';
import { solveBMatching } from './b-matching.mjs';

test('M07: solves classic counterexample proving optimal (16) beats greedy (9)', () => {
  // MATH.uk.md §Reciprocal matching: "Counterexample greedy: AB=9, AC=8, BD=8, capacity кожного=1. Greedy AB дає 9; optimum AC+BD дає 16."
  const candidates = [
    { partyA: 'A', partyB: 'B', weight: 9 },
    { partyA: 'A', partyB: 'C', weight: 8 },
    { partyA: 'B', partyB: 'D', weight: 8 },
  ];
  const quotas = { A: 1, B: 1, C: 1, D: 1 };

  // 1. Greedy mode produces 9
  const greedy = solveBMatching(candidates, quotas, { mode: 'greedy' });
  assert.equal(greedy.totalWeight, 9);
  assert.equal(greedy.matched.length, 1);
  assert.equal(greedy.matched[0].pairKey, 'A::B');
  assert.equal(greedy.omitted.length, 2);

  // 2. Optimal mode produces 16
  const optimal = solveBMatching(candidates, quotas, { mode: 'optimal' });
  assert.equal(optimal.totalWeight, 16);
  assert.equal(optimal.matched.length, 2);
  const matchedPairs = optimal.matched.map(m => m.pairKey).sort();
  assert.deepEqual(matchedPairs, ['A::C', 'B::D']);

  // AB is omitted due to optimal capacity allocation
  assert.equal(optimal.omitted.length, 1);
  assert.equal(optimal.omitted[0].pairKey, 'A::B');
  assert.equal(optimal.omitted[0].reason, 'BOTH_QUOTAS_EXCEEDED');
});

test('M07: strictly respects heterogeneous per-user quotas', () => {
  // Alice has capacity 2, others have capacity 1
  const candidates = [
    { partyA: 'alice', partyB: 'bob', weight: 10 },
    { partyA: 'alice', partyB: 'carol', weight: 8 },
    { partyA: 'alice', partyB: 'dave', weight: 6 },
    { partyA: 'bob', partyB: 'carol', weight: 5 },
  ];
  const quotas = {
    alice: 2,
    bob: 1,
    carol: 1,
    dave: 1,
  };

  const result = solveBMatching(candidates, quotas);
  assert.equal(result.allocationCounts.alice, 2);
  assert.equal(result.allocationCounts.bob, 1);
  assert.equal(result.allocationCounts.carol, 1);
  assert.equal(result.allocationCounts.dave, undefined); // 0 allocations

  // Alice is matched with Bob and Carol
  const matchedWithAlice = result.matched
    .filter(m => m.partyA === 'alice' || m.partyB === 'alice')
    .map(m => (m.partyA === 'alice' ? m.partyB : m.partyA))
    .sort();
  assert.deepEqual(matchedWithAlice, ['bob', 'carol']);

  // dave omission explains Alice quota full
  const daveOmission = result.omitted.find(o => o.partyA === 'alice' && o.partyB === 'dave');
  assert.ok(daveOmission);
  assert.equal(daveOmission.reason, 'QUOTA_EXCEEDED_FOR_alice');
});

test('M07: deterministic tie-breaking produces stable outputs on equal weights', () => {
  const candidates1 = [
    { partyA: 'user-b', partyB: 'user-c', weight: 5 },
    { partyA: 'user-a', partyB: 'user-b', weight: 5 },
  ];
  const quotas = { 'user-a': 1, 'user-b': 1, 'user-c': 1 };

  const res1 = solveBMatching(candidates1, quotas);
  const res2 = solveBMatching([...candidates1].reverse(), quotas);

  // Lexicographical tie break ensures identical pair matched regardless of input order
  assert.equal(res1.matched[0].pairKey, res2.matched[0].pairKey);
  assert.equal(res1.matched[0].pairKey, 'user-a::user-b');
});

test('M07: rejects invalid and self candidates', () => {
  const candidates = [
    { partyA: 'self', partyB: 'self', weight: 10 },
    { partyA: 'valid-a', partyB: 'valid-b', weight: 7 },
    null,
    { partyA: '', partyB: 'x', weight: 5 },
  ];
  const result = solveBMatching(candidates, { defaultQuota: 1 });
  assert.equal(result.matched.length, 1);
  assert.equal(result.matched[0].pairKey, 'valid-a::valid-b');
});
