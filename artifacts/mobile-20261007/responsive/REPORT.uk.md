# 93. Мобільний аудит Synera — 07.10.2026

**LOCAL_CSS_FIXES_ACCEPTED_CATALOGUE_FINDINGS.** Виправлення прийняті локально; каталог компонентів має окремі залишкові знахідки. Фізичний Android/iPhone і live backend не прийняті.

Source chat: 01a115a3-30cc-7bb3-9d9e-e64684e62b5c. Parent: 01a0a673-47c0-74d1-a768-7867f3dca2bc. Branch codex/synera-product-20261002, starting a284a1eda34a85b658cf03ec2dd3a1fbfcb2cad8. No commit/push/deploy/install/provider calls. Parent owns integration.

## Прийняті зміни

- triangle.css: static heading in stacked Studio layout stops covering form controls at 844x390; text wrapping and growing mast preserve navigation at 200% text.
- real-journey.css: mast grows/wraps instead of clipping profile/demo/archive links with enlarged text.
- style.css: introduction heading wraps oversized words instead of expanding the viewport to 458px at 390px width.
- summit.css: **append-only presentation-specific rules**, selected by body:has(>main>.hero). Mast grows and text wraps. Access/pricing page excluded. Exact preceding bytes, including pricing changes, preserved; PREFIX_PROOF.json proves restoration after CRLF normalization and semantic equality. No HTML/JS/manifest/price changes by this chat.

Protected journey-ui.mjs unchanged: 68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b. No preferences/defaults changed; fresh Current contexts and explicit Atelier opt-in were tested.

## Докази

| Artifact | Result |
|---|---|
| red-reviewed/matrix.json | 16 rows, 27 reproduced geometric failures, no harness failures |
| green-targeted/matrix.json | 16 rows, 0 findings, 0 harness failures |
| full-reviewed/matrix.json | 180 rows, 0 harness failures, 441 raw findings |
| red-extra/matrix.json | Index/Summit large-text failures before final narrow repair |
| green-extra-final/matrix.json | 12 affected-subset rows on **final source bytes**, 0 findings, 0 harness failures |
| mutation-reviewed/matrix.json | 14 rows, 26 failures reintroduced by serving prior CSS; canonical files untouched |
| ACCEPTANCE.json | Assertions, source drift/supersession, 324 SHA256 entries, final protected hash |

Full matrix: 320,360,375,390,412,430,768 x 844; landscape 844x390; 390x844 with computed font sizes doubled; dedicated reduced motion; Atelier at 320x844 and 844x390. 11 allowlisted public HTML pages and four synthetic real-journey states per configuration. One C: Chrome browser at a time, sequential contexts, external requests blocked, service workers blocked.

All 12 synthetic journeys completed with **2 separate approvals, accepted invitation, 1 stored message** and exact transcript readback. Actual client and handleNeon ran against existing in-memory Auth/Data fixtures. This does not execute PostgreSQL/RLS/live JWT and does not establish real-user acceptance.

Action checks scroll each visible enabled action, inspect clipping and hit testing, and account for wrapped inline link fragments; screenshots accompany all rows. Real clicks exercise terms, approvals, invitation acceptance and messaging. Large text is a local computed-font stress test, not OS/browser zoom; dynamically replaced markup can inherit scaling differently. No claim of comprehensive WCAG/keyboard/soft-keyboard acceptance.

Full matrix used final triangle.css/real-journey.css bytes. The later style.css/Summit fix supersedes only affected evidence with green-extra-final (index, Summit and access page at 320, landscape, large text, Atelier 320). Unchanged full matrix was not rerun. Recorded source drift: style.css, summit.css. Final CSS hashes are independently asserted against their applicable matrix; no stale source is called accepted.

## Visual review and remaining boundary

Reviewed actual before/after PNGs, including landscape Studio obstruction, large-text real-journey header, narrow private conversation, Atelier entry, and large-text index/Summit. Before: title visibly painted over form; navigation clipped at page top. After: form is unobstructed, header grows, long text remains readable vertically. This is representative visual inspection, not human review of every screenshot.

Remaining 12 rows are **catalogue.html only**. Its public component catalogue includes demonstration/inactive states and inline styles incompatible with the local server's style-src self CSP. Raw counts are not independent confirmed product defects. Parent should repair/reclassify this HTML/catalogue surface separately; no CSP weakening performed. Index/Summit findings in the earlier full matrix are superseded by green-extra-final.

WebKit not run: default Playwright cache redirects to unavailable D:, earlier probe found no executable, and no C: WebKit was selected. No installs. Physical Android/iPhone, standalone installation, OS text settings, keyboard occlusion and live two-user/backend gates remain open. Parent's installation tests are separate evidence and are not counted here.

## Runtime recovery and finite reviews

Initial interrupted work is preserved in HOST_BLOCKED_HISTORY.uk.md and baseline/diagnostic directories; not accepted as final evidence. Parent diagnosed D: cache redirection. All final runs use explicit C:/Program Files/Google/Chrome/Application/chrome.exe and process-local TMP/TEMP/TMPDIR C:/Users/Andrii/.codex/tmp/synera-mobile-responsive; target lstat checks reject symlinks. Browser.getBrowserCommandLine with --enable-automation confirmed the isolated C: test profile in the final subset and mutation receipts. User profile and persistent system environment untouched.

One initial CDP profile probe failed before page work (red-extra/LAUNCH_FAILURE.json); it was repaired by explicit --enable-automation. Earlier completed runners retained app-import timers; finite runner now exits after browser close and server kill request. Old D:-blocked read sessions 4106/55823 were sent interrupts but termination was not confirmed; no unknown PID was killed.

Finite review 1: inspected actual 14-line primary CSS diff and removed false-positive test interpretations (onboarding background / inline-link rectangle). Finite review 2: served original CSS without touching canonical source; semantic guard again failed on covered Studio controls, clipped real navigation, oversized index and Summit navigation. Later exact-prefix check detected CRLF normalization, restored original bytes and reran only affected subset. No optional polishing after acceptance.

## Reproduction (cmd.exe, login:false, checkout root)

1. node tools/mobile-responsive-matrix-20261007.mjs --phase=full-rerun
2. node tools/mobile-responsive-matrix-20261007.mjs --phase=affected-rerun --sizes=320,landscape,large-text,atelier-320 --pages=index.html,summit.html,get.html
3. node tools/mobile-responsive-matrix-20261007.mjs --phase=mutation-rerun --sizes=landscape,large-text --pages=index.html,summit.html,get.html,studio.html,studio-journey.html,real-journey.html,outcome-archive.html --mutation=all
4. node tools/mobile-responsive-closeout-20261007.mjs

Full runner intentionally returns nonzero for catalogue findings; mutation intentionally returns nonzero. Read JSON, do not relabel exit alone. Closeout verifies the named preserved original proof directories.

## Files for parent integration

- web_launch/triangle.css — 33757c558fe7cec6dcca6976636926791da6c7961bda66cc8b653c7ddc76a15a
- web_launch/real-journey.css — d5590b6e11236c279436825dd9f2f33cf3293843c11e08604498751ff94a1298
- web_launch/style.css — 71969391de4b29c88c097b47caf6e44a6a38d7362accd5a4aeecaaf7c1d7cb3c
- web_launch/summit.css — e584c375af0779a6090753a6778864200469af2f0fc73ca5f59d1a17024dfe1f

Tools: tools/mobile-responsive-matrix-20261007.mjs; tools/mobile-responsive-results-20261007.mjs; tools/mobile-responsive-closeout-20261007.mjs. Artifacts: this directory (including preserved before CSS and failed/historical evidence). Full source and PNG hashes: ACCEPTANCE.json. Parent should stage Summit together with the pricing owner's accepted change, preserving its exact original prefix.

**NEXT (10–20 min):** parent reviews the four CSS diffs and ACCEPTANCE.json, stages only agreed source/tools/evidence, and keeps catalogue/WebKit/physical-device gates explicit in integration.

Models used: none (provider calls=0, USD=$0.00).
