import test from 'node:test';
import assert from 'node:assert/strict';
import { solveStableMatching, findBlockingPair } from './stable-matching.mjs';

// Детермінований LCG (власний, без зовнішніх залежностей і без Math.random).
function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

test('M08: класичний випадок 2x2 дає відому стабільну пару', () => {
  const result = solveStableMatching({
    proposers: [
      { id: 'p1', quota: 1, prefs: ['a1', 'a2'] },
      { id: 'p2', quota: 1, prefs: ['a2', 'a1'] },
    ],
    acceptors: [
      { id: 'a1', quota: 1, prefs: ['p1', 'p2'] },
      { id: 'a2', quota: 1, prefs: ['p2', 'p1'] },
    ],
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.matches, [
    { proposer: 'p1', acceptor: 'a1' },
    { proposer: 'p2', acceptor: 'a2' },
  ]);
  assert.equal(findBlockingPair({
    proposers: [
      { id: 'p1', quota: 1, prefs: ['a1', 'a2'] },
      { id: 'p2', quota: 1, prefs: ['a2', 'a1'] },
    ],
    acceptors: [
      { id: 'a1', quota: 1, prefs: ['p1', 'p2'] },
      { id: 'a2', quota: 1, prefs: ['p2', 'p1'] },
    ],
  }, result.matches), null);
});

test('M08: багато-до-багатьох — ніхто не перевищує свою квоту', () => {
  const input = {
    proposers: [
      { id: 'p1', quota: 2, prefs: ['a1', 'a2', 'a3'] },
      { id: 'p2', quota: 1, prefs: ['a1', 'a2'] },
      { id: 'p3', quota: 1, prefs: ['a2', 'a3'] },
    ],
    acceptors: [
      { id: 'a1', quota: 1, prefs: ['p1', 'p2'] },
      { id: 'a2', quota: 2, prefs: ['p3', 'p1', 'p2'] },
      { id: 'a3', quota: 1, prefs: ['p1', 'p3'] },
    ],
  };
  const result = solveStableMatching(input);
  assert.equal(result.valid, true);
  const proposerCount = new Map();
  const acceptorCount = new Map();
  for (const m of result.matches) {
    proposerCount.set(m.proposer, (proposerCount.get(m.proposer) || 0) + 1);
    acceptorCount.set(m.acceptor, (acceptorCount.get(m.acceptor) || 0) + 1);
  }
  for (const p of input.proposers) assert.ok((proposerCount.get(p.id) || 0) <= p.quota, `квота пропозера ${p.id}`);
  for (const a of input.acceptors) assert.ok((acceptorCount.get(a.id) || 0) <= a.quota, `квота акцептора ${a.id}`);
  assert.equal(findBlockingPair(input, result.matches), null);
});

test('M08: детерміноване розв’язання нічиїх — два прогони байт-ідентичні', () => {
  const input = {
    proposers: [
      { id: 'p1', quota: 1, prefs: ['a1', 'a2'] },
      { id: 'p2', quota: 1, prefs: ['a1', 'a2'] },
    ],
    acceptors: [
      { id: 'a1', quota: 1, prefs: ['p1', 'p2'] },
      { id: 'a2', quota: 1, prefs: ['p1', 'p2'] },
    ],
  };
  const first = JSON.stringify(solveStableMatching(input));
  const second = JSON.stringify(solveStableMatching(input));
  assert.equal(first, second);
  assert.deepEqual(solveStableMatching(input).matches, [
    { proposer: 'p1', acceptor: 'a1' },
    { proposer: 'p2', acceptor: 'a2' },
  ]);
});

test('M08: некоректний вхід повертає valid=false з кодом причини, не кидає', () => {
  const cases = [
    { proposers: [{ id: 'p1', quota: '1', prefs: ['a1'] }], acceptors: [{ id: 'a1', quota: 1, prefs: ['p1'] }] }, // квота не число
    { proposers: [{ id: 'p1', quota: 0, prefs: ['a1'] }], acceptors: [{ id: 'a1', quota: 1, prefs: ['p1'] }] }, // нульова квота
    { proposers: [{ id: 'p1', quota: 1, prefs: ['a1', 'a1'] }], acceptors: [{ id: 'a1', quota: 1, prefs: ['p1'] }] }, // дубль у prefs
    { proposers: [{ id: 'p1', quota: 1, prefs: [] }, { id: 'p1', quota: 1, prefs: [] }], acceptors: [{ id: 'a1', quota: 1, prefs: ['p1'] }] }, // дубль id
    { proposers: [{ id: 'p1', quota: 1, prefs: 'a1' }], acceptors: [{ id: 'a1', quota: 1, prefs: ['p1'] }] }, // prefs не масив
    { proposers: [], acceptors: [{ id: 'a1', quota: 1, prefs: ['p1'] }] },
    {},
  ];
  for (const input of cases) {
    const result = solveStableMatching(input);
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'INVALID_INPUT');
    assert.deepEqual(result.matches, []);
  }
});

test('M08: властивість — 1000 згенерованих випадків не мають блокуючої пари', () => {
  const rng = createRng(20260922);
  let checked = 0;
  for (let iteration = 0; iteration < 1000; iteration++) {
    const proposerCount = 2 + Math.floor(rng() * 5);
    const acceptorCount = 2 + Math.floor(rng() * 5);
    const proposerIds = Array.from({ length: proposerCount }, (_, i) => `p${i + 1}`);
    const acceptorIds = Array.from({ length: acceptorCount }, (_, i) => `a${i + 1}`);
    const proposers = proposerIds.map(id => ({
      id,
      quota: 1 + Math.floor(rng() * 3),
      prefs: shuffle(acceptorIds, rng).slice(0, 1 + Math.floor(rng() * acceptorCount)),
    }));
    const acceptors = acceptorIds.map(id => ({
      id,
      quota: 1 + Math.floor(rng() * 3),
      prefs: shuffle(proposerIds, rng).slice(0, 1 + Math.floor(rng() * proposerCount)),
    }));
    // Ніяких самопосилань: сторони мають різні простори ідентифікаторів.
    const input = { proposers, acceptors };
    const result = solveStableMatching(input);
    assert.equal(result.valid, true, `ітерація ${iteration}`);
    const blocking = findBlockingPair(input, result.matches);
    assert.equal(blocking, null, `блокуюча пара на ітерації ${iteration}: ${JSON.stringify(blocking)}`);
    checked++;
  }
  assert.equal(checked, 1000);
});
