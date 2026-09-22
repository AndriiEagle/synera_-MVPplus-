# Execution progress — Wave A + parallel lanes, 2026-09-10

Метод: 3 паралельні лінії, інтегратор верифікує diff + тест після кожної партії.
База перед стартом: 97/97 (workdir=source root, EXEC-001), хеші файлів = receipt v3.

## Лінія 1 — Хвиля A (UI wiring)

| Крок | Маркер | Тест | Інтегратор |
|---|---|---|---|
| A1 | SYN_ALL_MODES_EXPORTED | 24/24 focused | ✅ diff: `export const ALL_MODES` |
| A2 | SYN_APP_IMPORTS_ALL_MODES | 97/97 | ✅ diff: ALL_MODES в import, MODES збережений |
| A3 | SYN_FIVE_MODES_RENDERED | 97/97 + build 26 | ✅ 4-й tuple → ALL_MODES; `$('#mode')` = 0 дотиків |
| A5 | SYN_MODE_DETAILS_COLLECTED | 97/97 | ✅ mode_details з полів форми, thirdPartyStatus=not_consulted |
| A6 | SYN_MODE_DETAILS_RESTORED | 97/97 | ✅ optional chaining, легасі v1 без примусу версії |
| A7 | SYN_BRIEF_PROBLEMS_VISIBLE | 97/97 + build | ✅ verbatim повідомлення, без нової валідації |
| A8 | SYN_CASE_STATE_IMPORTED | у роботі (партія 3) | — |
| A9 | SYN_CASE_V2_RENDERED | у роботі | — |
| A10 | SYN_APPROVALS_WIRED | у роботі | — |
| A11 | SYN_INTRODUCTION_GATED | у роботі | — |
| A12 | SYN_COLD_START_EXPLAINED | у роботі | — |

## Лінія 2 — A4 + Import F1→F4

| Крок | Маркер | Тест | Інтегратор |
|---|---|---|---|
| A4 | SYN_MODE_DETAIL_FIELDS_PRESENT | build OK | ✅ fieldset сіблінг після #brief-fields |
| F1 | SYN_IMPORT_CHATGPT_PARSED | 10/10 | ✅ в памʼяті, untrusted=дані |
| F2 | SYN_IMPORT_CLAUDE_PARSED | 10/10 | ✅ |
| F3 | SYN_IMPORT_REDACTED | 10/10 | ✅ blockedSecrets → стоп імпорту |
| F4 | SYN_IMPORT_MAPPED | 10/10 | ✅ словники з matching.mjs/profile-brief.mjs, needsInformation |

Сьют після Line 2: **107/107** (97 база + 10 import-тести).

## Лінія 3 — Legal E1→E5

Драфти PRIVACY_NOTICE / TERMS_OF_SERVICE / DPA_SCC_CHECKLIST / RETENTION_SCHEDULE / DPIA_TEMPLATE — у роботі.

## Уроки → execution-lessons.md
EXEC-001 workdir trap; EXEC-002 дис'юнкція ліній; EXEC-003 рухоме число тестів; EXEC-004 маркер = рядок у diff + тест.

## Обмеження
Жодних комітів у source/ (брудна робота юзера). Жодних мережевих/провайдер-викликів. Deploy/міграції заборонені.
