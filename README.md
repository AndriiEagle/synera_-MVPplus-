# Synera MVP+

Synera helps people find mutual interests and exchange practical help: a profile → discovering people → a meeting request.

**Current status: Supabase schema applied; online launch blocked by the organization's HTTP 402 quota restriction.** The browser demonstration works with synthetic data. Real sign-in, persistent browser journeys, and public launch have not passed acceptance.

## Start here

Run `node web_launch/server.mjs` from this directory using the existing Node.js installation. Open the printed localhost address. The app checks the configured Supabase service before enabling login. If it is unavailable, **Переглянути демонстрацію** opens a clearly labeled synthetic scenario.

For a completely offline demonstration: `node web_launch/server.mjs --demo`.

| Need | Document |
| --- | --- |
| Prepare the Gilbert meeting: research, pricing, prompts and prototype | [Meeting packet](docs/meeting-gilbert/README.uk.md) |
| Current launch status, cost and exact blocker | [Supabase launch](docs/SUPABASE_LAUNCH.uk.md) |
| Run, build and verify the browser version | [Browser setup](web_launch/README.md) |
| Import/export profile cards and safe sharing | [Profile portability](docs/PROFILE_PORTABILITY.uk.md) |
| Explain and demonstrate the product | [Presentation guide](docs/PRESENTATION.uk.md) |
| See the remaining work in order | [Refresh plan](docs/REFRESH_PLAN.uk.md) |
| Prepare the static hosting package | [Hosting guide](docs/HOSTING.uk.md) |
| Find source and data boundaries | [Architecture](docs/ARCHITECTURE.md) |
| Restore the original Flutter source | [Legacy application setup](crystallised_in/README.md) |
| Review keys, accounts and privacy | [Security review](docs/SECURITY_AND_ACCOUNTS.md) |
| Understand passed and blocked checks | [Acceptance](docs/ACCEPTANCE.md) |
| Reproduce the source audit | [Audit evidence](docs/VERIFICATION.md) |

## Implemented and verified on 2026-09-04

- A dedicated `synera-demo` project in the existing Supabase organization, with a confirmed creation quote of $0/month.
- [Profiles and meeting requests](supabase/schema.sql) with explicit column grants, RLS, opt-in discovery, participant-only request reads, recipient-only responses, and duplicate pending-request protection.
- [Transactional database acceptance](supabase/acceptance.sql) passed. No fixture accounts or data remain. Security and performance advisors returned no findings.
- Browser code uses the project URL and a modern public client key. No service-role key, paid AI, map service, external assets, tracking, or package installation is required.
- Profile import/export adds a consent-gated portable card, clipboard/Web Share support, sensitive contact blocking and deterministic match hints without scraping third-party accounts.
- Thirty-three local tests cover the adapter, synthetic journey, matching baseline, economics, profile portability and HTTP boundary. The static release contains fifteen allowlisted/generated files.
- [The collaboration laboratory](web_launch/lab.html) adds editable synthetic business profiles, two-sided need coverage, consent/conflict checks, approximate nearby filtering and a pricing calculator. It uses deterministic local rules; no LLM or live billing is connected.
- Seven old AI-secret literals were removed from the local Flutter source; its API manager now refuses direct OpenAI calls. That Dart change has not been compiled because Flutter/Dart are unavailable here.

## External blockers and limits

The existing Supabase organization's Auth and REST endpoints return HTTP 402 `exceed_db_size_quota`. Current displayed usage is only 5%; the dashboard shows a billing cycle ending **7 September 2026**. Current size alone does not establish when a historical quota restriction will clear. See the launch document for evidence and the provider's policy.

Email delivery and real Auth/REST acceptance must pass before opening registration. Public hosting has not been deployed. The original Flutter app, maps, diaries, recordings and AI are not migrated by the browser implementation.

The original repository is based on `ba4e07567dc06139c336f9ad9262af88f31c5e7d`. Its Firebase rules and handlers still require remediation; generated/browser files and old credentials remain in remote history. No key revocation, history rewrite, remote push or modification to the three older Supabase projects has been performed.
