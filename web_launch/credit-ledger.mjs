// C11.L3 — Леджер кредитів: append-only, ідемпотентний, із поверненнями.
// Каталог: READINESS_DNA C11.L3. Жодних грошей тут не рухається — це журнал права на дію.
// Детерміновано: без мережі, без Date.now() (час передається аргументом).

const ENTRY_TYPES = Object.freeze(['grant', 'spend', 'refund', 'expire']);
const VALID_ID = value => typeof value === 'string' && value.length >= 1 && value.length <= 64 && /^[A-Za-z0-9_:-]+$/.test(value);
const VALID_INSTANT = value => typeof value === 'string' && Number.isFinite(Date.parse(value));

function validateEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 'INVALID_ENTRY';
  if (!ENTRY_TYPES.includes(entry.type)) return 'INVALID_TYPE';
  if (!VALID_ID(entry.ownerId)) return 'INVALID_OWNER';
  if (!Number.isSafeInteger(entry.amount) || entry.amount <= 0) return 'INVALID_AMOUNT';
  if (!VALID_INSTANT(entry.at)) return 'INVALID_INSTANT';
  if (!VALID_ID(entry.reason)) return 'INVALID_REASON';
  if (!VALID_ID(entry.idempotencyKey)) return 'INVALID_IDEMPOTENCY_KEY';
  return null;
}

function validateLedger(ledger) {
  if (!Array.isArray(ledger)) return 'INVALID_LEDGER';
  const seen = new Set();
  for (const entry of ledger) {
    const error = validateEntry(entry);
    if (error) return error;
    if (seen.has(entry.idempotencyKey)) return 'DUPLICATE_IDEMPOTENCY_KEY';
    seen.add(entry.idempotencyKey);
  }
  return null;
}

/**
 * Додає запис. Append-only: повертає НОВИЙ масив; вхід не мутується.
 * Ідемпотентність: повторний додавання з тим самим idempotencyKey повертає
 * { appended: false, ledger } і нічого не змінює — жодного подвійного списання.
 */
export function appendEntry(ledger, entry) {
  const ledgerError = validateLedger(ledger);
  if (ledgerError) return { valid: false, reason: ledgerError, appended: false, ledger };
  const entryError = validateEntry(entry);
  if (entryError) return { valid: false, reason: entryError, appended: false, ledger };
  if (ledger.some(existing => existing.idempotencyKey === entry.idempotencyKey)) {
    return { valid: true, appended: false, reason: 'DUPLICATE_IDEMPOTENCY_KEY', ledger };
  }
  return { valid: true, appended: true, ledger: [...ledger, { ...entry }] };
}

/** Бал власника: grant+refund додають, spend і expire віднімають; спуск нижче нуля неможливий. */
export function balance(ledger, ownerId) {
  if (validateLedger(ledger) || !VALID_ID(ownerId)) return { valid: false, reason: 'INVALID_LEDGER', balance: 0 };
  let total = 0;
  for (const entry of ledger) {
    if (entry.ownerId !== ownerId) continue;
    if (entry.type === 'grant' || entry.type === 'refund') total += entry.amount;
    if (entry.type === 'spend' || entry.type === 'expire') total -= entry.amount;
    if (total < 0) return { valid: false, reason: 'NEGATIVE_BALANCE_IN_LEDGER', balance: total };
  }
  return { valid: true, balance: total };
}

/**
 * Списання: дозволяється лише в межах балансу. Перевіряється ПОТОЧНИМ балансом,
 * тому конкурентний подвійний spend неможливий у межах одного масиву-джерела.
 */
export function spend(ledger, { ownerId, amount, at, reason, idempotencyKey }) {
  const current = balance(ledger, ownerId);
  if (!current.valid) return { valid: false, reason: current.reason, ledger };
  if (!Number.isSafeInteger(amount) || amount <= 0) return { valid: false, reason: 'INVALID_AMOUNT', ledger };
  if (current.balance < amount) return { valid: false, reason: 'INSUFFICIENT_CREDITS', ledger };
  return appendEntry(ledger, { type: 'spend', ownerId, amount, at, reason, idempotencyKey });
}

/**
 * Повернення: лише за існуючим spend того ж власника, і лише один refund на один spend.
 * refundAmount може бути частковим, але не більшим за суму spend мінус уже повернене.
 */
export function refund(ledger, { spendKey, refundAmount, at, reason, idempotencyKey }) {
  const ledgerError = validateLedger(ledger);
  if (ledgerError) return { valid: false, reason: ledgerError, ledger };
  const spent = ledger.find(entry => entry.type === 'spend' && entry.idempotencyKey === spendKey);
  if (!spent) return { valid: false, reason: 'SPEND_NOT_FOUND', ledger };
  if (!Number.isSafeInteger(refundAmount) || refundAmount <= 0) return { valid: false, reason: 'INVALID_AMOUNT', ledger };
  const alreadyRefunded = ledger
    .filter(entry => entry.type === 'refund' && entry.reason === `refund:${spendKey}`)
    .reduce((sum, entry) => sum + entry.amount, 0);
  if (alreadyRefunded + refundAmount > spent.amount) return { valid: false, reason: 'REFUND_EXCEEDS_SPEND', ledger };
  return appendEntry(ledger, { type: 'refund', ownerId: spent.ownerId, amount: refundAmount, at, reason: `refund:${spendKey}`, idempotencyKey });
}
