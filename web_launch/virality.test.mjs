import test from 'node:test';
import assert from 'node:assert/strict';
import { kFactor, timeToFirstPair, publishableVirality } from './virality.mjs';

test('C10.L6: k-фактор — hand-computed fixture', () => {
  const result = kFactor({ invitesSent: 20, invitesAccepted: 5 }, { cohortSize: 10 });
  assert.equal(result.valid, true);
  assert.equal(result.invitesPerMember, 2);
  assert.equal(result.conversion, 0.25);
  assert.equal(result.k, 0.5);
  const zero = kFactor({ invitesSent: 0, invitesAccepted: 0 }, { cohortSize: 10 });
  assert.deepEqual({ k: zero.k, invitesPerMember: zero.invitesPerMember, conversion: zero.conversion }, { k: 0, invitesPerMember: 0, conversion: 0 });
});

test('C10.L6: некоректний вхід — reason codes, не throw', () => {
  assert.equal(kFactor({ invitesSent: -1, invitesAccepted: 0 }).reason, 'INVALID_INVITES_SENT');
  assert.equal(kFactor({ invitesSent: 5, invitesAccepted: 6 }).reason, 'ACCEPTED_EXCEEDS_SENT');
  assert.equal(kFactor({ invitesSent: 5, invitesAccepted: 1 }).reason, 'COHORT_REQUIRED');
  assert.equal(kFactor({ invitesSent: 5, invitesAccepted: 1 }, { cohortSize: 0 }).reason, 'INVALID_COHORT');
  assert.equal(kFactor({ invitesSent: 5, invitesAccepted: 1 }, { cohortSize: 2.5 }).reason, 'INVALID_COHORT');
});

test('C10.L6: час до першої пари — найраніша пара від найранішого створення', () => {
  const result = timeToFirstPair([
    { caseId: 'c1', participants: ['a', 'b'], createdAt: '2026-09-20T10:00:00.000Z', completedAt: null },
    { caseId: 'c2', participants: ['c', 'd'], createdAt: '2026-09-20T12:00:00.000Z', completedAt: '2026-09-21T12:00:00.000Z' },
    { caseId: 'c3', participants: ['e', 'f'], createdAt: '2026-09-20T11:00:00.000Z', completedAt: '2026-09-22T11:00:00.000Z' },
  ]);
  assert.equal(result.valid, true);
  assert.equal(result.milliseconds, 24 * 3600000);
  assert.equal(result.hours, 24);
  assert.equal(result.caseId, 'c2');
});

test('C10.L6: жодної завершеної пари — reason, не вигадані цифри', () => {
  const result = timeToFirstPair([{ caseId: 'c1', participants: ['a', 'b'], createdAt: '2026-09-20T10:00:00.000Z', completedAt: null }]);
  assert.equal(result.valid, true);
  assert.equal(result.milliseconds, null);
  assert.equal(result.reason, 'NO_COMPLETED_PAIR');
  const empty = timeToFirstPair([]);
  assert.equal(empty.reason, 'NO_COMPLETED_PAIR');
});

test('C10.L6: завершення раніше створення — неможливо (fail-closed)', () => {
  const result = timeToFirstPair([{ caseId: 'c1', participants: ['a', 'b'], createdAt: '2026-09-20T10:00:00.000Z', completedAt: '2026-09-19T10:00:00.000Z' }]);
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'COMPLETED_BEFORE_CREATED');
});

test('C10.L6: некоректні кейси', () => {
  assert.equal(timeToFirstPair('nope').reason, 'INVALID_CASES');
  assert.equal(timeToFirstPair([{ caseId: 'c1', participants: ['a'], createdAt: '2026-09-20T10:00:00.000Z', completedAt: null }]).reason, 'INVALID_CASE');
  assert.equal(timeToFirstPair([{ caseId: 'c1', participants: ['a', 'b'], createdAt: 'bad', completedAt: null }]).reason, 'INVALID_CASE');
  assert.equal(timeToFirstPair([{ caseId: 'c1', participants: ['a', 'b'], createdAt: '2026-09-20T10:00:00.000Z', completedAt: 'soon' }]).reason, 'INVALID_CASE');
});

test('C10.L6: публікація метрики лише при когорті >= k і запрошених >= k (зв\'язка з C10.L5)', () => {
  // Когорта менша за k — взагалі не метрика (fail-closed reason), а не false-публікація.
  assert.equal(publishableVirality({ cohortSize: 10, invitesAccepted: 4 }).publishable, false);
  assert.equal(publishableVirality({ cohortSize: 4, invitesAccepted: 10 }).reason, 'INVALID_COHORT');
  assert.equal(publishableVirality({ cohortSize: 1, invitesAccepted: 1 }).reason, 'INVALID_COHORT');
  assert.equal(publishableVirality({ cohortSize: 10, invitesAccepted: 10 }).publishable, true);
  // k=11 сам по собі валідний (>=2); когорта 10 просто менша за нього.
  assert.equal(publishableVirality({ cohortSize: 10, invitesAccepted: 10 }, { k: 11 }).reason, 'INVALID_COHORT');
  assert.equal(publishableVirality({ cohortSize: 10, invitesAccepted: 10 }, { k: 1 }).reason, 'INVALID_K');
});