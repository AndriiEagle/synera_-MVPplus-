// C11.L4 — підготовка Swiss QR-bill, випуск payload тимчасово заблоковано.
// Q6/Q7 і enabled flag не доводять відповідність формату SIX або готовність до оплати.

export const DEFAULT_CONFIG = Object.freeze({
  enabled: false,            // перемикач монетизації: ON тільки після Q6/Q7 рішення оператора
  rails: 'qr-bill',          // 'qr-bill' | 'twint' | 'cards' — перший крок лише один
  currency: 'CHF',
  vat: { registered: false, rate: 0.081 }, // MWSTG 641.20: реєстрація обовʼязкова від CHF 100k
  iban: null,                // NEEDS_INPUT: QR-bill IBAN отримувача (оператор дає при activation)
  payee: null,               // NEEDS_INPUT: { name, street, houseNumber, zip, city }
});

/** Валідація Swiss IBAN (CH + 21 символів, мод-97). Чиста функція. */
export function isValidSwissIban(iban) {
  if (typeof iban !== 'string') return false;
  const compact = iban.replace(/\s/g, '').toUpperCase();
  if (!/^CH\d{19}$/.test(compact)) return false;
  const rearranged = compact.slice(4) + compact.slice(0, 4);
  const digits = [...rearranged].map(c => {
    const code = c.charCodeAt(0);
    return code >= 65 ? String(code - 55) : c;
  }).join('');
  let mod = 0;
  for (const d of digits) mod = (mod * 10 + Number(d)) % 97;
  return mod === 1;
}

/** Сума в раппенах (int, без float-помилок). */
export function toRappen(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    throw new Error('Некоректна сума: ' + String(amount));
  }
  return Math.round(amount * 100);
}

/**
 * Guard для QR-bill: не видає платіжний payload, поки формат і реальні реквізити
 * не пройшли незалежну перевірку. Для першого пілоту використовується рахунок банку.
 */
export function buildQrBill(invoice, config = DEFAULT_CONFIG) {
  if (config.enabled !== true) throw new Error('Білінг вимкнений: потрібне рішення Q6/Q7 (flag enabled)');
  if (!invoice || !invoice.invoiceNumber) throw new Error('Некоректний рахунок: немає номера');
  if (!isValidSwissIban(invoice.iban)) throw new Error('Некоректний Swiss IBAN');
  if (!invoice.payee || !invoice.payee.name || !invoice.payee.zip || !invoice.payee.city) {
    throw new Error('Некоректний отримувач платежу: name/zip/city обовʼязкові');
  }
  toRappen(invoice.amount);
  const currency = invoice.currency ?? config.currency ?? 'CHF';
  if (!['CHF', 'EUR'].includes(currency)) throw new Error('Некоректна валюта: ' + currency);
  throw new Error('QR-bill формат не перевірено: згенеруйте перший рахунок у банку та перевірте реквізити');
}

/** Детермінований номер рахунку за період (без стану, для відтворюваності). */
export function invoiceNumber(dateIso, cohortId, seq) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(dateIso))) throw new Error('Некоректна дата: ' + dateIso);
  if (typeof seq !== 'number' || seq < 1 || !Number.isInteger(seq)) throw new Error('Некоректний номер: ' + seq);
  return `QR-${String(dateIso).slice(0, 10).replace(/-/g, '')}-${cohortId}-${String(seq).padStart(4, '0')}`;
}
