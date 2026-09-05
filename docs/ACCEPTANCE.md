# Demo acceptance checklist

No item in this document is passed merely because a page or dependency exists. Use two synthetic users A/B and an anonymous client. Record app commit, platform/toolchain, environment alias, result, and redacted evidence for every check.

## Current browser / Supabase results

2026-09-05 update: **45/45 Node tests PASS**, both 25-file static builds PASS, mobile viewport shows 10 demo bots without horizontal overflow, and the synthetic invite → next hour → accepted journey plus opt-in OSM tiles and GPT import preview passed browser smoke. Unsaved imported fields survive a simulation tick. [Full mobile evidence and launch gates](MOBILE_PILOT.uk.md). Device installation, live signup/recovery/consent, the new SQL proposal and API-driven bots remain NOT ACCEPTED. Auth gateway was rechecked and remains HTTP 402; read-only database counts are zero.

| Check | Result on 2026-09-04 |
| --- | --- |
| Dedicated project and schema | Applied; creation quote $0/month |
| SQL owner/participant isolation and column grants | PASS on the new database; synthetic fixtures rolled back |
| Fixture persistence after SQL test | Zero Auth users, profiles and requests |
| Supabase security/performance advisors | Zero findings |
| Local browser/REST adapter tests | 9/9 PASS; adapter responses mocked |
| Collaboration, economics, profile portability and HTTP tests | 24/24 PASS; total 33/33 with adapter tests |
| Matching role-order test | 64 combinations PASS; not a fairness or LLM benchmark |
| Local business-profile laboratory | Browser comparison, consent revocation, approval reset, swap and pricing interaction PASS; [details](meeting-gilbert/VALIDATION.md) |
| Configured browser unavailable state | PASS: clear message, disabled login, explicit demo button |
| Synthetic A → B / C isolation / B response | PASS in the browser, including return to online mode |
| Profile import/export card | PASS in local tests; browser smoke still needs a real device pass after service recovery |
| Auth/REST gateway | BLOCKED: HTTP 402 exceed_db_size_quota |
| Real independent Auth sessions and persistence | BLOCKED / NOT RUN |
| Signup delivery, recovery and final callback URL | NOT ACCEPTED |
| Static package | Allowlisted build prepared; publication NOT PERFORMED |
| Removal of old AI keys from local current source | 7 literals removed; remote history/revocation unchanged |
| Legacy Dart AI request guard | Source inspected; Flutter compilation NOT RUN |

Use the exact [browser launch acceptance](../web_launch/README.md) after the gateway recovers. The following legacy checks remain separate and do not describe the new Supabase schema.

## Legacy Flutter / Firebase audit results

| Check | Result |
| --- | --- |
| Source and dependency inventory | Completed for bounded checked-out text source |
| Firebase JS syntax | 6 source files parse locally |
| Anonymous custom-handler boundary | FAIL: 3/3 handlers reached the local database stub |
| Firebase rules emulator | NOT RUN |
| Flutter analysis/tests/build | NOT RUN; tooling absent on PATH |
| Browser access to source Firebase project | BLOCKED: missing project or insufficient permission |
| Live key validity, billing, and deployed security | NOT VERIFIED |
| Product journey on a device | NOT RUN |

## Security acceptance before a shared demo

| Test | Expected result |
| --- | --- |
| Anonymous profile write/delete | Denied |
| A reads/writes B's diary, private location, or private upload | Denied through both SDK and HTTP paths |
| A changes another user's meeting/friendship | Denied unless the documented participant role authorizes it |
| Anonymous, invalid-token, and expired-token HTTP requests | Rejected before any Admin database call |
| Query/body contains another user's ID | Cannot override verified identity or consent rules |
| User uploads private content | Owner-only access and a tested deletion path |
| Repeated AI calls or oversized input | Server-side limits and predictable error handling |
| App bundle/source inspected for provider secrets | No provider secret in client payloads |
| Browser caches and history | Absent from the approved distributable/source publication |

Use Firebase emulator tests for rules and integration tests for handlers. The included stub probe is intentionally narrower: it checks that anonymous requests do not reach the Admin database boundary. It does not simulate deployed IAM, actual Firestore rules, valid-user authorization, App Check, or billing.

## User journey acceptance

1. Fresh install/open: one product name, readable language, no crash, clear loading/error state.
2. Email and Google sign-in: success, cancellation, invalid credentials, sign-out, and session restart. Only list providers that pass.
3. Profile: A edits its own profile; B sees only the public subset; anonymous access matches the policy.
4. Map: synthetic locations render correctly; denying location permission does not crash or expose real coordinates.
5. Mutual benefit and meeting: A requests a meeting, B handles it, both see a consistent state; unrelated users cannot modify it.
6. Diary: text saves and reloads for A; B and anonymous access fail. Public map/matching endpoints must not expose notes.
7. Voice/AI, if included: explicit consent, microphone-denied flow, provider failure, approved synthetic input, bounded spending, safe output handling.
8. Account deletion: profile, private subcollections, uploads, and external processing follow a documented and tested retention/deletion flow.

## Presentation gate

All security checks relevant to the selected demo must pass. The selected profile → map → meeting journey must pass on the actual demonstration device. Capture five genuine screenshots and a short successful recording, with no real user data, console credentials, or unverified claims.

If the app cannot pass yet, use the written concept brief and clearly labeled design material. A screenshot mockup or source walkthrough is not evidence of a working application.
