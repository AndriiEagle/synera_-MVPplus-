# Продовження Synera: живий AI та Android

**Історичний checkpoint.** Актуальні зміни25.10, відновлені патчі та стан runtime: [SYNERA_CONTINUATION_20261025.uk.md](SYNERA_CONTINUATION_20261025.uk.md).

Оновлено 20.10.2026 після повного перечитування доступної історії чату.
**Передача контексту не означає завершення продукту. Живі GLM-учасники ще не працюють.**

## Мета, яку не можна загубити

Андрій хоче користуватися Synera з Android через приватне HTTPS без USB:
20 явно позначених вигаданих AI-учасників різних професій і сценаріїв,
змістовні розмови, домовленості, робота й прийняття результату.
Перед кожним автономним рішенням модель має отримувати справжній скріншот
інтерфейсу, після чого виконувати перевірену дію через цей інтерфейс.
Потрібні журнали, контроль витрат, STOP і збереження роботи.
Симуляція не є доказом попиту, платежів або поведінки реальних клієнтів.

Останнє уточнення: завершити живий AI, додаткові $0.30, прискорити корисною
паралельною роботою, передати всі виконані й невиконані завдання в один новий
чат після перевірки повноти передачі. Якість та економність важливіші за
кількість викликів. Немає потреби витрачати бюджет або робити 50 запитів
одночасно заради лічильника; невдалий Flash-виклик уже отримав rate limit.

## Джерело й поточний перевірений стан

- Єдиний canonical repository: [AndriiEagle/synera_-MVPplus-](https://github.com/AndriiEagle/synera_-MVPplus-).
  Репозиторій **PUBLIC**, default branch `main`, відкритих PR на перевірці немає.
- Перевірений source commit симулятора:
  `23e6ddd5cd08e3058821fd15e1d06f525c964047`.
  Його parent — `a53fbb3c9dfdfc69bc813d2262f3e488cd936107`.
  Remote main, перелік усіх 35 змінених файлів і Git blob hashes звірені.
- [CI цього commit](https://github.com/AndriiEagle/synera_-MVPplus-/actions/runs/39463167368)
  завершився **success**: Node 22, disposable PostgreSQL, browser acceptance,
  тести симулятора, Python budget tests, build і accessibility.
  Це закриває попередню позначку `Node22CI: pending push` у незмінному
  історичному acceptance-файлі кандидата.
- Робоча копія координаторки: `D:/synera-review-fresh-20261019`, detached HEAD.
  У цьому checkout `origin/main` може бути застарілим через fetch configuration:
  істину перевіряти `git ls-remote origin refs/heads/main`, потім explicit fetch.
- Працювати в лінії `main`; не створювати гілок, PR, issues/comments,
  не force-push, не reset/clean чужої роботи.
- Новий source на GitHub не дорівнює deploy. Старий публічний
  `synera-pilot.pages.dev` цим етапом не оновлений.

## Що Андрій просив і що фактично виконано

Історію саме вихідного чату прочитано supported `read_thread` до
`hasMore=false`: **2 сторінки, 17 ходів, 21 user message**.
Повторні «дороби» об'єднано з їхньою активною метою.
Статуси давніх етапів нижче спираються на збережені повідомлення та артефакти,
а не означають повторного запуску всіх історичних тестів сьогодні.

| Прохання | Виконано / доказ | Що ще відкрите |
|---|---|---|
| Відновити історію до переривання | Перечитано API до початку; старий хід 11.10 має `interrupted` без збереженого тексту | Втрачений текст із доступних записів не відновлено; не вигадувати його |
| Зіставити локальну нову Synera і GitHub | Новий `web_launch`/`neon` уже в тому самому canonical main; `crystallised_in` — збережений legacy | Старі локальні неперевірені чернетки не оголошувати частиною published main |
| Поліпшувати обережно, не переписувати добре налаштоване | Ізольовані кандидати, збережені Current/Atelier, приватність, оригінальний dirty файл | Продовжувати preservation gate; не робити великого редизайну |
| 3–4 чати Sol 6.1/high та повторні чесні перевірки | У жовтневій хвилі створено три чати; історичний terminal report підтверджує три проходи. Пізніші дві пари чатів і внутрішні workers теж прийняті окремими перевірками | Це не доказ, що всі майбутні чати дотримуються правила |
| Китайські моделі, вузькі корисні завдання, бюджет | У Gemini-followup було 12 actual GLM Flash text calls, $0.017140781 із окремих $0.50; є індивідуальні receipts/triage | Старі незакриті provider reviews не стали PASS; поточний live vision окремо не виконаний |
| Commit/push, порядок main, з'ясувати visibility | Новий код merged у main; PUBLIC; наразі відкритих PR немає; останній implementation `23e6ddd` | Не видаляти історичні гілки/оригінали заради «порядку» |
| Повний мудрий зовнішній аудит бізнесу/UX/архітектури/людей | [Промпт](CLAUDE_OPUS_REVIEW_PROMPT.uk.md), [Product DNA](PRODUCT_DNA.uk.md), pinned source і read-only scope підготовлені | Оцінки тестів не доводять попит, повтор, оплату, мільйон або викуп |
| Розібрати подвійний Gemini-звіт і реалізувати слушне | [Початковий triage](../artifacts/gemini-review-20261017/REPORT.uk.md), [реалізація](../artifacts/gemini-implementation-20261017/REPORT.uk.md): SQL CI, scoper, приватна картка, self-only erasure | Несумісний SQL відхилений; неперевірені ціни, handshake і публічні сертифікати не впроваджені довільно |
| Ще раз перевірити та виправити незалежний аудит | TA-01/03/04/02 виправлені в `e9bc6f4`, прийняті й опубліковані до `a53fbb3` | Live JWT/production/restore/physical devices не закриті |
| Промпт наступної зовнішньої перевірки | [Audit followup prompt](../artifacts/audit-followup-20261019/REVIEW_PROMPT.uk.md) | Після live AI потрібен новий prompt, прив'язаний до його остаточного source |
| Корисний Android-застосунок без USB | Є окрема PWA LAB, приватний Quick Tunnel, HTTP cookie захист, installability Chromium без помилок | Фізичний Android Андрій перевірить пізніше; сталий hostname ще не налаштований |
| 20 живих різних AI-учасників | 20 fiction personas, state machine, UI й canonical model інтегровані | **Живі відповіді, багатокрокові автономні сценарії та повний прогін 20 ролей NOT RUN** |
| Справжні скріншоти перед рішеннями й натискання як користувач | Runner реально знімає PNG мобільного viewport Chromium, виконує UI actions і журналює результат; negative guards перевірені | Модель ще не пройшла actual image-input → response → UI action; фізичний екран телефона не захоплюється |
| Використати Laya/Jev і попередні симулятори | Знайдено точні існуючі owners, перевірено їхні контракти | Текстові advisory/game adapters не стали screenshot-контролерами Synera; потрібне обґрунтоване reuse-рішення, без фіктивної інтеграції |
| Архітектурна консультація Gemini 4 Argon | Actual `google/gemini-4-argon`, receipt $0.041034, output/hash звірено, scoped advice прийняті локально | Це один initial review; фінальний provider followup не виконаний |
| 80% GLM Flash / 20% GLM Pro, compressed context | Виділено model caps і малі jobs; exact catalog identities перевірялися | Flash attempt 429; standard GLM lane NOT RUN; ratio — план бюджету, не фальсифікувати actual usage |
| Підключити Cloudflare | Андрій увійшов; приватний HTTPS перевірений через Quick Tunnel | Account без підключеного domain; named tunnel/stable origin pending |
| Запускати реальних людей й отримувати бізнесову користь | Підготовлено [пілотні перевірки](../plan/launch/AUDIT_PILOT_CHECKS_20261018.uk.md), збережено прозорі згоди/компенсацію | Два live accounts, production schema/backup/restore, provider deletion procedure, реальний цикл, попит/повтор/оплата — відкриті |
| Додати підсумок у пам'ять, перенести всю незавершену роботу | Попередні checkpoints у memory; цей manifest і локальна історія створені | Передача новому чату приймається лише після його фактичного нового ходу та читання handoff |

## Чинні інваріанти

Current default, добровільні Atelier/night; ручний текст і необов'язковий AI;
п'ять режимів `exchange`, `paid_service`, `referral`, `hybrid`, `joint_project`;
version/hash/CAS, незалежні згоди, receiver-only acceptance, приватні картки,
escaping/CSP, session/consent revalidation, public-only cache,
metadata-only retry без прихованого outbox. Не вигадувати платіж.
`SYNERA_PROFILE_ERASURE_READY` default OFF; provider identity deletion pending.

AI personas мають реалістичні різні інтереси й право не погодитися, але
явно позначаються як симуляція. Не переконувати людину, що це справжні клієнти.
Не надсилати моделям raw chat, приватний ключ доступу, provider transport,
секрети, справжні контакти або приватні дані інших людей.

## Читання й точні власники

1. Цей документ, [ANDROID_SIMULATION.uk.md](ANDROID_SIMULATION.uk.md),
   [результат кандидата](../artifacts/android-simulation-20261020/RESULT.uk.md),
   [acceptance](../artifacts/android-simulation-20261020/ACCEPTANCE.json).
2. `tools/simulation-provider.py`, `tools/test_simulation_provider.py`:
   canonical Token Monster, budget, receipt/output binding.
3. `tools/simulation-server.mjs`, `tools/simulation-runner.mjs` та їхні тести:
   actor/cookie, pair consent, STOP, screenshot/privacy/revision, UI actions.
4. `web_launch/simulation-session.mjs`, `simulation-personas.mjs`,
   `simulation-ui.mjs`, `simulation.html`, CSS/manifest/service worker.
5. `tools/simulation-browser-acceptance.mjs` і
   [source hashes](../artifacts/android-simulation-20261020/SOURCE_HASHES.json).
6. [Audit followup](../artifacts/audit-followup-20261019/RESULT.uk.md),
   [Product DNA](PRODUCT_DNA.uk.md) для збереження прийнятої поведінки.

## NOW: завершити реальний AI

Перший GLM-запит архітектурної хвилі отримав upstream 429 із generation ID,
але без підтвердженої вартості. GET receipt кілька разів повертав 404.
Відомий підсумок поточного етапу — $0.041034 плюс одна невідома витрата.
Не називати невідоме нулем і не переписувати історичні receipts.

Андрій прямо просить продовжити, а не знову завершити відповідь лише HOLD.
Дослідити найменший коректний шлях у **наявному** Token Monster:
відновлення proof або явно обмежений облік liability за поточним дозволом.
Знайдені `reconciled_reserved`/`configured_unknown_cost_upper_bound`
стосуються старих task-hash records; **не доведено**, що вони закривають
новий lifecycle dispatch. `_reconciled_dispatch_costs` має інший контракт.
Не вставляти фіктивний legacy row як заміну actual receipt.
Будь-яка потрібна зміна має бути локально прийнята й вузько прив'язана до
цієї невдалої спроби, не вимикати загальний облік або lock.
Не запускати повтор тієї самої ambiguous generation під новим ID.

Поточний дозволений максимум **$6.30**: Flash $4.30, GLM 5.3 $1, Argon $1,
спільно для всіх jobs/retries/reviews цього Android-етапу.
Останні $0.30 додаються один раз. Історичні $2 та $0.50 не додаються сюди.
На момент передачі runnable adapter і `AUTHORITY.json` ще містять попередні
$6/$4; їх потрібно узгодити з новим дозволом одним протестованим update.
Контекстні пакети мінімальні, model IDs/ціни/модальність перевірити перед run.
Не втрачати requested Chinese/vision requirement.

Потім потрібен вирішальний actual oracle:

1. На вигаданій задачі actual Flash отримує PNG, повертає змістовну дію.
2. Identity/cost/request/output/image hashes зв'язані з canonical dispatch;
   UI реально змінюється, after-PNG і журнал підтверджують правильну пару.
3. Повний корисний цикл хоча б однієї пари до перевіреного результату,
   потім bounded coverage 20 ролей і п'яти режимів, включно з відмовою,
   переглядом умов, невдалим результатом і повтором.
4. STOP/revoked consent/stale frame/wrong actor не застосовують відповідь
   й не запускають наступний виклик. Нема synthetic fallback замість AI.
5. Фінальний independent/semantic review, commit/push main без force,
   remote readback, CI, новий self-contained prompt повторного аудиту.

Не повторювати весь незмінний зелений набір без причини. Перевіряти новий
ризик і залежності; після достатнього приймання припинити полірування.

## Android і живий runtime

Працює тимчасове приватне HTTPS до локального сервера. Комп'ютер, Node і
cloudflared мають працювати; після restart URL/ключ можуть змінитися.
Публічний shell і приватний API — різні межі доступу.
Повний локальний operating handoff містить точні paths/PIDs/authority/receipt
locators; ключ у GitHub не публікується. Не дублювати процеси.

Андрій уже відповів: **«Перевірю пізніше»** щодо Android. Не вимагати повтору
зараз і не блокувати на цьому решту роботи. Не називати desktop Chromium
фізичним Android. APK не створено; поточний спосіб встановлення — PWA.
Сталу адресу треба довести окремо; Quick Tunnel є тимчасовим.

## Чесна межа завершення

Локально прийнято 742/743 Node tests (1 SQL environment skip), Python 3/3,
actual HTTP/browser і 112/112 build manifest hashes. Remote Node22/PG CI
після source push green. Контрольований synthetic model у browser runner
не є live vision. Simulation LAB — окремий інтерфейс; він не підтверджує
всі production screens і не замінює real-user journey.

Роботу не називати завершеною, доки головний requested live AI outcome
не прийнятий. Якщо зовнішня залежність справді не дозволяє зробити його,
повернути точну причину, доступний корисний результат і одну конкретну дію;
не компенсувати це новими непотрібними фічами або вигаданою готовністю.
