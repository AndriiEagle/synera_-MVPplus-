# Synera — real-user PWA pilot

> Current route (2026-09-05): Neon Free + Cloudflare Pages. [Live setup state and release instructions](docs/NEON_LAUNCH.uk.md). The Supabase-specific launch steps below are parked.

Synera turns an owned professional profile into a concrete, mutually useful introduction: profile → bilateral fit → proposed time → accepted conversation.

**Current launch state: blocked.** The UI and adapters have been rebuilt for real profiles. Supabase Auth still returns HTTP 402 (verified 2026-09-05). No public HTTPS release or real-account browser acceptance is claimed.

## Start here

[Current scope and launch gates — Ukrainian](docs/REAL_PILOT.uk.md) is the current source of truth. It supersedes the earlier demo/bot/native-app plans.

    node web_launch/server.mjs --local-ai

Open the printed loopback URL. The real-user shell contains no demo profiles, simulation controls, bot timers, pricing pages or laboratory routes. When the backend is unavailable, a person can prepare and export their own private draft. It never pretends to create an account.

AI is optional and explicit. The local route reuses the existing DOMOVYK adapter, validates source quotations, and requires human review. One local API test passed with schema-constrained generation, exact source evidence and a reviewed browser draft. This is a single public fixture, not a general quality benchmark. The portable ChatGPT prompt/JSON path works in the editor without a Synera API charge; the user performs any ChatGPT request in their own account. Automatic public-site AI hosting is still a launch dependency.

## Implemented in this revision

- Private profile, owned CSV/text/JSON import, complete profile/conditions export, clipboard and Web Share.
- Structured goals, offered/needed capabilities, languages, dates, distance, online mode and confidentiality preferences.
- Symmetric comparison with explanations for both sides; no probability-of-success or human-value rating.
- Invitations with a proposed time, duration and place; participant-only messages after acceptance; UTC calendar export.
- Block/report controls, data export, separate map visibility and confirmed profile deletion.
- Versioned pilot terms naming the operator supplied by the user.
- Separate public asset allowlist; no backend adapter, tests, SQL or legacy demo assets in the release.

The online implementation requires [review proposal SQL](supabase/real-pilot.proposal.sql). It is **not applied**. The new [transactional database acceptance script](supabase/real-pilot.acceptance.sql) is **not run**. The existing [baseline snapshot](supabase/schema.sql) is already applied; do not reapply it.

## Verify and build

    node --test web_launch/data.test.mjs web_launch/matching.test.mjs web_launch/economics.test.mjs web_launch/profile-portability.test.mjs web_launch/mobile-pilot.test.mjs web_launch/real-pilot.test.mjs web_launch/server.test.mjs
    node web_launch/build.mjs
    node web_launch/health-check.mjs

The build writes only reviewed public files to web_launch/dist-real. It does not publish them. The static build never includes the local AI nonce or server code.

[Browser setup](web_launch/README.md) · [Mobile launch](docs/MOBILE_PILOT.uk.md) · [Implementation prompt](docs/MOBILE_IMPLEMENTATION_PROMPT.uk.md) · [Prepared Support request](docs/SUPABASE_SUPPORT_REQUEST.md)

The older Flutter/Firebase code and historical research remain in the repository for reference. They are not part of this PWA release and have not received production security remediation.
