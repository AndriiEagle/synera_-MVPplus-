import test from 'node:test';
import assert from 'node:assert/strict';
import { economics } from './economics.mjs';
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.000001, `${actual} != ${expected}`);
test('economics: includes recurring billing fee, per-member labour and fixed work', () => {
  const r = economics(); close(r.feesPerMember, 1.704); close(r.contribution, 28.796); close(r.afterOwnerTime, 829.8); assert.equal(r.breakEvenMembers, 22); close(r.hoursPerMonth, 16.3333333333333);
});
test('economics: VAT-inclusive price removes VAT from revenue while card fee uses full charge', () => {
  const r = economics({ price: 108.1, members: 1, vat: 8.1, minutes: 0, ai: 0, fixedHours: 0, infrastructure: 0, acquisition: 0 });
  close(r.revenuePerMember, 100); close(r.feesPerMember, 4.1916); close(r.afterOwnerTime, 95.8084);
});
test('economics: negative unit contribution has no finite break-even; zero customers still carry fixed costs', () => {
  assert.equal(economics({ price: 20, minutes: 60 }).breakEvenMembers, null);
  close(economics({ members: 0 }).afterOwnerTime, -610);
  assert.equal(economics({ price: 1 }).sixtyPercentFeasible, false);
  assert.equal(economics({ price: 1 }).minutesFor60Percent, null);
});
test('economics: invalid, missing numeric and fractional member inputs are rejected', () => {
  for (const input of [{ price: 0 }, { ai: -1 }, { members: 2.5 }, { vat: NaN }, { minutes: Infinity }, { paymentPercent: 100, billingPercent: 1 }]) assert.throws(() => economics(input));
});
