import test from 'node:test';
import assert from 'node:assert/strict';
import { createReferral, attributeReferral, canCredit } from './referral.mjs';

test('C10.L3: UWG-розкриття входить у сам текст поширення (gate)', () => {
  const result = createReferral({ referrerId: 'u-1', rewardDescription: '1 Monat Pro gratis' });
  assert.equal(result.valid, true);
  assert.match(result.shareText, /Verdienst:/, 'UWG: винагорода мусить бути розкрита');
  assert.match(result.shareText, /1 Monat Pro gratis/);
  assert.match(result.disclosure, /Belohnung/);
  assert.ok(result.token.startsWith('u-1-'), 'токен атрибутивний');
});

test('C10.L3: атрибуція — валідний токен свого реферового', () => {
  const referral = createReferral({ referrerId: 'u-1', rewardDescription: 'x' });
  assert.equal(attributeReferral({ token: referral.token, referrerId: 'u-1' }).valid, true);
  assert.equal(attributeReferral({ token: referral.token, referrerId: 'u-2' }).reason, 'INVALID_TOKEN');
  assert.equal(attributeReferral({ token: 'garbage', referrerId: 'u-1' }).reason, 'INVALID_TOKEN');
  assert.equal(attributeReferral({ token: referral.token, referrerId: '' }).reason, 'INVALID_REFERRER');
});

test('C10.L3: самореферальна ферма заборонена', () => {
  assert.deepEqual(canCredit({ referrerId: 'u-1', invitedId: 'u-1' }), { valid: false, reason: 'SELF_REFERRAL' });
  assert.equal(canCredit({ referrerId: 'u-1', invitedId: 'u-2' }).valid, true);
  assert.equal(canCredit({ referrerId: '', invitedId: 'u-2' }).reason, 'INVALID_IDS');
});

test('C10.L3: некоректний вхід — reason codes, не throw', () => {
  assert.equal(createReferral({ referrerId: '', rewardDescription: 'x' }).reason, 'INVALID_REFERRER');
  assert.equal(createReferral({ referrerId: 'u-1', rewardDescription: '' }).reason, 'INVALID_REWARD_DESCRIPTION');
  assert.equal(createReferral({ referrerId: 'u-1', rewardDescription: 'x'.repeat(201) }).reason, 'INVALID_REWARD_DESCRIPTION');
});