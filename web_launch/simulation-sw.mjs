const CACHE = 'synera-simulation-20261020-v1';
const SHELL = ['/simulation.html', '/simulation.css', '/simulation-ui.mjs', '/simulation-session.mjs',
  '/simulation-personas.mjs', '/profile-portability.mjs', '/business-case.mjs', '/profile-brief.mjs',
  '/proof-state.mjs', '/case-material-budget.mjs', '/matching.mjs', '/b-matching.mjs', '/need-decay.mjs',
  '/style.css', '/tokens.css', '/simulation.webmanifest', '/icon-192.png', '/icon-512.png'];
SHELL.push('/scenes.css','/scene-simulation.webp','/scene-simulation@2x.webp');
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin ||
      !SHELL.includes(url.pathname) || url.search) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(url.pathname)));
});
