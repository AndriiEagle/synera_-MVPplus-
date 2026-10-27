# Mobile audit — real product entry pages (static, 2026-10-27)

Branch `cloud/pwa-hardening-20261027`, base `cd94980`. Static reading of the served HTML/CSS only: no device, no browser run, no screenshots. Pixel heights below are computed from the CSS (font-size × line-height + padding + border) and should be confirmed on a phone before anything ships. Contrast ratios are WCAG 2.x relative-luminance ratios computed from the hex values in the files (script in the commit message of this file is not needed; `node -e` with the standard formula reproduces them).

Pages audited, in order of how a real person reaches them:

| Page | Role in the real path | Stylesheets |
|---|---|---|
| `web_launch/index.html` | sign-in, profile, people, meetings (the product) | `tokens.css`, `style.css`, `atelier.css` |
| `web_launch/real-journey.html` | two-person agreement, approvals, invitation, messages | `summit.css`, `atelier.css`, `real-journey.css` |
| `web_launch/get.html` | public access/pricing page that links to the live app | `summit.css` |
| `web_launch/legal.html` | policy and consent text linked from sign-in | `tokens.css`, `style.css` |

Existing automated coverage this audit does not repeat: axe-core run (`web_launch/a11y_audit.md`, 0 violations on index/catalogue), header layout acceptance (`tools/header-layout-acceptance-20261013.mjs`), mobile profile checks in `tests/browser-e2e.spec.mjs`. Those check the DOM and axe rules; none of them measures touch-target height, safe-area insets or font size on the secondary pages, which is what this file covers.

## 1. Touch targets (≥ 44 × 44 CSS px)

What is right already:

- Generic controls on `index.html`: `button { min-height: 44px }` (`web_launch/style.css:1280`), inputs/selects/textareas 48px (`style.css:1313-1317`), workspace tabs 46px (`style.css:1396-1398`), language buttons 44 × 44 incl. mobile (`style.css:1793-1794`, `style.css:1828-1831`), checkbox rows wrapped in a 44px `.check` label under Atelier (`atelier.css:74`).
- `real-journey.html`: every button and `.primary` 44px (`web_launch/real-journey.css:8`, rule `.real-actions button,button,.primary{min-height:44px…}`), language select 44px (`real-journey.css:27`).
- `get.html`: `.primary` 56px (`summit.css:5`), `.small-link` 44px line box (`summit.css:30`), header select 44px (`summit.css:4`).

Findings:

| # | Where | Evidence | Computed size | Severity |
|---|---|---|---|---|
| T1 | Header "Мова і вигляд" disclosure, `index.html` | `style.css:2165` `.header-preferences summary { padding:10px 13px; font-size:13px }`, body line-height 1.5 (`style.css:1022`) | 13 × 1.5 + 20 + 2 = **41.5px** tall; it is the only way to reach language, style and tour on a phone | High |
| T2 | Compact design-preset `<select>` in the same menu | `style.css:2097` `.preset-picker select { min-height:34px; padding:5px }`, mobile `font-size:11px` (`style.css:2098`) | **34px** tall, 102px wide on ≤650px | Medium |
| T3 | Install bar button | `style.css:1065-1069` `.install-bar button { padding:8px 12px; font-size:12px; min-height:40px }` | **40px** (overrides the 44px generic rule) | Medium |
| T4 | Style toggle in the signed-in mobile header grid (Synera style) | `style.css:2113` `padding:8px; font-size:12px` on `#style-toggle` | 12 × 1.45 + 16 + 2 ≈ **35px** when that grid rule applies | Medium |
| T5 | Checkbox inputs themselves | `style.css:1338-1341` `.check input { min-width:20px; min-height:20px }` | 20 × 20; acceptable only because the surrounding label is the hit area — the Current (non-Atelier) `.check` has no `min-height` (`style.css:1334-1337`), so the row height is the text height (~21px) | Medium |
| T6 | Four step chips on `real-journey.html` | `real-journey.css:9` `.real-steps li { padding:8px 6px; font-size:12px; line-height:1.25 }` | 12 × 1.25 + 16 + 2 = **33px**; they are status, not controls (`aria-current="step"`), so fine as long as they never become links | Info |
| T7 | Footer / nav links in `real-journey.html` mast | `real-journey.css:4-5` `.real-mast nav { display:flex; gap:16px }` with plain `<a>` and no min-height | text height only (~24px) | Medium |

## 2. Safe-area insets (notched phones, home indicator)

| # | Where | Evidence | Severity |
|---|---|---|---|
| S1 | `index.html` viewport has **no `viewport-fit=cover`** (`web_launch/index.html:4`), so every `env(safe-area-inset-*)` in `style.css` evaluates to 0 on iPhone: the fixed bottom tab bar (`style.css:2118`, `style.css:3045`), the tour panel (`style.css:2094-2096`) and the signed-in `main` padding all lose their inset. `real-journey.html:4`, `get.html:4`, `studio.html:2`, `rooms.html:2` do set it. | High |
| S2 | `legal.html:2` has neither `viewport-fit=cover` nor a `theme-color`; it is a long reading page without fixed elements, so only the status bar colour is affected. | Low |
| S3 | `real-journey.html` sticky status line `#real-status { position:sticky; top:0 }` (`real-journey.css:17`) has no `env(safe-area-inset-top)`; in standalone mode on iPhone it sits under the clock. The page is not installable today (see PWA below), so this matters only once it is. | Low |
| S4 | The Atelier/night bottom sheet uses `padding-bottom: env(safe-area-inset-bottom)` (`style.css:885`, `style.css:3045`) — correct, but see S1. | — |

## 3. Font sizes (phone readability, iOS auto-zoom on inputs < 16px)

Good: form controls on `index.html` are 16px (`style.css:1317`), so iOS Safari does not zoom on focus; body text 14px with 1.5 line-height.

| # | Where | Evidence | Severity |
|---|---|---|---|
| F1 | Eyebrow on `real-journey.html` and `get.html` on ≤700px: `summit.css:9` `.eyebrow{font-size:8px}`; the base is already 10px (`summit.css:5`). `real-journey.html:14` uses it for "SYNERA / РЕАЛЬНИЙ ПІЛОТ". 8px is below any readable minimum. | High |
| F2 | `summit.css:9` also sets `.micro{font-size:9px}`, floating-card text 8-9px, `.coordinate-* 6-7px`, `.art-label 6px`. These are decorative on `summit.html`; `get.html` inherits `.micro`. | Medium |
| F3 | `index.html` mobile menu select 11px (`style.css:2098`), install-bar button 12px (`style.css:1067`), mobile style toggle 12px (`style.css:2113`), `.eyebrow` 11px (`style.css:1078`), `.fine` 13px (`style.css:1344`). Labels and fine print at 11-13px are tolerable; controls at 11-12px are not. | Medium |
| F4 | `real-journey.html` step chips 12px (`real-journey.css:9`); status line shrinks to .82rem only under `max-height:480px` (`real-journey.css:22`), which is landscape phones — acceptable. | Low |
| F5 | `get.html` `.small-link` 11px on ≤700px (`summit.css:9`) for the Android/iPhone install guides and the demo links. | Medium |
| F6 | Atelier sets `font-size: var(--atelier-body-size)` on inputs (`atelier.css:65`); if that token resolves below 16px, iOS zooms on focus. Not verified here. | Info |

## 4. Contrast (WCAG AA: 4.5:1 text, 3:1 large text and UI boundaries)

Computed from the hex values; the "Synera" style is the default (`html[data-synera-style="synera"]`, `index.html:2`).

| Pair | Where used | Ratio | Verdict |
|---|---|---|---|
| `#426c57` eyebrow on `#f6f5ef` | `style.css:1077-1080` | 5.47 | pass |
| `#667467` `.fine`/`--muted` on `#fffefa` panel | `style.css:12`, `style.css:1343-1346` | 4.89 | pass |
| `#667467` on `#f6f5ef` page bg | same | 4.51 | pass by 0.01 — any lighter muted token fails |
| `#53675d` muted (Synera style) on `#f5f7f4` | `style.css:1017` | 5.62 | pass |
| `#7b8c80` OTP code placeholder on `#fff` | `style.css:1215-1218` | 3.56 | **fail** for the 16px placeholder "000000"; placeholder is the only format hint for the 6-digit code |
| `#aeb4bf` placeholder in the dark Synera variant on `#15161d` | `style.css:1994-1995` | 8.66 | pass |
| `#78836a` eyebrow (early rule) | `style.css:66-69` | 3.66 | overridden by `style.css:1077`; dead rule, not a user-facing fail |
| `#6f8779` control border on `#fff` | `tokens.css:390` | 3.88 | pass (non-text 3:1) |
| `#4e5f50` disabled text on `#e6ebe7` | `tokens.css:391-392` | 5.66 | pass |
| `#fff` on `#254f3b` primary button | `style.css:1292`, `tokens.css` | 9.29 | pass |
| `#b4b8ac` muted on `#101110` (summit/get/real-journey) | `summit.css:3` | 9.37 | pass |
| `#dfc092` gold eyebrow on `#101110` | `summit.css:3` | 10.90 | pass (size is the problem, F1) |
| `#d8d2c6` step chip text on `#101110` | `real-journey.css:9` | 12.57 | pass |
| `#514c42` step chip border on `#101110` | `real-journey.css:9` | 2.22 | **fail** for a UI boundary; the current-step chip switches to `#e7bd87` (10.84) so only the inactive chips are faint |
| `#746e61` language select border on `#101110` | `real-journey.css:27` | 3.74 | pass |
| `#777d89` control border in the dark Synera variant on `#15161d` | `style.css:1941` | 4.36 | pass |
| `#15161d` text on `#e7bd87` gold button (dark variant) | `style.css:1996-1998` | 10.33 | pass |

Atelier palettes (`tokens.css:380-394` and `atelier.css`) were tuned in the earlier N-cycle reviews and carry their ratios in comments; not recomputed here.

## 5. Installability and offline on the secondary pages

Recorded by `tests/pwa/product-entry.test.mjs` (tripwire test) so the gap cannot silently disappear from reports:

- `real-journey.html:1-9`: no `<link rel="manifest">`, no `apple-touch-icon`, no `theme-color`, no service-worker registration, and it is not in the `sw.mjs` precache list (`web_launch/sw.mjs:2-11`). Someone who adds the installed app from `index.html` and then opens the agreement page offline gets the browser error page.
- `legal.html:2`: no `theme-color`, no manifest (acceptable for a document page but it is in the precache list, so it does work offline).
- `get.html`: `apple-touch-icon` present (`get.html:8`), no manifest (it is a marketing page; fine).
- `sw.mjs` has no navigation fallback: a request for any path outside `SHELL` is passed to the network with no cached answer (`sw.mjs:24`). First-visit offline on `/` with a cold cache also has no answer (`sw.mjs:33-34` returns `undefined` when fetch fails and nothing is cached).

## Prioritised fix list

1. **S1 — add `viewport-fit=cover` to `index.html:4`.** One attribute; it turns on every `env(safe-area-inset-*)` already written in `style.css`. Verify the fixed tab bar on an iPhone with a home indicator afterwards. (`tests/pwa/meta-viewport.test.mjs` already checks this with `requireViewportFit`; switch `product-entry.test.mjs` to `requireViewportFit: true` once done.)
2. **F1 — raise `summit.css:9` `.eyebrow` mobile size from 8px to at least 11px** and `.micro` from 9px to 11px. Pure CSS, no layout change; affects `real-journey.html` and `get.html`.
3. **T1 — give `.header-preferences summary` `min-height:44px; display:inline-flex; align-items:center`** (`style.css:2165`). This is the one control every phone user must hit to change language.
4. **Contrast: `#otp-code::placeholder`** (`style.css:1216`) to a token at or above 4.5:1 on white (e.g. `#5c6e62`, 5.45:1). Alternatively put the "000000" hint in the label and drop the placeholder.
5. **T2/T3/T4 — bring the three sub-44px controls to 44px**: `.preset-picker select` (`style.css:2097`), `.install-bar button` (`style.css:1068`), mobile `#style-toggle` (`style.css:2113`). Remove the `min-height` overrides so the generic rules apply.
6. **T5 — `.check { min-height:44px; align-items:center }` in the Current style** (`style.css:1334`), mirroring `atelier.css:74`.
7. **Real-journey installability** — add `manifest`, `apple-touch-icon`, `theme-color` and `pwa.mjs` registration to `real-journey.html`, add the page and its CSS/JS to `SHELL` in `sw.mjs`, and add a navigation fallback (`caches.match('/')` or a dedicated offline page) for uncached navigations. Then delete the tripwire in `tests/pwa/product-entry.test.mjs`.
8. **T7 — `.real-mast nav a { display:inline-flex; min-height:44px; align-items:center }`** (`real-journey.css:5`).
9. **Chip border `#514c42`** (`real-journey.css:9`) to ≥ 3:1 on `#101110` (e.g. `#6e675a`, 3.3:1), or make inactive chips text-only.
10. **F3/F5 — lift 11-12px control text to 13-14px** on the mobile menu select, install bar and `get.html` `.small-link`; keep fine print where it is.

Not done here, on purpose: no CSS was changed on this branch. The owner asked for an audit, and the Current/Atelier invariants in `CLAUDE.md` mean each visual change needs its own browser acceptance. Items 1-4 are each a one-line change and are the ones worth doing first.
