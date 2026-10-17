// web_launch/funnel-analytics.mjs — M11 Kaplan-Meier Survival & M12 Markov State Transitions
// Детерміністичний математичний аналізатор життєвого циклу кейсів та конверсійного лійкового руху.

export const CASE_LIFECYCLE_STATES = Object.freeze([
  'draft',
  'awaiting_approval',
  'approved_for_next_step',
  'meeting_held',
  'completed_deal',
  'dropped',
]);

export const ABSORBING_STATES = Object.freeze(new Set(['completed_deal', 'dropped']));
export const TRANSIENT_STATES = Object.freeze(['draft', 'awaiting_approval', 'approved_for_next_step', 'meeting_held']);

/**
 * M11: Обчислює емпіричну криву виживання Каплана-Мейєра S^(t) = П (1 - d_i / n_i).
 * @param {Array<{ day: number, atRisk: number, dropped: number }>} records - Впорядкований масив часових точок
 * @returns {Array<{ day: number, survival: number, cumulativeDrop: number }>}
 */
export function calculateKaplanMeierSurvival(records = []) {
  if (!Array.isArray(records) || !records.length) return [];

  const sorted = [...records].sort((a, b) => (a.day ?? 0) - (b.day ?? 0));
  let cumulativeSurvival = 1.0;
  const result = [];

  for (const item of sorted) {
    const day = Number(item.day) || 0;
    const atRisk = Math.max(0, Number(item.atRisk) || 0);
    const dropped = Math.max(0, Number(item.dropped) || 0);

    let hazardRatio = 0;
    if (atRisk > 0 && dropped > 0) {
      hazardRatio = Math.min(1.0, dropped / atRisk);
    }

    cumulativeSurvival *= (1.0 - hazardRatio);
    // Округлення до 6 знаків для усунення похибки IEEE 754
    const survival = Math.max(0, Math.min(1.0, Math.round(cumulativeSurvival * 1e6) / 1e6));
    const cumulativeDrop = Math.round((1.0 - survival) * 1e6) / 1e6;

    result.push({
      day,
      survival,
      cumulativeDrop,
    });
  }

  return result;
}

/**
 * M12: Будує матрицю переходів Маркова за емпіричними подіями переходів станів.
 * @param {Array<{ from: string, to: string }>} transitions - Список спостережуваних переходів
 * @param {Array<string>} states - Упорядкований перелік станів (за замовчуванням CASE_LIFECYCLE_STATES)
 * @returns {{ states: Array<string>, matrix: Array<Array<number>> }} Стохастична матриця переходів P
 */
export function buildMarkovTransitionMatrix(transitions = [], states = CASE_LIFECYCLE_STATES) {
  const n = states.length;
  const stateIndex = new Map(states.map((s, i) => [s, i]));
  const counts = Array.from({ length: n }, () => new Array(n).fill(0));

  for (const t of transitions) {
    const u = stateIndex.get(t.from);
    const v = stateIndex.get(t.to);
    if (u !== undefined && v !== undefined) {
      counts[u][v] += 1;
    }
  }

  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    const stateName = states[i];
    if (ABSORBING_STATES.has(stateName)) {
      // Поглинальний стан переходить сам у себе з ймовірністю 1.0
      matrix[i][i] = 1.0;
      continue;
    }

    const rowSum = counts[i].reduce((sum, val) => sum + val, 0);
    if (rowSum === 0) {
      // Якщо даних переходу з цього стану немає, стан утримується (self-loop)
      matrix[i][i] = 1.0;
    } else {
      for (let j = 0; j < n; j++) {
        matrix[i][j] = Math.round((counts[i][j] / rowSum) * 1e6) / 1e6;
      }
    }
  }

  return {
    states: [...states],
    matrix,
  };
}

/**
 * Інвертує квадратну матрицю методом Гаусса-Жордана.
 */
function invertMatrix(M) {
  const n = M.length;
  const A = M.map(row => [...row]);
  const I = Array.from({ length: n }, (_, i) => {
    const row = new Array(n).fill(0);
    row[i] = 1.0;
    return row;
  });

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[pivotRow][col])) {
        pivotRow = r;
      }
    }

    if (Math.abs(A[pivotRow][col]) < 1e-12) {
      // Сингулярна матриця, повертаємо одиничну матрицю як безпечний fallback
      return Array.from({ length: n }, (_, i) => {
        const r = new Array(n).fill(0);
        r[i] = 1.0;
        return r;
      });
    }

    // Swapping rows
    [A[col], A[pivotRow]] = [A[pivotRow], A[col]];
    [I[col], I[pivotRow]] = [I[pivotRow], I[col]];

    const pivotVal = A[col][col];
    for (let c = 0; c < n; c++) {
      A[col][c] /= pivotVal;
      I[col][c] /= pivotVal;
    }

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = A[r][col];
      for (let c = 0; c < n; c++) {
        A[r][c] -= factor * A[col][c];
        I[r][c] -= factor * I[col][c];
      }
    }
  }

  return I;
}

/**
 * M12: Обчислює фундаментальну матрицю N = (I - Q)^(-1) та ймовірності поглинання B = N * R.
 * Дає точну ймовірність успішного завершення угоди (completed_deal) з будь-якого перехідного стану.
 */
export function analyzeMarkovAbsorbingChain(transitionModel) {
  const { states, matrix } = transitionModel;
  const stateIndex = new Map(states.map((s, i) => [s, i]));

  const transient = TRANSIENT_STATES.filter(s => stateIndex.has(s));
  const absorbing = ['completed_deal', 'dropped'].filter(s => stateIndex.has(s));

  const tCount = transient.length;
  const aCount = absorbing.length;

  if (tCount === 0 || aCount === 0) {
    return { successProbabilityFromDraft: 0.0, expectedSteps: 0.0 };
  }

  // Підматриця Q: transient -> transient
  const Q = Array.from({ length: tCount }, (_, i) => {
    const origRow = stateIndex.get(transient[i]);
    return transient.map(tj => matrix[origRow][stateIndex.get(tj)] || 0);
  });

  // Підматриця R: transient -> absorbing
  const R = Array.from({ length: tCount }, (_, i) => {
    const origRow = stateIndex.get(transient[i]);
    return absorbing.map(ak => matrix[origRow][stateIndex.get(ak)] || 0);
  });

  // Обчислюємо I - Q
  const ImQ = Array.from({ length: tCount }, (row, i) => {
    return Array.from({ length: tCount }, (_, j) => (i === j ? 1.0 : 0.0) - Q[i][j]);
  });

  // Фундаментальна матриця N = (I - Q)^(-1)
  const N = invertMatrix(ImQ);

  // Матриця поглинання B = N * R (розмір tCount x aCount)
  const B = Array.from({ length: tCount }, (_, i) => {
    return Array.from({ length: aCount }, (_, k) => {
      let sum = 0;
      for (let j = 0; j < tCount; j++) {
        sum += N[i][j] * R[j][k];
      }
      return Math.max(0, Math.min(1.0, Math.round(sum * 1e6) / 1e6));
    });
  });

  // Очікувана кількість кроків до поглинання t = N * 1
  const expectedStepsByState = {};
  for (let i = 0; i < tCount; i++) {
    const steps = N[i].reduce((acc, v) => acc + v, 0);
    expectedStepsByState[transient[i]] = Math.round(steps * 100) / 100;
  }

  const draftIndex = transient.indexOf('draft');
  const dealIndex = absorbing.indexOf('completed_deal');

  const successProbability = (draftIndex >= 0 && dealIndex >= 0) ? B[draftIndex][dealIndex] : 0.0;
  const expectedStepsFromDraft = draftIndex >= 0 ? expectedStepsByState['draft'] : 0.0;

  return {
    transientStates: transient,
    absorbingStates: absorbing,
    fundamentalMatrix: N,
    absorptionProbabilities: B,
    expectedStepsByState,
    successProbabilityFromDraft: successProbability,
    expectedStepsFromDraft,
  };
}
