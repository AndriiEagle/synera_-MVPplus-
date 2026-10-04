# Synera — нічна доробка 2026-10-04

## Поточний стан

**RUN_08_ACCEPTED_LOCAL_BILATERAL_ADDRESS_SQL:** попередні серверний SQL/API, клієнт, результати, експорт, перегляд і соціальна чернетка збережені. Новий окремий SQL-крок погодження адреси пройшов справжню ізольовану PostgreSQL 16.15/RLS перевірку; API та інтерфейс для нього ще не підключені. Повний попередній fixture цикл прийнятий у Chromium 390×844. `synera-10` залишається ACTIVE, цей чат `01a0a673-47c0-74d1-a768-7867f3dca2bc`, інтервал 30 хвилин, максимум 20 запусків. Кінцевий час робіт — 2026-10-04 12:28:45 Europe/Zurich (10:28:45 UTC). Живий продукт ще не прийнятий.

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

## Прохід 03 — клієнтський адаптер приватних підтверджень

API/Worker із проходу 02 збережений у commit `0e2df438ac59a6d88ff930fe983638d27a4ea2b7`.

Додано `outcomeState` та `recordOutcome` до чинного `RealJourneyStore`, використовуючи вузький same-origin транспорт `NeonStore`. Адаптер закритий без явного `caseOutcomesEnabled=true`; він не активує сервер. Жодних нових браузерних токенів, сховищ чи другого matching engine.

- Збережений інваріант: самодекларація виконавця не приймає результат; одне приймання не підтверджує всі результати. Дві незалежні згоди на умови, приймання запрошення та приватна переписка з попередніх тестів залишилися робочими. До правок пройшли 14 старих semantic tests; новий сценарій спочатку впав на відсутньому `outcomeState`.
- Перед дією перевіряються учасник, згода, роль, актуальні case/version/hash та два погодження; сервер лишається остаточною authority. Actor/час та зайві поля не можна включати у клієнтський intent. Повтор зберігає той самий intent, нова автоматична згода не створюється.
- Відповідь звіряється з матеріалом і серверною історією: конкретні результати/критерії, ролі, порядок подій, доказ → перевірка → приймання, нейтральна причина спору та підсумковий статус. Підроблена проєкція, чужа пара, інша редакція, приймання без перевірки чи непідтверджений запис не повертаються як успіх.
- Після відповіді повторно перевіряється редакція. Вихід, відновлення того самого акаунта або вхід іншого акаунта інвалідують стару операцію до її повернення. Це захист адаптера; очищення DOM нової панелі ще має бути прийняте браузером.
- Два скінченні diff review: закрито prototype-name trap у виборі action; прибрано хибне трактування PostgreSQL `now()` як верхньої часової межі для подій іншої транзакції, на чий lock читання чекало. Обидва випадки охоплені поведінковими тестами.
- [CASE_OUTCOME_CLIENT.json](CASE_OUTCOME_CLIENT.json): **26/26 PASS**, FAIL/SKIP=0. Ізольований mutation прибирає тільки перевірку session epoch; semantic test ловить запізнілу приватну відповідь після logout → restore того самого акаунта. Канонічні файли під час mutation не змінювалися.
- SQL та API receipts повторно використані після звірки всіх їхніх записаних source hashes. Повні незмінені suites і PostgreSQL повторно не запускалися. Старі два release manifests та незакомічена journey-ui збережені за hash.

**Межі:** це synthetic transport і client contract; не підписаний HTTP JWT, не два живі акаунти, не фізичний Android. Екран результатів ще не підключений; пакет проходу 02 збережений як попередній snapshot і не містить цього нового адаптера. Нічого не опубліковано, не активовано в production і не pushed; попереднє policy обмеження не обходилося.

**NEXT — 15–20 хвилин:** приєднати компактну панель результатів до реальної домовленості з явними діями/історією та пройти локальний двосторонній цикл у Chromium 390×844, включно з відмовою й виходом. Зберегти Current/Atelier, старі форми, чужу journey-ui та попередні артефакти.

Models used: none (provider calls=0, USD=$0.00). Витрати основної підписки не виміряні.

## Прохід 04 — екран результатів і двосторонній Chromium-цикл

Клієнтський адаптер проходу 03 збережений у commit `ad944701defa0c969edd4e75003389e930b31f37`.

До чинного `real-journey.html`/`real-journey.mjs` додано компактну панель результатів. Вона доступна після вибору домовленості або прийнятої розмови й лише з окремим readiness flag. Кожна картка показує точний результат, погоджений критерій, доказ, перевірку та рішення його одержувача. Відмова має нейтральну причину; подальше приймання зберігає історію спору. Мовчання не створює згоди. Дані не пишуться в browser storage.

- Перед зміною чинного UI реально пройдено старий шлях двох fixture акаунтів: окремі погодження → прийняте запрошення → приватний Unicode-текст → очищення після виходу. [Baseline](OUTCOME_UI_BASELINE.json). Новий сценарій спочатку впав на відсутній панелі [RED](OUTCOME_UI_RED.json).
- [CASE_OUTCOME_BROWSER.json](CASE_OUTCOME_BROWSER.json): **PASS_LOCAL_OUTCOME_BROWSER**, 17 поведінкових перевірок. Реальні кліки Chromium 390×844 завершили обидва результати: виконавець подає доказ, одержувач записує перевірку, явно ставить checkbox та приймає. Одна сторона не підтверджує весь обмін; кнопки самоприймання немає.
- Окремо пройдено спір → приймання без стирання відмови, відкликання згоди → заблоковані дії → повторне явне погодження, закритий flag, вихід із завантаженими результатами та запізнілий read після виходу. Приватний DOM/історія очищені; текст із `<script>` залишився буквальним текстом.
- Retry test виявив помилку: upstream 500 стає захищеним API 503, а загальний UI handler стирав чернетку доказу. [RED](OUTCOME_RETRY_RED.json). Вузька правка тільки для запису результату зберігає текст та той самий intent до повторної явної дії; успіх виводиться лише після серверного readback. Жодних прихованих чи автоматичних повторів.
- Current залишився default, Atelier добровільно увімкнувся й повернувся до Current. Reduced motion збережено. Axe: 0 порушень у Current і Atelier; ширина 390/390, горизонтального переповнення немає. Переглянуті справжні [Current](outcome-current-390x844.png), [Atelier](outcome-atelier-390x844.png) та [повна панель](outcome-confirmed-panel.png); на фото явно fixture профілі, не реальні учасники.
- Два скінченні diff review: оновлення стану згоди в панелі блокує дії після відкликання; усі нові DOM поля створені через textContent, лише вхідні форми з явними діями. Mutation окремо подав у Chromium код без очищення результатів на logout. Тест зловив `Private outcome DOM survived logout`; канонічні файли/скриншоти не змінювалися. [Mutation](OUTCOME_UI_MUTATION.json).
- [CASE_OUTCOME_UI_RELEASE.json](CASE_OUTCOME_UI_RELEASE.json): **PASS_LOCAL_OUTCOME_UI_RELEASE**, новий окремий кандидат `web_launch/dist-neon-outcomes-ui-20261004`, 94 дозволені файли, release SHA256 `78407842a606f1eef96305585693d0c70c5c06caabdab928d91364309e760135`. UI/client bytes відповідають прийнятим джерелам; bundled Worker побайтово відповідає кандидату з проходу 02. Tests/fixtures/SQL до публічних assets не входять.
- Два цільові mode-editor regression tests PASS. Незмінені SQL/API/client докази повторно використано лише після перевірки їхніх source hashes; повні suites не повторювалися. Старі пакети та чужа dirty journey-ui залишилися незмінними. Generated dist не додається до commit; source, proofs і screenshots збережені окремо.

**Межі:** fixture RPC не виконує SQL/RLS і не перевіряє JWT; SQL receipt є окремим локальним доказом, їх поєднання ще не доводить реальну Auth → Data API → SQL інтеграцію. Фізичний Android, два живі акаунти, production, Maps, voice, OAuth та платежі не прийняті цим проходом. Пакет не опублікований, readiness/secrets не активовані, push не повторювався. Тимчасова UI помилка в одному тесті була подвійним logout у test harness; друга — відкрита панель вигляду перекривала кнопку, її закрито звичайним кліком без force-click чи зміни дизайну.

**NEXT — 15–20 хвилин:** приєднати приватний експорт цього результату до чинного архіву, з явним завантаженням, збереженням оригінального тексту та round-trip перевіркою. Не підміняти архівом соціальну публікацію чи повний експорт акаунта; не приписувати codec економію provider токенів без вимірювання.

Models used: none (provider calls=0, USD=$0.00). Витрати основної підписки не виміряні.

## Прохід 05 — приватний архів підтвердженого або незавершеного результату

Екран і попередній звіт збережені в commits `8cf4c78681e7fee17004737b6e80b44d41815166` та `54b6fd3b4cb5ab0560972090356721933e9bc9ec`.

До чинного RealJourneyStore та панелі результатів додано явне завантаження приватної копії через наявний `archive-codec.mjs`. Додаткові controls сховані в компактному «Приватна копія». Є plain та gzip envelope; без підтримки CompressionStream доступний plain. Current/Atelier та попередні панелі збережені.

- Збережений інваріант: архів містить точні актуальні серверні умови та історію учасників; неповний результат залишається неповним. Caller не може підмінити material. Перед читанням і після асинхронного стиснення звіряються редакція та сеанс. Вихід, навіть із повторним входом того самого акаунта, скасовує старе завантаження.
- Новий semantic test спочатку впав на відсутньому exportOutcome. Окремо посилена перевірка закритого flag виявила зайві приватні read requests (`45 !== 41`); ранній readiness guard усунув їх до читання. Чужий учасник, відкликана згода та вихід не отримують файл.
- [CASE_OUTCOME_EXPORT.json](CASE_OUTCOME_EXPORT.json): **34/34 PASS**, FAIL/SKIP=0. Свіжо перевірені export, codec, outcome client, real journey та NeonStore. Переклад або скорочення змісту не виконуються; пробіли, Unicode і буквальний `<script>` відновлюються точно.
- Два скінченні diff review: закритий rollout не запитує приватні дані; експорт бере material тільки із server readback і не перетворює копію на import command. Ізольований mutation прибрав тільки export session epoch guard. Тест зловив повернення старої копії після logout → restore (`Missing expected rejection`); прийняті джерела не змінювалися.
- [CASE_OUTCOME_EXPORT_BROWSER.json](CASE_OUTCOME_EXPORT_BROWSER.json): **PASS_LOCAL_OUTCOME_EXPORT_BROWSER**. Реальні Chromium-кліки завантажили gzip та plain файли; обидва декодовані й звірені з точними умовами та шістьма подіями. Setup домовленості/зустрічі/подій тут seeded fixture, не повтор повного живого циклу. Повний локальний UI цикл має окремий доказ проходу 04.
- У цьому fixture payload мав **5 231 байт UTF-8**; [gzip envelope](outcome-export-gzip.json) — **1 971 байт**, [plain envelope](outcome-export-plain.json) — **7 139 байт** через base64/службовий overhead. Це вимір файлів конкретного прикладу, не доказ економії provider токенів.
- Вихід під час pending export залишив лише два попередні явні downloads, новий файл не створився; приватний DOM очищений. Local/session storage, Cache Storage та IndexedDB порожні. Axe: 0 порушень; ширина 390/390. Реальний [скриншот](outcome-export-390x844.png) переглянутий, без горизонтального переповнення.
- Окремий локальний кандидат `web_launch/dist-neon-outcomes-export-20261004`: **94 файли**, release SHA256 `c1f84433277643fc5ad5f2be1699b7f0b627f897f6bd22f9836e8071b3aa2132`. Bundled Worker побайтово відповідає проходу 04. SQL/API proofs повторно використані лише після збігу source hashes; старий client receipt тепер історичний, оновлений client перевірено свіжими тестами. Generated dist не додається до commit.
- Чужа journey-ui, чинний codec, Studio, Atelier та попередні release manifests збережені за SHA256. Browser/server процеси завершені; PostgreSQL не запускалася. Зберігаються тільки owned source, report, receipts, fixture downloads та screenshot.

**Межі:** файл містить приватні умови й підтвердження; gzip не шифрує, SHA256 не засвідчує особу автора. `authority=local_copy_not_live_server_state`, `proof_scope=participant_attestation`. Це не незалежна перевірка якості, повний backup акаунта чи відновлення бази. Поточний Studio importer має інший session archive format; viewer/import цього outcome payload ще не підключений. Підписаний HTTP JWT, два живі акаунти, фізичний Android та production не прийняті. Пакет не опублікований, secrets/readiness не активовані, push не повторювався.

**NEXT — 15–20 хвилин:** додати локальний read-only перегляд цього outcome archive через чинний codec із точними умовами/історією та явним позначенням неперевіреної копії. Відкриття файлу не має створювати серверні погодження, змінювати результат чи відновлювати акаунт.

Models used: none (provider calls=0, USD=$0.00). Витрати основної підписки не виміряні.

## Прохід 06 — локальний перегляд приватної копії

Експорт проходу 05 збережений у commit `5a385caa8adac3ace3f41a9a3d976e9365f843d3`. Цей прохід розпочато о 03:30:32 UTC до погодженого deadline.

Додано окремий `outcome-archive.html` з file picker, картками результатів, історією та згорнутими точними даними. Посилання доступне з приватного експорту. Читання не створює акаунт/store, не звертається до API й не записує погодження. File input очищується після вибору; кнопка очищення прибирає копію з DOM та скасовує незавершене читання. Сам файл на пристрої не видаляється.

- Збережений інваріант: копія показує точні умови й історію, але завжди позначена як неперевірена сервером. Незавершений обмін залишається незавершеним. Це не import/restore command та не доказ походження автора.
- До змін пройшли 13 чинних semantic tests codec/outcome client; новий тест спочатку впав на відсутньому reader. Чинний `validateOutcome` лише експортований як pure seam, без зміни його перевірок; новий reader повторно використовує ту саму перевірку ролей, послідовності та проєкції історії. Material hash і учасники перевіряються чинними business-case функціями.
- [OUTCOME_ARCHIVE.json](OUTCOME_ARCHIVE.json): **38/38 PASS**, FAIL/SKIP=0: reader, export, codec, outcome client, real journey та NeonStore. Ще **3/3 targeted allowlist/extensionless tests PASS**. Підміна умов, hash, редакції, actor ролі, вигадане приймання, чужий exported_by, інша authority/proof scope, зайві commands, пошкодження/oversize та інший archive format відхиляються. Перерахований digest не обходить перевірку внутрішньої узгодженості.
- [OUTCOME_ARCHIVE_BROWSER.json](OUTCOME_ARCHIVE_BROWSER.json): **PASS_LOCAL_OUTCOME_ARCHIVE_BROWSER**. Справжній Chromium 390×844 вибрав два файли, завантажені проходом 05, і звірив усі дані після читання. Шість подій та точний багатомовний текст збережені; `<script>` показано текстом. Копія не містить controls приймання чи серверного запису. Неправильний наступний файл відразу очищає попередню копію; pending історія не стає підтвердженою.
- Два скінченні self-review: фактичний diff додає тільки окремий reader, три public assets, посилання та export чинного validator; немає нового persistence/authority. Async selection/clear використовує generation guard та textContent. [OUTCOME_ARCHIVE_MUTATION.json](OUTCOME_ARCHIVE_MUTATION.json) прибирає тільки цей guard через локальний browser route. Перевірка ловить `Cleared archive returned after pending decode`; прийняті джерела не змінювалися.
- Current лишився default; Atelier добровільно увімкнуто й повернуто. Axe: 0 у двох режимах; ширина 390/390. [Реальний скриншот](outcome-archive-390x844.png) переглянутий. Browser зберіг тільки явно вибраний ключ вигляду; приватних local/session storage, Cache Storage та IndexedDB немає. **0 API/external requests**, 0 page errors.
- Окремий кандидат `web_launch/dist-neon-outcomes-viewer-20261004`: **97 файлів**, release SHA256 `66d460a755c4d756e1f8c9d41f938ff92a38f627fe2c23791a17df2ad9d69505`. Реальний bundled Worker локально обслужив чотири нові public paths, включно з extensionless HTML, відмовив tests/SQL/release.json і зберіг closed outcome gate 503. Старий gateway receipt має попередній assets hash і не видається за перевірку цього нового пакета. Незмінений SQL proof повторно використано за source hashes; PostgreSQL не запускалася.
- Чужа dirty journey-ui, чинні codec/Studio/Atelier, експортний UI-handler, два accepted download files та чотири попередні release manifests збережені за hash. Generated dist не додається до commit. Browser/server завершені. Owned source, proofs, screenshot та report зберігаються локальним комітом.

**Виправлення перевірок:** plain і gzip були окремими серверними readbacks, тому їхні server_now різні; кожен файл звіряється зі своїм точним payload. CSS selector `#archive-result button,input` помилково рахував також file/Atelier inputs поза результатом; область виправлена. Pause oracle спочатку затримував обидва digest calls; тепер затримує лише перший і чекає завершення обох, а mutation доводить реальне повторне заповнення DOM без guard. Targeted worker filter фактично вибрав три тести, а не два; кількість у closure gate виправлена. Це помилки test harness, не нові продуктові зміни чи послаблення acceptance.

**Межі:** локальна перевірка узгодженості не доводить справжнього автора, незалежну якість або актуальний серверний стан. Навіть повністю узгоджену копію можна створити вручну; попередження залишається завжди. Gzip не шифрує. Viewer не відновлює сервер/акаунт і не імпортує до Studio session archive. Фізичний Android, offline PWA path, два живі акаунти та підписаний HTTP JWT не перевірені. Новий пакет не опублікований; secrets, readiness, production та пам'ять не змінені, push не повторювався.

**NEXT — 15–20 хвилин:** перевірити чинний генератор соціальних чернеток і приєднати одну приватну чернетку до актуального двостороннього приймання результатів. Незавершений/спірний обмін не має перетворюватися на вигадане досягнення; публікації та зовнішніх повідомлень не виконувати.

Models used: none (provider calls=0, USD=$0.00). Витрати основної підписки не виміряні.

## Прохід 07 — приватна соціальна чернетка з прийнятого внеску

Перегляд архіву проходу 06 збережений у commit `53e5e91fb33b8327000f08d877828bde13e29458`. Цей прохід розпочато о 04:00:37 UTC до погодженого deadline.

Чинний `session-value.mjs` та Studio збережені. Новий `RealJourneyStore.socialDraft` адаптує актуальні server-response attestations до наявного чистого генератора, залишаючи його консервативний `trust=same_device_unverified` та `publishable=false`. Локальні confirmOutcome representations не надсилають голоси чи події на сервер. Додаються case/version/hash та посилання на конкретні accept event IDs.

- Збережений інваріант: мовчання, одна прийнята сторона, спір, стара редакція, відкликана згода чи прострочені умови не створюють чернетку досягнення. Вхідні caller snapshots не замінюють свіжого readback. Після отримання результату й перед поверненням повторно звіряються case, активні погодження та сеанс.
- До змін **16 чинних semantic tests PASS** (session-value та outcome client). П'ять нових тестів спочатку впали на відсутньому socialDraft; потім пройшли. Чинна поведінка генератора, архівів, погоджень і outcome transport збережена.
- Текст містить лише точні назви результатів, які надав поточний актор і прийняли їхні одержувачі. Приватні evidence/scope notes, UUID, внесок партнера та caller вигадані досягнення не додаються. Не вигадуються фізична зустріч, місто, дата, бізнес-ефект або незалежна перевірка якості. Назва власного результату все одно може містити приватні дані — UI явно просить перевірити їх і дозволи перед зовнішнім поширенням.
- Компактні controls згорнуті в «Приватна соціальна чернетка» й з'являються тільки після всіх приймань та чинних погоджень. Є окрема явна згода на локальну підготовку, general/LinkedIn формат, редаговане поле та ручне виділення. Зміна формату потребує нового вибору; Synera не пише в OS clipboard і не публікує пост.
- [CASE_SOCIAL_BROWSER_RED.json](CASE_SOCIAL_BROWSER_RED.json) відтворив реальний дефект: скасування локальної згоди під час pending read не блокувало повернення чернетки. Вузький generation guard відкидає відповідь після скасування, зміни формату, очищення або зміни контексту. Той самий Chromium сценарій після правки пройшов; згоди не поновлюються автоматично після скасування.
- [CASE_SOCIAL_DRAFT.json](CASE_SOCIAL_DRAFT.json): **49/49 PASS**, FAIL/SKIP=0 — social draft, незмінний session-value, outcome archive/export/codec/client, real journey та NeonStore. Закритий flag й невідомий wording не роблять private requests; outsider/withdrawn consent відхиляються. Матеріальна зміна та expiry блокують стару чернетку.
- Два скінченні self-review фактичного diff: повторно використаний наявний генератор без підміни його trust/identity semantics; генерація не змінює outcome history і не включає дані партнера. Другий join перевірив UI cancellation та приватне очищення. Ізольований mutation прибирає тільки social session epoch comparison. Semantic test ловить повернення чернетки після завершеного outcome read → logout → restore того самого акаунта (`Missing expected rejection`); канонічні файли не змінювалися.
- [CASE_SOCIAL_BROWSER.json](CASE_SOCIAL_BROWSER.json): **PASS_LOCAL_CASE_SOCIAL_BROWSER**, шість поведінкових checks. Справжні Chromium-кліки пройшли partial → completed, явну підготовку, LinkedIn формат, редагування/виділення, pending скасування, відкликання case approval та logout. Events count не зріс через генерацію; `<script>` у target залишається текстом. Account/meeting/outcome setup та RPC тут fixtures, не два реальні користувачі.
- Current залишився default; Atelier увімкнуто й повернуто. Axe: 0 у двох режимах, ширина 390/390. [Справжній скриншот](case-social-draft-390x844.png) переглянутий. Browser storage містив тільки явно вибраний ключ вигляду; приватного storage немає. External requests=0, page errors=0. Chromium та server завершені.
- Окремий локальний кандидат `web_launch/dist-neon-outcomes-social-20261004`: **97 файлів**, release SHA256 `2b1d574f415c253415c94fdd06451278cd0697a8a15f0d118a601d7dce3e30d8`. Client/UI/generator bytes відповідають прийнятим джерелам; bundled Worker побайтово збігається з проходом 06. Tests/fixtures/SQL до public assets не входять. Generated dist не додається до commit.
- SQL proof повторно використано за незмінними source hashes; PostgreSQL не запускалася. Чужа dirty journey-ui, codec, session-value/test, Studio, Atelier, public asset allowlist, reader sources та п'ять старих release manifests збережені за hash. Попередні client/UI receipts є історичними snapshots, не хибним exact-hash доказом оновленого client/UI.

**Межі:** це deterministic template, не живий LLM та не LinkedIn integration. Метадані пояснюють джерела, але не доводять незалежну якість чи фізичну зустріч. Користувач може змінити текст локально — його редагування не проходить фактчек. Немає OAuth, автоматичного постингу, згоди партнера на публічне поширення, зображень/відео чи OS clipboard proof. Фізичний Android, два живі акаунти та підписаний HTTP JWT не прийняті. Новий пакет не опубліковано, production/secrets/readiness/пам'ять не змінені, push не повторювався.

**NEXT — 15–20 хвилин:** перевірити чинний meeting-location flow і передачу погодженого місця до запрошення/розмови real journey. Один semantic guard має довести, що зміна місця або запізніла відповідь не підміняє згоду другого учасника; Google provider не активувати.

Models used: none (provider calls=0, USD=$0.00). Витрати основної підписки не виміряні.

## Прохід 08 — 04:30–04:50 UTC: окреме двостороннє погодження адреси

**Результат:** знайдений реальний дефект старого location SQL: учасник міг одноосібно PATCH-нути `meeting_address` вже прийнятої зустрічі. Старий trigger лише скасовував GPS. Додана окрема review-міграція [meeting-address-agreement.migration.sql](../../neon/meeting-address-agreement.migration.sql); старі generated migrations та чинний frontend збережені.

**Інваріант:** адреса зустрічі змінюється лише після явної згоди іншого учасника на конкретну останню пропозицію, поточну редакцію кейсу та той самий час/місто. Мовчання не є згодою. Нова пропозиція не переносить старе приймання; відмова й запізніла відповідь не змінюють встановлену адресу. Історія пропозицій/рішень залишається приватною.

- [MEETING_ADDRESS_RED.json](MEETING_ADDRESS_RED.json): той самий [semantic direct-patch guard](../../neon/meeting-address-direct-patch.regression.sql) до продуктової зміни впав на `One participant changed the address without peer approval`. Це справжній UPDATE під authenticated/RLS, а не пошук literals. Фікстуру прийнятої зустрічі зі сталим UUID створила локальна owner-роль; цей seed не доводить клієнтське запрошення.
- Additive SQL відкликає тільки старий прямий UPDATE адреси; окреме RPC `synera_meeting_address` отримує actor/time із сервера. `propose`, `accept`, `decline`, `state` прив'язані до пари, кейсу/version/hash і meeting snapshot. Пропозиція рахує явний вибір автора; лише інший учасник може прийняти чи відхилити. Повторний exact intent не дублює подію; змінений або superseded intent дає conflict.
- Події append-only для клієнтів: немає table/sequence grants, функція лише додає записи. Попередні адреси й actor decisions не перезаписуються. Встановлення прийнятої адреси та відкликання двох GPS-grants виконуються в одній SQL-транзакції через незмінний старий trigger. Pending пропозиція не відкликає GPS на раніше встановлену адресу.
- [MEETING_ADDRESS_SQL.json](MEETING_ADDRESS_SQL.json): **PASS_LOCAL_MEETING_ADDRESS_SQL**. Два повні semantic SQL/RLS проходи перевірили початковий стан, пропозицію, self-accept denial, exact retries, підміну intent/actor, missing/false consent, private table denial, дві GPS-відміни, superseded/declined choices, взаємні ролі, збережені сім подій, outsider/anonymous, зміну розкладу, реальну нову material/hash/version, повторні case approvals, expiry, online/missing city, withdrawal, відсутню згоду партнера, block, закриття кейсу та незмінний sender cancel шлях.
- Перший скінченний self-review фактичного diff знайшов NULL у legacy `meeting_place`: SQL three-valued logic пропускала пропозицію без міста. Доданий semantic test відтворив це в [MEETING_ADDRESS_NULL_PLACE_RED.json](MEETING_ADDRESS_NULL_PLACE_RED.json); одна вузька перевірка `is null` закрила дефект. Другий self-review перевірив admission, intent/history і межу міграції та посилив тести material revision/expiry; додаткових продуктових правок немає.
- Adversarial mutation прибирає лише перевірку іншого актора в ізольованому SQL body. Той самий цикл ловить `Proposer accepted own address`; canonical migration не змінювалася. Після ROLLBACK канонічний цикл знову пройшов. Fixture consent absence зроблена owner-перенесенням рядка на нового disposable user, без DELETE й без послаблення constraints. Невдала первинна fixture спроба policy-version update була виправлена під фактичний CHECK контракт; продуктова політика не змінена.
- Readback після ROLLBACK: нової таблиці немає, fixture users/cases/meetings = **0**. Унікальні локальні acceptance DB збережені. [MEETING_ADDRESS_RUNTIME_STOPPED.json](MEETING_ADDRESS_RUNTIME_STOPPED.json): PG зупинена, listener 55331 відсутній. Source hashes фінального receipt звірені; старі чотири міграції, regression guard і чужа dirty journey-ui збережені. RED receipt є історичним snapshot harness до розширення revision fixture, не exact-hash доказом фінального harness.

**Межі та ризик:** це лише локальний серверний контракт. Немає нового Worker route, feature flag, клієнтського адаптера, UI-кліків, Google Places/Maps provider, маршрутної справедливості чи живої навігації. Міграцію не можна викатувати окремо від нового API/UI: старий `setMeetingAddress` після відкликання його UPDATE privilege відмовлятиме. Поточний UI і демосайт не змінені. Послідовні identity-shim SQL тести не доводять concurrent HTTP clients, signed JWT, два живі акаунти, фізичний Android, production чи незалежну правдивість адреси. Case/meeting та approval/consent rows блокуються на час запису; конкурентне відкликання admission/block окремими з'єднаннями не прийняте цим proof. Власник БД лишається довіреною адміністративною межею; це не криптографічно підписана історія. Production, secrets, providers, публікації та пам'ять не змінені; push не повторювався.

**NEXT — 15–20 хвилин:** додати один закритий за замовчуванням Worker route до цього fixed RPC та semantic gate для actor/proposal/version, зберігши чинні location routes. UI та production не активувати в цьому кроці.

Models used: none (provider calls=0, USD=$0.00). Витрати основної підписки не виміряні.
