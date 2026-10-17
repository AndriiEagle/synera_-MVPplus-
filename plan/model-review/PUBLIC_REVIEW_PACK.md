# Public synthetic review pack: Synera solo-business rebuild

Classification: `synthetic`

This is an abstract product and execution contract. It contains no customer records, contacts, transcripts, credentials, local paths, private repository text, production identifiers, or unpublished partner claims.

## Product contract

Synera helps two solo professionals or small service businesses explore one small business collaboration. Its smallest useful unit is:

`declared current need -> declared complementary contribution -> explicit mutual interest -> non-binding pair case -> versioned material terms -> two approvals -> introduction request -> small trial -> independently accepted outcome`

The system may compile and explain a candidate. It may not decide trust, human worth, competence, price, legal status, contractual agreement, or success probability. Facts, interest, price, terms, delivery, acceptance, and any contact disclosure remain human-confirmed.

Sensitive traits, relationships, financial circumstances, health, religion, migration status, diaries, contact lists, subscription tier, and untrusted free-text instructions must not affect matching.

## Candidate modes

- `exchange`: both parties declare a current need and a relevant contribution.
- `paid_service`: a supplier's declared service covers a buyer's declared need and both explicitly select the paid mode. This is only a candidate; compensation stays unresolved until both approve explicit terms.
- `referral`: an introducer may propose a connection only when source, intended recipient, benefit, third-party uncertainty, and any referral compensation are explicit. No third-party agreement is assumed.
- `hybrid`: a named combination whose components must each be eligible. A valid exchange leg cannot hide an invalid paid or referral leg.
- `joint_project`: preserved for compatibility but parked from the first pilot until its fields are separately defined.

Legacy profiles remain usable for legacy exchange behavior. Missing new-mode fields produce `needs_information`; they do not corrupt or silently rewrite the old profile.

## Architecture and authority

There is one existing deterministic matcher, one profile-to-minimal-brief bridge, one non-binding business-case compiler, one canonical persistence-source chain, and one operator-controlled provider router/ledger. The rebuild must reuse them rather than create parallel authorities.

The intended order is:

1. Freeze source state, user-visible invariants, and at least 20 synthetic positive/negative cases.
2. Extend mode semantics in the existing matcher.
3. Bridge the modes through the minimal profile contract.
4. Upgrade the existing case compiler to a versioned case representation.
5. Add one pure material-terms and approval guard: canonical payload, version, content hash, two current approvals, expiry, revocation, and automatic invalidation after a meaningful material change.
6. Only then propose persistence in canonical SQL sources and generate derived SQL. Generated SQL is never hand-edited.
7. Build a local synthetic two-person workflow and denominator-preserving event contract.
8. Run independent review, mutation tests, full local tests, and an offline build.

No deployment, production migration, registration opening, participant outreach, payment, recording, automated messaging, or live provider use is part of offline acceptance.

## Evidence levels

- D0: decision-complete plan.
- D1: offline pilot candidate with semantic tests, mutation proof, synthetic journeys, complete local test suite, and offline build.
- D2: backend candidate tested on a disposable isolated database, including real row-level-security adversarial cases.
- D3: private two-person pilot with fresh remote evidence and two authorized people.
- D4: business feasibility after a fixed 10-pair/14-day cohort and measured outcomes/costs.
- D5: commercial launch readiness.

The overnight target is D1. D2 is optional and cannot be inferred from generated SQL or mocks. D3-D5 require people, elapsed time, and separate authority.

## Business learning contract

Initial hypothesis: one trusted professional community supplies solo professionals and small service businesses with one current commercial need, one concrete contribution, and capacity for a small trial. No community, organizer, event date, demand, willingness-to-pay, retention period, or legal conclusion is treated as confirmed.

The first pilot is assisted and allowlisted. A proposed learning gate is 10 unique pairs over 14 days, at least 5 mutually agreed briefs, and at least 3 recipient-accepted trial outcomes. This is a feasibility threshold, not statistical proof or ROI.

Always report denominators: eligible pairs, shown cases, bilateral interest, accepted meeting, agreed trial, completed trial, accepted outcome, missing feedback, dispute, repeat request, operator minutes, direct cash cost, and the organizer's manual-introduction baseline. Unknown cost remains unknown, never zero. No billing occurs in the first feasibility pilot.

## Execution envelope

- Maximum three active workers including the integrator; one writer owns a file at a time.
- A worker receives exactly one step, explicit dependencies, allowed files, invariants, negative cases, validation, rollback, and a unique acceptance marker.
- A worker cannot accept its own output. Reviewer gates follow each fragile batch.
- Hosted models receive only public/synthetic/redacted bounded packs and never raw customer/repository material.
- Quality is lexicographic: first pass the same frozen oracle, then minimize cost, time, and rework.
- Paid fallback has a total task ceiling of USD 10, fresh price preview, no fallback routing, exact actual-model identity, authoritative receipt, and local acceptance. Unused budget stays unused.

## Required review behavior

Be adversarial. Do not praise the plan and do not restate it. Identify only material defects, contradictions, missing states, unsafe shortcuts, untestable acceptance language, or wasteful sequencing.

For every finding provide:

- severity: `P0`, `P1`, `P2`, or `P3`;
- affected stage or contract;
- concrete failure scenario;
- why the current contract fails to prevent it;
- smallest safe correction;
- semantic test or observable evidence that would prove the correction;
- false-positive risk or trade-off.

Also list proposals you explicitly reject as overengineering. If no material defect exists in an area, say so. Do not invent code, file names, market facts, laws, prices, provider availability, or customer evidence.
