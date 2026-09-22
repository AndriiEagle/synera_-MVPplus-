// C11.L1 — Кошторис на кейс: оператор-хвилини, AI-виклики, грошові витрати.
// Спирається на телеметрію economics.mjs (operator minutes уже там валідовані).
// Gate: невиміряне НЕ вигадується — відсутні дані дають 'unknown', а не нуль.
// Детерміновано: без мережі, без Date.now().

const VALID_ID = value => typeof value === 'string' && value.length >= 1 && value.length <= 64 && /^[A-Za-z0-9_:-]+$/.test(value);

/**
 * Кошторис одного кейса.
 * @param {{ caseId: string, operatorMinutes: number, operatorCategory: string,
 *           aiCalls: number, cashMinor: number|null, currency: string }} input
 */
export function caseCost(input = {}) {
  if (!VALID_ID(input.caseId)) return { valid: false, reason: 'INVALID_CASE_ID' };
  if (!Number.isSafeInteger(input.operatorMinutes) || input.operatorMinutes < 0) return { valid: false, reason: 'INVALID_OPERATOR_MINUTES' };
  if (!Number.isSafeInteger(input.aiCalls) || input.aiCalls < 0) return { valid: false, reason: 'INVALID_AI_CALLS' };
  const cashKnown = input.cashMinor !== null && input.cashMinor !== undefined;
  if (cashKnown && (!Number.isSafeInteger(input.cashMinor) || input.cashMinor < 0)) return { valid: false, reason: 'INVALID_CASH' };
  if (cashKnown && (typeof input.currency !== 'string' || !/^[A-Z]{3}$/.test(input.currency))) return { valid: false, reason: 'INVALID_CURRENCY' };
  return {
    valid: true,
    caseId: input.caseId,
    operatorMinutes: input.operatorMinutes,
    operatorCategory: input.operatorCategory ?? 'technical',
    aiCalls: input.aiCalls,
    cashMinor: cashKnown ? input.cashMinor : null,
    currency: cashKnown ? input.currency : null,
    cashKnown,
  };
}

/**
 * Агрегат по пілоту: суми по всіх кейсах. Невиміряні гроші НЕ маскуються нулями —
 * окремий лічильник unknownCashCases показує, скільки кошторисів неповні.
 */
export function pilotCost(cases = []) {
  if (!Array.isArray(cases)) return { valid: false, reason: 'INVALID_CASES' };
  let operatorMinutes = 0;
  let aiCalls = 0;
  let cashMinor = 0;
  let unknownCashCases = 0;
  const currencies = new Set();
  for (const record of cases) {
    const cost = caseCost(record);
    if (!cost.valid) return { valid: false, reason: cost.reason };
    operatorMinutes += cost.operatorMinutes;
    aiCalls += cost.aiCalls;
    if (cost.cashKnown) {
      cashMinor += cost.cashMinor;
      currencies.add(cost.currency);
    } else {
      unknownCashCases++;
    }
  }
  if (currencies.size > 1) return { valid: false, reason: 'MIXED_CURRENCIES' };
  const currency = currencies.size === 1 ? [...currencies][0] : null;
  return { valid: true, caseCount: cases.length, operatorMinutes, aiCalls, cashMinor: unknownCashCases === cases.length ? null : cashMinor, currency, unknownCashCases };
}

/** Середнє на кейс; при 0 кейсів — reason, а не ділення на нуль. */
export function perCaseAverage(pilot) {
  if (!pilot || pilot.valid !== true) return { valid: false, reason: 'INVALID_PILOT' };
  if (pilot.caseCount === 0) return { valid: false, reason: 'NO_CASES' };
  return {
    valid: true,
    operatorMinutesPerCase: Math.round((pilot.operatorMinutes / pilot.caseCount) * 100) / 100,
    aiCallsPerCase: Math.round((pilot.aiCalls / pilot.caseCount) * 100) / 100,
    cashMinorPerCase: pilot.cashMinor === null ? null : Math.round((pilot.cashMinor / pilot.caseCount) * 100) / 100,
    currency: pilot.currency,
  };
}