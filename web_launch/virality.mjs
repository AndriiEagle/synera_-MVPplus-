// C10.L6 — Метрики вірусності: k-фактор (запрошені на запрошеного) і час до першої пари.
// Каталог: READINESS_DNA C10.L6. Детерміновано: без мережі, без Date.now().

const VALID_INSTANT = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const VALID_ID = value => typeof value === 'string' && value.length >= 1 && value.length <= 64 && /^[A-Za-z0-9_:-]+$/.test(value);

/**
 * k-фактор: скільки нових учасників у середньому приносить один existing.
 * @param {{ invitesSent: number, invitesAccepted: number }} input
 * @param {{ cohortSize?: number }} options cohortSize — база, що породила invites.
 */
export function kFactor({ invitesSent, invitesAccepted } = {}, { cohortSize } = {}) {
  if (!Number.isSafeInteger(invitesSent) || invitesSent < 0) return { valid: false, reason: 'INVALID_INVITES_SENT' };
  if (!Number.isSafeInteger(invitesAccepted) || invitesAccepted < 0) return { valid: false, reason: 'INVALID_INVITES_ACCEPTED' };
  if (invitesAccepted > invitesSent) return { valid: false, reason: 'ACCEPTED_EXCEEDS_SENT' };
  if (cohortSize !== undefined && (!Number.isSafeInteger(cohortSize) || cohortSize < 1)) return { valid: false, reason: 'INVALID_COHORT' };
  // Без бази неможливо нормалізувати: k-фактор визначається відносно розміру когорти.
  if (cohortSize === undefined) return { valid: false, reason: 'COHORT_REQUIRED' };
  if (invitesSent === 0) return { valid: true, invitesPerMember: 0, conversion: 0, k: 0 };
  const invitesPerMember = invitesSent / cohortSize;
  const conversion = invitesAccepted / invitesSent;
  return { valid: true, invitesPerMember, conversion, k: invitesPerMember * conversion };
}

/**
 * Час до першої пари в когорті: від momentT0 першого учасника до завершення першого кейсу.
 * Повертає millisecond тривалість і годинне вираження; невідомо — reason 'NO_COMPLETED_PAIR'.
 * @param {Array<{ caseId: string, participants: string[], createdAt: string, completedAt: string|null }>} cases
 */
export function timeToFirstPair(cases = []) {
  if (!Array.isArray(cases)) return { valid: false, reason: 'INVALID_CASES' };
  const completed = [];
  for (const record of cases) {
    if (!record || typeof record !== 'object') return { valid: false, reason: 'INVALID_CASE' };
    if (!VALID_ID(record.caseId) || !Array.isArray(record.participants) || record.participants.length !== 2) return { valid: false, reason: 'INVALID_CASE' };
    if (!VALID_INSTANT(record.createdAt)) return { valid: false, reason: 'INVALID_CASE' };
    if (record.completedAt !== null && !VALID_INSTANT(record.completedAt)) return { valid: false, reason: 'INVALID_CASE' };
    if (record.completedAt) completed.push(record);
  }
  if (completed.length === 0) return { valid: true, milliseconds: null, hours: null, reason: 'NO_COMPLETED_PAIR' };
  // Семантика метрики: скільки часу ПОТРІБНО парі від створення кейсу до завершення.
  // Беремо найшвидшу завершену пару.
  let best = null;
  for (const record of completed) {
    const duration = Date.parse(record.completedAt) - Date.parse(record.createdAt);
    if (duration < 0) return { valid: false, reason: 'COMPLETED_BEFORE_CREATED' };
    if (best === null || duration < best.duration) best = { duration, caseId: record.caseId };
  }
  return { valid: true, milliseconds: best.duration, hours: Math.round((best.duration / 3600000) * 100) / 100, caseId: best.caseId };
}

/**
 * Прозорість вірусності: метрика публікується лише якщо обидві сторони когорти >= k
 * (когорта і запрошені), інакше метрика ризикує ідентифікувати людей. Зв'язка з C10.L5.
 */
export function publishableVirality({ cohortSize, invitesAccepted }, { k = 5 } = {}) {
  if (!Number.isSafeInteger(k) || k < 2) return { valid: false, reason: 'INVALID_K' };
  if (!Number.isSafeInteger(cohortSize) || cohortSize < k) return { valid: false, reason: 'INVALID_COHORT' };
  if (!Number.isSafeInteger(invitesAccepted) || invitesAccepted < 0) return { valid: false, reason: 'INVALID_INVITES_ACCEPTED' };
  return { valid: true, publishable: invitesAccepted >= k };
}