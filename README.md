# Synera — real-user PWA pilot

> Current state (2026-10-03): [shared product entry point and verified release state](START_HERE.uk.md). Runtime: Neon + Cloudflare Pages. Historical Supabase-specific steps below are parked. Claude Code reads the same entry through `CLAUDE.md`.

Latest addition: [separate two-account journey and exact acceptance limits](artifacts/real-journey-20261003/REPORT.uk.md). Shared terms, each participant's approval, invitation acceptance, private messaging and a fresh cycle after explicit closure are connected. 109 local checks and Chromium passed; real PostgreSQL16.15/RLS passed with a provider identity shim. The new gate remains closed, and this candidate is not a deployed two-account product.

[Published product presentation and Android/iPhone access](https://synera-summit-20261001.andypokr911.chatgpt.site/) · [Sales, matching and Maps capability boundaries](docs/PRODUCT_VALUE_AND_SALES.uk.md). Paid checkout is not configured; native store releases and semantic deep matching are open requirements.

Synera turns an owned professional profile into a concrete, mutually useful introduction: profile → bilateral fit → proposed time → accepted conversation.

**Current launch state: local RC accepted; live rollout pending.** The existing HTTPS pilot gateway answers, and the separately published Summit presentation is available. The new two-user location/address release passed local Chromium and PostgreSQL acceptance; production migration, binding and physical Android acceptance remain open. See the exact proof limits in [START_HERE.uk.md](START_HERE.uk.md).

## Start here

[Current code, launch gates and shared agent context — Ukrainian](START_HERE.uk.md). [Original real-pilot product scope](docs/REAL_PILOT.uk.md) remains useful background.

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
