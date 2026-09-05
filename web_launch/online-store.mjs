import { consentRecord } from './pilot-policy.mjs';
import { ProfileStore, ServiceError } from './profile-store.mjs';
export { ServiceError, validateProfile } from './profile-store.mjs';
// Small REST adapter for this browser slice; sessions remain in memory only.
// It never accepts a secret/service-role key and does not log request bodies.
export class SupabaseStore extends ProfileStore {
  mode = 'supabase';
  #session = null;
  #refresh = null;
  #storage = null;
  constructor({ supabaseUrl, publishableKey, pilotSafetyEnabled = false, realPilotEnabled = false, publicSiteUrl = '' }, fetchImpl = fetch) {
    super();
    const url = new URL(supabaseUrl);
    if (url.protocol !== 'https:' || !/^[a-z0-9]+\.supabase\.co$/.test(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid project URL');
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) throw new Error('Publishable key required');
    this.url = url.origin;
    this.key = publishableKey;
    this.fetch = (...args) => fetchImpl(...args);
    this.pilotSafetyEnabled = pilotSafetyEnabled;
    this.realPilotEnabled = realPilotEnabled;
    this.publicSiteUrl = publicSiteUrl;
  }
  get user() { return this.#session?.user ?? null; }
  get storageKey() { return `synera-session:${this.url}`; }
  remember(storage) { if (!storage) this.forgetStoredSession(); this.#storage = storage; }
  forgetStoredSession() { try { this.#storage?.removeItem(this.storageKey); } catch {} }
  async restore(storage) {
    let value;
    try { value = JSON.parse(storage.getItem(this.storageKey) || 'null'); } catch { storage.removeItem(this.storageKey); return false; }
    if (!value?.refresh_token || typeof value.refresh_token !== 'string' || value.refresh_token.length > 4096) return false;
    this.#storage = storage;
    try { this.#acceptSession(await this._send('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: value.refresh_token } })); return true; }
    catch (error) { this.#session = null; this.forgetStoredSession(); throw error; }
  }
  async availability() { await this._send('/auth/v1/settings'); return true; }
  async _send(path, { method = 'GET', body, authenticated = false, prefer } = {}) {
    const headers = { apikey: this.key, 'Content-Type': 'application/json' };
    if (authenticated) {
      await this.#freshSession();
      headers.Authorization = `Bearer ${this.#session.access_token}`;
    }
    if (prefer) headers.Prefer = prefer;
    const response = await this.fetch(`${this.url}${path}`, { method, headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000), credentials: 'omit', cache: 'no-store' });
    if (!response.ok) {
      if (authenticated && response.status === 401) { this.#session = null; this.forgetStoredSession(); }
      throw new ServiceError(response.status);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  #acceptSession(result) {
    if (!result?.access_token || !result?.refresh_token || !result?.user?.id) throw new Error('Session unavailable');
    this.#session = { ...result, expires_at: result.expires_at ?? Math.floor(Date.now() / 1000) + result.expires_in };
    try { this.#storage?.setItem(this.storageKey, JSON.stringify({ refresh_token: result.refresh_token })); } catch {}
  }
  async #freshSession() {
    if (!this.#session) throw new Error('Sign in required');
    if (this.#session.expires_at > Date.now() / 1000 + 30) return;
    if (!this.#refresh) {
      this.#refresh = this._send('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: this.#session.refresh_token } })
        .then(value => this.#acceptSession(value)).catch(error => { this.#session = null; this.forgetStoredSession(); throw error; }).finally(() => { this.#refresh = null; });
    }
    await this.#refresh;
  }
  async signIn(email, password) {
    this.#acceptSession(await this._send('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }));
  }
  async signUp(email, password, accepted) {
    if (!this.pilotSafetyEnabled) throw new Error('Пілот ще не готовий до реєстрації.');
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new Error('Для нового акаунта потрібен пароль від 12 до 128 символів.');
    const consent = consentRecord(accepted);
    const result = await this._send('/auth/v1/signup', { method: 'POST', body: { email, password, data: { signup_policy_version: consent.policy_version } } });
    if (result?.access_token) this.#acceptSession(result);
    return Boolean(this.user);
  }
  async requestPasswordReset(email) {
    if (!this.publicSiteUrl) throw new Error('Адресу повернення ще не налаштовано.');
    await this._send(`/auth/v1/recover?redirect_to=${encodeURIComponent(this.publicSiteUrl + '/')}`, { method: 'POST', body: { email } });
  }
  async verifyEmailToken(tokenHash, type) {
    if (!['email', 'recovery'].includes(type) || !/^[a-fA-F0-9]{32,128}$/.test(tokenHash)) throw new Error('Недійсне посилання підтвердження.');
    this.#acceptSession(await this._send('/auth/v1/verify', { method: 'POST', body: { token_hash: tokenHash, type } }));
  }
  async updatePassword(password) {
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new Error('Пароль має містити від 12 до 128 символів.');
    await this._send('/auth/v1/user', { method: 'PUT', authenticated: true, body: { password } });
  }
  async signOut() {
    try { if (this.#session) await this._send('/auth/v1/logout?scope=local', { method: 'POST', authenticated: true }); }
    finally { this.#session = null; this.forgetStoredSession(); }
  }
}
