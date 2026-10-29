const CACHE = 'synera-simulation-20261020-v1';
const PORTRAITS = ['mira','leo','nora','felix','ines','sam','tessa','noah','lina','omar'].map(key => `/persona-${key}.webp`);
const SHELL = ['/simulation.html', '/simulation.css', '/simulation-ui.mjs', '/simulation-session.mjs',
  '/simulation-living.mjs', '/simulation-copy.mjs', '/simulation-living-ui.mjs', '/simulation-living.css', '/journal.mjs',
  '/simulation-personas.mjs', '/profile-portability.mjs', '/business-case.mjs', '/profile-brief.mjs',
  '/proof-state.mjs', '/case-material-budget.mjs', '/matching.mjs', '/b-matching.mjs', '/need-decay.mjs',
  '/style.css', '/tokens.css', '/montserrat-400.woff2', '/montserrat-500.woff2', '/simulation.webmanifest', '/icon-192.png', '/icon-512.png'];
// Optional graphics must not hold the installation transaction open. They are
// cached on successful requests after activation; missing portraits use initials.
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin ||
      !(SHELL.includes(url.pathname) || PORTRAITS.includes(url.pathname)) || (url.search && url.pathname !== '/simulation.html')) return;
  event.respondWith(fetch(event.request).then(async response => {
    if (response.ok) await (await caches.open(CACHE)).put(url.pathname, response.clone());
    return response;
  }).catch(() => caches.match(url.pathname)));
});
