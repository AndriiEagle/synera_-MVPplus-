import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatTime, formatDateTime, formatSlot, zoneOffsetMinutes, zoneParts, CH_LOCALES } from '../../web_launch/i18n-ch.mjs';

const EN_DASH = '–';
const instant = '2026-11-05T13:05:00Z'; // 14:05 CET in Zurich

test('numeric date is dd.mm.yyyy in all three Swiss languages', () => {
  for (const locale of CH_LOCALES) assert.equal(formatDate(instant, locale), '05.11.2026', locale);
  assert.equal(formatDate('2026-01-09T00:30:00Z', 'de-CH'), '09.01.2026');
});

test('long date carries the month name of each language', () => {
  assert.match(formatDate(instant, 'de-CH', { style: 'long' }), /^5\. November 2026$/);
  assert.match(formatDate(instant, 'fr-CH', { style: 'long' }), /^5 novembre 2026$/);
  assert.match(formatDate(instant, 'it-CH', { style: 'long' }), /^5 novembre 2026$/);
});

test('time is 24-hour HH:mm, no am/pm, zero-padded', () => {
  for (const locale of CH_LOCALES) {
    assert.equal(formatTime(instant, locale), '14:05', locale);
    assert.equal(formatTime('2026-11-05T23:07:00Z', locale), '00:07', 'wraps to next day in Zurich');
    assert.equal(formatTime('2026-11-05T07:00:00Z', locale), '08:00');
  }
  assert.equal(formatDateTime(instant, 'fr-CH'), '05.11.2026, 14:05');
});

test('date crosses midnight in Zurich even though the UTC date does not', () => {
  assert.equal(formatDate('2026-11-05T23:30:00Z', 'de-CH'), '06.11.2026');
  assert.equal(formatDate('2026-11-05T23:30:00Z', 'de-CH', { timeZone: 'UTC' }), '05.11.2026');
});

test('calendar slot: same-day range uses one date; midnight crossing repeats the date', () => {
  assert.equal(formatSlot({ start: instant, durationMinutes: 30 }, 'de-CH'), `05.11.2026, 14:05${EN_DASH}14:35`);
  assert.equal(formatSlot({ start: instant, end: '2026-11-05T14:05:00Z' }, 'it-CH'), `05.11.2026, 14:05${EN_DASH}15:05`);
  assert.equal(formatSlot({ start: '2026-11-05T22:30:00Z', durationMinutes: 60 }, 'fr-CH'), `05.11.2026, 23:30 ${EN_DASH} 06.11.2026, 00:30`);
});

test('slot rejects missing, zero, negative or reversed ranges', () => {
  assert.throws(() => formatSlot({ start: instant }, 'de-CH'), /end or a positive durationMinutes/);
  assert.throws(() => formatSlot({ start: instant, durationMinutes: 0 }, 'de-CH'), TypeError);
  assert.throws(() => formatSlot({ start: instant, end: instant }, 'de-CH'), /after start/);
  assert.throws(() => formatSlot({ start: 'yesterday', durationMinutes: 20 }, 'de-CH'), /invalid date/);
});

test('DST (M17): Zurich offset is +120 before and +60 after the October switch, and back in March', () => {
  assert.equal(zoneOffsetMinutes('2026-10-25T00:30:00Z'), 120, '02:30 CEST, first pass');
  assert.equal(zoneOffsetMinutes('2026-10-25T01:30:00Z'), 60, '02:30 CET, second pass of the repeated hour');
  assert.equal(formatTime('2026-10-25T00:30:00Z', 'de-CH'), formatTime('2026-10-25T01:30:00Z', 'de-CH'), 'the repeated local time is only distinguishable by offset');
  assert.equal(zoneOffsetMinutes('2026-03-29T00:30:00Z'), 60);
  assert.equal(zoneOffsetMinutes('2026-03-29T01:30:00Z'), 120);
  assert.equal(zoneParts('2026-03-29T01:30:00Z').hour, 3, '02:30 local does not exist; the clock jumps to 03:30');
});

test('invalid dates and locales throw', () => {
  assert.throws(() => formatDate('not a date', 'de-CH'), /invalid date/);
  assert.throws(() => formatTime(instant, 'en-CH'), /unsupported Swiss locale/);
  assert.throws(() => formatDate(instant, 'de-CH', { style: 'medium' }), /unknown date style/);
});
