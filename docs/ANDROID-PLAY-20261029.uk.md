# Synera у Google Play: пакет Android TWA — 29.10.2026

**Файли для майбутньої збірки готові. AAB, встановлений Android-застосунок і
публікація в Google Play ще не створені.** Перший магазинний маршрут — TWA навколо
стабільної HTTPS PWA; це етап до твоєї мети нативних Android та iPhone застосунків.
Capacitor лишається запасним варіантом при підтвердженій несумісності TWA.

У [android/](../android/) є конфігурація Bubblewrap з запропонованим package ID
`ch.synera.app`, чинними кольорами PWA й існуючою 512px maskable-іконкою,
шаблон Digital Asset Links, тексти Google Play німецькою, англійською й українською,
чернетки Data safety/content rating та [покрокова збірка](../android/BUILD.md).
Зміни вебсайту передані як [окремий точний патч](../android/WEB-CHANGES.md).

Локальний критерій: `node --test android/*.test.mjs`; фактичний результат і межі
зафіксовані у [DONE.md](../android/DONE.md). Тест перевіряє формат шаблону, файли PNG
та обмеження текстів 30/80/4000. Джерела і хеші — [SOURCES.json](../android/SOURCES.json).

На Sol є Node 24.16.0 / npm 11.13.0. JDK, Android SDK і Bubblewrap не знайдені у
PATH та перевірених стандартних каталогах; нічого не встановлювалось.

## Що потрібно зробити тобі — у цьому порядку

1. **Затвердити видавця і постійний домен застосунку.** Обрати реальний personal
   або organization account, підтвердити права на назву й package ID. Домен має
   вести на робочу HTTPS PWA зі справжнім входом і профілями, не лише презентацію.
   `SYNERA_HOST` у пакеті — навмисний placeholder; тимчасовий preview не підходить.
2. **Створити або підтвердити Google Play developer account.** Ідентифікацію,
   контактні дані, можливий D-U-N-S для організації й device verification
   проходиш ти. За офіційною довідкою реєстрація коштує **US$25 одноразово**;
   фінальну суму/валюту звір у власному signup перед оплатою.
   [Google Play enrollment](https://support.google.com/googleplay/android-developer/answer/6112435).
3. **Затвердити публічні privacy URL, deletion URL і support contact.** Policy має
   описувати реального відповідального, дані, видимість профілів, процесорів,
   міжнародну обробку, строки зберігання і права. Для app із реєстрацією потрібні
   перевірені in-app та зовнішній маршрути запиту видалення; запис у чернетці не
   доводить, що видалення працює.
   [Google account deletion](https://support.google.com/googleplay/android-developer/answer/13327111).
4. **Дозволити окремий етап інсталяції та збірки.** Потрібні JDK 17, Android SDK
   API 36 і Bubblewrap. Команди підготовлені у BUILD.md; виконання не відбулося.
   Узгодити приватне зберігання upload keystore/паролів і backup; не надсилати їх
   у чат. Після збірки отримаємо signed `app-release-bundle.aab`.
5. **Налаштувати Play App Signing і дозволити internal test upload.** Надати
   власнику сайту SHA-256 саме Play app-signing certificate. Він опублікує
   `/.well-known/assetlinks.json` після окремого схвалення зміни сайту.
   Upload key і Play app-signing key можуть відрізнятися. Запуск має бути
   перевірений на збірці, встановленій через Play.
6. **Затвердити тексти, справжні screenshots і декларації.** Listing тексти взяті
   з наданих чернеток; німецький locale `de-CH`, англійський `en-US`, український
   `uk`. Перед поданням звірити можливості з реальною збіркою. Data safety і
   content rating ще потребують перевірки потоків даних, UGC, скарг/блокування,
   дозволів, review access та отриманого рейтингу IARC.
7. **Зібрати тестерів і пройти тестування.** Почати з internal testing та реального
   Android: launch/reopen/login/Back, форми/клавіатура, мови, мережа, зовнішня
   навігація, privacy/deletion, повноекранний TWA після DAL. Для personal accounts
   після 13.11.2023 чинна вимога — **closed test, мінімум 12 тестерів безперервно
   opted-in 14 днів**, далі заявка на production access. Internal track не
   зараховується замість цього. Вимогу твого акаунта перевірити у Console.
   [Правила тестування](https://support.google.com/googleplay/android-developer/answer/14151465).
8. **Окремо затвердити країни та production submission/publication.** Час рев'ю і
   схвалення не гарантовані. На сайті показувати store badge лише після появи
   справжнього доступного listing. Пілот за чернеткою тимчасово безплатний;
   майбутні платежі потребують окремого продуктового й store-рішення.

## Що з iPhone

Зараз можна встановлювати PWA з Safari через «Поділитись → На екран Додому»;
потрібна перевірка на фізичному iPhone. Це не застосунок в App Store. Для пізнішої
iOS-оболонки/нативної версії потрібні **Mac і Xcode**, Apple Developer signing,
TestFlight та окрема App Store перевірка. Проста вебоболонка може не пройти
[Apple minimum functionality](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality).

**Наступний крок на 10–15 хв:** визначити стабільний app-домен, юридичного видавця
і чи вже є Google Play developer account. Після цього можна точно запланувати
окремо погоджений етап інсталяції та першої збірки.
