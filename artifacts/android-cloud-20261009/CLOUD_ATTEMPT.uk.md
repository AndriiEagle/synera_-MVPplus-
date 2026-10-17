# Android: хмарний пристрій працює, запуск Chrome блокує policy

2026-10-09, Europe/Zurich. Checkout `C:/Users/Andrii/Desktop/synera-premium-pwa-variant`, гілка `codex/synera-product-20261002`, вихідний commit `36305e8`.

## Прийняті факти

| Крок | Перевірений результат | Межа |
|---|---|---|
| Активація API користувачем | Google Cloud показує Device Streaming API → Aktiviert | Це не запуск застосунку |
| Платіжний стан | MapTesting → Abrechnung: немає прив'язаного billing account | Новий акаунт/картка/billing не створювались |
| Квота перед резервуванням | Monthly minutes ... without a billing account: 30, usage 0 | Точний використаний час після сесії окремий показник, не оцінка за таймером |
| Один remote device | CLI створив один Pixel 8, shiba/34; стан ACTIVE, успішний ADB over SSL connection | Це один фізичний пристрій, не матриця Android/iPhone |
| Ідентичність і зображення | `adb devices -l` — один remote device; `getprop ro.product.model` — Pixel 8; official CLI screenshot успішний | На знімку домашній екран Android, не Synera |
| Локальний пакет | `dist-neon-mobile-final-20261007/get.html` віддав HTTP 200; підготовлений runner пройшов `node --check` | Браузерний runner не запускався |
| Повернення телефона | disconnect exit 0; remove exit 0: Reservation cancelled successfully; повторно No reservations found та порожній adb devices | Невикористані хвилини не витрачаються активною reservation |
| Прибирання процесу | Завершено лише власний Python http.server на localhost:4188, після звірки PID і CommandLine | Інші процеси/бази/файли не чіпались |

Цей прохід уточнює попередню невизначеність щодо billing: реальна MapTesting Console показала окрему квоту для проєктів без billing і дала створити/підключити телефон без платіжного акаунта. Загальний DDP quickstart не був використаний як дозвіл активувати billing.

## Конкретне блокування

Одна команда для нового хмарного пристрою мала встановити localhost reverse і відкрити Chrome на `http://localhost:4188/get.html`. Інструмент відхилив створення процесу: **blocked by policy**. Точнішої причини не повернув. Немає доказу, що reverse або Chrome launch виконались; немає запуску runner, сторінок Synera чи встановлення PWA.

Після цього не використовувались `android run`, tap/input, інший shell або transport для обходу відхиленого Chrome launch. Нові reservation не створювались. Одразу виконано підтримувані disconnect/remove і перевірено їх результат.

Після повернення виконано один refresh квот. Google Cloud Console показала «Fehler beim Laden»; фінальний використаний час і залишок не прочитані. Початкові 0 хвилин не підставлено як фінальний лічильник. Закриття ресурсу доведено окремими CLI readback, а не цією помилкою UI.

Отже, робоча інфраструктура та домашній екран фізичного Android прийняті. **Android Chrome, дизайн Synera на ньому, встановлення PWA та повний цикл залишаються NOT_RUN.** Цей результат не змінює відкриті gates iPhone/Safari, підписаного HTTP JWT, двох живих акаунтів, Google Maps SDK, voice AI або production rollout.

## Підготовлені матеріали

- `tools/android-cloud-acceptance.mjs` — вузька адаптація вже підготовленого `tools/android-chrome-acceptance.mjs`: окрема директорія proof і коректний опис scope. Локальні fixtures із двома тестовими користувачами збережені. Перевірено лише синтаксис; **runner NOT_RUN**.
- `device/cloud-home.png` — реальний screenshot офіційного Google CLI; жодної згенерованої сцени. Порівняно SHA-256 копії з оригіналом.
- Приватні screenshots Google Console та auth залишені в локальному temp і не входять до Git. OAuth code, токени, email, cookies та raw daemon logs не копіювались у звіт.
- Не запускались платні моделі, платежі, production SQL, deployment або push. C/D offload та налаштування Windows не змінювались. Чужий `journey-ui.mjs` зберіг hash `68D8498139426050E54CD85C3347092701BAC990CCBD9FB31205A5878BD4D33B`.

## NEXT

Один ручний старт Chrome на власному фізичному Android і відкриття Synera, після чого окремо прийняти встановлення й користувацький цикл. Повторного OAuth-дозволу не потрібно. Новий хмарний запуск до усунення фактичного блокера Chrome не починати; ручна дія має бути доступною користувачеві, а не прихованою за background CLI.

Models used: none (provider calls=0, USD=$0.00).
