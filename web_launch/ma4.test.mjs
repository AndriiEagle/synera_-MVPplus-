import test from 'node:test';
import assert from 'node:assert/strict';
import { registerGate, runReplay, decidePromotion, appendDecision } from './ma4.mjs';

const gate = {
  id: 'gate-intro-cap',
  hypothesis: 'Зниження тижневої квоти знайомств підвищує частку прийнятих',
  metric: 'accept_rate',
  threshold: 0.05,
  direction: 'higher_is_better',
};

const events = [1, 2, 3, 4, 5];

test('MA4: виграш на holdout БЕЗ згоди людини не підвищується (needs_review)', () => {
  const candidate = () => 0.9;
  const baseline = () => 0.5;
  const replay = runReplay({ gate, events, candidate, baseline });
  assert.equal(replay.valid, true);
  assert.equal(replay.holdoutWin, true);
  const verdict = decidePromotion({ replay, gate, humanApproved: false });
  assert.equal(verdict.decision, 'needs_review');
  assert.deepEqual(verdict.reasons, ['HUMAN_APPROVAL_REQUIRED']);
});

test('MA4: згода людини БЕЗ виграшу на holdout не підвищується (rejected)', () => {
  const candidate = () => 0.5;
  const baseline = () => 0.5;
  const replay = runReplay({ gate, events, candidate, baseline });
  assert.equal(replay.holdoutWin, false);
  const verdict = decidePromotion({ replay, gate, humanApproved: true });
  assert.equal(verdict.decision, 'rejected');
  assert.deepEqual(verdict.reasons, ['NO_HOLDOUT_WIN']);
});

test('MA4: виграш на holdout ТА згода людини дають promoted', () => {
  const candidate = () => 0.9;
  const baseline = () => 0.5;
  const replay = runReplay({ gate, events, candidate, baseline });
  const verdict = decidePromotion({ replay, gate, humanApproved: true });
  assert.equal(verdict.decision, 'promoted');
  assert.deepEqual(verdict.reasons, []);
});

test('MA4: підвищення без заздалегідь зареєстрованих ворот відхиляється', () => {
  assert.equal(runReplay({ events, candidate: () => 1, baseline: () => 0 }).reason, 'GATE_NOT_PREREGISTERED');
  assert.equal(decidePromotion({ replay: { valid: true, holdoutWin: true, gateId: 'x' }, gate: null, humanApproved: true }).decision, 'rejected');
  assert.deepEqual(
    decidePromotion({ replay: { valid: true, holdoutWin: true, gateId: 'x' }, gate: null, humanApproved: true }).reasons,
    ['GATE_NOT_PREREGISTERED'],
  );
  // Реєстрація ворот не мутує вхід і забороняє дубль id.
  const first = registerGate([], gate);
  assert.equal(first.valid, true);
  assert.equal(first.gates.length, 1);
  assert.equal(registerGate(first.gates, gate).reason, 'GATE_ALREADY_REGISTERED');
  assert.equal(registerGate([], { ...gate, direction: 'sideways' }).reason, 'INVALID_DIRECTION');
  assert.equal(registerGate([], { ...gate, threshold: -1 }).reason, 'INVALID_THRESHOLD');
});

test('MA4: журнал рішень append-only — новий масив, вхід не змінюється, поля на місці', () => {
  const journal = [];
  const entry = { hypothesis: 'H', metric: 'accept_rate', holdout: true, approval: false, timestamp: '2026-09-22T00:00:00Z' };
  const next = appendDecision(journal, entry);
  assert.ok(Array.isArray(next));
  assert.equal(journal.length, 0);
  assert.equal(next.length, 1);
  assert.deepEqual(next[0], entry);
  const third = appendDecision(next, { hypothesis: 'H2', metric: 'time_to_pair', holdout: true, approval: true, timestamp: '2026-09-22T01:00:00Z' });
  assert.equal(next.length, 1);
  assert.equal(third.length, 2);
  assert.deepEqual(appendDecision([], {}), [{ hypothesis: '', metric: '', holdout: false, approval: false, timestamp: '' }]);
  assert.equal(appendDecision(null, entry).valid, false);
});
