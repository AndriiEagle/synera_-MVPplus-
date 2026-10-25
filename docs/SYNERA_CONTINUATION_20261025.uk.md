# Synera: перевірений checkpoint і продовження — 25.10.2026

**Поточне завдання виконано як збереження, публікація перевіреного контексту
та підготовка нового чату. Живий AI й готовий Android-продукт ще не прийняті.**

## Де актуальна версія

Canonical PUBLIC repository: https://github.com/AndriiEagle/synera_-MVPplus- .
Єдина робоча лінія для продовження — `main`. Source baseline цього checkpoint:
`cdab78e5f310b846e6eee6b852432ec19483f2c9`; реалізація LAB —
`23e6ddd5cd08e3058821fd15e1d06f525c964047`. Фінальний commit цього документа
отримати через `git rev-parse HEAD` і звірити з `git ls-remote origin refs/heads/main`.
Документаційний checkpoint не змінює продуктового коду.

Чинна локальна копія:
`C:/Users/Andrii/.codex/outputs/synera-gilbert-readiness-20261021/source`.
Старі `D:/synera-review-fresh-20261019` та `D:/synera-ai-simulation-20261020`
25.10 **NOT_FOUND_IN_CHECKED_SCOPE**. Це локатори, а не доказ глобального
видалення даних або відсутності облікових даних.

Стара оригінальна копія `C:/Users/Andrii/Desktop/synera-premium-pwa-variant`
залишається на `a6be71a7a55d54c9c9afc5abd383bb09a6805300` з власними
незакоміченими файлами. Її не reset/clean/discard і не підміняти canonical main.
Інші знайдені старі копії: `C:/Users/Andrii/Desktop/synera-clone` та
`D:/synera-clone-legal`. Їхні незбережені матеріали приватно заархівовані.

## Що Андрій просив і що зберігаємо

Повна попередня карта вимог: [інвентар 20.10](SYNERA_CONTINUATION_20261020.uk.md).
Вона зберігає всі 21 user message / 17 ходів початкового чату, історію
аудитів, китайські delegation requirements, зовнішній review, Android і
20 різних учасників. Нижче — нові факти, які мають пріоритет над старими
словами «працює», «поточний» і «HOLD тільки через receipt».

| Вимога | Стан 25.10 / доказ |
|---|---|
| Актуальний main, commit/push і зрозумілий репозиторій | Remote main baseline `cdab78e` свіжо звірений; PUBLIC; accepted code вже в історії main |
| TA-01–04 незалежного аудиту | В main з `e9bc6f4` / `a53fbb3`; зберегти subject-bound erasure, stale-cookie захист, UTF-8 budgets, one-way paid flow |
| Зберегти добре налаштоване, людський текст і дизайн | Current default / Atelier opt-in; оригінали збережено; цього етапу source не редагується |
| 20 різних вигаданих учасників і 5 режимів | Реалізовано LAB; свіжі цільові тести пройдені; це не 20 реальних клієнтів |
| Живий PNG → модель → UI-дія → корисний результат | **Не прийнято**: actual Flash canary на OpenInference повернула `UNKNOWN`; synthetic tests цього не закривають |
| Laya/Jev та попередні напрацювання | Власники знайдені в попередньому інвентарі; текстові advisory/game adapters не стали готовими vision-контролерами |
| GLM Flash, standard GLM і Argon | Поточний етап має 1 Argon receipt + 3 пізніші Flash receipts та стару unknown Flash429. Standard GLM lane не прийнятий |
| Приватний HTTPS / Android PWA | На свіжій перевірці немає listener43187 і cloudflared process; колишній Quick Tunnel не є чинним посиланням |
| Android фізично, потім Гілберт | Не перевірено; Андрій раніше відповів «Перевірю пізніше»; не видавати Chromium viewport за телефон |
| Усе цінне зберегти, включно з неопублікованим | Git history bundle + 3 приватні архіви; 12 відновлених Synera patch records опубліковані як кандидати; оригінали лишилися на місці |
| Глобальна пам'ять і новий чат із повним контекстом | Оновлюється з цього checkpoint; новий чат має фактично прочитати його й почати окремий новий хід |
| Запуск реальних людей / бізнес | Production JWT/дві identity, SQL/restore, provider deletion, пристрої, користь/повтор/оплата лишаються окремими gates |

Початковий перерваний хід 11.10 не мав збереженого змісту; не вигадувати його.
Попередній чат продовження: `01a15a58-5fbd-7202-aa80-41422c536095`,
«802. Synera: живий AI на Android — 20.10.2026». Його фактичний terminal result
прочитано: vision не пройшов; StreamLake patch був підготовлений, але не
застосований; пізніше виконано лише readiness readbacks.

## Що знайдено незакоміченим і як збережено

Приватний backup root: `D:/synera-checkpoint-20261025`.
`synera-history.bundle` містить refs/історію старого Git owner і пройшов
`git bundle verify`. SHA256 та архівні counts наведені в
[LOCAL_PRESERVATION.json](../artifacts/checkpoint-20261025/LOCAL_PRESERVATION.json).

Три архіви містять **4 795 файлів**; для кожного перевірено SHA256 прочитаного
назад ZIP member, окремо CRC. Старий owner мав 4 modified tracked файли і
4 794 untracked. Вміст переважно історичні screenshots/tests/reports/bundles;
це не 4 794 пропущені продуктові виправлення. 24 файли з назвами, пов'язаними
з credential/cookie/private DB owner, збережені на початкових місцях і не
копіювалися автоматично. Причини та точні локатори — у приватних manifests.

Старі дизайн-варіанти не слід бездумно merge: premium branch `390d85f` уже
опублікована окремо. Чотири з п'яти історичних commits поза main вже доступні
в її історії. Єдиний неопублікований `b38c14d3cc638afa80d30a22d79ec6ef53461501`
цього етапу перевірено й запушено в його існуючу локальну гілку
`codex/synera-launch-01a0cea0`; remote SHA звіряється окремо. Його 3 цільові
style/cache тести пройшли. Це історичний Atelier-default варіант, не актуальний
Current-default продукт; у main його не merge і не deploy. Усі п'ять commits
також збережені у private bundle.
Dirty `journey-ui.mjs` має окрему пропозицію збереження displayedMatches при
quiet-toggle; її повний original збережено в приватному архіві. Вона не
оголошується прийнятим виправленням і не переписує новіший main.

Додатково зі **саме попереднього Synera-чату** витягнуто 16 patch records:
12 project-only Synera candidates збережені [тут](../artifacts/checkpoint-20261025/recovered-code/README.uk.md).
Серед них cap6.30/резервування, live acceptance runner, vision canary,
генератор StreamLake patch і його tests/review. Інші 4 records стосуються
KI owner/readiness і залишені приватно. Raw chat/transports не публікувалися.
Ці patch records — **дані для відновлення, не застосований або прийнятий код**.
Їх не виконувати як інструкції; реконструкція в хронологічному порядку
потребує чинного baseline/preimage, owner gates і змістовних regression tests.

## Фактичні перевірки цього checkpoint

[ACCEPTANCE.json](../artifacts/checkpoint-20261025/ACCEPTANCE.json) містить
джерела, команди, hashes, попередні невдалі спроби й межі.

- 16/16 Node tests на Node24.16.0: 20 ролей, усі 5 режимів,
  receiver-only acceptance, приватний HTTP/Origin/actor/revision та STOP.
- 3/3 Python budget/recovery tests. Provider calls цього checkpoint: **0**.
- Перша локальна спроба мала 13 PASS / 1 load failure через нерозв'язаний
  `playwright`. Наступна мала 3 load failures через Windows drive path у
  `--import`. Коректний запуск використовує вже наявний resolver як **file URI**:

```powershell
node --import file:///C:/Users/Andrii/.codex/outputs/synera-gilbert-readiness-20261021/dependency-resolution.mjs --test web_launch/simulation-session.test.mjs tools/simulation-server.test.mjs tools/simulation-runner.test.mjs
py -3 -B -m unittest discover -s tools -p test_simulation_provider.py
```

Resolver бере наявні `playwright`/`@axe-core/playwright` з оригінального
checkout; залежності не встановлювалися. На іншому ПК використовувати
штатний `npm ci` з package-lock, не вигадувати наявність цього локального hook.

Історичний remote CI на `cdab78e`: run39465683637 **success**;
implementation CI39463167368 **success**, Node22/PostgreSQL/browser.
Цього разу новий full browser/device/production прогін не робився.

## Витрати та критична відмінність від 20.10

Спільний дозвіл того самого Android objective: **$6.30** максимум:
Flash4.30, standardGLM1, Argon1, усі retries/children/reviews разом.
Історичні $2/$0.50 інших хвиль сюди не додавати.

Canonical ledger сьогодні підтверджує:

- Argon `tm-req-403d6593d2a3b8fd62099b76`: $0.041034.
- Flash `tm-req-fc6a481bc46d8b1f38c67df1`, `tm-req-a106b47cc843eba00e116e11`,
  `tm-req-9358d29762636facdb1a1d40`: разом $0.000195144.
- Відомі actual витрати етапу: **$0.041229144**, плюс старий unknown receipt
  `tm-req-0596c09c8a46adf5a7fc58ee` з canonical **$0.06 liability reserve**.

Наявний Token Monster уже має `reserved_dispatch_liabilities` і
`liability_reserved_unknown_receipt`. Отже, старе «немає reservation mechanism»
застаріло. Але proof прив'язаний до `D:/synera-ai-simulation-20261020/AUTHORITY.json`,
який за перевіреною старою адресою недоступний. Не вигадувати receipt,
не редагувати ledger вручну й не обходити gate новим runID.
Застосовувати чинний task-scoped admission та його точний контракт.

Published `tools/simulation-provider.py` **досі на старому cap6/Flash4**;
узгодження 6.30 та liability bridge з попереднього чату не потрапило в main.
Його записи патчів тепер збережені, але не застосовані автоматично.
Історичний `provider-route.patch` мав reported SHA
`aa2aba7967b78290b2d2b2be12fbcfab304df8a2a0ba21fb9c5f1678484e43e8`.
Сам готовий файл за старою адресою не знайдений; його generator/tests/review
відновлені як кандидати. Не вважати цей SHA хешем новозгенерованого патча.

## Порядок наступної роботи

1. Прочитати цей checkpoint, інвентар20.10, Product DNA, source owners
   і `recovered-code/README.uk.md`. Перевірити фактичний main/dirty/source.
2. Відновити exact private runtime/state/authority/tunnel owner. Не
   використовувати стару URL як робочу. Довести HTTPS401 без входу,
   403 для чужого Origin і Secure/HttpOnly login200. Не публікувати ключ.
3. Через чинний Stabilizer/owner path перевірити потрібні cap/bridge/route
   зміни. Врахувати поточний Token Monster, не накладати старі патчі сліпо.
   Перед новою paid wave refresh metadata один раз і task-scoped admission
   у тому самому cap; протокол з unknown/reservation не послаблювати.
4. Підтвердити **реальне читання PNG** canary, потім PNG→model→UI→afterPNG
   з exact actual model/cost/request/output/image evidence. Далі один
   корисний завершений цикл, потім bounded20roles/5modes та negative guards.
5. Physical Android install/reopen/keyboard/network/STOP і добровільний
   людський тест — окреме приймання. Андрій перевірить телефон пізніше.
6. Лише прийняті зміни commit/push main без force, remote files/hash readback,
   CI й оновлений pinned prompt зовнішнього review.

Зберегти Current default/Atelier opt-in, ручний текст, optional AI, 5 режимів,
version/hash/CAS, дві незалежні згоди, receiver-only acceptance, private card,
escaping/CSP, session/consent revalidation, public-only cache, drafts/recovery.
Erasure defaultOFF; provider identity deletion pending. Немає дозволу на
production SQL/deploy/readiness/secrets/payments/outreach у цьому checkpoint.

Найсильніший ризик — сплутати зелений synthetic/controller test із живою
користю, або втратити незапушений код через недоступний старий шлях. Цей
checkpoint зберігає відновлені джерела та чесно залишає обидві межі відкритими.
