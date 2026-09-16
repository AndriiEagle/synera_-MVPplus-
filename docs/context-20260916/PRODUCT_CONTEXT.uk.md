# Повний продуктовий контекст для наступного виконавця

R2 відновлює джерельний scope поверх незмінного R1. Це план/індекс, не виконаний rebuild. Оригінальні recordings не публікуються. Архівні completion labels і дозволи не стають поточними.

## Продукт і режими

Synera допомагає двом солопідприємцям підготувати взаємокорисну співпрацю: потреба → пояснена пропозиція → власний інтерес кожної сторони → версійовані умови → пробний результат → приймання отримувачем. Режими: exchange, paid_service, referral, hybrid; joint_project зберігається як окремий режим/пізніший scope. Barter не обов’язковий.

AI готує чернетки й пояснення; люди погоджують свої дії. Різна кількість розкритих даних не означає різну цінність людини. Дані, статуси, правила адаптації й ціна перевіряються окремо.

## Які документи раніше були поза GitHub-пакетом

[Архів V4](archive/MASTER_PLAN_V4.json) має 26 кроків; [архів V5](archive/MASTER_PLAN_V5.json) — 23; [V6](../multihost-20260915/V6_TASKS.json) — 19. Це revisions/addenda із перетинами, їх не можна просто скласти в 68 активних задач. [CONTEXT.json](CONTEXT.json) дає hashes/locators та явні gaps. Original SINGLE_CONTEXT, Genesis і Bible доступні в приватному docs-пакеті; публічні проєкції тут виключають приватні історії.

## Усі 16 вимог — без втрати acceptance clauses

Статус нижче оцінює покриття планом, а не runtime. Посилання на V6 означає related work, не завершення всіх clauses.

### P01 — Profile

Explicit capabilities, current needs, desired result, availability and allowed collaboration modes

**Acceptance:** Old profile imports remain valid; new fields default private/unconfirmed.

**Coverage:** PARTIAL. Related V6: V6-13. Profile schema/needs/availability needs legacy-source preservation; import task alone does not cover every field.

### P02 — Matching

Extend existing matcher for exchange, paid_service, referral, hybrid

**Acceptance:** Both parties allow mode and have current availability. Exchange requires bilateral skill fit; paid_service requires explicit compensation interest on both sides; referral requires agreed referral scheme and third-party contact consent; hybrid validates each component; joint_project requires shared outcome and contributions. Positive and negative cases for each mode.

**Coverage:** PARTIAL. Related V6: V6-10. Preserve all five modes and component eligibility; capacity task is not full mode implementation.

### P03 — Mutual interest

Both participants independently confirm current interest

**Acceptance:** One-sided click cannot confirm the other party; revocation closes consent-dependent actions.

**Coverage:** PLANNED_NOT_ACCEPTED. Related V6: V6-03, V6-04, V6-05, V6-06. Own-party interest and approval require actual persistence/auth acceptance.

### P04 — Case revision

Immutable revisions of proposed collaboration terms

**Acceptance:** Both accept identical revision/hash. Any change to agreed content including scope, price, deadlines, acceptance, IP, confidentiality or termination resets both acceptances; cosmetic UI outside agreed content does not. Retention is separately governed.

**Coverage:** PLANNED_NOT_ACCEPTED. Related V6: V6-03, V6-04, V6-14. Material version/hash invalidation; client transport defect remains open.

### P05 — Terms

Scope, out-of-scope, deadlines, compensation, acceptance, IP, termination

**Acceptance:** Missing required terms cannot become agreed; no guessed financial values.

**Coverage:** PARTIAL. Related V6: V6-03, V6-14. Complete terms and missing-field behavior remain domain/UI acceptance requirements.

### P06 — Evidence

Service-specific evidence with owner, source, scope, date and status

**Acceptance:** Track provenance, verification and freshness separately; expiry never erases historic evidence or implies low competence. Expired eligibility blocks current regulated expert dispatch where required.

**Coverage:** PARTIAL. Related V6: V6-09, V6-14. Source/scope/provenance/expiry are distinct; freshness alone is not evidence verification.

### P07 — Expert review

Qualified expert reviews consented fact pack for a specific subject

**Acceptance:** Check subject competence, jurisdiction, current evidence, conflicts and referral fees before dispatch; license only where applicable. No eligible expert means pending, no arbitrary substitution.

**Coverage:** EXPLICITLY_PARKED. Related V6: немає. Qualified expert workflow is retained in full spec; not assigned an implementation card in V6.

### P08 — Delivery

Record submitted trial output and recipient decision

**Acceptance:** Submission alone is not acceptance; dispute is represented without automatic guilt.

**Coverage:** PARTIAL. Related V6: V6-14. Recipient acceptance is related; full submitted-output/dispute behavior needs explicit coverage.

### P09 — Feedback

Immediate and optional delayed outcome feedback

**Acceptance:** No reply is missing data; not negative competence or automatic credit penalty.

**Coverage:** MISSING_DEDICATED_OWNER. Related V6: V6-11. V6-11 funnel is related; immediate/delayed feedback has no V6 owner/acceptance.

### P10 — Privacy

Granular consent, purpose, access, retention and export

**Acceptance:** Hidden profiles remain undiscoverable; revocation prevents new model dispatch; retention policy covers derived data.

**Coverage:** PARTIAL. Related V6: V6-13, V6-16. Granular permissions and derived-data retention require backend/browser/human checks.

### P11 — AI

Reuse canonical adapter, schema validation and source attribution

**Acceptance:** Untrusted profile text cannot authorize actions; output never invents skills, price or legal conclusions.

**Coverage:** CROSS_CUTTING_SOURCE_REVIEW. Related V6: немає. Reuse canonical adapter/schema/source attribution; no V6 dedicated implementation owner.

### P12 — Communication

Draft introduction and schedule via existing flow

**Acceptance:** No message or recording without explicit user action and appropriate participant consent.

**Coverage:** PARTIAL. Related V6: V6-12. Calendar overlap does not replace invitation/chat/recording-consent behavior.

### P13 — Economics

Measure variable cost per useful outcome before billing

**Acceptance:** Unknown cost stays unknown; paid tier cannot buy a higher competence score.

**Coverage:** PARTIAL. Related V6: V6-11, V6-18. Measure all variable costs; unknown remains unknown; no competence score for payment.

### P14 — Pilot

Fixed denominator funnel with missing-data and repeated-participant tracking

**Acceptance:** Predeclare cohort, observation period, fixed denominators, decision thresholds and baseline. Suggested operational pilot: 10 disjoint pairs, 14 days, 5 mutually agreed briefs and 3 accepted trials; these are proposals, not observed demand. Track repeated participants, response rate, willingness to pay and support costs; no causal AI claim from nonrandom comparisons.

**Coverage:** EXTERNAL_GATE. Related V6: V6-17, V6-18. Proposed cohort thresholds are not measured demand.

### P15 — Migration

Versioned extension using current profile/store/backend

**Acceptance:** Old exports round-trip; permissions and deletions preserved; no second durable store.

**Coverage:** PARTIAL. Related V6: V6-03, V6-04, V6-13, V6-16. All legacy exports/permissions/deletions need migration oracle; no new durable store.

### P16 — Cold start

Explicit state when suitable candidate is absent

**Acceptance:** No fabricated participants or AI-generated evidence; invite a real colleague through authorized flow.

**Coverage:** MISSING_PRESERVATION_ORACLE. Related V6: V6-02, V6-08, V6-15. Cold start exists in app.mjs:355-376; generic V6 empty-state tasks do not own its full preservation oracle.

## Попередні функції: не втрачати при rebuild

| Можливість | Перевірене джерело | Межа |
|---|---|---|
| Google Maps + location capture source | legacy_map:42-57,111-205 | SOURCE_PRESENT_RUNTIME_UNPROVEN |
| Consent-gated city-centre map, optional OSM, no live GPS | web_map:23-28,30-74 | SOURCE_PRESENT_RUNTIME_UNPROVEN |
| Discoverability/map visibility/modes | web_app:43-77 | SOURCE_PRESENT_RUNTIME_UNPROVEN |
| Browse/filter and truthful cold-start real-colleague path | web_app:355-376 | SOURCE_PRESENT_RUNTIME_UNPROVEN |
| Material/hash/approvals with known persistence defect | web_app:233-334 | SOURCE_PRESENT_KNOWN_DEFECT |
| Meeting/chat and accepted-meeting ICS export | web_app:421-435 | SOURCE_PRESENT_RUNTIME_UNPROVEN |
| Consent/block/export/delete controls | web_app:506-507 | SOURCE_PRESENT_RUNTIME_UNPROVEN |

Import/portability також зберігаються через наявні profile-import, profile-portability, chatgpt-transfer. Calendar має accepted-meeting/time validation. App navigation/auth та account controls потребують свого regression coverage при source transfer, не лише загального «нового дизайну».

## Юридичний ланцюжок V5 (E1–E5): не перенесений у R1/R2

[Архів V5](archive/MASTER_PLAN_V5.json) мав окрему хвилю `E_legal` з пʼятьма кроками поза простором P01–P16 (тому вони поза схемою [CONTEXT.json](CONTEXT.json) і не зʼявляються в таблиці вимог вище):

| V5 step_id | Артефакт | p_refs | Стан у R1/R2 |
|---|---|---|---|
| E1-privacy-notice-draft | Privacy Notice v1 (7 consent-пунктів) | LEGAL-P0-01, P10 | EXPLICITLY_PARKED — немає V6/R2 картки |
| E2-tos-draft | ToS v1, 12 clauses | LEGAL-P0-02 | EXPLICITLY_PARKED |
| E3-dpa-scc-package | DPA/SCC processor checklist | LEGAL-P0-03 | EXPLICITLY_PARKED |
| E4-retention-schedule | Retention schedule (proposals) | LEGAL-P2-02 | EXPLICITLY_PARKED |
| E5-dpia-template | DPIA template (one-page) | LEGAL-P2-01 | EXPLICITLY_PARKED |

P10 (Privacy) вище покриває вимогу на рівні продукту (granular consent/retention/export), але не ці пʼять конкретних юридичних артефактів. Жоден не отримав V6 чи R2 картку. Це не помилка R1/R2 — обидва явно не брали на себе legal-scope — але для швейцарського пілоту (FADP/GDPR) це відкрита прогалина, яку варто закрити до, а не під час, першого реального пілоту.

## Карта — обов’язкова явна частина scope

[GEO-01: Maps і тимчасова live-локація перед зустріччю](MAPS_AND_LOCATION.uk.md) відділяє legacy Google Maps, чинну city-only web map і нову чітко описану поведінку sharing/navigation. Немає підстав видаляти карту чи оголошувати live-навігацію готовою.

## 61 висновок і 24 оцінки тверджень

[INSIGHTS.json](INSIGHTS.json) зберігає всі C01–C43 та D01–D18 як абстрактні продуктові рішення з locator оригіналу. Стовпці приватних історій не публікуються. [CLAIM_DISPOSITIONS](archive/CLAIM_DISPOSITIONS.json) зберігає F01–F24 та source index як архів від 2026-09-07. Це не 24 feature requirements і не свіжі правові/ринкові висновки. Позначка VERIFIED в historical_status — лише тодішня оцінка; перед поточним використанням потрібна нова перевірка.

## Адаптація, економіка, дизайн і виконання

Детальний [PRODUCT R1](../multihost-20260915/PRODUCT.uk.md) зберігає три рівні адаптації, granular presets 0–5, DE-CH direction, accessibility та parked agent-to-agent freelance. [OPERATIONS R1](../multihost-20260915/OPERATIONS.uk.md) зберігає один інтегратор, глобальну стелю 3 workers, Harness/Context Gateway/Token Monster/KI-BUS, serial shared-file mutation, receipts і recovery. Це не заміна джерельного scope вище.

**Пріоритет наступної execution постановки:** source inventory → явно закрити ownership gaps у чинному плані → per-party approval contract → regression-before-fix. GEO-01 збережена й потребує окремого bounded implementation contract. Жодний пункт цього документа сам не dispatches work.
