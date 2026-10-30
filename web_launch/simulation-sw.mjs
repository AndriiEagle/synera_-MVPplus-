const CACHE = 'synera-simulation-20261030-wave2';
const PORTRAITS = ['mira','leo','nora','felix','ines','sam','tessa','noah','lina','omar'].map(key => `/persona-${key}.webp`);
const SHELL = ['/simulation.html', '/simulation.css', '/simulation-ui.mjs', '/simulation-session.mjs',
  '/simulation-living.mjs', '/simulation-copy.mjs', '/simulation-living-ui.mjs', '/simulation-living.css', '/journal.mjs',
  '/simulation-personas.mjs', '/profile-portability.mjs', '/business-case.mjs', '/profile-brief.mjs',
  '/proof-state.mjs', '/case-material-budget.mjs', '/matching.mjs', '/b-matching.mjs', '/need-decay.mjs',
  '/style.css', '/tokens.css', '/montserrat-400.woff2', '/montserrat-500.woff2', '/simulation.webmanifest', '/icon-192.png', '/icon-512.png'];
// Optional graphics must not hold the installation transaction open. They are
// cached on successful requests after activation; missing portraits use initials.
SHELL.push('/privacy-centre.mjs','/atelier.mjs','/atelier.css','/legal-language.mjs');
SHELL.push('/demo-device-controls.mjs','/legal-documents.mjs','/legal-documents.css','/pilot-consent.html','/privacy.html','/privacy.css','/privacy-common.mjs','/privacy-device.mjs','/privacy-content.mjs','/privacy-retention.mjs','/site-shell.css','/site-shell.mjs','/style-switcher.mjs','/adaptive-ui.mjs','/adaptive.mjs','/adaptive-config.mjs','/adaptive-i18n-table.mjs','/adaptive.css','/legal.html','/tokens.css','/style.css','/legal-i18n.mjs','/index-i18n.mjs','/index-i18n-table.mjs','/real-journey-i18n.mjs');
SHELL.push('/scenes.css','/scene-simulation.webp','/scene-simulation@2x.webp');
SHELL.push('/adapt-copy.mjs','/adapt-observer.mjs','/adapt-ui.mjs','/sovereign.mjs','/sovereign-ui.mjs','/balance.mjs','/journal-matching.mjs','/adapt-demo.mjs');
SHELL.push('/simulation-mode.mjs');
SHELL.push('/scenes.css','/scene-simulation.webp','/scene-simulation@2x.webp','/live-ai-client.mjs');
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...new Set(SHELL)]))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('synera-simulation-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin ||
      !(SHELL.includes(url.pathname) || PORTRAITS.includes(url.pathname)) || url.search) return;
  event.respondWith(fetch(event.request).then(async response => {
    if (response.ok) await (await caches.open(CACHE)).put(url.pathname, response.clone());
    return response;
  }).catch(() => caches.match(url.pathname)));
});
