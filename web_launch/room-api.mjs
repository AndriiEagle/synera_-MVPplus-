import { ServiceError } from './profile-store.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const roomError = () => new Error('Кімнати доступні лише в активному пілоті Neon.');

export function assertRoomGate(config) {
  if (!config || config.backend !== 'neon' || config.pilotSafetyEnabled !== true ||
      config.realPilotEnabled !== true || config.groupRoomsEnabled !== true) throw roomError();
}

function uuid(value, label = 'Ідентифікатор') {
  if (typeof value !== 'string' || !UUID.test(value)) throw new Error(`${label} некоректний.`);
  return value;
}
function shortText(value, label, limit) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > limit) throw new Error(`${label}: 1–${limit} символів.`);
  return value.trim();
}
function revision(value) {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('Версія кімнати некоректна.');
  return value;
}

// The server derives actor identity from its HttpOnly session. This client never sends an actor field.
export class RoomApi {
  constructor(store, config, fetchImpl = fetch) {
    assertRoomGate(config);
    if (!store || typeof store.requireUser !== 'function') throw new Error('Потрібне сховище сесії Neon.');
    this.store = store;
    this.fetch = (...args) => fetchImpl(...args);
  }
  async #post(path, body) {
    this.store.requireUser();
    const response = await this.fetch(path, {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Synera-Client': '1' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(20000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new ServiceError(response.status, payload?.error);
    return payload;
  }
  list() { return this.#post('/api/neon/rooms/list', {}); }
  create({ title, goal, invitee_ids }) {
    const invitees = Array.isArray(invitee_ids) ? invitee_ids.map(id => uuid(id, 'Запрошення')) : [];
    if (invitees.length < 1 || invitees.length > 2 || new Set(invitees).size !== invitees.length) throw new Error('Обери одного або двох різних учасників.');
    const own = this.store.requireUser();
    if (invitees.includes(own)) throw new Error('Не можна запросити себе.');
    return this.#post('/api/neon/rooms/create', { title: shortText(title, 'Назва', 120), goal: shortText(goal, 'Ціль', 500), invitee_ids: invitees });
  }
  get(id) { return this.#post(`/api/neon/rooms/${uuid(id)}/get`, {}); }
  accept(id) { return this.#post(`/api/neon/rooms/${uuid(id)}/accept`, {}); }
  leave(id) { return this.#post(`/api/neon/rooms/${uuid(id)}/leave`, {}); }
  start(id, expected_revision) { return this.#post(`/api/neon/rooms/${uuid(id)}/start`, { expected_revision: revision(expected_revision) }); }
  message(id, { expected_revision, message_id, body }) {
    return this.#post(`/api/neon/rooms/${uuid(id)}/message`, { expected_revision: revision(expected_revision), message_id: uuid(message_id, 'ID повідомлення'), body: shortText(body, 'Повідомлення', 2000) });
  }
  advance(id, expected_revision) { return this.#post(`/api/neon/rooms/${uuid(id)}/advance`, { expected_revision: revision(expected_revision) }); }
  close(id, expected_revision) { return this.#post(`/api/neon/rooms/${uuid(id)}/close`, { expected_revision: revision(expected_revision) }); }
}
