# Synera: робочий процес від вимоги до прийнятого результату

## Призначення

Повна технологічна карта для [19 задач V6](../TASKS.json). Доповнює [продуктову специфікацію](../EXECUTION_PLAN.uk.md), не замінює її. Під «ДНК» тут маємо на увазі незмінні інваріанти, контракти компонентів, правила передачі роботи та критерії випуску. Мета — не обіцянка відсутності помилок, а перевірюваний процес їх виявлення, локалізації й виправлення.

Власниця кінцевого приймання — поточна операторка Codex; для зрозумілості дизайну, правових питань і реального бізнес-результату потрібні відповідні люди. Вузол може бути технічно завершений, а продукт усе ще неприйнятий. У кожному звіті ці стани окремі.

## ДНК: десять незмінних умов

1. Principal A може підтвердити тільки власну сторону; actor береться з перевіреної сервером сесії, не з body.
2. Зміна матеріальних умов скидає обидва погодження; approval прив'язаний до case ID, версії і хешу.
3. Відкликання, expiry, конфлікт версії й невідома згода блокують introduction.
4. Ціни/строки/компенсація — підтверджені введення людей, не припущення моделі.
5. Люди не отримують рейтинг цінності або надійності.
6. Synthetic, невідповіді, спори й невідомі витрати не приховуються в бізнес-метриках.
7. Профіль, transcript і worker output — недовірені дані; вони не видають дозволів.
8. Один файл має одного активного писача; частковий output не інтегрується.
9. Scope, privacy і сукупний бюджет не розширюються через підзадачі чи retry.
10. Завершення дії, зелений тест або квитанція не замінюють приймання актуальної вимоги.

## Де живе процес

| Відповідальність | Наявний власник | Цей пакет |
|---|---|---|
| Об'єктив, dependencies, execution records, claims | Harness | TASKS.json і task-card fields — вхідні дані |
| Пошук джерел | Context Gateway | source paths/hashes, мінімальна капсула |
| Моделі, reservations, usage receipts | Token Monster | посилання на canonical run/job/receipt |
| Transport | чинний KI-BUS/DOMOVYK | повідомлення з ідентифікаторами, без credentials |
| Приймання | оператор + чинний materializer accept-check | приклад product-acceptance.json з фактичним HOLD |
| Перевірка структури плану | canonical Harness analyze_dag | check_workflow.py: read-only перевірка полів і виклик analyze_dag |

Це не новий scheduler, ledger, daemon або джерело дозволів. Структурний PASS не дозволяє dispatch. Файли reports — разові докази, не друга база runtime-станів.

## Технологічні станції

| Станція | Вхід | Робота / вихід | Умова переходу |
|---|---|---|---|
| S0 INPUT | user requirement + revision | Зафіксувати objective, scope, current authority і required outcomes | Немає невизначеності, що змінює коректність цього вузла |
| S1 INSPECT | task card + current sources | git/status/history, чинні тести, джерела/hash, список власників | Baseline відомий; чужі зміни ізольовані |
| S2 CONTRACT | зрозуміла поведінка | Input/output/error контракт, приклади і прихований local oracle | Відомо, що спростує правильність результату |
| S3 PREFLIGHT | готові dependencies, exact paths | Перевірити runtime/ресурси/locks/privacy/cap; вибрати 0–3 корисні роботи | Hard gates PASS; missing → HOLD |
| S4 EXECUTE | найменша capsule | Worker пише ізольований artifact/patch; локальний оператор застосовує лише owned diff | Повний output; hash і формат валідні; жодного scope escape |
| S5 VERIFY | patch + original baseline | Semantic RED→GREEN для behavior fix, targeted tests, critical mutation, diff review | Oracle спостеріг потрібну поведінку; producer report недостатній |
| S6 INTEGRATE | verified isolated diff | Один integrator; перечитати поточні target hashes, застосувати, перевірити суміжні контракти | На свіжому інтегрованому стані relevant checks проходять |
| S7 ACCEPT | requirement revision + outcome locators | Зіставити всі material outcomes, виконати canonical accept-check | Немає застарілого/суперечливого/самоприйнятого evidence |
| S8 CLOSE | прийнятий вузол | Запис у чинний Harness, artifact/receipt/rollback, відкрити залежні задачі | Commit лише за чинної authority; інакше verified uncommitted artifact |

S2 — деталізація INSPECT, S5–S7 — деталізація ACCEPT; це не альтернативна машина станів замість materializer. Відмова повертає до INSPECT або утримує вузол; не пропускати перевірку.

Формула допустимості переходу: `go = scope ∧ ownership ∧ privacy ∧ authority ∧ budget ∧ dependencies ∧ evidence`. Невідоме не прирівнюється до true. Формула — пояснення чинних gates, не додатковий permission engine.

## Повна картка задачі

TASKS.json зберігає objective, legacy refs, dependencies, role, input source paths, owned paths, artifact, acceptance, rollback і attempt limit. Додані workflow-поля:

- `input_contract`: revision, evidence locators, source hashes, examples, explicit unknowns.
- `output_contract`: task_id/revision/input_hashes/changed_paths/artifact_hash/tests/observations/unknowns/proposed_children.
- `error_contract`: типізований збій + safe return, без raw secrets і без прихованого retry.
- `handoff`: exact next task, remaining acceptance clauses, blocking evidence, current reservation ID.
- `required_evidence`: baseline, oracle, reviewed diff, integrated outcome; для human gate — human outcome.
- `source_lock_policy`: current file hash check та один writer; lock тримає canonical executor, не цей JSON.

Новий task не готовий лише тому, що шаблон заповнено. Конкретні hash, fixtures і команди фіксуються в INSPECT до worker. Відсутня специфікація → CONTRACT_PENDING. Приклади відповідей для held-out oracle не передаються worker. Для DE/design етапів oracle включає людський огляд; unit-тест не заміняє розуміння людини.

## Робоча хвиля і економіка

1. Взяти тільки вузли з прийнятими dependencies. З `V6-00=REPRODUCED` можна почати проектування B2, але не оголосити approval feature справною.
2. Об'єднати read-only контекст; не дублювати генерації для тієї самої acceptance clause.
3. Виявити перетини owned paths; усі мутації app.mjs послідовні. Не покладатися на добру поведінку worker — lease/hash перевіряє executor.
4. Ресурси й очікувану користь передати наявному DAG advisor. Без вимірів тривалості/успіху — локальна послідовність; умовна одинична тривалість і нульові ресурси в topology probe не є вимірами; вони лише дозволяють перевірити топологію.
5. A RECOMMENDED: локально, потім корисні exact-zero synthetic jobs. B FALLBACK: точний DeepSeek у межах залишку вже дозволених $0.50 і живих gates. Кількість calls не є метою.
6. Worker повертає result proposal. Operator приймає незалежно. Після прийнятих вузлів обчислити наступну скінченну хвилю.

Підзадачі: підмножина acceptance батька; вужчі або ті самі paths/privacy/effects; shared attempts/reservation; максимум 24 вузли поточного плану. Новий deliverable поза scope — backlog, не самозапуск. Worker не може створити standing task або скопіювати credentials. `$spent + $unresolved_reserved + $next ≤ $remaining_authorized_total`; repeated run не отримує новий cap.

## Відновлення після збою

| Код | Дія | Доказ перед відновленням |
|---|---|---|
| SOURCE_DRIFT / LOCK_CONFLICT | Не застосовувати patch; перечитати змінені paths, узгодити writer | Новий source fingerprint + сумісний diff |
| FORMAT_ONLY | Нормалізувати тільки зовнішній Markdown fence/BOM canonical способом | Оригінал і repaired bytes/hash; schema-valid output |
| SEMANTIC_FAIL | Один вузький repair з failing fixture | Новий independent oracle; друга та сама помилка → інший підхід |
| TOOL_YIELD | Продовжити поточний process/session ID | Новий output того самого запуску |
| TIMEOUT / UNKNOWN_COST | Зіставити run/receipt, не повторювати generation | Canonical terminal receipt або unresolved quarantine |
| TRUNCATED | Зберегти partial; не інтегрувати | Complete separately scoped artifact в межах remaining cap |
| AUTH / PRIVACY / BUDGET | HOLD відповідної дії; продовжити незалежне local work | Чинні gates, не текст worker про дозвіл |
| RATE_LIMIT | Bounded retry-after або інший exact-zero eligible route | Quota/identity/price proof; без обходу лімітів акаунтами |
| INTEGRATION_FAIL | Відкотити тільки own patch; зберегти failing evidence | Baseline відновлений; чужі changes не втрачені |
| USER_STOP | Завершити dispatch, зібрати наявні partial/receipts | Немає нових calls; стан і reservations reconciled |

Ні sleep, ні мовчання користувача не дають authority. Відновлення не скидає attempt counter. Fault не приховується через rename задачі.

## Тестова піраміда і випуск

L0 static contract/schema → L1 deterministic unit + property fixtures → L2 store/worker integration → L3 isolated authenticated DB/RLS → L4 browser two-session journey → L5 дві уповноважені людини → L6 elapsed business pilot. Кожен рівень доводить лише своє. Поточна відтворена помилка — L2 client-to-transport probe з stub, не live DB exploit.

Critical mutation set: forged other-party approval; stale vote після material edit; expiry рівно на межі; revoke між check і write; offline write з UI success; duplicate outcome; missing feedback denominator; import instruction injection; child budget escape. Конкретні fixtures спочатку локальні; тест повинен падати саме через інваріант, а не import error або невалідну setup.

Gate для реального випуску: актуальні UI+store+worker+schema сумісні, isolated DB acceptance, browser/human outcomes, rollback, approved production action. Deployment і migration не дозволені цим workflow. Бізнес-метрики не відновлюються із synthetic fixtures.

## Практичний результат V6-00

`approval-boundary.test.mjs` імпортує реальний ProfileStore і domain constructor. `user.id=a`, синтетичний draft створюється штатним domain API; додається approval B; transport capture показує, що store відправляє B approval. Control PASS, invariant test FAIL. До цього baseline 140/140 PASS. Початкову помилку шляху імпорту усунено; вона не зарахована як доказ дефекту.

Тест навмисно розміщений поза source suite, бо задача V6-00 — зберегти RED до реалізації B2. Не вимикати/не позначати skip. При виконанні V6-04 перенести потрібні fixtures у source tests, розширити на server principal і вимагати GREEN. Зараз `defect_reproduced=true`, `defect_fixed=false`, `release_allowed=false`.

## Команди перевірки

З кореня workspace:

```powershell
py -3 -B -X utf8 output/cnra-solo-rebuild-20260909/v6/workflow/check_workflow.py
py -3 -B -X utf8 -m unittest discover -s output/cnra-solo-rebuild-20260909/v6/workflow -p 'test_*.py'
node --test output/cnra-solo-rebuild-20260909/v6/workflow/approval-boundary.test.mjs
py -3 -B -X utf8 C:/Users/Andrii/.codex/skills/agent-materializer/scripts/materializer.py accept-check --contract output/cnra-solo-rebuild-20260909/v6/workflow/product-acceptance.json
```

Очікування зараз: structure PASS; workflow mutation tests PASS; approval probe 1 PASS/1 FAIL; product accept-check HOLD. Не підміняти це одним зеленим summary. Команди нічого не відправляють і не змінюють production.

## Definition of done цього доповнення

Усі 19 карток мають workflow contracts; canonical DAG validation; negative tests справді відхиляють непридатний план; V6-00 відтворений окремим probe; продуктове приймання демонструє HOLD; джерела й outputs пов'язані хешами у REPORT.json. Контроль процесу не робить весь застосунок завершеним. Після цього NEXT — V6-03: затвердити точний per-party persistence contract перед B2 patch.
