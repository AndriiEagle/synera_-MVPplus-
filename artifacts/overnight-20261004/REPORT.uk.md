# Synera — нічна доробка 2026-10-04

## Поточний стан

**RUN_02_ACCEPTED_LOCAL_API:** серверний SQL та окремий захищений API підтвердження результату перевірені локально. `synera-10` залишається ACTIVE, цей чат `01a0a673-47c0-74d1-a768-7867f3dca2bc`, інтервал 30 хвилин, максимум 20 запусків. Кінцевий час робіт — 2026-10-04 12:28:45 Europe/Zurich (10:28:45 UTC). Frontend і живий продукт ще не прийняті.

Для виконання потрібні відкритий Codex, доступний комп'ютер без сну, інтернет і доступна квота. Налаштування Windows не змінені. Майбутні проходи використовуватимуть підписку Codex; її витрати й економія не виміряні.

## Перевірена вихідна точка

- Checkout: C:/Users/Andrii/Desktop/synera-premium-pwa-variant.
- HEAD: 5861ddedc71f482d35f9eaab80b7aa1518ef4db2.
- Попередні прийняті докази: ../product-completion-20261003/REPORT.uk.md. Незмінені повні тести в цьому стартовому проході не повторювалися.
- Незакомічений web_launch/journey-ui.mjs збережений; актуальний SHA256 68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b. Інші dirty/untracked матеріали не змінювалися.
- Канонічний serious-preflight: READY_WITH_LIMITS, LOCAL_ONLY, hosted dispatch_allowed=false. Metadata snapshot деградований; готовність поточного коду звірена прямим git/readback. Subscription savings невідомі.

## Черговість і межі

1. Пріоритет: серверне підтвердження фактичного результату та шлях двох учасників. Наступний локальний крок на 15 хвилин — прочитати відповідні реалізацію/історію/тести, вибрати один збережений інваріант і один семантичний acceptance guard; не замінювати живу перевірку fixtures.
2. Далі брати по одному незалежному незавершеному кроку із погоджених 15 пакетів. Current, Atelier і спокійний режим зберігати. Підтвердження має залишатися явним; мовчання не дорівнює згоді.
3. Кожен новий результат дописувати сюди: власні файли/commit, семантична перевірка, фактичне readback та неперевірені межі. Код не вважати завершеним тільки за наявністю файлів чи зелених fixtures.
4. Локальна доробка, Chromium і вже дозволена ізольована PostgreSQL допускаються. Нові install/delete/secrets, зміни production, публікації, платні API, чужі чати, глобальні правила й пам'ять не входять у цей нічний запуск.
5. Точне погодження міграцій Neon production та Cloudflare synera-pilot ще очікується. Нічний запит його не замінює. Push раніше заблокований політикою; обхід або повтор без зміни обмеження заборонений.
6. Після кінцевого часу не починати нову роботу; підсумувати результати й призупинити цей heartbeat. Якщо лишилися лише зовнішні блокери, завершити нагляд раніше.

## Прохід 01 — серверне підтвердження результату

Додано `neon/case-outcome.migration.sql`, `neon/case-outcome.acceptance.sql` та `tools/case-outcome-sql-acceptance.mjs`. Це окрема additive review migration після case-state/group-room, не зміна вже перевірених міграцій. Дані не доступні через прямі клієнтські table/sequence grants; захищений RPC перевіряє учасника, admission, актуальну згоду, блокування, редакцію і два живі погодження умов. Клієнт не призначає actor чи час. Історія дописується; повтор з тим самим intent і змістом не дублює запис, інший зміст відхиляється.

- Виконавець подає доказ; одержувач перевіряє критерій і окремо приймає або відхиляє результат нейтральною причиною. Мовчання залишається pending. Одна прийнята сторона не підтверджує всю співпрацю.
- Спір можна завершити прийманням, зберігши попередню відмову. Нова редакція показує pending та вимагає нових погоджень; старі події залишаються в історії.
- Дві скінченні self-review перевірки: збережено попереднє каскадне видалення даних акаунта; навмисне вимкнення receiver-only guard впіймане семантичним тестом `Giver accepted own result`. Канонічний SQL пройшов до й після mutation rollback.
- Перша тестова спроба виявила неправильне припущення oracle про порядок deliverables. Виправлено ролі fixture відповідно до канонічного сортування; серверні guards для цього не послаблювалися.
- Доказ: [CASE_OUTCOME_SQL.json](CASE_OUTCOME_SQL.json), PASS_LOCAL_SQL_ROLLED_BACK. Після відкату outcome table відсутня, fixture users=0, cases=0. Нові локальні тестові бази збережені в уже дозволеному runtime; production не торкалися.
- Після перевірки portable PostgreSQL зупинена; listener 55331 відсутній, усі файли збережені. [Readback](CASE_OUTCOME_RUNTIME_STOPPED.json). Незакомічена journey-ui має той самий SHA256.

**Межі:** це збережені підтвердження учасників (`proof_scope=participant_attestation`), не незалежна перевірка якості чи фізичної зустрічі. Підписаний JWT, живі акаунти, Android, frontend, API route, production deploy і відновлення не перевірені цим проходом. Ця нова міграція не входить до попереднього кандидата з трьома міграціями; попереднє питання про їх застосування не охоплює її.

**NEXT — 15 хвилин:** підключити окремий вимкнений за замовчуванням Neon API route до цього RPC і перевірити session/origin/body gates; потім приєднати client/UI окремим кроком. Не застосовувати міграцію до production без нового точного погодження.

## Прохід 02 — захищений API та зібраний Worker

Локальний SQL із проходу 01 збережений у commit `c8818f2ba347613d5dc60d33bc5243bbd19b22ab`.

Додано POST `/api/neon/outcomes/<caseId>` у чинний Neon gateway, без загального RPC proxy чи доступу до `match_outcome_events`. Новий маршрут закритий за замовчуванням і потребує одночасно pilot, real journey та окремого `SYNERA_CASE_OUTCOMES_READY=true`. Публічна конфігурація має типізований `caseOutcomesEnabled`; він не активує сервер сам по собі.

- Успадковані origin/client-header/session gates збережені. До бази йде тільки фіксований RPC та поточний JWT з перевіреної Neon session; caller Authorization/cookies/actor/timestamps не передаються.
- Дозволені лише поля потрібної дії: state, submit, check, accept, decline. Пропущені intent, некоректна редакція/hash, нейтральна причина поза контрактом, сторонні поля, некоректний JSON/Content-Type та oversized UTF-8 body відхиляються.
- **79/79 цільових тестів PASS**, FAIL/SKIP=0: `node --test neon/case-outcome.test.mjs neon/worker.test.mjs neon/group-room.test.mjs neon/meeting-location.test.mjs web_launch/real-journey-client.test.mjs web_launch/data.test.mjs web_launch/mobile-pilot.test.mjs`. Це перевірки локального транспорту, не підписаного JWT у провайдера.
- Перед зміною чинного Worker пройшла окрема семантична перевірка origin boundary. Та сама перевірка зловила навмисне вимкнення cross-site guard в ізольованому модулі; канонічні файли для mutation не змінювалися. Diff review не виявив потреби в додатковому розширенні scope.
- [CASE_OUTCOME_GATEWAY.json](CASE_OUTCOME_GATEWAY.json): PASS_LOCAL_BUNDLED_GATEWAY. Окремий локальний пакет `web_launch/dist-neon-outcomes-api-20261004`, 94 дозволені файли, bytes/hashes перевірені. Закритий bundled Worker зробив 0 upstream calls; увімкнений зробив лише 2 synthetic fixture calls (Auth + RPC), без мережі.
- Старий candidate `dist-neon-real-journey-20261003` і незакомічена journey-ui збережені за hash. Новий пакет бере accepted committed journey-ui, без публікації чужої правки. Новий generated dist не додається до commit; owned source/receipts зберігаються окремо.
- SQL-доказ проходу 01 повторно використаний тільки після звірки всіх записаних source hashes. Незмінені SQL suites не запускалися повторно. PostgreSQL залишилася зупиненою.

**Межі:** API/bundled Worker перевірені з fixtures. Frontend, живі provider sessions/JWT, production SQL/deploy і фізичний Android не перевірені. Новий flag, secrets чи production не змінювалися.

**NEXT — 15 хвилин:** додати client-адаптер із перевіркою редакції/відповіді та явних дій; потім підключити компактний екран результатів і пройти реальні Chromium-кліки локально. Старі режими й цикл переписки зберегти.

Models used: none (provider calls=0, USD=$0.00). Витрати основної підписки не виміряні.
