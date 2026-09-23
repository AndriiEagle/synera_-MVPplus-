# Q3 LIVE-APPLY: BLOCKED_NO_CONNECTION_STRING (2026-09-23)

Диспетч-картка Q3 (live-apply `neon/case-state.migration.sql` на живу Neon) виконана локально після `Add credits`. **Live-apply НЕ виконаний, жодної мутації не відбулось** — fail-closed на першій передумові.

## Чому стоп (перевірено, не здогадка)

| Перевірка | Результат |
|---|---|
| env-змінні (`NEON_DATABASE_URL`, `DATABASE_URL`, будь-які `NEON*`/`POSTGRES*`/`PG*`) | 0 збігів (102 env-змінні проскановані) |
| `.env*` у корені репо | відсутні |
| `rg "postgres://"` по репо | єдиний збіг — масив connection у `neon/local_acceptance.test.mjs` (disposable, не жива база) |
| `docs/NEON_LAUNCH.uk.md` | описує живу базу, але connection string НЕ містить (рядки 20–59 — архітектура, жодного URL) |
| psql / pg_dump у PATH | відсутні (обидва) |

## Що вже готово (щоб apply був рівно одним кроком)

1. Acceptance PASS на disposable PG: 9/9, receipt у `bible/STATUS.md:18`.
2. Dry-run: 46 statements, dangerous=[], SAFE-DRY-RUN (`plan/phase8/Q3_DRY_RUN.md`).
3. Машина: `neon/migration_runner.mjs` — `requireApproval` вимагає `SYNERA_MIGRATION_APPROVED=<operator-id>` + `backupConfirmed=true`; гейти працюють (9/9 тестів).

## Що потрібно від оператора (одне з двох)

- **A**: надати живий connection string Neon (консоль Neon → Connection string) — тоді застосувати `docker run --rm postgres:16-alpine psql <URL> -f neon/case-state.migration.sql` (psql беремо з контейнера postgres:16-alpine; pg_dump того ж образу — для backup перед apply; бекап-файл + SHA-256 зафіксувати).
- **B**: виконати apply власноруч з консолі Neon (SQL Editor / psql), потім записати вердикт у `bible/STATUS.md`.

## Evidence chain

- Claim: живий apply неможливий з цієї машини без рядка підключення від оператора.
- Source/locator: env-sweep + rg + docs-перевірка (таблиця вище).
- Independent check: `neon/migration_runner.test.mjs` 9/9 — гейт `requireApproval` fail-closed підтверджений тестами; apply() без run/без approval не мутує.
- Verdict: C03.L7 залишається TRUE_HUMAN; машина і всі докази готові, бракує рівно одного вводу оператора.