import test from 'node:test';
import assert from 'node:assert/strict';
import { economics, pilotFunnel, createProfileImportedEvent, appendProfileImportedEvent, profileImportMeta, appendEvent, telemetryDedupHash, validateTelemetryEvent, writeEventsLog } from './economics.mjs';
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

test('pilot funnel: real, synthetic and model outputs cannot be blended', () => {
  const events = [
    { eventId: 'e1', pairKey: 'p1', caseId: 'c1', source: 'real_authorized', channel: 'synera', state: 'trial_started', occurredAt: '2026-09-08T10:00:00.000Z', operatorMinutes: 12, directCashCost: 0 },
    { eventId: 'e2', pairKey: 'p1', caseId: 'c1', source: 'real_authorized', channel: 'synera', state: 'outcome_accepted', occurredAt: '2026-09-09T10:00:00.000Z', operatorMinutes: 3, directCashCost: null, caseVersion: 2, termsHash: 'a'.repeat(64), recipientDecision: 'accepted' },
    { eventId: 'e3', pairKey: 'p2', caseId: 'c2', source: 'synthetic_test', channel: 'manual', state: 'outcome_accepted', occurredAt: '2026-09-09T10:00:00.000Z', operatorMinutes: 0, directCashCost: 0, caseVersion: 1, termsHash: 'b'.repeat(64), recipientDecision: 'accepted' },
  ];
  const real = pilotFunnel(events, { source: 'real_authorized' });
  assert.equal(real.uniquePairs, 1); assert.equal(real.states.outcome_accepted, 1); assert.equal(real.operatorMinutes, 15); assert.equal(real.directCashCost, null);
  assert.equal(real.sourceAuthentication, 'caller_supplied_d1_not_authenticated'); assert.equal(real.businessEvidence, false); assert.equal(real.businessEvidenceCandidate, true);
  const synthetic = pilotFunnel(events, { source: 'synthetic_test' }); assert.equal(synthetic.uniquePairs, 1); assert.equal(synthetic.states.outcome_accepted, 1);
  assert.throws(() => pilotFunnel([{ ...events[0], source: 'model_output' }], { source: 'real_authorized' }));
});

test('pilot funnel: accepted or rejected outcomes require exact case version/hash and recipient decision', () => {
  const base = { eventId: 'e1', pairKey: 'p1', caseId: 'c1', source: 'real_authorized', channel: 'synera', state: 'outcome_accepted', occurredAt: '2026-09-09T10:00:00.000Z', operatorMinutes: 0, directCashCost: 0 };
  assert.throws(() => pilotFunnel([base], { source: 'real_authorized' }));
  assert.throws(() => pilotFunnel([{ ...base, caseVersion: 1, termsHash: 'a'.repeat(64), recipientDecision: 'rejected' }], { source: 'real_authorized' }));
});

test('SYN_IMPORT_AUDITED: profile_imported is pseudonymous append-only metadata, source-separated, never evidence', () => {
  const real = createProfileImportedEvent({ source: 'real', fieldsConfirmed: ['offer_tags.sales', 'need_tags.automation', 'languages.de', 'city_code', 'modes.exchange', 'mode_details.paid_service.role'], draftHash: 'a'.repeat(64), timestamp: '2026-09-10T21:00:00.000Z' });
  assert.deepEqual(Object.keys(real).sort(), ['draftHash', 'fieldsConfirmed', 'source', 'timestamp']);
  const log = appendProfileImportedEvent([], real);
  const log2 = appendProfileImportedEvent(log, createProfileImportedEvent({ source: 'synthetic', fieldsConfirmed: ['offer_tags.video'], draftHash: 'b'.repeat(64), timestamp: '2026-09-10T21:05:00.000Z' }));
  assert.equal(log.length, 1); assert.equal(log2.length, 2); // append-only: the input log is never mutated
  const realMeta = profileImportMeta(log2, { source: 'real' });
  const syntheticMeta = profileImportMeta(log2, { source: 'synthetic' });
  assert.equal(realMeta.eventCount, 1); assert.equal(realMeta.distinctDraftHashes, 1);
  assert.deepEqual(realMeta.fieldsConfirmed, ['city_code', 'languages.de', 'mode_details.paid_service.role', 'modes.exchange', 'need_tags.automation', 'offer_tags.sales']);
  assert.equal(syntheticMeta.eventCount, 1); assert.deepEqual(syntheticMeta.fieldsConfirmed, ['offer_tags.video']);
  assert.equal(realMeta.businessEvidence, false); assert.equal(realMeta.demandEvidence, false);
  assert.equal(syntheticMeta.businessEvidence, false); assert.equal(syntheticMeta.demandEvidence, false);
  // no PII and no raw hint text: only lowercase pseudonymous field keys pass validation
  for (const bad of [['Можу дати: B2B-продажі'], ['ivan@example.com'], ['+41 79 123 45 67'], ['offer_tags: sales'], ['OFFER_TAGS.SALES'], ['']]) {
    assert.throws(() => createProfileImportedEvent({ source: 'real', fieldsConfirmed: bad, draftHash: 'a'.repeat(64), timestamp: '2026-09-10T21:00:00.000Z' }));
  }
  assert.throws(() => createProfileImportedEvent({ source: 'real', fieldsConfirmed: ['city_code', 'city_code'], draftHash: 'a'.repeat(64), timestamp: '2026-09-10T21:00:00.000Z' }));
  assert.throws(() => createProfileImportedEvent({ source: 'real', fieldsConfirmed: [], draftHash: 'a'.repeat(64), timestamp: '2026-09-10T21:00:00.000Z' }));
  // extra fields (PII smuggling), unknown sources, bad hash, bad time and duplicates fail closed
  assert.throws(() => appendProfileImportedEvent([], { ...real, user_id: 'u1' }));
  assert.throws(() => createProfileImportedEvent({ ...real, source: 'model_output' }));
  assert.throws(() => createProfileImportedEvent({ ...real, draftHash: 'short' }));
  assert.throws(() => createProfileImportedEvent({ ...real, timestamp: 'not-a-time' }));
  assert.throws(() => appendProfileImportedEvent(log, real));
  assert.throws(() => profileImportMeta(log2));
  // metadata never blends into the business pilot funnel
  assert.throws(() => pilotFunnel(log2));
});

test('SYN_TELEMETRY_CONTRACT: consent off writes nothing, consent on appends validated events only', () => {
  const event = { type: 'case_created', at: '2026-09-10T21:00:00.000Z', source: 'real', properties: { pair_id: 'pair-a1', mode: 'exchange', version: 1 } };
  const base = [];
  const refused = appendEvent(base, event, { analyticsConsent: false });
  assert.equal(refused.length, 0); assert.equal(refused, base); // zero writes, same array
  const log = appendEvent(base, event, { analyticsConsent: true });
  assert.equal(log.length, 1);
  assert.equal(log[0].schema, 'synera.telemetry.v1');
  assert.equal(typeof log[0].dedupHash, 'string');
  assert.deepEqual(Object.keys(log[0]).sort(), ['at', 'dedupHash', 'properties', 'schema', 'source', 'type']);
  assert.equal(base.length, 0); // append-only: input never mutated
});

test('SYN_TELEMETRY_CONTRACT: 10s dedup collapses repeats and rejects PII, unknown types and orphan operator minutes', () => {
  const event = { type: 'approval_given', at: '2026-09-10T21:00:05.000Z', source: 'real', properties: { pair_id: 'pair-a1', version: 2 } };
  const later = { ...event, at: '2026-09-10T21:00:31.000Z' }; // next 10s bucket
  assert.equal(telemetryDedupHash(event), telemetryDedupHash({ ...event, at: '2026-09-10T21:00:02.000Z' }));
  assert.notEqual(telemetryDedupHash(event), telemetryDedupHash(later));
  const log = appendEvent([], event, { analyticsConsent: true });
  assert.equal(appendEvent(log, { ...event, at: '2026-09-10T21:00:09.000Z' }, { analyticsConsent: true }).length, 1); // same bucket -> no duplicate
  assert.equal(appendEvent(log, later, { analyticsConsent: true }).length, 2);
  assert.throws(() => appendEvent(log, { ...event, type: 'invented_event' }, { analyticsConsent: true }));
  assert.throws(() => appendEvent(log, { ...event, source: 'model_output' }, { analyticsConsent: true }));
  assert.throws(() => appendEvent(log, { ...event, properties: { pair_id: 'p', note: 'liuba@example.com' } }, { analyticsConsent: true }));
  assert.throws(() => appendEvent(log, { ...event, properties: { pair_id: 'p', secret: 'sb_secret_abcdefghijklmnop' } }, { analyticsConsent: true }));
  assert.throws(() => appendEvent(log, { ...event, properties: { operator_minutes: 5 } }, { analyticsConsent: true }));
  assert.throws(() => appendEvent(log, { ...event, properties: { operator_minutes: 5, operator_category: 'gossip' } }, { analyticsConsent: true }));
  const measured = appendEvent(log, { type: 'dispute_opened', at: '2026-09-10T21:05:00.000Z', source: 'real', properties: { pair_id: 'pair-b2', operator_minutes: 5, operator_category: 'moderation' } }, { analyticsConsent: true });
  assert.equal(measured.length, 2);
});

test('SYN_TELEMETRY_CONTRACT: events.jsonl writer is append-only, test-path overrideable and node-only', async () => {
  const path = 'web_launch/.telemetry-test.jsonl';
  try { await (await import('node:fs/promises')).rm(path); } catch {}
  const first = [{ type: 'profile_completed', at: '2026-09-10T21:00:00.000Z', source: 'real', properties: { profile_id: 'u-1' } }];
  const second = [{ type: 'export_requested', at: '2026-09-10T21:01:00.000Z', source: 'synthetic', properties: {} }];
  assert.equal(await writeEventsLog(first, { path }), 1);
  assert.equal(await writeEventsLog(first, { path }), 1); // same event appended again is a caller error but file only grows
  assert.equal(await writeEventsLog(second, { path }), 1);
  assert.equal(await writeEventsLog([], { path }), 0);
  const text = await (await import('node:fs/promises')).readFile(path, 'utf8');
  const lines = text.trim().split('\n');
  assert.equal(lines.length, 3);
  assert.deepEqual(JSON.parse(lines[0]).type, 'profile_completed');
  assert.throws(() => validateTelemetryEvent({ type: 'profile_completed', at: 'nope', source: 'real', properties: {} }));
  await (await import('node:fs/promises')).rm(path);
});

import { caseEconomics } from './economics.mjs';

test('C11.L1: caseEconomics computes total case cost', () => {
  const result = caseEconomics({
    aiPrompts: 3,
    aiCostPerPrompt: 0.02,
    operatorMinutes: 15,
    operatorHourlyRate: 60,
    gatewayFees: 0.50
  });
  assert.equal(result.aiCost, 0.06);
  assert.equal(result.operatorCost, 15.0);
  assert.equal(result.gatewayFees, 0.50);
  assert.equal(result.totalCost, 15.56);
  
  assert.throws(() => caseEconomics({ aiPrompts: -1 }), /Invalid case economics input/);
});
