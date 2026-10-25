# Synera: актуальний handoff для незалежного review

**Оновлення 25.10.2026:** почни з [перевіреного checkpoint](SYNERA_CONTINUATION_20261025.uk.md): він фіксує нові source/recovery facts та незавершений live AI/Android. Нижче збережений handoff19.10 для свого pinned source.

Оновлено 19.10.2026. [Репозиторій](https://github.com/AndriiEagle/synera_-MVPplus-) публічний; канонічна гілка для нового review — **`main`**. [Продуктова ДНК](PRODUCT_DNA.uk.md) · [завдання рев’юеру](CLAUDE_OPUS_REVIEW_PROMPT.uk.md).

Поточне доповнення після аудиту: **`7eaa952c6e0e498521cc325ab1cf24fec1e0f725`** — код і локальні докази. [Звіт реалізації](../artifacts/gemini-implementation-20261017/REPORT.uk.md) · [хешовані фінальні перевірки](../artifacts/gemini-implementation-20261017/LOCAL_ACCEPTANCE.json) · [план пілоту](../plan/launch/AUDIT_PILOT_CHECKS_20261018.uk.md). Новий промпт прив’язаний саме до цього commit; наступні документаційні коміти не змінюють код. До зовнішнього review перевір, що цей SHA є предком main.

Додано `action-scoper.mjs`, `result-card.mjs` та `profile-erasure.*`; 692 Node PASS / 1 локальний SKIP, окрема PostgreSQL16 acceptance 12+4+3, browser fixtures 10+4, offline shell PASS. GitHub CI перевіряй за SHA конкретного запуску. Profile erasure — окремий gate OFF; provider Auth deletion pending, двосторонні записи зберігаються. Це не production activation.


Додаткова перевірка рекомендацій Gemini: [рішення, виправлення та незакриті gates](../artifacts/gemini-review-20261017/REPORT.uk.md). Вона відділяє підтверджений пропуск PostgreSQL у CI від неприйнятого tombstone SQL і бізнесових гіпотез; production readiness залишається окремим прийманням.

## Що входить у цей зріз

Інтеграція поєднує попередній `main` **`6642c89359969afade480a7140e7feed08ad9574`** і перевірений продуктовий source **`76e189756f807cf8a6cf553cc687c626ac16ffff`**. Runtime, SQL, assets, тести та CI з другого коміту збережені; конфлікти README й `.gitattributes` розв’язані без зміни поведінки застосунку. Точний SHA своєї копії отримай через `git rev-parse HEAD`.

| Гілки / матеріал | Рішення |
|---|---|
| `main` | Єдина поточна точка входу для review |
| `codex/synera-reviewed-mobile-20261013` | Source `76e1897`, інтегрований у цей зріз |
| `codex/synera-product-20261002`, `codex/synera-mobile-ci-fix-20261011`, `codex/synera-first-ten-integration`, `codex/synera-rc-20260929`, `codex/synera-documentation-refresh` | Їхні коміти вже входять у reviewed source |
| `codex/synera-multihost-plan-20260915`, `r3/adaptive-layer-20260917` | Їхня історія входить у попередній `main`; planning-файли збережені |
| `codex/synera-premium-pwa-variant` (`390d85f`) | Історичний прототип. Чотири його коміти не злиті буквально: потрібний дизайн перенесено комітом `330fe86` як добровільну «Нічну карту», зі збереженням сучасного перемикача. Старі i18n/PWA реалізації та screenshots не підміняють поточний код |

Історичні гілки збережені. Їхні старі README, push-hold та числа тестів не визначають сьогоднішній стан. Приватна незакомічена робота з інших checkout не входить до цього пакета.

## Продукт і код

Шлях для перевірки: профіль → взаємна відповідність → спільна редакція умов → дві незалежні згоди → запрошення → прийняття адресатом → приватна розмова → доказ результату → прийняття отримувачем. Дивись фактичні readiness flags: доступність source не означає, що цей шлях увімкнений на live-сайті.

| Частина | Вхід у source |
|---|---|
| Головна, вхід, профіль, мови | `web_launch/index.html`, `app.mjs`, `profile-store.mjs`, `index-i18n.mjs`, `index-i18n-table.mjs` |
| Реальний шлях двох людей | `web_launch/real-journey.html`, `real-journey.mjs`, `real-journey-client.mjs`, `real-journey-i18n.mjs` |
| Синтетичний Studio-сценарій | `web_launch/studio-journey.html`, `journey-ui.mjs`, `journey-core.mjs`; demo-згоди не є живою парою |
| Стиль і PWA | `web_launch/style.css`, `style-switcher.mjs`, `pwa.mjs`, `sw.mjs` |
| Сервер | `neon/worker.mjs` та модулі в `neon/` |
| Згоди / власність | `neon/meeting-status-guard.migration.sql`, `neon/stack-invariants.acceptance.sql` |
| Збірка / allowlist | `neon/build.mjs`, `web_launch/assets.mjs` |

Current залишається default; Atelier, «Нічна карта» й інші пресети добровільні. Збережи власний текст людини, мову переходів без localStorage, незбережені чернетки, обидві згоди, скасування згоди при зміні редакції, receiver-only acceptance, захист від запізнілих відповідей після logout та явний повтор повідомлення в тій самій сесії. Не розширюй cache на API, приватні дані, конфігурацію або query URL.

## Відтворення перевірок

Node.js 22 — версія CI. У чистому clone немає `node_modules`, браузерних бінарних файлів і згенерованих `dist-neon-*`. Locked npm-залежності потрібні для browser tooling; сам preview і builder працюють зі стандартним Node.

```sh
git clone --branch main https://github.com/AndriiEagle/synera_-MVPplus-.git
cd synera_-MVPplus-
git rev-parse HEAD
git merge-base --is-ancestor 76e189756f807cf8a6cf553cc687c626ac16ffff HEAD
git merge-base --is-ancestor 6642c89359969afade480a7140e7feed08ad9574 HEAD
npm ci
npx playwright install chromium
node --test web_launch/*.test.mjs web_launch/iceberg/*.test.mjs neon/*.test.mjs plan/v6/workflow/approval-boundary.test.mjs
npx playwright test tests/browser-e2e.spec.mjs tests/studio-e2e.spec.mjs
node tools/header-layout-acceptance-20261013.mjs
node neon/build.mjs dist-neon-review-20261017
node tools/offline-shell-acceptance.mjs --candidate=web_launch/dist-neon-review-20261017
node tools/location-browser-acceptance.mjs
node tools/case-social-draft-browser.mjs
node tools/profile-erasure-browser.mjs
node web_launch/a11y_audit.mjs
```

На Linux системні browser-залежності встановлюються за інструкцією Playwright; CI використовує `npx playwright install --with-deps chromium`. Ці команди не застосовують production SQL і не публікують сайт. Header/browser tests перевіряють fixtures. Offline acceptance перевіряє зібрані публічні assets після зупинки origin-сервера.

Локальний перегляд: `node web_launch/server.mjs`, відкрий надрукований loopback URL. Використовуй чисте середовище без `SYNERA_*` overrides: tracked `config.public.json` закриває реєстрацію та live readiness. Не потрібні ключі чи акаунти. Повний серверний шлях перевіряється окремо; preview не є заміною live API. Не додавай `--local-ai` для переносного review: ця окрема опція залежить від локального KI/DOMOVYK, а nested memory tests — від сховища автора на D:. Ці залежності не входять у clone і не потрібні наведеним CI-командам.

Builder пише у власний `web_launch/dist-neon-*`: для нового review обери нове ім’я, щоб зберегти попередню збірку. `release.json` містить hashes усіх assets поточної збірки; `built_at` змінює hash самого receipt. Порівнюй кожний asset, а не лише загальний release SHA. Ліцензії включених assets — `web_launch/asset-licenses.txt`.

Для SQL використай лише погоджену одноразову локальну PostgreSQL: [runner](../tools/meeting-status-guard-sql-acceptance.mjs), [повний стек](../neon/stack-invariants.acceptance.sql). Без `SYNERA_ACCEPTANCE_PG` відповідний Node integration test пропускається. JS-fixture не виконує RLS; SQL identity shim не доводить живий JWT. Не використовуй production connection string для acceptance-runner.

## Що вже має докази

[Звіт 15.10](quality/reviewed-release-20261015.uk.md) і [ACCEPTANCE.json](../artifacts/reviewed-release-20261015/ACCEPTANCE.json) прив’язані до source `76e1897`:

- 668 Node PASS, 0 FAIL, 1 PostgreSQL integration SKIP; 39 browser E2E PASS.
- 12 header cases / 84 checks; повернення старого CSS дає 3 відмови.
- 14 offline checks із зупиненим сервером і очищеним HTTP cache; вилучення залежності повертає ненульовий exit.
- 409 після відмови видалення профілю зберігає профіль/сесію та показує пояснення; інші помилки зберігають власну семантику.
- Location workflow зі штучними акаунтами та accessibility audit без critical/serious порушень.

[CI](https://github.com/AndriiEagle/synera_-MVPplus-/actions/workflows/ci.yml) запускає переносний Node-набір: 650 cases, 649 PASS / 1 SKIP у локальному повторі 17.10, плюс browser/header/offline/location/a11y. Історичні 669 включають ще 19 nested tests, зокрема залежні від локального сховища; вони не входять до CI-команди. Перевіряй статус саме свого SHA. [WebKit/storage acceptance 11.10](../artifacts/opus-pass4-webkit-20261011/REPORT.uk.md) — окремий датований доказ. Він не приймає пізнішу зміну шапки: у проході 15.10 очікуваний WebKit executable був відсутній.

Три source hashes в історичному `ACCEPTANCE.json` виміряно з CRLF: `neon/profile-delete.test.mjs`, `tools/offline-shell-acceptance.mjs`, `tools/fixtures/profile-delete-fixture.mjs`. Git зберігає їх із LF відповідно до `.gitattributes`; checkout 17.10 байтово збігається з blobs `76e1897`. Ця різниця закінчень рядків не є новим code diff; історичний receipt залишено незмінним.

## Що ще потрібно до запуску людей

| Пріоритет | Відкрита перевірка / рішення | Критерій приймання |
|---|---|---|
| Блокер запуску | Production-схема, recovery й точний rollout | Поточний readback, перевірене відновлення, погоджений пакет і порядок міграцій |
| Блокер запуску | Дві живі сесії та signed JWT | Реальний шлях двох людей; sender self-accept відхилено, статуси `PTxxx` правильно доходять через HTTP; отримувач приймає справжній результат |
| Блокер мобільного пілота | Фізичні Android та iPhone/Safari | Install, update, resume, keyboard і збереження чернетки; окремо поточний WebKit |
| Відкритий дефект / контракт | Повне видалення акаунта й room retention/FK | Узгоджене збереження/видалення даних, справжній SQL oracle; видимий 409 сам по собі не виправляє причину |
| Окремі функції | Google/email delivery, live location/map, AI/voice, інші provider-сценарії | Фактичні runtime-виклики й результат; fixtures або каталог можливостей не є прийманням |
| Продуктове рішення | Юридичні DE/EN, локальна чернетка умов на головній, узгодженість екранів | Незалежний мовний/юридичний review та рішення власника без прихованого redesign |

Порядок rollout: case-state → **meeting-status-guard** → meeting-location → group-room → case-outcome → meeting-address-agreement → message-intent. До погодження production apply не виконувати. Історичний [rollout review](../artifacts/product-status-20261004/ROLLOUT_REVIEW.uk.md) містить передумови; його старий build hash потрібно звірити з новим кандидатом. Старий HTTP 404 — спостереження 13.10, не свіжий доказ live-стану.

Обов’язкова попередня китайська review-хвиля лишається частково **HOLD**: [receipt/triage](../artifacts/reviewed-release-20261015/PROVIDER_TRIAGE.uk.md). Прийнято вузьку знахідку MiniMax; DeepSeek має 429 без cost receipt, GLM — started без terminal. Відома сума $0.00605802, остаточна невідома. Нових provider-викликів для цього GitHub-зведення немає; оплачувані повтори не запускати до canonical reconciliation.

## Що повернути власнику

Один короткий звіт: SHA, середовище, самостійно відтворені P0/P1/P2 із file/line і кроками, які припущення спростовані, команди й фактичні результати, неперевірені межі та один наступний крок. Висновок «готово для людей» потребує живих gates вище. Якщо доробку замовлено окремо, працюй у власній `codex/<task>` гілці й поверни commit/PR; merge/deploy не випливає з прохання дати висновки.

Нові SQL перевірки та concurrency-команди: [ERASURE_CI.uk.md](../artifacts/gemini-implementation-20261017/ERASURE_CI.uk.md). Запускай тільки на одноразовій PostgreSQL, без production credentials.
