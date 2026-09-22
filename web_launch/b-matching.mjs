// web_launch/b-matching.mjs — M07: Планувальник знайомств з індивідуальними лімітами (b-matching)
// Зважений b-matching із квотами на користувача, точним оптимумом (Branch-and-Bound) та прозорим поясненням кожного рішення

export const DEFAULT_QUOTA_PER_USER = 2;

export function solveBMatching(candidates = [], quotas = {}, options = {}) {
  const { defaultQuota = DEFAULT_QUOTA_PER_USER, mode = 'optimal' } = options;

  const getQuota = userId => {
    if (quotas instanceof Map) return quotas.has(userId) ? quotas.get(userId) : defaultQuota;
    return typeof quotas[userId] === 'number' ? quotas[userId] : defaultQuota;
  };

  // Валідація та детерміністичне впорядкування кандидатів
  const validCandidates = candidates
    .filter(c => c && c.partyA && c.partyB && c.partyA !== c.partyB && typeof c.weight === 'number' && !isNaN(c.weight))
    .map(c => {
      const sortedPair = [c.partyA, c.partyB].sort();
      const pairKey = sortedPair.join('::');
      return {
        ...c,
        pairKey,
        weight: Number(c.weight),
      };
    });

  // Детерміністичне сортування: за вагою спаданням, потім стабільний лексикографічний tie-break
  validCandidates.sort((a, b) => b.weight - a.weight || a.pairKey.localeCompare(b.pairKey));

  if (!validCandidates.length) {
    return { matched: [], omitted: [], totalWeight: 0, allocationCounts: {} };
  }

  let matchedEdges = [];

  if (mode === 'optimal' && validCandidates.length <= 40) {
    // Exact Branch-and-Bound solver for globally optimal b-matching
    let bestWeight = -1;
    let bestSubset = [];
    const n = validCandidates.length;

    // Префіксні суми для відсікання гілок (bounding)
    const suffixSum = new Array(n + 1).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      suffixSum[i] = suffixSum[i + 1] + Math.max(0, validCandidates[i].weight);
    }

    const search = (index, currentCounts, currentWeight, currentSubset) => {
      if (currentWeight + suffixSum[index] <= bestWeight) return; // Prune

      if (index === n) {
        if (currentWeight > bestWeight) {
          bestWeight = currentWeight;
          bestSubset = [...currentSubset];
        }
        return;
      }

      const edge = validCandidates[index];
      const countA = currentCounts.get(edge.partyA) || 0;
      const countB = currentCounts.get(edge.partyB) || 0;
      const quotaA = getQuota(edge.partyA);
      const quotaB = getQuota(edge.partyB);

      // Гілка 1: включаємо ребро, якщо квоти дозволяють
      if (countA < quotaA && countB < quotaB) {
        currentCounts.set(edge.partyA, countA + 1);
        currentCounts.set(edge.partyB, countB + 1);
        currentSubset.push(edge);

        search(index + 1, currentCounts, currentWeight + edge.weight, currentSubset);

        currentSubset.pop();
        currentCounts.set(edge.partyA, countA);
        currentCounts.set(edge.partyB, countB);
      }

      // Гілка 2: пропускаємо ребро
      search(index + 1, currentCounts, currentWeight, currentSubset);
    };

    search(0, new Map(), 0, []);
    matchedEdges = bestSubset;
  } else {
    // Greedy heuristic
    const counts = new Map();
    for (const edge of validCandidates) {
      const countA = counts.get(edge.partyA) || 0;
      const countB = counts.get(edge.partyB) || 0;
      if (countA < getQuota(edge.partyA) && countB < getQuota(edge.partyB)) {
        counts.set(edge.partyA, countA + 1);
        counts.set(edge.partyB, countB + 1);
        matchedEdges.push(edge);
      }
    }
  }

  const matchedSet = new Set(matchedEdges.map(e => e.pairKey));
  const finalCounts = new Map();
  for (const edge of matchedEdges) {
    finalCounts.set(edge.partyA, (finalCounts.get(edge.partyA) || 0) + 1);
    finalCounts.set(edge.partyB, (finalCounts.get(edge.partyB) || 0) + 1);
  }

  const matched = matchedEdges.map(e => ({
    ...e,
    status: 'matched',
    allocatedCounts: {
      [e.partyA]: finalCounts.get(e.partyA),
      [e.partyB]: finalCounts.get(e.partyB),
    },
  }));

  const omitted = validCandidates
    .filter(e => !matchedSet.has(e.pairKey))
    .map(e => {
      const countA = finalCounts.get(e.partyA) || 0;
      const countB = finalCounts.get(e.partyB) || 0;
      const quotaA = getQuota(e.partyA);
      const quotaB = getQuota(e.partyB);
      let reason = 'QUOTA_EXCEEDED';
      if (countA >= quotaA && countB >= quotaB) reason = 'BOTH_QUOTAS_EXCEEDED';
      else if (countA >= quotaA) reason = `QUOTA_EXCEEDED_FOR_${e.partyA}`;
      else if (countB >= quotaB) reason = `QUOTA_EXCEEDED_FOR_${e.partyB}`;

      return {
        ...e,
        status: 'omitted',
        reason,
        currentCounts: { [e.partyA]: countA, [e.partyB]: countB },
        quotas: { [e.partyA]: quotaA, [e.partyB]: quotaB },
      };
    });

  return {
    matched,
    omitted,
    totalWeight: matched.reduce((sum, item) => sum + item.weight, 0),
    allocationCounts: Object.fromEntries(finalCounts.entries()),
  };
}
