# Android: чорний екран Chrome; хмарний шлях підготовлено

2026-10-08. Цей запис доповнює REOPEN.uk.md і замінює його рекомендацію продовжувати ручні кліки в нестабільному емуляторі.

## Факти

- Користувач повідомив: після натискання Chrome екран став чорним, Back не реагує. На наступній перевірці процесів emulator/QEMU немає, `adb devices -l` порожній.
- `reopen.stderr.txt`: 59 помилок glPixelStorei 0x501 і 43 помилки glReadPixels 0x506. Runtime вибрав Intel UHD Graphics 620 і ініціалізував Vulkan. Це підтримує графічну гіпотезу, але не доводить причину зависання або завершення процесу.
- Windows показала RADAR_PRE_LEAK_64 для QEMU о 17:24. Події Application Error 1000 за перевірене вікно немає. RADAR не є доказом crash; завершення через закриття вікна також не виключене.
- Перед цим повторився SystemUI ANR; свіжий UI dump після Wait завершився 137. Boot flag і попередній короткий basic-UI PASS не доводять стабільність.
- Поточні цифри, SHA-256 raw stdout/stderr і незміненої чужої journey-ui.mjs містить CHROME_FAILURE.json. Raw логи не додано до Git.
- Android-приймання Synera не виконано. Немає доказу Android PWA-install, живих акаунтів, iPhone/Safari або production. Наш тимчасовий demo-server session6435 зупинено після припинення локального тесту.

## Варіант локальної діагностики, не виконаний

Google радить `-feature -Vulkan` для Chrome, який неправильно відображається на деяких комп'ютерах. Один контрольний запуск мав би зберегти існуючий C AVD, host GPU, RAM і резерв місця та змінити лише доступність Vulkan. Це гіпотеза; автоматичний Chrome launch через ADB, раніше відхилений policy, не повторювався й не обходився. Нового boot після цього повідомлення не було.

Джерело: https://developer.android.com/studio/run/emulator-troubleshooting#cannot-open-webpage-correctly — секція Cannot open webpage correctly, перевірено 2026-10-08.

## Безплатний хмарний шлях

Користувач уточнив можливість безпечного безплатного хмарного тесту. Актуальні офіційні умови:

- Android Device Streaming на Firebase Spark: 30 хвилин на проєкт на місяць; фактичний залишок ще невідомий.
- Blaze: ті самі 30 включених хвилин, потім $0.15/хв. Цей тариф не входить у поточну межу $0.
- Spark не потребує платіжних даних для початку; перевищення безплатної квоти зупиняє відповідний продукт. Прив'язування Cloud Billing, зокрема для Google Maps API в тому самому проєкті, переводить проєкт у Blaze. Не знижувати тариф наявного production-проєкту; для тесту потрібен перевірений окремий Spark-контур.
- Google надає фізичні Android через ADB over SSL і очищує пристрій після сесії. Використовувати тестові дані, не входити в особисті акаунти на віддаленому телефоні.
- Офіційний Android CLI підтримує remote projects/models/create/connect/remove без повного Android Studio. Потрібні клієнт, Google auth і проєкт із дозволом streaming. Ці залежності зараз не прийняті як готові.
- Два виклики browser CUA завершилися timeout/kernel reset. Замість третього виклику використано open_in_codex для Firebase Console; повернув queued. Це не підтверджує видиму вкладку або виконаний login.
- Нічого не зарезервовано у хмарі, клієнт не встановлено, billing/production не змінені. Provider calls=0; USD=0.

Офіційні джерела, перевірено 2026-10-08:

1. https://firebase.google.com/docs/test-lab/usage-quotas-pricing#android-device-streaming-quotas — Android Device Streaming quotas.
2. https://firebase.google.com/docs/projects/billing/firebase-pricing-plans — Spark quota stop та auto-upgrade за Cloud Billing.
3. https://developer.android.com/studio/run/android-device-streaming — security, cleanup та Android CLI.
4. https://developer.android.com/tools/agents/android-cli/commands/device_remote — auth, project selection та reservation lifecycle.

## NEXT

Увійти в Firebase Console на комп'ютері; перевірити конкретний Spark-проєкт, доступ і залишок хвилин перед резервуванням. Потім підготувати один короткий сценарій на тестових даних, а після сесії повернути й очистити телефон. Хмарний Android не доводить iPhone або завершення всього продукту.
