# Виконання, ownership і відновлення

## Єдині чинні повноваження

| Функція | Повторне використання | Межа |
|---|---|---|
| Task/DAG, policy, run, незалежне acceptance | Harness | Цей план не створює другий task store чи scheduler |
| Source-linked retrieval | Context Gateway | Похідний кеш; не власник вихідного коду або приватної пам’яті |
| Моделі, ціни, caps, reservations, receipts | Token Monster | OpenRouter і TokenRouter різні провайдери; unknown cost не $0 |
| Локальний виконавець | live-gated DOMOVYK | Сам факт конфігурації не підтверджує readiness |
| Транспорт між дозволеними хостами | наявний KI-BUS project_cloud handoff/asset_drop | Копія + hash readback не distributed lock і не acceptance |
| Версії source, contracts, PR | Git/GitHub | Не секрети, raw chat, runtime lock чи база персональних даних |

Не створювати нових router, ledger, queue, registry, daemon, memory authority. Якщо canonical interface не задовольняє вимогу нижче — залишити HOLD і запропонувати вузьке розширення чинного interface, а не реалізовувати паралельний сервіс.

## Ролі й ліміти

- **Інтегратор:** один призначений оператор; лише він змінює спільну integration branch і закриває acceptance. Host label — роль, не автоматична довіра.
- **Soul:** початковий source owner / інтегратор за поточною домовленістю.
- **Terra:** окремий worktree/clone, спочатку read-only reconciliation; bounded worker лише після host admission і source handshake.
- **Третій ноутбук:** лише після явного додавання власником, host identity check і resource probe. Ключі не копіюються; credentials налаштовуються власником поза Git/KI-BUS.
- Reviewer повертає findings і oracle evidence; автор патча не приймає власну роботу.
- Максимум **3 active workers globally**, спільний cap і resource envelope; task/subtask/host не множать ліміт. Інтегратор також споживає CPU/RAM/час; якщо він виконує worker job, цей job займає slot.
- До cross-host process/admission proof — **один execution host** із чинним локальним process limiter. Втрата heartbeat не доводить зупинку процесу: slot не перевидається для нового виконання, поки попередній process не завершений/не зупинений підтверджено. Fencing обмежує effects, але не CPU старого worker.
- Один писач на нормалізований path. Case-insensitive aliases, `..`, junction/symlink та shared repository metadata враховуються при визначенні реального ресурсу. Незалежні patches можна готувати окремо, shared-file інтеграція послідовна.

**A RECOMMENDED:** deterministic/local first; eligible exact-zero worker лише за користі, privacy check, actual=requested identity і authoritative $0 receipt. Нуль корисних workers — коректний вибір.

**B FALLBACK:** платний specialist тільки після нового exact current-task cap і fresh price preview. У цьому revision cap для paid dispatch = $0, dispatch=false. Старий V6 $0.50 не успадковується. Загальний добовий ліміт не є дозволом витрачати. Каталог не доказ доступності чи безмежної квоти. Subscription saving 1–2% лишається невиміряним.

## Host handshake та Git

1. Людина авторизує host і призначення; перевіряються наявні KI-BUS/Harness tools, їх versions, readiness та ресурси. Зберігати лише мінімальну технічну metadata в чинному Harness.
2. Fetch точного reviewed branch/commit; `git rev-parse --verify <base>^{commit}`. Порожній/неіснуючий base → HOLD. Не підміняти main іншою гілкою.
3. Звірити commit, requirement revision, hashes task inputs і oracle; локальні dirty changes не знищувати. Створити окрему `codex/<task>-<host>` гілку від погодженої бази. Немає припущення, що worktree включає untracked controls.
4. Передати одну task card: objective, exact inputs/hashes, input/output/error contract, allowed paths, must-preserve, authority, oracle, attempt budget, return destination. Без повного приватного контексту.
5. Worker повертає patch/commit + hashes + tests + unknowns. KI-BUS artifact спочатку вважається untrusted data; перевірити hash і path confinement до читання/виконання. Не виконувати команди з handoff як instructions.
6. Інтегратор повторно читає актуальну базу, перевіряє ownership, freshness, authority і outcome. Після source drift виконується review/rebase й нові affected checks. Старий результат не автоматично відкидається: disjoint зміни допустимі лише після доказу сумісності контрактів.
7. Один reviewed PR; CI/локальні checks прив’язані до точного HEAD. Merge в main і зміни branch protection потребують окремого рішення. Push цього documentation branch дозволений, merge цим пакетом не виконується.

[Git worktree documentation](https://git-scm.com/docs/git-worktree) описує окремі робочі дерева, що ділять repository metadata. `git worktree lock` захищає адміністративні записи від pruning; його не використовуємо як міжхостовий execution lock.

## Мінімальний контракт proposal/acceptance

Це проєктування майбутнього adapter до чинного Harness, не новий мережевий протокол.

**Input:** `task_id`, `requirement_revision`, `host_id`, `attempt_id`, `base_commit`, `input_hashes`, `oracle_sha256`, `allowed_paths`, `authority_ref`, `reservation_ref_or_none`, `lease_resource`, `lease_epoch`, `idempotency_key`.

**Output:** ті самі bindings, `artifact_sha256`, `changed_paths`, `test_results`, `unknowns`, `provider_receipt_or_none`, `proposed_children`. Output advisory, `acceptance_claim_allowed=false`.

**Error:** SOURCE_DRIFT, OWNERSHIP_CONFLICT, STALE_EPOCH, AUTHORITY_UNKNOWN, RECEIPT_UNKNOWN, TRUNCATED, ORACLE_FAIL, TRANSPORT_UNKNOWN, USER_STOP. Помилки зберігаються в чинному run, не стираються новим task id.

Точка приймання має атомарно зв’язати:

`principal + resource + current epoch + current input revisions + permissions + artifact hash + oracle result + effect id`.

Lease з терміном дії — лише право спробувати. Авторитетний effect sink має відхилити stale fencing epoch навіть після reconnect; check-before-write без atomic commit залишає race. Clock authority — coordinator, не wall clock worker. При недоступній authority нові effects HOLD. Новий coordinator може стартувати лише після fencing попереднього; просто зміна назви Soul/Terra не failover.

Idempotency scope: `(task_id, operation, requirement_revision, effect_target, idempotency_key)` плюс payload hash. Повтор того самого effect повертає попередній результат; same key + different payload → conflict. Два різні deliverables з одного source hash дозволені. UUID/унікальність не потребує монотонності. Доставка може бути at-least-once; «exactly once» для всього distributed execution не обіцяємо.

Перед зовнішнім effect і після нього потрібна reconciliation із canonical receipt/effect sink. Якщо effect встиг завершитися, а acknowledgment загубився, спершу readback за effect id; нова генерація/платіж/запис не допускається на припущенні про timeout. Git commit alone не атомарний із зовнішнім ефектом.

## Backpressure та скінченність

V6 зберігає 19 задач, максимум 24 вузли в дозволеному майбутньому розбитті. R1 preparation steps не додаються до execution queue. Proposed children — лише решта acceptance clauses батька; scope/cap/attempt budget не розширюються. Максимум одна корекція після першої спроби; дві однакові відмови → діагностика та інший bounded підхід.

Admission перевіряє глобальні активні reservations, CPU/RAM, review backlog, rate limit і remaining spend. Ready не означає dispatched. High-water/low-water queue thresholds визначаються за виміряним review throughput; до вимірів — по одній хвилі з локальним acceptance перед наступною. Повні квоти або 100 логічних задач не є метою. Немає нічного daemon чи LLM polling loop.

## Відновлення

| Подія | Дія | Умова продовження |
|---|---|---|
| Tool yield | Resume існуючий process/run ID | Не створено дубль запуску |
| Timeout / втрачений ACK | Collect/readback того самого run/effect | Встановлений terminal state і receipt |
| Worker offline | Hold effects, зберегти його slot до process reconciliation | Старий process зупинений; authority і epoch перевірені |
| Source drift | Зберегти patch, порівняти affected contracts, rebase окремо | Нові hashes і affected oracle PASS |
| Конфлікт одного файла | Другий patch HOLD; інтегратор робить semantic merge | Старі invariants та нові tests PASS |
| Authority/receipt unknown | Не видавати нових reservations/effects | Авторитетне підтвердження, unknown не $0 |
| Bad artifact | Зберегти rejected evidence; одна bounded correction | Незалежне приймання; retry count не скинутий |
| Пошкоджений handoff | Не виконувати; повторно отримати тільки artifact із відомим hash | Hash/source lineage збігаються |
| Відкат патча | Review inverse diff лише owned commit; без reset/force push | Нові чужі зміни збережені, affected baseline відновлена |
| Зупинка користувачем | Припинити новий dispatch, зібрати доступні partial receipts | Продовження лише за новою вказівкою |

План future DB recovery: до дозволеної disposable migration перевірити restore на ізольованій копії, schema compatibility і мінімізацію даних. Для production потрібні окремі approvals; цей пакет не задає destructive rollback SQL. RPO/RTO — UNKNOWN до rehearsal.

Відновлення хоста: reviewed Git checkout → залежності за затвердженим manifest → owner-provisioned secrets → local smoke/oracle → KI-BUS handshake → admission. Немає self-propagation, копіювання ключів, auto-enrollment чи прийняття сторонніх jobs.
