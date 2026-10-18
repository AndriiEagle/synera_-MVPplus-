# Erasure: повне приймання зі свіжої disposable БД

Використовується вже наявний PostgreSQL service та `synera-acceptance-psql` wrapper з CI. Нових залежностей, історичних локальних БД, ключів чи провайдерських викликів не потрібно. Ці команди призначені для disposable loopback PostgreSQL з дозволом створювати тестові бази; runner відхиляє віддалені хости й очищує успадковані `PG*` налаштування.

У GitHub Ubuntu job, де wrapper уже створений попереднім SQL step:

```bash
set -euo pipefail
export SYNERA_ACCEPTANCE_PSQL="$RUNNER_TEMP/synera-acceptance-psql"
export SYNERA_ACCEPTANCE_PGHOST=127.0.0.1
export SYNERA_ACCEPTANCE_PGPORT=5432
export SYNERA_ACCEPTANCE_PGUSER=postgres

node tools/profile-erasure-sql-acceptance.mjs \
  --receipt=artifacts/postgres-acceptance/profile-erasure.json

export SYNERA_ERASURE_REVIEW_BASE_DB="$(node -e "process.stdout.write(JSON.parse(require('node:fs').readFileSync('artifacts/postgres-acceptance/profile-erasure.json','utf8')).database)")"

node tools/profile-erasure-review1.mjs --apply-current-guard \
  --receipt=artifacts/postgres-acceptance/profile-erasure-concurrency.json

node tools/profile-erasure-lock-review.mjs \
  --receipt=artifacts/postgres-acceptance/profile-erasure-upsert-locks.json
```

`SYNERA_ACCEPTANCE_DOCKER` має лишатися наявною змінною job/step для wrapper. Для прямого локального `psql` замість wrapper задай `SYNERA_ACCEPTANCE_PSQL` його шляхом та відповідний loopback port/user. SQL паролі й production DSN не читаються.

Перша команда створює `synera_erasure_<run>`, застосовує повний stack і поточний erasure SQL, проходить atomic rollback/idempotency/RLS/concurrency/mutation перевірки та **сама запускає** `neon/profile-erasure-surfaces.acceptance.sql` і `neon/profile-erasure-lifecycle.acceptance.sql`. Вони перевіряють відповідні PASS markers та закінчуються `ROLLBACK`. Повний receipt має **12 checks**, source hashes та metadata локального server. Tombstone mutation тестується з тимчасово відновленим admission у disposable fixture, потім helper та withdrawn admission відновлюються через `finally`.

Друга команда бере ім'я **щойно створеної** бази з першого receipt, створює власні disposable copies і перевіряє nonexistent case, outcome waiter після erasure commit та зворотний порядок — erasure чекає вже допущену outcome transaction. Історична база `synera_erasure_1792268577847` для цього не потрібна. Строгий regex не дозволяє підставити довільний SQL/database name. Під час review кінцеві source hashes повинні лишатися незмінними.

Третя команда на власній копії тієї самої свіжої бази проходить **4** actual UPSERT/erasure сценарії з бар'єрами: erase-first/upsert-first для existing/missing profile. Звичайний CI не передає `--legacy-profile-first`: це окремий негативний replay старої інверсії, а не актуальна поведінка.

Очікувані статуси: `PASS_LOCAL_PROFILE_ERASURE_SQL`, `PASS_ERASURE_REVIEW1_CONCURRENT_OUTCOME` та `PASS_ERASURE_PROFILE_UPSERT_LOCKS`. Бази зберігаються для огляду; видалення не виконується. Receipts вивантажує вже наявний CI artifact step. Це локальна PostgreSQL identity-shim acceptance, не signed JWT, live Neon Auth, provider deletion чи production rollout.

Окремий Node gate:

```bash
node --test neon/profile-erasure.test.mjs neon/profile-erasure-generation.test.mjs \
  neon/profile-delete.test.mjs neon/worker.test.mjs web_launch/neon-store.test.mjs
```

Browser gate після зміни `neon-store.mjs` виконує root через наявний `tools/profile-erasure-browser.mjs`; цей документ не підмінює його receipt.
