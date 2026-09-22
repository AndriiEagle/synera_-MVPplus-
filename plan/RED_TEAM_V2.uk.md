# Red-team v2: CNRA / Synera master plan

Review target: `README.uk.md` and `CNRA_SOLO_MASTER_PLAN.json`.  
Intended behavior: decision-complete, weak-model-safe plan for an offline solo-entrepreneur pilot candidate, with no provider spend or product-code mutation in the planning turn.  
Validation available now: current full discovered Synera Node suite 80/80; offline build 26 files; master-plan validator rerun separately after revisions.

## Findings

### [P1] The first plan put persistence before the domain contract

The earlier DAG proposed `match_cases` SQL before four-mode and case/terms state semantics were frozen. That invites schema churn and lets a weak executor encode the wrong business meaning permanently.

Resolution: v2 orders mode semantics -> existing business-case v2 -> pure terms/approval/expiry/revocation behavior -> canonical SQL source -> generated Neon proposal -> client integration. D1 never depends on applying a database migration.

### [P1] Node tests were allowed to imply RLS acceptance

The earlier acceptance language said server fixtures could “prove” invitation blocking while no database execution was authorized. A generated SQL file and mocked client rejection cannot prove PostgreSQL RLS.

Resolution: SQL/client steps now remain `PRESENT_BUT_UNTESTED`; D2 requires an approved disposable/isolated database, actual A/B/anonymous/forged-request acceptance and residual-state check. D1 cannot be reported as backend acceptance.

### [P1] The plan was mostly engineering and did not fully rebuild Synera as a business

It named a segment and pilot metrics but omitted executable artifacts for ICP, offer ladder, interviews, manual baseline, organizer acquisition, pilot operations, willingness-to-pay, support economics and go/no-go decisions.

Resolution: v2 adds an independent business lane with six artifacts and its own reviewer gate. It can run in parallel with code only because it writes to a disjoint plan-output folder and performs no outreach.

### [P1] The live-state summary contradicted current evidence

One table said live Auth/DB were blocked while the current repository contains a historical r8 receipt for a private Neon/Cloudflare pilot. Conversely, that receipt could be misread as current remote or two-person acceptance.

Resolution: v2 separates fresh local proof (80/80 and offline build), historical private-live receipt, unrefreshed remote state, missing second-person journey and missing business validation.

### [P1] Generated Neon SQL was treated as an editable source

`neon/schema.proposal.sql` explicitly says it is generated, and `neon/worker.test.mjs` verifies exact generation from canonical Supabase sources. Direct editing would be overwritten or create source/output drift.

Resolution: v2 permits changes to `supabase/real-pilot.proposal.sql` and `supabase/real-pilot.acceptance.sql`, then requires `neon/generate-schema.mjs` and byte-equality tests. Generated outputs are inspected, not hand-maintained.

### [P2] The provider budget conflated two different free routes

OpenRouter `:free` model IDs and TokenRouter `z-ai/glm-5.3-free` are different providers, credentials and receipt authorities. The earlier wording could lead a weak worker to strip a suffix or reuse the wrong key.

Resolution: v2 states provider-specific IDs/adapters/doctor checks, disables fallback, limits discovery to three candidates with one attempt each, and rejects missing actual identity/cost receipts.

### [P2] The baseline count was stale and incomplete

The first plan quoted the 39-test targeted subset. The full currently discovered `web_launch` + `neon` suite is 80/80.

Resolution: Wave 0 now freezes the 80-test result and 26-file offline build, records branch/HEAD/dirty paths/source hashes, and stops on unexplained drift.

### [P2] “Large swarm” lacked a hard file-ownership rule

Multiple intelligent workers touching `matching.mjs`, `business-case.mjs`, `app.mjs` or SQL sources would create conflicts and hide regressions.

Resolution: maximum three active workers including the integrator; one writer per file; only `depends_on`-ready and file-disjoint tasks may run in parallel. Many microtasks are queued sequentially through the existing control plane, not launched as an uncontrolled agent cloud.

### [P2] The $10 envelope had stage amounts but weak call limits

Without maximum call counts, retries could burn the budget while still staying under ambiguous per-stage wording.

Resolution: v2 caps B1/B2/B3/B4 at 2/1/1/1 calls respectively, total $10, and allows retries only for a recorded transient transport failure. Unused budget remains unused.

## Open Questions

1. Which exact trusted community or organizer is the first pilot source? No relationship or event date is treated as confirmed.
2. Is `joint_project` included in the first cohort or only preserved for compatibility? v2 recommends preserving but parking it until its fields are agreed.
3. What retention/deletion periods and processor roles will qualified Swiss review approve? The plan records these as open decisions, not legal answers.
4. Is an isolated database available for D2? Without it, the generated persistence proposal remains `PRESENT_BUT_UNTESTED`.
5. Execution route is not yet selected: A `$0` or B `up to $10`, with only synthetic/redacted external task cards.

## Test Gaps

- No mutation test has been run against future four-mode/case code because implementation has not started.
- The historical private site was not reopened or mutated in this planning turn.
- No disposable-database RLS test exists for the proposed pair-case schema.
- No second authorized person, physical-device journey, 10-pair cohort, customer outcome, willingness-to-pay or commercial ROI evidence exists.

## Summary

V2 removes the two most dangerous shortcuts: persistence before semantics and mock tests masquerading as database security. It also turns the artifact into a business rebuild plan rather than a code-only backlog. The honest overnight target is D1 offline acceptance; D2–D5 remain separate, evidence-gated outcomes.
