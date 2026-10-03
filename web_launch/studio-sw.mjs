// Dedicated narrower scope /studio keeps the existing application worker intact.
const CACHE='synera-studio-20261003-v4';
const ASSETS=['/studio.html','/studio.css','/studio.mjs','/studio-journey.html','/journey.css','/journey-ui.mjs','/journey-core.mjs','/journey-ai-client.mjs','/journey-handoff.mjs','/studio-install.mjs','/studio.webmanifest','/session-value.mjs','/declared-fit.mjs','/group-logistics.mjs','/archive-codec.mjs','/summit.css','/triangle.css','/icon-192.png','/icon-512.png','/apple-touch-icon.png','/montserrat-400.woff2','/montserrat-500.woff2','/atelier.css','/atelier.mjs','/tokens.css'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('synera-studio-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);
  // The public host redirects .html to a clean URL. Both routes use the same public shell.
  const cacheKey=['/studio','/studio/'].includes(u.pathname)?'/studio.html':['/studio-journey','/studio-journey/'].includes(u.pathname)?'/studio-journey.html':u.pathname;
  if(event.request.method!=='GET'||u.origin!==self.location.origin||(u.search&&cacheKey!=='/studio-journey.html')||!ASSETS.includes(cacheKey))return;
  event.respondWith(fetch(event.request).then(async response=>{if(response.ok)await(await caches.open(CACHE)).put(cacheKey,response.clone());return response;}).catch(()=>caches.match(cacheKey)));
});
