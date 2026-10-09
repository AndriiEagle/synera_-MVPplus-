# Synera: незалежний Opus review — 09.10.2026

**Зріз.** Локальний `codex/synera-product-20261002` = `6512703`, на 11 комітів попереду GitHub `6724682`. На GitHub не було `docs/REVIEW_HANDOFF.uk.md`, `docs/PRODUCT_DNA.uk.md`, `artifacts/mobile-webkit-20261009/REPORT.uk.md`; review зроблено з локального Windows checkout через git bundle, без запису в його Git. Чужий dirty `web_launch/journey-ui.mjs` (SHA256 `68d84981…d33b`) не читався в коміти й не змінювався. Нічого не pushed, не deployed, не застосовано до жодної бази. Provider calls 0, USD 0.

**Середовище перевірки:** Linux, Node 22.22.0, PostgreSQL 16.15 (disposable loopback, identity shim), Chromium 141 через Playwright. **WebKit тут немає** — WebKit-claims автора я не перепровіряв.

## 1. Що реально стало краще

| # | Відтворений дефект | Де | RED на незмінному коді | Виправлення | GREEN + mutation |
|---|---|---|---|---|---|
| 1 | **Відправник приймає власне запрошення замість отримувача.** PostgreSQL об'єднує `USING` усіх permissive UPDATE-політик окремо від їхніх `WITH CHECK`: `meetings_cancel` (відправник, pending) + `meeting_address_participants` (`status='accepted'`, будь-який учасник). Приватний чат відкривається людині, яка нічого не приймала | [`neon/meeting-location.migration.sql`](../../neon/meeting-location.migration.sql) `meeting_address_participants` × [`neon/schema.proposal.sql`](../../neon/schema.proposal.sql) `meetings_cancel` | `Sender accepted their own invitation` на стеку з location і на повному стеку. На base+case заборонено — тому старий oracle `neon/acceptance.sql:58` зелений і маскує регресію | Адитивна [`neon/meeting-status-guard.migration.sql`](../../neon/meeting-status-guard.migration.sql): один guard на перехід OLD→NEW, незалежний від будь-якого union політик | 3 порядки apply PASS; 3 мутанти guard відхилені; повторний apply відмовлено |
| 2 | **Запрошення переживає згоди.** `meetings_need_approved_case` стоїть лише на INSERT. Після зміни умов, відкликання, закриття чи прострочення отримувач усе одно приймає старе запрошення — чат без жодної чинної згоди. Кнопка «Прийняти» це дозволяла звичайним кліком | [`neon/case-state.migration.sql`](../../neon/case-state.migration.sql) рядок політики; `renderMeetings` у [`web_launch/real-journey.mjs`](../../web_launch/real-journey.mjs) | `Recipient accepted after the agreement changed`; 4/4 нових client-тестів падали; у браузері старий екран на серверну відмову відповідав «Такий запит уже існує» й далі пропонував «Прийняти» | Той самий guard (PT409 — відновлювано). Клієнт не шле завідомо застаріле прийняття й мапить серверну відмову; картка показує причину та «Переглянути умови». Те саме запрошення знову приймається після двох підтверджень | [SQL](SQL_ACCEPTANCE.json); [4 client-тести](../../web_launch/invitation-acceptance.test.mjs), 3 client/oracle-мутанти відхилені; [браузер](browser-green/RESULT.json) 3 розміри |
| 3 | **Фальшивий «вихід» і втрата чернетки.** Відправник скасував прийняту зустріч → отримувач із чинною сесією бачить «Потрібен активний сеанс», ненадісланий текст стерто. І на «Надіслати», і на фоновому читанні кожні 5 с. Так само — застаріла «Прийняти» на скасованому запрошенні | `#meeting`, `respondInvitation` у [`real-journey-client.mjs`](../../web_launch/real-journey-client.mjs); `run`, `pollConversation` у `real-journey.mjs` | [3 з 4 браузерних сценаріїв](unavailable-red/RESULT.json) падають: `must not be sent to sign-in` | Клієнт називає стан (`ResourceUnavailable`, статус 403 збережено). Сторінка лишає людину в сесії, зберігає transcript і текст, вимикає надсилання з поясненням поруч, показує «Скасовано» | [3 client-тести](../../web_launch/unavailable-state.test.mjs); [4 сценарії](unavailable-green/RESULT.json), включно зі збереженням справжнього logout + purge на 401 |
| 4 | **Flaky SQL-harness.** Результат дочірнього psql читався на `exit`, коли stdout ще не дочитаний | `tools/message-intent-sql-acceptance.mjs`, `tools/pilot-hardening-sql.mjs` | 5 падінь у 62 запусках, із них 2 з 29 на незмінному стеку (`undefined !== <intent id>`) | `exit` → `close`, один токен у кожному | 0 падінь у 40 запусках |

Фактичні екрани: [старий код після застарілого кліку](browser-red/standard-failure.png) · [новий: причина й наступна дія](browser-green/standard-2-stale-refused.png) · [скасована розмова: текст і причина на одному екрані](unavailable-green/send-after-cancel.png).

**Збережені інваріанти.** Дві незалежні згоди, revision invalidation, receiver-only acceptance, CAS, purge на 401, late-read/epoch guards, наступна чернетка, same-session retry, Current default / Atelier opt-in. Guard зв'язує рівно тих, кого зв'язує RLS (`row_security_active`): owner-фікстури чинних acceptance не зламані.

## 2. Що перевірив незалежно

| Claim автора | Перевірка | Вердикт |
|---|---|---|
| Пакет на product branch GitHub | `git ls-remote` | **Ні**: remote `6724682`, бракувало 3 файлів handoff |
| Dirty лише `journey-ui.mjs`, SHA `68d8…` | `git status` + `sha256sum` на Windows checkout, staged порожній | Так |
| Базовий Node gate 59/59 | Та сама команда з handoff | 59/59 |
| Review build 97 файлів | `node neon/build.mjs` у новий каталог | 97; посилань на відсутні файли 0; тестів/SQL/fixtures у public assets 0 |
| 5 SQL acceptance на PG16.15 | Ті самі tools, шляхи Windows→Linux лише в scratch-копії | 5/5 PASS, з flake із рядка 4 |
| Чинні SQL-набори з новим guard у стеку | Ті самі 5 tools + guard після case-state | 5/5 PASS (перша версія guard ламала 2 — виправлено до коміту) |
| Responsive-матриця автора | Його runner, Chromium 141, мій кандидат | 56 спостережень, 0 issues, 8 повних шляхів |
| WebKit 8 профілів | — | **Не перевірено**: WebKit у цьому середовищі відсутній |
| Gateway: origin/CSRF, readiness flags, ліміти тіла | Читання `neon/worker.mjs` + чинні тести | Дефекту не знайдено; див. P2-12 |

## 3. Ранжований список

| Пріоритет | Claim → locator | Незалежна перевірка | Вердикт |
|---|---|---|---|
| P0-1 | Відправник не приймає за отримувача → `meeting_requests` UPDATE policies | PG16.15, два актори, RLS | **Дефект, виправлено локально** |
| P0-2 | Запрошення потребує чинних згод і при прийнятті | те саме + клієнт + браузер | **Дефект, виправлено локально** |
| P1-3 | Скасована зустріч не є втратою сесії | Chromium, fixture | **Дефект, виправлено локально** |
| P1-4 | «Видимий результат дії» → `#real-status` у `real-journey.html` | [вимір](design/DESIGN_CAPTURE.json): після дії статус поза екраном у **23 з 28** випадків (телефон, landscape, desktop). Після «Надіслати запрошення» форма лишається заповненою без видимої зміни | **Відкрито.** Змінює default-вигляд — потрібне рішення Андрія |
| P1-5 | «Де я» → `ol.real-steps` | Код + [екран](design/journey-phone-2-terms-top.png): чотири кроки статичні, поточний не виділено | **Відкрито** |
| P1-6 | JS-fixture моделює сервер → `tools/fixtures/real-journey-fixture.mjs` | Розбіжності з SQL: PATCH запрошення без перевірки згод (виправлено); немає unique pending-pair; INSERT запрошення без expiry/plan/block | **Системний ризик.** Саме він пропустив P0-1 і P0-2 крізь усі JS/browser-тести |
| P1-7 | `PTxxx` → HTTP-статус на Neon Data API | Не перевірити без live. На це покладаються 5 міграцій (4 чинні + guard) | **Gate першого live JWT-проходу** |
| P1-8 | Форма умов на телефоні | Вимір: 1930 px при екрані 844 px; після вибору людини перший екран — навігація | Відкрито (відоме авторові) |
| P2-9 | Чат після втрати згод уже ПІСЛЯ прийняття | `messages_create` вимагає лише `status='accepted'` | Продуктове рішення, не змінював |
| P2-10 | SQL-tools переносні | 5 tools прив'язані до `C:\Users\Andrii\.codex\tmp\…` | Новий runner — через env; старі не чіпав |
| P2-11 | Public assets мінімальні | `cycle-exchange.mjs`, `meeting-card.mjs` опубліковані, жодна сторінка їх не імпортує | Мертва публічна поверхня, 2 з 97 |
| P2-12 | `/config.json` завжди відповідає JSON | OAuth-прапори on + невалідні Neon URL → неперехоплений `GatewayError` | Fail-closed, але неконтрольований 500 |
| P2-13 | `tools/neon-review-transaction.mjs` — актуальний порядок | Список із 3 міграцій, без guard і 3 пізніших | Історичний; новий cloud review має включати 1a |

## 4. Дизайн: лише те, що я бачив

Переглянуто 11 знімків ([каталог](design/)) плюс 3 знімки сценаріїв із розділу 1. Решту знімків я не відкривав і не оцінюю. Скрипт: [`design-capture.mjs`](design-capture.mjs).

- **Сильне:** `summit`, `get`, `studio-journey` — одна мова: тонкий Montserrat, золото, повітря, одна головна дія. Desktop реального шляху чистий.
- **Розрив бренду:** [`index.html`](design/index-desktop.png) (вхід і профіль) — інша візуальна система: жирний гротеск, сіро-сині заливки, градієнтні pills. Перший крок реального шляху виглядає іншим продуктом.
- **Мова:** бренд-сторінки англійською, реальний шлях лише українською; DE/EN для швейцарської когорти немає (P1 у handoff).
- **Atelier на реальному шляху** майже не відрізняється від Current ([знімок](design/journey-phone-atelier-1-dashboard.png)).

Експертна оцінка за рубрикою 5×20, **не виміряне задоволення користувачів**: бренд-сторінки ≈ 80; реальний шлях двох людей ≈ 64 (наступна дія 11, ієрархія/бренд 13, щільність 11, чесність стану 14, responsive/a11y 15).

## 5. Команди й exit codes

| Команда | Exit |
|---|---|
| `node --test web_launch/matching.test.mjs web_launch/real-journey-client.test.mjs web_launch/message-intent.test.mjs web_launch/mobile-pilot.test.mjs` | 0 (59/59) |
| 17 test-файлів, що залежать від змінених client/fixture/page/worker | 0 (123/123) |
| `node --test web_launch/*.test.mjs neon/*.test.mjs operator_dashboard.test.mjs` на фінальному source, один раз | 0 (538 тестів: 537 pass, 1 skip, 0 fail) |
| `SYNERA_ACCEPTANCE_PGPORT=<port> node tools/meeting-status-guard-sql-acceptance.mjs --receipt=…` | 0; 12 стадій, 9 баз створено й видалено |
| `node neon/build.mjs dist-neon-opus-final-20261009` | 0; 97 файлів; `release.json` SHA256 `bbb4795825840a074d38982fa57a6e9bacf576479b5f67dfb1bf20975e53696f` |
| `node tools/invitation-acceptance-browser.mjs --candidate=… --out=… --sizes=standard,small,desktop` | 0 на новому; 1 на baseline |
| `node tools/unavailable-state-browser.mjs --candidate=… --out=…` | 0 на новому; 1 на baseline |

Кандидат gitignored і unpublished; це новий локальний build, не репліка `153b1eba…`.

## 6. Diff і хеші

Поверх `6512703`: `378c461` (guard + клієнт + картка), `af8b5b9` (unavailable state), `6e09ccb` (harness) і коміт цього звіту з entrypoints, промптом v2 та приміткою в заголовку міграції. Код і тести: 12 файлів, +872 / −13.

| SHA256 (перші 16) | Файл |
|---|---|
| `a90c6e38ed75fe45` | `neon/meeting-status-guard.migration.sql` |
| `fb9a2e05ca1c144e` | `neon/meeting-status-guard.acceptance.sql` |
| `7488524c9d3faec3` | `tools/meeting-status-guard-sql-acceptance.mjs` |
| `b205b46907781745` | `web_launch/real-journey-client.mjs` |
| `84464d291b4c1a05` | `web_launch/real-journey.mjs` |
| `c42eaf007d4f59f5` | `tools/fixtures/real-journey-fixture.mjs` |

Повні хеші SQL-джерел — у [SQL_ACCEPTANCE.json](SQL_ACCEPTANCE.json).

## 7. Невирішені gates

- Нова міграція **не застосована ніде** й змінює точний набір rollout: тепер 1 → **1a guard** → 2…6 ([ROLLOUT_REVIEW](../product-status-20261004/ROLLOUT_REVIEW.uk.md)). Без 1a крок 2 відкриває P0-1.
- Локальний SQL — PG16.15 з identity shim; live — PG18.6 і справжній JWT. Не перевірено.
- Після apply старі `pending`-запрошення можна прийняти лише за погодженої домовленості; перед apply порахувати їх (metadata only).
- Два живі акаунти, фізичні Android/iPhone, PWA install, recovery point, WebKit-повтор цих двох UI-фіксів.
- P1-4/P1-5 чекають рішення: sticky-статус змінює default-вигляд.

## 8. NEXT

Додати до чинного acceptance правило «кожен oracle згоди повторюється на КОЖНОМУ пізнішому рівні стеку й проходить перехід як `authenticated`, а не owner-seed», і першим живим проходом двох акаунтів перевірити саме P0-1: PATCH `status=accepted` від відправника має повернути відмову через справжній JWT.
