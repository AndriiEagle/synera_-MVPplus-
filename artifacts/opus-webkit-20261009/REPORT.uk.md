# Synera: повторна перевірка Opus і WebKit — 09.10.2026

**Зміни Opus прийняті локально; живий запуск не прийнятий.** Перевірено source `e46ce95e37e1f2f528bc91d46098ea4967f72dff`, а не старий GitHub чи попередній кандидат. Нового продуктового дефекту в перевіреній поверхні не відтворено; жоден коміт Opus не перероблено й не відкочено.

## 1. Git і межа роботи

- Checkout: `C:/Users/Andrii/Desktop/synera-premium-pwa-variant`, branch `codex/synera-product-20261002`.
- Усі 9 комітів після `6512703` є локально. Read-only `git ls-remote` цього проходу: GitHub досі `6724682f5f43172e5732fa41b8a46e4baa6384e2`; на початок перевірки бракує **20 локальних комітів**, включно з Opus. Цей звіт додає окремий локальний proof commit.
- Чужий dirty `web_launch/journey-ui.mjs` не змінено: SHA256 `68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b`. Інші untracked файли не приймались і не видалялись.
- Нуль provider calls, витрат, production SQL, deployment, secrets changes, ADB-запусків або нових cloud reservations. Push не повторювався: попередня автоматична перевірка відхилила його (`approval required by policy, but AskForApproval is set to Never`); нових доказів зміни обмеження немає. Інший транспорт не використовувався.

## 2. Що підтверджено незалежно

| Межа | Фактичний результат | Доказ |
|---|---|---|
| Sender-only/recipient-only переходи та чинні згоди | Без guard відтворено обидва обходи. Із guard приймання проходить лише в дозволеному стані; повторний apply відхилено | [SQL_ACCEPTANCE.json](SQL_ACCEPTANCE.json) |
| Повний SQL-стек | 70 ownership/consent oracle пройшли у двох порядках apply. 18 стадій runner: очікувані RED і GREEN; усі 6 навмисних ослаблень захисту спіймано | Той самий SQL receipt; справжній PostgreSQL **16.15**, loopback, identity shim |
| Змінений client/fixture/config та пов'язані контракти | 77 pass, 0 fail, 1 skip у 8 test-файлах | [NODE.tap](NODE.tap). Skip — старий optional integration-run без `SYNERA_ACCEPTANCE_PG`; новий SQL runner вище справді виконано |
| Запрошення у WebKit | 3 розміри: 320×568, 390×844, 1280×900. Застарілий клік не приймає запрошення; нова редакція й дві згоди відновлюють приймання того самого запрошення | [invitation/RESULT.json](invitation/RESULT.json) |
| Недоступна розмова ≠ втрачена сесія | 4/4 сценарії: send після скасування, фонове читання після скасування, застаріла картка, справжня втрата сесії. Чернетка зберігається при скасуванні; 401 досі очищує приватні дані | [unavailable/RESULT.json](unavailable/RESULT.json) |
| Результат дії та поточний крок | 55 спостережень, із них 50 дій: 0 feedback поза екраном, 0 перекриттів поля у фокусі, 0 помилок поточного кроку. Перевірено також спір і server refusal | [feedback/RESULT.json](feedback/RESULT.json) |
| Мобільний WebKit | 8 профілів: 320/375/390/430 px, landscape, tablet, подвоєний текст, opt-in Atelier. 56 спостережень, 8 fixture-шляхів із двома згодами → прийняттям → повідомленням; 0 issues/failures | [Матриця](../mobile-webkit-20261009/opus-head/RESULT.json) |

Середовище: Windows, Node **24.16.0**, Playwright **1.63.0**, WebKit **26.6** (build 2359). Зовнішня мережа в browser-контекстах заблокована; Auth/Data синтетичні, кліки й виконання інтерфейсу справжні. SQL-claim підтверджено базою, а не цим fixture.

12 баз, створених SQL runner, прибрано ним після ROLLBACK; metadata readback показав 0 залишків і 0 інших client sessions. Запущений для цієї перевірки локальний PostgreSQL зупинено; існуючі дані збережені.

## 3. Новий кандидат із точних Git-блобів

`web_launch/dist-neon-opus-head-webkit-20261009`, **97 public files / 96 manifest rows**.

**SHA256 release.json:** `4b265ab8cd005fc9ee37240e58880d0b784e9039259ff8fe628dc2d23fc7a297`.

[BUILD.json](BUILD.json): усі 96 assets звірено за розміром і hash; 94 скопійовані public assets збігаються з точними Git-блобами `e46ce95`, 2 службові файли генерує чинний builder. Копія збігається з build output; матриця повторно звірила весь manifest до й після запуску. Candidate `journey-ui.mjs` має SHA256 `3725f354fe08cce2486e14fd2a73b4b4e0749426160b8afa5bcbace833380e31`: чужу dirty-версію точно не включено.

Перша архівна копія `dist-neon-opus-webkit-20261009` **не прийнята**: Windows Git archive перетворив LF на CRLF, що виявила побайтова перевірка. Її не перезаписано й не використано для acceptance. [build-from-head.mjs](build-from-head.mjs) експортує через `git cat-file blob`, будує в новому каталозі й відмовляє, якщо target уже існує. Це виправлення способу підготовки доказу, не продуктового коду. Попередні candidates збережені. Пакет gitignored, **unpublished**.

## 4. Два скінченні review

1. Прочитано фактичний продуктовий diff `6512703..e46ce95`: OLD→NEW guard незалежний від union RLS-політик, `SECURITY INVOKER`, збережено owner maintenance; клієнт має precheck і server-race handling. Ресурсна відмова відділена від 401; purge, epoch guards, Current default і Atelier opt-in збережено. Це узгоджується з відтвореним SQL RED→GREEN.
2. Звірено свіжі receipts з source/candidate й переглянуто п'ять фактичних знімків: stale refusal, send-after-cancel, Atelier pending invitation, narrow terms editor, landscape chat. Форма досі довга; повні screenshots не є першим екраном фізичного телефона. Окремо шість SQL mutations доводять, що oracle ловлять повернення дефекту й відкриття меж. Нових правок UI після приймання не додано.

## 5. Що ще не прийнято

- **PG18, справжній HTTP JWT і два живі акаунти.** Identity shim не доводить серверну автентифікацію. У першому живому проході окремо зберегти відмову sender `PATCH status=accepted` і фактичний HTTP status для SQL `PT409`; не вгадувати його з fixture.
- **Production rollout і recovery.** Порядок review: `case-state → meeting-status-guard → meeting-location → group-room → case-outcome → meeting-address-agreement → message-intent`. Старий дозвіл «SQL 1–6» недостатній; потрібні fresh target/preconditions/recovery і точне погодження нового набору та candidate.
- **Фізичні Android/iPhone, Safari/PWA install, OS keyboard.** Desktop WebKit і viewport-матриця цього не доводять.
- **Продуктові відкриті пункти Opus:** довга форма, різна візуальна мова `index.html`, EN/DE реального шляху, частково модельований fixture, історичні SQL tools. Embedded Google SDK, advanced voice/video, OAuth posting, платежі та sustained capacity залишаються окремими gates. Увесь продукт не оголошено завершеним.

## 6. Відтворення й NEXT

Для вже наявного candidate: `PLAYWRIGHT_BROWSERS_PATH=D:/SyneraQA/playwright-1.63.0`; три `tools/*-browser.mjs` із таблиці запускати з `--candidate=web_launch/dist-neon-opus-head-webkit-20261009 --engine=webkit --out=<новий каталог>`; invitation додатково `--sizes=standard,small,desktop`. Матриця: `node tools/mobile-webkit-acceptance-20261009.mjs --candidate=web_launch/dist-neon-opus-head-webkit-20261009 --release-sha=4b265ab8cd005fc9ee37240e58880d0b784e9039259ff8fe628dc2d23fc7a297 --phase=<новий phase> --engine=webkit --capture-editor=1`.

SQL: використовувати вже дозволений loopback PG16, `SYNERA_ACCEPTANCE_PGPORT=55331`, `SYNERA_ACCEPTANCE_PGUSER=synera_acceptance_admin`, `SYNERA_ACCEPTANCE_PSQL=<наявний psql.exe>`; `node tools/meeting-status-guard-sql-acceptance.mjs --receipt=<новий файл>`. Початкова спроба з default user `postgres` зупинилась на preflight — такого role у цій базі немає; це виправлено параметром, без зміни ролей чи повторного init.

**NEXT, 5 хв:** Андрій виконує звичайний push поточного HEAD до `codex/synera-product-20261002`; після цього звірити remote SHA. Це синхронізує код/контекст для зовнішнього review, але не застосовує SQL і не публікує сайт. Наступний живий крок — review PG18/JWT у дозволеному середовищі, після точного погодження.

Models used: none (provider calls=0, USD=$0.00).
