# Android у хмарі: CLI авторизований, тест ще не виконаний

Дата: 2026-10-09. Доповнює `artifacts/android-emulator-20261008/CHROME_FAILURE.uk.md`.

## Прийнятий результат

- Firebase Console вже авторизована. Вибрано наявний MapTesting (`map-testing-ti7epp`); у Firebase підтверджено Spark, $0/місяць. Тариф не змінено.
- Офіційний портативний Android CLI 1.0.16500706 завантажено з Google. EXE: 3 176 088 байтів; SHA-256 `310DA5938016BEA43DD617806A4FAC16F97303A890F7586F392AC0F9A897A175`; Authenticode Valid, Google LLC. Перший запуск додатково розпакував ядро приблизно на 147 МіБ у `.android/cli`. Це не повний Android Studio.
- Клієнт використовує наявний C SDK через явний `--sdk`, без зміни PATH. Кожен виклик має `--no-metrics`; стандартне сховище облікових даних не вимикалось.
- Андрій окремо погодив OAuth-доступ Android CLI: openid/profile/email і cloud-platform у межах наявних Google Cloud прав. Процес `auth login` завершився кодом 0 та `Login successful`; окремий `auth status` підтвердив авторизацію.
- Браузер після OAuth показав помилку localhost callback. Це не означало невдалий вхід: завершення вже запущеного CLI й окремий status дали протилежний перевірений результат. Новий login і ручне повторення authorization code не виконувались.
- `device remote projects --all` прочитав доступні проєкти. Через кількість понад 10 CLI явно пропустив перевірку streaming readiness; заголовок списку не є її доказом.
- `device remote --project=map-testing-ti7epp models` завершився кодом 0 та прочитав каталог. Це доказ доступності каталогу, а не доступності сесії в MapTesting.

## Точний блокер

`device remote --project=map-testing-ti7epp list` завершився кодом 1:

> PERMISSION_DENIED: Device Streaming API has not been used in project map-testing-ti7epp before or it is disabled.

Google Cloud Console незалежно підтвердила: MapTesting, Device Streaming API, кнопка «Aktivieren». Активацію не натиснуто. Немає створеної нами reservation або використаних нами device minutes. Фактичний залишок квоти невідомий.

## Безплатність: уточнення попередньої рекомендації

Офіційна сторінка Firebase описує 30 безплатних хвилин на проєкт на місяць для Spark. Сторінка Android Studio також описує Spark та пропонує Android CLI. Проте актуальний quickstart нового Developer Device Platform / Device Streaming API вимагає ввімкненого Cloud Billing і позначений Preview.

Ці джерела не доводять, що саме встановлений CLI з новим API працюватиме без billing у MapTesting. Попередню рекомендацію «CLI без повного Studio» слід розуміти як підтверджену можливість клієнта, а не прийнятий $0 хмарний тест.

Дозвіл на CLI OAuth не означає дозвіл змінити тариф або прив'язати платіжний акаунт. Наступна конкретна дія для погодження: увімкнути лише `devicestreaming.googleapis.com` у MapTesting, залишивши Spark і billing незмінними. Якщо Google вимагатиме платіжні дані, тариф або додаткові непогоджені умови/доступи, зупинити залежний крок. Потім прочитати квоту та перевірити $0 перед будь-яким резервуванням. Не активувати всі API з прикладу quickstart автоматично.

## Межі доказу

| Перевірка | Стан |
|---|---|
| Firebase login / MapTesting Spark | Підтверджено в UI |
| Походження, підпис і запуск CLI | Підтверджено локально |
| Android CLI OAuth | Підтверджено завершенням процесу та окремим status |
| Каталог моделей | Прочитано; не є reservation |
| Device Streaming API в MapTesting | Вимкнений / не використовувався; активація очікує погодження |
| Залишок streaming minutes | Невідомий |
| Synera на хмарному Android | Не запускалась |
| Android PWA install та повний користувацький цикл | Не прийняті |
| iPhone/Safari, два живі акаунти, production | Цей прохід їх не перевіряв |

Остання перевірка C: 3 309 076 480 вільних байтів. Локальний емулятор не запускався; його резерв 8 GiB не послаблено. Нових SDK/image пакетів не встановлено. Приватні OAuth дані, email, скриншоти акаунта та облікові дані до Git не входять. Чужий `web_launch/journey-ui.mjs` має незмінений SHA-256 `68D8498139426050E54CD85C3347092701BAC990CCBD9FB31205A5878BD4D33B`.

## Джерела й перевірки

- [Android CLI](https://developer.android.com/tools/agents/android-cli) та [офіційне завантаження](https://developer.android.com/tools/agents/android-cli/download): джерело клієнта; локальний підпис, hash, `--version`, help.
- [Remote commands](https://developer.android.com/tools/agents/android-cli/commands/device_remote), Usage / Typical workflow: порівняно з help та фактичними projects/list/models.
- [Firebase quotas](https://firebase.google.com/docs/test-lab/usage-quotas-pricing#android-device-streaming-quotas), Android Device Streaming quotas: умови Spark/Blaze; не фактичний залишок.
- [Android Studio streaming](https://developer.android.com/studio/run/android-device-streaming), Get started / Android CLI / End your session: Spark та порядок повернення пристрою.
- [DDP quickstart](https://docs.cloud.google.com/developer-device-platform/quickstart), Google Cloud configuration, кроки 6–7: billing та API prerequisites.
- [Device Streaming API у MapTesting](https://console.cloud.google.com/apis/library/devicestreaming.googleapis.com?project=map-testing-ti7epp): перевірено кнопку активації, тарифи та повідомлення про умови використання.

## NEXT

Погодити лише активацію Device Streaming API у MapTesting без billing. Після неї перевірити доступ і залишок хвилин; до підтвердження $0 телефон не резервувати. Якщо потрібен billing, запропонувати Firebase/Studio шлях або фізичний Android як окремий крок.

Models used: none (provider calls=0, USD=$0.00).
