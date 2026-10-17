// C11.L4 — тести QR-bill. Запуск з КОРЕНЯ: node web_launch/economics/qr_bill.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, isValidSwissIban, toRappen, buildQrBill, invoiceNumber } from './qr_bill.mjs';

test('C11.L4: flag OFF за замовчуванням — жодного payload до рішення Q6/Q7', () => {
  assert.equal(DEFAULT_CONFIG.enabled, false);
  assert.throws(() => buildQrBill({ invoiceNumber: 'x', amount: 1, iban: 'CH9300762011623852957', payee: { name: 'a', zip: '8001', city: 'Zürich' } }), /Білінг вимкнений/);
});

test('C11.L4: enabled flag сам по собі не дозволяє видавати невалідний Swiss QR payload', () => {
  const invoice = {
    invoiceNumber: 'PILOT-1', amount: 19.9, iban: 'CH9300762011623852957',
    payee: { name: 'Synera Pilot', zip: '8001', city: 'Zürich' },
  };
  assert.throws(() => buildQrBill(invoice, { ...DEFAULT_CONFIG, enabled: true }), /QR-bill формат не перевірено/);
});

test('C11.L4: Swiss IBAN — відомий валідний валідується, кривий відкидається (мод-97)', () => {
  assert.equal(isValidSwissIban('CH9300762011623852957'), true);   // канонічний тест-IBAN
  assert.equal(isValidSwissIban('CH93 0076 2011 6238 5295 7'), true, 'пробіли допускаються');
  assert.equal(isValidSwissIban('CH9300762011623852958'), false);  // контрольна сума зламана
  assert.equal(isValidSwissIban('DE9300762011623852957'), false);  // не CH
  assert.equal(isValidSwissIban('CH93'), false);
  assert.equal(isValidSwissIban(null), false);
  assert.equal(isValidSwissIban(42), false);
});

test('C11.L4: toRappen — раппени без float-помилок, fail-closed на смітті', () => {
  assert.equal(toRappen(19.9), 1990);
  assert.equal(toRappen(0.1 + 0.2), 30);
  assert.throws(() => toRappen(-1), /Некоректна сума/);
  assert.throws(() => toRappen('10'), /Некоректна сума/);
  assert.throws(() => toRappen(NaN), /Некоректна сума/);
});

test('C11.L4: buildQrBill — навіть enabled відкидає криві реквізити', () => {
  const cfg = { ...DEFAULT_CONFIG, enabled: true };
  const inv = { invoiceNumber: 'i-1', amount: 100, iban: 'CH9300762011623852957', payee: { name: 'S', zip: '8001', city: 'Zürich' } };
  assert.throws(() => buildQrBill({ ...inv, iban: 'XX00' }, cfg), /Swiss IBAN/);
  assert.throws(() => buildQrBill({ ...inv, payee: { name: 'S' } }, cfg), /отримувач/);
  assert.throws(() => buildQrBill({ ...inv, amount: -5 }, cfg), /Некоректна сума/);
  assert.throws(() => buildQrBill({ ...inv, currency: 'USD' }, cfg), /Некоректна валюта/);
});

test('C11.L4: invoiceNumber — детермінований формат, fail-closed', () => {
  assert.equal(invoiceNumber('2026-09-23T10:00:00Z', 'designers', 3), 'QR-20260923-designers-0003');
  assert.throws(() => invoiceNumber('garbage', 'designers', 1), /Некоректна дата/);
  assert.throws(() => invoiceNumber('2026-09-23', 'designers', 0), /Некоректний номер/);
  assert.throws(() => invoiceNumber('2026-09-23', 'designers', 1.5), /Некоректний номер/);
});
