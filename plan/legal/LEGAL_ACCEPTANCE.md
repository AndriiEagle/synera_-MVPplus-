# Legal-layer local acceptance — 2026-09-23

## Scope

Integrated under `plan/legal/*`. The served `web_launch/legal.html`, login code and policy version remain paired and unchanged. The new page is `plan/legal/LEGAL_PAGE_DRAFT.html`, outside the published web root. Not changed: server, DB, PWA, CSS, matcher, QR-bill, deployment, provider accounts, secrets.

## Oracle

`node --test plan/legal/legal-acceptance.test.mjs` validates that the draft is explicitly non-active, distinguishes base admission from four distinct operational choices, refuses unfounded provider-contract claims, cites the primary-source set, and detects deletion of the external-AI hold. It also reads the real code to prove the served legal page matches the policy version recorded at login and that replacing it with the draft fails.

## Readback verdict

`PASS (local content/flow boundary only)` means the page and plan state the same constrained claim. It does **not** prove legal compliance, live account configuration, DPA/SCC execution, participant acceptance, a durable granular-consent ledger, QR-bill conformance, or deployment readiness.

## Change-control gate

The draft may become active only after a qualified review, an immutable identical text/hash tied to a new `POLICY_VERSION`, enforced re-acceptance for a material change, and a targeted end-to-end acceptance test. Until then: registration, embedded external AI, recording, auto-publication and QR-bill activation stay off.
