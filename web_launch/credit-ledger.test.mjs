import test from 'node:test';
import assert from 'node:assert/strict';
import { appendEntry, balance, spend, refund } from './credit-ledger.mjs';

const entry = overrides => ({ type: 'grant', ownerId: 'u-1', amount: 10, at: '2026-09-20T10:00:00.000Z', reason: 'pilot_grant', idempotencyKey: 'k-1', ...overrides });

test('C11.L3: append-only — новий масив, вхід не мутується', () => {
  const ledger = [];
  const next = appendEntry(ledger, entry());
  assert.equal(next.appended, true);
  assert.equal(ledger.length, 0);
  assert.equal(next.ledger.length, 1);
  assert.equal(next.ledger[0].amount, 10);
});

test('C11.L3: ідемпотентність — той самий idempotencyKey не списує двічі', () => {
  let ledger = [];
  ledger = appendEntry(ledger, entry({ idempotencyKey: 'dup' })).ledger;
  const second = appendEntry(ledger, entry({ idempotencyKey: 'dup' }));
  assert.equal(second.appended, false);
  assert.equal(second.ledger.length, 1);
  assert.equal(balance(ledger, 'u-1').balance, 10);
});

test('C11.L3: баланс і заборона негативного залишку', () => {
  let ledger = [];
  ledger = appendEntry(ledger, entry({ amount: 5 })).ledger;
  const tooMuch = spend(ledger, { ownerId: 'u-1', amount: 6, at: '2026-09-20T11:00:00.000Z', reason: 'intro_request', idempotencyKey: 's-1' });
  assert.equal(tooMuch.valid, false);
  assert.equal(tooMuch.reason, 'INSUFFICIENT_CREDITS');
  const ok = spend(ledger, { ownerId: 'u-1', amount: 5, at: '2026-09-20T11:00:00.000Z', reason: 'intro_request', idempotencyKey: 's-1' });
  assert.equal(ok.appended, true);
  assert.equal(balance(ok.ledger, 'u-1').balance, 0);
  assert.equal(balance(ok.ledger, 'u-2').balance, 0);
  assert.equal(balance([], 'u-1').balance, 0);
});

test('C11.L3: refund — лише за існуючим spend, не більше суми, один шлях на spend', () => {
  let ledger = [];
  ledger = appendEntry(ledger, entry({ amount: 10 })).ledger;
  ledger = spend(ledger, { ownerId: 'u-1', amount: 8, at: '2026-09-20T11:00:00.000Z', reason: 'intro_request', idempotencyKey: 'sp-1' }).ledger;
  assert.equal(balance(ledger, 'u-1').balance, 2);
  const missing = refund(ledger, { spendKey: 'sp-404', refundAmount: 1, at: '2026-09-20T12:00:00.000Z', reason: 'r', idempotencyKey: 'r-1' });
  assert.equal(missing.reason, 'SPEND_NOT_FOUND');
  const tooMuch = refund(ledger, { spendKey: 'sp-1', refundAmount: 9, at: '2026-09-20T12:00:00.000Z', reason: 'r', idempotencyKey: 'r-2' });
  assert.equal(tooMuch.reason, 'REFUND_EXCEEDS_SPEND');
  const partial = refund(ledger, { spendKey: 'sp-1', refundAmount: 3, at: '2026-09-20T12:00:00.000Z', reason: 'r', idempotencyKey: 'r-3' });
  assert.equal(partial.appended, true);
  assert.equal(balance(partial.ledger, 'u-1').balance, 5);
  const repeat = refund(partial.ledger, { spendKey: 'sp-1', refundAmount: 6, at: '2026-09-20T12:01:00.000Z', reason: 'r', idempotencyKey: 'r-4' });
  assert.equal(repeat.reason, 'REFUND_EXCEEDS_SPEND');
  const full = refund(partial.ledger, { spendKey: 'sp-1', refundAmount: 5, at: '2026-09-20T12:02:00.000Z', reason: 'r', idempotencyKey: 'r-5' });
  assert.equal(full.appended, true);
  assert.equal(balance(full.ledger, 'u-1').balance, 10);
});

test('C11.L3: некоректний вхід — reason codes, не throw; сам леджер захищений від сміття', () => {
  for (const bad of [
    entry({ type: 'steal' }), entry({ amount: 0 }), entry({ amount: -5 }), entry({ amount: 1.5 }),
    entry({ ownerId: '' }), entry({ at: 'not-a-date' }), entry({ reason: '' }), entry({ idempotencyKey: '' }),
    null, 'string',
  ]) {
    const result = appendEntry([], bad);
    assert.equal(result.valid, false, JSON.stringify(bad));
    assert.equal(result.appended, false);
  }
  assert.equal(appendEntry('not-array', entry()).reason, 'INVALID_LEDGER');
  assert.equal(appendEntry([entry()], entry({ idempotencyKey: 'k-1' })).reason, 'DUPLICATE_IDEMPOTENCY_KEY');
  assert.equal(balance('nope', 'u-1').valid, false);
  assert.equal(balance([{ ...entry(), type: 'spend', amount: 10 }, { ...entry(), type: 'spend', amount: 5, idempotencyKey: 'k-2' }], 'u-1').reason, 'NEGATIVE_BALANCE_IN_LEDGER');
});