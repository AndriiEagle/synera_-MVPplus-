// C10.L3 — Реферальне посилання: атрибуція + обов'язкове UWG-розкриття винагороди.
// Gate: реферальне заохочення мусить бути розкрите (UWG/UG §2b №3); приховані стимули заборонені.
// Детерміновано, чисто.

const VALID_ID = value => typeof value === 'string' && value.length >= 1 && value.length <= 64 && /^[A-Za-z0-9_:-]+$/.test(value);

/** Створює посилання. rewardDescription обов'язковий і входить у сам текст картки. */
export function createReferral({ referrerId, rewardDescription } = {}) {
  if (!VALID_ID(referrerId)) return { valid: false, reason: 'INVALID_REFERRER' };
  if (typeof rewardDescription !== 'string' || !rewardDescription.trim() || rewardDescription.length > 200) return { valid: false, reason: 'INVALID_REWARD_DESCRIPTION' };
  const token = `${referrerId}-${hashLite(rewardDescription + referrerId)}`;
  return {
    valid: true,
    referrerId,
    rewardDescription: rewardDescription.trim(),
    token,
    disclosure: 'Verdienst: diese Empfehlung ist mit einer Belohnung verbunden.',
    shareText: `Synera — Gegenseitigkeit hat einen Grund. Über diesen Link: https://synera.example/r/${token} (Verdienst: ${rewardDescription.trim()})`,
  };
}

/** Атрибуція: токен валідний і належить реферовому. */
export function attributeReferral({ token, referrerId } = {}) {
  if (!VALID_ID(referrerId)) return { valid: false, reason: 'INVALID_REFERRER' };
  if (typeof token !== 'string' || !token.startsWith(`${referrerId}-`)) return { valid: false, reason: 'INVALID_TOKEN' };
  return { valid: true, referrerId };
}

/** Захист від самореферальної ферми: реферер не може бути власним запрошеним. */
export function canCredit({ referrerId, invitedId } = {}) {
  if (!VALID_ID(referrerId) || !VALID_ID(invitedId)) return { valid: false, reason: 'INVALID_IDS' };
  if (referrerId === invitedId) return { valid: false, reason: 'SELF_REFERRAL' };
  return { valid: true };
}

function hashLite(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}