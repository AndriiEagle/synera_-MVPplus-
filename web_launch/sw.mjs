// Cache only explicit public shell assets. Never cache API, tokens, profiles, map tiles or imports.
const CACHE = 'synera-shell-20261030-wave2';
// Optional replies need the consent UI offline too; API/config responses stay uncached.
const SHELL = ['/', '/index.html', '/style.css', '/app.mjs', '/style-switcher.mjs', '/onboarding-tour.mjs', '/demo-journey.mjs', '/online-store.mjs', '/profile-store.mjs', '/neon-store.mjs', '/profile-portability.mjs', '/profile-brief.mjs', '/profile-package.mjs', '/calendar.mjs', '/matching.mjs', '/map.mjs', '/pilot-policy.mjs', '/pwa.mjs', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/legal.html', '/catalogue.html', '/tokens.css', '/cascade.mjs', '/iceberg-client.mjs'];
SHELL.push('/chatgpt-transfer.mjs', '/business-case.mjs', '/i18n.mjs', '/proof-state.mjs', '/need-decay.mjs', '/b-matching.mjs', '/field-audience.mjs', '/swiss-compliance.mjs', '/funnel-analytics.mjs', '/live-location.mjs', '/meeting-location.mjs');
SHELL.push('/summit.html', '/summit.css', '/summit.mjs', '/montserrat-400.woff2', '/montserrat-500.woff2');
SHELL.push('/location-session.mjs','/live-ai-client.mjs');
SHELL.push('/get.html', '/product-access.mjs');
SHELL.push('/triangle.html', '/triangle.css', '/triangle.mjs', '/triangle-room.mjs', '/explore-planner.mjs');
SHELL.push('/profile-import.mjs', '/index-language.mjs', '/index-i18n.mjs', '/index-i18n-table.mjs', '/real-journey-i18n.mjs', '/legal-language.mjs', '/legal-i18n.mjs', '/atelier.mjs', '/atelier.css');
SHELL.push('/result-card.mjs', '/action-scoper.mjs', '/session-value.mjs');
SHELL.push('/case-material-budget.mjs');
SHELL.push('/install-hint.mjs');
SHELL.push('/simulation.html','/simulation.css','/simulation-ui.mjs','/simulation-session.mjs','/simulation-personas.mjs','/simulation-living.mjs','/simulation-copy.mjs','/simulation-living-ui.mjs','/simulation-living.css','/simulation-entry.mjs','/journal.mjs','/simulation.webmanifest');
SHELL.push('/adaptive.mjs','/adaptive-ui.mjs','/adaptive-config.mjs','/adaptive-i18n-table.mjs','/adaptive.css');
SHELL.push('/adapt-copy.mjs','/adapt-observer.mjs','/adapt-ui.mjs','/sovereign.mjs','/sovereign-ui.mjs','/balance.mjs','/journal-matching.mjs','/adapt-demo.mjs');
SHELL.push('/simulation-mode.mjs');
SHELL.push("/site-shell.css","/site-shell.mjs","/premium-match.webp","/premium-calendar.webp","/premium-terms.webp","/premium-signature.webp");
SHELL.push('/privacy.html', '/privacy.css', '/privacy-retention.mjs', '/privacy-content.mjs', '/privacy-device.mjs', '/privacy-common.mjs', '/privacy-centre.mjs', '/ops-log.mjs');
SHELL.push('/persona-mira.webp','/persona-leo.webp','/persona-nora.webp','/persona-felix.webp','/persona-ines.webp','/persona-sam.webp','/persona-tessa.webp','/persona-noah.webp','/persona-lina.webp','/persona-omar.webp','/synera-thread.webp','/synera-thread@2x.webp');
SHELL.push('/demo-device-controls.mjs','/legal-documents.mjs','/legal-documents.css','/pilot-consent.html','/privacy.html','/privacy.css','/privacy-common.mjs','/privacy-device.mjs','/privacy-content.mjs','/privacy-retention.mjs','/site-shell.css','/site-shell.mjs','/style-switcher.mjs','/adaptive-ui.mjs','/adaptive.mjs','/adaptive-config.mjs','/adaptive-i18n-table.mjs','/adaptive.css','/legal.html','/tokens.css','/style.css');
SHELL.push('/scenes.css','/scene-summit.webp','/scene-summit@2x.webp','/scene-studio.webp','/scene-studio@2x.webp','/scene-triangle.webp','/scene-triangle@2x.webp','/scene-real-journey.webp','/scene-real-journey@2x.webp','/scene-rooms.webp','/scene-rooms@2x.webp','/scene-simulation.webp','/scene-simulation@2x.webp','/scene-privacy.webp','/scene-privacy@2x.webp','/scene-legal.webp','/scene-legal@2x.webp','/scene-get.webp','/scene-get@2x.webp','/scene-empty.webp','/scene-empty@2x.webp');
SHELL.push('/radar.html','/radar.css','/radar.mjs','/radar-ui.mjs','/radar-copy.mjs','/radar-events.json');
self.addEventListener('install', event => {
  // Privacy controls share the public offline shell. CACHE is bumped by the merge owner.
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...new Set(SHELL)])));
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
