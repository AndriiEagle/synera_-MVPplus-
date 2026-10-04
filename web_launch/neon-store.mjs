import { ProfileStore, ServiceError } from './profile-store.mjs';
import { consentRecord } from './pilot-policy.mjs';

// Same-origin transport. The HttpOnly session and JWT stay on the server side.
export class NeonStore extends ProfileStore {
  mode = 'neon';
  #user = null;
  constructor(config, fetchImpl = fetch) {
    super();
    if (config.backend !== 'neon') throw new Error('Потрібна конфігурація Neon');
    this.fetch = (...args) => fetchImpl(...args);
    this.pilotSafetyEnabled = config.pilotSafetyEnabled === true;
    this.realPilotEnabled = config.realPilotEnabled === true;
    this.googleOAuthEnabled = config.googleOAuthEnabled === true;
    this.liveLocationEnabled = config.liveLocationEnabled === true;
    this.googleOAuthInitUrl = config.googleOAuthInitUrl || '';
    this.publicSiteUrl = config.publicSiteUrl || '';
  }
  get user() { return this.#user; }
  // This route uses a browser-session cookie; it never persists a JS-readable token.
  remember() {}
  forgetStoredSession() {}
  async #request(path, { method = 'GET', body, prefer } = {}) {
    const response = await this.fetch(path, { method, credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Synera-Client': '1', ...(prefer ? { Prefer: prefer } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
      if (response.status === 401) this.#user = null;
      const details = await response.json().catch(() => null);
      throw new ServiceError(response.status, details?.error);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  async availability() { return this.#request('/api/neon/health'); }
  async _caseOutcome(caseId, payload) {
    this.requireUser();
    if (typeof caseId !== 'string' || !/^[A-Za-z0-9_:-]{1,64}$/.test(caseId)) throw new ServiceError(400);
    return this.#request('/api/neon/outcomes/' + caseId, { method: 'POST', body: payload });
  }
  async #location(id, action, body = {}) {
    this.requireUser();
    if (!this.liveLocationEnabled || typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new ServiceError(400);
    return this.#request('/api/neon/location/' + id + '/' + action, { method: 'POST', body });
  }
  locationState(id) { return this.#location(id, 'view'); }
  grantLocation(id, options) { return this.#location(id, 'grant', options); }
  publishLocation(id, sample) { return this.#location(id, 'sample', sample); }
  revokeLocation(id) { return this.#location(id, 'revoke'); }
  async setMeetingAddress(id, address) {
    this.requireUser();
    if (!this.liveLocationEnabled || typeof address !== 'string' || address.length > 200) throw new ServiceError(400);
    const rows = await this._send('/rest/v1/meeting_requests?id=eq.' + encodeURIComponent(id) + '&status=eq.accepted', {
      method: 'PATCH', prefer: 'return=representation', body: { meeting_address: address.trim() },
    });
    if (rows.length !== 1) throw new ServiceError(403);
  }
  async restore() {
    const data = await this.#request('/api/neon/session');
    this.#user = data?.user || null;
    return Boolean(this.#user);
  }
  async requestOtp(email, accepted) {
    if (!this.pilotSafetyEnabled || !this.realPilotEnabled) throw new ServiceError(503);
    const consent = consentRecord(accepted);
    return this.#request('/api/neon/otp/request', { method: 'POST', body: { email, consent } });
  }
  async verifyOtp(email, otp) {
    if (!/^\d{6}$/.test(otp)) throw new ServiceError(400);
    const data = await this.#request('/api/neon/otp/verify', { method: 'POST', body: { email, otp } });
    this.#user = data?.user || null;
    if (!this.#user?.id) throw new ServiceError(401);
  }
  async beginGoogleSignIn(accepted) {
    if (!this.googleOAuthEnabled || !this.pilotSafetyEnabled || !this.realPilotEnabled) throw new ServiceError(503);
    const consent = consentRecord(accepted);
    const data = await this.#request('/api/neon/oauth/google/start', { method: 'POST', body: { consent } });
    let destination, expected;
    try { destination = new URL(data?.url); expected = new URL(this.googleOAuthInitUrl); } catch { throw new ServiceError(503); }
    const token = destination.searchParams.getAll('token');
    if (expected.protocol !== 'https:' || expected.username || expected.password || expected.search || expected.hash ||
        destination.protocol !== 'https:' || destination.origin !== expected.origin || destination.pathname !== expected.pathname || destination.port ||
        destination.username || destination.password || destination.hash || token.length !== 1 || !/^[A-Za-z0-9._~-]{16,2048}$/.test(token[0]) ||
        [...destination.searchParams.keys()].some(key => key !== 'token')) throw new ServiceError(503);
    window.location.assign(destination.href);
  }
  async signOut() {
    try { await this.#request('/api/neon/logout', { method: 'POST', body: {} }); }
    finally { this.#user = null; }
  }
  async _send(path, options = {}) {
    this.requireUser();
    if (!path.startsWith('/rest/v1/')) throw new Error('Непідтримуваний запит даних Neon');
    return this.#request('/api/neon/data/' + path.slice('/rest/v1/'.length), options);
  }
}
