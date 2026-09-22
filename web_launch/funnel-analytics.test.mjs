import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateKaplanMeierSurvival,
  buildMarkovTransitionMatrix,
  analyzeMarkovAbsorbingChain,
  CASE_LIFECYCLE_STATES,
} from './funnel-analytics.mjs';

test('M11: calculateKaplanMeierSurvival handles empty, perfect, and full-churn cohorts', () => {
  assert.deepEqual(calculateKaplanMeierSurvival([]), []);

  // Perfect retention
  const perfect = [
    { day: 1, atRisk: 100, dropped: 0 },
    { day: 7, atRisk: 100, dropped: 0 },
  ];
  const perfectResult = calculateKaplanMeierSurvival(perfect);
  assert.equal(perfectResult[0].survival, 1.0);
  assert.equal(perfectResult[1].survival, 1.0);
  assert.equal(perfectResult[1].cumulativeDrop, 0.0);

  // Full churn
  const fullChurn = [
    { day: 1, atRisk: 50, dropped: 10 },
    { day: 7, atRisk: 40, dropped: 40 },
  ];
  const fullChurnResult = calculateKaplanMeierSurvival(fullChurn);
  assert.equal(fullChurnResult[0].survival, 0.8);
  assert.equal(fullChurnResult[1].survival, 0.0);
  assert.equal(fullChurnResult[1].cumulativeDrop, 1.0);
});

test('M11: calculateKaplanMeierSurvival proves monotonic non-increasing survival curve', () => {
  const cohort = [
    { day: 1, atRisk: 100, dropped: 10 },  // 1 - 10/100 = 0.90
    { day: 7, atRisk: 90, dropped: 18 },   // 0.90 * (1 - 18/90) = 0.72
    { day: 14, atRisk: 72, dropped: 18 },  // 0.72 * (1 - 18/72) = 0.54
    { day: 30, atRisk: 54, dropped: 27 },  // 0.54 * (1 - 27/54) = 0.27
  ];

  const curve = calculateKaplanMeierSurvival(cohort);
  assert.equal(curve.length, 4);
  assert.equal(curve[0].survival, 0.9);
  assert.equal(curve[1].survival, 0.72);
  assert.equal(curve[2].survival, 0.54);
  assert.equal(curve[3].survival, 0.27);

  // Monotonicity check
  for (let i = 1; i < curve.length; i++) {
    assert.ok(curve[i].survival <= curve[i - 1].survival, `Survival at index ${i} must be <= index ${i-1}`);
    assert.equal(Math.round((curve[i].survival + curve[i].cumulativeDrop) * 1e4) / 1e4, 1.0);
  }
});

test('M12: buildMarkovTransitionMatrix enforces row-stochastic invariant and absorbing states', () => {
  const sampleTransitions = [
    // draft -> awaiting_approval (80), draft -> dropped (20)
    ...Array(80).fill({ from: 'draft', to: 'awaiting_approval' }),
    ...Array(20).fill({ from: 'draft', to: 'dropped' }),
    // awaiting_approval -> approved_for_next_step (60), awaiting_approval -> dropped (20)
    ...Array(60).fill({ from: 'awaiting_approval', to: 'approved_for_next_step' }),
    ...Array(20).fill({ from: 'awaiting_approval', to: 'dropped' }),
    // approved_for_next_step -> meeting_held (50), approved_for_next_step -> dropped (10)
    ...Array(50).fill({ from: 'approved_for_next_step', to: 'meeting_held' }),
    ...Array(10).fill({ from: 'approved_for_next_step', to: 'dropped' }),
    // meeting_held -> completed_deal (40), meeting_held -> dropped (10)
    ...Array(40).fill({ from: 'meeting_held', to: 'completed_deal' }),
    ...Array(10).fill({ from: 'meeting_held', to: 'dropped' }),
  ];

  const model = buildMarkovTransitionMatrix(sampleTransitions);
  assert.equal(model.states.length, CASE_LIFECYCLE_STATES.length);

  for (let i = 0; i < model.matrix.length; i++) {
    const row = model.matrix[i];
    const sum = row.reduce((acc, v) => acc + v, 0);
    assert.ok(Math.abs(sum - 1.0) < 1e-4, `Row ${i} sum must be 1.0, got ${sum}`);
  }

  // Absorbing states must have 1.0 on diagonal
  const dealIdx = model.states.indexOf('completed_deal');
  const droppedIdx = model.states.indexOf('dropped');
  assert.equal(model.matrix[dealIdx][dealIdx], 1.0);
  assert.equal(model.matrix[droppedIdx][droppedIdx], 1.0);
});

test('M12: analyzeMarkovAbsorbingChain calculates fundamental matrix and exact absorption probabilities', () => {
  const transitions = [
    // draft: 80% advance, 20% drop
    ...Array(8).fill({ from: 'draft', to: 'awaiting_approval' }),
    ...Array(2).fill({ from: 'draft', to: 'dropped' }),
    // awaiting_approval: 75% advance, 25% drop
    ...Array(6).fill({ from: 'awaiting_approval', to: 'approved_for_next_step' }),
    ...Array(2).fill({ from: 'awaiting_approval', to: 'dropped' }),
    // approved_for_next_step: 80% advance, 20% drop
    ...Array(4).fill({ from: 'approved_for_next_step', to: 'meeting_held' }),
    ...Array(1).fill({ from: 'approved_for_next_step', to: 'dropped' }),
    // meeting_held: 80% deal, 20% drop
    ...Array(4).fill({ from: 'meeting_held', to: 'completed_deal' }),
    ...Array(1).fill({ from: 'meeting_held', to: 'dropped' }),
  ];

  const model = buildMarkovTransitionMatrix(transitions);
  const analysis = analyzeMarkovAbsorbingChain(model);

  assert.ok(analysis.fundamentalMatrix.length > 0);
  assert.ok(analysis.expectedStepsFromDraft > 0);

  // Success probability from draft should equal 0.8 * 0.75 * 0.8 * 0.8 = 0.384
  assert.ok(Math.abs(analysis.successProbabilityFromDraft - 0.384) < 1e-2, `Expected ~0.384, got ${analysis.successProbabilityFromDraft}`);

  // In an absorbing Markov chain, total absorption probability from any transient state = 1.0
  for (let i = 0; i < analysis.absorptionProbabilities.length; i++) {
    const row = analysis.absorptionProbabilities[i];
    const rowTotal = row.reduce((acc, v) => acc + v, 0);
    assert.ok(Math.abs(rowTotal - 1.0) < 1e-4, `Absorption row ${i} sum must equal 1.0, got ${rowTotal}`);
  }
});
