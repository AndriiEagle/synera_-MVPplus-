# Перенесення та Android на C: — 07.10.2026

**Перенесення погодженого ZIP завершене. Android на C: встановлений і завантажився; стабільний UI та Synera всередині емулятора ще НЕ прийняті.**

## Перенесення з двома перевірками

Єдиний видалений файл: `C:/Users/Andrii/.codex/tmp/synera-pg16-20261003/postgresql-16.15-5-windows-x64-binaries.zip`, 373254386 bytes (355.96 MiB). Копія: `D:/Moved/SyneraInstallArchives-20261007/postgresql-16.15-5-windows-x64-binaries.zip`. Розпакована PostgreSQL та її дані не змінені.

Robocopy exit1 = один успішно скопійований файл, 0 failures. Два послідовні проходи порівняли розмір і SHA256 джерела/копії; після прямого дозволу видалити саме цей ZIP виконані ще fresh hash check і readback копії після видалення. SHA256: `43bb45f173a6f08cf1d29a97a6d8deb119e8e8093a24c00d2d1001a0ccaa8281`. [C_OFFLOAD.json](C_OFFLOAD.json) має PURGED. Це відновлюваний інсталяційний архів; перевірка байтів не усуває попередню нестабільність USB D:. Жодні важливі робочі дані не лишалися єдиною копією на D:.

## Що встановлено

Після прямого дозволу власника створено `C:/Users/Andrii/.codex/tmp/synera-android-local`: Android Emulator 37.2.12, platform-tools 37.0.1, Android16/API36 GooglePlay x86_64 rev7. Studio GUI лишається на D:; повторне завантаження не робилося. [C_SETUP.json](C_SETUP.json): 431 файл скопійований із потоковим SHA256 джерела, fsync та окремим SHA256 копії. Це рівність копії наявному SDK, не новий vendor-signature audit після USB-збою.

Новий `Synera_Local_API36` не використовує старі writable images. Старі D: копії/AVD збережені. Поточні emulator, qemu та adb executables звірені з C:; старий task-owned D: adb server зупинений після порожнього списку пристроїв. PATH, BIOS, Windows features, особисті профілі, Google accounts, production та платні провайдери не змінювались.

## Фактичний запуск і обмеження

[C_BOOT.first.json](C_BOOT.first.json): sys.boot_completed=1, Android16, 1080×2400, WHPX usable. На першому фактичному екрані [c-booted-home.png](c-booted-home.png) є **System UI isn't responding**. Тому boot-property не прийнятий як стабільний інтерфейс. Ранній uiautomator до завершення boot також упав: accessibility service ще не був доступний; пізніший XML успішно прочитаний і підтвердив ANR-dialog.

Команда відкриття локального Synera URL у Chrome через ADB була **відхилена автоматичною policy**; обхід іншим транспортом не робився. Chrome/Synera/PWA install, keyboard, Android user journey і фізичний телефон цим запуском не перевірені. Це окремий blocker від System UI.

Емулятор зупинений через його console command. Один підготовлений повторний запуск із 4 cores/no-boot-animation/no-metrics не стартував: startup guard вимагає 10 GiB перед boot, доступного місця було менше. Guard не послаблювала. Новий образ попри config request 2G створив virtual /data приблизно5.8G та `snapshots/default_boot/ram.img` приблизно2.5GiB. Не плутати віртуальний розмір partition із реально зайнятим місцем.

[C_FINAL.json](C_FINAL.json): фінальний обсяг середовища і вільне C: звірені з лімітами 7GiB/мінімум8GiB. Середовище майже вичерпало7GiB, тому подальші запуски відкладені. Додаткових файлів не видалено. Локальний HTTP server зупинений. Critical emulator/adb/system.img повторно прочитані та звірені з accepted copy hashes після boot. Foreign journey-ui hash залишився `68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b`.

## Наступний крок

Підготувати точне звільнення згенерованого emulator RAM/snapshot cache або компактніший офіційно підтриманий runtime без послаблення запасу C:. Окремо розв'язати policy gate на керування Chrome. До цього не зараховувати емулятор як готовий тест Synera й не повторювати запуски. Native APK/IPA, iPhone/Safari та production не прийняті.

Models used: none (provider calls=0, USD=$0.00).
