// C11.L4 — Swiss QR-bill payload builder (REVERSIBLE_DEFAULT, flag OFF за замовчуванням).
// Канон: BLOCKED_HUMAN.md Q6/Q7; plan/legal/SWISS_LEGAL_LAYER.uk.md (PBV 942.211: B2C з ПДВ,
// B2B без); GENESIS_SPEC.uk.md:75 (H2: MWST, договір, QR-bill).
// Дизайн: детермінована побудова QR-bill payload (Swiss QR standard: 6 блоків, поاتفільників
// розділювачів), жодних мережевих викликів, жодного платіжного процесора. Активація
// = config gate (enabled:false за замовчуванням) — перемикач після рішення Q6/Q7.
import { createHash } from 'node:crypto';

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
 * Побудова payload Swiss QR-bill (31 рядок, розділювач \n).
 * @param {{invoiceNumber, amount, currency?, payee:{name,street,houseNumber,zip,city}, iban, payer?:{name,street,city}, reference?, vat?:{registered,rate}}} invoice
 */
export function buildQrBill(invoice, config = DEFAULT_CONFIG) {
  if (config.enabled !== true) throw new Error('Білінг вимкнений: потрібне рішення Q6/Q7 (flag enabled)');
  if (!invoice || !invoice.invoiceNumber) throw new Error('Некоректний рахунок: немає номера');
  if (!isValidSwissIban(invoice.iban)) throw new Error('Некоректний Swiss IBAN');
  if (!invoice.payee || !invoice.payee.name || !invoice.payee.zip || !invoice.payee.city) {
    throw new Error('Некоректний отримувач платежу: name/zip/city обовʼязкові');
  }
  const rappen = toRappen(invoice.amount);
  const currency = invoice.currency ?? config.currency ?? 'CHF';
  if (!['CHF', 'EUR'].includes(currency)) throw new Error('Некоректна валюта: ' + currency);
  const vat = invoice.vat ?? config.vat;
  const vatText = vat?.registered
    ? `VAT at ${((vat.rate ?? 0) * 100).toFixed(1)}% included` // PBV: ціна з ПДВ для B2C
    : 'VAT not registered (below MWSTG threshold)';
  const lines = [
    'SPD',                                   // 1 QRType
    `${rappen}`,                             // 2.1 amount (rappen)
    currency,                                // 2.2 currency
    // 2.3 ultimate debtor (порожній, якщо payer не заданий)
    ['', '', '', '', '', '', ''],
    // 3 ultimate creditor (payee) — S-блок: Name/AdrType/Street/HouseNo/Zip/City/Country
    'S', invoice.payee.name, 'K', invoice.payee.street ?? '', String(invoice.payee.houseNumber ?? ''), invoice.payee.zip, invoice.payee.city, 'CH',
    invoice.iban.replace(/\s/g, '').toUpperCase(),
    // 5 payment reference
    invoice.reference ?? '',
    // 6 unstructured message (invoice number + VAT text)
    `${invoice.invoiceNumber} · ${vatText}`,
    'EPD',                                   // 7 trailer
  ];
  const payload = lines.flat().join('\n');
  return {
    payload,
    sha256: createHash('sha256').update(payload, 'utf8').digest('hex'),
    currency,
    rappen,
    vat_text: vatText,
    rail: 'qr-bill',
  };
}

/** Детермінований номер рахунку за період (без стану, для відтворюваності). */
export function invoiceNumber(dateIso, cohortId, seq) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(dateIso))) throw new Error('Некоректна дата: ' + dateIso);
  if (typeof seq !== 'number' || seq < 1 || !Number.isInteger(seq)) throw new Error('Некоректний номер: ' + seq);
  return `QR-${String(dateIso).slice(0, 10).replace(/-/g, '')}-${cohortId}-${String(seq).padStart(4, '0')}`;
}