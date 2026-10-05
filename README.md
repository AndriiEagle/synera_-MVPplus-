# Synera — real-user PWA pilot

> Latest checkpoint, 2026-10-05, code `49764c1`: [automatic partner status and actual screens](artifacts/partner-status-20261005/REPORT.uk.md), [27 systems / 15 user stages](artifacts/product-status-20261004/STATUS.uk.md), [updated rollout review](artifacts/product-status-20261004/ROLLOUT_REVIEW.uk.md). Selected pre-chat pair updates approvals/revisions/invitation replies without erasing drafts or granting consent. Status11 + chat18 groups overlap; two REDs/mutation/native24 hash readback/97-file candidate accepted locally, unpublished. Fresh console metadata: Neon production/neondb has no snapshot; Pages synera-pilot has NO GIT CONNECTION, so push is not deployment. Live JWT/two accounts/physical Android remain open. Earlier checkpoints below are historical.

> Current state (2026-10-05): [dynamic UX audit with actual screens](artifacts/dynamic-audit-20261005/REPORT.uk.md), [systems inventory](artifacts/product-status-20261004/STATUS.uk.md), [shared entry point](START_HERE.uk.md), [bounded rollout review](artifacts/product-status-20261004/ROLLOUT_REVIEW.uk.md). Local candidate accepted; the new live journey is not deployed. Claude Code reads the same entry through `CLAUDE.md`.

Previous code (`f01cdf1`): unchanged private-chat reads preserve text selection; changed messages/authors still render. 18 message browser groups, separate 17 outcome groups (overlap), semantic RED/mutation and independent package readback passed. Its active-pair pre-chat refresh gap is addressed by `49764c1`; physical Android/live-account acceptance remains open.

Latest code (`564fa9a`): a prior send/readback cannot erase the next unsent draft; 15 Chromium groups and a semantic mutation passed. Receiver outcome acceptance, bilateral address, private archive/viewer/social draft have [local evidence](artifacts/overnight-20261004/REPORT.uk.md). New journey routes remain absent from the public presentation and existing Neon pilot; live HTTP JWT, two accounts and physical Android are open gates.

Historical foundation: [two-account journey and acceptance limits](artifacts/real-journey-20261003/REPORT.uk.md), including its earlier 109-test and isolated SQL receipts. These describe that version, not a finished deployed product.

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
