import { consentRecord, POLICY_VERSION } from './pilot-policy.mjs';
import { normalizeBrief, briefProblems } from './profile-brief.mjs';
import { profileSafetyFindings } from './profile-portability.mjs';
export function validateProfile(p) {
  for (const [key, max] of [['display_name', 60], ['city', 80], ['offers', 300], ['seeks', 300]]) {
    if (typeof p[key] !== 'string' || p[key].trim().length > max) throw new Error('Invalid profile');
  }
  if (!p.display_name.trim() || typeof p.is_discoverable !== 'boolean') throw new Error('Invalid profile');
}

export class ServiceError extends Error {
  constructor(status) {
    const messages = {
      400: 'Перевір email, пароль і заповнені поля. Для входу email має бути підтверджений.',
      401: 'Сесію завершено. Увійди ще раз.',
      402: 'Онлайн-сервіс тимчасово недоступний через обмеження хостингу. Власник уже має інформацію для відновлення.',
      403: 'Недостатньо прав для цієї дії.',
      409: 'Такий запит уже існує. Відкрий розділ «Зустрічі».',
      422: 'Перевір введені дані.',
      429: 'Забагато спроб. Зачекай кілька хвилин перед наступною.',
    };
    super(messages[status] || 'Сервіс тимчасово недоступний. Спробуй пізніше.');
    this.name = 'ServiceError'; this.status = status;
  }
}

// Small REST adapter for this browser slice; sessions remain in memory only.
// It never accepts a secret/service-role key and does not log request bodies.
export class SupabaseStore {
  mode = 'supabase';
  #session = null;
  #refresh = null;
  #storage = null;
  constructor({ supabaseUrl, publishableKey, pilotSafetyEnabled = false, realPilotEnabled = false, publicSiteUrl = '' }, fetchImpl = fetch) {
    const url = new URL(supabaseUrl);
    if (url.protocol !== 'https:' || !/^[a-z0-9]+\.supabase\.co$/.test(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid project URL');
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) throw new Error('Publishable key required');
    this.url = url.origin;
    this.key = publishableKey;
    this.fetch = fetchImpl;
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
    try { this.#acceptSession(await this.#send('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: value.refresh_token } })); return true; }
    catch (error) { this.#session = null; this.forgetStoredSession(); throw error; }
  }
  async availability() { await this.#send('/auth/v1/settings'); return true; }
  async #send(path, { method = 'GET', body, authenticated = false, prefer } = {}) {
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
      this.#refresh = this.#send('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: this.#session.refresh_token } })
        .then(value => this.#acceptSession(value)).catch(error => { this.#session = null; this.forgetStoredSession(); throw error; }).finally(() => { this.#refresh = null; });
    }
    await this.#refresh;
  }
  async signIn(email, password) {
    this.#acceptSession(await this.#send('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }));
  }
  async signUp(email, password, accepted) {
    if (!this.pilotSafetyEnabled) throw new Error('Пілот ще не готовий до реєстрації.');
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new Error('Для нового акаунта потрібен пароль від 12 до 128 символів.');
    const consent = consentRecord(accepted);
    const result = await this.#send('/auth/v1/signup', { method: 'POST', body: { email, password, data: { signup_policy_version: consent.policy_version } } });
    if (result?.access_token) this.#acceptSession(result);
    return Boolean(this.user);
  }
  async hasPolicy() {
    if (!this.pilotSafetyEnabled) return false;
    const rows = await this.#send(`/rest/v1/pilot_consents?user_id=eq.${encodeURIComponent(this.requireUser())}&policy_version=eq.${POLICY_VERSION}&select=policy_version&limit=1`, { authenticated: true });
    return rows.length === 1;
  }
  async acceptPolicy(value) {
    if (!this.pilotSafetyEnabled) throw new Error('Серверне підтвердження правил ще не підключене.');
    const accepted = consentRecord(value);
    await this.#send('/rest/v1/pilot_consents', { method: 'POST', authenticated: true, prefer: 'return=minimal',
      body: { user_id: this.requireUser(), policy_version: accepted.policy_version, terms_accepted: true, privacy_acknowledged: true } });
  }
  async requestPasswordReset(email) {
    if (!this.publicSiteUrl) throw new Error('Адресу повернення ще не налаштовано.');
    await this.#send(`/auth/v1/recover?redirect_to=${encodeURIComponent(this.publicSiteUrl + '/')}`, { method: 'POST', body: { email } });
  }
  async verifyEmailToken(tokenHash, type) {
    if (!['email', 'recovery'].includes(type) || !/^[a-fA-F0-9]{32,128}$/.test(tokenHash)) throw new Error('Недійсне посилання підтвердження.');
    this.#acceptSession(await this.#send('/auth/v1/verify', { method: 'POST', body: { token_hash: tokenHash, type } }));
  }
  async updatePassword(password) {
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new Error('Пароль має містити від 12 до 128 символів.');
    await this.#send('/auth/v1/user', { method: 'PUT', authenticated: true, body: { password } });
  }
  async signOut() {
    try { if (this.#session) await this.#send('/auth/v1/logout?scope=local', { method: 'POST', authenticated: true }); }
    finally { this.#session = null; this.forgetStoredSession(); }
  }
  requireUser() { if (!this.user) throw new Error('Sign in required'); return this.user.id; }
  async ownProfile() {
    const id = this.requireUser();
    const rows = await this.#send(`/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=${this.profileColumns}`, { authenticated: true });
    return rows[0] ?? { id, display_name: '', city: '', offers: '', seeks: '', is_discoverable: false, brief: normalizeBrief(), map_visible: false };
  }
  get profileColumns() { return 'id,display_name,city,offers,seeks,is_discoverable' + (this.realPilotEnabled ? ',brief,map_visible,updated_at' : ''); }
  async saveProfile(profile) {
    validateProfile(profile);
    if (profileSafetyFindings(profile).length || profileSafetyFindings({ offers: profile.brief?.goal }).length) throw new Error('Прибери контакти, ключі та приватні дані з картки профілю.');
    const { display_name, city, offers, seeks, is_discoverable } = profile;
    const extra = this.realPilotEnabled ? { brief: normalizeBrief(profile.brief), map_visible: profile.map_visible === true && is_discoverable } : {};
    if (this.realPilotEnabled && is_discoverable && briefProblems(extra.brief).length) throw new Error('Перед публікацією заповни умови співпраці: ' + briefProblems(extra.brief).join('; '));
    await this.#send('/rest/v1/profiles?on_conflict=id', { method: 'POST', authenticated: true,
      prefer: 'resolution=merge-duplicates,return=minimal', body: { id: this.requireUser(), display_name, city, offers, seeks, is_discoverable, ...extra } });
  }
  async discover({ offset = 0 } = {}) {
    if (!Number.isInteger(offset) || offset < 0 || offset > 10000) throw new Error('Invalid page');
    return this.#send(`/rest/v1/profiles?is_discoverable=eq.true&id=neq.${encodeURIComponent(this.requireUser())}&select=${this.profileColumns}&order=id.asc&limit=50&offset=${offset}`, { authenticated: true });
  }
  async meetings() {
    this.requireUser();
    return this.#send('/rest/v1/meeting_requests?select=id,sender_id,recipient_id,note,status,created_at' + (this.realPilotEnabled ? ',proposed_at,duration_minutes,meeting_place,sender_name,recipient_name' : '') + '&order=created_at.desc&limit=100', { authenticated: true });
  }
  async invite(recipient, note, plan = {}) {
    if (!note.trim() || note.length > 500 || recipient === this.requireUser()) throw new Error('Invalid request');
    const extra = {};
    if (this.realPilotEnabled) {
      if (!Number.isFinite(Date.parse(plan.proposed_at)) || Date.parse(plan.proposed_at) <= Date.now() || Date.parse(plan.proposed_at) > Date.now() + 90 * 86400000) throw new Error('Обери час у наступні 90 днів.');
      if (![20, 30, 60].includes(plan.duration_minutes) || !['Онлайн', 'Zürich', 'Winterthur', 'Zug', 'Basel', 'Bern'].includes(plan.meeting_place)) throw new Error('Обери тривалість і місце.');
      Object.assign(extra, { proposed_at: new Date(plan.proposed_at).toISOString(), duration_minutes: plan.duration_minutes, meeting_place: plan.meeting_place });
    }
    await this.#send('/rest/v1/meeting_requests', { method: 'POST', authenticated: true, prefer: 'return=minimal',
      body: { sender_id: this.requireUser(), recipient_id: recipient, note: note.trim(), ...extra } });
  }
  async respond(id, status) {
    if (!['accepted', 'declined'].includes(status)) throw new Error('Invalid status');
    const rows = await this.#send(`/rest/v1/meeting_requests?id=eq.${encodeURIComponent(id)}&status=eq.pending`, {
      method: 'PATCH', authenticated: true, prefer: 'return=representation', body: { status } });
    if (rows.length !== 1) throw new Error('Request unavailable');
  }
  requireRealPilot() { this.requireUser(); if (!this.realPilotEnabled) throw new Error('Ця дія стане доступною після оновлення сервера пілоту.'); }
  async cancelMeeting(id) {
    this.requireRealPilot();
    const rows = await this.#send(`/rest/v1/meeting_requests?id=eq.${encodeURIComponent(id)}&sender_id=eq.${encodeURIComponent(this.requireUser())}&status=in.(pending,accepted)`, { method: 'PATCH', authenticated: true, prefer: 'return=representation', body: { status: 'cancelled' } });
    if (rows.length !== 1) throw new Error('Запит уже змінено або недоступний.');
  }
  async messages(meetingId) {
    this.requireRealPilot();
    return this.#send(`/rest/v1/meeting_messages?meeting_id=eq.${encodeURIComponent(meetingId)}&select=id,sender_id,body,created_at&order=created_at.desc&limit=100`, { authenticated: true });
  }
  async sendMessage(meetingId, body) {
    this.requireRealPilot();
    if (typeof body !== 'string' || !body.trim() || body.length > 1000) throw new Error('Повідомлення має містити 1–1000 символів.');
    await this.#send('/rest/v1/meeting_messages', { method: 'POST', authenticated: true, body: { meeting_id: meetingId, sender_id: this.requireUser(), body: body.trim() } });
  }
  async blocks() { this.requireRealPilot(); return this.#send(`/rest/v1/profile_blocks?blocker_id=eq.${encodeURIComponent(this.requireUser())}&select=blocked_id,created_at&order=created_at.desc`, { authenticated: true }); }
  async block(id) { this.requireRealPilot(); if (id === this.requireUser()) throw new Error('Invalid block'); await this.#send('/rest/v1/profile_blocks', { method: 'POST', authenticated: true, body: { blocker_id: this.requireUser(), blocked_id: id }, prefer: 'resolution=ignore-duplicates,return=minimal' }); }
  async unblock(id) { this.requireRealPilot(); await this.#send(`/rest/v1/profile_blocks?blocker_id=eq.${encodeURIComponent(this.requireUser())}&blocked_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', authenticated: true }); }
  async report(id, reason, detail) {
    this.requireRealPilot();
    if (!['spam', 'impersonation', 'harassment', 'other'].includes(reason) || typeof detail !== 'string' || detail.length > 500 || id === this.requireUser()) throw new Error('Invalid report');
    await this.#send('/rest/v1/profile_reports', { method: 'POST', authenticated: true, body: { reporter_id: this.requireUser(), reported_id: id, reason, detail: detail.trim() } });
  }
  async deleteProfile() {
    this.requireRealPilot();
    const rows = await this.#send(`/rest/v1/profiles?id=eq.${encodeURIComponent(this.requireUser())}`, { method: 'DELETE', authenticated: true, prefer: 'return=representation' });
    if (rows.length !== 1) throw new Error('Профіль не видалено: він недоступний або вже відсутній.');
  }
  async exportAccount() {
    this.requireRealPilot();
    const collect = async (table, columns, filter = '') => {
      const all = [];
      for (let offset = 0; offset < 100000; offset += 500) {
        const rows = await this.#send('/rest/v1/' + table + '?select=' + columns + filter + '&order=' + (table === 'pilot_consents' ? 'accepted_at' : 'created_at') + '.asc&limit=500&offset=' + offset, { authenticated: true });
        all.push(...rows);
        if (rows.length < 500) return all;
      }
      throw new Error('Експорт перевищує межу файлу. Звернися до оператора за повною копією.');
    };
    const [profile, consents, invitations, messages, blocks, reports] = await Promise.all([
      this.ownProfile(), collect('pilot_consents','policy_version,terms_accepted,privacy_acknowledged,accepted_at'),
      collect('meeting_requests','id,sender_id,recipient_id,note,status,created_at,proposed_at,duration_minutes,meeting_place,sender_name,recipient_name'),
      collect('meeting_messages','id,meeting_id,sender_id,body,created_at'),
      collect('profile_blocks','blocked_id,created_at','&blocker_id=eq.' + encodeURIComponent(this.requireUser())),
      collect('profile_reports','reported_id,reason,detail,created_at'),
    ]);
    return { format: 'synera-account-export-1', private: true, exported_at: new Date().toISOString(), account: { id: this.user.id, email: this.user.email }, profile, consents, invitations, messages, blocks, reports };
  }
}
