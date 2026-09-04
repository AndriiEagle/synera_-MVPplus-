export const DEMO_PROFILES = [
  { id: 'demo-a', display_name: 'Учасник А', city: 'Цюрих', offers: 'Відеопрезентація і дизайн профілю', seeks: 'B2B-продажі та перші інтро', is_discoverable: true },
  { id: 'demo-b', display_name: 'Учасник Б', city: 'Цюрих', offers: 'B2B-продажі та customer interviews', seeks: 'Відеопрезентація продукту', is_discoverable: true },
  { id: 'demo-c', display_name: 'Учасник В', city: 'Баден', offers: 'Воркшопи для комʼюніті', seeks: 'Партнер для спорту', is_discoverable: true },
];

export class DemoStore {
  mode = 'demo';
  user = null;
  profiles = structuredClone(DEMO_PROFILES);
  requests = [];
  async signIn(id = 'demo-a') {
    if (!this.profiles.some(p => p.id === id)) throw new Error('Unknown demo user');
    this.user = { id };
  }
  async signOut() { this.user = null; }
  requireUser() { if (!this.user) throw new Error('Sign in required'); return this.user.id; }
  async ownProfile() { return structuredClone(this.profiles.find(p => p.id === this.requireUser())); }
  async saveProfile(profile) {
    const id = this.requireUser();
    validateProfile(profile);
    Object.assign(this.profiles.find(p => p.id === id), profile, { id });
  }
  async discover() {
    const id = this.requireUser();
    return structuredClone(this.profiles.filter(p => p.id !== id && p.is_discoverable));
  }
  async meetings() {
    const id = this.requireUser();
    return structuredClone(this.requests.filter(r => [r.sender_id, r.recipient_id].includes(id)));
  }
  async invite(recipient, note) {
    const id = this.requireUser();
    if (recipient === id || !this.profiles.some(p => p.id === recipient && p.is_discoverable)) throw new Error('Recipient unavailable');
    if (!note.trim() || note.length > 500) throw new Error('Invalid note');
    if (this.requests.some(r => r.sender_id === id && r.recipient_id === recipient && r.status === 'pending')) throw new Error('Pending request exists');
    this.requests.push({ id: crypto.randomUUID(), sender_id: id, recipient_id: recipient, note: note.trim(), status: 'pending', created_at: new Date().toISOString() });
  }
  async respond(id, status) {
    const user = this.requireUser();
    if (!['accepted', 'declined'].includes(status)) throw new Error('Invalid status');
    const row = this.requests.find(r => r.id === id && r.recipient_id === user && r.status === 'pending');
    if (!row) throw new Error('Not allowed');
    row.status = status;
  }
}

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
  constructor({ supabaseUrl, publishableKey }, fetchImpl = fetch) {
    const url = new URL(supabaseUrl);
    if (url.protocol !== 'https:' || !/^[a-z0-9]+\.supabase\.co$/.test(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid project URL');
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) throw new Error('Publishable key required');
    this.url = url.origin;
    this.key = publishableKey;
    this.fetch = fetchImpl;
  }
  get user() { return this.#session?.user ?? null; }
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
      if (authenticated && response.status === 401) this.#session = null;
      throw new ServiceError(response.status);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  #acceptSession(result) {
    if (!result?.access_token || !result?.refresh_token || !result?.user?.id) throw new Error('Session unavailable');
    this.#session = { ...result, expires_at: result.expires_at ?? Math.floor(Date.now() / 1000) + result.expires_in };
  }
  async #freshSession() {
    if (!this.#session) throw new Error('Sign in required');
    if (this.#session.expires_at > Date.now() / 1000 + 30) return;
    if (!this.#refresh) {
      this.#refresh = this.#send('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: this.#session.refresh_token } })
        .then(value => this.#acceptSession(value)).catch(error => { this.#session = null; throw error; }).finally(() => { this.#refresh = null; });
    }
    await this.#refresh;
  }
  async signIn(email, password) {
    this.#acceptSession(await this.#send('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }));
  }
  async signUp(email, password) {
    const result = await this.#send('/auth/v1/signup', { method: 'POST', body: { email, password } });
    if (result?.access_token) this.#acceptSession(result);
    return Boolean(this.user);
  }
  async signOut() {
    try { if (this.#session) await this.#send('/auth/v1/logout?scope=local', { method: 'POST', authenticated: true }); }
    finally { this.#session = null; }
  }
  requireUser() { if (!this.user) throw new Error('Sign in required'); return this.user.id; }
  async ownProfile() {
    const id = this.requireUser();
    const rows = await this.#send(`/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=id,display_name,city,offers,seeks,is_discoverable`, { authenticated: true });
    return rows[0] ?? { id, display_name: '', city: '', offers: '', seeks: '', is_discoverable: false };
  }
  async saveProfile(profile) {
    validateProfile(profile);
    const { display_name, city, offers, seeks, is_discoverable } = profile;
    await this.#send('/rest/v1/profiles?on_conflict=id', { method: 'POST', authenticated: true,
      prefer: 'resolution=merge-duplicates,return=minimal', body: { id: this.requireUser(), display_name, city, offers, seeks, is_discoverable } });
  }
  async discover() {
    return this.#send(`/rest/v1/profiles?is_discoverable=eq.true&id=neq.${encodeURIComponent(this.requireUser())}&select=id,display_name,city,offers,seeks&limit=50`, { authenticated: true });
  }
  async meetings() {
    this.requireUser();
    return this.#send('/rest/v1/meeting_requests?select=id,sender_id,recipient_id,note,status,created_at&order=created_at.desc&limit=50', { authenticated: true });
  }
  async invite(recipient, note) {
    if (!note.trim() || note.length > 500 || recipient === this.requireUser()) throw new Error('Invalid request');
    await this.#send('/rest/v1/meeting_requests', { method: 'POST', authenticated: true, prefer: 'return=minimal',
      body: { sender_id: this.requireUser(), recipient_id: recipient, note: note.trim() } });
  }
  async respond(id, status) {
    if (!['accepted', 'declined'].includes(status)) throw new Error('Invalid status');
    const rows = await this.#send(`/rest/v1/meeting_requests?id=eq.${encodeURIComponent(id)}&status=eq.pending`, {
      method: 'PATCH', authenticated: true, prefer: 'return=representation', body: { status } });
    if (rows.length !== 1) throw new Error('Request unavailable');
  }
}
