# Product path check — sign-in → match → calendar slot → quota counter (2026-10-27)

Branch `cloud/pwa-hardening-20261027`, base `cd94980`. Static trace through the served code; nothing was run against Neon. "Covered" below means a test exercises that exact function or SQL rule; a green suite elsewhere does not count (CLAUDE.md: a green suite once hid a dead UI path).

## The path as the code actually runs it

### 0. Reaching the sign-in form

1. `web_launch/index.html` loads `app.mjs`; `app.mjs` fetches `/config.json` (served by `server.mjs:45` locally, `neon/worker.mjs:286` live) and reads `backend`, `registrationEnabled`, `realPilotEnabled`, `googleOAuthEnabled`.
2. `applyAuthState` (`app.mjs:134-144`) decides which controls the person sees: OTP field, Google button, password field. With `backend === 'neon'` the password path is hidden and the form is a 3-step OTP flow.

### 1. Sign-in

| Hop | Code | Server side |
|---|---|---|
| Submit with no code yet | `app.mjs:576-578` `#auth-form` submit → `requestLoginCode()` (`app.mjs:565-569`) | — |
| Consent before any request | `requestPolicy(sendLoginCode)` opens `#policy-dialog`; `#policy-form` submit builds `consentRecord` (`app.mjs:555`) | — |
| OTP request | `sendLoginCode` (`app.mjs:558-564`) → `NeonStore.requestOtp` (`neon-store.mjs:101-105`) → `POST /api/neon/otp/request` | `worker.mjs` → Neon Auth; invited-email and consent checks |
| OTP verify | `app.mjs:579` → `NeonStore.verifyOtp` (`neon-store.mjs:106-111`) → `POST /api/neon/otp/verify` | HttpOnly cookie session; JWT never reaches the browser |
| Pilot gate | `finishOnlineSignIn` (`app.mjs:543-550`): if `!config.realPilotEnabled || !store.pilotSafetyEnabled` → `signOut()` and a Ukrainian error | — |
| Policy on record | `hasPolicy` / `acceptPolicy` (`profile-store.mjs:80-89`) → `/rest/v1/pilot_consents` | RLS on `pilot_consents` |
| Load workspace | `load({profile:true})` → `ownProfile` (`profile-store.mjs:91`), `discover` (`:106`), `meetings` (`:110`) | `/rest/v1/profiles`, `/rest/v1/meeting_requests` through `worker.mjs:266` data proxy |
| Alternatives | password `signIn` (`online-store.mjs:66`, non-Neon backends only), Google (`neon-store.mjs:112`), session `restore` (`neon-store.mjs:94`, `app.mjs:940`) | `worker.mjs:117` OAuth callback |

### 2. Match

1. `discover` returns up to 50 discoverable profiles ordered by id (`profile-store.mjs:106-109`); "Ще 50 профілів" pages by offset (`app.mjs:588`).
2. `renderPeople` (`app.mjs:400-470`) computes `compareRealProfiles(own, person)` for every row (`app.mjs:408`) → `profile-brief.mjs:75` → `compareProfiles` (`matching.mjs:231`) → `evaluateAlgorithmicMatch` (`matching.mjs:132`).
3. **M06 freshness is on the path**: `matching.mjs:106-120` weights each need by `calculateNeedFreshness(receiverDate, asOfDate)`; `asOf` defaults to today (`matching.mjs:132`), and `app.mjs` passes no `asOf`.
4. **M07 b-matching quotas are not on the path**: `evaluateCohortMatches` (`matching.mjs:283-306`) is the only caller of `solveBMatching`, and nothing in `app.mjs`, `real-journey.mjs` or `neon/worker.mjs` calls `evaluateCohortMatches`. `DEFAULT_QUOTA_PER_USER = 2` (`b-matching.mjs:4`) limits nothing a person experiences.
5. Rows are filtered by the reciprocal toggle and the search box, then sorted by status priority and id (`app.mjs:410-412`); status counts feed the empty-state explanation (`app.mjs:422-431`).
6. The invite button is disabled until `comparison.status === 'review_candidate'` and the comparison consent is on (`app.mjs:454-466`).
7. Server-side introduction gate: an invitation row can only be inserted when an open `match_cases` row exists with both parties' current approvals (`supabase/case-state.proposal.sql:250-256`, restrictive policy `meetings_need_approved_case`). The case and approvals are written from `real-journey.html` via `saveCaseState` (`profile-store.mjs:177`, `/rest/v1/match_cases`, `/rest/v1/match_case_approvals`). So the real path crosses from `index.html` to `real-journey.html` and back before a slot can be proposed.

### 3. Calendar slot

| Hop | Code | Notes |
|---|---|---|
| Open the dialog | `openInvite` (`app.mjs:221-226`): requires an own saved profile; prefills the note from `collaborationDraft`; clears `#invite-time` | — |
| Pick a time | `index.html:52` `<input id="invite-time" type="datetime-local" required>`; duration `#invite-duration` (20/30/60); place `#invite-place` | no `min`, no `step`, no timezone shown |
| Validate and send | `profile-store.mjs:114-123`: note ≤ 500 chars, time in the next 90 days, duration in {20,30,60}, place in a fixed list; `new Date(plan.proposed_at).toISOString()` | **the `datetime-local` string is interpreted in the device's timezone, not Europe/Zurich** — a sender in another zone proposes a different instant than the one they typed |
| Insert | `POST /rest/v1/meeting_requests` | triggers `meeting_names` (`real-pilot.proposal.sql:121`), `invitations_rate` (`:206`), policy `meetings_need_approved_case` |
| Recipient answers | `respond(id, status)` (`profile-store.mjs:125-130`) PATCH `status=eq.pending`; buttons at `app.mjs:498` | `neon/meeting-status-guard.migration.sql` stops the sender from accepting their own invitation (CLAUDE.md) |
| Sender cancels | `cancelMeeting` (`profile-store.mjs:132-136`) | — |
| Display | `when()` (`app.mjs:483`) formats `proposed_at` with `uk-UA` in the **device** zone and appends `Intl.DateTimeFormat().resolvedOptions().timeZone` (`app.mjs:496`); the DE/EN overlay re-renders dates (`index-i18n.mjs`) | de-CH/fr-CH/it-CH formats are not produced anywhere on this path; `web_launch/i18n-ch.mjs` (this branch) is not wired in |
| Export | "До календаря" → `meetingCalendar` (`app.mjs:502`, `calendar.mjs:13-21`) only for `accepted` meetings with `proposed_at`; UTC `DTSTART`/`DTEND` | correct instants regardless of zone; no `TZID`, so a reader's calendar converts |

### 4. Quota counter

There are two counters, and the person sees only one:

1. **UI counter**: `#meeting-count` = number of meetings with `status === 'pending'` (`app.mjs:490`), shown in the "Зустрічі" tab badge. It is a pending-requests count, not a quota.
2. **Server quota**: `synera_write_limits` per user, rolling 24-hour window, 20 invitations / 100 messages / reports (`supabase/real-pilot.proposal.sql:183-208`, trigger `invitations_rate` before insert on `meeting_requests`; the same bucket is reused by group rooms, `supabase/group-room.proposal.sql:105-118`). Exceeding it raises SQLSTATE `PT429`, which PostgREST returns as HTTP 429; the client maps 429 to the generic "Забагато спроб. Зачекай кілька хвилин перед наступною." (`profile-store.mjs:59`). There is **no read endpoint** for the remaining allowance, so the UI cannot show "17 of 20 invitations left"; the first signal a person gets is the 21st attempt failing with a message that says "a few minutes" when the window is a day.
3. The M12 "counters" in V6 (`plan/v6/TASKS.json` V6-11, `economics.mjs`) are funnel counters for analytics, not something on this user path.

## Where tests do not cover the path

Legend: **Unit** = `node --test web_launch/*.test.mjs neon/*.test.mjs`; **SQL** = disposable PostgreSQL acceptance (`neon/local_acceptance.test.mjs`, `tools/*-sql-acceptance.mjs`); **Browser** = Playwright specs and `tools/*-browser*.mjs` (synthetic fixtures, no live JWT).

| # | Place on the path | What exists | Gap |
|---|---|---|---|
| G1 | `#auth-form` submit → `requestLoginCode` → policy dialog → `sendLoginCode` → `verifyOtp` → `finishOnlineSignIn` (`app.mjs:543-582`) | `app.behavioral.test.mjs` only asserts the submit listener exists; `neon/worker.test.mjs` covers the OTP endpoints and cookies server-side; `neon-store.test.mjs` covers Google start only | **No test drives the client OTP flow end to end.** The three-step state machine (`otpEmail`, `otpConsent`, `#change-otp-email`, resend) is untested; a regression that skips `verifyOtp` or loses `otpConsent` would pass the suite. |
| G2 | Pilot gate in `finishOnlineSignIn` (`app.mjs:544`) | nothing | A misconfigured `realPilotEnabled` signs the person out with a message; no test proves `signOut` is called or that the error text is Ukrainian/translated. |
| G3 | `hasPolicy` / `acceptPolicy` (`profile-store.mjs:80-89`) | `real-pilot.test.mjs` "online real-user writes derive ownership and whitelist …" covers write shapes; SQL acceptance covers `pilot_consents` RLS | The branch where `hasPolicy()` is false **and** `accepted` is null (session restore for a user who never accepted the current `POLICY_VERSION`) opens the dialog and returns without loading; untested. |
| G4 | `renderPeople` filters, sort, status counts, invite-button enablement (`app.mjs:400-470`) | `matching.test.mjs` covers `compareProfiles`; `tools/people-gate-browser.mjs` covers the draft-terms card | No test renders the people list with a mixed set of statuses and asserts order, the reciprocal filter, the search, the empty-state counts, or that the invite button is disabled for non-candidates. |
| G5 | M06 freshness on the live list | `matching.test.mjs` "M06 freshness decays…" (unit, explicit `asOf`) | `app.mjs` passes no `asOf`; the list changes with the wall clock and no test pins a date to prove the product list reflects freshness or that a stale need drops out. |
| G6 | M07 quotas | `b-matching.test.mjs` (4 solver tests), `matching.test.mjs` "M07 limits (cohort matching)…" | **Design gap, not only a test gap**: the solver is proven but no product code calls it, so the quota the plan describes does not exist for a person. A test that asserts `evaluateCohortMatches` is reachable from `app.mjs` would fail today. |
| G7 | Introduction gate `meetings_need_approved_case` (`case-state.proposal.sql:250`) | `neon/local_acceptance.test.mjs` (SQL), `tools/invitation-acceptance-browser.mjs` (synthetic fixture) | The browser proof uses a fixture, not two signed JWT sessions (CLAUDE.md: live two-account acceptance still open). The `index.html` invite button has no test that it fails gracefully when the case is missing (server 403 → message). |
| G8 | `datetime-local` → `toISOString()` (`profile-store.mjs:120`) | `real-pilot.test.mjs` whitelist test covers the body shape | No test with a non-Zurich device timezone; no test across the 2026-03-29 / 2026-10-25 DST switch (`tests/i18n_ch/date-time.test.mjs` on this branch proves the helper, not the product); no test that a time 91 days out or in the past is refused at the UI level before the request. |
| G9 | `respond` / `cancelMeeting` client (`profile-store.mjs:125-136`) | SQL: `tools/meeting-status-guard-sql-acceptance.mjs`, `neon/meeting-status-cleanup.test.mjs` | The client's `rows.length !== 1` → "Запит недоступний" branch (race: already answered) is not unit-tested; the two buttons at `app.mjs:498` are not driven in a browser test. |
| G10 | `#meeting-count` pending badge (`app.mjs:490`) | nothing | No test; a badge that counts accepted or cancelled meetings would pass. |
| G11 | `synera_limit_writes` 20/day (`real-pilot.proposal.sql:183-208`) | `supabase/real-pilot.acceptance.sql`, `neon/acceptance.sql`, `neon/stack-invariants.acceptance.sql` (SQL) | Client side: no test that the 21st invitation shows the 429 message; the message text ("кілька хвилин") contradicts the 24-hour window and no test pins either. No endpoint and no test for a remaining-allowance readback. |
| G12 | ICS button wiring (`app.mjs:502`) and `download()` | `calendar.mjs` has exact ICS tests (`behaviors-core.test.mjs`, `real-pilot.test.mjs`) | The condition "only accepted with `proposed_at`" and the actual download call are not tested in a DOM. |
| G13 | Date rendering `when()` (`app.mjs:483,496`) | `tools/index-language-browser.mjs` touches dates in the overlay | Device-zone display with the zone name appended is untested; no de-CH/fr-CH/it-CH expectation exists anywhere on the path. |
| G14 | Offline on the signed-in path | `tools/offline-shell-acceptance.mjs` (cold `/` + profile action), `tests/pwa/*` (this branch, static + vm) | No test opens the meetings tab offline, or asserts what `load()` does when `/config.json` returns the worker's 503 `{offline:true}` (`sw.mjs:15-18`); `real-journey.html` is not precached at all (see `audit/mobile-audit.md` §5). |
| G15 | Whole path in one run | `e2e-neon-flow.test.mjs` "complete scripted E2E lifecycle" | Despite its name it calls only `discover` and `restore` on `NeonStore` with a mocked fetch and exercises case logic from `business-case.mjs`; it never signs in, never invites, never responds and never counts. It should not be cited as path coverage. |

## What would close the biggest gaps (in order)

1. **Client OTP flow test (G1, G2, G3)**: a `node:test` using the same `vm`/fake-DOM harness as `pwa-mobile.test.mjs`, with a stub `NeonStore` recording `requestOtp`/`verifyOtp`/`acceptPolicy`/`signOut` calls; assert the three steps, consent-before-request, resend, change-email, and the pilot gate.
2. **People list rendering test (G4, G5, G10)**: render `renderPeople`/`renderMeetings` with fixed `asOf` and a mixed fixture; assert order, filters, invite-button state and the pending badge.
3. **Slot timezone test (G8, G13)**: run `profile-store.invite` under `TZ=America/New_York` and `TZ=Europe/Zurich` and assert the stored instant; then decide whether the product should pin Europe/Zurich (the helper on this branch gives the formatting half).
4. **Quota message test (G11)**: stub a 429 from the data proxy and assert the user message; fix the text to say the window is a day. Consider a read-only `synera_write_limits` view so the UI can show the allowance.
5. **Decide M07 (G6)**: either wire `evaluateCohortMatches` into `renderPeople` behind the existing reciprocal toggle, or mark V6-10 as "solver only" in `plan/v6/TASKS.json` so the plan stops implying a product quota.
6. **Rename or extend `e2e-neon-flow.test.mjs` (G15)** so its name matches what it proves.
