# Gemini 9.2 — disposable PostgreSQL CI

Статус: **локально перевірена конфігурація; remote CI SQL execution HOLD**.
Base: `4abbd06aa6faa98a69a6bcad4fec4470e11e7676`, branch `codex/synera-gemini-review-20261017`.
Поточні змінені файли: `.github/workflows/ci.yml`, `tools/meeting-status-guard-sql-acceptance.mjs`, новий `neon/meeting-status-cleanup.test.mjs` і цей звіт. SQL та application runtime не змінювала. Cleanup runner виправлений лише після відтворення дефекту й розширення ownership у pass2; початкові та pass1 докази нижче збережені як історія.

## Що підтвердила джерелами

- `neon/local_acceptance.test.mjs:91-121`: без `SYNERA_ACCEPTANCE_PG` integration має SKIP; з ним виконує `docker exec`/`docker cp` у `SYNERA_ACCEPTANCE_DOCKER`. Connection string сам по собі не встановлює з'єднання.
- `neon/local_acceptance.mjs:99-129`: shim → schema.proposal → case-state migration → **case-state.acceptance.sql** → перевірка нульових fixture users. Це не meeting-status guard acceptance.
- `neon/schema.proposal.sql:4-8`: схема вимагає auth shim та порожню target-схему. CI disposable container задовольняє цей контракт, без production-секретів.
- `tools/meeting-status-guard-sql-acceptance.mjs:15-45,79-138`: окремий наявний runner вимагає loopback PG, створює власні disposable DB, перевіряє baseline RED, guard GREEN в обох порядках міграцій, повторне застосування, guard/stack mutations, rollback, фінальні markers, потім видаляє створені DB. Саме його додатково підключено, щоб не приписати guard-покриття іншому тесту.
- Історія переглянута: `git log -5 --oneline -- .github/workflows/ci.yml neon/local_acceptance.mjs neon/local_acceptance.test.mjs`; CI header/offline browser gates додані `76e1897`, Studio gate `6cec211`; вони збережені.

## Мінімальна зміна

Окремий `postgres-acceptance` job (`.github/workflows/ci.yml:16-66`) використовує `postgres:16-alpine`, health-check `pg_isready`, timeout 10 хв. Тимчасовий trust auth обмежений disposable service без опублікованих портів. Обидва SQL steps отримують **`${{ job.services.postgres.id }}` на рівні step**, де доступний `job` context.

C03.L4 виконується через наявний Docker runner. Для meeting-status runner тимчасовий shell proxy викликає `docker exec -i <exact-id> psql`, тому реальний SQL connection проходить усередині контейнера через його loopback. Host `psql`, нові npm залежності, secrets і ports не потрібні. Помилки не приглушені; receipt guard-runner завантажується через `if: always()`.

Конфігурацію service/health-check звірила з [офіційним прикладом GitHub](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers); точний container ID і дозволений step-level context — із [Contexts reference, job context та availability table](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#job-context).

## Виконана перевірка

1. **Baseline до змін:** `node --test neon/local_acceptance.test.mjs` → exit 0, **8 PASS / 1 SKIP**, причина: PG env не заданий. Runner лишився незмінним, offline SKIP збережено.
2. **Негативний випадок:** у дочірньому PowerShell встановлено `SYNERA_ACCEPTANCE_PG=postgres://postgres@127.0.0.1/postgres`, `SYNERA_ACCEPTANCE_DOCKER=synera-ci-negative-does-not-exist`, `DOCKER_HOST=tcp://127.0.0.1:1`; виконано той самий `node --test neon/local_acceptance.test.mjs` → **exit 1, 8 PASS / 1 FAIL / 0 SKIP**, connection refused. Змінні прибрані в тому самому процесі. Це доводить fail-closed підключеного integration, а не SQL correctness.
3. PyYAML 6.0.3 локально розібрав YAML; порівняння parsed `jobs.test` з `git show HEAD:.github/workflows/ci.yml` → **ідентичний**. Перевірені step-level service IDs, відсутність published ports і `continue-on-error`.
4. Git Bash `bash -n` для обох `run` блоків, витягнутих із YAML у тимчасові файли → **PASS**.
5. Точний proxy із YAML виконано через Git Bash із stub Docker: exact container ID, порядок аргументів, stdin-sentinel та failure exit **37** збережені → **PASS транспортного контракту**, не реальна DB acceptance.
6. `git diff --check` → exit 0. Самоперевірка diff: лише окремий job; зайві runtime/test зміни не потрібні. Виявлене під час перевірки неправильне job-level використання context перенесено в step env до фінального readback.

## Межі та NEXT

- `docker info` не повернув server response за обмежений час, процес перервано; локального успішного Docker/PG виконання не отримано. `psql` не знайдений на поточному PATH. Це не твердження про глобальну відсутність PostgreSQL або credential/runtime в інших owners.
- GitHub workflow не запускався: push/PR/remote execution поза цією делегацією. **Не заявляю 9/9 integration PASS, успішні SQL mutations або закритий CI gate.** Координатор має окремо спостерігати green job і receipt на поточному source SHA після дозволеного remote запуску; C03.L4 має бути 9 PASS / 0 SKIP, receipt — `PASS_LOCAL_MEETING_STATUS_GUARD_SQL` із відповідними source hashes/stages.
- Навіть успішний disposable PG CI не доводить Neon production rollout, signed dual-JWT/two-live-account workflow, фізичні iPhone/Android чи готовність launch.
- Обов'язковий Chinese `provider_execution` кореневого завдання лишається **HOLD**, доки координатор не надасть canonical identity, request/output hashes, actual cost receipt та незалежно прийнятий output. У цій делегації provider calls=0; shared USD0.50 cap не витрачався.
- NEXT (5–20 хв, координатор): незалежно перечитати цей diff і після дозволеного remote виконання звірити точний SHA, C03.L4 9/9 та JSON receipt guard/stack job. Не застосовувати SQL до production в межах цього кроку.

Models used: none (provider calls=0, USD=$0.00).

## Finite targeted review 1/2 — після terminal result

Вердикт: **NO_CHANGE до workflow/runner**; конфігураційного дефекту в новому job не відтворено. Поточний SHA256 `.github/workflows/ci.yml`: `12b66627540c29514a60ba738b606de08643d9de48590b45b28ee9c14382d2db`.

Простежено поточні файли разом, а не за попередніми test counts:

- Service health запускає `pg_isready -U postgres`; обидва steps використовують точний step-level `job.services.postgres.id`. Trust дозволяє container-local TCP для guard runner; `ports` немає, PostgreSQL не відкритий на host. Це тимчасовий CI network/service, не production isolation proof.
- C03 робить reset `public/neon_auth/auth` у default DB `postgres`; authenticated/anonymous/service_role — cluster roles. Подальший guard runner створює нові DB через template0, а shim ідемпотентно переуживає ці ролі. Результат C03 не передається як готова схема guard-runner.
- Кожен guard SQL виклик має `-h 127.0.0.1 -p 5432 -U postgres -w -X -d <fresh-db> -At -q -v ON_ERROR_STOP=1` та SQL у stdin. `docker exec -i ... psql "$@"` зберігає аргументи/stdin/status; `env`, що прибирає PG-prefixed host settings у runner, зберігає `SYNERA_ACCEPTANCE_DOCKER`. Preflight бачить container loopback, а не Docker bridge IP. Тимчасовий proxy отримує executable bit до spawnSync.
- Fresh DB → shim → CASE/LATER/GUARD у визначеному порядку → acceptance/markers/fixture count → baseline RED та mutations → finally DROP. RED очікує конкретний SQL error; abort відкритої транзакції завершується разом із psql connection. Після мутацій runner повторює acceptance на немутованому guardLast.
- Переглянуті SQL не вимагають vector/uuid-ossp extension або PG17+ uuidv7/JSON_TABLE. Використані SQL function RETURN, gen_random_uuid та row_security_active наявні в PostgreSQL16: [CREATE FUNCTION](https://www.postgresql.org/docs/16/sql-createfunction.html), [UUID functions](https://www.postgresql.org/docs/16/functions-uuid.html), [system information functions](https://www.postgresql.org/docs/16/functions-info.html). Це сумісність використаних конструкцій за джерелами, **не виконана перевірка всього SQL на PG16**.

Нова негативна перевірка: запуск **реального guard runner** через Python subprocess із `SYNERA_ACCEPTANCE_PGPORT=5432`, `SYNERA_ACCEPTANCE_PSQL=<temporary-dir>/missing-psql`, `--receipt=<temporary-dir>/receipt.json` → exit **1**, явний `PostgreSQL preflight failed`, receipt не створений. CI step лишається червоним; `always()` upload із `if-no-files-found: ignore` не маскує failure попереднього step. Preflight відбувається до report/finally, тому receipt на цій стадії справді може бути відсутній; потрібні також Actions logs.

**Відтворена межа існуючого receipt, не прихована:** `tools/meeting-status-guard-sql-acceptance.mjs:134-136` ігнорує результати DROP і ставить `databases_dropped=created.length`. Точне тіло цих двох statements виконано як Node source-slice з injected `sql()=>({status:1,stderr:'simulated drop denial'})`, `created=['synera_status_guard_probe_1']`: поле все одно дорівнює **1**. Це component counterexample без реальної БД. Не можна вважати поле доказом успішного cleanup. Service teardown обмежує наслідки в цьому disposable CI job; production cleanup цим не доводиться. Файл tools поза моїм ownership; не редагувала його й не розширювала job лише заради косметичного green.

Remote PostgreSQL execution та mandatory GLM linked receipt лишаються HOLD. NEXT координатору: у pass2 окремо прийняти/відхилити цю обмеженість cleanup-receipt; якщо потрібен repair actual runner, явно призначити його власнику. Не переносити `databases_dropped` у launch acceptance як перевірений факт.

## Finite targeted review 2/2 — cleanup repair після розширення ownership

Координатор явно дозволив змінити tools runner та один semantic test. Виправлений **той самий відтворений дефект**, без helper/infrastructure і без змін SQL:

- `tools/meeting-status-guard-sql-acceptance.mjs:135-151`: успішний `status=0` без transport error збільшує `databases_dropped`; denied DROP/timeout/transport exception записуються у `cleanup_errors`; цикл продовжується для решти створених DB.
- `cleanup_pass=false` скидає загальний status до `NOT_ACCEPTED` та встановлює `process.exitCode=1`. З cleanup не кидається нова exception: первинний error object і `report.error` зберігаються. Звіт все ще записується існуючим receipt шляхом.
- Новий `neon/meeting-status-cleanup.test.mjs` автоматично включений наявним `neon/*.test.mjs` CI glob. Тест витягує **точне поточне finally cleanup-тіло** перед receipt write і виконує його через Node vm з injected SQL transport. Це поведінковий component oracle для cleanup/receipt verdict/exit code, не запущений PG, не acceptance усього runner. Межа source-slice явно перевіряється; при її майбутній зміні тест потребуватиме адаптації.

RED перед repair: `node --test neon/meeting-status-cleanup.test.mjs` → exit **1**, 3 FAIL. Decisive negative: `Failed DROP must not count as successful cleanup`, **2 !== 1**. Transport exception також замінювала original acceptance error object. Ці випадки спрацювали на реальній наявній cleanup-логіці до редагування.

GREEN після repair: `node --test neon/meeting-status-cleanup.test.mjs neon/local_acceptance.test.mjs` → **11 PASS / 1 honest offline SKIP** на трьох початкових cleanup tests та незмінному C03 suite. Після фінального semantic case `node --test neon/meeting-status-cleanup.test.mjs` → **4 PASS / 0 SKIP**: повний успіх; успішний cleanup після primary failure; denied перший DROP + успішний другий; transport throw + збережений original error object + успішний другий DROP. `node --check tools/meeting-status-guard-sql-acceptance.mjs` та `git diff --check` → exit 0.

Фінальна defect-sensitivity перевірка без відкоту робочого дерева: поточний той самий 4-case test скопійовано у temporary tree з **HEAD baseline** runner (`git show HEAD:tools/meeting-status-guard-sql-acceptance.mjs`). `node --test <temp>/neon/meeting-status-cleanup.test.mjs` → exit **1** із точними assertions про false successful-drop count і заміну original error object. Виправлений артефакт не змінювався.

SHA256 після pass2:

- workflow: `12b66627540c29514a60ba738b606de08643d9de48590b45b28ee9c14382d2db` (без змін у pass2);
- runner: `dd09ddf198b31e3748b355ccf9bc00c4cf9ae8c6b66370a259c5bac18c2d8dfa`;
- cleanup test: `35bcf3c2270724e4a52b8f38f1af6af9d1e9184513d78caa168ea72d8bb30c81`.

Межі: drop counter тепер доводить успішний psql command result, не незалежний SQL readback відсутності DB. Unit oracle не доводить реального SQL/Docker execution. Preflight до finally і filesystem receipt-write failure лишаються окремими наявними межами; цей вузький repair їх не переписує. Реальний PG16/CI, root Chinese provider receipt та незалежне приймання координатором лишаються HOLD. NEXT: координатор читає поточний diff/ці hashes, приймає bounded cleanup oracle і окремо спостерігає дозволений CI run; provider calls цієї делегації=0, USD=$0.00.
