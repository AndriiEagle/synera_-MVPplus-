# CNRA / Synera: overnight rebuild plan for solo entrepreneurs — v4 (GENESIS)

## Доповнення V6 — 15.09.2026

[Повна технологічна карта workflow](v6/workflow/WORKFLOW.uk.md): усі 19 карток доповнені контрактами передачі й відновлення. V6-00 відтворений окремим семантичним probe: control PASS, forged-peer approval FAIL. Це клієнтський контракт, не доведений обхід live RLS; реалізація B2 ще попереду. Структурний validator використовує canonical Harness, продуктове приймання — чинний materializer і лишається HOLD.

[План економних хвиль, дизайну, математики й пам'яті](v6/EXECUTION_PLAN.uk.md), [19 задач із залежностями та прийманням](v6/TASKS.json), [handoff виконавцю](v6/HANDOFF.uk.md). Це доповнення плану, не нова реалізація. Свіжо перевірено 140/140 тестів на HEAD `2aa7fae`; нижче збережені історичні зрізи. Один Ling FIN free review коштував $0.00; два з п'яти висновків відхилено локально. Надані на DeepSeek $0.50 не витрачені: платний preflight блокує помилки старих планів. V6 уточнює математичні припущення та порядок виконання, зберігаючи продуктові інваріанти V5.

**Mode:** `plan_and_local_D1_execution`  
**Status (2026-09-11 evening, verified on disk and in a browser):** `WAVES A+B, X1-X5, A13, F1-F7, G7, C0-C5 (PRESENT_BUT_UNTESTED), D1-D2 IN CODE — 130/131 (the one failure is a duplicate consent panel from a parallel Kilo session); NOT DEPLOYABLE until the case-state migration ships with it` — full ledger in [bible/SYNERA_BIBLE.md §S](bible/SYNERA_BIBLE.md) and `bible/SYNERA_BIBLE.json → status_ledger`.  
**Scope:** move the next Synera iteration from a broad mutual-help concept to a controlled pilot for solo entrepreneurs and small service businesses.  
**This document does not authorize:** deployment, signup opening, database migration, mailing, payment collection, additional provider calls, or sending private transcript/profile data to a model. The operator separately authorized the bounded synthetic review calls recorded below; that authority is exhausted for this review wave.

## V4 GENESIS additions (2026-09-10)

Council-verified upgrade of this package (Saske audit accepted, Tatsuya anchor verification applied, Brat operator echo, Natsu path-lesson):

- [GENESIS_SPEC.uk.md](GENESIS_SPEC.uk.md) — master synthesis: self-review, geometry, wave order, decision board, done-criteria.
- [SASKE_AUDIT_RESPONSE.uk.md](SASKE_AUDIT_RESPONSE.uk.md) — every P0/P1 finding mapped to a fix; verdict path RED → AMBER → GREEN.
- [legal/SWISS_LEGAL_LAYER.uk.md](legal/SWISS_LEGAL_LAYER.uk.md) — Swiss law table, 7-consent matrix, ToS 12 clauses, TOP-11 gaps, minimum viable legal for D1–D4.
- [ux/GOD_MODE_UX_TELEMETRY.uk.md](ux/GOD_MODE_UX_TELEMETRY.uk.md) — 7 God-mode principles, 8 ethical patterns, telemetry schema, operator cockpit, steps G1–G8.
- [import/AI_MEMORY_IMPORT.uk.md](import/AI_MEMORY_IMPORT.uk.md) — GPT/Claude/LinkedIn import pipeline (local redaction, human confirm, flag OFF), steps F1–F7.
- [bible/MASTER_PLAN_ADDENDUM_V5.json](bible/MASTER_PLAN_ADDENDUM_V5.json) — machine-readable waves E/F/G/H.
- [bible/SYNERA_BIBLE.json](bible/SYNERA_BIBLE.json) — anchor-verified 2026-09-10: 18/23 exact, 5 fixed (A4, A12, B3, C5, D1).

Execution order: **A → B → G → F → C → D**, legal lane E in parallel, operator decisions H1–H3 with deadlines in GENESIS_SPEC §6.


## The decision we are locking

The product is not “a social network which introduces interesting people”, and it is not an AI that decides who is trustworthy. Its smallest useful product is a **business case for a pair**:

`declared current need -> declared complementary contribution -> explicit mutual interest -> small trial with terms -> accepted result -> bilateral delayed feedback`.

The pilot customer is a freelancer or owner of a small service business, initially through a trusted professional community in Zurich/Switzerland. The transcript-derived boundary excludes migration status, financial situation, religion and health from selection and asks for minimal professional data. **V3 adds a privacy/integrity guard**: relationship data, personality ratings, diaries, contact lists, subscription tiers and arbitrary instruction text cannot alter matching. Declared business text may help draft structured fields only after explicit human confirmation; untrusted free text never executes an instruction or directly changes eligibility. The system can show a structured proposal, but people confirm facts, interest, price, terms, delivery, and acceptance.

The currently verified base is already valuable: `matching.mjs` has a local deterministic comparator; `business-case.mjs` produces a non-binding discussion draft; profile/AI code separates consent. The **pre-D1** 2026-09-09 baseline was **80/80** discovered Node tests and a non-published 26-file offline package. After v3 implementation and adversarial repair, the complete discovered suite passed **97/97** across 11 test files and the offline build again emitted 26 unpublished files. The new semantic tests first failed on direct material tampering and an outsider in pair material, then passed after repair; the earlier case-disclosure mutation also failed its guard test and passed after restoration. A historical r8 receipt records a private Neon/Cloudflare pilot with RLS checks and one owner login/profile round-trip; it was not revalidated remotely in this turn. The checkout is dirty on `codex/synera-documentation-refresh`, so its modified and untracked files are a preservation constraint, not permission to overwrite them. It is **not** a proven business, broad self-serve signup, second-person accepted journey, database-ready migration, payment service, legal adviser, or autonomous agent system.

## V3 implementation snapshot

The locally verified domain slice now includes the four candidate modes in the existing matcher, an explicitly versioned matcher output plus a legacy-v1 brief shape for non-pilot profiles, a private/non-binding business-case v2, byte-canonical material terms with SHA-256, two exact current approvals, authorization-time hash recomputation, pair-participant ownership checks, monotonic caller-supplied D1 timestamps, expiry/revocation/abandonment/material-change invalidation, a pure introduction gate with separate permissions, caller-labelled real-versus-synthetic metric separation, and six synthetic journeys. Caller labels do not authenticate real events. The active UI, remote store and SQL proposal have not yet been promoted to this contract; therefore the result is **D1 domain core with limits**, not the full D1 workflow and not D2.

Independent hosted review receipts: two usable Ling reviews cost exactly `$0.00`; TokenRouter GLM 5.3 returned truncated output and was rejected at `$0.00`; one Kimi K3 specialist review cost `$0.019122` under a `$0.13` call cap. Accepted and rejected findings are recorded in `model-review/MODEL_REVIEW_SYNTHESIS_V3.uk.md`.

## What is existing versus what must be built

| Layer | Current evidence | Rebuild outcome |
| --- | --- | --- |
| Eligibility and reciprocal matching | `matching.mjs`, deterministic and consent-first | Extend the same comparator with explicit `exchange`, `paid_service`, `referral`, and `hybrid` semantics; no second matcher. |
| Pair business case | Non-binding deterministic draft, self-declared evidence only | A versioned case with each side’s outcome, a micro-trial, unresolved items, and both approvals. |
| Terms | Questions are shown, but no version lifecycle | One canonical terms payload, content hash, per-party approval and invalidation on meaningful change. |
| Consent and privacy | Several consent gates exist, including AI payload consent and private-pilot RLS evidence | Add durable, pair-specific case approval/version/revocation before an introduction; keep visibility separate from case consent. Then retain distinct visibility, comparison, introduction, external-AI, meeting-recording, summary-use, and communication permissions. |
| AI assistance | Guarded local/preview pathways exist | Optional, consented, minimum-payload draft helper. Never source of fact, contract, rank, price, or final action. |
| Pilot economics | Scenario model and conceptual metrics exist | Event ledger with denominators and manual baseline comparison—not an invented ROI score. |
| Live platform | Historical private r8 Neon/Cloudflare receipt exists; pre-D1 baseline was 80/80; post-repair local suite is 97/97 | Do not conflate local tests or the owner-only private pilot with current remote verification, a second-person journey, broad registration, commercial acceptance or the new case schema. |

## Evidence levels and honest definition of done

These levels cannot be skipped or merged:

| Level | Meaning | Minimum evidence | Can finish overnight? |
| --- | --- | --- | --- |
| D0 | Decision-complete plan | validated DAG, red-team findings, budget/authority boundaries | yes; this document |
| D1 | Offline pilot candidate | current-source manifest, semantic/mutation tests, full local suite, offline build, synthetic journeys | yes, realistic target |
| D2 | Backend candidate | generated migration from canonical SQL sources, disposable/isolated DB acceptance, no production mutation | only with a suitable test DB and separate approval |
| D3 | Private two-person pilot | fresh remote receipt, two authorized people, consent/case/invite/revoke/export journey, device check | not assumed overnight |
| D4 | Business feasibility | fixed 10-pair/14-day cohort, outcomes, missing feedback, operator time, manual baseline, willingness-to-pay | no; requires elapsed time and people |
| D5 | Commercial launch | pricing, payment/legal/data roles, support and incident readiness, approved deployment | no |

The overnight promise is **D1**. D2 is a stretch gate, not a promise. D3–D5 remain blocked until their own evidence exists.

## Business rebuild, not only a code rebuild

### Initial customer and job to be done

The initial customer is a solo professional or owner of a small service business with one current commercial need, one concrete contribution and capacity for a small trial. The first cohort comes from one trusted Zurich/Swiss professional community, not an open marketplace. The job is: “help me find one complementary professional, understand why the collaboration may help both of us, agree a small safe first result, and learn whether it actually worked.”

Exclude from the first positioning: all-purpose social network, migrant-assistance platform, tax optimizer, global digital-nomad guide, investor data list, talent ranking, job board, escrow/payment marketplace and AI negotiation agent.

### Offer ladder

1. **Free/assisted intake:** a structured business profile and one current need/contribution. This tests comprehension and profile completion, not demand.
2. **Pair case:** one explained candidate, mutual relevance confirmation and a 20-minute agenda. This is the activation event.
3. **Micro-trial:** one small result per side, or one paid/referral/hybrid result with explicit unresolved compensation until agreed. This is the product’s core unit.
4. **Outcome review:** each receiver confirms usefulness independently; absence of feedback remains visible.
5. **After the no-billing feasibility pilot and a predeclared WTP protocol:** test organizer subscription, pay-per-qualified-case, or transparent commission only with a separate human pricing decision. D4 evidence informs that decision; the transcript does not lock pricing to a fixed three-outcome threshold.

### Acquisition and pilot operations

- Recruit through one consenting organizer or professional community; prepare an operator script and landing text, but send nothing automatically.
- Use a controlled allowlist. Each participant sees the purpose, data fields, revocation path, expected time and “no guaranteed business result” statement before providing a profile.
- Compare Synera-assisted introductions with the organizer’s manual introduction on the same minimal information. This is an exploratory paired baseline, not causal proof.
- Keep support manual during the first 10 unique pairs. Record minutes spent on clarification, moderation, technical help and dispute handling separately.
- Do not optimize acquisition or add paid ads before one complete pair journey and one accepted result exist.

### Pilot scorecard and decision rules

The transcript-derived learning gate remains a **proposal**: 10 unique pairs over 14 days, at least 5 mutually agreed briefs, and at least 3 recipient-accepted trial outcomes. Also report every denominator: eligible pairs, shown cases, bilateral interest, accepted meeting, agreed trial, completed trial, bilateral useful result, missing feedback, dispute, repeat request, operator minutes and direct cash cost.

Decision rules for the first iteration:

- **Continue:** the 5/3 learning gate is met, there is no P0 privacy/consent failure, and operator support/cost are fully measured.
- **Repair workflow:** people understand the match but fail between approval, meeting and trial; do not blame the matching model.
- **Change segment or mode:** eligible profiles repeatedly lack mutual/paid/referral fit; do not “improve AI” to manufacture demand.
- **Stop live expansion:** any consent/contact leak, unverifiable recipient outcome, hidden missing-feedback denominator, or unresolved incident.
- **Pricing/WTP experiment:** define the protocol before asking, ask willingness-to-pay only after delivered value, and require enough real outcome/support-cost evidence for the predeclared decision rule. V3 may use three accepted outcomes as a conservative governance default, but that number is **not** a transcript-derived pricing gate and must not be silently treated as one.

### Economics that must be measured

Product contribution per completed case is:

`customer revenue - payment/VAT/provider costs - operator minutes × loaded hourly cost / 60 - dispute/refund cost - other variable cost`.

Unknown fields remain unknown, never zero. Report revenue, contribution, cash spend, support time and learning separately. The existing 1–2% examples are sensitivity scenarios, not a recommended price. Waitlist, registrations and model-call counts are not revenue or ROI.

## Correct definition of “autonomous microagent” here

A microagent is a bounded function with explicit input, output, stop state and no side effect. It is not a persona with authority. LLMs may suggest wording only behind the same deterministic gates.

| ID | Function | Inputs allowed | Output | Must refuse / cannot do |
| --- | --- | --- | --- | --- |
| M01 | **Profile readiness gate** | Owned normalized profile | missing/expired/ambiguous field list | infer competence, use sensitive fields, publish a profile |
| M02 | **Mode eligibility evaluator** | Two consented minimal briefs plus `asOf` | `eligible / needs_information / incompatible` with reasons | treat one-way value as paid agreement or invent compensation |
| M03 | **Reciprocal-value matcher** | M02-eligible pair and declared tags | explained two-way links, unknown-value marker | score human worth, success probability, price or trust |
| M04 | **Business-case compiler** | M03 result and each party’s stated goal | non-binding pair case with receiver-owned outcomes | swap parties’ outcomes, claim verified competence or acceptance |
| M05 | **Terms version guard** | declared scope, compensation mode, dates, acceptance and IP/privacy terms | canonical content hash plus approval state | bind a party silently, retain approval after a material change |
| M06 | **Introduction gate** | M02–M05 states and two explicit approvals | allowed/blocked reason | message anyone, expose contact data or book a meeting automatically |
| M07 | **Pilot metric collector** | pseudonymous event facts and explicit outcome feedback | funnel denominators, missing-feedback count, operator minutes | silently drop failures, call revenue or causal ROI |
| M08 | **Evidence freshness classifier** | declared evidence metadata: origin, subject, checked-at | `self_declared / historical / stale / verified-for-scope` | turn one prior result into global reputation |
| M09 | **Expert fact-pack compiler** | agreed minimal facts, jurisdiction/topic and consent | review pack or `no_qualified_expert` | provide legal/tax advice, select a random expert, transmit raw recordings |
| M10 | **AI draft firewall** | consented, redacted schema-valid text | draft questions / wording + validation receipt | send raw transcript, contacts, secrets or unreviewed model text to participants |

M01–M08 are deterministic-first. M09 and M10 may call an AI only after the product’s existing consent/redaction/cost gates, and still end in human confirmation. No autonomous messaging, matching publication, price setting, payments, reputation scoring, legal advice, expert assignment, recording, or data resale belongs in the MVP.

## MVP business modes: exact contract

1. **exchange**: both parties have a current need and each offers a relevant contribution. This remains the current bilateral baseline.
2. **paid_service**: a supplier’s declared service covers a buyer’s current need; both explicitly select the paid mode. The matcher may create a candidate, not an agreement. Price/currency/invoice/acceptance are unresolved until typed and approved by both.
3. **referral**: an introducer may propose a connection only after the source, recipient, benefit and any referral compensation are explicit. No statement that an unconsulted third party will agree.
4. **hybrid**: a named combination, e.g. small paid service + reciprocal feedback. Every component is independently eligible; an invalid paid leg does not become valid because the exchange leg is useful.

`joint_project` is not deleted; it is explicitly parked from the first pilot unless its joint output and contribution fields are separately specified. No legacy valid profile becomes invalid solely because a new field is unavailable; rather, the new mode is unavailable with `needs_information`.

## Milestones and dependency DAG

```text
F0 source + baseline
  -> F1 operating contract / frozen synthetic cases
  -> F2 mode schema + matcher
  -> F3 case v2 + terms/approval state machine
  -> F4 pair-case persistence proposal + generated SQL
  -> F5 profile / consent UI -> F7 local two-person journey
  -> F6 event metrics       -> F8 reviewer + mutation gate
  -> F9 D1 receipt
       -> [human gate] -> disposable DB D2 -> private two-person D3 -> 14-day business D4
```

The domain contract comes before its SQL representation. Generated `neon/schema.proposal.sql` and `neon/acceptance.sql` are never edited by hand: update their canonical `supabase/*.sql` sources, run `neon/generate-schema.mjs`, and prove byte-for-byte generation. F5 and F6 may run in parallel only when their allowed files are disjoint. A reviewer gate blocks the next wave after every three fragile code steps. Stable step IDs are historical identifiers; **`depends_on` is the execution authority**. Array order guarantees dependencies point backward but does not prohibit running a later ready, disjoint business task in parallel. Never sort IDs numerically. The complete machine-readable DAG is in [CNRA_SOLO_MASTER_PLAN.json](CNRA_SOLO_MASTER_PLAN.json); the one-task executor and first-wave joins are in [WEAK_MODEL_DISPATCH_V2.uk.md](WEAK_MODEL_DISPATCH_V2.uk.md).

## Waves that a weak executor can actually carry out

### Wave 0 — preservation and frozen oracle

1. Record branch/HEAD, dirty-file list, diff hashes and SHA-256 for every allowed source file before editing. Compare live checkout to the handoff snapshot; never apply the snapshot over live files.
2. Freeze 20 synthetic, privacy-safe test cases: positive and negative examples for the four modes; include unilateral value, stale profile, withdrawn consent, changed price, different receiver goals and contact/prompt injection.
3. Record the accepted invariant: no case/output before comparison consent; no mode becomes a contract; no personal/sensitive/untrusted free text changes the outcome.
4. Run the complete discovered Node suite and offline build. The original pre-D1 baseline was 80/80; the post-v3 adversarial-repair receipt is 97/97 and 26 offline files. Every new worker must record its own observed baseline; any unexplained difference stops the wave.

### Wave 1 — deterministic core (one writer at a time)

1. Extend the existing mode enum through one matcher and emit an explicitly new matcher contract version; preserve the legacy version-one brief shape for non-pilot profiles.
2. Implement/test `paid_service` candidate semantics. A candidate must state which requirement is covered, both parties’ mode confirmation and `compensation_unknown` when not agreed.
3. Implement/test `referral` and `hybrid`; use component-level reason codes.
4. **Independent reviewer gate R1:** matching symmetry, privacy projection, legacy exchange compatibility, every mode’s refusal cases and one deliberate mutation that must fail.
5. Upgrade the existing `business-case.mjs` representation to version 2 without adding another matcher or calling it an agreement.
6. Add a pure terms/case state machine: canonical material payload, content hash, two approvals, expiry/revocation, automatic invalidation after material change, authorization-time hash recomputation and participant ownership checks. Cosmetic UI text is excluded from the hash.
7. **Independent reviewer gate R2:** swap outcomes, stale approval, forged timestamp, price change, role reversal, withdrawn consent and prompt/contact injection.

### Wave 1B — persistence proposal after domain proof

1. Update canonical `supabase/real-pilot.proposal.sql` and `supabase/real-pilot.acceptance.sql`; generate Neon outputs through `neon/generate-schema.mjs`. Never hand-edit generated SQL and never re-run the historical empty-project schema on the existing project.
2. Model `match_cases` and `match_case_approvals` minimally: pseudonymous participants, mode, material payload/hash, version, status, expiry/revocation and server timestamps. No transcript/contact/free text beyond explicitly approved bounded fields.
3. Add RLS acceptance cases for A/B/anonymous, stale version, revoked case, block, forged client ID/timestamp, direct REST invitation and message attempts.
4. Label this `PRESENT_BUT_UNTESTED` until it passes against a disposable/isolated database. Node source-generation checks prove only generation and client contracts, not RLS behavior.

### Wave 2 — safe pilot workflow (disjoint work may be parallel)

1. Profile/onboarding UI exposes only business fields relevant to a selected mode and labels every declaration/evidence status.
2. Consent UI separates the seven permissions; revoking comparison or introduction prevents the next disclosure.
3. Build a local synthetic two-person journey: profile -> candidate -> two approvals -> terms version -> introduction request -> micro-trial -> manual outcome log. Keep deployed flags and adapters unchanged until D2.
4. Add an append-only, pseudonymous event schema for denominator-preserving funnel metrics. It must distinguish `not eligible`, `declined`, `no response`, `failed trial`, `accepted outcome`, and `feedback missing`.
5. **Independent reviewer gate R2**: include revocation, stale data, one-way value, rogue consent timestamps, prompt injection, lost network/reload and changed terms.

### Wave 3 — pilot readiness, not deployment

1. Prepare a 10-pair/14-day cohort protocol: source of recruitment, fixed observation window, unique pair rule, manual-introduction baseline, opt-out, support escalation and evidence retention/deletion policy.
2. Run at least six local synthetic end-to-end journeys, including the four modes and two refusals, plus a mutation run that demonstrates one critical guard fails when deliberately weakened. Save only synthetic receipts.
3. Get an authorised human decision before real invitations, Auth opening, database migration, expert referral, external AI, payment or recording.

The first commercial claim is only permitted after actual counts exist. The proposed learning threshold is ten unique pairs in fourteen days, at least five mutually agreed briefs and three accepted micro-trial outcomes. That is a feasibility threshold, not statistical proof of demand or ROI.

## Weak-model operating envelope

Every Luna/Spark task is one JSON-plan step, never a phase. Give it only the exact dependency acceptance markers, `allowed_files`, the invariant, negative examples, a test command and a rollback. It must stop on `BLOCKED_MISSING_CONTEXT`, `BLOCKED_SCOPE_CONFLICT`, `BLOCKED_FORBIDDEN_FILE`, `BLOCKED_SECRET_RISK`, `BLOCKED_VALIDATION_IMPOSSIBLE`, or `NEEDS_HUMAN_APPROVAL`.

Hard concurrency rule: maximum three active workers including the integrator; only one writer owns any file at a time. A “large swarm” means many queued microtasks through one canonical Harness, not many simultaneous agents. If two tasks list the same file, they are sequential even if their business topics differ. A worker never edits after its assigned acceptance marker; the integrator rereads the actual diff before the next dispatch.

Suggested execution assignment:

| Role | Suitable work | Not suitable |
| --- | --- | --- |
| Luna / Spark | One test file, one pure function, focused documentation, fixture matrix, report-only evidence collection | product architecture, cross-file migration, security acceptance, reviewer approval |
| Terra | independent review of one 3-step batch, adversarial test design | approving its own implementation or SQL security from prose |
| Sol | bounded cross-file integration/repair after reviewer evidence | live launch decision or product-strategy invention |
| Astra | contract decisions, ambiguity resolution, final local acceptance | mass editing, provider receipts, or replacing human pilot evidence |
| Chinese/free model candidate | public/synthetic contract critique or a patch proposal without private repo/context | raw profiles/transcripts, credentials, production mutation |
| Deterministic M01–M08 | repeatable gates/calculation/projection | semantic judgment or unsupervised action |

## $10 maximum execution protocol

**Route A — recommended, $0:** local tests/spec/fixtures plus a live free-model lane only for public or synthetic/redacted tasks. Keep providers distinct: OpenRouter free candidates use exact live `:free` IDs through canonical `swarm.py --free-only --budget 0`; TokenRouter’s separate candidate is exact `z-ai/glm-5.3-free` and requires its own authenticated doctor/adapter/receipt. Never substitute keys, strip suffixes, enable fallback or infer zero cost from missing usage. Maximum three distinct candidate IDs, one attempt each; record requested and actual model ID plus authoritative `cost=0` receipt. A catalog listing is not proof. Failure against the frozen oracle gives no implementation authority.

**Route B — guarded fallback, total ceiling $10:** use Token Monster only after a fresh price preview, deterministic redaction, current task approval, canonical ledger guard and a receipt. Amounts below are *hard per-stage ceilings*, not price assumptions:

| Stage | Max | Purpose | Gate to continue |
| --- | ---: | --- | --- |
| B1 implementation proposal | $3.50; max 2 calls | one redacted interface + frozen tests -> candidate proposal | actual identity/receipt; local oracle; no raw repository upload |
| B2 independent cross-family review | $2.50; max 1 call | review redacted diff/evidence without intended answer | different family from B1; must test a plausible failure |
| B3 bounded repair proposal | $2.00; max 1 call | exactly one named R1/R2 defect | failing test exists before repair and passes afterward |
| B4 final red-team / reserve | $2.00; max 1 call | one mutation/negative-case review | unused funds stay unspent; no “use the balance” objective |
| **Total** | **$10.00** |  | no retry except a documented transient transport failure |

No stage is allowed with missing identity, unknown/non-zero or mismatched receipt, fallback, truncated output, raw private content, failed redaction or an unavailable local oracle. Exact-zero transport evidence proves neither product quality nor legal/business acceptance. An LLM never accepts its own work. Actual v3 review spend is `$0.019122`; the remainder was not consumed.

Worker ROI is evaluated only after the same frozen oracle: `accepted useful output / (provider USD + integration minutes × operator rate + rework cost)`. A cheaper worker that fails the oracle has zero useful throughput. Subscription-token savings remain unavailable without comparable receipts.

## What can genuinely be done overnight

By morning, a small, strong team can complete **D1, the locally verified pilot candidate**: frozen product/business contract, four-mode matcher, pure case/terms/approval state, tests, synthetic journeys, metric schema, generated-but-unapplied persistence proposal, reviewer records and operator handoff. It cannot honestly complete D3–D5: second-person live acceptance, market validation, Swiss legal/compliance assessment, payments, external-data approval or the 14-day outcome metric.

## Immediate continuation order

1. Preserve the accepted domain-core diff and finish the missing active-UI consent/mode flow before any persistence proposal.
2. Only after the UI semantic gate, update canonical Supabase proposal sources, regenerate Neon outputs and keep them `PRESENT_BUT_UNTESTED` until an approved disposable database exists.
3. Before any real-person or remote action, return the changed-file list, local proof, exact spend receipts and the D2/D3 approval request.
