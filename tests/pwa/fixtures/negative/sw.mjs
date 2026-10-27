// Negative fixture: network-only worker; nothing is cached, nothing answers offline.
self.addEventListener('install', () => {});
self.addEventListener('fetch', event => { event.respondWith(fetch(event.request)); });
