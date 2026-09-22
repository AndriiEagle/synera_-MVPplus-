// MA4 — Цикл самопокращення: офлайн-реплей + заздалегідь зареєстровані ворота + журнал рішень.
// Каталог: plan/readiness/MATH_AGENTS.uk.md (MA4), READINESS_DNA C02.L7.
// Ворота: жоден параметр не підвищується без виграшу на holdout ТА згоди людини.
// Детерміновано: без мережі, без Date.now() (час передається аргументом).

export const DIRECTIONS = Object.freeze(['higher_is_better', 'lower_is_better']);

/**
 * Реєструє ворота ДО будь-якого прогону. Повертає новий масив (не мутує вхід).
 */
export function registerGate(gates, gate) {
  if (!Array.isArray(gates)) return { valid: false, reason: 'INVALID_GATES' };
  if (!gate || typeof gate !== 'object' || Array.isArray(gate)) return { valid: false, reason: 'INVALID_GATE' };
  if (typeof gate.id !== 'string' || !gate.id.trim() || gate.id.length > 64) return { valid: false, reason: 'INVALID_GATE_ID' };
  if (typeof gate.hypothesis !== 'string' || !gate.hypothesis.trim()) return { valid: false, reason: 'INVALID_HYPOTHESIS' };
  if (typeof gate.metric !== 'string' || !gate.metric.trim()) return { valid: false, reason: 'INVALID_METRIC' };
  if (typeof gate.threshold !== 'number' || !Number.isFinite(gate.threshold) || gate.threshold < 0) return { valid: false, reason: 'INVALID_THRESHOLD' };
  if (!DIRECTIONS.includes(gate.direction)) return { valid: false, reason: 'INVALID_DIRECTION' };
  if (gates.some(existing => existing.id === gate.id)) return { valid: false, reason: 'GATE_ALREADY_REGISTERED' };
  return {
    valid: true,
    gates: [...gates, { id: gate.id, hypothesis: gate.hypothesis, metric: gate.metric, threshold: gate.threshold, direction: gate.direction }],
  };
}

function mean(values) {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const value of values) sum += value;
  return sum / values.length;
}

/**
 * Офлайн-реплей: кандидат і базова лінія вимірюються на ТИХ САМИХ записаних подіях.
 * @param {{ gate?: object, events?: unknown[], candidate?: Function, baseline?: Function }} input
 */
export function runReplay(input = {}) {
  const { gate, events, candidate, baseline } = input;
  if (!gate || typeof gate !== 'object' || Array.isArray(gate)) return { valid: false, reason: 'GATE_NOT_PREREGISTERED' };
  if (!Array.isArray(events) || events.length === 0) return { valid: false, reason: 'EMPTY_EVENTS' };
  if (typeof candidate !== 'function' || typeof baseline !== 'function') return { valid: false, reason: 'INVALID_MEASURE' };
  const candidateValues = [];
  const baselineValues = [];
  for (const event of events) {
    const candidateValue = candidate(event);
    const baselineValue = baseline(event);
    if (!Number.isFinite(candidateValue) || !Number.isFinite(baselineValue)) return { valid: false, reason: 'NON_FINITE_MEASUREMENT' };
    candidateValues.push(candidateValue);
    baselineValues.push(baselineValue);
  }
  const candidateScore = mean(candidateValues);
  const baselineScore = mean(baselineValues);
  const delta = gate.direction === 'higher_is_better' ? candidateScore - baselineScore : baselineScore - candidateScore;
  return {
    valid: true,
    gateId: gate.id,
    metric: gate.metric,
    candidateScore,
    baselineScore,
    delta,
    holdoutWin: delta >= gate.threshold,
  };
}

/**
 * Рішення про підвищення. Людина ніколи не підписується автоматично.
 * @returns {{ decision: 'promoted'|'needs_review'|'rejected', reasons: string[] }}
 */
export function decidePromotion({ replay, gate, humanApproved } = {}) {
  if (!gate || typeof gate !== 'object' || Array.isArray(gate)) return { decision: 'rejected', reasons: ['GATE_NOT_PREREGISTERED'] };
  if (!replay || replay.valid !== true) return { decision: 'rejected', reasons: [replay && replay.reason ? replay.reason : 'INVALID_REPLAY'] };
  if (replay.gateId !== gate.id) return { decision: 'rejected', reasons: ['GATE_MISMATCH'] };
  if (replay.holdoutWin !== true) return { decision: 'rejected', reasons: ['NO_HOLDOUT_WIN'] };
  if (humanApproved !== true) return { decision: 'needs_review', reasons: ['HUMAN_APPROVAL_REQUIRED'] };
  return { decision: 'promoted', reasons: [] };
}

/**
 * Додає запис у журнал рішень. Append-only: повертає НОВИЙ масив, вхід не змінюється.
 */
export function appendDecision(journal, entry = {}) {
  if (!Array.isArray(journal)) return { valid: false, reason: 'INVALID_JOURNAL' };
  const normalized = {
    hypothesis: typeof entry.hypothesis === 'string' ? entry.hypothesis : '',
    metric: typeof entry.metric === 'string' ? entry.metric : '',
    holdout: entry.holdout === true,
    approval: entry.approval === true,
    timestamp: typeof entry.timestamp === 'string' ? entry.timestamp : '',
  };
  return [...journal, normalized];
}
