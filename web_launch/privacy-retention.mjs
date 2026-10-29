// Synchronous classic head script (.mjs MIME): expire drafts before page modules read them.
// The simulation lane owns its UI. This narrow storage boundary keeps its format intact.
(function (root) {
  'use strict';
  if (root.SyneraDeviceRetention) return;
  const DAYS = 30, META_KEY = 'synera.privacy.retention.v1';
  const ownsKey = key => typeof key === 'string' && (key.startsWith('synera.') || key.startsWith('synera-session:'));
  const ownsCache = key => /^synera-(shell|studio|simulation)-/.test(key);
  const isDraft = key => key.startsWith('synera.sim.draft.v1:');
  function keys(storage) { return Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter(Boolean); }
  function metadata(storage) {
    try { const value = JSON.parse(storage.getItem(META_KEY) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
    catch { return {}; }
  }
  function purgeJournal(storage, now = Date.now()) {
    const key = 'synera.journal.v1', raw = storage.getItem(key);
    if (!raw) return;
    // Preserve damaged originals for explicit export/erasure, as the journal does.
    let rows; try { rows = JSON.parse(raw); } catch { return; }
    if (!Array.isArray(rows) || rows.some(row => !Number.isFinite(Date.parse(row?.at)))) return;
    const kept = rows.filter(row => now - Date.parse(row.at) < DAYS * 86400000);
    if (kept.length === rows.length) return;
    if (kept.length) storage.setItem(key, JSON.stringify(kept)); else storage.removeItem(key);
  }
  function purgeLocal(storage, now = Date.now(), { adopt = false } = {}) {
    const stamps = metadata(storage), removed = [];
    for (const key of keys(storage).filter(isDraft)) {
      // Undated legacy drafts get one documented migration grace period.
      if (!Number.isFinite(stamps[key]) || stamps[key] > now || adopt) stamps[key] = now;
      if (now - stamps[key] >= DAYS * 86400000) { storage.removeItem(key); delete stamps[key]; removed.push(key); }
    }
    for (const key of Object.keys(stamps)) if (!isDraft(key) || storage.getItem(key) === null) delete stamps[key];
    if (Object.keys(stamps).length) nativeSet.call(storage, META_KEY, JSON.stringify(stamps));
    else storage.removeItem(META_KEY);
    return removed;
  }
  const nativeSet = root.Storage?.prototype.setItem;
  const api = root.SyneraDeviceRetention = { DAYS, META_KEY, ownsKey, ownsCache, isDraft, keys, purgeLocal, purgeJournal, error: null };
  if (!nativeSet) return;
  try {
    const storage = root.localStorage;
    purgeLocal(storage);
    purgeJournal(storage);
    root.Storage.prototype.setItem = function (key, value) {
      const result = nativeSet.call(this, key, value);
      if (this === storage && isDraft(String(key))) {
        const stamps = metadata(storage); stamps[key] = Date.now();
        try { nativeSet.call(storage, META_KEY, JSON.stringify(stamps)); }
        catch (error) { storage.removeItem(key); throw error; }
      }
      return result;
    };
  } catch { api.error = 'localStorage'; }
})(globalThis);
