# Synera premium variant — local two-pass journey audit

Scope: local loopback server at `http://127.0.0.1:4174/`, with no credentials, external messages, deployment, or provider calls.

## Pass 1 — current journey before the visual change

| Step | Click / expected | Actual | Evidence / verdict |
| --- | --- | --- | --- |
| Landing → login | Open `/`; a real login must not be implied while Auth is absent. | `Вхід ще не підключено`; email/password controls are disabled and the page offers an in-tab draft. | REACHABLE, truthful auth gate. |
| Login availability | Click `Перевірити доступ`; an unavailable service must remain closed. | The local demo configuration has no backend, so the gate remains closed. | REACHABLE, no fake account path. |
| Profile | Click `Спочатку підготувати профіль`; a private local draft should be available. | Profile form opens; visibility is off by default and persistence/discovery still require login. | REACHABLE. |
| Relevant match | Click `Люди`; matching must not appear without a participant session. | Notice: `Увійди, щоб перейти до реальних учасників, зустрічей і налаштувань.` | REACHABLE, correctly auth-gated. |
| Agreement | Reach a reciprocal match and meeting agreement. | BLOCKED_AUTH_LIVE_GATE: no locally configured real account/second participant. No synthetic success was presented as a live agreement. | UNREACHABLE in this checkout configuration. |

## Pass 2 — premium variant and regression checks

| Check | Click / expected | Actual | Screenshot |
| --- | --- | --- | --- |
| Premium landing | Open `/`; premium is calm and legible, not a fake native installer. | New visual hierarchy is active; Android/iPhone/Windows guidance describes browser PWA installation and the HTTPS requirement. | `synera-premium-landing.png` |
| Original design | Click `Початковий`; current pre-existing styling remains available. | `data-design=classic` is applied and `aria-pressed` changes to the selected choice. | `synera-premium-classic-landing.png` |
| Draft profile | Click `Спочатку підготувати профіль`. | Readable focusable controls; consent/visibility are still off by default. | `synera-premium-profile-draft.png` |
| Match gate | Click `Люди` as an anonymous draft. | The profile stays open and the auth-gate notice is shown; no candidate or agreement is fabricated. | `synera-premium-match-auth-gate.png` |

## PWA cache boundary

An older local origin carrying `synera-shell-20260920-v2` served its cached shell after the UI edit. `sw.mjs` is outside this task's owned files, so it was not changed. A release needs its owner to make the matching cache-version/update decision; otherwise existing installed clients can retain a stale UI shell.

## Local verification

- `node --test web_launch/design-switch.test.mjs web_launch/mobile-pilot.test.mjs` — 20 pass, 0 fail.
- `node --check web_launch/pwa.mjs` — pass.
- `node web_launch/build.mjs --demo` — emitted an unpublished 40-file release.
- Headless Playwright used a clean loopback context to capture the four screenshots above; no auth or networked participant data was used.
