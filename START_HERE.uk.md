# Synera: актуальний код і стан — 2026-10-02

Це спільна точка входу для Codex, Claude Code та іншого ноутбука. Копія чату не є копією коду або доказом запуску.

## Де працювати

- Репозиторій: `AndriiEagle/synera_-MVPplus-`.
- Поточна локальна гілка: `codex/synera-product-20261002`, вихідна точка `e523f0c22982a3156bb63849a27a2fc7fd679906`.
- Поточний checkout на цьому комп’ютері: `C:\Users\Andrii\Desktop\synera-premium-pwa-variant`.
- Продукт: `web_launch/`; сервер Neon/Cloudflare: `neon/`; канон SQL: `supabase/`, з генерацією Neon через `neon/generate-schema.mjs`.
- Старі `plan/HANDOFF_PROMPT_NEXT_CHAT.uk.md` і `plan/v6/HANDOFF.uk.md` містять історичні шляхи та невиправлені на той час дефекти. Використовуй їх як історію плану; актуальне приймання нижче.
- Flutter у `crystallised_in/` — історичний код. Поточний Android-маршрут — PWA у Chrome, з можливістю встановлення на головний екран. Фізичний Android ще не перевірено.

На іншому ноутбуці звір `git branch --show-current`, `git rev-parse HEAD` і `git status --short`. Непередані локальні зміни не з’являються від передачі чату. Власник дозволив commit і push цієї гілки 2026-10-02; точний remote HEAD звіряй після push. Новий rollout живої бази не випливає з дозволу на GitHub.

Актуальна [цінність, сайт і комерційні межі](docs/PRODUCT_VALUE_AND_SALES.uk.md): презентація версії 3 опублікована; Android/iPhone мають інструкції PWA. Пілот тимчасово безкоштовний. Native магазини, вбудована Google Maps SDK-карта та семантичний deep match залишаються відкритими вимогами. Не підмінюй їх рекламою вже наявних функцій.

Найновіше доповнення 02.10.2026: [Triangle L, карта й економіка](docs/L_DIRECTION_AND_ECONOMICS.uk.md). Власник обрав тимчасово безкоштовний Zürich-пілот. `/triangle.html` — окремий локальний режим на одному пристрої: три учасники як неперевірені нотатки, внески, кроки, бюджетні пропозиції/відповіді, добровільна черга, явний експорт; схема можливостей і симулятор витрат. Реальної спільної мережевої кімнати, voice/video, Google SDK, автоматичних радарів або social API тут немає. Чинні екрани, кейси й стилі збережені. Актуальне приймання доповнення: `artifacts/triangle-20261002/RELEASE_RECEIPT.json`.

## Що матеріалізовано

Профілі й приватність, пошук за взаємною користю, версії умов, власне підтвердження кожної сторони, запрошення, повідомлення, календар, блокування/скарги, мобільна оболонка, стилі й окрема презентація збережені.

Додано реальний транспорт локації: Neon перевіряє учасників, згоду, чинні підтвердження умов, зустріч, блокування та серверний час; Cloudflare Worker передає одну округлену точку через тимчасове KV-сховище. Повтор старої згоди після відкликання заборонений. Адреса зустрічі й скасування доходять до іншої сесії при оновленні стану. GPS запускається лише після власної згоди, працює на відкритому екрані й зупиняється при виході, приховуванні вкладки, відкликанні, помилці або завершенні вікна.

Google Maps уже використовується для пошуку адреси, пішого маршруту до зустрічі та маршруту до дозволеної точки співрозмовника. Відкриття — власним кліком. Це Maps URLs, без платного SDK чи ключа API. [Офіційний контракт Google](https://developers.google.com/maps/documentation/urls/get-started).

## Перевірено локально

| Перевірка | Результат | Межа |
|---|---|---|
| Node, `artifacts/product-access-unit-20261002.tap` | 465 PASS, 1 SKIP, 0 FAIL | SKIP — старий необов’язковий PG runner; новий SQL runner виконано окремо |
| `tests/browser-e2e.spec.mjs` | 27 PASS | Оболонка, стилі, мобільний вигляд, локальна навігація та отримання PWA на обох телефонах |
| `tools/location-browser-acceptance.mjs` | PASS, дві сесії, 390 px, WCAG без critical/serious | Справжні клієнт/Worker/Chromium; Auth/Data API/KV та GPS — локальні fixtures |
| `tools/location-sql-acceptance.mjs` | PASS, PostgreSQL 16, всі три SQL-шари | Disposable Docker; provider identity shim; не live Neon |
| SQL атака з дозволеним прямим SELECT | Відхилена оракулом | Доводить, що перевірка приватності справді ловить дефект |
| Підміна адреси при accept/cancel | RED до guard, GREEN після | `artifacts/location-address-red.tap`, нове SQL-приймання |
| Застаріла адреса другої сесії | RED до синхронізації, GREEN після | `artifacts/location-peer-address-red.tap`, нове браузерне приймання |

Повторювані команди:

```text
node --test web_launch/*.test.mjs web_launch/iceberg/*.test.mjs neon/*.test.mjs plan/v6/workflow/approval-boundary.test.mjs
node node_modules/@playwright/test/cli.js test tests/browser-e2e.spec.mjs
node tools/location-browser-acceptance.mjs
node neon/generate-schema.mjs
node neon/build.mjs dist-neon-access-20261002
```

SQL runner очікує вже запущений disposable контейнер `synera-location-20261002` із label `synera.disposable=20261002`, локально наявний `postgres:16-alpine`, без відкритих портів. Він створює окрему локальну БД, перевіряє стару base acceptance до case migration, потім case та location acceptance; кожний набір fixtures закінчується ROLLBACK. Не запускай його проти production.

## Підготовлений реліз

[Актуальний RC2](artifacts/product-access-20261002/synera-neon-product-20261002-rc2.zip) містить 52 дозволені файли Neon/Cloudflare Pages. [Квитанція оновлення](artifacts/product-access-20261002/RELEASE_RECEIPT.json) зв’язує пакет, браузерне приймання та публікацію презентації. CRC і SHA-256 перевірені після читання ZIP. Попередній [RC1](artifacts/product-20261002/synera-neon-product-20261002-rc1.zip) збережено як історію. Репозиторій цілком, історія браузерів і приватні налаштування до архіву не входять.

## Живий стан і межі

`https://synera-pilot.pages.dev`: 2026-10-02 read-only `/api/neon/health` і `/api/neon/session` з `X-Synera-Client: 1` дали 200; конфігурація повідомляє Neon, увімкнену реєстрацію й real-pilot. Це підтверджує шлюз, а не весь сценарій двох реальних людей. Актуальний RC не опублікований цим прийманням; нова міграція, KV binding і реальна локація на живому сайті не підтверджені.

Опублікована окрема демонстрація: [Synera Summit](https://synera-summit-20261001.andypokr911.chatgpt.site/summit.html). Вигадані профілі, без реєстрації й GPS-транспорту. Це презентація, не production.

Координат у PostgreSQL немає. Відкликання/cancel/block/зміна умов відразу припиняють новий авторизований доступ. Явне revoke й rotation також пробують видалити KV key. Після суто SQL-інвалідації тимчасова точка може фізично залишатися недоступною до абсолютного `closes_at`; миттєве фізичне стирання не заявляється. Уже побачену людиною точку відкликати неможливо. При виході/фоні пристрою GPS припиняє оновлення; дозвіл і остання точка діють до revoke або кінця вікна.

KV поширює оновлення між локаціями із затримкою до 60 секунд. Якщо KV поверне попередній `sample_seq`, клієнт отримає стан без точки. Безперервна миттєва локація не гарантується. [Cloudflare KV: запис і узгодженість](https://developers.cloudflare.com/kv/api/write-key-value-pairs/).

Новий rollout за замовчуванням вимкнений. Worker допускає GPS лише разом із `SYNERA_PILOT_READY=true`, `SYNERA_LOCATION_READY=true` та binding `SYNERA_LOCATION_EPHEMERAL`. Старий статичний реліз залишає GPS закритим. Google OAuth має окремий live gate; його увімкнення не випливає з готовності Google Maps.

## Конкретний наступний запуск

1. Після входу власника у Neon/Cloudflare звір саме наявний проєкт та поточний Free plan. Без апгрейдів, нових оплат і читання/передачі ключів.
2. Підготуй перевірений backup/recovery point, звір фактично застосовані case migrations; не повторюй вже застосовану frozen `schema.proposal.sql`.
3. За окремим дозволом застосуй лише відсутню additive case migration та `neon/meeting-location.migration.sql`, створи KV namespace/binding і опублікуй `web_launch/dist-neon-access-20261002` у наявний `synera-pilot`.
4. Підтвердь live RPC, RLS, expiry/revoke й дві реальні сесії перед увімкненням location gate. Пройди профіль → узгоджені умови обох людей → запрошення → прийняття → адреса → одноосібна GPS-згода → перегляд іншою стороною → revoke/cancel. Повтори на фізичному Android.
5. Commit і push продуктової гілки дозволено. Інші ноутбуки працюють із тим самим remote commit, а не з копіями старого чату.

Free KV зараз має 1 000 записів/добу; понад Free ліміт операції відмовляють. Поточний тариф облікового запису ще потрібно звірити у панелі. Пакет не дає дозволу на Paid upgrade. [Поточна офіційна ціна й ліміти](https://developers.cloudflare.com/kv/platform/pricing/).

Стан: **LOCAL_ACCEPTED; LIVE_ROLLOUT_PENDING; ANDROID_PHYSICAL_NOT_VERIFIED**. Нових зовнішніх AI-викликів: 0, USD $0.00. Економія підписки не вимірювалася.
