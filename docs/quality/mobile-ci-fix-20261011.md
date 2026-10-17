# Mobile CI diagnosis — 2026-10-11

Base: a6be71a7a55d54c9c9afc5abd383bb09a6805300, codex/synera-product-20261002.
Failed run: https://github.com/AndriiEagle/synera_-MVPplus-/actions/runs/38154350484.

## Root causes and changes

- Secondary destination links occupied 311 px before the intro at 375 px. Move them after the core entry/demo in DOM order; preserve all destinations and use full-width grid placement on desktop. No clipping or hidden content.
- Mobile signed-in header descendant selectors assigned grid-column/grid-row to the language and style controls inside the new preferences grid. This created implicit columns and squeezed the Atelier controls past the viewport (rightmost edge 361.734 px at 320 px). Restrict legacy placement rules to direct header children; let the preferences trigger span the header grid and align to its right edge. This also fixes the negative left edge of the menu at 375 px.
- Keep existing test thresholds intact. Add 320/375 px checks for the entire CTA and bounds of every visible preferences descendant, with screenshots.

## Local evidence

| Viewport | Before CTA Y / bottom | After CTA Y / bottom | Profile document width after |
| --- | --- | --- | --- |
| 375 × 700 | 715.328 / 767.422 | 404.328 / 456.422 | 375 |
| 320 × 700 | 757.219 / 809.313 | 426.719 / 478.813 | 320 |

- CI Node command: 639 passed, 1 skipped, 0 failed (640 total).
- Final complete browser/studio suites including the new regressions: 39/39 passed (47.7 s).
- location-browser-acceptance: pass, all 11 declared checks; simulated Auth/Data/KV and browser GPS, no live provider calls.
- a11y_audit: index and catalogue each zero axe violations; one incomplete rule per page requires human judgment.
- Visual inspection: 320 px profile/preferences screenshot; Chromium geometry checked both viewport sizes before and after.

Environment: Node 24.19.0; locked Playwright 1.63.0; local Chromium 153.0.8010.0 obtained from @sparticuz/chromium outside the repository. Standard browser download returned an invalid archive; system package installation was unavailable. No dependency, lockfile or runner changes are committed. GitHub CI uses its normal Node 22 / Playwright browser installation and remains a separate acceptance result.

Not covered locally: physical Android/iOS, Safari/WebKit, live backend/provider E2E and manual resolution of axe incomplete rules. This patch does not claim those forms of acceptance.
