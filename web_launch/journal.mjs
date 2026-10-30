// Shared device-only journal. Privacy/expiry is owned by the privacy lane.
// Wire format: an array of {at, kind, actor, text, data}. No second profile store.
import './privacy-retention.mjs';
export const JOURNAL_KEY = 'synera.journal.v1';
const valid = e => e && typeof e.at === 'string' && Number.isFinite(Date.parse(e.at)) &&
  ['kind', 'actor', 'text'].every(k => typeof e[k] === 'string') && e.data && typeof e.data === 'object' && !Array.isArray(e.data);
export function createJournal(storage, now = () => new Date().toISOString()) {
  let entries = [], persistent = Boolean(storage), corrupt = false, generation = 0;
  try {
    if (storage) globalThis.SyneraDeviceRetention.purgeJournal(storage, Date.parse(now()));
    const raw = storage?.getItem(JOURNAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.every(valid)) throw Error('Invalid journal');
      entries = parsed;
    }
  } catch { persistent = false; corrupt = true; }
  return {
    get persistent() { return persistent; },
    entries(source = 'all') { return structuredClone(entries.filter(e => source === 'all' || e.data.source === source)); },
    profile() { return structuredClone(entries.findLast(e => e.kind === 'profile' && e.data.profile)?.data.profile ?? null); },
    cancelPending() { generation++; },
    async addConsent(record) {
      const {action, document_text, document_version, locale, purpose, recipient, expires_at = null} = record || {};
      if (!['grant','withdraw'].includes(action) || !['uk','de','en'].includes(locale) ||
          [document_text, document_version, purpose, recipient].some(v => typeof v !== 'string' || !v.trim()) ||
          (expires_at !== null && (!Number.isFinite(Date.parse(expires_at)) || (action === 'grant' && Date.parse(expires_at) <= Date.parse(now()))))) throw Error('Invalid consent record');
      const before = generation;
      const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(document_text));
      if (before !== generation) throw Error('Consent canceled by erasure');
      const document_sha256 = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
      return this.add('consent', 'visitor', typeof record.label === 'string' ? record.label : document_text, {source:'visitor', localOnly:true, demo:true,
        action, document_text, document_sha256, document_version, locale, purpose, recipient, expires_at});
    },
    add(kind, actor, text, data = {}) {
      const entry = { at: now(), kind, actor, text, data: structuredClone(data) };
      if (!valid(entry)) throw Error('Invalid journal entry');
      // Re-read before append so another tab's completed writes are retained.
      if (!corrupt && storage) {
        try { globalThis.SyneraDeviceRetention.purgeJournal(storage, Date.parse(now())); const raw = storage.getItem(JOURNAL_KEY); const saved = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(saved) || !saved.every(valid)) throw Error('Invalid journal');
          if (persistent) entries = saved;
        } catch { corrupt = true; persistent = false; }
      }
      entries.push(entry);
      if (!corrupt && storage) try { storage.setItem(JOURNAL_KEY, JSON.stringify(entries)); persistent = true; } catch { persistent = false; }
      return structuredClone(entry);
    },
    export(source = 'all') { return JSON.stringify({ format: 'synera.journal.v1', exportedAt: now(), entries: this.entries(source) }, null, 2); },
    erase() {
      generation++;
      // Never claim erasure if the browser denied it.
      if (storage) storage.removeItem(JOURNAL_KEY);
      entries = []; corrupt = false; persistent = Boolean(storage);
    },
  };
}
