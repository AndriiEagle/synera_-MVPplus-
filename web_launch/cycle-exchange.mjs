// web_launch/cycle-exchange.mjs — M09: Цикли обміну (довжина 2 і 3) та пакування неперетинних циклів
// Swiss Solopreneur Triangular Reciprocity Engine

import { normalizeBrief } from './profile-brief.mjs';

/**
 * Знаходить усі спрямовані ребра give -> need між учасниками.
 * Ребро u -> v означає, що u пропонує те, що потрібно v.
 */
export function buildCapabilityGraph(profiles) {
  const list = Array.isArray(profiles) ? profiles : Object.values(profiles || {});
  const active = list.filter(p => p && p.id && p.is_discoverable !== false);
  const edges = [];

  for (const u of active) {
    const uBrief = normalizeBrief(u.brief);
    const uOffers = new Set(uBrief.offer_tags || []);
    if (!uOffers.size) continue;

    for (const v of active) {
      if (u.id === v.id) continue;
      const vBrief = normalizeBrief(v.brief);
      const vNeeds = new Set(vBrief.need_tags || []);
      if (!vNeeds.size) continue;

      const matchedTags = [...uOffers].filter(tag => vNeeds.has(tag));
      if (matchedTags.length > 0) {
        edges.push({
          from: u.id,
          to: v.id,
          tags: matchedTags.sort(),
          weight: matchedTags.length,
        });
      }
    }
  }

  return { nodes: active.map(p => p.id), edges };
}

/**
 * Знаходить усі елементарні цикли довжини 2 (A <-> B) та довжини 3 (A -> B -> C -> A).
 */
export function findExchangeCycles(profiles, options = {}) {
  const { maxCycleLength = 3 } = options;
  const { edges } = buildCapabilityGraph(profiles);

  // Карта суміжності: from -> Map(to -> edge)
  const adj = new Map();
  for (const edge of edges) {
    if (!adj.has(edge.from)) adj.set(edge.from, new Map());
    adj.get(edge.from).set(edge.to, edge);
  }

  const rawCycles = [];
  const seenCanonicalKeys = new Set();

  const getCanonicalCycleKey = nodeIds => {
    // Циклічний зсув до мінімального лексикографічного вузла
    const minNode = [...nodeIds].sort()[0];
    const startIndex = nodeIds.indexOf(minNode);
    const shifted = [...nodeIds.slice(startIndex), ...nodeIds.slice(0, startIndex)];
    return shifted.join('->');
  };

  // 1. Цикли довжини 2 (двосторонній обмін A <-> B)
  for (const [a, aNeighbors] of adj.entries()) {
    for (const [b, edgeAB] of aNeighbors.entries()) {
      if (a < b && adj.get(b)?.has(a)) {
        const edgeBA = adj.get(b).get(a);
        const cycleNodes = [a, b];
        const key = getCanonicalCycleKey(cycleNodes);
        if (!seenCanonicalKeys.has(key)) {
          seenCanonicalKeys.add(key);
          rawCycles.push({
            type: 'bilateral_2way',
            length: 2,
            nodes: cycleNodes,
            edges: [edgeAB, edgeBA],
            totalWeight: edgeAB.weight + edgeBA.weight,
          });
        }
      }
    }
  }

  // 2. Цикли довжини 3 (трикутний обмін A -> B -> C -> A)
  if (maxCycleLength >= 3) {
    for (const [a, aNeighbors] of adj.entries()) {
      for (const [b, edgeAB] of aNeighbors.entries()) {
        if (b === a) continue;
        const bNeighbors = adj.get(b);
        if (!bNeighbors) continue;

        for (const [c, edgeBC] of bNeighbors.entries()) {
          if (c === a || c === b) continue;
          if (adj.get(c)?.has(a)) {
            const edgeCA = adj.get(c).get(a);
            const cycleNodes = [a, b, c];
            const key = getCanonicalCycleKey(cycleNodes);
            if (!seenCanonicalKeys.has(key)) {
              seenCanonicalKeys.add(key);
              rawCycles.push({
                type: 'triangular_3way',
                length: 3,
                nodes: cycleNodes,
                edges: [edgeAB, edgeBC, edgeCA],
                totalWeight: edgeAB.weight + edgeBC.weight + edgeCA.weight,
              });
            }
          }
        }
      }
    }
  }

  // Сортуємо цикли: трикутні спочатку або за вагою
  return rawCycles.sort((a, b) => b.totalWeight - a.totalWeight || b.length - a.length || a.nodes[0].localeCompare(b.nodes[0]));
}

/**
 * Пакування неперетинних циклів (Disjoint Cycle Packing):
 * Жадібний детерміністичний пакувальник з максимальним покриттям учасників.
 * Жодна особа не може бути призначена в більше ніж один активний цикл.
 */
export function packDisjointCycles(cycles) {
  const committedUsers = new Set();
  const packed = [];
  const rejected = [];

  for (const cycle of cycles) {
    const isDisjoint = cycle.nodes.every(node => !committedUsers.has(node));
    if (isDisjoint) {
      for (const node of cycle.nodes) committedUsers.add(node);
      packed.push(cycle);
    } else {
      rejected.push({
        cycle,
        reason: 'CONFLICT_PARTICIPANT_ALREADY_COMMITTED',
        conflictingNodes: cycle.nodes.filter(node => committedUsers.has(node)),
      });
    }
  }

  return {
    packed,
    rejected,
    totalParticipantsCovered: committedUsers.size,
  };
}

/**
 * Формує структуровану пропозицію тристороннього кейсу (M09 Proposal Draft).
 */
export function buildTriangularCaseProposal(cycle, profilesMap = {}) {
  if (!cycle || cycle.length !== 3 || cycle.type !== 'triangular_3way') {
    throw new Error('Expected a 3-way triangular cycle');
  }

  const [nodeA, nodeB, nodeC] = cycle.nodes;
  const [edgeAB, edgeBC, edgeCA] = cycle.edges;

  const getName = id => profilesMap[id]?.display_name || profilesMap[id]?.name || id;

  return {
    schema: 'synera.triangular-case.v1',
    mode: 'triangular_exchange',
    participants: [nodeA, nodeB, nodeC],
    legs: [
      {
        giver_id: edgeAB.from,
        receiver_id: edgeAB.to,
        giver_name: getName(edgeAB.from),
        receiver_name: getName(edgeAB.to),
        tags: edgeAB.tags,
      },
      {
        giver_id: edgeBC.from,
        receiver_id: edgeBC.to,
        giver_name: getName(edgeBC.from),
        receiver_name: getName(edgeBC.to),
        tags: edgeBC.tags,
      },
      {
        giver_id: edgeCA.from,
        receiver_id: edgeCA.to,
        giver_name: getName(edgeCA.from),
        receiver_name: getName(edgeCA.to),
        tags: edgeCA.tags,
      },
    ],
    summary: `${getName(nodeA)} ➔ ${getName(nodeB)} ➔ ${getName(nodeC)} ➔ ${getName(nodeA)}`,
    binding: false,
    status: 'proposal_draft',
  };
}
