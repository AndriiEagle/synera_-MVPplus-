# Synera: перенесення на безплатний Neon

NOW — підготувати реальний приватний PWA-пілот на Neon Free + Cloudflare Pages Free. Supabase не є залежністю цього пакета.

| Маршрут | Чому | Межа доказу |
| --- | --- | --- |
| A RECOMMENDED — Neon + Cloudflare Pages | Зберігає PostgreSQL, PostgREST, правила доступу й увесь поточний інтерфейс | Новий адаптер та пакет перевіряються локально; живий Auth/SQL/телефон ще мають пройти приймання |
| B FALLBACK — Appwrite Cloud Free | Готові auth, email OTP, база, functions і hosting в одному сервісі | Потрібен інший адаптер даних і повторна перевірка доступу; його не реалізовано паралельно |

## Що реально є

Власник увійшов і створив Neon-проєкт **synera**. Перевірено через його dashboard 2026-09-05:

- Project: `quiet-credit-94155104`; branch: `br-dawn-field-axoxc3c4` (`production`).
- Organization: `org-dry-mud-32460338`.
- Region: **AWS US East 2 (Ohio), США**, PostgreSQL 18. Не Frankfurt. Не змінювати регіон і не створювати дубль без потреби/погодження.
- Auth показує **Enable Neon Auth**: ще не увімкнений. Не відкривали connection string і не витягували паролів.
- Нову SQL-схему не застосовано. Cloudflare-проєкт не створено, сайт не опубліковано.
- Read-only SQL фактично виконався: `database_name=neondb`, `public_tables=0`, `auth_enabled=false`.
- Локальне приймання: **66/66 PASS**, мобільна ширина 390 px без горизонтального прокручування; це не доказ живого OTP/RLS або фізичного телефона. [Receipt](../artifacts/neon-validation.json).
- Готовий ZIP: `../synera-neon-pilot-20260905.zip` від кореня репозиторію, 23 файли, 68 068 bytes. SHA256 `7EAF0A95BC5B09293ADB973A68A6EB8E2A1409809CE6058A846494E5867C4A30`.

## Безплатні межі: первинні джерела, перевірено 2026-09-05

| Сервіс | Безплатно | Що врахувати |
| --- | --- | --- |
| [Neon pricing](https://neon.com/pricing) | $0, без картки; 0.5 GB і 100 CU-hours на проєкт/місяць; до 60k Auth MAU | Ліміт і сон після бездіяльності; Auth/Data API у beta; тариф сам по собі не доводить доступність конкретного акаунта |
| [Neon Email OTP](https://neon.com/docs/auth/guides/plugins/email-otp) | Коди для входу, без пароля у Synera | Спільна пошта для тестування, із rate limits. Реальну доставку перевірити; для ширшого запуску потрібен власний SMTP |
| [Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/) | Free hosting; достатньо для нашого малого пакета | Динамічні запити споживають ліміт Workers Free. Усі маршрути пакета проходять через Worker |
| [Appwrite Free](https://appwrite.io/pricing) | 2 проєкти; 1 база/2 functions на проєкт; 75k MAU, 2 GB storage, 5 GB bandwidth | Пауза після тижня бездіяльності. Free не дає власний SMTP; це запасний шлях, а не вже створений акаунт |

Увійти оператору в Neon через Google/GitHub та додати Google/GitHub-вхід у саму Synera — різні налаштування. Перший уже виконано. Для другого потрібні OAuth app credentials; спільні Google credentials Neon призначені для тестів. [Офіційна OAuth-інструкція](https://neon.com/docs/auth/guides/setup-oauth).

## Реалізація

1. `web_launch/profile-store.mjs` — один спільний контракт профілів/домовленостей. Supabase й Neon використовують ті самі перевірки, проєкції, експорт та запити.
2. `web_launch/neon-store.mjs` — запити тільки до власного домену. Email → код із листа → правила → власний профіль.
3. `neon/worker.mjs` — вузький проксі на Cloudflare. Neon перевіряє OTP і сесію; браузер отримує тільки HttpOnly cookie. JWT з `Set-Auth-Jwt` передається Data API на сервері. Немає самописних паролів або ключа власника БД у runtime.
4. Відкрито тільки конкретні Auth-дії та 6 таблиць. Немає довільного проксі/RPC/SQL. Є Origin/Host-перевірки, межа body 4096 байтів, точний список запрошених email, заборона редиректів провайдера і автоматичних повторів.
5. `neon/schema.proposal.sql` генерується з існуючих SQL-джерел. Identity стає text, auth.uid замінюється auth.user_id, збережено RLS/column grants/блокування/ліміти. Додано приватний список запрошених і перевірку підтвердженого email **у самій БД**. Обхід браузера не повинен надавати доступ.
6. `neon/acceptance.sql` — транзакційні фікстури з ROLLBACK; перевіряє стороннього/незапрошеного користувача та попередні межі. **Не запускали.** Якщо JWT context або структура Neon Auth відрізняється, тест зупиняється; не замінювати функції провайдера, щоб отримати PASS.
7. `web_launch/dist-neon` — 23 файли, включно з `_worker.js` та `_routes.json`. SQL, тести, паролі, локальний AI й старі демоботи не потрапляють у роздачу. Worker генерує `/config.json` із серверних flags; початково все закрито.

Це пакет для **Cloudflare Pages Advanced mode**, не довільний static host. `_worker.js` офіційно підтримує dashboard upload. [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [Advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/).

## Конкретний обсяг зовнішнього запуску для погодження

Твої AGENTS.md вимагають точної згоди на production/configuration, публікацію, секрети та зовнішні повідомлення. Локальні файли підготовлено до цього кроку.

- Використати тільки створений **synera / quiet-credit-94155104**, Free, Ohio.
- Увімкнути Neon Auth і Data API; увімкнути email OTP/verification, exact trusted domain; вимкнути зайві sign-in providers і localhost після перевірки.
- Застосувати **тільки** `neon/schema.proposal.sql` до перевіреної порожньої БД; виконати `neon/acceptance.sql` з ROLLBACK, перевірити залишки й права.
- Додати тільки `andriipokrovskyi@gmail.com` як першого учасника, перевірити його реальний лист за явною дією у формі. Для Гілберта потрібен його дозволений email; не вигадувати адресу і не давати доступ до адмінки.
- Створити один **Cloudflare Pages Free** проєкт для поточного 23-файлового пакета; без картки/апгрейду. Public URL перевірити після створення, не вгадувати зайнятий slug.
- Налаштувати наведені нижче runtime variables, exact trusted HTTPS origin, опублікувати спочатку закритий пакет, потім відкрити тільки перевірений приватний пілот.
- Без пуша репозиторію, оплати, видалення Supabase, встановлення пакетів, зовнішніх повідомлень Гілберту або платних AI-викликів. Не переносити паролі/ключі чи legacy Firebase-дані.

## Runtime variables Cloudflare — значення беруться з живих сторінок

| Назва | Значення/призначення |
| --- | --- |
| `SYNERA_NEON_AUTH_URL` | Публічний Auth URL саме branch production, закінчується `/neondb/auth` |
| `SYNERA_NEON_DATA_URL` | Публічний Data API URL того самого branch/db, закінчується `/neondb/rest/v1` |
| `SYNERA_SITE_URL` | Один фактичний HTTPS origin, без шляхів/query |
| `SYNERA_PILOT_EMAILS` | Приватний список дозволених email через кому, максимум 10; не комітити, не логувати |
| `SYNERA_PILOT_READY` | `false` до SQL/RLS та конфігураційної перевірки; потім `true` для Auth-приймання |
| `SYNERA_REGISTRATION_ENABLED` | `false` до відкриття приватного тесту; потім `true` тільки для запрошених |

Той самий список учасників треба внести як owner в `public.synera_pilot_members`. Він приватний; API має тільки boolean membership-функцію. Neon може дозволяти створення auth-акаунтів напряму: це **не** дає доступу до Synera без підтвердженого email і запису в серверному списку. Не видавати UI flag за серверну заборону реєстрації.

## Вікно до 10 годин — оцінка, не гарантія

Доступ → Auth/SQL → закрите HTTPS → лист і власний профіль → друга людина/зустріч → Android/iPhone.

| Робота | Орієнтир активного часу після доступу й погодження |
| --- | --- |
| Auth/Data API, схема, SQL-перевірки | 1–2 години |
| Pages, cookies, trusted domain, реальний лист | 1–2 години |
| Два акаунти: профіль/запрошення/повідомлення/ізоляція | 1–2 години |
| Телефони, встановлення PWA, повторний вхід та виправлення | 1–2 години |

Бюджет часу не включає очікування входу, доставки листів, відновлення провайдера чи погодження зовнішніх дій. Це не запланований фоновий запуск Codex.

## AI лишається обов'язковим, але не маскується під готовий

Працюючий локальний AI та імпорт перевіреної відповіді власного ChatGPT збережено. **Автоматичний AI на публічному телефонному сайті ще не розгорнуто.** Заміна БД сама його не створює.

У [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/platform/pricing/) є 10k безплатних neurons/day. Це кандидат для окремого малого AI-запиту після входу, а не вже перевірена інтеграція. Потрібні точний дозволений Free model, перевірка Free account/hard stop, дозвіл користувача, server-side ліміт, receipt без тексту профілю й фактичний тест. Деякі моделі вже вимагають Paid plan — [офіційна зміна](https://developers.cloudflare.com/changelog/post/2026-07-28-models-require-workers-paid/). Немає автоматичного платного fallback або обіцянки, що всі AI-виклики будуть безлімітними.

PARKED — Appwrite-перенесення, Google/GitHub-вхід у саму апку, магазини, APK/IPA, платежі, боти й платний background AI.

NEXT (10–20 хв) — погоджений запуск налаштувань Auth/Data API у вже створеному Neon-проєкті; потім виконання SQL acceptance. Повний пілот не оголошувати готовим до реальної перевірки пошти, БД, AI та телефона.
