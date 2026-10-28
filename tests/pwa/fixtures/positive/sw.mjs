const CACHE = 'fixture-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname === '/config.json') {
    event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify({ offline: true }), { status: 503, headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  if (!SHELL.includes(url.pathname)) return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).catch(() => caches.match('/'))));
});
