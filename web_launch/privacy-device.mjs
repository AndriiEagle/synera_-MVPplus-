import './privacy-retention.mjs';
export const retention = globalThis.SyneraDeviceRetention;
export const STUDIO_DB = 'synera-studio-v1';

// Do not create an empty database while merely inspecting privacy settings.
export async function studioData(mode = 'export', { indexedDB = globalThis.indexedDB, now = Date.now() } = {}) {
  if (!indexedDB) throw Error('IndexedDB unavailable');
  if (indexedDB.databases && !(await indexedDB.databases()).some(db => db.name === STUDIO_DB)) return [];
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(STUDIO_DB);
    let absent = false;
    request.onupgradeneeded = () => { absent = true; request.transaction.abort(); };
    request.onerror = () => absent ? resolve([]) : reject(Error('IndexedDB unavailable'));
    request.onblocked = () => reject(Error('IndexedDB blocked'));
    request.onsuccess = () => {
      const db = request.result; db.onversionchange = () => db.close();
      if (!db.objectStoreNames.contains('sessions')) { db.close(); reject(Error('Unknown Studio schema')); return; }
      const tx = db.transaction('sessions', mode === 'export' ? 'readonly' : 'readwrite');
      const store = tx.objectStore('sessions'), read = store.getAll(); let rows = [];
      read.onsuccess = () => {
        rows = read.result;
        if (mode === 'erase') store.clear();
        if (mode === 'purge') for (const row of rows) {
          if (!Number.isFinite(row.at) || now - row.at >= retention.DAYS * 86400000) store.delete(row.id);
        }
      };
      tx.oncomplete = () => { db.close(); resolve(rows); };
      tx.onerror = tx.onabort = () => { db.close(); reject(Error('IndexedDB transaction failed')); };
    };
  });
}

export function storageSnapshot(storage) {
  return Object.fromEntries(retention.keys(storage).filter(retention.ownsKey).map(key => [key, storage.getItem(key)]));
}
const browserStorage = name => { try { return globalThis[name]; } catch { return null; } };
function base64(bytes) {
  let text = ''; for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
}
export async function exportDevice({ localStorage = browserStorage('localStorage'), sessionStorage = browserStorage('sessionStorage'), cacheStorage = globalThis.caches, indexedDB = globalThis.indexedDB } = {}) {
  const data = { format: 'synera-device-export-1', private: true, exportedAt: new Date().toISOString(), localStorage: {}, sessionStorage: {}, indexedDB: {}, caches: {}, unavailable: [] };
  for (const [name, storage] of Object.entries({ localStorage, sessionStorage })) {
    try { if (!storage) throw Error(); data[name] = storageSnapshot(storage); } catch { data.unavailable.push(name); }
  }
  try { data.indexedDB[STUDIO_DB] = { sessions: await studioData('export', { indexedDB }) }; } catch { data.unavailable.push('IndexedDB'); }
  try {
    if (!cacheStorage) throw Error();
    for (const name of (await cacheStorage.keys()).filter(retention.ownsCache)) {
      const cache = await cacheStorage.open(name), entries = [];
      for (const request of await cache.keys()) {
        const response = await cache.match(request);
        entries.push({ url: request.url, status: response.status, headers: Object.fromEntries(response.headers), bodyBase64: base64(new Uint8Array(await response.arrayBuffer())) });
      }
      data.caches[name] = entries;
    }
  } catch { data.unavailable.push('CacheStorage'); }
  // HttpOnly session cookies are deliberately inaccessible to page JavaScript.
  data.exclusions = ['HttpOnly cookies; use server sign-out', 'server records and simulation runtime journal', 'downloaded files and other tabs sessionStorage'];
  return data;
}
export async function eraseDevice({ localStorage = browserStorage('localStorage'), sessionStorage = browserStorage('sessionStorage'), cacheStorage = globalThis.caches, indexedDB = globalThis.indexedDB, serviceWorker = globalThis.navigator?.serviceWorker } = {}) {
  const unavailable = [];
  // Stop owned workers before deleting their caches. Other applications keep their workers.
  try { for (const worker of await serviceWorker?.getRegistrations() || []) {
    const script = worker.active?.scriptURL || worker.waiting?.scriptURL || worker.installing?.scriptURL;
    if (script && /\/(?:sw|studio-sw|simulation-sw)\.mjs$/.test(new URL(script).pathname)) await worker.unregister();
  } } catch { unavailable.push('ServiceWorker'); }
  for (const [name, storage] of Object.entries({ localStorage, sessionStorage })) {
    try { if (!storage) throw Error(); for (const key of retention.keys(storage).filter(retention.ownsKey)) storage.removeItem(key); }
    catch { unavailable.push(name); }
  }
  try { await studioData('erase', { indexedDB }); } catch { unavailable.push('IndexedDB'); }
  try { if (!cacheStorage) throw Error(); for (const name of (await cacheStorage.keys()).filter(retention.ownsCache)) await cacheStorage.delete(name); }
  catch { unavailable.push('CacheStorage'); }
  return { ok: unavailable.length === 0, unavailable };
}
