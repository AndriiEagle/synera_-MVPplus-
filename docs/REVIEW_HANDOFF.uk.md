# Synera: handoff для незалежного аудиту й доробки

Зріз 09.10.2026. Цей файл дозволяє працювати з GitHub clone без приватної історії чату. [ДНК / еталон](PRODUCT_DNA.uk.md) · [готовий промпт Claude Opus](CLAUDE_OPUS_REVIEW_PROMPT.uk.md).

## 0. Незалежний Opus review — 09.10.2026, після цього зрізу

[Звіт](../artifacts/opus-review-20261009/REPORT.uk.md). На момент review GitHub був на `6724682` без цього файлу; перевірку зроблено з локального checkout. Відтворено на PostgreSQL 16.15 й виправлено локально: відправник міг прийняти власне запрошення після `meeting-location.migration.sql` (union permissive-політик); запрошення переживало згоди. У Chromium: скасована зустріч виглядала втратою сесії й стирала чернетку. Нічого не застосовано, не pushed, не deployed.

- Нова адитивна [`neon/meeting-status-guard.migration.sql`](../neon/meeting-status-guard.migration.sql) стає кроком **1a** rollout: після case-state, до meeting-location.
- Переносний SQL-runner без Windows-шляхів: `SYNERA_ACCEPTANCE_PGPORT=<port> node tools/meeting-status-guard-sql-acceptance.mjs`. Лише disposable loopback PostgreSQL.
- Урок: JS-fixture моделює задуману політику й не виконує RLS. Claim про згоду чи власність приймається лише на справжньому PostgreSQL, двома акторами, з переходом від імені `authenticated`, і повторюється після кожної пізнішої міграції.
- Другий прохід того ж дня (розділ 0 звіту): [`neon/stack-invariants.acceptance.sql`](../neon/stack-invariants.acceptance.sql) повторює 70 ownership/consent oracle на повному стеку, де кожен стан досягає сама людина як `authenticated`; нового серверного дефекту не знайдено. Статус дії тепер лишається на екрані, поточний крок виділено, pending-запрошення не пропонують надіслати вдруге, спір і відмова сервера називають наступну дію. Перевірено лише в Chromium.
- Правило для кожної нової міграції: після неї має проходити `stack-invariants` на повному стеку, а нова гарантія додається туди ж.
- Решта відкритого — розділи 3 і 7 звіту. [Промпт v2](CLAUDE_OPUS_REVIEW_PROMPT.uk.md) з оновленим фронтом робіт.

### 0.5. Вхід і профіль німецькою й англійською — 10.10.2026, поверх `ced88b6`

[Розділ 00 звіту, пп. 16–18](../artifacts/opus-review-20261009/REPORT.uk.md). Кандидат `web_launch/dist-neon-opus-pass4-20261010`, release `77f0fcc39d38ac6aba19112fb2b6f67cd39673304da4a1ae839721603e8e46d6`, 101 файл; локально, не опубліковано, у WebKit не перевірено.

- **Вхід і профіль німецькою й англійською:** кнопки UA / DE / EN у шапці `index.html` були мертві; тепер [`index-language.mjs`](../web_launch/index-language.mjs) (1,5 KB, завжди) вмикає [`index-i18n.mjs`](../web_launch/index-i18n.mjs) з [таблицею](../web_launch/index-i18n-table.mjs) лише після вибору DE/EN. Це накладка: `app.mjs` і його модулі не змінено, вони пишуть українською. Вибір спільний зі шляхом двох.
- **Правило для `index.html` і його 25 модулів:** новий український рядок потребує рядка в `ROWS`, шаблону в `PATTERNS` або запису з причиною в `index-i18n.coverage.mjs` — інакше падає `web_launch/index-i18n.test.mjs`. Gate: `node tools/index-language-browser.mjs --candidate=… --out=…`.
- **Не зроблено:** `legal.html`, демо, перегляд архіву, презентація, Трикутник, кімнати — українською. Переклади політики, згод і видалення не читав юрист чи носій мови. Вхід Google, лист із кодом, AI-чернетка, імпорт і показ місця кліками не пройдено. Default-мова за браузером і перегляд юридичних текстів — рішення Андрія.

### 0.4. Актуальна вузька доробка — 10.10.2026

[Terms recovery](../artifacts/terms-recovery-20261010/REPORT.uk.md), code `557a09f`: форма умов не стирається після `503/data_unavailable` у того самого actor/epoch. Старий CAS не перебазується; автоматичного retry/approval немає. `401/403`, auth-unavailable, вимкнений пілот і logout лишаються закритими. 9 різних сценаріїв у WebKit та Chrome; 21 targeted Node test; mutation повертає loss. Candidate **`dist-neon-terms-recovery-20261010`**, release **`003501f35f5d56ae3dd5730c6ae346a315984a8ed1ed7a29beaf241d1f28e227`**; лише UI recovery та один translation row відрізняються від message-reload, інші 95 manifest assets збігаються. Це останній candidate, unpublished; exact rollout/readiness/production approval не замінено локальним прийманням. GitHub readback `6724682`; policy hold збережений. Старі dated checkpoints нижче не є поточними release hashes.

### 0.3. Приймання pass3 у Windows — 10.10.2026

**Фінальний increment:** [same-tab message retry recovery](../artifacts/message-reload-20261010/REPORT.uk.md), code `d29bee3`, 40 affected tests, WebKit/Chrome reload і browser/actor-epoch mutation. Останній candidate `dist-neon-message-reload-20261010`, release `7b2d6f0e0c635aeef7322ae256d971890c2c5cbee7fcf4ec42234bc6d3acfa71`. Лише client та legal відрізняються від WebKit pass3; 95 assets і Worker збігаються. RAM-only reload limitation нижче історична для gated lane; denied storage, legacy flag=false, outbox/cross-device лишаються окремими межами. Локальне приймання не є live acceptance.

[Фактичні receipts, screenshots і межі](../artifacts/opus-pass3-webkit-20261010/REPORT.uk.md). Bundle застосовано fast-forward до `815c47f`. WebKit 26.6: 144 UK/DE/EN кроки, 8 mobile profiles / 56 observations / 8 шляхів до чату, 50 action-feedback дій; 0 issues у прийнятих прогонах. Current/Atelier та consent/drafts/hash збережені. Adversarial pending send→новий текст→довга DE-відмова не накрила focus у WebKit/Chrome. PG18.4 receipt має 12 перевірених source hashes; production PG18.6/JWT не прийняті. Entry/profile EN/DE з іншої копії Opus не входить у цей bundle: не дублювати ці правки без ownership reconciliation. Для фінального message-reload increment читати окремий report, а не старе обмеження RAM-only нижче. Усі dated checkpoints нижче збережені як історія.

### 0.2. Третій прохід Opus — 10.10.2026, поверх `914d44c`

[Розділ 00 звіту](../artifacts/opus-review-20261009/REPORT.uk.md). Усе локально, не опубліковано, у WebKit не перевірено.

- **PostgreSQL 18.4:** 18 стадій guard-runner і п'ять авторських SQL-наборів зелені; production — 18.6. Identity shim, не JWT.
- **Німецька й англійська на шляху двох людей:** [`web_launch/real-journey-i18n.mjs`](../web_launch/real-journey-i18n.mjs), перемикач у шапці, `?lang=de|en`. Українська — default і джерело: ключ таблиці — український текст. Мова не змінює умов, hash, згод чи запитів.
- **Правило:** новий український рядок у `real-journey.html`, `real-journey.mjs`, `real-journey-client.mjs`, списку навичок чи `atelier.mjs` додається до `TABLE` з німецьким і англійським текстом — інакше падає `web_launch/real-journey-i18n.test.mjs`. Текст у коді сторінки, що залежить від мови, передається як `t('…')`, а не готовим рядком: тоді перемикання мови не перемальовує картки.
- **Browser gate:** `node tools/journey-language-browser.mjs --candidate=web_launch/dist-neon-<name> --out=<dir>` — повний шлях у DE/EN, 0 українських рядків, той самий hash, чернетки на місці.
- Вхід і профіль німецькою й англійською зроблено пізніше того ж дня — розділ 0.5 вище.
- Поточний кандидат цього проходу: `web_launch/dist-neon-opus-pass3-20261010`, release `4980634db88c7fa1eb7648604f9087b1d85e1fbc70a40130282ae3448d451bd7`, 98 файлів. Попередній `4b265ab8…` (нижче) відповідає source `e46ce95`.

### 0.1. Повторна перевірка у Windows/WebKit — 09.10.2026

[Поточний звіт і source/candidate pins](../artifacts/opus-webkit-20261009/REPORT.uk.md). Source `e46ce95`: 18 стадій PG16.15, full-stack 70 oracle у двох apply orders і 6 mutations; WebKit 26.6 — invitation 3 розміри, unavailable 4 сценарії, feedback 50 дій, mobile matrix 8 профілів / 56 спостережень. Усе локально; JWT/PG18/фізичні телефони й production не прийняті. Коміти Opus не змінено. Новий candidate з точних Git-блобів, release `4b265ab8cd005fc9ee37240e58880d0b784e9039259ff8fe628dc2d23fc7a297`, виключає чужий dirty asset. На момент повторної перевірки GitHub досі `6724682`, на 20 комітів позаду source; proof commit додається окремо. Повтор push через інший транспорт не робився.

## 1. Репозиторій і порядок читання

- GitHub: `https://github.com/AndriiEagle/synera_-MVPplus-`, **public** за read-only GitHub API 09.10.
- Поточна продуктова гілка: **`codex/synera-product-20261002`**. Default `main` не є цією гілкою.
- PR #1 — історичний **MERGED** multihost-plan PR іншої гілки; не вважати його поточним product PR.
- Вихідний локальний HEAD цього handoff: `7f2f217`; продуктовий WebKit fix: `976d225`.
- Перед підготовкою handoff remote branch був `6724682f5f43172e5732fa41b8a46e4baa6384e2`: **10 локальних комітів ще не були на GitHub**. Остаточний remote стан треба звірити `git ls-remote`, а не вірити цьому зрізу.

Читати в порядку: цей файл → `PRODUCT_DNA.uk.md` → [повторна перевірка Opus/WebKit і новий candidate](../artifacts/opus-webkit-20261009/REPORT.uk.md) → [таблиця систем і досвіду](../artifacts/product-status-20261004/STATUS.uk.md) → [точний rollout review](../artifacts/product-status-20261004/ROLLOUT_REVIEW.uk.md) → код потрібного контракту. [Попередній WebKit CSS report](../artifacts/mobile-webkit-20261009/REPORT.uk.md) збережений як окремий доказ. Старі розділи README/CLAUDE/START_HERE та `plan/` — історія. Старий `140/140`, `33%` або старий NEXT не є сьогоднішнім acceptance gate.

Локальний Windows checkout автора: `C:/Users/Andrii/Desktop/synera-premium-pwa-variant`. У зовнішньому середовищі працюй з власного кореня clone; цей шлях не є залежністю продукту. Якщо ти бачиш тільки main або старий remote SHA, нова доробка ще не синхронізована: повідом це й не домислюй її наявність.

## 2. Архітектура й власники

| Шар | Джерела / контракт |
|---|---|
| Поточний браузерний продукт | `web_launch/`; public assets allowlist — `web_launch/assets.mjs` |
| Живий шлях двох людей | `real-journey.html`, `real-journey.mjs`, `real-journey.css`; business case / profile store / Neon store поруч |
| Підбір | `matching.mjs`, `profile-brief.mjs`; `declared-fit.mjs` — окреме пояснення opt-in декларацій, не другий live matcher |
| Базовий backend | `neon/worker.mjs`, `web_launch/neon-store.mjs`; Auth/Data API same-origin gateway, server readiness gates |
| SQL | Canonical proposals у `supabase/`, generated/additive migrations у `neon/`; звірити генератор і preconditions до змін |
| Карта й місце | `map.mjs`, `live-location.mjs`, `neon/meeting-location.mjs`, meeting-address modules |
| Група / результат | `neon/group-room.mjs`, `neon/case-outcome.mjs`, відповідні client/store/UI modules і тести |
| Дизайн | `style.css`, `summit.css`, `triangle.css`; opt-in `atelier.css` / `atelier.mjs`; нові global style systems не потрібні |
| Studio / архів | `studio.mjs`, `session-value.mjs`, `archive-codec.mjs`; memory/opt-in device archive, не хмарна база користувачів |
| Build | `neon/build.mjs`, `web_launch/build.mjs`; build не є deployment |
| Історичний FlutterFlow/Firebase | `crystallised_in/`; окремий артефакт із legacy security risks, не сучасний PWA runtime |

Не створювати другий matcher/store/router/queue/ledger, не переписувати продукт на Flutter лише через наявність старого FlutterFlow. Repository source і public deployment assets мають різний scope: не публікувати весь repo як сайт.

## 3. Що прийняте, а що ні

| Межа | Доказ / актуальний статус |
|---|---|
| Наскрізний локальний цикл | Profile → fit → редакція → дві згоди → invitation acceptance → чат → адреса → evidence/check/receiver acceptance → приватний export/social draft. Частини мають окремі fixtures/SQL/browser receipts; не всі пройдені одним живим HTTP/JWT шляхом |
| WebKit, остання вузька правка | 8 WebKit конфігурацій + 3 Chromium, synthetic Auth/Data, форма/запрошення/чат; старий CSS відтворює overflow. [Report](../artifacts/mobile-webkit-20261009/REPORT.uk.md) і RESULTS — докази цієї версії |
| Поточний локальний кандидат | `web_launch/dist-neon-opus-head-webkit-20261009`, source `e46ce95`, 97 files / 96 manifest rows; SHA256 release `4b265ab8cd005fc9ee37240e58880d0b784e9039259ff8fe628dc2d23fc7a297`; unpublished. [Повторний WebKit/SQL proof](../artifacts/opus-webkit-20261009/REPORT.uk.md) |
| Архів і повідомлення | Receiver acceptance, приватний viewer/social draft та recovery guards мають локальні докази. Same-session manual unknown-delivery retry тримає message UUID; reload втрачає RAM-key, offline outbox не завершений |
| Production catalog | Останній конкретний readback 05.10: Neon base є; 9 нових case/location/group/outcome/address tables і send RPC відсутні. Це історичний readback, який треба освіжити перед apply |
| Deployment | Остання Pages metadata: `synera-pilot`, No Git connection. Новий candidate не deployed. Git push не оновлює цю публікацію автоматично |
| Google QA | `synera-qa-20261009` створений; користувач підтвердив no linked billing account. API Console load failure, активація не виконана; нових reservations немає |
| Android cloud | Старий MapTesting підключив Pixel 8 й повернув reservation. Це доказ підключення/домашнього екрана; Chrome/PWA не прийняті |
| Пристрої | Desktop Chromium/WebKit ≠ фізичні Android/iPhone, iOS Safari, OS keyboard або PWA installation. Physical gates відкриті |
| Інші live capabilities | Embedded Google SDK, advanced voice/video, public AI, OAuth posting, платежі й sustained capacity не прийняті |

Не сумувати counts різних overlapping test suites. `STATUS.uk.md` містить 27 систем / 15 етапів і UX-гіпотези; його початковий 7/16/4 розподіл не означає 7 production-ready систем. Реальні емоції, гормони, попит, WTP і 10× token savings не виміряні.

## 4. Обов'язкові інваріанти

1. Current default, Atelier/спокійний режим opt-in; попередні designs/assets не стирати.
2. Редакція умов має дві незалежні згоди; матеріальна зміна скидає обидві. Invitation після погоджень; повідомлення після acceptance, з consent/block/admission guards.
3. Збереження старого запиту не стирає наступну чернетку. CAS/stale response/revoke/logout guards зберігаються; невідоме delivery не стає автоматичним send.
4. Одна людина не приймає результат замість отримувача; приватні evidence/source IDs не потрапляють у share без згоди.
5. Demo data лишаються явно синтетичними; auth/RLS не підміняти mock-ами у live acceptance.
6. Public visibility, fit, AI, GPS, recording і social sharing — окремі дозволи. API/private payloads не кешувати як public shell.
7. Не обіцяти lie detection, психодіагностику, приховану «перепрошивку» людей, guaranteed chemistry або автоматичну грошову згоду.
8. У Windows checkout чужий dirty `web_launch/journey-ui.mjs` мав SHA256 `68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b`. Не комітити/повертати його без ownership reconciliation. У чистому GitHub clone цього dirty payload немає.
9. Запрошення приймає лише отримувач і лише поки обидва мають чинну згоду на поточну редакцію відкритої непростроченої домовленості; скасовує лише відправник; закрите запрошення остаточне. Скасована зустріч чи змінене запрошення — не втрата сесії: людина лишається в сесії, ненадісланий текст зберігається.

## 5. Черга незалежної доробки

| Пріоритет | Задача | Приймання |
|---|---|---|
| P0 | Незалежно звірити Auth/JWT/RLS, consent, revision, admission, source evidence та live rollout preconditions | Відтворюваний дефект або точний evidence gap; secrets/private rows не логуються |
| P0 | Підготувати безпечний шлях до двох живих акаунтів і accepted result | Exact schema/recovery/flags review; live apply тільки з окремим точним дозволом; потім два авторизовані учасники, жодної підміни ботами |
| P0 | Повний Android + iPhone цикл | Встановлення, клавіатура, поворот, safe areas, foreground/background, offline/update, consent→result; окремо назвати device/OS/browser |
| P1 | Простіша форма умов і навігація без втрати змісту | Реальні кліки, прогресивне розкриття, збереження всіх обов'язкових полів/ревізій/двох згод; narrow/large-text, Current/Atelier |
| P1 | DE/EN шлях для першої швейцарської когорти | Увесь обраний критичний сценарій однією мовою; значення умов не змінене, fallback/overflow перевірені |
| P1 | Чесні error/empty/loading/expiry/recovery стани | Новачок бачить наступну дію; немає dead buttons, втрати тексту або неправдивого success |
| P1 | Вартість/підтримка/приватність пілота | Declared free-період, feedback, scope/retention/delete/support/recovery; без активації платежів |
| P2 | Live map/voice/L room/проєкти/радари/social | По одному capability з permissions, provider identity/cost/limits, independent acceptance; не імітувати готовність решти |
| P2 | Масштаб | Distinct-user sustained workload, p95/p99, saturation, recovery, abuse/admission і реальна cloud cost; фіксований pilot allowlist не розширювати мовчки |

Бери одну найціннішу локальну задачу за раз. Зовнішній blocker не є приводом до безкінечного косметичного polishing. Детальні відкладені можливості збережені в [ДНК](PRODUCT_DNA.uk.md) і попередніх source-linked документах: [L/economics](L_DIRECTION_AND_ECONOMICS.uk.md), [data/matching](DATA_AND_MATCHING_REALITY.uk.md), [mobile](MOBILE_PILOT.uk.md), [pilot wave](../artifacts/pilot-wave-20261005/REPORT.uk.md).

## 6. Відтворення у чистому clone

Спочатку `git status --short`, `git branch --show-current`, `git log -5 --oneline`. Не checkout/reset поверх dirty work. Відкрий `package.json`: браузерні dependencies описані, але їхня наявність і браузерні binaries не гарантовані в зовнішньому середовищі. Немає доступу до локальних Windows CLI, skill paths, D: runtime чи БД автора.

Базовий bounded Node gate, без БД, browser install і provider calls:

```sh
node --test web_launch/matching.test.mjs web_launch/real-journey-client.test.mjs web_launch/message-intent.test.mjs web_launch/mobile-pilot.test.mjs
```

Цю команду 09.10 виконано в окремому `git archive` закоміченого source без локальних node_modules: **59/59 PASS**. Новий review build дав 97 файлів / 96 independently rehashed manifest rows. [Portable receipt](../artifacts/opus-handoff-20261009/PORTABLE_BUILD.json). Це доказ відтворюваності Node/source, не browser/live gate.

Для review build у **новому, ще неіснуючому** output directory:

```sh
node neon/build.mjs dist-neon-opus-review-20261009
```

Перевір output path перед запуском: builder може повторно писати в наявний каталог. Це новий локальний review build, а не точна репліка dated release SHA: `built_at` змінюється. Старі `dist-neon-*` gitignored; GitHub clone їх не містить. [RELEASE receipt](../artifacts/mobile-webkit-20261009/RELEASE.json) і screenshots відстежуються в Git, source доступний, але старий exact candidate не можна «відновити» лише за його hash.

Якщо Playwright та WebKit уже доступні, обчисли SHA256 **нового** `release.json` і передай існуючому runner:

```sh
node tools/mobile-webkit-acceptance-20261009.mjs --candidate=web_launch/dist-neon-opus-review-20261009 --release-sha=ACTUAL_SHA256 --phase=opus-independent --sizes=small,large-text,atelier --pages=journey
```

Runner за замовчуванням використовує WebKit. Chromium lane має Windows Chrome path; SQL/browser tools теж можуть мати локальні prerequisites. Не видавай missing runtime за product bug і не змінюй oracle тільки для зеленого результату. Дату/каталог `opus-independent` не перезаписувати, якщо він уже є. Додаткові install/provider/live дії — лише в межах чинного явного дозволу відповідного середовища.

## 7. Безпека передачі й GitHub sync

Public handoff містить продукт, код, синтетичні fixtures, redacted receipts і backlog. Не включати cookies, токени, browser profiles, Console/auth screenshots, приватні розмови, персональний фінансовий/міграційний стан, бізнес-ідеї сторонніх людей або production rows. Legacy Flutter/Firebase security risks потребують окремого read-only redacted аудиту; не копіювати знайдені ключі у звіт і не робити rotation/history rewrite без точного дозволу.

Push був відхилений до виконання: `approval required by policy, but AskForApproval is set to Never`. У цій підготовці push не повторюється і не обходиться іншим transport/checkout/API/upload. Поточний user authorization на push є; зміна permission policy не доведена. User-run стандартний push і подальший read-only SHA readback — допустимий handoff, а не твердження про вже виконану синхронізацію.

Claude не треба запускати до появи цього пакета на потрібній GitHub branch. Після push перевір `git ls-remote origin refs/heads/codex/synera-product-20261002` проти локального `git rev-parse HEAD`; потім починай незалежний review. No force push, no main merge, no automatic deploy.
