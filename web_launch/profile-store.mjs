import { consentRecord, POLICY_VERSION } from './pilot-policy.mjs';
import { normalizeBrief, briefProblems } from './profile-brief.mjs';
import { profileSafetyFindings } from './profile-portability.mjs';
export function validateProfile(p) {
  for (const [key, max] of [['display_name', 60], ['city', 80], ['offers', 300], ['seeks', 300]]) {
    if (typeof p[key] !== 'string' || p[key].trim().length > max) throw new Error('Некоректний профіль');
  }
  if (!p.display_name.trim() || typeof p.is_discoverable !== 'boolean') throw new Error('Некоректний профіль');
}

export class ServiceError extends Error {
  constructor(status, code) {
    const messages = {
      400: 'Перевір email і дані входу. Код або посилання підтвердження могли застаріти.',
      401: 'Сесію завершено. Увійди ще раз.',
      402: 'Онлайн-сервіс тимчасово недоступний через обмеження хостингу. Власник уже має інформацію для відновлення.',
      403: 'Недостатньо прав для цієї дії.',
      409: 'Такий запит уже існує. Відкрий розділ «Зустрічі».',
      422: 'Перевір введені дані.',
      429: 'Забагато спроб. Зачекай кілька хвилин перед наступною.',
    };
    const authMessages = {
      otp_invalid: 'Код неправильний або вже використаний. Перевір останній лист або натисни «Надіслати код знову».',
      otp_verification_unavailable: 'Не вдалося перевірити код через з’єднання. Спробуй підтвердити ще раз.',
      otp_delivery_unavailable: 'Не вдалося надіслати лист. Зачекай хвилину й повтори спробу.',
      session_cookie_unavailable: 'Email підтверджено, але зберегти вхід не вдалося. Потрібен новий код. Якщо помилка повториться, повідом оператору: AUTH-COOKIE.',
      session_token_unavailable: 'Вхід підтверджено, але доступ до профілю ще не отримано. Спробуй продовжити вхід. Код помилки: AUTH-TOKEN.',
      session_unavailable: 'Не вдалося відновити з’єднання з акаунтом. Спробуй ще раз.',
      data_unavailable: 'Не вдалося завантажити або зберегти дані. Повтори дію; введені поля залишаються у формі.',
    };
    super((code === 'otp_invalid' || status >= 500 ? authMessages[code] : '') || messages[status] || 'Сервіс тимчасово недоступний. Спробуй пізніше.');
    this.name = 'ServiceError'; this.status = status; this.code = Object.hasOwn(authMessages, code) ? code : undefined;
  }
}

// Shared profile and meeting contract; providers implement authentication and _send.
export class ProfileStore {
  requireUser() { if (!this.user) throw new Error('Потрібен вхід'); return this.user.id; }
  async hasPolicy() {
    if (!this.pilotSafetyEnabled) return false;
    const rows = await this._send(`/rest/v1/pilot_consents?user_id=eq.${encodeURIComponent(this.requireUser())}&policy_version=eq.${POLICY_VERSION}&select=policy_version&limit=1`, { authenticated: true });
    return rows.length === 1;
  }
  async acceptPolicy(value) {
    if (!this.pilotSafetyEnabled) throw new Error('Серверне підтвердження правил ще не підключене.');
    const accepted = consentRecord(value);
    await this._send('/rest/v1/pilot_consents', { method: 'POST', authenticated: true, prefer: 'return=minimal',
      body: { user_id: this.requireUser(), policy_version: accepted.policy_version, terms_accepted: true, privacy_acknowledged: true } });
  }
  async ownProfile() {
    const id = this.requireUser();
    const rows = await this._send(`/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=${this.profileColumns}`, { authenticated: true });
    return rows[0] ?? { id, display_name: '', city: '', offers: '', seeks: '', is_discoverable: false, brief: normalizeBrief(), map_visible: false };
  }
  get profileColumns() { return 'id,display_name,city,offers,seeks,is_discoverable' + (this.realPilotEnabled ? ',brief,map_visible,updated_at' : ''); }
  async saveProfile(profile) {
    validateProfile(profile);
    if (profileSafetyFindings(profile).length || profileSafetyFindings({ offers: profile.brief?.goal }).length) throw new Error('Прибери контакти, ключі та приватні дані з картки профілю.');
    const { display_name, city, offers, seeks, is_discoverable } = profile;
    const extra = this.realPilotEnabled ? { brief: normalizeBrief(profile.brief), map_visible: profile.map_visible === true && is_discoverable } : {};
    if (this.realPilotEnabled && is_discoverable && briefProblems(extra.brief).length) throw new Error('Перед публікацією заповни умови співпраці: ' + briefProblems(extra.brief).join('; '));
    await this._send('/rest/v1/profiles?on_conflict=id', { method: 'POST', authenticated: true,
      prefer: 'resolution=merge-duplicates,return=minimal', body: { id: this.requireUser(), display_name, city, offers, seeks, is_discoverable, ...extra } });
  }
  async discover({ offset = 0 } = {}) {
    if (!Number.isInteger(offset) || offset < 0 || offset > 10000) throw new Error('Некоректна сторінка');
    return this._send(`/rest/v1/profiles?is_discoverable=eq.true&id=neq.${encodeURIComponent(this.requireUser())}&select=${this.profileColumns}&order=id.asc&limit=50&offset=${offset}`, { authenticated: true });
  }
  async meetings() {
    this.requireUser();
    return this._send('/rest/v1/meeting_requests?select=id,sender_id,recipient_id,note,status,created_at' + (this.realPilotEnabled ? ',proposed_at,duration_minutes,meeting_place,sender_name,recipient_name' : '') + '&order=created_at.desc&limit=100', { authenticated: true });
  }
  async invite(recipient, note, plan = {}) {
    if (!note.trim() || note.length > 500 || recipient === this.requireUser()) throw new Error('Некоректний запит');
    const extra = {};
    if (this.realPilotEnabled) {
      if (!Number.isFinite(Date.parse(plan.proposed_at)) || Date.parse(plan.proposed_at) <= Date.now() || Date.parse(plan.proposed_at) > Date.now() + 90 * 86400000) throw new Error('Обери час у наступні 90 днів.');
      if (![20, 30, 60].includes(plan.duration_minutes) || !['Онлайн', 'Zürich', 'Winterthur', 'Zug', 'Basel', 'Bern'].includes(plan.meeting_place)) throw new Error('Обери тривалість і місце.');
      Object.assign(extra, { proposed_at: new Date(plan.proposed_at).toISOString(), duration_minutes: plan.duration_minutes, meeting_place: plan.meeting_place });
    }
    await this._send('/rest/v1/meeting_requests', { method: 'POST', authenticated: true, prefer: 'return=minimal',
      body: { sender_id: this.requireUser(), recipient_id: recipient, note: note.trim(), ...extra } });
  }
  async respond(id, status) {
    if (!['accepted', 'declined'].includes(status)) throw new Error('Некоректний статус');
    const rows = await this._send(`/rest/v1/meeting_requests?id=eq.${encodeURIComponent(id)}&status=eq.pending`, {
      method: 'PATCH', authenticated: true, prefer: 'return=representation', body: { status } });
    if (rows.length !== 1) throw new Error('Запит недоступний');
  }
  requireRealPilot() { this.requireUser(); if (!this.realPilotEnabled) throw new Error('Ця дія стане доступною після оновлення сервера пілоту.'); }
  async cancelMeeting(id) {
    this.requireRealPilot();
    const rows = await this._send(`/rest/v1/meeting_requests?id=eq.${encodeURIComponent(id)}&sender_id=eq.${encodeURIComponent(this.requireUser())}&status=in.(pending,accepted)`, { method: 'PATCH', authenticated: true, prefer: 'return=representation', body: { status: 'cancelled' } });
    if (rows.length !== 1) throw new Error('Запит уже змінено або недоступний.');
  }
  async messages(meetingId) {
    this.requireRealPilot();
    return this._send(`/rest/v1/meeting_messages?meeting_id=eq.${encodeURIComponent(meetingId)}&select=id,sender_id,body,created_at&order=created_at.desc&limit=100`, { authenticated: true });
  }
  async sendMessage(meetingId, body) {
    this.requireRealPilot();
    if (typeof body !== 'string' || !body.trim() || body.length > 1000) throw new Error('Повідомлення має містити 1–1000 символів.');
    await this._send('/rest/v1/meeting_messages', { method: 'POST', authenticated: true, body: { meeting_id: meetingId, sender_id: this.requireUser(), body: body.trim() } });
  }
  async blocks() { this.requireRealPilot(); return this._send(`/rest/v1/profile_blocks?blocker_id=eq.${encodeURIComponent(this.requireUser())}&select=blocked_id,created_at&order=created_at.desc`, { authenticated: true }); }
  async block(id) { this.requireRealPilot(); if (id === this.requireUser()) throw new Error('Некоректне блокування'); await this._send('/rest/v1/profile_blocks', { method: 'POST', authenticated: true, body: { blocker_id: this.requireUser(), blocked_id: id }, prefer: 'resolution=ignore-duplicates,return=minimal' }); }
  async unblock(id) { this.requireRealPilot(); await this._send(`/rest/v1/profile_blocks?blocker_id=eq.${encodeURIComponent(this.requireUser())}&blocked_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', authenticated: true }); }
  async report(id, reason, detail) {
    this.requireRealPilot();
    if (!['spam', 'impersonation', 'harassment', 'other'].includes(reason) || typeof detail !== 'string' || detail.length > 500 || id === this.requireUser()) throw new Error('Некоректна скарга');
    await this._send('/rest/v1/profile_reports', { method: 'POST', authenticated: true, body: { reporter_id: this.requireUser(), reported_id: id, reason, detail: detail.trim() } });
  }
  async deleteProfile() {
    this.requireRealPilot();
    const rows = await this._send(`/rest/v1/profiles?id=eq.${encodeURIComponent(this.requireUser())}`, { method: 'DELETE', authenticated: true, prefer: 'return=representation' });
    if (rows.length !== 1) throw new Error('Профіль не видалено: він недоступний або вже відсутній.');
  }
  // SYN_STORE_CARRIES_CASE_STATE: case state per pair, exactly what createCaseState returns.
  // No free text, no contacts, no transcript; the stored hash is never recomputed on read.
  // SYN_OWN_APPROVAL_ONLY: a caller writes only its own approval. Every other party's
  // approval is re-read from the stored row and kept only while it still matches the
  // version and terms hash being written; the status is derived here and never taken
  // from the payload. This removes the client-side path that let one party record the
  // other party's approval. It is defence in depth, not the authority: the server-side
  // gate (match_case_approvals + RLS in supabase/case-state.proposal.sql) is still
  // labelled PRESENT_BUT_UNTESTED in bible/STATUS.md and remains the real enforcement.
  async saveCaseState(state) {
    this.requireRealPilot();
    const me = this.requireUser();
    const CASE_KEYS = ['schema', 'caseId', 'participants', 'version', 'material', 'termsHash', 'status', 'approvals', 'binding', 'approvalAttestation', 'createdAt', 'updatedAt', 'expiresAt', 'closedBy', 'closedAt', 'closeReason', 'timeAuthority', 'events'];
    const validId = value => typeof value === 'string' && value.length >= 1 && value.length <= 64 && /^[A-Za-z0-9_:-]+$/.test(value);
    if (!state || state.schema !== 'synera.case-state.v1' || !validId(state.caseId) || !Array.isArray(state.participants) || state.participants.length !== 2 || state.participants.some(id => !validId(id)) || !Number.isSafeInteger(state.version) || state.version < 1 || !/^[a-f0-9]{64}$/.test(state.termsHash ?? '') || !state.approvals || typeof state.approvals !== 'object' || Array.isArray(state.approvals) || !Array.isArray(state.events)) throw new Error('Некоректний стан кейсу');
    const clean = {};
    for (const key of CASE_KEYS) if (Object.hasOwn(state, key)) clean[key] = state[key];
    clean.schema = 'synera.case-state.v1';
    const stored = await this.caseState(clean.caseId);
    if (stored) {
      const same = Array.isArray(stored.participants) && stored.participants.length === clean.participants.length
        && stored.participants.every((id, index) => id === clean.participants[index]);
      if (!same) throw new Error('Учасники кейсу не можуть змінитися');
      if (Number.isSafeInteger(stored.version) && clean.version < stored.version) throw new Error('Версія кейсу не може йти назад');
    }
    const closed = ['revoked', 'abandoned'].includes(clean.status);
    if (closed && clean.closedBy !== me) throw new Error('Кейс закривається лише стороною, яка це робить');
    const approvals = {};
    if (!closed) {
      for (const id of clean.participants) {
        const candidate = id === me ? clean.approvals?.[id] : stored?.approvals?.[id];
        if (!candidate || typeof candidate !== 'object' || candidate.partyId !== id) continue;
        if (candidate.version !== clean.version || candidate.termsHash !== clean.termsHash) continue;
        approvals[id] = candidate;
      }
      clean.status = clean.participants.every(id => approvals[id]) ? 'approved_for_next_step'
        : Object.keys(approvals).length ? 'awaiting_approval' : 'draft';
    }
    clean.approvals = approvals;
    await this._send('/rest/v1/match_cases?on_conflict=case_id', { method: 'POST', authenticated: true, prefer: 'resolution=merge-duplicates,return=minimal', body: { case_id: clean.caseId, state: clean } });
  }
  async caseState(caseId) {
    this.requireRealPilot();
    if (typeof caseId !== 'string' || !caseId || caseId.length > 64 || !/^[A-Za-z0-9_:-]+$/.test(caseId)) throw new Error('Некоректний ID кейсу');
    const rows = await this._send(`/rest/v1/match_cases?case_id=eq.${encodeURIComponent(caseId)}&select=state&limit=1`, { authenticated: true });
    return rows?.[0]?.state ?? null;
  }
  async exportAccount() {
    this.requireRealPilot();
    const collect = async (table, columns, filter = '') => {
      const all = [];
      for (let offset = 0; offset < 100000; offset += 500) {
        const rows = await this._send('/rest/v1/' + table + '?select=' + columns + filter + '&order=' + (table === 'pilot_consents' ? 'accepted_at' : 'created_at') + '.asc&limit=500&offset=' + offset, { authenticated: true });
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
