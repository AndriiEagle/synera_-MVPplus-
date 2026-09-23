# BLOCKED_HUMAN.md — 4 рішення (стиснуто з 11 питань, 2026-09-23)

**Тріаж виконаний агентом за протоколом:** DERIVABLE (виконано без тебе), REVERSIBLE_DEFAULT (виконано з реверсивним дефолтом), TRUE_HUMAN (лишилось тут). Деталі triage — у кінці файлу.

| # | Шар | Рішення | Рекомендований варіант | Що станеться після «так» |
|---|---|---|---|---|
| Q3 | C03.L7 | Застосувати `neon/case-state.migration.sql` на живу Neon базу | ТАК, після snapshot: acceptance вже PASS на disposable (receipt у `bible/STATUS.md`), dry-run автоматичний, live = `SYNERA_MIGRATION_APPROVED=andrii` + backup-підтвердження (машина `neon/migration_runner.mjs` готова, тихий apply неможливий) | C03.L7 → DONE, шлях до деплою відкритий |
| Q5+Q10 | C05.L6 + C15.L7 | Одна 30-хв сесія юриста/фідуціара охоплює ОБИДВА шари (Swiss legal + security review C15 машин) | Gilbert (канон `plan/GENESIS_SPEC.uk.md:75`); чекліст код-ревʼю вже виконаний агентом — PRIVACY_AUDIT_PASS (машина `web_launch/iceberg/privacy_audit.mjs`, 6/6 тестів); юристу на підпис: `plan/legal/SWISS_LEGAL_LAYER.uk.md` + `plan/readiness/ICEBERG_ARCHITECTURE.uk.md` | C05.L6 + хвіст C15.L7 → DONE |
| Q6+Q7 | C11.L4 | Рейка першого платного кроку + кап | QR-bill ($0 інфраструктури, без процесора; машина `web_launch/economics/qr_bill.mjs` готова, flag `enabled:false`, IBAN/payee — NEEDS_INPUT при активації); кап = 0 зовнішніх витрат | C11.L4 → DONE (один config gate) |
| Q8 | C13.L6 | Пакетний деплой (UI+міграція+B2+worker) на Cloudflare Pages | ТАК після Q3: порядок — CI зелений (376/376) → міграція (Q3) → UI-пакет → B2+worker; CI деплоїть НІКОЛИ (`.github/workflows/ci.yml:2`), деплой — ручний з exact approval | C13.L6 → DONE, C13 = 6/6 |

**Сумарний unlock:** після цих 4 рішень BLOCKED_HUMAN = 0, readiness ≈ 84–86% (порахує `readiness_report.py`), і система готова до запуску перших клієнтів (після деплою Q8).

---

## Тріаж (що вже вирішено без тебе — докази)

**DERIVABLE (виконано):**
- Q2 (хто виконує acceptance): агент виконав сам на disposable Docker Postgres; receipt у `bible/STATUS.md` («What is proven», 2026-09-23). Прецедент: schema.proposal.sql acceptance.
- Q11 (code review C15 машин): виконаний детермінованим чеклістом `privacy_audit.mjs` — PRIVACY_AUDIT_PASS; тести 6/6. Лишився тільки юрист-підпис (обʼєднаний з Q5).

**REVERSIBLE_DEFAULT (виконано з реверсивним дефолтом):**
- Q1 (середовище acceptance): локальний Docker `postgres:16-alpine` ($0, disposable, контейнер видалений після прогону); Neon branch залишається альтернативою (`SYNERA_ACCEPTANCE_PG`).
- Q4 (backup/rollback): прийнята процедура snapshot → dry-run → live; закодована у `neon/migration_runner.mjs` (backupConfirmed обовʼязковий, інакше apply неможливий).
- Q9 (векторна база): дефолт = локальний `D:\AI_DEPOT\vector_db\context-gateway` (перевірений на диску); перемикач `SYNERA_VECTOR_STORE=nvidia-nim` реверсивний, без ключа — fail-closed (`web_launch/memory/vector_store.mjs`, 7/7 тестів).

**Інформаційно:** C14.L5 → DONE (реверсивний дефолт), C03.L4 → DONE (реальний RLS PASS на disposable), C11.L4/C15.L7 → PARTIAL (реалізовано все до перемикача/підпису).

## Як відповідати

Одним повідомленням: «Q3: так/ні; Q5: Gilbert/інший+дата; Q6: qr-bill/twint/cards; Q7: кап; Q8: так/ні». Після відповідей оркестратор: вердикти в `bible/STATUS.md` → DNA точково → `readiness_report.py` → деплой-прогон (якщо Q8=так).