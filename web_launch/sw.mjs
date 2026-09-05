// Cache only explicit public shell assets. Never cache API, tokens, profiles, map tiles or imports.
const CACHE = 'synera-shell-20260905-neon-v4';
const SHELL = ['/', '/index.html', '/style.css', '/app.mjs', '/online-store.mjs', '/profile-store.mjs', '/neon-store.mjs', '/profile-portability.mjs', '/profile-brief.mjs', '/profile-package.mjs', '/calendar.mjs', '/matching.mjs', '/map.mjs', '/pilot-policy.mjs', '/pwa.mjs', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/legal.html'];
SHELL.push('/chatgpt-transfer.mjs');
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('synera-shell-') && key !== CACHE).map(key => caches.delete(key))))); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname === '/config.json' && !url.search) {
    event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify({ offline: true }), { status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })));
    return;
  }
  if (url.search || !SHELL.includes(url.pathname)) return;
  event.respondWith(fetch(event.request).then(async response => {
    if (response.ok) { const cache = await caches.open(CACHE); await cache.put(event.request, response.clone()); }
    return response;
  }).catch(() => caches.match(event.request)));
});
