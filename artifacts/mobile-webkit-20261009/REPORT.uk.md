# Synera: WebKit-виправлення та окреме QA-середовище — 09.10.2026

**LOCAL_MOBILE_PATCH_ACCEPTED / LIVE_LAUNCH_HOLD.** Знайдено й виправлено переповнення форми домовленості у WebKit. Новий Google Cloud проєкт створений; його billing ще не підтверджений. Це не приймання всього продукту чи дозвіл запускати production.

Checkout: `C:/Users/Andrii/Desktop/synera-premium-pwa-variant`, гілка `codex/synera-product-20261002`, вихідний commit `b16b672`.

## Що виправлено і як це відчуває користувач

Збережений інваріант: на вузькому екрані й зі збільшеним текстом усі поля доступні, сторінка не розтягується горизонтально; дві окремі згоди, прийняття запрошення й приватне повідомлення працюють як раніше.

У WebKit нативні списки вибору всередині grid-label розтягували документ. На 320 px документ був 389 px, на 375 — 389 px, при подвоєному обчисленому розмірі тексту на 390 — 705 px. Ізоляція відтворила причину: зміна лише grid-track не допомагала; дозвіл переносу тексту select прибрав переповнення.

До `web_launch/real-journey.css` додано лише:

```css
.real-form select{white-space:normal;text-overflow:ellipsis}
```

Попередні байти CSS збережені як точний префікс. Нативні controls, текст, логіка погодження та дизайн не замінювались. Користувач може прочитати значення й заповнити форму без бокового прокручування. Це UX-висновок із геометрії та справжніх кліків; емоції людей не вимірювались. Current залишається default, Atelier — добровільним режимом.

## Фактичні докази

| Прохід | Спостереження станів | Завершені fixture-шляхи до чату | Результат |
|---|---:|---:|---|
| `baseline` + `matrix`, старий CSS | 56 | 8 | 3 випадки переповнення форми; інших зафіксованих issues немає |
| `green`, виправлення: 320, 375, збільшений текст | 9 | 3 | 0 issues, 0 harness failures |
| `webkit-regression`, інші 5 конфігурацій | 15 | 5 | 0 issues, 0 harness failures |
| `chromium-regression`: 320, збільшений текст, Atelier | 9 | 3 | 0 issues, 0 harness failures |
| `mutation-original`, повернення старого CSS | 3 | 1 | Guard знову відхилив реальне переповнення; сам workflow завершився |
| `final-candidate`, новий пакет без CSS override | 4 | 1 | 0 issues, 0 harness failures; archive + форма + запрошення + чат |

WebKit 26.6: 320×568, 375×667, 390×844, 430×932, 844×390, 768×1024, 390×844 з подвоєним обчисленим текстом, 390×844 Atelier. Chromium — встановлений Google Chrome. У кожному шляху перевірені дві окремі згоди, одне прийняте запрошення, одне збережене й показане повідомлення, доступність видимих controls і ширина документа.

Це desktop WebKit/Chromium з емульованими браузерними параметрами iPhone та синтетичними Auth/Data через наявний Worker fixture. Це не різні фізичні телефони. Service Worker заблокований у runner, тому встановлення PWA, browser chrome, клавіатура iOS/Android, справжній JWT/RLS, два живі акаунти й серверне підтвердження результату цими проходами не доведені. Подвоєний computed text — окремий stress test, не системний Dynamic Type.

Справжні screenshots: [форма до виправлення](matrix/small-journey-editor.png), [форма з нового кандидата](final-candidate/small-journey-editor.png), [приватний чат](final-candidate/small-journey-chat.png). Фінальна форма переглянута візуально: поля вміщуються, текст select переноситься, нативні стрілки й focus ring видно. Велика висота форми лишається відомим UX-тертям; це виправлення не є повним редизайном.

Перший self-review: фактичний diff звірено з інваріантом, зміна продукту звужена до двох CSS-властивостей. Другий self-review: незалежна перевірка складу кандидата та повернення старого CSS; guard ловить дефект без поломки workflow. Після приймання додаткові продуктові правки припинено.

## Кандидат і збереження оригіналів

Новий add-only пакет: `web_launch/dist-neon-webkit-20261009`, 97 файлів, 96 перевірених записів manifest. Від попереднього `dist-neon-mobile-final-20261007` відрізняються лише `real-journey.css` та `release.json`. Усі manifest hash/size перевірені перед/після браузерного проходу. Попередній пакет збережений. Кандидат **не опублікований**.

- Новий release SHA-256: `153b1ebabfd0f31fad812b146fdb7327930e4d6559f778ab586de903c0bf6488`.
- Новий CSS: `e21d4d4b91bdc551da292519f588a7af9d01569cd4623fa0cbe0217f1f0c3118`.
- Збережений старий CSS: `d5590b6e11236c279436825dd9f2f33cf3293843c11e08604498751ff94a1298`.
- Чужий dirty `web_launch/journey-ui.mjs`: `68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b`, незмінний, не включається в commit.

Receipts: `RELEASE.json`, окремі `RESULT.json` у названих каталогах. Відхилені CSS-проби й детальна діагностика збережені локально; вони не подані як green. Інструменти: `tools/mobile-webkit-acceptance-20261009.mjs` та `tools/mobile-webkit-release-20261009.mjs`. Повторне пакування не перезапише існуючий кандидат: EEXIST є навмисним захистом.

Офіційний Playwright WebKit runtime встановлено в ізольований `D:/SyneraQA/playwright-1.63.0` через наявний CLI 1.63.0; download WebKit — 59.8 MiB плюс малі helpers. Runtime реально запущений. Новий важкий Android SDK/емулятор на C: не встановлювався: під час перевірки там було 6.51 GiB вільного, нижче наявної межі 8 GiB. Старий USB/NTFS збій не доводить несправність усіх файлів D:; новий WebKit фактично пройшов тести.

## Новий Google Cloud QA

Створено **Synera QA 20261009**, ID `synera-qa-20261009`, number `32625214908`; успіх звірений у project picker і welcome screen. Старі проєкти збережені. Для нового проєкту API не активовано, reservations не створено, ключі/compute/БД не створювались.

Billing-сторінка нового проєкту не завантажується. Redirect до billing-account URL не доводить стан прив'язки; **billing UNKNOWN**. Я не натискала attach/change billing, але автоматичну прив'язку під час створення не можна виключити без readback. Через це активація й хмарне резервування зупинені до перевірки $0-умов. Приватні account IDs та Console/auth screenshots не входять до Git.

Старий MapTesting приймає read-only `device remote ... list`: `No reservations found`. Отже, ні вік проєкту, ні помилка UI не довели, що він зламаний. Нова Firebase Console також не змогла завантажити статус terms; Neon Console показала loader без підтвердженого плану/проєктів. Нові Firebase/Neon resources та terms acceptance не виконувались.

[Google описує Device Streaming](https://firebase.google.com/docs/test-lab/android/android-device-streaming) як доступ до фізичних Android. [Публічна квота Spark](https://firebase.google.com/docs/test-lab/usage-quotas-pricing) не замінює фактичний billing/залишок конкретного проєкту. Окремий QA потрібний для ізоляції середовища; новий проєкт для кожного розміру екрана не потрібний. [Firebase project model](https://firebase.google.com/docs/projects/learn-more).

## Що ще блокує запуск людей

| Gate | Актуальна межа |
|---|---|
| Фізичний Android / встановлення PWA | У попередньому проході Pixel 8 підключений і повернений; автоматичний запуск Chrome відхилений інструментом: `blocked by policy`, без точнішої причини. Не повторювався через новий проєкт, reservation, shell чи transport |
| iPhone / Safari / встановлення | Desktop WebKit додав реальний доказ рушія; фізичне iOS-приймання відкрите |
| Два живі акаунти → домовленість → чат → підтверджений результат | Fixture не є живими акаунтами. Потрібні справжній HTTP JWT, схема/RLS та двосторонній результат |
| Production / deployment | Точні Neon recovery/schema/readiness та Cloudflare rollout gates у `artifacts/product-status-20261004/ROLLOUT_REVIEW.uk.md` лишаються відкритими. Створення нового Google QA їх не закриває; загальний push не є deployment |
| Інтеграції / capacity | Google Maps SDK, живий voice AI, OAuth/social publishing, платежі та сотні користувачів за секунду не прийняті цим пакетом |

Наявні таблиця 27 систем / 15 етапів і попередній rollout review збережені. Цей checkpoint підвищує локальну браузерну сумісність; він не переводить часткові системи в готові.

**NEXT, 5 хв:** прочитати billing нового `synera-qa-20261009` у звичайному Chrome й підтвердити, чи є прив'язаний платіжний акаунт. Питання користувачеві вже надіслане; мовчання не є підтвердженням. Новий device launch до усунення попереднього policy blocker не починати.

Models used: none (provider calls=0, USD=$0.00).
