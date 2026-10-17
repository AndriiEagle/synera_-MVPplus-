# Q3 DRY-RUN доказ (C03.L7) — 2026-09-23

Картка E оркестратора. Це те, що оператор побачить ДО схвалення Q3 (live-apply міграції на живу Neon). Жодного approval-env не було виставлено; жива база не торкалася.

## Команди приймання

1. `node neon/migration_runner.test.mjs` → **9 pass, 0 fail** (гейти: dry-run за замовчуванням, fail-closed без `SYNERA_MIGRATION_APPROVED`).
2. Dry-run на міграційному файлі (тимчасовий .mjs у `$env:TEMP`, імпорт `neon/migration_runner.mjs`, видалений після прогону):

```
import { dryRun } from 'file:///C:/Users/Andrii/Desktop/synera-clone/neon/migration_runner.mjs';
const r = await dryRun('C:/Users/Andrii/Desktop/synera-clone/neon/case-state.migration.sql');
```

## Результат dry-run (факти з диску)

| Поле | Значення |
|---|---|
| mode | `dry-run` |
| migration | `neon/case-state.migration.sql` (231 рядок) |
| statements | **46** |
| dangerous | **[] (порожньо)** |
| live_sql_applied | **false** |
| verdict | **SAFE-DRY-RUN** |

Класифікатор dangerous (з `neon/migration_runner.mjs`): `DROP SCHEMA|DROP TABLE|DROP DATABASE|TRUNCATE` — жодного з них у `case-state.migration.sql` не знайдено.

## Що це означає для оператора

- Runner за замовчуванням НЕ мутує нічого: `live_sql_applied=false` без env-перемикача — fail-closed підтверджений живим прогоном.
- Вердикт `SAFE-DRY-RUN` без dangerous-стейтментів — міграція додає структуру, не руйнує.
- Для Q3 оператору потрібен рівно один перемикач: `SYNERA_MIGRATION_APPROVED=andrii` + backup-підтвердження (залишок у `BLOCKED_HUMAN.md`).

## Evidence-chain

- Claim: dry-run з 46 statement'ами, 0 dangerous, SAFE-DRY-RUN, без мутацій.
- Source/locator: `neon/migration_runner.mjs` (`dryRun`, `splitStatements`, `APPROVAL_ENV='SYNERA_MIGRATION_APPROVED'`), `neon/case-state.migration.sql`.
- Independent check: тест 9/9 + dryRun() живий прогон на реальному SQL-файлі репо (вивід вище, JSON з диска).
- Verdict: Q3 dry-run машина готова; операторське рішення — єдиний залишок блокера C03.L7.