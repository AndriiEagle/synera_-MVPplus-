# Security and account review

This document intentionally contains no credential values, fingerprints, account emails, or real user records. Findings refer to the checked-in source at `ba4e07567dc06139c336f9ad9262af88f31c5e7d`; deployed behavior is unknown unless stated otherwise.

## Subsequent remediation and Supabase launch

Seven AI-key literals (three distinct candidates) have now been removed from the local current Flutter source. Its API manager rejects direct OpenAI requests before network access. The Dart change is not build-verified; no Flutter SDK is available here. The keys were not revoked at the provider, and old commits/public GitHub history still contain them. Removing current literals is not a substitute for revocation or approved history cleanup.

The new Supabase project uses only a modern publishable client key in browser configuration. Profiles default to private; database policies and column grants passed transactional owner/participant isolation tests. Security and performance advisors returned no findings. No fixture accounts/data remain, and no service-role key was retrieved or placed in the browser.

The new project's gateway is restricted with HTTP 402 `exceed_db_size_quota`; see [launch status](SUPABASE_LAUNCH.uk.md). Its email-confirmation setting remains enabled and anonymous login disabled. Signup UI is closed pending accepted email delivery and real Auth tests. Hiding UI does not change backend signup permissions. Account deletion, retention, abuse controls and moderation must be completed before a real-user pilot.

The static package includes only allowlisted browser files and public configuration; old Firebase/Maps/AI configuration, browser databases and Git history are excluded. The historical inventory and legacy findings below remain useful for restoring or publishing the original repository.

## Verified access and configuration

| Item | Result on 2026-09-04 |
| --- | --- |
| GitHub repository | Read access exercised; push/admin permissions reported; no push performed |
| Firebase web/Android/iOS configuration | All three declare the same project |
| Android application ID | Matches a client in the checked-in Firebase Android configuration |
| Firebase Console | Signed-in session available; the source project's page reports missing project or insufficient permission |
| Account age, ownership, billing, key restrictions | Not established |
| Live Auth providers, rules, Functions IAM, actual data | Not inspected |

The project alias in source is `crystalisedin`. Failure to open its console page does not distinguish deletion from missing permissions or use of another account. GitHub access does not establish Firebase ownership.

## Key inventory and treatment

| Kind | Source evidence | Required action |
| --- | --- | --- |
| AI provider secret candidates | 3 distinct values across 7 literals in `lib/backend/api_requests/api_calls.dart`, lines 14, 74, 101, 219, 277, 338, 392 | Owner must check provider status/usage; rotate or revoke confirmed exposed secrets, then use a server-held credential |
| Firebase client configuration | Google keys in Android JSON, iOS plist, and Firebase Dart initialization | Check project association and restrictions; do not replace just because the file is old |
| Maps platform keys | Android manifest line 66, iOS AppDelegate line 12, web index line 59 | Verify separate suitable application/API restrictions for each platform and actual usage |

There are 4 distinct Google-key values across 6 source locations in the bounded scan. No key was sent to an API to test whether it works.

Firebase client API keys normally identify a project; data protection relies on authorization and rules. For other Google APIs, use appropriately restricted keys. [Firebase API key guidance](https://firebase.google.com/docs/projects/api-keys).

For Maps, inspect usage before restricting or rotating an existing key. Check Android package/signing certificate, iOS bundle ID, or allowed web origins as appropriate, plus permitted APIs. [Google Maps security guidance](https://developers.google.com/maps/api-security-best-practices).

AI provider keys must not be embedded in an app or browser. Moving the same key to a client `.env` or build variable does not make the compiled application secret. [OpenAI API authentication](https://platform.openai.com/docs/api-reference/authentication).

## Findings to fix before real-user access

| Priority | Finding | Proof and consequence |
| --- | --- | --- |
| P0 | Open writes to `/users` | `firestore.rules:5–8` includes unconditional write; the narrower delete clause does not override an allowed write |
| P0 | Public diary/location access | `firestore.rules:13,19,49,55` permits reads without authentication; other user subcollections also need classification |
| P0 | HTTP handlers lack caller authorization | All 3 local probes reach Admin database access anonymously; diary handlers accept a requested user's ID |
| P0 | Secret-like values in public client source | 3 distinct AI candidates; validity/usage unknown; handle as exposed until the owner establishes status |
| P1 | Browser profile committed | Git tracks History, Login Data, Cookies, and Web Data under `android/.dart_tool/chrome-device/`; binary contents were not inspected |
| P1 | Broad authenticated writes | Any signed-in user can write photos under other user paths and modify meetings/friendships under current rules |
| P1 | Public user storage | `storage.rules:7–9` allows public reads under user paths; classify profile images versus private uploads |
| P1 | Incomplete deletion | `firebase/functions/index.js:5–8` deletes only the parent user document |

These priorities describe restoration work. They do not claim confirmed abuse, current production exposure, or a breach. Rule evaluation and overlap are described in [Firebase's conditions documentation](https://firebase.google.com/docs/firestore/security/rules-conditions).

## Efficient account refresh

1. Open the source Firebase project with its owner account or confirm that it was deleted. Record only the access outcome and a responsible role in shared docs.
2. Inspect enabled Auth providers, authorized domains, registered Android/iOS/web apps, Functions runtime/IAM, deployed rules, and quotas. Keep live user data out of the audit.
3. Identify each key's service, restrictions, consumers, last usage, and owner. A date in Git is not a key-expiration date.
4. For actual exposed provider secrets, prepare a replacement server integration and an explicit rotation/revocation sequence. If active abuse is suspected, the owner should revoke promptly; availability recovery comes after containment.
5. Verify the corrected flow using synthetic data and an agreed call cap. Remove old credentials from current source and history only under a separately approved cleanup plan. Rotation and Git cleanup are different tasks.
6. Recheck web/Android/iOS consistency and rerun the acceptance matrix. Save status metadata, never key values or session tokens.

## Repository cleanup boundary

The audit identified 2,754 generated/editor files among 3,171 tracked files. Adding ignore patterns does not remove already tracked content. The existing `.gitignore` even ignores `google-services.json`, which remains tracked.

Prepare a path/blob manifest for build caches, `.dart_tool`, editor files, and browser profile material; preserve it privately for recovery. Do not inspect or publish browser databases as evidence. Any history rewrite, force push, file removal, key change, or cloud deployment requires explicit authorization and a concrete preview.

## Decisions that remain open

- The browser launch now uses the dedicated Supabase project. Firebase ownership remains relevant only for a possible authorized legacy-data export.
- Which profile fields and locations are intentionally public? Diaries should default to owner-only pending a specific consent design.
- Which services are still required, who pays for them, and what exact demo spend cap applies?
- What user-facing deletion and retention behavior can the implementation actually guarantee?
