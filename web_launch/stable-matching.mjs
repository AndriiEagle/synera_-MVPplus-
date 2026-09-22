// M08 — Стабільність пар (Gale–Shapley, відкладене приймання, багато-до-багатьох із квотами).
// Детерміновано: той самий вхід → той самий вихід. Без випадковості, без мережі, без Date.now().
//
// Каталог: plan/readiness/MATH_AGENTS.uk.md, M08.
// Інваріант: немає блокуючої пари (обидва хочуть одне одного більше, ніж призначене).

const validId = value => typeof value === 'string' && /^[a-z0-9_-]{1,64}$/i.test(value);

// Одна сторона: масив { id, quota, prefs[] }. Повертає null на будь-якій некоректності.
function normalizeSide(input) {
  if (!Array.isArray(input) || input.length === 0) return null;
  const seen = new Set();
  const out = [];
  for (const item of input) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    if (!validId(item.id) || seen.has(item.id)) return null;
    seen.add(item.id);
    if (!Number.isSafeInteger(item.quota) || item.quota < 1) return null;
    if (!Array.isArray(item.prefs)) return null;
    const prefs = [];
    const prefSeen = new Set();
    for (const prefId of item.prefs) {
      if (!validId(prefId) || prefSeen.has(prefId)) return null;
      prefSeen.add(prefId);
      prefs.push(prefId);
    }
    out.push({ id: item.id, quota: item.quota, prefs });
  }
  // Детермінований порядок обробки не залежить від порядку у вході.
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

function buildRank(participants) {
  const map = new Map();
  for (const p of participants) {
    const rank = new Map();
    p.prefs.forEach((id, index) => rank.set(id, index));
    map.set(p.id, rank);
  }
  return map;
}

/**
 * Розв'язує стабільний матчинг багато-до-багатьох.
 * @param {{ proposers?: Array, acceptors?: Array }} input
 * @returns {{ valid: boolean, reason?: string, matches: Array<{proposer:string, acceptor:string}> }}
 */
export function solveStableMatching(input = {}) {
  const proposers = normalizeSide(input.proposers);
  const acceptors = normalizeSide(input.acceptors);
  if (!proposers || !acceptors) return { valid: false, reason: 'INVALID_INPUT', matches: [] };

  const acceptorById = new Map(acceptors.map(a => [a.id, a]));
  const proposerRank = buildRank(proposers);
  const acceptorRank = buildRank(acceptors);

  // Тримаємо по кожному акцептору відсортований за рангом список утримуваних пропозерів.
  const held = new Map(acceptors.map(a => [a.id, []]));
  const engaged = new Map(proposers.map(p => [p.id, new Set()]));
  const pointer = new Map(proposers.map(p => [p.id, 0]));

  // Відкладене приймання: кожен пропозер іде по власному списку, поки має вільну квоту.
  let progress = true;
  while (progress) {
    progress = false;
    for (const proposer of proposers) {
      const myEngaged = engaged.get(proposer.id);
      while (myEngaged.size < proposer.quota && pointer.get(proposer.id) < proposer.prefs.length) {
        const acceptorId = proposer.prefs[pointer.get(proposer.id)];
        pointer.set(proposer.id, pointer.get(proposer.id) + 1);
        const acceptor = acceptorById.get(acceptorId);
        if (!acceptor) continue;
        const rank = acceptorRank.get(acceptorId).get(proposer.id);
        if (rank === undefined) continue; // акцептор не вказав цього пропозера
        const holders = held.get(acceptorId);
        if (holders.length < acceptor.quota) {
          holders.push({ proposerId: proposer.id, rank });
          myEngaged.add(acceptorId);
          progress = true;
        } else {
          let worst = holders[0];
          for (const holder of holders) if (holder.rank > worst.rank) worst = holder;
          if (rank < worst.rank) {
            holders.splice(holders.indexOf(worst), 1);
            holders.push({ proposerId: proposer.id, rank });
            myEngaged.add(acceptorId);
            engaged.get(worst.proposerId).delete(acceptorId);
            progress = true;
          }
        }
      }
    }
  }

  const matches = [];
  for (const acceptor of acceptors) {
    for (const holder of held.get(acceptor.id)) {
      matches.push({ proposer: holder.proposerId, acceptor: acceptor.id });
    }
  }
  matches.sort((a, b) => a.proposer.localeCompare(b.proposer) || a.acceptor.localeCompare(b.acceptor));
  return { valid: true, matches };
}

/**
 * Перевірка інваріанта: чи існує блокуюча пара. Використовується тестом як незалежний оракул.
 * @returns {null | { proposer: string, acceptor: string }}
 */
export function findBlockingPair(input = {}, matches = []) {
  const proposers = normalizeSide(input.proposers);
  const acceptors = normalizeSide(input.acceptors);
  if (!proposers || !acceptors) return null;
  const proposerRank = buildRank(proposers);
  const acceptorRank = buildRank(acceptors);
  const matched = new Set(matches.map(m => `${m.proposer}|${m.acceptor}`));
  const proposerMatches = new Map(proposers.map(p => [p.id, []]));
  const acceptorMatches = new Map(acceptors.map(a => [a.id, []]));
  for (const m of matches) {
    if (proposerMatches.has(m.proposer) && acceptorMatches.has(m.acceptor)) {
      proposerMatches.get(m.proposer).push(m.acceptor);
      acceptorMatches.get(m.acceptor).push(m.proposer);
    }
  }
  for (const proposer of proposers) {
    for (const acceptor of acceptors) {
      if (matched.has(`${proposer.id}|${acceptor.id}`)) continue;
      const pRank = proposerRank.get(proposer.id).get(acceptor.id);
      const aRank = acceptorRank.get(acceptor.id).get(proposer.id);
      if (pRank === undefined || aRank === undefined) continue;
      const current = proposerMatches.get(proposer.id);
      const proposerWants = current.length < proposer.quota
        || current.some(x => proposerRank.get(proposer.id).get(x) > pRank);
      const held = acceptorMatches.get(acceptor.id);
      const acceptorWants = held.length < acceptor.quota
        || held.some(x => acceptorRank.get(acceptor.id).get(x) > aRank);
      if (proposerWants && acceptorWants) return { proposer: proposer.id, acceptor: acceptor.id };
    }
  }
  return null;
}
