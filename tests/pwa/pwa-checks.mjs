// tests/pwa/pwa-checks.mjs — dependency-light static checks for the installable shell.
// Pure functions over file text; no DOM library, no network. Each check returns
// { ok, problems: string[] } so a test can assert on the specific failure reason.
import fs from 'node:fs';
import path from 'node:path';

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4]) : undefined;
};
const tags = (html, tagName) => html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) ?? [];
const headOf = html => (html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i) ?? [, html])[1];

/** Web app manifest: required members for an installable PWA plus Synera invariants. */
export function checkManifest(text, { exists = () => true } = {}) {
  const problems = [];
  let m;
  try { m = JSON.parse(text); } catch (error) { return { ok: false, problems: ['manifest is not valid JSON: ' + error.message] }; }
  if (!m || typeof m !== 'object' || Array.isArray(m)) return { ok: false, problems: ['manifest must be a JSON object'] };
  for (const key of ['name', 'short_name', 'start_url', 'display', 'icons']) if (!(key in m)) problems.push(`manifest.${key} missing`);
  if (typeof m.name === 'string' && !m.name.trim()) problems.push('manifest.name empty');
  if (typeof m.short_name === 'string' && m.short_name.length > 12) problems.push('manifest.short_name longer than 12 characters (truncated on home screens)');
  if (m.display && !['standalone', 'fullscreen', 'minimal-ui'].includes(m.display)) problems.push(`manifest.display "${m.display}" does not open as an app`);
  if (typeof m.start_url === 'string' && /^https?:/i.test(m.start_url)) problems.push('manifest.start_url must be same-origin relative');
  if (typeof m.scope === 'string' && typeof m.start_url === 'string' && !m.start_url.startsWith(m.scope)) problems.push('manifest.start_url outside manifest.scope');
  const icons = Array.isArray(m.icons) ? m.icons : [];
  const sizes = new Set();
  for (const icon of icons) {
    if (!icon || typeof icon.src !== 'string') { problems.push('icon without src'); continue; }
    for (const s of String(icon.sizes ?? '').split(/\s+/)) if (s) sizes.add(s);
    if (!exists(icon.src)) problems.push(`icon file missing: ${icon.src}`);
  }
  if (!sizes.has('192x192')) problems.push('no 192x192 icon (Android install prompt requirement)');
  if (!sizes.has('512x512')) problems.push('no 512x512 icon (splash screen requirement)');
  if (!icons.some(i => /maskable/.test(String(i.purpose ?? '')))) problems.push('no maskable icon (Android adaptive icon falls back to a white square)');
  for (const key of ['theme_color', 'background_color']) if (typeof m[key] === 'string' && !/^#[0-9a-f]{6}$/i.test(m[key])) problems.push(`manifest.${key} is not a 6-digit hex colour`);
  if (typeof m.lang === 'string' && !/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(m.lang)) problems.push(`manifest.lang "${m.lang}" is not a BCP 47 tag`);
  return { ok: problems.length === 0, problems, manifest: m };
}

/** Service-worker registration in the page bootstrap module. */
export function checkServiceWorkerRegistration(moduleSource) {
  const problems = [];
  const register = moduleSource.match(/navigator\.serviceWorker\.register\(\s*(['"])([^'"]+)\1\s*(,\s*\{([^}]*)\})?/);
  if (!register) return { ok: false, problems: ['navigator.serviceWorker.register(...) not called'] };
  if (!/['"]serviceWorker['"]\s+in\s+navigator/.test(moduleSource)) problems.push('registration is not guarded by ("serviceWorker" in navigator)');
  if (!/isSecureContext/.test(moduleSource)) problems.push('registration is not guarded by window.isSecureContext');
  if (!register[2].startsWith('/')) problems.push(`service worker path "${register[2]}" is not root-relative; scope would be narrowed`);
  if (/\.mjs$/.test(register[2]) && !/type\s*:\s*['"]module['"]/.test(register[4] ?? '')) problems.push('a .mjs worker needs { type: "module" }');
  const afterRegister = moduleSource.slice(register.index);
  if (!/\.catch\(/.test(afterRegister)) problems.push('registration promise rejection is unhandled (no .catch)');
  if (/location\.reload\(\)/.test(moduleSource)) problems.push('bootstrap reloads the page on its own; an open draft can be lost on controllerchange');
  return { ok: problems.length === 0, problems, scriptURL: register[2] };
}

/** HTML head: meta viewport, apple-touch-icon, manifest link, theme-color, worker bootstrap. */
export function checkEntryHead(html, { exists = () => true, requireManifestLink = true, requireViewportFit = false } = {}) {
  const problems = [];
  const head = headOf(html);
  const metas = tags(head, 'meta');
  const viewport = metas.map(t => [t, attr(t, 'name')]).find(([, n]) => n?.toLowerCase() === 'viewport')?.[0];
  if (!viewport) problems.push('meta viewport missing');
  else {
    const content = (attr(viewport, 'content') ?? '').toLowerCase().replace(/\s+/g, '');
    if (!/width=device-width/.test(content)) problems.push('viewport lacks width=device-width');
    if (!/initial-scale=1(\b|,|$)/.test(content)) problems.push('viewport lacks initial-scale=1');
    if (/user-scalable=no|maximum-scale=1(\b|,|$)/.test(content)) problems.push('viewport blocks pinch zoom (WCAG 1.4.4)');
    if (requireViewportFit && !/viewport-fit=cover/.test(content)) problems.push('viewport lacks viewport-fit=cover; safe-area insets are zero on notched phones');
  }
  const links = tags(head, 'link').map(t => ({ t, rel: (attr(t, 'rel') ?? '').toLowerCase().split(/\s+/), href: attr(t, 'href') }));
  const apple = links.filter(l => l.rel.includes('apple-touch-icon'));
  if (!apple.length) problems.push('apple-touch-icon link missing (iOS home-screen icon falls back to a page screenshot)');
  for (const l of apple) {
    if (!l.href) problems.push('apple-touch-icon without href');
    else if (!/\.png(\?|$)/i.test(l.href)) problems.push(`apple-touch-icon "${l.href}" is not PNG; iOS ignores SVG/ICO here`);
    else if (!exists(l.href)) problems.push(`apple-touch-icon file missing: ${l.href}`);
  }
  const manifestLink = links.find(l => l.rel.includes('manifest'));
  if (requireManifestLink) {
    if (!manifestLink) problems.push('link rel=manifest missing');
    else if (!manifestLink.href) problems.push('manifest link without href');
    else if (!exists(manifestLink.href)) problems.push(`manifest file missing: ${manifestLink.href}`);
  }
  if (!metas.some(t => attr(t, 'name')?.toLowerCase() === 'theme-color')) problems.push('meta theme-color missing (status bar keeps browser default)');
  if (!/<html\b[^>]*\blang\s*=/i.test(html)) problems.push('html lang attribute missing');
  return { ok: problems.length === 0, problems, manifestHref: manifestLink?.href, appleTouchIcon: apple[0]?.href };
}

/**
 * Runs a service worker script in an isolated context with fake caches/fetch and
 * reports what the fetch handler does while offline. Returns:
 *  - shellCached: the precache list the install step would add
 *  - configOffline: response status/body for /config.json while fetch rejects
 *  - rootOffline: 'cache' | 'none' | 'network' for navigation to '/' while fetch rejects
 */
export async function probeServiceWorkerOffline(swSource, { origin = 'https://synera.test', cachedPaths = null } = {}) {
  const { default: vm } = await import('node:vm');
  const listeners = {};
  const added = [];
  const store = new Map();
  const cache = {
    addAll: async paths => { added.push(...paths); for (const p of paths) store.set(p, new Response('shell:' + p, { status: 200 })); },
    put: async () => {}, keys: async () => [...store.keys()].map(p => new Request(origin + p)),
  };
  const caches = {
    open: async () => cache, keys: async () => [], delete: async () => true,
    match: async request => { const p = new URL(typeof request === 'string' ? request : request.url).pathname; const allow = cachedPaths ?? [...store.keys()]; return allow.includes(p) ? store.get(p) ?? new Response('shell:' + p) : undefined; },
  };
  const self = { addEventListener: (name, fn) => { listeners[name] = fn; }, skipWaiting() {}, clients: { claim: async () => {}, matchAll: async () => [] }, location: { origin }, registration: { showNotification: async () => {} } };
  const offlineFetch = async () => { throw new TypeError('Failed to fetch'); };
  const context = vm.createContext({ self, caches, fetch: offlineFetch, Response, Request, URL, JSON, Promise, console, navigator: {}, clients: self.clients });
  vm.runInContext(swSource, context, { filename: 'sw.mjs' });
  if (listeners.install) { let pending; listeners.install({ waitUntil: p => { pending = p; } }); await pending; }
  const run = async pathname => {
    let out; const event = { request: new Request(origin + pathname, { method: 'GET' }), respondWith: p => { out = p; } };
    listeners.fetch?.(event); if (out === undefined) return undefined;
    try { return await out; } catch { return 'error'; } // a rejected respondWith is a browser error page
  };
  const config = await run('/config.json');
  const root = await run('/');
  return {
    shellCached: added,
    configOffline: config instanceof Response ? { status: config.status, body: await config.clone().text() } : null,
    rootOffline: root instanceof Response ? 'cache' : root === undefined ? 'network' : 'none',
  };
}

export function fileExistsUnder(dir) { return href => fs.existsSync(path.join(dir, href.replace(/^\//, '').split('?')[0])); }
