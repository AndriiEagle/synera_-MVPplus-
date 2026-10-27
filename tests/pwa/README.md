# tests/pwa — offline, dependency-light PWA checks

Run from the repository root:

```sh
node --test tests/pwa/*.test.mjs
```

No browser, no network, no npm packages: `node:test`, `node:vm` and `fetch`-API globals of Node 22 only.

| File | Checks | Fixtures |
|---|---|---|
| `manifest.test.mjs` | required members, 192/512/maskable icons, same-origin `start_url` inside `scope`, hex colours, BCP 47 `lang` | `fixtures/positive`, `fixtures/negative` |
| `sw-registration.test.mjs` | `navigator.serviceWorker.register` guarded by feature + secure context, root-relative module worker, `.catch`, no self-reload | same |
| `offline-fallback.test.mjs` | runs the worker in `node:vm` with failing `fetch`: shell precache, `/` from cache, `/config.json` → 503 `{offline:true}` | same |
| `meta-viewport.test.mjs` | `width=device-width`, `initial-scale=1`, zoom not blocked, `viewport-fit=cover`, theme-color, `lang` | same |
| `apple-touch-icon.test.mjs` | PNG icon linked and present on disk | same |
| `product-entry.test.mjs` | the same checks on the shipped `web_launch/index.html`, `manifest.webmanifest`, `pwa.mjs`, `sw.mjs`; dead-path guard against `assets.mjs`; tripwire for the secondary pages that are not installable yet | real files |

`pwa-checks.mjs` holds the pure check functions. A green fixture run proves nothing about the product on its own; `product-entry.test.mjs` is the one that exercises the served files, and `audit/mobile-audit.md` explains the recorded gaps.
