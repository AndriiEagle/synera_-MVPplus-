# Cloud cost journal — `cloud/pwa-hardening-20261027`

Owner's budget for this overnight run: **$30** of Claude cloud credits (expire 5 Nov). Stop rule: report when the journal passes $30.

## How the numbers are measured

The session has no billing API. The only live meter available inside the run is the session's remaining-token counter, which decreases by the tokens each request consumes (context read plus output). The journal records that counter at each commit and converts it to dollars under two assumptions, so the owner can compare with the real figure in the claude.ai usage page:

- **central**: $3 per million tokens (most of the consumed context is cache-read; cached input on Opus-class pricing is around $1.50/M, output around $75/M but a small share of volume)
- **upper bound**: $15 per million tokens (every token billed as uncached input; impossible here, used as a ceiling)

Both are estimates. The authoritative number is the account's usage page.

## Journal

| Step | Deliverable | Commit | Counter after | Tokens this step | Central $ | Upper $ |
|---|---|---|---|---|---|---|
| 0 | Branch from `origin/main` (`cd94980`), baseline suite, read PWA/i18n sources | — | 14,894,000 | 106,000 | 0.32 | 1.59 |
| 1 | `tests/pwa/` suite + fixtures + README + CI line | `a3b7467` | 14,850,389 | 43,600 | 0.13 | 0.65 |
| 2 | `web_launch/i18n-ch.mjs` + `tests/i18n_ch/` + README + CI line | `f28a2fb` | 14,831,013 | 19,400 | 0.06 | 0.29 |
| 3 | `audit/mobile-audit.md` | `16aafd4` | 14,799,133 | 31,900 | 0.10 | 0.48 |
| 4 | `audit/product-path-check.md` | `7db4be3` | 14,763,387 | 35,700 | 0.11 | 0.54 |
| 5 | Post-run suites, browser spec attempt, this journal, push | see below | ≈14,750,000 | ≈13,000 | 0.04 | 0.20 |
| **Total** | | | | **≈250,000** | **≈$0.75** | **≈$3.75** |

Budget used: well under $30 on either assumption. No provider calls, no paid APIs, no deployment, no secrets touched.

## Test counts before and after

| Suite | Command | Before (`cd94980`) | After |
|---|---|---|---|
| Node unit (CI line) | `node --test web_launch/*.test.mjs web_launch/iceberg/*.test.mjs neon/*.test.mjs plan/v6/workflow/approval-boundary.test.mjs` | 717 tests, 716 pass, 1 skip, 0 fail | 717 tests, 716 pass, 1 skip, 0 fail |
| Tools | `node --test tools/simulation-server.test.mjs tools/simulation-runner.test.mjs` | 5 tests, 4 pass, 1 fail (`playwright` package missing before `npm ci`) | 7 tests, 7 pass (after `npm ci`) |
| Python | `python3 -B -m unittest discover -s tools -p test_simulation_provider.py` | 3 OK | 3 OK |
| New: PWA | `node --test tests/pwa/*.test.mjs` | — | 21 pass |
| New: Swiss locale | `node --test tests/i18n_ch/*.test.mjs` | — | 22 pass |
| Browser | `npx playwright test tests/browser-e2e.spec.mjs` | not run before | 32 passed, 0 failed |

The "140/140" figure in the briefing does not match any single suite here; the Node unit suite alone is 717 tests. The before/after rows above are the counts that were actually observed in this container.

## Browser run

`npx playwright test tests/browser-e2e.spec.mjs` after the changes: **32 passed, 0 failed** in 34.5 s on the pre-installed Chromium (`serviceWorkers: 'block'` per `playwright.config.mjs`, so it does not exercise the worker; `tests/pwa/offline-fallback.test.mjs` covers that statically). `tests/studio-e2e.spec.mjs` and the `tools/*-acceptance` scripts were not run. The spec was not run on the base commit, so this is an after-only reading; the files this branch adds are tests and documents, and the only shared file touched is `.github/workflows/ci.yml` (two added `run:` lines).

## What was deliberately not spent on

- No Playwright acceptance tools under `tools/*-browser*.mjs` beyond the one spec above: each needs a built candidate and several minutes of Chromium; the static audits name the ones that matter.
- No PostgreSQL acceptance (`neon/local_acceptance.test.mjs` needs a Docker Postgres service that this container does not have).
- No CSS or product-code changes: the audits list the fixes, each of which needs its own browser acceptance under the repo's Current/Atelier rules.
