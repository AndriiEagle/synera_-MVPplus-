# Weak-model dispatch protocol v2

Status: protocol only. It does not compile, queue or launch tasks. After the master plan is approved, compile one step at a time.

## Authority

- Codex/Astra-equivalent integrator owns architecture, ambiguity resolution, file allocation, acceptance and final status.
- Luna/Spark owns exactly one bounded task and stops after its acceptance marker.
- Terra-equivalent reviewer receives evidence, not the intended answer, and never reviews its own implementation.
- Sol-equivalent integrator may repair one cross-file defect only after a failing semantic test and reviewer finding exist.
- External Chinese models receive only public or synthetic/redacted interface/test packs; no raw repository, transcript, profile, contact, secret or production state.
- Deterministic microagents calculate/validate; none may send, publish, migrate, charge, record, rank a person or approve itself.

## Concurrency and ownership

At most three active workers including the integrator. A worker owns the exact files in its task card. Two tasks with any overlapping file are sequential. Read-only/report-only tasks may run with a writer. The integrator rereads `git status`, the owned-file hashes and the actual diff after every result.

Suggested first ready waves after approval:

| Join | Worker A | Worker B | Integrator/reviewer |
| --- | --- | --- | --- |
| J0 | none | none | `CNR-001` baseline/preservation alone |
| J1 | `CNR-002` synthetic oracle | `CNR-020` ICP/offer draft | inspect artifacts; no code yet |
| J2 | `CNR-003` matcher-core schema | `CNR-021` interview/manual baseline | verify disjoint files and test output |
| J3 | `CNR-004` paid-service semantics | `CNR-022` organizer packet | integrate only after both markers |
| J4 | `CNR-005` referral/hybrid | `CNR-023` pilot operations | then stop at reviewer barriers `CNR-006` and `CNR-025` |

After J4, run one domain lane at a time because `profile-brief.mjs`, `business-case.mjs`, `app.mjs`, store adapters and SQL contracts have dependencies. Do not create more workers to “go faster”; queue more small tasks instead.

## Executor card

Give a weak model only this card populated from one JSON step:

```text
# Microtask
Plan revision: 2
Step ID: <exact step_id>
Objective: <one observable outcome>
Depends on: <accepted markers only>
Current branch/HEAD: <from CNR-001 receipt>
Owned files and expected SHA-256: <exact list>
Must preserve: <copy from the step plus prior markers>

Do:
1. Read the dependency receipt and owned files.
2. State whether the edit is additive, compatible replacement, or blocked.
3. Make only the assigned change.
4. Run the exact semantic validation command.
5. Inspect the owned-file diff.
6. Stop after writing the exact acceptance marker.

Do not:
<step negative_prompt and 3-7 task-specific negative_examples>

Stop conditions:
BLOCKED_MISSING_CONTEXT
BLOCKED_SCOPE_CONFLICT
BLOCKED_FORBIDDEN_FILE
BLOCKED_SECRET_RISK
BLOCKED_VALIDATION_IMPOSSIBLE
NEEDS_HUMAN_APPROVAL

Validation:
<exact commands and expected semantic behavior>
Mutation proof, when required: <guard removed/changed -> named test must fail -> restore>
Acceptance marker: <unique marker>
Rollback: <exact owned files/hunks; never reset the worktree>

Final response shape:
Result label:
Files changed:
Dependency markers read:
Validation command/result:
Mutation result, if required:
Acceptance marker:
Risks/limits:
Rollback notes:
Next blocker:
Provider receipt: none OR exact requested/actual model, tokens, cost, truncation, ledger row
```

## Integrator acceptance

A worker’s message is not evidence. The integrator checks:

1. Branch/HEAD and dirty baseline still match the preservation receipt except named owned files.
2. No file outside `allowed_files` changed.
3. Each dependency marker is present and its must-preserve behavior still passes.
4. The validation asserts user-visible semantics, not a constant/string/snapshot only.
5. A required mutation actually made the named test fail before restoration.
6. Generated files match canonical sources; no generated SQL was hand-edited.
7. `PRESENT_BUT_UNTESTED` is not promoted to working or live acceptance.
8. Provider work, if any, has requested/actual identity, nonempty/non-truncated output, budget and authoritative receipt; local acceptance remains separate.

Outcome is one of `PASS_VERIFIED`, `PASS_VERIFIED_WITH_LIMITS`, `NEEDS_REWORK`, or `BLOCKED`. No next dependent task starts after `NEEDS_REWORK` or `BLOCKED`.

## Worker ROI

Quality is lexicographic: first pass the same frozen task-shaped oracle, then compare cost and time. Record:

- accepted or rejected output;
- integration minutes;
- rework count;
- provider USD from receipt;
- elapsed wall time;
- regression count;
- proof level reached.

Do not report subscription-token savings without a comparable billing baseline. A `$0` call that fails the oracle is not a saving; it is rejected work.
