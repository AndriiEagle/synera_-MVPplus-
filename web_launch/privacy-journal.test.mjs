import test from 'node:test';
import assert from 'node:assert/strict';
import { purgeExpiredJournal } from '../tools/privacy-journal-retention.mjs';
test('P2: journal mocked clock uses last activity, expires at 30 days, preserves fresh and original entries', () => {
  const now = Date.parse('2026-10-29T00:00:00Z'), date = days => new Date(now - days * 86400000).toISOString();
  const original = { old: { messages: [{ at: date(30) }], events: [] }, fresh: { messages: [{ at: date(40) }], events: [{ at: date(1) }] }, invalid: { messages: [] } };
  const before = JSON.stringify(original), result = purgeExpiredJournal(original, now);
  assert.deepEqual(result.expired, ['old', 'invalid']); assert.deepEqual(Object.keys(result.sessions), ['fresh']); assert.equal(JSON.stringify(original), before);
});
