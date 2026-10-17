# Android після перезапуску — 07.10.2026

**SDK_INSTALLED / ANDROID_BOOT_BLOCKED_BY_USB_STORAGE. Synera на Android ще не прийнята.**

## Підтверджено

- Обидва раніше завантажені офіційні ZIP перевірені за SHA256 та розпаковані на D:/SyneraAndroid. Studio: `6e83e7ce3e0a76c4e8e78d98eb5ef538cbc9fb386c745bda425fc0bacb9de6d4`; command tools: `90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a`. Повторного завантаження ZIP не було.
- SDK install завершився exit 0: Emulator 37.2.12, platform-tools 37.0.1, Android 16 / API36 Google Play x86_64 revision7. Studio GUI не запускала. Каталоги SDK/AVD/cache/tmp на D:, environment лише процесу; глобальні PATH, Windows features, BIOS не змінювалися.
- [accel.txt](accel.txt): WHPX(10.0.26200) installed and usable, exit0. Перезавантаження для прискорення не потрібне.
- Створений окремий Pixel7 AVD 1080×2400, density420, без входу в Google. avdmanager дав exit0 з попередженнями про розміщення SDK та devices.xml. Фактичну конфігурацію прочитано; image.sysdir виправлений на абсолютний шлях усередині дозволеного D:/SyneraAndroid. Оригінал збережений локально в avd-created.ini.

## Фактичний блокер

[Windows storage events](STORAGE_EVENTS.json): о 15:26:04–05 local NTFS50 повідомив про втрату записів у тестових userdata-qemu.img.qcow2 та encryptionkey.img.qcow2; NTFS140 — відсутній пристрій D: і можливе пошкодження даних; disk51 — I/O errors. Серійні номери обладнання зі збереженого доказу вилучені.

[Emulator crash](EMULATOR_CRASH.json): о 15:26:09 qemu-system-x86_64-headless.exe завершився з 0xc0000006; executable та VCRUNTIME140.dll були на D:. Helper отримав WinError2 при повторному запуску adb.exe, який до того працював; згодом файл знову був доступним, але пристрій emulator-5580 уже відсутній. **Це доказ збою доступу/запису, не встановлена причина несправності кабелю чи диска.**

[BOOT.json](BOOT.json) має booted=false. Після звірки процесів і ADB повторний boot не виконувала. [STORAGE_HOLD.json](STORAGE_HOLD.json) блокує helper до окремого reconciliation; пошкоджений тестовий образ не прийнятий. Тимчасовий локальний HTTP server зупинений. C: має лише 13.4 GiB вільного місця, тому автоматичне перенесення великого середовища не виконувала.

## Межі результату

Android screenshot, Chrome/PWA install, soft keyboard та реальний Android user flow **не перевірені**: Android не завершив boot. Попередні desktop Chromium responsive докази лишаються чинними тільки у своїх межах. iPhone/Safari, фізичні телефони, live JWT/two accounts, production rollout і capacity не прийняті. Нових змін продуктового коду, платежів, deployment, provider calls немає. Product HEAD перед цим кроком: `6724682f5f43172e5732fa41b8a46e4baa6384e2`.

Переглянула scope/diff та фактичні Windows докази окремо: успішний install не перетворюється на успішний boot. Foreign journey-ui лишається незмінним. Raw SDK license/runtime logs не включені в Git; runtime містить службові ідентифікатори, тому опубліковані лише вузькі докази вище.

**NEXT (10–15 хв):** перевірити USB-кабель/порт і стабільність D:, зберігши важливі дані. Після цього перевірити цілісність SDK та створити новий ізольований тестовий AVD без видалення старого. До стабільного накопичувача навантажувальні запуски не повторювати.

Models used: none (provider calls=0, USD=$0.00).

## Продовження о 19:42 Europe/Zurich

Після нового «дороби» перевірено: emulator/qemu процесів немає; останні disk/NTFS errors залишаються о 15:26, нових за останні дві години немає. Get-Volume показує Healthy, але цей загальний прапорець не спростовує зафіксовану втрату записів і не приймає USB під навантаженням.

Підготовлено [C_RECOVERY_PLAN.json](C_RECOVERY_PLAN.json): 431 файл SDK/runtime/image, 3.34 GiB; новий writable AVD 2 GiB, ліміт усього середовища 7 GiB, мінімум 8 GiB вільного C:. Зараз C: 15.39 GiB. Це дозволяє спробувати повністю локальне середовище без USB у runtime, **якщо власник підтвердить новий каталог C:/Users/Andrii/.codex/tmp/synera-android-local**. Питання надіслане; відповіді на момент цього запису немає. Копіювання, новий install, повторний boot і push не виконувалися. План не доводить цілісність вихідних файлів після збою; при дозволеному копіюванні потрібні hashes/readback, зупинка на I/O error і повторний контроль вільного місця.

Це незалежна підготовка відновлення, не новий Android PASS. Наступна залежна дія — погоджене копіювання runtime на C: або підтверджена стабілізація USB з новим тестовим AVD.
