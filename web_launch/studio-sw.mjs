// Dedicated narrower scope /studio keeps the existing application worker intact.
const CACHE='synera-studio-20261029-gilbert1';
const ASSETS=['/studio.html','/studio.css','/studio.mjs','/studio-journey.html','/journey.css','/journey-ui.mjs','/journey-core.mjs','/journey-ai-client.mjs','/journey-handoff.mjs','/studio-install.mjs','/studio.webmanifest','/session-value.mjs','/declared-fit.mjs','/group-logistics.mjs','/archive-codec.mjs','/summit.css','/triangle.css','/icon-192.png','/icon-512.png','/apple-touch-icon.png','/montserrat-400.woff2','/montserrat-500.woff2','/atelier.css','/atelier.mjs','/tokens.css','/portrait-mara.webp','/portrait-noor.webp','/portrait-leo.webp','/icon-map-pin.svg','/icon-message-circle.svg','/icon-handshake.svg','/icon-archive.svg','/icon-code-xml.svg','/icon-pen-tool.svg','/icon-megaphone.svg'];
ASSETS.push('/style-switcher.mjs','/real-journey-i18n.mjs','/index-i18n.mjs','/index-i18n-table.mjs','/legal-i18n.mjs',"/site-shell.css","/site-shell.mjs","/premium-match.webp","/premium-calendar.webp","/premium-terms.webp","/premium-signature.webp");
ASSETS.push('/adaptive.mjs','/adaptive-ui.mjs','/adaptive-config.mjs','/adaptive-i18n-table.mjs','/adaptive.css');
ASSETS.push('/privacy.html','/privacy.css','/privacy-retention.mjs','/privacy-content.mjs','/privacy-device.mjs','/privacy-common.mjs','/privacy-centre.mjs','/style.css','/legal.html','/ops-log.mjs');
ASSETS.push('/demo-device-controls.mjs','/legal-documents.mjs','/legal-documents.css','/pilot-consent.html','/privacy.html','/privacy.css','/privacy-common.mjs','/privacy-device.mjs','/privacy-content.mjs','/privacy-retention.mjs','/site-shell.css','/site-shell.mjs','/style-switcher.mjs','/adaptive-ui.mjs','/adaptive.mjs','/adaptive-config.mjs','/adaptive-i18n-table.mjs','/adaptive.css','/legal.html','/tokens.css','/style.css');
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...new Set(ASSETS)])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('synera-studio-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);
  // The public host redirects .html to a clean URL. Both routes use the same public shell.
  const cacheKey=['/studio','/studio/'].includes(u.pathname)?'/studio.html':['/studio-journey','/studio-journey/'].includes(u.pathname)?'/studio-journey.html':u.pathname;
  if(event.request.method!=='GET'||u.origin!==self.location.origin||(u.search&&cacheKey!=='/studio-journey.html')||!ASSETS.includes(cacheKey))return;
  event.respondWith(fetch(event.request).then(async response=>{if(response.ok)await(await caches.open(CACHE)).put(cacheKey,response.clone());return response;}).catch(()=>caches.match(cacheKey)));
});
