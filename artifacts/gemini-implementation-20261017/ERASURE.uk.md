# Стирання профілю та відкликання доступу застосунку

17.10.2026. Код реалізовано та прийнято на disposable локальному PostgreSQL 16.15; production не змінювався. Gate `SYNERA_PROFILE_ERASURE_READY` за замовчуванням вимкнений. Наявний `deleteProfile()` та його FK/409-контракт збережені.

Після completion review2 (18.10.2026) чинний SQL SHA — `2b7e6012ea3c2306f768c102d76ff47a751eeb2fc9393fa544a1ea52c81e61dd`. Чинні receipts: `ERASURE_SQL_REVIEW2_FINAL_VERIFIED.json` (12/12), `ERASURE_REVIEW2_LOCKS_VERIFIED.json` (4/4), `ERASURE_REVIEW2_OUTCOME_FINAL_VERIFIED.json` (3/3). Подробиці й історія нижче; усі попередні SQL SHA/receipts є bounded історією, а не прийманням цього SHA.

## Контракт

`config.profileErasureEnabled` → `NeonStore.eraseProfileData()` → same-origin `POST /api/neon/profile-erasure` з точним `{confirm:"ERASE_APPLICATION_DATA"}` → Data API RPC `synera_erase_profile_data()` без аргументів.

Особа походить від провайдерської сесії/JWT через вже наявний `synera_user_id()`. Клієнт не може передати ID цілі. Міграція є новим авторським Neon SQL, не редагуванням заморожених/generated міграцій і не SQL із неперевіреного звіту Gemini.

Перевірена відповідь: `{status:"application_data_erased",providerDeletion:"pending",retainedScope:"bilateral_records_and_safety_evidence",repeated:boolean,sessionRevoked:boolean}`. Повторний запит повертає той самий scope та `repeated:true`.

Після committed SQL gateway пробує відкликати лише захоплену провайдерську сесію. Помилка sign-out повертає `sessionRevoked:false`: SQL не відкочується й це не називається повним видаленням акаунта. Успішна або помилкова відповідь erasure ніколи не змінює cookie: запізніла відповідь A не повинна стерти новий вхід B. Клієнт очищає user тільки для того самого об'єкта сесії; повторний вхід навіть у A створює новий контекст. Запізнілий 401 також не очищає новий user.

## Що прибирається і що лишається

| Поверхня | Дія й межа |
|---|---|
| `profiles` | UUID-рядок лишається через group-room RESTRICT; display_name замінюється, city/offers/seeks очищуються, повний `brief` повертається до порожнього default, discoverability/map вимикаються. Це псевдонімізація, не анонімність. |
| Копії імен у `meeting_requests` | Ім'я саме цього учасника замінюється; інше ім'я не змінюється. Note, погоджена адреса/час і статус зберігаються як спільний запис. |
| `meeting_location_grants` | Активні grants в обох напрямках відкликаються атомарно; metadata та consent intents зберігаються як історія дозволу. |
| Зразки location KV | SQL-відкликання блокує disclosure; ця операція не обіцяє фізичний purge KV. Наявний owner зберігає TTL до абсолютного `closes_at`; in-flight KV storage, резервні копії та провайдерська retention потребують окремої перевірки. |
| `profile_erasures` | Мінімальний UUID/час/`pending` tombstone зберігається без Auth FK, щоб майбутнє provider deletion не відновило доступ. API не має table grants. |
| Pilot membership / consent | Наявний email admission рядок самого актора відкликається (DELETE через його Auth identity); згода зберігається як safety evidence. Email у tombstone не додається. Новий provider sub для тієї самої email потребує нового явного admission оператором; old sub навіть після повторного admission блокує UUID tombstone. |
| Cases / approvals / outcomes | Версії, hashes, тексти, події та ідентифікатори лишаються як спільна історія. Вони можуть ідентифікувати людину. |
| Meetings / messages / addresses | Спільні тексти та історія погоджень лишаються. Друга сторона зберігає дозволений доступ за наявним контрактом; доступ до окремих RPC може вимагати поточної eligibility обох сторін. |
| Group rooms / members / messages / events | FK-граф не видаляється. Hidden profile зупиняє eligibility; спільні transcripts/events можуть містити персональний текст. |
| Blocks / reports / write limits | Записи безпеки/антизловживань зберігаються. Це технічний scope, не визначений юридичний строк retention. |
| `neon_auth` / сесії інших пристроїв | Не видаляються прямим SQL. Provider identity deletion лишається `pending`; старий JWT не може відновити app profile. Повне provider-session revocation не заявляється. |
| Експорти / backups / чужі копії | Ця операція не гарантує їх видалення. |

Тобто це стирання полів app profile і відкликання доступу застосунку з явно збереженими записами. Юридичні підстави, строки збереження й повне право на видалення потребують окремого підтвердження; статус не означає «усі персональні дані видалено».

## SQL та межі авторизації

Міграція застосовується лише після повного актуального Neon journey stack. RPC не має цільового параметра, відхиляє null/неприйняту identity, використовує порожній `search_path`, явні grants та actor lock. Чинний порядок erasure: **actor advisory → profile row**. BEFORE STATEMENT SECURITY INVOKER trigger бере той самий caller lock до tuple/conflict роботи INSERT/UPDATE/UPSERT; BEFORE ROW definer лише перевіряє приватний tombstone. Це зберігає fence для відсутнього профілю та усуває перевірену інверсію old UPSERT/erasure. Наявний UUID FK-граф, матеріали/хеші домовленостей і чужий профіль не переписуються.

SQL acceptance runner: `tools/profile-erasure-sql-acceptance.mjs`; той самий `SYNERA_ACCEPTANCE_PSQL`, `SYNERA_ACCEPTANCE_PGHOST`, `SYNERA_ACCEPTANCE_PGPORT`, `SYNERA_ACCEPTANCE_PGUSER`. Віддалені хости відхиляються. Створює лише `synera_erasure_<timestamp>` на disposable loopback Postgres і зберігає базу для огляду. Виконує справжній SQL з identity shim; це не signed HTTP JWT чи Neon Auth acceptance.

## Перевірки цього worker

- `node --test neon/profile-erasure.test.mjs neon/profile-delete.test.mjs web_launch/neon-store.test.mjs`: **21/21 PASS**. У тому числі disabled gate, no arbitrary target, CSRF, missing session, malformed receipt, 401/403/409/429/503, provider sign-out failure, delayed success A→B / A→new A, delayed A401, старий deleteProfile/409.
- `node --test neon/worker.test.mjs`: **20/20 PASS** після відновлення exact canonical source closure координаторкою. Початкові два ENOENT через sparse checkout не приховані.
- `node neon/build.mjs dist-neon-erasure-20261017`: **PASS**, 103 файли, `published:false`. Build включає новий helper у scoped bundle та відмовляється при неоглянутих імпортах.
- `node --check tools/profile-erasure-sql-acceptance.mjs`: **PASS**.
- Перший real-SQL probe `55331`: **NOT_ACCEPTED — connection refused**, збережений у `ERASURE_SQL.json` як історія невдалого запуску; failure не перезаписаний.
- Початкова реалізація: координаторка виконала runner на PostgreSQL **16.15 / 127.0.0.1:55332**, disposable DB `synera_erasure_1792268577847`: **PASS_LOCAL_PROFILE_ERASURE_SQL, exit 0, 10/10 checks**. Початковий receipt [ERASURE_SQL_ACCEPTED.json](ERASURE_SQL_ACCEPTED.json) та [readback](ERASURE_RECEIPT_READBACK.json) збережені незмінними. Вони стосуються лише SHA `aec81a42...` і після review1 **не є acceptance поточного SQL**.

Цей фактичний SQL run включає atomic injected-failure rollback, overlapping erasure з реальною lock barrier, room RESTRICT, no-target/anonymous/null/unadmitted rejection, exact profile/brief/name erasure та незмінність чужих профілів, двостороннє location revocation, retained graph, stale-JWT read/write/RPC denial, peer evidence, tombstone permissions і semantic admission mutation → expected RED → restoration. Це локальний PostgreSQL з identity shim: signed HTTP JWT, реальний Neon Auth, видалення провайдерської identity та production rollout цим run не приймаються.

## Completion review1 — 18.10.2026

Знайдено й фактично відтворено пропущену гонку: `synera_case_outcome` перевіряв membership до очікування case lock. Запит B починався, чекав case lock, erasure B commit проходив, після розблокування RPC повертав retained state. Негативний oracle завершився очікуваним RED: [ERASURE_REVIEW1_BASELINE_RED.json](ERASURE_REVIEW1_BASELINE_RED.json). Accepted base DB не змінювалася; replay працює на власній disposable копії.

Вузьке виправлення знаходиться тільки в новій erasure-міграції: точне похідне визначення існуючого outcome RPC блокує профіль актора `FOR SHARE` і повторно перевіряє admission **після оригінальної перевірки case та його lock**. Уся outcome-транзакція тримає profile lock; erasure бере `FOR UPDATE` того самого профілю. Паралельні операції серіалізуються. Порядок case → profile не додає зворотного case lock до erasure: erasure зберігає profile → actor advisory → meeting/location. Auth actor досі походить тільки з незміненого `synera_user_id()` / provider `auth.uid()`.

Заморожений `neon/case-outcome.migration.sql` не змінено: SHA `5cd6a796b2abe15c01661074e192cc8d0e3de860ca1883855e10a5f5a7073ef6`. `neon/profile-erasure-generate.mjs` відмовляється від неперевіреного source SHA та генерує лише позначений блок нової erasure-міграції; generation test перевіряє closure й altered-source rejection.

Проміжний варіант `9b108588...` **відхилено**: доданий `PERFORM` перед старим `IF NOT FOUND` змінював `FOUND` і міг допустити nonexistent case. Це відтворено реальним SQL (`Missing case admitted by derived guard`); guard перенесено після незмінного старого case check. Старі проміжні receipts, включно з `ERASURE_SQL_REVIEW1_ACCEPTED.json` та `ERASURE_REVIEW1_FINAL_RETRY_ACCEPTED.json`, збережені як історія, **не фінальна acceptance**. Окремий clone-timeout також збережено у `ERASURE_REVIEW1_FINAL_ACCEPTED.json`; цей запис має `NOT_ACCEPTED`.

SQL SHA результату review1, згодом замінений review2: **`15b6584eb1381ad29bc642f57177b42eaaf524b048caa44e78ae36338aafd65e`**.

- [ERASURE_REVIEW1_VERIFIED.json](ERASURE_REVIEW1_VERIFIED.json): **3/3 PASS** — nonexistent case denied; blocked outcome denied after erasure commit; erasure waits for an already-admitted outcome transaction. Runner повторно перевіряє source hashes наприкінці, drift не було.
- [ERASURE_SQL_REVIEW1_VERIFIED.json](ERASURE_SQL_REVIEW1_VERIFIED.json): **10/10 PASS**, disposable PG16.15 / 127.0.0.1:55332 / `synera_erasure_1792278629871`, саме для поточного SHA.
- [ERASURE_REVIEW1_SURFACES.json](ERASURE_REVIEW1_SURFACES.json): **PASS**, `neon/profile-erasure-surfaces.acceptance.sql` перевірив усі data-bearing authenticated RPC, 8 REST tables, приватні tables/helpers, safe empty location/list replies та дозволений idempotent erasure receipt. Закінчився `ROLLBACK`.
- `node --test neon/profile-erasure.test.mjs neon/profile-erasure-generation.test.mjs neon/profile-delete.test.mjs neon/worker.test.mjs web_launch/neon-store.test.mjs`: **42/42 PASS**.

Наявні address/location/room mutators перечитують eligibility після своїх відповідних row waits; інший учасник зберігає початковий контракт доступу до дозволеної спільної історії. Це не обіцянка відкликати байти, вже прочитані до стирання, і не новий provider-session revocation механізм. Retention inventory вище не розширений.

## Completion review2 — 18.10.2026

1. Відтворено client race: session `restore()`, запущений перед erasure, міг після успішного стирання повернути local user A. Oracle спочатку впав на `c99a774...`: [ERASURE_REVIEW2_CLIENT_BASELINE_RED.json](ERASURE_REVIEW2_CLIENT_BASELINE_RED.json). Вузький guard у `NeonStore.restore()` перевіряє незмінного актора й ревізію restore-запиту; обидва порядки overlapping restore зберігають найновіший запит. Поточний store SHA `ba054fcb10d851cab6e1a80c2bef4eb97fc7bb8d23942320fed3be44ccb3854b`. Запізнілі erase success/401 і re-login A/B tests збережені.
2. За advisory GLM відтворено **реальний PostgreSQL deadlock** row→advisory проти UPSERT advisory→conflict/tuple: [ERASURE_REVIEW2_LOCK_BASELINE_RED.json](ERASURE_REVIEW2_LOCK_BASELINE_RED.json). Advisory locks не видалені навмання: спільний actor lock перенесений у BEFORE STATEMENT, а erasure бере його перед row lock. Новий helper SECURITY INVOKER, fixed search_path, без API EXECUTE grants. Private tombstone check залишається в row guard. Чотири actual UPSERT/RPC сценарії з transaction barriers пройшли: [ERASURE_REVIEW2_LOCKS_VERIFIED.json](ERASURE_REVIEW2_LOCKS_VERIFIED.json).
3. Окремо від stale JWT підтверджено **future identity lifecycle** gap: fresh provider sub для erased verified email успадковував старий admission. [ERASURE_REVIEW2_LIFECYCLE_BASELINE_RED.json](ERASURE_REVIEW2_LIFECYCLE_BASELINE_RED.json). Erasure тепер відкликає наявний email admission через derived actor/Auth join; raw email не копіюється в tombstone. Synthetic fresh-sub lifecycle та незмінність peer admission проходять. Реальне provider deletion/recreation не виконувалося; `providerDeletion` лишається `pending`. Свідоме повторне admission оператором для нової identity — новий дозволений крок, не автоматичне відновлення.

GLM traces про відсутній membership RLS або невідомі actor RPC не прийняті як встановлені дефекти: фактичні `meeting_requests` policies мають restrictive `synera_members_only`, write column grants обмежені, а actual RPC bodies/усі post-erasure surfaces перевірені. Масового копіювання outcome fence чи нового meeting trigger не додано. Модельний текст не замінює source/SQL oracle; canonical provider receipt та mandatory Chinese linkage належать root.

Поточні докази:

- [ERASURE_SQL_REVIEW2_FINAL_VERIFIED.json](ERASURE_SQL_REVIEW2_FINAL_VERIFIED.json): **12/12 PASS**, PG16.15 / loopback55332 / `synera_erasure_1792279332074`. Включає direct RPC/REST/private grants та new-sub lifecycle. Mutation guard після email withdrawal окремо перевіряється через temporary fixture re-admission; `finally` відновлює helper і withdraw admission.
- [ERASURE_REVIEW2_LOCKS_VERIFIED.json](ERASURE_REVIEW2_LOCKS_VERIFIED.json): **4/4 PASS**, existing/missing × erase-first/upsert-first. Дані після erasure не відновлюються; missing profile теж fenced.
- [ERASURE_REVIEW2_OUTCOME_FINAL_VERIFIED.json](ERASURE_REVIEW2_OUTCOME_FINAL_VERIFIED.json): **3/3 PASS** на власних copies саме свіжої 12-check бази. Historical local DB не потрібна.
- Node: **44/44 PASS** у п'яти відповідних suites, включно з source generation altered-hash rejection, legacy delete/409 та новими restore races.
- Старий outcome body поза вузьким profile/membership fence збережений byte-for-byte: original missing/unauthorized/expired/version/hash/idempotency checks та grants не переписувалися. Старі прикладні міграції не змінені.
- [ERASURE_CI.uk.md](ERASURE_CI.uk.md): точні Bash команди для наявного wrapper/service та трьох acceptance scripts. Full runner сам включає surfaces/lifecycle; remaining scripts беруть fresh database із його receipt.

`ERASURE_SQL_REVIEW2_FINAL.json` з `NOT_ACCEPTED` збережено: його старий mutation oracle не ізолював UUID tombstone після відкликання email admission. Ця перевірка посилена disposable fixture re-admission, а не послаблена. Усі попередні immutable receipts та rejected/intermediate докази збережені. Поточні hashes записані окремо в `ERASURE_SOURCE_REVIEW2.json`.

## Провайдерська залежність

Перевірено офіційні [Neon user management](https://neon.com/docs/auth/guides/user-management), [керування Auth через API](https://neon.com/docs/auth/guides/manage-auth-api), [Neon managed Better Auth](https://neon.com/docs/auth/overview) та [Better Auth deletion requirements](https://better-auth.com/docs/concepts/users-accounts). Це не доводить, що конкретний deployed Neon Auth дозволяє self-service `deleteUser`: потрібні enabled capability, fresh-session/verification контракт і реальне provider readback. Management API має окрему авторизацію; нові owner keys не додаються. Старий project-only delete endpoint у [Neon API reference](https://api-docs.neon.tech/reference/deleteneonauthuser) позначений deprecated; його не викликаємо.

NEXT: координаторці незалежно прийняти фінальний SHA/receipts та current-store browser readback. Два finite child reviews завершені; нових правок після acceptance не потрібно. Gate залишається disabled до окремо перевіреного rollout; production apply/deploy і повне provider account deletion не виконані.

Models used by this worker: none (provider calls=0, USD=$0.00). Обов'язкова Chinese-model перевірка та shared cap належать root і цим звітом не закриваються.
