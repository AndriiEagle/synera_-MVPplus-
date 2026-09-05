# Synera: перенесення на безплатний Neon

NOW — приватний PWA-пілот опублікований: **https://synera-pilot.pages.dev**. Реальний OTP-вхід власника, збереження прихованого профілю та відновлення після перезавантаження перевірені. Supabase не є залежністю цього пакета.

Оновлення r5, 2026-09-05: виправлено неправильну назву cookie в адаптері, додано відновлення входу та оновлено мобільний дизайн. 71/71 тестів. Власник успішно ввів новий код; прихований профіль збережений і відновлений після перезавантаження. Див. [звіт про виправлення](LOGIN_FIX_2026-09-05.uk.md).

| Маршрут | Чому | Межа доказу |
| --- | --- | --- |
| A RECOMMENDED — Neon + Cloudflare Pages | Вже опубліковано за $0 на Free, без картки/апгрейду | SQL/RLS, HTTPS, реальний OTP-вхід і приватний профіль перевірені; фізичний телефон ще потребує приймання |
| B FALLBACK — Appwrite Cloud Free | Готові auth, email OTP, база, functions і hosting в одному сервісі | Потрібен інший адаптер даних і повторна перевірка доступу; його не реалізовано паралельно |

## Що реально є

Власник увійшов і створив Neon-проєкт **synera**. Перевірено через його dashboard 2026-09-05:

- Project: `quiet-credit-94155104`; branch: `br-dawn-field-axoxc3c4` (`production`).
- Organization: `org-dry-mud-32460338`.
- Region: **AWS US East 2 (Ohio), США**, PostgreSQL 18. Не Frankfurt. Не змінювати регіон і не створювати дубль без потреби/погодження.
- Neon Auth і Data API увімкнено. Connection string і пароль БД не відкривали; runtime їх не використовує.
- Застосовано `neon/schema.proposal.sql`: 106 SQL statements до COMMIT. 8 таблиць із RLS. `neon/acceptance.sql`: 39 statements до ROLLBACK, результат PASS для згоди, приватності, власності запрошень, повідомлень, блокування, видалення й лімітів.
- Після ROLLBACK перевірено нулі: auth users, profiles, meetings, consents, members і counters. Потім додано тільки погодженого першого учасника до приватного списку.
- Живий контракт Neon: `neon_auth.user.id` має тип **uuid**. `public.synera_user_id()` — SECURITY INVOKER із SQL-standard body `return auth.uid()`. Це виклик незміненої функції провайдера; обхід RLS і підвищення прав відсутні. Звичайний GRANT USAGE на провайдерську `auth` від owner виявився no-op; сумісний виклик реально перевірено перед міграцією.
- Cloudflare account `37d2df88cd4557b3c81da2a7002bba1e`, Pages project `synera-pilot`. Поточний Workers plan Free/$0 перевірено у dashboard. Fail closed увімкнено. Створено один проєкт, без Git push, встановлень, картки чи апгрейду.
- Trusted domain: тільки `https://synera-pilot.pages.dev`; localhost вимкнено; перевірку email кодом увімкнено; зайвий Google OAuth provider прибрано. Shared mail provider: для приватного тестування.
- HTTPS `/` і `/config.json` = 200; health через Worker до Neon = 200; порожня session = 200; profiles без сесії = 401; `_worker.js` і `release.json` = 404. Відповіді no-store.
- Виправлено браузерний виклик native fetch в обох адаптерах; **71/71 локальних тестів PASS**. На живому сайті форма показує «Пілот для реальних учасників», email і кнопку надсилання коду. [Receipt](../artifacts/neon-validation.json).
- Опублікований ZIP r5: `../synera-neon-pilot-20260905-r5.zip`, 23 файли. SHA256 `A94E60E8C75D8093348E454E9BD8905DFAC90C32D5F10BA1D1F55190CFF24AFE`. Попередні ZIP збережено.
- Особистий вхід ще не пройдено: власнику відкрито форму правил; його відповідь містила текст SQL замість підтвердження входу. Не записувати прийняття правил, вік чи підтвердження email за нього. SQL-тестові згоди відкочено.

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
5. `neon/schema.proposal.sql` генерується з існуючих SQL-джерел, зберігає UUID та використовує вузький виклик штатної `auth.uid()`. Збережено RLS/column grants/блокування/ліміти. Додано приватний список запрошених і перевірку підтвердженого email **у самій БД**. Застосовано до цього проєкту; повторно не запускати.
6. `neon/acceptance.sql` — транзакційні фікстури з ROLLBACK; фактично виконано з PASS. Коментарі NOT RUN у відтворюваному шаблоні не є live-статусом: фактичний результат наведено в receipt. Функції провайдера не замінювали.
7. `web_launch/dist-neon` — 23 файли, включно з `_worker.js` та `_routes.json`. SQL, тести, паролі, локальний AI й старі демоботи не потрапляють у роздачу. Worker генерує `/config.json` із серверних flags; початково все закрито.

Це пакет для **Cloudflare Pages Advanced mode**, не довільний static host. `_worker.js` офіційно підтримує dashboard upload. [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [Advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/).

## Погоджений обсяг зовнішнього запуску

2026-09-05 власник явно погодив застосування схеми до Neon synera в Ohio та публікацію приватного пілота через Cloudflare Free за $0, без картки й апгрейдів. Повторної згоди на ці кроки не потрібно.

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

Додаткова перевірка 2026-09-05: фактичний Cloudflare account має Workers Free та 10k neurons/day. Кандидат — `@cf/google/gemma-4-26b-a4b-it`: прямо вказаний серед моделей, доступних на Free, в офіційній зміні вище. [Контракт моделі](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/) має `max_completion_tokens`, `reasoning_effort`, `response_format` і usage; базова тарифна ціна $0.10/$0.30 за мільйон input/output tokens не є поточними витратами цього пілота. `gemma-3-12b-it` відхилено як deprecated. Жодної AI binding, нового AI endpoint, AI SQL migration або модельного виклику не створено: це перевірений напрям наступної реалізації, не активована функція.

PARKED — Appwrite-перенесення, Google/GitHub-вхід у саму апку, магазини, APK/IPA, платежі, боти й платний background AI.

NEXT (5–15 хв) — імпортувати власні дані у збережений прихований профіль на https://synera-pilot.pages.dev та перевірити їх перед публікацією. Повний пілот не оголошувати готовим до приймання AI, другого учасника та телефона.
