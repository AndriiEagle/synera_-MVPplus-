Status: NEEDS_REVIEW — auth implementation locally verified; all-Node acceptance held by one unchanged i18n failure.

Task 1592, 29.10.2026. Worktree `C:/sw/synera-openreg`, branch
`claude/synera-openreg-20261029c`, baseline `a95acd525afd3c7a729bf7123254d9e81c224e93`.
This file was written last, after source, documentation, acceptance receipts and negative checks.

## Tests and acceptance

Local runtime: **Node v24.16.0**. GitHub CI specifies Node 22; that runtime and remote CI
were not run. No installs, commits, pushes, deployments, secret/env edits or `.git` writes.
The assigned worktree's `web_launch/` and `tests/` were not edited.

| Check | Pass | Fail | Skip |
|---|---:|---:|---:|
| Main CI Node command | 735 | 0 | 1 |
| Simulation Node command | 7 | 0 | 0 |
| PWA Node command | 21 | 0 | 0 |
| Swiss i18n Node command | 21 | 1 | 0 |
| Total of the four CI Node sets | **784** | **1** | **1** |
| Targeted worker + OAuth + open-registration tests, included in main | 37 | 0 | 0 |

Exact main command from `.github/workflows/ci.yml` (reporter added only for evidence):

```text
node --test --test-reporter=tap web_launch/*.test.mjs web_launch/iceberg/*.test.mjs neon/*.test.mjs plan/v6/workflow/approval-boundary.test.mjs
```

Other Node commands:

```text
node --import file:///C:/Users/Andrii/.codex/outputs/synera-gilbert-readiness-20261021/dependency-resolution.mjs --test --test-reporter=tap tools/simulation-server.test.mjs tools/simulation-runner.test.mjs
node --test --test-reporter=tap tests/pwa/*.test.mjs
node --test --test-reporter=tap tests/i18n_ch/*.test.mjs
```

Simulation reuses the existing installed Playwright through the canonical dependency
resolution hook; no package installation. Its hash is recorded in the receipt.
The one main-suite skip is disposable PostgreSQL integration without `SYNERA_ACCEPTANCE_PG`.

The only final failing test is `hand-built output agrees with the engine Intl.NumberFormat
after whitespace normalisation` in `tests/i18n_ch/currency.test.mjs:25`:
for `de-CH 125050`, the helper uses U+2019 and this Node runtime's Intl uses U+0027.
The test and both relevant modules (`web_launch/i18n-ch.mjs`,
`web_launch/swiss-compliance.mjs`) were checked byte-for-byte against baseline Git blobs.
All are unchanged; hashes and failure output are preserved. This is outside this lane's
file ownership and was not repaired or normalized away. **The requirement that every
Node set be green remains unfinished.**

Sparse checkout omitted two archive fixtures and the CI approval-boundary test.
The initial direct worktree run consequently had one fixture-loading failure.
Final CI sets ran in a snapshot under the default OS temp on **C:**; the three
missing inputs were restored there from exact baseline Git blobs. There was no
test filtering, result mocking or fixture substitution. Current source hashes were
rechecked against the snapshot after the runs. No temporary repos/caches used D:.

Reproduction wrapper: `node neon/verify-open-registration.mjs`.
It deliberately returns exit 1 while the unchanged i18n failure persists.
Full commands, counts, input/source SHA-256 values and verdict:
`neon/open-registration-acceptance.json`.

### Negative runs

- New open-registration test file against the original implementation: **1 pass,
  11 fail**. The existing closed-mode responses passed; open-mode scenarios failed.
  Evidence: `neon/open-registration-negative.tap`.
- A targeted resend test exposed the attempt-budget reset: **0 pass, 1 fail**
  before repair (`neon/open-registration-resend-negative.tap`). The final 37/37
  targeted run verifies the repair, including that success permits a subsequent code.
- Replacing only the Google adapter in the C: test snapshot with
  `a95acd5:neon/google-oauth.mjs`: **0 pass, 1 fail** for the new standalone open-mode
  test. Restoring the reviewed bytes: **1 pass, 0 fail**. The test SHA and result
  are recorded in the receipt; log: `neon/open-registration-google-negative.tap`.

### Build closure

`node neon/build.mjs dist-neon-ci` ran only in the C: snapshot, preserving the other
lane's actual `web_launch/`. Build and bundled Worker syntax passed; the bundled
default-off config and open OTP request passed with a synthetic local provider response.
Bundle SHA-256: `0377dd2dfbcffc5ca0cfd5f053f9c0bf33ee0a61ae6ff215507b769b2730f559`.
This is component acceptance, not live Neon or email delivery. `git diff --check` passed.

## Files changed

- `neon/worker.mjs`: exact-string default-off flag; open allowlist admission for OTP,
  sessions and Google; preserved closed-mode errors; consent and OTP protection wiring;
  enumeration-safe provider-error mapping only in open mode.
- `neon/google-oauth.mjs`: verified open-mode identity admission; existing rollout flags,
  consent, challenge/verifier, cookie, origin and redirect checks preserved.
- `neon/otp-abuse.mjs` (new): existing KV binding, separate hashed key prefix, 3/email
  and 20/IP requests per 15-minute window, five verify attempts per 10-minute window,
  consent binding, no failed-attempt reset on resend, consumption after success, TTLs,
  trusted connecting-IP requirement, fail-closed storage errors, in-isolate serialization.
- `neon/build.mjs`: includes the OTP module in the assembled Worker.
- `neon/open-registration.test.mjs` (new): off/open behavior, normalization, readiness,
  consent, quotas, concurrent requests/guesses, resend bypass, expiry, enumeration and Google.
- `neon/google-oauth.test.mjs`: independent standalone open-mode Google admission and guards.
- `neon/verify-open-registration.mjs` (new): pinned C: sparse-input CI snapshot and bundle checks.
- `docs/OPEN-REGISTRATION-20261029.uk.md` (new): flags, rollout order, owner setup,
  Google callback URI, legal-plan dependencies, SQL admission blocker and phone checklist.
- `neon/open-registration-acceptance.json` (new): source/input hashes, runs, counts,
  negative-check linkage, unchanged i18n evidence and bundle result.
- Evidence logs (new): `neon/open-registration-targeted.tap`,
  `neon/open-registration-negative.tap`, `neon/open-registration-resend-negative.tap`,
  `neon/open-registration-google-negative.tap`, `neon/open-registration-ci-main.tap`,
  `neon/open-registration-ci-simulation.tap`, `neon/open-registration-ci-pwa.tap`,
  `neon/open-registration-ci-i18n.tap`, `neon/open-registration-ci-build.tap`,
  `neon/open-registration-ci-bundle-syntax.tap`.
- `DONE.md` (this file, new and last).

## Unverified and blocked items

- Live Neon schema, backup/restore, SMTP, auth/session behavior, actual provider OTP expiry,
  live SQL/RLS, a real Google OAuth client/provider configuration, Android/iPhone/PWA flows.
- **SQL admission remains closed:** `synera_members_only` and `synera_pilot_member()`
  still require `synera_pilot_members`. The Worker flag alone opens authentication,
  not unrestricted application-data membership. A separately reviewed migration and
  real new-user/foreign-data-denial checks are prerequisites for public launch.
- **KV is eventually consistent and lacks atomic counters.** The implemented budgets
  are best-effort across isolates/regions; local KV-model tests do not establish a strict
  distributed cap. Production Neon/edge abuse limits, KV quotas/write behavior and G5
  protection must be accepted before opening the service. No new provider was added.
- Legal pages, revised public consent policy, provider deletion and support procedures
  from the launch plan remain owner/legal gates. The existing consent version/SQL was not weakened.
- Browser/Python/PostgreSQL CI jobs and remote GitHub CI were not claimed as run.
- Supported `codex_app.set_thread_title` was not available; task 1592's title could not be
  updated through the required API. No second number was reserved and no app database was touched.
- Canonical prepare reported stale global retrieval metadata; local work relied on exact
  requested checkout sources and hashes. No hosted dispatch was attempted.

## Next

Claude: review this diff and the exact i18n failure with the `web_launch/` owner, then
rerun the CI Node sets on Node 22. Keep registration off until SQL admission, provider
configuration, distributed abuse protection, legal review and real-phone checks pass.

Models used: none (provider calls=0, USD=$0.00).
