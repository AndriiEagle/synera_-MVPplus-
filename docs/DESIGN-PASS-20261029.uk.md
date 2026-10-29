# Synera — дизайн-прохід 29.10.2026

Реалізація шести пунктів дизайн-лінії завершена й локально перевірена. **539/539 тестів**, збірка успішна, обов’язкові 15 телефонних знімків і додаткова матриця 36 знімків без помилок сторінки чи горизонтального прокручування. Загальна оцінка всього працюючого продукту **9/10 ще не прийнята**: закриті серверні сценарії, фізичні телефони й незалежне художнє приймання залишаються окремими воротами.

Власник змін: ця Codex design lane. Worktree `C:/sw/synera-design`, гілка `claude/synera-design-20261029c`, незмінений HEAD `a95acd525afd3c7a729bf7123254d9e81c224e93`. Початковий worktree був чистий. `neon/` не змінено. Commit, push, deploy та install не виконувалися. Сервер на 49711 зупинений після перевірок. Усі створені артефакти — всередині worktree; тимчасові каталоги тестових інструментів використовують звичайний OS temp на C:, D: не використовувався.

> Уточнення 29.10.2026 після b083c07: стартовий вигляд — темний із золотом (Synera); Atelier доступний за вибором. Нижче збережено опис початкового дизайн-проходу.

## Що змінилося

- Atelier — стартовий вигляд без збереженої переваги, включно з недоступним localStorage. Усі 14 раніше підтриманих явних значень `synera.style` збережені. Current / Synera, Current / Web, Night і компактні пресети доступні в одному селекторі. Старий явно збережений custom layer Atelier також має відображення у спільній палітрі.
- Однаковий HTML шапки на всіх 12 сторінках: логотип ліворуч, «Мова і вигляд» праворуч. Мовний і візуальний селектори, вихід, повернення до входу та тур знаходяться всередині меню. Окремої зовнішньої кнопки «Вигляд» немає. Escape закриває меню; панель уміщується на 390 px.
- Єдина система шрифтів: локально наявний Montserrat для display, Segoe UI з Arial fallback для основного тексту. Спільні кремова / зелена / бронзова, Current та Night палітри охоплюють шапку, заголовки, форми, вкладки й закриті стани. Виправлені успадковані бліді заголовки Rooms і темні вкладки Studio на Atelier.
- Перший екран має героя й одну головну дію. Міжсторінкові режими зібрані в єдине закрите «Ще режими». Назви: «Майстерня співпраці», «Домовленість удвох», «Спільна розмова», «Розмова втрьох» тощо. Внутрішні етапи поточного сценарію лишилися робочими вкладками. Посилання «Попередній дизайн» прибране.
- Автоматичний тур більше не перекриває перший вхід і не прокручує людину до неактивної форми. Явний запуск із меню працює; послідовність і збереження завершення туру збережені.
- Summit стартує українською; DE / EN використовують той самий збережений мовний вибір, що й інші основні сторінки. Перекладені також декоративні картки та підписи. Композиція Summit збережена, контраст карток на світлому тлі виправлений.
- Головна має короткий ряд «Як це працює»: взаємність → час → умови → підтвердження. Повідомлення про закритий вхід лишилося правдивим, але стало спокійним другорядним текстом під героєм.
- Іконки додані також до закритих та порожніх станів реального шляху й кімнат. Поруч є текстові назви, тому ці повторювальні зображення декоративні з `alt=""`. Нової анімації немає; спільна оболонка враховує reduced motion.
- Нові українські UI-тексти мають DE / EN рядки в чинних таблицях. Основний overlay зберігає `said()` / `translate="no"`. На допоміжних сторінках спільний переклад обмежений власними статичними заголовками й меню, щоб не торкатися особистих нотаток чи завантаженого архіву.

## Файли реалізації

Усі наведені нижче шляхи від кореня worktree:

```text
web_launch/site-shell.css
web_launch/site-shell.mjs
web_launch/style-switcher.mjs
web_launch/style-switcher.test.mjs
web_launch/index.html
web_launch/summit.html
web_launch/studio.html
web_launch/studio-journey.html
web_launch/real-journey.html
web_launch/rooms.html
web_launch/triangle.html
web_launch/legal.html
web_launch/catalogue.html
web_launch/get.html
web_launch/outcome-archive.html
web_launch/lab.html
web_launch/summit.mjs
web_launch/product-access.mjs
web_launch/index-i18n.mjs
web_launch/index-i18n-table.mjs
web_launch/index-i18n.test.mjs
web_launch/real-journey-i18n.mjs
web_launch/real-journey-i18n.test.mjs
web_launch/legal-i18n.mjs
web_launch/real-journey.mjs
web_launch/rooms.mjs
web_launch/onboarding-tour.mjs
web_launch/assets.mjs
web_launch/sw.mjs
web_launch/studio-sw.mjs
web_launch/premium-match.webp
web_launch/premium-calendar.webp
web_launch/premium-terms.webp
web_launch/premium-signature.webp
web_launch/design-pass.test.mjs
tools/design-pass-browser.mjs
tools/design-pass-mutation.mjs
docs/DESIGN-PASS-20261029.uk.md
docs/design-pass-20261029/
DONE.md
```

`docs/design-pass-20261029/` містить знімки, оглядові аркуші, журнали, перевірки першого входу й конвертацію іконок. `update.mjs`, `polish.mjs`, `final-scope.mjs` — історичні одноразові підготовчі скрипти: **не запускати повторно**. Вони не входять до public assets або збірки. Для повторного приймання потрібні лише команди перевірок нижче.

Два незмінені fixture-файли `artifacts/overnight-20261004/outcome-export-{plain,gzip}.json` матеріалізовані точними байтами `git show HEAD:<path>` всередині worktree: sparse checkout їх не містив. Вони не є новими прикладами й не потрапляють до public assets. Початковий локальний прогін через їхню відсутність мав ENOENT; фінальна перевірка охопила всі 536 попередніх тестів та 3 нові.

## Іконки та кеш

Прочитано REPORT, DESIGN-DNA та MANIFEST у наданому read-only пакеті. SHA-256 кожного обраного оригіналу звірено з MANIFEST до конвертації. Оригінали залишені незмінними.

| WebP | Джерело в пакеті | Розмір | Байти |
|---|---|---:|---:|
| premium-match.webp | assets/match/idle.png | 160×160 RGBA | 7274 |
| premium-calendar.webp | assets/calendar/available.png | 160×160 RGBA | 7346 |
| premium-terms.webp | assets/quota/full.png | 160×160 RGBA | 6444 |
| premium-signature.webp | assets/signature/ribbon_link.png | 160×160 RGBA | 7810 |

160 px — 2× найбільшого розміру показу 80 CSS px; у короткому ряду та компактних порожніх станах асети повторно використовуються меншими. Усі файли менші за 40 KB. SHA й provenance: [icon-receipts.json](design-pass-20261029/icon-receipts.json).

Нові файли внесені до PUBLIC_ASSETS та обох відповідних shell-кешів. Основний CACHE: `synera-shell-20261029-atelier1`, його точний pin перевіряється тестом. Studio CACHE: `synera-studio-20261029-v6`. Правила щодо приватних API, конфігурації й записів не змінені.

LAB лишається непублічним, як вимагають чинні server/cohort тести. Три його картинки отримані лише локальним browser fixture, що підставляє власні синтетичні файли. Це не доказ доступного `/lab.html` у продукті; HTTP-інваріант 404 збережений.

## До та після

Еталон «до», 28.10: [readiness review із реальними знімками](https://claude.ai/artifact/PNoYMyc4tk5Jho3SrcYgUe). Інструмент читання вебсторінок не зміг відкрити цей artifact. Вихідні оцінки Summit 8, Atelier home 7.5, Current 7, Studio 6.5, Night 5, cohesion 4 взяті з доручення Андрія, а не видані за повторно перевірений аудит. Точні внутрішні шляхи PNG того artifact у цій сесії недоступні.

Додатковий відтворюваний baseline на `a95acd5`, знятий до правок: `docs/design-pass-20261029/baseline-shots/design-iphone-{home,home-atelier,home-night,summit,studio,real-journey,rooms,triangle,legal}.png`. Це локальний baseline 29.10, не підміна знімків 28.10.

Після: [shots/](design-pass-20261029/shots/), 51 фінальний PNG. Усі переглянуті через `review-sheet-01.jpg` … `review-sheet-14.jpg`; чотирнадцятий аркуш показує також усі вертикальні сегменти повної головної. Оцінки нижче — власний художній огляд саме знятих станів, не незалежна експертиза та не підтвердження Андрієм планки 9/10.

| Екран / стан | Візуальна оцінка | Причина та after PNG у shots/ |
|---|---:|---|
| Перший вхід iPhone / Android | 9 | Герой лишається відкритим, одна дія; `design-iphone-first-visit.png`, `design-android-first-visit.png` |
| Home Atelier | 9 | Повітря, спільна шапка, зелена CTA, спокійний статус та предметні іконки; `design-iphone-home-atelier.png` |
| Home Current | 9 | Збережений графіт / золото, той самий порядок героя; `matrix-synera-index.png` |
| Home Night | 9 | Прибраний верхній блок режимів, виразна одна CTA; `design-iphone-home-night.png` |
| Summit | 9 | Українська, збережена композиція, читабельні картки на Atelier; `design-iphone-summit.png` |
| Studio, перший екран | 9 | Людська назва, одна дія, читабельні вкладки в обох палітрах; `design-iphone-studio.png` |
| Studio journey, перший екран | 9 | Чітка дія й послідовність етапів; `matrix-atelier-studio-journey.png` |
| Real journey, закритий стан | 9 | Іконка, чесне пояснення, одна дія повернення до профілю; `design-iphone-real-journey.png` |
| Rooms, закритий стан | 9 | Прибрані темні на світлому заголовки, спільна картка й зрозуміла CTA; `design-iphone-rooms.png` |
| Розмова втрьох, перший екран | 9 | Людська назва, одна дія, спільні вкладки; цифри темних аватарів читабельні; `design-iphone-triangle.png` |
| Legal | 8.5 | Шапка й читання узгоджені, але довгий юридичний матеріал усе ще щільний; `design-iphone-legal.png` |
| Catalogue | 8.5 | Герой та оболонка узгоджені; нижче лишається технічний довідник зі старими назвами компонентів; `matrix-atelier-catalogue.png` |
| Get | 9 | Одна дія, чесні CHF 0 та межі PWA, зрозумілі блоки Android / iPhone; `matrix-atelier-get.png` |
| Приватний архів, без файлу | 8.5 | Контраст та дія вибору файлу виправлені; нативний file picker лишається мовою браузера; `matrix-atelier-outcome-archive.png` |
| LAB, локальний fixture | 8.5 | Спільна шапка й одна дія; далі це щільний інструмент дослідження, а не відполірований onboarding; `matrix-atelier-lab.png` |

## Перевірки та докази

1. `node --test web_launch/*.test.mjs` → **539 pass, 0 fail, 0 skip**, exit 0: [full-tests.log](design-pass-20261029/full-tests.log). Нові тести перевіряють default без запису в storage, усі явні стилі та consent, селектор при відмові storage, однакову шапку й залежності 12 сторінок. Старі перевірки default та кешу оновлені.
2. `node web_launch/build.mjs` → exit 0, **121 файл**, `published:false`: [build.log](design-pass-20261029/build.log).
3. Сервер запущений із `SYNERA_PORT=49711`, stdout/stderr у `server.log`, без pipe. Обов’язкова команда `node C:/Users/Andrii/.claude/skills/synera/scripts/shots.mjs C:/sw/synera-design/docs/design-pass-20261029/shots design=http://127.0.0.1:49711` → exit 0: [shots.log](design-pass-20261029/shots.log), [report.json](design-pass-20261029/shots/report.json). 15/15 HTTP 200; помилок і горизонтального прокручування немає.
4. `node tools/design-pass-browser.mjs` → exit 0: [browser-report.json](design-pass-20261029/browser-report.json). 33 продуктові HTTP-випадки + 3 локальні LAB-прев’ю; 12 сторінок × Atelier / Current / Night; одна шапка й закритий блок режимів, меню в межах 390 px, Escape. На index / Summit / real journey / get / legal перевірені DE → EN → UK, перезавантаження та точне повернення українського заголовка. Чернетка з текстом, що збігається з UI-рядком, переживає зміну мови та стилю.
5. `node docs/design-pass-20261029/first-visit-check.mjs` → до правки RED, після PASS: [first-visit-before.log](design-pass-20261029/first-visit-before.log), [first-visit-after.log](design-pass-20261029/first-visit-after.log). Чистий перший вхід не прокручується, явний тур працює.
6. `node tools/design-pass-mutation.mjs` → `PASS_MUTANT_REJECTED`: [mutation.log](design-pass-20261029/mutation.log). Оракул відхиляє повернення старого default Current і приймає поточний модуль. До правки той самий default-контракт був RED: [regression-before.log](design-pass-20261029/regression-before.log).
7. `git diff --check` → exit 0; `git diff --name-only -- neon` → порожньо. Сервер зупинений, порт 49711 без listener.

Перевірки на iPhone — Chromium з iPhone UA, не Safari/WebKit. Візуальний огляд виконав цей Codex; інший модельний або людський дизайнер не залучався. Детерміновані тести й реальний браузер — окремі поведінкові докази, але вони не встановлюють художній консенсус.

## Що ще нижче 9/10 або не підтверджено

- **Весь продукт не можна оголосити 9/10.** Закриті real journey / Rooms красиво й чесно показані, але не пройдені з двома справжніми авторизованими людьми. Backend / реєстрація належать іншій лінії.
- Legal, приватний архів та допоміжні довідники поки нижче загальної художньої планки за причинами в таблиці. Текст юридичних умов не переписувався заради скорочення. Мову нативного file picker визначає браузер.
- Глибокі активні стани Studio / journey, усі можливі повідомлення помилок, реально завантажені приватні архіви та повна динамічна локалізація допоміжних режимів не отримали повного художнього приймання. Спільний мовний control не є доказом перекладу кожного давнього рядка цих модулів.
- Фізичні Android / iPhone, Safari, live install / update та production deployment не перевірялися цим проходом. Жодні технічні тести не підміняють ці докази.
- Artifact 28.10 не вдалося прочитати інструментом; порівняння точних його PNG залишається для reviewer з доступом.
- Підтриманого `codex_app set_thread_title` серед доступних інструментів немає. Назву чату не змінено, номер 1591 повторно не резервувався.

NEXT, 10–15 хвилин для Claude: переглянути цей diff і фінальні знімки, окремо оцінити зазначені екрани нижче 9, потім інтегрувати дозволені зміни через власний review. Для загальної оцінки продукту потрібен наступний живий прохід після відкриття серверної лінії.

Models used: none (provider calls=0, USD=$0.00).
