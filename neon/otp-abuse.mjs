// Reuse the existing ephemeral KV namespace, with keys separate from location data.
// KV is eventually consistent: these are bounded best-effort limits across PoPs,
// serialized exactly within one isolate. Neon/edge limits remain required in production.
const WINDOW_MS = 15 * 60 * 1000;
const CODE_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const locks = new WeakMap();
export class OtpProtectionError extends Error {
  constructor(status, code, retryAfter = 0) { super(code); this.status = status; this.code = code; this.retryAfter = retryAfter; }
}
export function normalizeOpenEmail(value) {
  if (typeof value !== 'string' || value.length > 254) throw new OtpProtectionError(400, 'service_unavailable');
  const email = value.trim().toLowerCase();
  if (!/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email)) throw new OtpProtectionError(400, 'service_unavailable');
  return email;
}
async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, '0')).join('');
}
async function locked(kv, keys, operation) {
  let map = locks.get(kv); if (!map) { map = new Map(); locks.set(kv, map); }
  async function acquire(index) {
    if (index === keys.length) return operation();
    const key = keys[index], previous = map.get(key) || Promise.resolve();
    let release; const pending = new Promise(resolve => { release = resolve; });
    map.set(key, pending);
    await previous;
    try { return await acquire(index + 1); }
    finally { if (map.get(key) === pending) map.delete(key); release(); }
  }
  return acquire(0);
}
async function record(kv, key) {
  const value = await kv.get(key, { type: 'json' });
  if (value === null) return null;
  if (!value || typeof value !== 'object' || !Number.isSafeInteger(value.expires) || !Number.isSafeInteger(value.count) || value.count < 0) throw new OtpProtectionError(503, 'service_unavailable');
  return value.expires > Date.now() ? value : null;
}
const save = (kv, key, value) => kv.put(key, JSON.stringify(value), { expirationTtl: Math.max(60, Math.ceil((value.expires - Date.now()) / 1000)) });
function limited(expires) { throw new OtpProtectionError(429, 'rate_limited', Math.max(1, Math.ceil((expires - Date.now()) / 1000))); }

export async function withOtpProtection(env, email, request, action, operation, consent) {
  const kv = env.SYNERA_LOCATION_EPHEMERAL;
  if (!['get', 'put'].every(method => typeof kv?.[method] === 'function')) throw new OtpProtectionError(503, 'service_unavailable');
  const emailKey = 'synera:otp:v1:email:' + await digest(email);
  let ipKey;
  if (action === 'request') {
    // Only Cloudflare's overwritten connecting-IP header is trusted. Never X-Forwarded-For.
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip || ip.length > 45 || !/^[a-fA-F0-9:.]+$/.test(ip)) throw new OtpProtectionError(503, 'service_unavailable');
    ipKey = 'synera:otp:v1:ip:' + await digest(ip.toLowerCase());
  }
  return locked(kv, [emailKey, ...(ipKey ? [ipKey] : [])].sort(), async () => {
    const challengeKey = emailKey + ':code';
    if (action === 'request') {
      const emailCount = await record(kv, emailKey), ipCount = await record(kv, ipKey);
      for (const [value, cap] of [[emailCount, 3], [ipCount, 20]]) if (value && value.count >= cap) limited(value.expires);
      const increment = value => ({ expires: value?.expires ?? Date.now() + WINDOW_MS, count: (value?.count ?? 0) + 1 });
      // Reserve before provider traffic, including failed sends; never refund abuse attempts.
      await save(kv, ipKey, increment(ipCount)); await save(kv, emailKey, increment(emailCount));
      // A resend may reuse the provider's still-valid code. Keep failed guesses
      // until expiry; only a completed sign-in permits a new verification budget.
      const previous = await record(kv, challengeKey);
      await save(kv, challengeKey, { expires: previous && !previous.used ? previous.expires : Date.now() + CODE_MS,
        count: previous && !previous.used ? previous.count : 0, consent });
      return operation();
    }
    const challenge = await record(kv, challengeKey);
    if (!challenge || challenge.consent?.policy_version !== consent.policy_version || challenge.consent?.terms_accepted !== true || challenge.consent?.privacy_acknowledged !== true) throw new OtpProtectionError(400, 'otp_invalid');
    if (challenge.count >= MAX_ATTEMPTS) limited(challenge.expires);
    await save(kv, challengeKey, { ...challenge, count: challenge.count + 1 });
    const response = await operation();
    // A successful exchange consumes this issuance even if an upstream replay were possible.
    await save(kv, challengeKey, { ...challenge, count: MAX_ATTEMPTS, used: true });
    return response;
  });
}
