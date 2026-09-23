// Cache only explicit public shell assets. Never cache API, tokens, profiles, map tiles or imports.
// Bumped with the "Night map" redesign so installed PWAs drop the old shell (activate deletes older synera-shell-* caches).
const CACHE = 'synera-shell-20260923-v3';
const SHELL = ['/', '/index.html', '/style.css', '/app.mjs', '/online-store.mjs', '/profile-store.mjs', '/neon-store.mjs', '/profile-portability.mjs', '/profile-brief.mjs', '/profile-package.mjs', '/calendar.mjs', '/matching.mjs', '/map.mjs', '/pilot-policy.mjs', '/pwa.mjs', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/legal.html', '/catalogue.html', '/tokens.css', '/cascade.mjs', '/iceberg-client.mjs'];
SHELL.push('/chatgpt-transfer.mjs', '/business-case.mjs', '/i18n.mjs', '/proof-state.mjs', '/need-decay.mjs', '/b-matching.mjs', '/field-audience.mjs', '/swiss-compliance.mjs', '/funnel-analytics.mjs', '/montserrat-400.woff2', '/montserrat-500.woff2', '/i18n-phrases.mjs');
self.addEventListener('install', event => { 
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))); 
});
self.addEventListener('activate', event => { 
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('synera-shell-') && key !== CACHE).map(key => caches.delete(key))))); 
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname === '/config.json' && !url.search) {
    event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify({ offline: true }), { status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })));
    return;
  }
  if (url.search || !SHELL.includes(url.pathname)) return;
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(async response => {
        if (response.ok) { 
          const cache = await caches.open(CACHE); 
          await cache.put(event.request, response.clone()); 
        }
        return response;
      }).catch(() => { /* offline fallback handled by cache */ });
      return cachedResponse || fetchPromise;
    })
  );
});

// C07.L6: PWA Badge & Push (stub)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'Нове сповіщення', body: '...' };
  
  if (navigator.setAppBadge) {
    navigator.setAppBadge(1).catch(console.error);
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url || '/'
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (navigator.clearAppBadge) {
    navigator.clearAppBadge().catch(console.error);
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data || '/');
      }
    })
  );
});
