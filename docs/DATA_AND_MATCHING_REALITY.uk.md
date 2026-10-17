# Дані та matching: фактичні межі

## Висновок

`web_launch` містить клієнт продукту та окремі статичні демонстраційні режими. Наявний живий пілот `synera-pilot.pages.dev` повідомляє backend Neon; перевірені раніше health/session відповіді не доводять фактичний обсяг профілів, backups або повне приймання. Новий публічний Site не підключений до цієї бази. `declared-fit.mjs` працює тільки з двома вже переданими opt-in об'єктами; у Studio вони вигадані. Модуль нічого не записує, не шукає кандидатів, не надсилає запитів і не замінює baseline matcher.

## Що саме порівнюється

| Шар | Поточне джерело | Фактична поведінка |
| --- | --- | --- |
| Baseline business matching | `web_launch/matching.mjs:35-55,231-273` | Детермінований локальний matcher: нормалізує лише tag-и offers/needs, мови, режими, час доступності, географію та confidentiality; має consent, актуальність, logistics і mode gates. |
| Профіль для baseline у web app | `web_launch/profile-brief.mjs:61-77` | `brief.offer_tags` і `need_tags` мапляться у baseline; `is_discoverable` є consent для іншого профілю. |
| Нове пояснення declared fit | `web_launch/declared-fit.mjs` | Лише самодекларовані `gives`/`needs` в обох напрямках, language/mode/time, а також communication/work тільки якщо їх **окремо** ввімкнули обидві сторони. Результат кожного виміру: `matched`, `unknown` або `mismatch`; score/ranking відсутні. |

`declared-fit.mjs` не робить висновків про характер, психічний стан, емоції, медичні факти, правдивість заяв, «хімію» чи ймовірність успіху. Це пояснення перетину декларацій, а не діагноз або рекомендація для кліків.

## Opt-in і видимість

Для declared fit потрібні **дві незалежні** ознаки на кожному об'єкті:

- `fitConsent: true` — дозвіл на саме порівняння.
- `publicVisibility: true` — кандидат дозволений у публічному demo-наборі.

Відкликаний `fitConsent` повертає `ineligible/FIT_CONSENT_REQUIRED` без traits. `fitConsent: true` разом із `publicVisibility: false` повертає `excluded/CANDIDATE_NOT_PUBLIC` без traits. Отже приватний дозвіл на fit не робить профіль видимим. Тести: `web_launch/declared-fit.test.mjs:34-47`.

Опційні `communication` і `work` мають форму `{ enabled: true, values: [...] }`. Якщо хоча б одна сторона не увімкнула категорію або не подала значень, повертається `unknown` з порожнім `shared`; значення другої сторони не виходить у результат. Невідоме не трактується як несумісне.

## Де дані описані у коді

### Новий static demo

`web_launch/declared-fit.mjs` не має імпортів storage/network, не читає browser storage та приймає об'єкти аргументами. Фіктивні профілі, які його викликають, мають залишатися в UI/demo-модулі; вони не є записами користувачів. Наявний `DemoStore` тримає `DEMO_PROFILES` у пам'яті екземпляра (`web_launch/data.mjs:5-62`), а discovery віддає лише `is_discoverable` (`web_launch/data.mjs:48-57`).

PWA cache призначений тільки для public shell assets: коментар і перелік у `web_launch/sw.mjs:1-23`; API, tokens, profiles, map tiles та imports там явно виключені. Це не є архівом профілів і не доводить відсутність browser cache поза цим service worker.

### Поточний web-launch contract

`ProfileStore` формує REST-запити до `profiles`, `meeting_requests`, `meeting_messages`, `profile_blocks`, `profile_reports`, `pilot_consents`, `match_cases` і `match_case_approvals` (`web_launch/profile-store.mjs:74-266`). `discover()` запитує лише `is_discoverable=true` (`web_launch/profile-store.mjs:102-105`). `SupabaseStore` зберігає refresh token у `localStorage` тільки коли користувач явно обирає remember (`web_launch/online-store.mjs:16-55`); його коментар прямо каже, що сесія інакше в пам'яті. `NeonStore` використовує same-origin cookie/session і не пише JS-readable token (`web_launch/neon-store.mjs:3-24`).

Ці класи є кодовими контрактами, не доказом, що Supabase або Neon зараз налаштовані чи приймають дані. `web_launch/config.mjs:4-53` допускає обидва backend-и, а `web_launch/server.mjs:1-43` запускає локальний static server та local AI endpoint лише з `--local-ai`.

### Оригінальний crystallised_in

Це окремий Flutter/Firebase артефакт, не backend static demo. Він має Firebase collection `users` (`crystallised_in/lib/backend/schema/users_record.dart:100-117`) з email, display name, photo URL, phone, location/exchanges refs та `about_me` (`:13-91,147-163`). Firestore rules дозволяють широкі reads для `users`, locations, exchanges, photos і diaries (`crystallised_in/firebase/firestore.rules:4-57`); це кодово наявна політика, а не перевірка розгорнутого проєкту. Custom function збирає diaries усіх users (`crystallised_in/firebase/custom_cloud_functions/cloud_function_diarie_a_imatch.js:35-133`).

`extract_give_values.dart` і `extract_take_values.dart` розбирають JSON `values.give`/`values.take` (`crystallised_in/lib/custom_code/actions/extract_give_values.dart:18-29`, `extract_take_values.dart:18-29`). Вони підтверджують лише парсинг тегоподібних values у старому артефакті; немає зв'язку з новим declared-fit API.

## Межі доказу

## Нова Studio 04: власні сесії та точний архів

`studio.mjs` тримає поточну сесію в пам’яті вкладки. Лише кнопка «Зберегти поточну сесію» разом з окремою позначкою дозволу пише копію в IndexedDB `synera-studio-v1`, store `sessions`. Автозбереження вимкнене; копії не синхронізуються між телефонами й можуть бути стерті браузером. Це не зашифроване сховище. Користувач може експортувати файл, відкрити власну копію або видалити її з пристрою.

`session-value.mjs` зберігає точний текст, source IDs, час, історію результатів та явні підтвердження поточної версії. Імена на одному пристрої не є автентифікованими особами. Пошук цитат працює в поточному валідованому архіві, без міжсесійного психологічного профілювання.

`archive-codec.mjs` упаковує UTF-8 JSON і, за вибором, стискає GZIP. SHA-256 перевіряє цілісність вихідних байтів після розпакування; особу автора й правдивість фактів не доводить. GZIP не шифрує дані. UI показує розмір оригіналу, payload та повного файлу: gzip/base64/метадані можуть збільшити маленький файл. Тест перевіряє точне повернення багатомовного тексту та відмову при пошкодженні/надмірному розпакуванні. Оригінали не конвертуються в іншу мову. Немає виміряної економії API-токенів чи підписки.

`studio-sw.mjs` кешує лише дозволені публічні файли оболонки, scope `/studio`; API/config/профілі й файли імпорту до цього кешу не входять. Окрема manifest відкриває `/studio.html`, не маркетинговий root. Фізичне встановлення Android ще не підтверджено.

## Що залишається відкритим

- Немає коду або тесту тут, що доводить live Supabase/Neon/Firebase deployment, фактичне місце зберігання чи retention реальних користувачів.
- Є локальний переносний архів Studio з перевіркою цілісності; немає підтвердженого хмарного backup/restore реальних користувачів, lossless summarization або виміряного token savings.
- Baseline matcher лишився незмінним. Нове пояснення не обходить його hard gates і не може бути використане як дозвіл на introduction, message або meeting.
