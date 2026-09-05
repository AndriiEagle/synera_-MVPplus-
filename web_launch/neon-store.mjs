import { ProfileStore, ServiceError } from './profile-store.mjs';
import { consentRecord } from './pilot-policy.mjs';

// Same-origin transport. The HttpOnly session and JWT stay on the server side.
export class NeonStore extends ProfileStore {
  mode = 'neon';
  #user = null;
  constructor(config, fetchImpl = fetch) {
    super();
    if (config.backend !== 'neon') throw new Error('Neon configuration required');
    this.fetch = fetchImpl;
    this.pilotSafetyEnabled = config.pilotSafetyEnabled === true;
    this.realPilotEnabled = config.realPilotEnabled === true;
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
      throw new ServiceError(response.status);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  async availability() { return this.#request('/api/neon/health'); }
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
  async signOut() {
    try { await this.#request('/api/neon/logout', { method: 'POST', body: {} }); }
    finally { this.#user = null; }
  }
  async _send(path, options = {}) {
    this.requireUser();
    if (!path.startsWith('/rest/v1/')) throw new Error('Unsupported Neon data request');
    return this.#request('/api/neon/data/' + path.slice('/rest/v1/'.length), options);
  }
}
