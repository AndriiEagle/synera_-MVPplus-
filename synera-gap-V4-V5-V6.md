# Synera Gap-аналіз: V4 → V5 → V6

Відтворено з `MASTER_PLAN_V4.json` (26 кроків), `MASTER_PLAN_V5.json` (23 кроки) та `V6_TASKS.json` (19 задач), звірено з `CONTEXT.json` R2 (P01–P16 + GEO-01).

Дата: 2026-09-16. Commit: `561f3d8`.

---

## 1. Структура трьох планів

| План | Кроків | Тип | Хто авторизував |
|------|--------|-----|-----------------|
| V4   | 26 (CNR-001..026) | Повний rebuild plan, 6 фаз | D1 domain-core, dispatch=false |
| V5   | 23 (E1..5, F1..7, G1..8, H1..3) | **Addendum** до V4 — 4 нові хвилі | Те саме |
| V6   | 19 (V6-00..18) | Окремий multihost plan | LOCAL_SOURCE_ONLY, dispatch=false |

V5 **не замінює** V4 — це додаткові задачі. V6 **не є продовженням** V4+V5 нумерації — це свіжий план під multihost-пакет. Саме цей розрив і є причиною прогалин.

---

## 2. Що перейшло V4 → V5

V5 додав чотири хвилі, яких у V4 не було:

| Хвиля | Задачі | Тема | Відношення до V4 |
|-------|--------|------|-------------------|
| E_legal | E1–E5 | Privacy notice, ToS, DPA/SCC, retention, DPIA | Нова хвиля — V4 не мав окремих legal-задач |
| F_import | F1–F7 | ChatGPT/Claude parser, redaction, schema mapper, import UI | Нова хвиля — V4 торкався P01 (profile), але не import pipeline |
| G_ux_telemetry | G1–G8 | Consent panel, approval animation, terms diff, outcome card, portability, cold-start, telemetry, dashboard | Нова хвиля — V4 мав review gates, але не UX-задачі |
| H_operator | H1–H3 | DB decision sheet, organizer sheet, route/model policy | Нова хвиля — V4 мав CNR-015 (human pilot decision), H1–H3 деталізують |

Статус на кінець V5: F1–F7 ✅ complete; G7 ✅ complete; G1 partial/broken; решта NOT STARTED.

---

## 3. Що перейшло V4+V5 → V6

### 3a. Задачі V6 з чіткими аналогами у V4/V5

| V6 | Назва | Аналог у V4/V5 | Що змінилось |
|----|-------|-----------------|--------------|
| V6-00 | Baseline + regression | CNR-001 (freeze source) | Звужено до B2-рівня |
| V6-03/04 | B2 store rework | CNR-016/017 (consent design + gate invitations) | Перефокус на per-party store |
| V6-06 | Case store → UI | G3 (terms diff), G4 (outcome card) | Об'єднано |
| V6-08 | Design + states | G2 (approval animation), G3–G5 | Об'єднано |
| V6-11 | Funnel denominators | CNR-023 (pilot ops), CNR-024 (pricing) | Вужче: тільки funnel math |
| V6-13 | Memory import review | F1–F7 (import chain) | Review існуючого, не побудова |
| V6-14 | Recipient proof | CNR-007 (business case v2) + P06/P08 | Перефокус |
| V6-15 | Local e2e acceptance | CNR-014 (synthetic pilot rehearsal) | Перейменовано |
| V6-16 | DB/RLS acceptance | CNR-016/017 + H1 | Об'єднано під external gate |
| V6-17 | Private pilot | CNR-023 + H2 | Під external gate |
| V6-18 | Cohort/business decision | CNR-024/026 + H3 | Об'єднано |

### 3b. Нові задачі у V6, яких не було у V4/V5

| V6 | Назва | Чому нова |
|----|-------|-----------|
| V6-01 | German-Swiss dictionary | Мовний аспект не був окремою задачею |
| V6-02 | Design specs + token proposal | Дизайн-система як окрема задача |
| V6-05 | Worker allowlist + access contract | Operational security нового multihost |
| V6-07 | Language selection (DE-CH/EN/UK) | i18n як окрема задача |
| V6-09 | Explained freshness | Нова math-вимога (M06) |
| V6-10 | Per-person proposal limits | Нова math-вимога (M07) |
| V6-12 | Shared calendar slots (Europe/Zurich) | Нова calendar-вимога (M17) |

---

## 4. Що ЗАГУБЛЕНО при стисканні V4+V5 → V6

Це ключова частина документа. Ці задачі/вимоги були у V4 або V5, але **жодна задача V6 їх явно не покриває**.

### 4a. Legal chain (E1–E5) → EXPLICITLY_PARKED

| Задача | Тема | P-вимога | Статус у V6 |
|--------|------|----------|-------------|
| E1 | Privacy Notice Draft | P10, LEGAL-P0-01 | PARKED |
| E2 | Terms of Service Draft | LEGAL-P0-02 | PARKED |
| E3 | DPA/SCC Checklist | LEGAL-P0-03 | PARKED |
| E4 | Retention Schedule Draft | LEGAL-P2-02 | PARKED |
| E5 | DPIA Template | LEGAL-P2-01 | PARKED |

**Наслідок:** без E1–E5 пілот із реальними людьми неможливий. Вірне рішення — парковка, не забуття.

### 4b. Research/business задачі V4 без явного V6-покриття

| V4 задача | Тема | Що з нею |
|-----------|------|----------|
| CNR-020 | ICP definition + offer | Частково у V6-18, але без окремого кроку |
| CNR-021 | Interview + manual baseline protocol | **Немає у V6** |
| CNR-022 | Organizer pilot packet | **Немає у V6** |
| CNR-025 | Business pilot design review gate | **Немає у V6** |

### 4c. UX/telemetry задачі V5 без явного V6-покриття

| V5 задача | Тема | Що з нею |
|-----------|------|----------|
| G5 | Data portability UI | **Немає у V6** (P10 залишається PARTIAL) |
| G6 | Cold-start logic validation | **Немає у V6** (P16 = MISSING_PRESERVATION_ORACLE) |
| G8 | Operator dashboard | **Немає у V6** |
| H1 | Disposable DB decision sheet | Частково у V6-16, але не окремо |
| H2 | Organizer decision sheet | Частково у V6-17, але не окремо |
| H3 | Route & model policy record | Частково у V6-18, але не окремо |

### 4d. GEO-01 (Maps/live location)

**Жодної задачі V6 не покриває GEO-01.** Вимога задокументована в `MAPS_AND_LOCATION.uk.md`, але залишається без виконавця. START_HERE R2 це визнає.

### 4e. V4 reviewer gates без явного V6-еквіваленту

| V4 задача | Тема | Що з нею |
|-----------|------|----------|
| CNR-006 | Reviewer gate: mode core | V6 не має окремих review gates — review implied у V6-15 |
| CNR-013 | Reviewer gate: workflow | Те саме |
| CNR-018 | Reviewer gate: case consent | Те саме |
| CNR-019 | Reviewer gate: case + UI | Те саме |

V6 покладається на acceptance-задачі (V6-15, V6-16), але не має explicit independent review gates.

---

## 5. Поточний P01–P16 + GEO-01 статус (з CONTEXT.json R2)

| ID | Coverage | Блокуючий gap |
|----|----------|---------------|
| P01 | PARTIAL | Profile mode fields — V6-02 покриває design, V6-07 мову |
| P02 | PARTIAL | Matcher extension — V4 CNR-003/004/005 WORKING |
| P03 | PLANNED_NOT_ACCEPTED | Mutual confirmation — V6-14 найближче |
| P04 | PLANNED_NOT_ACCEPTED | Immutable revisions — немає окремої задачі |
| P05 | PARTIAL | Terms scope/deadlines — V6-03/04 rework |
| P06 | PARTIAL | Service evidence — V6-14 |
| P07 | EXPLICITLY_PARKED | Expert reviews — PARKED |
| P08 | PARTIAL | Trial output — V6-14 |
| P09 | MISSING_DEDICATED_OWNER | Delayed feedback — **жодна V6 задача** |
| P10 | PARTIAL | Consent/export — V6 торкає (V6-13), але G5 portability **загублена** |
| P11 | CROSS_CUTTING_SOURCE_REVIEW | Adapter reuse — перехресна, не задача |
| P12 | PARTIAL | Draft intro/schedule — V6-12 (calendar) |
| P13 | PARTIAL | Cost per outcome — V6-11 (funnel) |
| P14 | EXTERNAL_GATE | Fixed denominator funnel — V6-11, потребує external gate |
| P15 | PARTIAL | Versioned extension — V6-03/04 |
| P16 | MISSING_PRESERVATION_ORACLE | Cold-start — G6 **загублена**, немає V6 задачі |
| GEO-01 | NOT ACCEPTED | Maps/live location — **немає V6 задачі** |

---

## 6. Підсумок: що реально загублено і що з цим робити

**Критичні прогалини (блокують пілот):**
1. **P09** (delayed feedback) — MISSING_DEDICATED_OWNER, жодна V6 задача
2. **P16** (cold-start) — MISSING_PRESERVATION_ORACLE, G6 загублена
3. **GEO-01** (live location) — задокументована, без виконавця
4. **E1–E5** (legal) — свідомо PARKED, але блокує реальних людей

**Загублені V4/V5 задачі (не критичні для MVP, але треба відстежити):**
5. CNR-021 (interview protocol)
6. CNR-022 (organizer packet)
7. G5 (data portability UI)
8. G8 (operator dashboard)

**Структурна прогалина:**
9. V6 не має explicit independent review gates (V4 мав 5 штук)

**Рекомендація:** не додавати нових задач у V6 зараз — спочатку закрити те, що є (18 з 19 = PLANNED). Прогалини 1–4 можна закрити окремими micro-задачами після першої хвилі V6-виконання.

---

## Межі цього документа

Відтворено з JSON-файлів у репо, не з тексту попередньої сесії. Mapping V4/V5 → V6 зроблено за назвами задач і P-посиланнями — можливі неточності при implicit coverage, яка не відображена в JSON. Перевір mapping, якщо маєш оригінальний контекст створення V6.
