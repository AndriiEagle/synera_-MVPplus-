# Актуальний шлях Android-перевірки Synera

2026-10-08, Europe/Zurich. Цей звіт доповнює попередній REPORT.uk.md; попередні відмови збережені як історичні докази.

## Фактичний результат

- C: перед новим проходом мав 10 805 903 360 байтів вільно (приблизно 10,1 GiB). Повна Studio на C не встановлювалась повторно.
- D:/SyneraAndroid/studio.zip та tools.zip заново повністю прочитані та звірені з раніше прийнятими офіційними SHA-256: обидва збігаються. Доказ ARCHIVE_RECHECK.json, 44,75 секунди. Повторного download/extraction не було.
- Розпаковані studio64.exe та JBR java.exe окремо збігаються з відповідними ZIP entries. STUDIO_EXTRACT_RECHECK.json. Це перевірка цих двох файлів, не всього дерева Studio/SDK.
- Windows Get-Volume позначає D Healthy/OK, але журнал за останні 24 години містить disk153 (повтор I/O) о 19:42 та 20:26 7 жовтня. Успішне читання ZIP не приймає цей USB-диск для активного writable AVD; попередній STORAGE_HOLD лишається для D runtime.
- Запущено наявний C AVD у видимому вікні з `-gpu host`, без snapshots/file-backed RAM cache. У runtime вибрано Intel UHD Graphics620; WHPX працює. HOST_BOOT.json: boot flag 1, приблизно 10,1 GiB C вільно, ram.img відсутній.
- Helper спочатку завершився через PowerShell error для ще не готового ADB. Звірено PID 12500; відновлено лише спостереження за тим самим процесом, другого емулятора не запускали. Тимчасовий helper виправлено для очікуваного ADB-not-ready. Цей helper не є встановленою службою або глобальним контролером.
- Свіжі host-home.png/XML показують launcher без діалогу ANR; після swipe свіжі host-notifications.png/XML показують панель System UI. Це фактичний короткий тест реакції інтерфейсу на ввід, не тривалий stress-test і не приймання Synera.
- Chrome не відкривався автоматично. Попередня policy-відмова не обходилась. Користувачу запропоновано вручну відкрити Chrome у видимому вікні, щоб продовжити перевірку.
- Третій знімок із label host-home-returned фактично показує Chrome first-run (Make Chrome your own), а не launcher. Очікування третього launcher в локальній перевірці відхилено після readback; у HOST_UI_ACCEPTANCE.json зафіксовано фактичний Chrome. Не приймали Synera або завершену Chrome onboarding.
- Користувач повідомив, що вікно емулятора обрізане зверху. Перевірено фактичну Windows геометрію: left413/top−661/right815/bottom240 при primary working area1536x816. Через відсутність callable Windows Computer Use/node_repl виконано вузьке локальне Win32 reposition/resize саме процесу29996 з точним title/path C runtime. Після readback: left180/top16/right518/bottom774, повністю всередині primary working area. Android не перезапущений. WINDOW_FIT.json: WINDOW_BOUNDS_CONTAINED, людська перевірка видимості ще pending. Бічна toolbar — окремий інтерфейс; її видимість має підтвердити користувач.
- ADB forward до вже запущеного Chrome виконано лише для DevTools inspection. Нових Chrome launch/intents не було. JSON/list ще не доступний під час first-run; automatic app-flow не запускався. Користувачу запропоновано самостійно пройти перший екран без входу в Google.

## Варіанти і рішення

1. **Рекомендовано зараз:** залишити Studio/архіви на D, використовувати вже скопійований компактний C runtime тільки для обмеженого Android-тесту. Повторне встановлення повної IDE не потрібне для перевірки PWA. Для повної Studio + Emulator Google вказує 16 GB вільного диска мінімум, 32 GB SSD рекомендовано: https://developer.android.com/studio/install (Windows / Disk space).
2. **D-only runtime:** не прийнятий через зафіксовані USB I/O/write failures. Потрібна стабільність під записом і новий ізольований AVD; старий пошкоджений writable image не перевикористовувати.
3. **Хмара:** Android Device Streaming дає віддалені справжні пристрої. Новий офіційний Android CLI має `android device remote` для reserve/connect/disconnect/remove, без повної IDE: https://developer.android.com/tools/agents/android-cli/commands/device_remote . Потрібні Google login, доступний Cloud/Firebase project та перевірка quota. На Spark 30 хв/проєкт/місяць без оплати; на Blaze після них $0.15/хв: https://firebase.google.com/docs/test-lab/usage-quotas-pricing (Android Device Streaming quotas). Нічого не резервувалось і billing не активувалось.
4. **Браузерна хмара для Android та iPhone:** BrowserStack Live підтримує справжні мобільні браузери; є пробний доступ, конкретний quota треба звірити в акаунті: https://www.browserstack.com/test-site-on-mobile . Не використано, signup/платіж не виконувалися.

Firebase Studio має Android preview, але офіційна актуальна overview-сторінка повідомляє, що нові workspace creation та user signup більше не підтримуються: https://firebase.google.com/docs/studio . Тому не обрано як гарантований новий шлях.

## Межі і наступний крок

Результат: ZIP integrity прийнята; видимий Android базово реагує. Synera в Android Chrome, PWA installation, клавіатура, фізичний Android/iPhone, live accounts і production лишаються неперевіреними. Provider calls=0, USD=$0.00. Сторонній journey-ui.mjs не змінено; нових push/deploy немає.

NEXT: вручну відкрити Chrome у вже відкритому Android, потім виконати підготовлений локальний сценарій та окремо перевірити install на HTTPS. Не дублювати Studio/SDK і не переходити до платної хмари без доступу та конкретного погодженого cap.
