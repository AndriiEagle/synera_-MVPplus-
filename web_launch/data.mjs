import { validateProfile } from './online-store.mjs';
export { SupabaseStore, ServiceError, validateProfile } from './online-store.mjs';
import { BOT_PROFILES, simulationAt, simulatedReply, hourSlot } from './simulation.mjs';
import { consentRecord, POLICY_VERSION } from './pilot-policy.mjs';
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
  simulationEnabled = false;
  simulationOffset = 0;
  consents = [];
  constructor({ bots = false } = {}) {
    this.simulationEnabled = bots;
    if (bots) this.profiles = [structuredClone(DEMO_PROFILES[0]), ...structuredClone(BOT_PROFILES)];
  }
  simulationTime() { return new Date(Date.now() + this.simulationOffset * 3600000); }
  async tick() {
    if (!this.simulationEnabled || !this.user) return;
    const at = this.simulationTime(), slot = hourSlot(at);
    for (const request of this.requests) {
      const bot = this.profiles.find(p => p.id === request.recipient_id && p.is_bot);
      if (bot && bot.id !== this.user.id && request.status === 'pending' && request.created_hour < slot) {
        Object.assign(request, simulatedReply(this.profiles.find(p => p.id === request.sender_id), bot, at));
      }
    }
  }
  async advanceHour() { this.simulationOffset++; await this.tick(); }
  async acceptPolicy(value) { this.consents.push({ ...consentRecord(value), user_id: this.requireUser(), accepted_at: new Date().toISOString(), demo_only: true }); }
  async signIn(id = 'demo-a') {
    if (!this.profiles.some(p => p.id === id)) throw new Error('Невідомий демо користувач');
    this.user = { id };
  }
  async signOut() { this.user = null; }
  requireUser() { if (!this.user) throw new Error('Потрібен вхід'); return this.user.id; }
  async ownProfile() { return structuredClone(this.profiles.find(p => p.id === this.requireUser())); }
  async saveProfile(profile) {
    const id = this.requireUser();
    validateProfile(profile);
    Object.assign(this.profiles.find(p => p.id === id), profile, { id });
  }
  async discover() {
    const id = this.requireUser();
    const states = this.simulationEnabled ? simulationAt(this.simulationTime()) : [];
    return structuredClone(this.profiles.filter(p => p.id !== id && p.is_discoverable).map(p => {
      const state = states.find(bot => bot.id === p.id);
      return state ? { ...state, ...p, lat: state.lat, lon: state.lon } : p;
    }));
  }
  async meetings() {
    const id = this.requireUser();
    return structuredClone(this.requests.filter(r => [r.sender_id, r.recipient_id].includes(id)));
  }
  async invite(recipient, note) {
    const id = this.requireUser();
    if (recipient === id || !this.profiles.some(p => p.id === recipient && p.is_discoverable)) throw new Error('Одержувач недоступний');
    if (!note.trim() || note.length > 500) throw new Error('Некоректна нотатка');
    if (this.requests.some(r => r.sender_id === id && r.recipient_id === recipient && r.status === 'pending')) throw new Error('Запит очікує відповіді');
    this.requests.push({ id: crypto.randomUUID(), sender_id: id, recipient_id: recipient, note: note.trim(), status: 'pending', created_at: new Date().toISOString(), created_hour: hourSlot(this.simulationTime()) });
  }
  async respond(id, status) {
    const user = this.requireUser();
    if (!['accepted', 'declined'].includes(status)) throw new Error('Некоректний статус');
    const row = this.requests.find(r => r.id === id && r.recipient_id === user && r.status === 'pending');
    if (!row) throw new Error('Не дозволено');
    row.status = status;
  }
}
