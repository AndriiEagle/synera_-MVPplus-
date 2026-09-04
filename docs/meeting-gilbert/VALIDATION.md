# Meeting packet validation · 2026-09-04

## Local code

`node --test web_launch/data.test.mjs web_launch/matching.test.mjs web_launch/economics.test.mjs web_launch/server.test.mjs`: **24 passed, 0 failed**. Nine existing adapter/demo tests plus fifteen matching/economics/HTTP tests. One matching test checks exact order invariance over 64 combinations; these are synthetic test cases, not 64 users or an LLM fairness study.

Coverage includes two-sided need explanations, no one-way promotion, consent and information abstentions, confidentiality/language/date/mode conflicts, stricter travel constraints, stale data, duplicate tags, excluded name/payer/private-note fields, simulated two-party approval, VAT-inclusive revenue, recurring fees, negative economics and inaccessible private HTTP files.

The first new HTTP test expected a non-existent `mode` field in demo config; that test assumption was corrected to the actual config contract. The final full suite above passes. No production data was touched.

`node web_launch/export-economics.mjs`: **60 scenario rows** in [pricing-scenarios.csv](pricing-scenarios.csv). All rows are hypothetical; the generator reuses the tested financial model. It covers five prices, three member counts, two manual-time levels and two VAT scenarios.

Both `node web_launch/build.mjs --demo` and `node web_launch/build.mjs` completed: **14 files each**, including ten hashed public assets and four generated files. Builds are local and unpublished. The demo build has no backend URL/key. The configured build retains the existing public Supabase client configuration; it does not establish gateway availability.

The bounded packet verifier checked 17 Markdown files and 71 local links with zero broken targets, recalculated all 60 CSV rows, and checked both release allowlists/hashes. Its public-release secret-pattern check found no candidates; this is not a full source/history secret audit. The external machine-readable record is `meeting-packet-validation.json` in the parent review folder.

## Actual browser checks

Verified in the Codex in-app browser at [local laboratory](http://127.0.0.1:50877/lab.html):

| Interaction | Observed result |
| --- | --- |
| Open from the existing Synera page | Laboratory loads through the shared server allowlist |
| Compare the two initial examples | 100% / 75% directional coverage, baseline 75%; unmet video need disclosed |
| Simulate each side accepting | Two approvals required; no external message sent |
| Revoke one comparison consent | Existing result emptied/hidden; recomparison asks for consent without content |
| Swap the two sides | Same 75% and unchanged normalized result; same-order check shown |
| Change service time from 10 to 30 minutes | Monthly scenario changes from CHF829.80 to CHF79.80 after included owner time |
| Price CHF1 | 60% contribution target explicitly shown as unattainable even with no manual work |
| Include 8.1% VAT in CHF39 | Scenario becomes CHF683.69; payment fee stays based on gross charge |
| Desktop visual inspection | Result legible, no horizontal overflow in inspected viewport |

The VAT browser automation initially used an exact label selector that did not resolve; the visible combobox selector succeeded. That was an automation selection issue, not a payment action. Values were reset to the initial scenario after inspection.

Responsive CSS is included, but no separate mobile-device acceptance is claimed. Browser checks were interactive; the Node tests do not pretend to cover visual rendering.

## Online and research boundaries

Read-only health check at **2026-09-04T17:01:30Z** returned **HTTP 402**, Auth gateway restricted, `ready_for_launch: false`. The local laboratory works independently. Real login, billing, semantic AI, full map, group matching, production deletion/moderation and public deployment remain unaccepted or unimplemented as described in [MEDIATOR.md](MEDIATOR.md).

[24 source pages](SOURCES.md) support eight research workstreams. Published facts, source limitations and our hypotheses are separated. No interviews, payment evidence, confirmed partnership or actual Gilbert correspondence is claimed. The master prompt leaves the missing correspondence and meeting date explicit.

No third-party model was invoked, no package installed, no new secret created, no support/outreach message sent, and no push or deployment was performed during this meeting-preparation extension.

Models used: none (provider calls=0, USD=$0.00)
