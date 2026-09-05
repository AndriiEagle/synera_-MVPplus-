# Synera real-user browser pilot

The current main app is for real owned profiles. Legacy demo fixtures remain available to unit tests only. The static server does not expose data.mjs, simulation.mjs, lab pages or lab fixtures.

## Local run

    node web_launch/server.mjs
    node web_launch/server.mjs --local-ai

The second command enables only the existing local DOMOVYK adapter on this Windows workstation. The server binds to 127.0.0.1. There is no public tunnel, remote access or provider fallback. A random in-memory request nonce plus exact Origin/Host checks protect the local AI POST endpoint. Each process permits at most three AI attempts and one at a time; each attempt rechecks the canonical runtime resource gate. Prompts travel over stdin and are not written to repository files. The canonical receipt records only metadata/hashes. Generated suggestions must pass exact-quotation validation and human review.

The first attempt was blocked by resource pressure. One unconstrained generation was rejected by the integration. After adding the canonical strict JSON-schema route, one local API generation returned HTTP 200, passed quotation validation and was applied to a private TEST ONLY browser draft. Two actual local inferences used 889 tokens; external provider calls and spend were zero. This one-sample technical acceptance does not establish general model quality or human acceptance of a real profile. User-selected ChatGPT prompt/JSON transfer is available on a static host too; it is not an automatic ChatGPT integration.

## Data flow

1. Draft fields stay in tab memory. Closing/reloading loses an unsaved draft; download profile JSON first.
2. An authenticated person accepts current pilot terms. The server owns the acceptance timestamp.
3. Saving sends only reviewed profile fields and a normalized collaboration brief. Publishing and map visibility are separate, default-off controls.
4. Discovery paginates 50 rows at a time. The matcher uses only confirmed tags/conditions, not identity or subscription status.
5. Invitations contain concrete time/place and server-captured names. Messages need an accepted invitation and no block.
6. Complete-account export paginates beyond the UI message limit. It is a private file; technical provider logs/backups remain an operator request.
7. Profile deletion cascades meeting history/messages but preserves the Auth account, consents, reports, blocks and admission counters. Full account deletion requires verified operator handling.

## Backend gates

The dedicated project is onwvsxgoxuuiopwnvvvy. Its existing schema.sql snapshot is already applied. real-pilot.proposal.sql replaces the un-applied pilot-consent.proposal.sql; never apply both. Generate/review a CLI migration before applying the new proposal. The CLI/Postgres runtime is unavailable locally, and new SQL has not been runtime-tested.

The review proposal adds restricted column grants and RLS, explicit consent, server timestamps, immutable invitation names, participant-only messages, bilateral blocks, private reports and serialized admission counters. Its only SECURITY DEFINER trigger protects non-client-writable anti-spam counters using a fixed actor from auth.uid(), no dynamic SQL and no execute grant. It needs focused database acceptance and advisor review before launch.

public config accepts only a Supabase HTTPS origin and a modern publishable key. Enabling registration requires pilotSafetyEnabled, realPilotEnabled and a public HTTPS return URL. These flags must remain false until the corresponding server proof exists; they do not independently disable the remote Supabase signup endpoint.

Keep Supabase signups disabled server-side during deployment. Configure custom SMTP and token_hash email templates/redirect allowlist before opening signups. Test verification, password reset, logout and restore with two real authorized accounts.

## Public package

    node web_launch/build.mjs

Output: web_launch/dist-real. Original dist/dist-demo folders remain historical and are not the current release. Upload only the reviewed dist-real files to the chosen HTTPS host, never the repository. Static-host AI uses the user's own ChatGPT transfer until a reviewed, consented public AI backend is provisioned; a public page cannot call this workstation's loopback AI.

The service worker caches only explicit public shell files. Failed offline configuration returns 503; it never creates synthetic people. Auth/REST/AI, token queries, imports and map tiles are never added to this cache. OSM background tiles load only after a button click, with attribution and no GPS.

## Acceptance boundary

Use the Node test command in the root README and the new real-pilot.acceptance.sql after approved schema application. Browser review covers the 390px local profile/import/AI-preview path, not real Auth, remote persistence or physical-device installation. See ../docs/REAL_PILOT.uk.md for the remaining launch actions.
