# Q8 DEPLOY READINESS — Cloudflare Pages (2026-09-23)

Картка Q8 оркестратора. **Деплой НЕ виконаний; це only readiness.** Реальний пакетний деплой — після Q3, з exact approval оператора.

## Чекліст готовності (перевірено на диску)

| Пункт | Стан | Доказ |
|---|---|---|
| CI ніколи не деплоїть | ✅ | `.github/workflows/ci.yml:2` — «Жодних deploy/publish/secrets» (grep deploy/publish = лише цей рядок) |
| Offline build працює | ✅ | `node web_launch/build.mjs --offline` → `{"directory":"web_launch/dist-real-offline","mode":"local-profile-draft","files":40,"published":false}` — успіх, 40 файлів |
| Wrangler tooling | ✅ доступний | `npx wrangler --version` → 4.136.3 (підтягується через npx) |
| Cloudflare auth | ❌ відсутній | env `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` = не задані; wrangler.toml/Pages-конфіга в репо немає |
| Передумова Q3 | ❌ BLOCKED | порядок у BLOCKED_HUMAN.md: CI green → **міграція (Q3)** → UI-пакет → B2+worker. Q3 зараз fail-closed: немає connection string Neon у env/репо (див. `plan/phase8/Q3_DRY_RUN.md` — dry-run готовий, live чекає оператора) |

## Що оператор має схвалити для реального деплою

1. Q3 = так + надати/виконати live-міграцію (connection string з консолі Neon; backup перед apply — гейт машини `neon/migration_runner.mjs`).
2. Q8 = так: пакетний деплой (UI+міграція+B2+worker) — порядок у `BLOCKED_HUMAN.md` (рядок 10).
3. Cloudflare auth: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` у env (секрети НЕ в репо).

## Порядок після двох «так» (з BLOCKED_HUMAN.md)

1. CI зелений (вже green локально: 412 pass + 1 skipped, 0 fail; CI той самий набір)
2. Міграція (Q3) — машина готова, dry-run SAFE-DRY-RUN (46 statements, 0 dangerous)
3. UI-пакет (build верифікований: 40 файлів, published=false)
4. B2 + worker

## Примітки про режими білду

- Диск має два білд-шляхи: `dist-neon` (24 файли, Neon-режим з `_worker.js`+`_routes.json`, описаний у `docs/NEON_LAUNCH.uk.md:49`) і `dist-real-offline` (40 файлів, mode `local-profile-draft` — свіжий прогін цього запиту). Для Pages-деплою орієнтир — dist-neon (worker-режим); число файлів фіксувати на момент деплою.

Evidence chain: клейм «деплой готовий крім auth+Q3» → source: ci.yml:2 + build-вивід (JSON вище) + env-чек → незалежний чек: grep deploy/publish у ci.yml, Test-Path wrangler.toml = False → verdict: readiness PASS, deploy BLOCKED до Q3 + operator approval.

**Деплой НЕ виконаний; це only readiness.**