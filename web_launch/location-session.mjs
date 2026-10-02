import { recordLocationSample } from './live-location.mjs';

// Foreground GPS only. Consent is authoritative on the server; browser state is
// transient and cleared on logout, cancellation, failure and revoked permission.
export class LocationSession {
  constructor({ store, geolocation, now = Date.now, onUpdate = () => {}, setTimer = (fn, ms) => setTimeout(fn, ms), clearTimer = id => clearTimeout(id) }) {
    this.store = store; this.geolocation = geolocation; this.now = now; this.onUpdate = onUpdate;
    this.rows = new Map(); this.watches = new Map(); this.clockOffset = 0; this.closed = false;
    this.reads = new Map();
    this.setTimer = setTimer; this.clearTimer = clearTimer;
  }
  instant() { return new Date(this.now() + this.clockOffset).toISOString(); }
  state(id) { return this.rows.get(id) ?? { own: null, peer: null, capture: 'idle' }; }
  emit(id, patch) { if (this.closed) return; this.rows.set(id, { ...this.state(id), ...patch }); this.onUpdate(id); }
  stop(id, capture = 'paused') {
    const watch = this.watches.get(id);
    if (watch) { watch.stopped = true; this.geolocation?.clearWatch(watch.id); this.clearTimer(watch.timer); this.watches.delete(id); }
    this.emit(id, { capture });
  }
  async refresh(id) {
    const read = (this.reads.get(id) ?? 0) + 1; this.reads.set(id, read);
    try {
      const data = await this.store.locationState(id);
      if (this.closed || this.reads.get(id) !== read) return;
      this.clockOffset = Date.parse(data.server_now) - this.now();
      if (!Number.isFinite(this.clockOffset)) throw new Error('Location clock unavailable');
      const watching = this.watches.get(id);
      if (watching && (!data.own || data.own.id !== watching.grantId || this.instant() >= data.own.closes_at || !data.eligible)) this.stop(id, 'ended');
      this.emit(id, { ...data, error: null });
      return data;
    } catch (error) {
      if (this.closed || this.reads.get(id) !== read) return;
      this.stop(id, 'unavailable');
      this.emit(id, { own: null, peer: null, eligible: false, error: 'Сервер недоступний. GPS зупинено; онови стан перед повторною спробою.' });
      throw error;
    }
  }
  async grant(id, options) {
    if (options.consent !== true) throw new Error('Потрібна явна згода');
    await this.store.grantLocation(id, { ...options, intentId: crypto.randomUUID() });
    await this.refresh(id);
    if (this.state(id).own && this.instant() >= this.state(id).own.opens_at) await this.start(id);
  }
  async start(id) {
    if (this.closed) return;
    await this.refresh(id);
    const own = this.state(id).own, at = this.instant();
    if (!own || own.status !== 'active' || at < own.opens_at || Date.parse(own.closes_at) - Date.parse(at) < 61000) {
      this.emit(id, { capture: 'waiting' }); return;
    }
    if (!this.geolocation) { this.emit(id, { capture: 'denied', error: 'Пристрій не надає GPS. Навігація до місця зустрічі працює без нього.' }); return; }
    this.stop(id);
    const watch = { grantId: own.id, stopped: false, sending: false, lastSent: -Infinity, id: null };
    this.watches.set(id, watch);
    watch.timer = this.setTimer(() => this.stop(id, 'ended'), Date.parse(own.closes_at) - Date.parse(at) - 60000);
    this.emit(id, { capture: 'requesting', error: null });
    try { watch.id = this.geolocation.watchPosition(async position => {
      if (watch.stopped || this.closed || watch.sending || this.now() - watch.lastSent < 20000) return;
      if (Date.parse(own.closes_at) - Date.parse(this.instant()) < 61000) { this.stop(id, 'ended'); return; }
      watch.sending = true;
      try {
        // Round BEFORE transmission; the worker independently enforces precision.
        const { sample } = recordLocationSample(own, { partyId: this.store.user.id, lat: position.coords.latitude,
          lon: position.coords.longitude, accuracyM: position.coords.accuracy, at: this.instant() });
        const result = await this.store.publishLocation(id, { lat: sample.lat, lon: sample.lon, accuracyM: sample.accuracy_m ?? 0 });
        if (watch.stopped || this.closed) return;
        watch.lastSent = this.now(); this.emit(id, { capture: 'sharing', own: { ...own, sample: result.sample }, error: null });
      } catch {
        this.stop(id, 'unavailable');
        this.emit(id, { peer: null, error: 'Позицію не надіслано. GPS зупинено; перевір інтернет і стан дозволу.' });
      } finally { watch.sending = false; }
    }, () => {
      if (watch.stopped) return;
      this.stop(id, 'denied'); this.emit(id, { error: 'GPS недоступний або дозвіл пристрою відхилено. Можна повторити або користуватися адресою зустрічі.' });
    }, { enableHighAccuracy: own.precision === 'exact', maximumAge: 10000, timeout: 15000 });
    } catch {
      this.stop(id, 'denied'); this.emit(id, { error: 'Браузер не дозволив GPS. Навігація за адресою доступна.' });
    }
  }
  async revoke(id) {
    this.reads.set(id, (this.reads.get(id) ?? 0) + 1);
    this.stop(id, 'ended');
    this.emit(id, { own: null });
    await this.store.revokeLocation(id);
    await this.refresh(id);
  }
  retain(meetings) {
    const accepted = new Set(meetings.filter(m => m.status === 'accepted').map(m => m.id));
    for (const id of this.rows.keys()) if (!accepted.has(id)) { this.stop(id, 'ended'); this.rows.delete(id); }
  }
  pauseAll() { for (const id of this.watches.keys()) this.stop(id); }
  clear() { this.pauseAll(); this.closed = true; this.rows.clear(); }
}
