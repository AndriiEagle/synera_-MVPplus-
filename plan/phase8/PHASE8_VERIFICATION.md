# PHASE 8 VERIFICATION — audit trail (2026-09-23)

Картка D оркестратора. Усі числа нижче — з реальних прогонів на диску (не з пам'яті). Команди виконані з кореня `C:\Users\Andrii\Desktop\synera-clone`.

## Хронологія

- Коміт **1e367f3** `feat(phase8): blockers demoted to one-switch - real RLS acceptance PASS on disposable PG, migration runner, qr-bill flag-off, vector store default, privacy audit PASS; readiness 71->75%` — 14 файлів (10 нових машин+тестів, 4 modified DNA/SCORE/STATUS/BLOCKED_HUMAN), запушений у `origin/codex/synera-documentation-refresh` (rev-parse HEAD == origin верифіковано).
- Наступний коміт **cddf08d** `chore(goal): phase 8 done` — `.kilo/goal/state.json` (фаза 8 = done).

## Машина 1 — `neon/local_acceptance.mjs` (C03.L4)

- Канон: `bible/STATUS.md:27` (Neon branch АБО локальний Docker Postgres; REVERSIBLE_DEFAULT), `neon/case-state.acceptance.sql:1` («Requires exact approval. Always ROLLBACK.»).
- Приймання: без Docker — `node neon/local_acceptance.test.mjs` → **8 pass + 1 skipped** (integration чесно SKIP без `SYNERA_ACCEPTANCE_PG`); з Docker — integration-run виконаний реально.
- **Реальна RLS-акцептанса (2026-09-23)**: disposable `postgres:16-alpine` (`synera-rls-acceptance`, порт 55432), env `SYNERA_ACCEPTANCE_PG` + `SYNERA_ACCEPTANCE_DOCKER` → **9/9 pass, 0 fail**, leftover=0, контейнер після прогону видалений (cleanup верифікований `docker ps -a`).
- Receipt: `bible/STATUS.md:18` — «HAS been run against a real database (2026-09-23) … PASS … leftover=0».
- Гейт: acceptance тільки на disposable; жива база = окреме рішення оператора (C03.L7).

## Машина 2 — `neon/migration_runner.mjs` (C03.L7)

- Канон: `bible/STATUS.md:23` (frozen history), FM-013, `bible/STATUS.md:27` (apply тільки після acceptance на disposable).
- Гейт: DRY-RUN за замовчуванням; live-apply тільки при `SYNERA_MIGRATION_APPROVED=<operator-id>`; «тихий apply неможливий» (header-коментар).
- Приймання: `node neon/migration_runner.test.mjs` → **9 pass, 0 fail**.

## Машина 3 — `web_launch/economics/qr_bill.mjs` (C11.L4)

- Канон: BLOCKED_HUMAN Q6/Q7; `plan/legal/SWISS_LEGAL_LAYER.uk.md` (PBV 942.211: B2C з ПДВ, B2B без); `GENESIS_SPEC.uk.md:75` (H2: MWST, договір, QR-bill).
- Гейт: flag **OFF** за замовчуванням (REVERSIBLE_DEFAULT); детермінований Swiss QR-bill payload (6 блоків).
- Приймання: `node web_launch/economics/qr_bill.test.mjs` → **6 pass, 0 fail**.

## Машина 4 — `web_launch/memory/vector_store.mjs` (C14.L5)

- Канон: BLOCKED_HUMAN Q9; READINESS_DNA C14.L5 «location confirmed».
- Диск-факти: `D:\AI_DEPOT\vector_db\context-gateway` існує; NVIDIA lane — PRESENT_BUT_UNTESTED, живі виклики тільки з exact approval капу; локальний store = дефолт.
- Приймання: `node web_launch/memory/vector_store.test.mjs` → **7 pass, 0 fail**.

## Машина 5 — `web_launch/iceberg/privacy_audit.mjs` (C15.L7)

- Канон: BLOCKED_HUMAN Q11 (DERIVABLE: code review C15 машин виконує агент, оператор підтверджує); `plan/readiness/ICEBERG_ARCHITECTURE.uk.md` §4.3, §8.
- Перевірки: cascade logs без PII, consent-гейти не мутуються машинами, rollback-механіка.
- Приймання: `node web_launch/iceberg/privacy_audit.test.mjs` → **6 pass, 0 fail** (PRIVACY_AUDIT_PASS по 6 C15 машинах).

## Підсумкова таблиця

| Машина | Тест-файл | Pass | Gate |
|---|---|---|---|
| local_acceptance (C03.L4) | `neon/local_acceptance.test.mjs` | 8+1 skipped (без Docker) / **9/9 з disposable PG** | disposable-only; receipt у bible/STATUS.md:18 |
| migration_runner (C03.L7) | `neon/migration_runner.test.mjs` | 9/9 | dry-run default; SYNERA_MIGRATION_APPROVED |
| qr_bill (C11.L4) | `web_launch/economics/qr_bill.test.mjs` | 6/6 | flag OFF |
| vector_store (C14.L5) | `web_launch/memory/vector_store.test.mjs` | 7/7 | локальний дефолт; NVIDIA = env+approval |
| privacy_audit (C15.L7) | `web_launch/iceberg/privacy_audit.test.mjs` | 6/6 | PRIVACY_AUDIT_PASS; оператор підтверджує |

**Разом машини фази 8: 36/36 тестів green + реальна RLS-акцептанса на disposable PG (integration 9/9).** Повний сьют репо (56 файлів): 412 pass + 1 skipped, 0 fail (2026-09-23).