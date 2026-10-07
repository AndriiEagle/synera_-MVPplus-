# 93. Мобільний аудит Synera — 07.10.2026

**PARTIAL / HOST_EXECUTION_BLOCKED. Не mobile acceptance і не GREEN.**

Source chat: `01a115a3-30cc-7bb3-9d9e-e64684e62b5c`, title `93. Мобільний аудит Synera — 07.10.2026`.
Parent: `01a0a673-47c0-74d1-a768-7867f3dca2bc`. Parent requested finite closeout after system-wide command hangs; no duplicate tests were launched after that instruction.

## Межі та зміни

- Checkout verified: `C:/Users/Andrii/Desktop/synera-premium-pwa-variant`, branch `codex/synera-product-20261002`, starting HEAD `a284a1eda34a85b658cf03ec2dd3a1fbfcb2cad8`.
- **No product CSS/HTML/JS/manifest edits made by this chat.** No commit, push, deployment, install, external message, secret access or provider call.
- Added `tools/mobile-responsive-matrix-20261007.mjs` and files only under this report's directory. Existing synthetic transport fixture reused unchanged.
- Initial protected `web_launch/journey-ui.mjs` SHA256 matched `68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b`; this chat did not modify it. Final readback remains pending because host commands stalled.
- Parent's concurrent `product-access.mjs` and `pwa.mjs` changes were observed and preserved. No shared task-log mutation; parent can append the consolidated result.

## Executed evidence

`baseline/matrix.json` completed and was read back: 30 rows, 98 raw findings, 12 harness failures. These findings are **not 98 confirmed defects**. The 12 failures are the rejected inline stylesheet used by the initial large-text harness; production CSP was not weakened. Baseline covers 320x844 and 844x390, 11 allowlisted HTML pages plus four synthetic real-journey states at each size. The initial harness incorrectly counted onboarding-covered background, deliberately noninteractive catalogue controls and some wrapped inline-link centers.

`diagnostic2/` contains a second run using installed Google Chrome, real dismissal of onboarding and DOM computed-font doubling (200% text stress, not OS text sizing). Runtime output reached **45 rows**: 11 public pages + editor/review/invite/chat at each of 320x844, 844x390 and 390x844 with doubled text. **No final process exit or completed browser close was observed.** Its JSON was checkpointed after earlier sizes; the last checkpoint/final summary must be read back before relying on all rows as durable evidence.

The synthetic journey used actual page clicks, current client and `handleNeon` with in-memory Auth/Data fixtures: select peer → fill/save terms → separate approvals as A and B → invitation → recipient accepts → private message sent and transcript exact-text assertion. All four journey states emitted at all three diagnostic sizes; this is not live JWT, PostgreSQL, two real users, physical mobile or installed PWA evidence.

Inspected actual PNGs:

- `baseline/chromium-320-index.png`: initial tour blocks the background by design; this explained early false positives.
- `baseline/chromium-landscape-studio.png`: rendered Studio structure and stacked heading/form reviewed. Full-page capture alone does not show the scrolling overlap.
- `diagnostic2/chromium-large-text-real-journey.png`: **confirmed visually** that the enlarged header's “Вхід і профіль” / “Демо” overlaps the wordmark and is clipped at the top. This is meaningful navigation loss despite no horizontal document overflow.

## Findings and next narrow repairs

1. **P2, confirmed visual defect — large text navigation in real journey.** At 390x844 with computed text sizes doubled, the `.real-mast` header retains inherited fixed mast height and cannot accommodate the wordmark and nav. Candidate CSS repair: let `.real-mast` grow and wrap with adequate spacing; `real-journey.css` owns this surface. Do not hide overflow or shrink the user's text. Reproduce and save a dedicated semantic RED before editing, then assert both links are independently hit-testable and readable.
2. **P2, repeated geometric defect — landscape Studio forms.** At 844x390, both baseline and diagnostic2 reported 8 obstructed actions on `studio.html` and 7 on `studio-journey.html`, including the give/need/language controls and submit. Source inspection found inherited `.section-heading` sticky positioning from `summit.css` while `.studio` renders heading above forms. **Likely cause, not yet independently confirmed by an obstruction viewport screenshot or Playwright click failure.** Candidate repair in owned `triangle.css`: scope static heading placement to the stacked Studio layout, preserving Summit behavior. No fix applied.
3. Large-text diagnostics also emitted raw findings for index (1), summit (2), triangle (2), studio (2), studio-journey (4), real-journey (1), outcome-archive (1), legal (2), and real-journey states (editor 2 / review 1 / invite 2 / chat 1). Treat as **triage**, not accepted defects; the older per-action checker still has wrapped-link/scroll timing limitations.
4. `catalogue.html` embeds inline CSS while the local server uses `style-src 'self'`; its demonstration states and overlays generated 36–37 raw obstruction findings. This page is a public allowlisted component catalogue, not a normal user workflow. Parent should review the HTML/CSP mismatch separately; no global CSP weakening or HTML edit performed.

## Harness state and finite review

Current runner includes all requested widths (320,360,375,390,412,430,768), landscape 844x390, 200% computed text stress, reduced motion and two explicit Atelier opt-in samples. Fresh contexts preserve Current default. It blocks nonlocal network traffic and service workers; one browser, contexts sequentially. WebKit executable was absent: **NOT_INSTALLED**, no installation attempted.

After inspecting the early results, the test was narrowed to improve the oracle: bulk DOM action hit tests, wrapped-inline fragment centers, skip disabled/inert controls, first-obstruction viewport screenshots, 10-second action timeout. **These last runner edits have not been executed end-to-end** because the host stalled. Thus the current runner is a reviewable test candidate, not an accepted regression suite. No CSS mutation test ran; no CSS change is claimed accepted. The finite review found harness false positives and preserved all earlier evidence rather than converting them to product failures.

Required requested matrix dimensions **still unexecuted**: 360,375,390 normal,412,430,768, dedicated reduced-motion and explicit Atelier samples. No keyboard traversal acceptance, WebKit, physical Android/iPhone, soft keyboard, real OS large text, installed standalone PWA or live backend acceptance.

## Host blocker and owned process reconciliation

The first retry (`diagnostic`) stalled with an empty log before any page result. Its exact owned node PIDs `99628` (runner) and `95008` (child local server) were identified and stopped with `Stop-Process -Id 99628,95008`. No unrelated processes were terminated. Switching from cached Chromium to installed Chrome allowed diagnostic2 to render and exercise all three diagnostic sizes.

Later, both browser close and unrelated narrow read commands stopped returning. Last supported polling still reported running without output:

- exec session `63328`: diagnostic2 runner, after `large-text/journey-chat` result;
- exec session `55823`: read-only Node JSON inspection;
- exec session `4106`: read-only PowerShell JSON inspection.

Closeout interrupt of session `63328` returned **exit_code=1** with no final acceptance output. The runner is no longer reported running by that session; child browser/server cleanup is not independently confirmed. Interrupts were requested for read-only sessions `4106` and `55823`; both still returned their session IDs without output, so termination remains unconfirmed. Exact diagnostic2 OS PIDs were not obtained. Do not kill arbitrary Node/Chrome processes or launch a duplicate audit. Root cause is **unknown**. Low available RAM was reported by parent; no causal memory diagnosis or repair was established here.

Canonical serious-preflight returned `NEEDS_REVIEW`, `MANIFEST_SHA256_MISMATCH`, `NEEDS_SCOPE` and dispatch disabled. Direct source inspection was used; no cache rebuild/repin or hosted calls. No subscription savings claimed.

## Exact commands after host recovery

Run from the verified checkout. First reconcile pending processes and read `diagnostic2/matrix.json`. Current runner changed since diagnostic2, so preserve existing artifact directories.

```powershell
$env:MOBILE_PHASE='red-reviewed'
$env:MOBILE_SIZES='landscape,large-text'
$env:MOBILE_PAGES='studio.html,studio-journey.html,real-journey.html,outcome-archive.html,journey'
node tools/mobile-responsive-matrix-20261007.mjs
```

Inspect obstruction PNGs, save a semantic failure for each proposed change, make only owned CSS changes, and rerun the same sample. Then the complete matrix:

```powershell
Remove-Item Env:MOBILE_SIZES -ErrorAction SilentlyContinue
Remove-Item Env:MOBILE_PAGES -ErrorAction SilentlyContinue
$env:MOBILE_PHASE='full-reviewed'
node tools/mobile-responsive-matrix-20261007.mjs
```

Do not treat runner exit as artistic or physical-device acceptance. Read back JSON, screenshots, source drift and protected-file hash; inspect visual meaning, classify catalogue-only findings separately, and prove a regression guard fails when the narrow CSS repair is removed in a served-only mutation.

**NEXT (10–20 min):** once host execution is restored, parent reconciles the three pending sessions and runs only the targeted `red-reviewed` command above. Then decide the two narrow CSS repairs from fresh evidence.

Models used: none (provider calls=0, USD=$0.00).
