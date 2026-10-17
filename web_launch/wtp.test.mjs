import test from 'node:test';
import assert from 'node:assert/strict';
import { recordWtpResponse, wtpCurve, viablePrice, WTP_STAGES } from './wtp.mjs';

const response = overrides => ({ participantId: 'u-1', priceChf: 10, stage: 'would_pay', consent: true, at: '2026-09-20T10:00:00.000Z', ...overrides });

test('C11.L6: згода окрема від участі — без consent відповідь відхилена (gate)', () => {
  assert.equal(recordWtpResponse([], response({ consent: false })).reason, 'CONSENT_REQUIRED');
  assert.equal(recordWtpResponse([], response({ consent: undefined })).reason, 'CONSENT_REQUIRED');
});

test('C11.L6: дубль учасника неможливий; append-only', () => {
  const responses = [];
  const first = recordWtpResponse(responses, response());
  assert.equal(first.valid, true);
  assert.equal(responses.length, 0);
  assert.equal(recordWtpResponse(first.responses, response()).reason, 'DUPLICATE_PARTICIPANT');
});

test('C11.L6: WTP-крива — частки по цінах; < k ціна непублічна', () => {
  const responses = [];
  for (let i = 0; i < 6; i++) responses.push(recordWtpResponse(responses, response({ participantId: `a${i}`, priceChf: 10, stage: i < 4 ? 'would_pay' : 'would_not_pay' })).responses.at(-1));
  for (let i = 0; i < 3; i++) responses.push(recordWtpResponse(responses, response({ participantId: `b${i}`, priceChf: 20, stage: 'would_pay' })).responses.at(-1));
  const curve = wtpCurve(responses);
  assert.equal(curve.valid, true);
  const at10 = curve.curve.find(p => p.priceChf === 10);
  const at20 = curve.curve.find(p => p.priceChf === 20);
  assert.equal(at10.publishable, true);
  assert.equal(at10.wouldPayShare, 0.67);
  assert.equal(at20.publishable, false);
  assert.equal(at20.wouldPayShare, null);
});

test('C11.L6: viablePrice — перша ціна з часткою >= порогу', () => {
  const curve = wtpCurve([
    response({ participantId: 'a', priceChf: 5, stage: 'would_pay' }),
    response({ participantId: 'b', priceChf: 5, stage: 'would_pay' }),
    response({ participantId: 'c', priceChf: 5, stage: 'would_pay' }),
    response({ participantId: 'd', priceChf: 5, stage: 'would_pay' }),
    response({ participantId: 'e', priceChf: 5, stage: 'would_pay' }),
    response({ participantId: 'f', priceChf: 15, stage: 'would_not_pay' }),
    response({ participantId: 'g', priceChf: 15, stage: 'would_not_pay' }),
    response({ participantId: 'h', priceChf: 15, stage: 'would_not_pay' }),
    response({ participantId: 'i', priceChf: 15, stage: 'would_not_pay' }),
    response({ participantId: 'j', priceChf: 15, stage: 'would_not_pay' }),
  ]);
  // 5/5 would_pay = 1.0 >= 0.5 -> viable; 0/5 = 0 -> ні.
  assert.equal(viablePrice(curve).viablePriceChf, 5);
  // 100% >= 0.9 теж viable; 4/5 (0.8) вже ні.
  assert.equal(viablePrice(curve, { threshold: 0.9 }).viablePriceChf, 5);
  const weaker = wtpCurve([
    response({ participantId: 'a', priceChf: 5, stage: 'would_pay' }),
    response({ participantId: 'b', priceChf: 5, stage: 'would_pay' }),
    response({ participantId: 'c', priceChf: 5, stage: 'would_pay' }),
    response({ participantId: 'd', priceChf: 5, stage: 'would_pay' }),
    response({ participantId: 'e', priceChf: 5, stage: 'would_not_pay' }),
    response({ participantId: 'f', priceChf: 15, stage: 'would_not_pay' }),
    response({ participantId: 'g', priceChf: 15, stage: 'would_not_pay' }),
    response({ participantId: 'h', priceChf: 15, stage: 'would_not_pay' }),
    response({ participantId: 'i', priceChf: 15, stage: 'would_not_pay' }),
    response({ participantId: 'j', priceChf: 15, stage: 'would_not_pay' }),
  ]);
  assert.equal(viablePrice(weaker, { threshold: 0.9 }).reason, 'NO_VIABLE_PRICE');
  assert.equal(viablePrice(null).reason, 'INVALID_CURVE');
  assert.equal(viablePrice(curve, { threshold: 2 }).reason, 'INVALID_THRESHOLD');
});

test('C11.L6: некоректний вхід — reason codes, не throw', () => {
  assert.equal(recordWtpResponse('nope', response()).reason, 'INVALID_RESPONSES');
  assert.equal(recordWtpResponse([], response({ participantId: '' })).reason, 'INVALID_PARTICIPANT');
  assert.equal(recordWtpResponse([], response({ priceChf: -1 })).reason, 'INVALID_PRICE');
  assert.equal(recordWtpResponse([], response({ priceChf: 20000 })).reason, 'INVALID_PRICE');
  assert.equal(recordWtpResponse([], response({ stage: 'maybe' })).reason, 'INVALID_STAGE');
  assert.equal(recordWtpResponse([], response({ at: 'soon' })).reason, 'INVALID_INSTANT');
  assert.equal(wtpCurve([{ priceChf: 'x', stage: 'would_pay' }]).reason, 'INVALID_RESPONSE');
  assert.equal(wtpCurve(null).reason, 'INVALID_RESPONSES');
  assert.deepEqual(WTP_STAGES, ['shown_price', 'considered', 'would_pay', 'would_not_pay']);
});