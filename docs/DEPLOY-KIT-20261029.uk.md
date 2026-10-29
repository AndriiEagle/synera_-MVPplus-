# DEPLOY KIT — 29.10.2026

**PREPARED_LOCAL_VERIFIED; LIVE_TWO_PERSON=HOLD.** Комплект створено з checkout
`claude/synera-design-20261029c`, HEAD `3d200f3196a19ece9383cfde37cee8699d61d348`.
Cloudflare/Neon не змінювалися; входу в кабінети, cloud API, SQL на production,
commit/push/deploy або встановлень не було. Виконано лише локальні перевірки
та читання публічної документації Cloudflare.

Початок для власника: [CHECKLIST.uk.md](deploy-kit-20261029/kit/CHECKLIST.uk.md).
Після злиття інших ліній Claude **перегенеровує** комплект із нового чистого checkout:

```powershell
node tools/pilot-deploy-kit.mjs --out docs/deploy-kit-20261029/kit
node --test tools/pilot-deploy-kit.test.mjs
```

Не завантажувати цей ZIP як реліз після merge без перегенерації: він містить саме `3d200f3`.

## Артефакти

| Артефакт | Призначення / приймання |
|---|---|
| [ZIP](deploy-kit-20261029/kit/synera-pilot-3d200f3196a19ece9383cfde37cee8699d61d348.zip) | 125 файлів, **614170 байтів**; тільки PUBLIC_ASSETS та `_worker.js`, `_routes.json`, `release.json` у корені |
| [manifest.json](deploy-kit-20261029/kit/manifest.json) | SHA-256 кожного upload-файлу, build inputs, 21 SQL-джерела та 13 артефактів; commit і size limits |
| [00-inspect.sql](deploy-kit-20261029/kit/00-inspect.sql) | Лише SELECT по каталогах: таблиці, колонки, функції, політики, гранти, RLS, індекси й triggers; true/false для кожного очікуваного об'єкта |
| [10-migrate.sql](deploy-kit-20261029/kit/10-migrate.sql) | 9 відомих міграцій у dependency order, conditional apply, один атомарний BEGIN/COMMIT; відмова на неповній/невідомій схемі, функції або RLS-політиці; завершується read-only catalog checks під ROLLBACK |
| [11-acceptance-disposable.sql](deploy-kit-20261029/kit/11-acceptance-disposable.sql) | Усі 11 вихідних acceptance suites на відповідному історичному stack; fixtures через SAVEPOINT, фінальний ROLLBACK усього replay |
| [20-add-member.sql](deploy-kit-20261029/kit/20-add-member.sql) / [21-remove-member.sql](deploy-kit-20261029/kit/21-remove-member.sql) | Один `<PARTNER_EMAIL>`, idempotent admission; окреме видалення допуску; незаповнений placeholder відхиляється |
| [env.md](deploy-kit-20261029/kit/env.md) / [env.json](deploy-kit-20261029/kit/env.json) | Усі **17 env/bindings** з **11 модулів** Worker dependency closure; документоване r8 проти нового, значення або owner fills |
| [Зміни після r8](deploy-kit-20261029/kit/changes-since-r8.uk.md) | Коротка таблиця видимих змін, ризиків і джерел |
| [Rollback](deploy-kit-20261029/kit/rollback.md) / [README](deploy-kit-20261029/kit/README.uk.md) | Pages rollback, admission down, межі SQL down та запуску fixtures |

SHA-256 ZIP:
`0d03c6d3c345a7d3fb22090a06883e5bb995f8f151e78c7fa3f6662e5b99ca65`.

## Що змінено в коді

- `tools/pilot-deploy-kit.mjs:16`: SQL splitter з підтримкою quoted strings,
  dollar bodies і comments; коментарі всередині function body зберігаються.
- `tools/pilot-deploy-kit.mjs:51`: inventory очікуваних об'єктів із джерел міграцій.
  Перевірка грантів відсутньої колонки повертає false, а не SQL error.
- `tools/pilot-deploy-kit.mjs:92`: рекурсивне читання imports Worker та env.X;
  dynamic/destructured env вимагає review замість мовчазного пропуску.
- `tools/pilot-deploy-kit.mjs:108`: upload allowlist, traversal/secret/maps/tests
  rejection; максимум 1000 файлів і 25 MiB на файл для dashboard upload.
- `tools/pilot-deploy-kit.mjs:135`: перевірка відомих function bodies, signatures,
  language, volatility, invoker/definer та settings. RLS definitions порівнюються
  після розбору самим PostgreSQL через probes всередині транзакції; probes видаляються
  до commit. Відмова відкочує і вже підготовлені попередні міграції.
- `tools/pilot-deploy-kit.mjs:185`: незмінений `neon/build.mjs` запускається в
  ізольованій копії під дозволеною docs-текою. Джерельні `web_launch/` і `neon/`
  не записуються. Лише build timestamp фіксується на час commit для повторюваності;
  інший тест окремо запускає canonical build і порівнює кожний файл.

Початковий запуск нового тесту дав RED (`ERR_MODULE_NOT_FOUND`, генератора ще не було).
Негативний security-тест також відтворив RED до перевірки `SECURITY DEFINER`:
[security-negative.txt](deploy-kit-20261029/security-negative.txt). Після виправлення
цей тест та змінена RLS-політика відхиляються транзакційно.

## Перевірки

| Команда | Результат / доказ |
|---|---|
| `node --test tools/pilot-deploy-kit.test.mjs` із локальними PG env нижче | **6 PASS, 0 SKIP**; [log](deploy-kit-20261029/kit-tests.txt), [SQL receipt](deploy-kit-20261029/postgres-acceptance.json) |
| `node --test web_launch/*.test.mjs web_launch/iceberg/*.test.mjs neon/*.test.mjs plan/v6/workflow/approval-boundary.test.mjs` | **750 PASS, 1 наявний SKIP, 0 FAIL**; [log](deploy-kit-20261029/node-suite.txt) |
| `node --test tests/pwa/*.test.mjs tests/i18n_ch/*.test.mjs` | **43 PASS**; [log](deploy-kit-20261029/pwa-i18n.txt) |
| `node node_modules/@playwright/test/cli.js test --config C:/sw/pw-chrome.config.mjs --output docs/deploy-kit-20261029/browser tests/browser-e2e.spec.mjs tests/studio-e2e.spec.mjs` | **50 PASS** у system Chrome; [log](deploy-kit-20261029/browser-tests.txt) |
| `py -3 -m zipfile -t docs/deploy-kit-20261029/kit/synera-pilot-3d200f3196a19ece9383cfde37cee8699d61d348.zip` | PASS: незалежний Python ZIP/CRC reader |
| Фінальне читання всіх manifest hashes, source hashes та SQL/generator/oracle fingerprints receipt | [PASS_FINAL_READBACK](deploy-kit-20261029/final-readback.json) |

Для інтеграційного тесту використано **наявний** PostgreSQL 16.15, окремий локальний
cluster під `docs/deploy-kit-20261029/.pg-local`, `127.0.0.1:55489`, user
`kit_acceptance`. Нічого не встановлювалося. Cluster зупинено після перевірки;
його дані й runtime logs gitignored. Інші сервери/лінії не чіпалися.

```powershell
$env:SYNERA_KIT_PSQL='C:\Users\Andrii\.codex\tmp\synera-pg16-20261003\runtime\pgsql\bin\psql.exe'
$env:SYNERA_KIT_PGPORT='55489'
node --test tools/pilot-deploy-kit.test.mjs
```

Ці env потребують запущеного disposable loopback cluster із цим тестовим user;
вони не під'єднують production. Без них виконуються 5 перевірок пакування/SQL/env;
PostgreSQL acceptance не оголошується виконаним.

SQL receipt фіксує шість реальних сценаріїв: r8 upgrade + повторний apply та
admission add/remove; partial migration; підміну function body; зміну definer;
підміну RLS policy; повний replay зі зникненням product tables і fixture users
після ROLLBACK. Це справжнє виконання PostgreSQL із **identity shim**, не живий
Neon, signed JWT, реальні люди або доказ production RLS.

## Явні межі K1 та власницьке приймання

1. Оригінальні fixture acceptance suites вимагають **DISPOSABLE ONLY**. Тому вони
   винесені з production `10-migrate.sql` у самодостатній `11-acceptance-disposable.sql`,
   де локально виконані під ROLLBACK. У `10` залишені production catalog/definition/grant
   checks. Це свідомий відступ від буквального «усі *.acceptance.sql у 10»;
   catalog checks не названі заміною поведінкових RLS-перевірок.
2. Для нових міграцій джерела не визначають lossless schema-down. Підготовлені
   `ROLLBACK` незавершеної транзакції, removal одного admission і Pages rollback;
   після появи угод/результатів additive SQL зберігається або власник використовує
   перевірений recovery point. Автоматичного destructive DROP немає.
3. **30 хв** — сценарій після готових акаунтів, backup/restore і локального приймання;
   **2 хв** — ціль перемикання Worker на попередній production deployment. Обидва
   терміни на власникові/телефонах не виміряні; відкат БД за 2 хв не підтверджений.
4. Поточні env, застосовані міграції, доставка двох email-кодів і реальний двоособовий
   шлях на новому дизайні лишаються owner gates. Партнер має бути одночасно у приватному
   `SYNERA_PILOT_EMAILS` і `synera_pilot_members`. Open registration та Google лишаються OFF.
5. `/api/neon/health` потребує `X-Synera-Client: 1`; готовий same-origin GET є в checklist.
   HTTP 200 доводить Auth gateway, не Data API/RLS або збережений двоособовий результат.

Dashboard upload `_worker.js`, ліміти і production rollback звірені з офіційними
[Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) та
[Rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/).
Жоден authenticated Cloudflare/Neon endpoint не викликався.

**NEXT (5–10 хв, Claude після merge):** перегенерувати kit з нового чистого checkout,
звірити commit/manifest, передати власнику CHECKLIST. Live rollout тут не виконується.

Models used: none (provider calls=0, USD=$0.00).
