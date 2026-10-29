# Synera → Android TWA / Google Play, 29.10.2026

**Файловий пакет підготовлено; AAB не зібрано.** Ця робота не встановлює ПЗ,
не створює ключів або акаунтів і не публікує застосунок. Команди нижче — майбутня
процедура PowerShell **після окремого дозволу Андрія на інсталяції та збірку**.
Завантаження в Play, зміни сайту і публікація теж мають окреме схвалення.

Працювати з `C:/sw/synera-android`; базовий commit
`ce7d629718b33229943b4423adfab0ca6fac2412`, branch
`claude/synera-android-20261029`. `web_launch/` належить іншій лінії.
Це Android-оболонка HTTPS PWA, не повністю нативна реалізація Android/iPhone.
TWA — перший маршрут; Capacitor розглядати лише після конкретної несумісності.

## 0. Що вже є на Sol

Read-only перевірка 29.10.2026: `Get-Command`, `node --version`, `npm --version`,
змінні середовища і стандартні каталоги; нічого не інстальовано.

| Інструмент | Результат |
| --- | --- |
| Node | `v24.16.0`, `C:/Program Files/nodejs/node.exe` |
| npm | `11.13.0`, `C:/Program Files/nodejs/npm.ps1` |
| java / javac / keytool | Не знайдені у PATH |
| adb / sdkmanager | Не знайдені у PATH |
| bubblewrap | Не знайдений у PATH |
| JAVA_HOME / ANDROID_HOME / ANDROID_SDK_ROOT | Не задані |
| Типові JDK/SDK каталоги | Немає `C:/Program Files/Java`, `C:/Program Files/Eclipse Adoptium`, `C:/Program Files/Android/Android Studio/jbr`, `%LOCALAPPDATA%/Android/Sdk` |
| Bubblewrap config | Немає `%USERPROFILE%/.bubblewrap/config.json` |

Це обмежена перевірка, не доказ відсутності будь-якої портативної копії на диску.
Офіційний npm metadata дає Bubblewrap **1.27.0**, Node `>=18`; вихідний шаблон
цієї версії використовує AGP 8.9.1, compile/target API 36. Джерела і SHA-256 —
[SOURCES.json](SOURCES.json). Запуск на цьому Node ще не перевірено.

## 1. Спочатку зафіксувати вхідні дані

Андрій затверджує стабільний production hostname **реального застосунку**,
`ch.synera.app` як незмінний Android package ID, власника видавця, privacy URL,
deletion URL і support email. `SYNERA_HOST` навмисно лишено шаблоном.
Не використовувати тимчасовий tunnel/preview або презентаційну сторінку замість
працездатної PWA. Цей пакет припускає app root `/` і
`/manifest.webmanifest`; якщо app живе під іншим шляхом, спершу узгодити конфігурацію.

Далі лише після дозволу на інсталяції: встановити **JDK 17** з
[Eclipse Temurin](https://adoptium.net/temurin/releases/?version=17), і завантажити
Windows Command-line Tools з [Android SDK](https://developer.android.com/studio#command-tools).
Для JDK можна використати наведений нижче winget, якщо він доступний; інакше
офіційний JDK 17 installer. Для SDK записати фактичний шлях ZIP: назва залежить
від чинної версії на сайті, тут її не вигадано.

```powershell
# НЕ виконувалось. Лише після схвалення встановлення.
Set-Location C:/sw/synera-android
winget install --exact --id EclipseAdoptium.Temurin.17.JDK --source winget

# Вказати фактичний JDK 17 home після встановлення, без /bin.
$env:JAVA_HOME = 'C:/Program Files/Eclipse Adoptium/__ACTUAL_JDK_17_DIRECTORY__'
$env:Path = "$env:JAVA_HOME/bin;$env:Path"
java -version
javac -version
keytool -help
```

Не продовжувати, якщо `java`/`javac` не версії 17. Шляхи `__...__` в усіх
командах — обов'язкові заміни, не готові значення. Локальні SDK, Gradle і temp
розміщуємо на C:, не на D:.

```powershell
$RepoRoot = 'C:/sw/synera-android'
$env:TEMP = "$RepoRoot/android/.tmp"
$env:TMP = $env:TEMP
$env:GRADLE_USER_HOME = "$RepoRoot/android/.toolchain/gradle"
$env:ANDROID_HOME = "$RepoRoot/android/.toolchain/android-sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$SdkZip = 'C:/__APPROVED_DOWNLOAD_PATH__/commandlinetools-win-__VERSION___latest.zip'
New-Item -ItemType Directory -Force $env:TEMP, "$RepoRoot/android/.toolchain/sdk-unpack", "$env:ANDROID_HOME/cmdline-tools/latest" | Out-Null
Expand-Archive -LiteralPath $SdkZip -DestinationPath "$RepoRoot/android/.toolchain/sdk-unpack"
Copy-Item -Path "$RepoRoot/android/.toolchain/sdk-unpack/cmdline-tools/*" -Destination "$env:ANDROID_HOME/cmdline-tools/latest" -Recurse
$env:Path = "$env:ANDROID_HOME/cmdline-tools/latest/bin;$env:ANDROID_HOME/platform-tools;$env:Path"
sdkmanager.bat --sdk_root="$env:ANDROID_HOME" --licenses
sdkmanager.bat --sdk_root="$env:ANDROID_HOME" 'platform-tools' 'platforms;android-36' 'build-tools;36.0.0'
adb version
```

Переглянути ліцензії й погоджувати їх особисто. Не запускати цей початковий
розпакувальний крок поверх наявного SDK; при відновленні використати його шлях.
На дату перевірки Google вимагає для нових телефонних застосунків **target API 36+**
з 31.08.2026; повторно звірити вимогу перед поданням.
[Google Play target API](https://support.google.com/googleplay/android-developer/answer/11926878).

## 2. Встановити та перевірити Bubblewrap

Загальний офіційний синтаксис — `npm i -g @bubblewrap/cli`. Для відтворення саме
перевіреного тут формату зафіксовано версію:

```powershell
npm i -g @bubblewrap/cli@1.27.0
bubblewrap updateConfig --jdkPath="$env:JAVA_HOME" --androidSdkPath="$env:ANDROID_HOME"
bubblewrap doctor
```

Команди можуть пропонувати додаткові завантаження. Не погоджуватися на непогоджені
інсталяції; після налаштування використовувати власні JDK/SDK шляхи.

## 3. Створити приватний upload keystore

Потрібен окремий узгоджений **приватний каталог поза Git**, шифровані резервні копії
та збережені паролі. Шлях нижче — placeholder. Не класти ключ у `web_launch/`,
репозиторій, сторінку, чат або лог. Паролі `keytool` і Bubblewrap вводити у prompt,
не параметрами команд і не зберігати у цих файлах.

```powershell
$KeystoreDir = 'C:/__PRIVATE_KEYSTORE_DIRECTORY__'
$KeystorePath = "$KeystoreDir/synera-upload.keystore"
if (Test-Path -LiteralPath $KeystorePath) { throw 'Key already exists: reuse it; do not overwrite or regenerate.' }
New-Item -ItemType Directory -Force $KeystoreDir | Out-Null
keytool -genkeypair -v -keystore "$KeystorePath" -storetype JKS -alias synera-upload -keyalg RSA -keysize 2048 -validity 10000
if ($LASTEXITCODE -ne 0) { throw 'Keystore generation failed.' }
keytool -list -v -keystore "$KeystorePath" -alias synera-upload
```

Занотувати `SHA256:` для **локальної APK-перевірки**. При Play App Signing це
upload key; production build із Play зазвичай підписаний іншим app-signing key.
Не плутати ці два відбитки.

## 4. Ініціалізувати Android-проєкт, потім застосувати TWA-конфігурацію

Спершу власник сайту має підготувати HTTPS PWA, manifest та іконки.
Значення `$SyneraHost` вводиться без `https://`, порту, шляху або `/`.

```powershell
$SyneraHost = '__APPROVED_STABLE_APP_HOST__'
if ($SyneraHost -match '__|SYNERA_HOST|[/:\\\s]' -or $SyneraHost -notmatch '\.') { throw 'Set a real approved hostname.' }
$WebManifestUrl = "https://$SyneraHost/manifest.webmanifest"
curl.exe --fail --show-error --silent --max-redirs 0 $WebManifestUrl
curl.exe --fail --show-error --silent --max-redirs 0 -I "https://$SyneraHost/icon-512.png"

$BuildDir = "$RepoRoot/android/build"
if (Test-Path -LiteralPath $BuildDir) { throw 'Existing generated project: inspect and resume it; do not initialize over it.' }
New-Item -ItemType Directory $BuildDir | Out-Null
Set-Location $BuildDir
bubblewrap init --manifest="$WebManifestUrl"
if ($LASTEXITCODE -ne 0) { throw 'Bubblewrap init failed.' }
```

У prompts підтвердити `ch.synera.app`, назву Synera, старт `/`, кольори з
вебманіфесту, існуючий keystore `$KeystorePath` і alias `synera-upload`.
Не створювати другий ключ. **`init --manifest` приймає URL вебманіфесту**, не
`android/twa-manifest.json`. Після init зберегти його початковий JSON і замінити
конфігурацію нашою, щоб явно вимкнути notification delegation:

```powershell
Copy-Item -LiteralPath "$BuildDir/twa-manifest.json" -Destination "$BuildDir/twa-manifest.init.json"
$Prepared = Get-Content -Raw -Encoding UTF8 "$RepoRoot/android/twa-manifest.json" | ConvertFrom-Json
$Prepared.host = $SyneraHost
$Prepared.iconUrl = "https://$SyneraHost/icon-512.png"
$Prepared.maskableIconUrl = $Prepared.iconUrl
$Prepared.webManifestUrl = $WebManifestUrl
$Prepared.signingKey.path = $KeystorePath.Replace('\', '/')
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
[IO.File]::WriteAllText("$BuildDir/twa-manifest.json", ($Prepared | ConvertTo-Json -Depth 20), $Utf8NoBom)
if (Select-String -Path "$BuildDir/twa-manifest.json" -Pattern 'SYNERA_HOST|__[A-Z_]+__' -Quiet) { throw 'Unresolved release placeholders.' }
bubblewrap update --manifest="$BuildDir/twa-manifest.json" --skipVersionUpgrade
if ($LASTEXITCODE -ne 0) { throw 'Bubblewrap update failed.' }
Get-Content "$BuildDir/app/build.gradle" | Select-String 'compileSdkVersion|targetSdkVersion|versionCode|versionName'
```

JSON Bubblewrap використовує `startUrl` і `appVersion`; `start_url` належить
вебманіфесту. Для наступних Play-релізів збільшувати `appVersionCode` і версію;
не повторювати versionCode вже завантаженої збірки. Не редагувати вручну згенеровані
файли: `update` їх перезаписує. Нині shortcuts порожні, бо у PWA їх немає.

## 5. Зібрати signed AAB

```powershell
Set-Location $BuildDir
bubblewrap build --manifest="$BuildDir/twa-manifest.json" --signingKeyPath="$KeystorePath" --signingKeyAlias=synera-upload
if ($LASTEXITCODE -ne 0) { throw 'Signed build failed.' }
Get-Item "$BuildDir/app-release-bundle.aab", "$BuildDir/app-release-signed.apk"
Get-FileHash -Algorithm SHA256 "$BuildDir/app-release-bundle.aab"
jarsigner -verify -verbose -certs "$BuildDir/app-release-bundle.aab"
```

Очікуваний артефакт — `android/build/app-release-bundle.aab`; APK — для локальних
перевірок. Не використовувати `--skipSigning` або `--skipPwaValidation` для
приховування проблем. Build може завантажувати Gradle/Maven залежності: це входить
у майбутній погоджений етап, нічого з цього тут не запускалось.

## 6. Play App Signing і assetlinks

У Play Console створити запис застосунку, увімкнути/узгодити **Play App Signing**,
завантажити AAB у чернетку **Internal testing**. З розділу App signing / App
integrity скопіювати SHA-256 саме **App signing key certificate**. Він підписує
доставлені Play APK; Upload key certificate не є його заміною.
[Android TWA quick start — signing](https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2).

```powershell
$PlaySigningSha256 = '__PLAY_APP_SIGNING_CERTIFICATE_SHA256__'
if ($PlaySigningSha256 -notmatch '^(?:[0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$') { throw 'Use colon-separated Play app-signing SHA-256.' }
$Links = Get-Content -Raw -Encoding UTF8 "$RepoRoot/android/assetlinks.template.json" | ConvertFrom-Json
$Links[0].target.sha256_cert_fingerprints = @($PlaySigningSha256.ToUpperInvariant())
[IO.File]::WriteAllText("$BuildDir/assetlinks.json", (ConvertTo-Json -InputObject @($Links) -Depth 10), $Utf8NoBom)
```

Передати **публічний** JSON власнику web lane за [WEB-CHANGES.md](WEB-CHANGES.md).
Він має віддаватися з `https://<host>/.well-known/assetlinks.json`: HTTP 200,
`Content-Type: application/json`, без login і redirect. Для локально підписаного
APK можна тимчасово додати його окремий SHA-256 як ще один елемент масиву;
перевірка APK з upload key не доводить перевірку Play-доставленого застосунку.
Keystore і паролі нікуди не передавати.

```powershell
curl.exe --silent --show-error --fail --max-redirs 0 -D - "https://$SyneraHost/.well-known/assetlinks.json"
```

Прочитати HTTP status, headers, package ID та fingerprint; `curl` success сам по
собі не доводить DAL verification. Це перевіряється запуском Play-встановленої
збірки: немає browser URL bar на довіреному origin. При невдалому DAL маємо
Custom Tab із browser UI; це не прийнятий TWA. Зовнішні origin, зокрема auth,
перевірити окремо; не додавати довірені origin автоматично.

## 7. Від internal testing до production

Після дозволу на завантаження: вибрати internal track, додати AAB, release notes
і тестерів, відкрити opt-in link на реальному Android і встановити через Play.
Додати listing тексти з `fastlane/metadata/android/{de-CH,en-US,uk}`, справжні
скриншоти, store icon і feature graphic; Fastlane не встановлювався, ці тексти
можна перенести вручну. Порівняти описи з реальною збіркою перед поданням.
`de-CH` збережено як замовлений locale; перед автоматичним upload перевірити
підтримувані коди мов у Play Console/Fastlane. Перенесення на інший locale не
робити мовчки; доступність саме `de-CH` цим файловим тестом не доведена.

Пройти launch/reopen/Back, login/logout і повернення з auth, профіль/знайомство,
мови uk/de/en, Current/Atelier/Night, клавіатуру/поворот, повільну мережу/втрату
зв'язку, privacy/deletion, permissions і зовнішні посилання. Не обіцяти offline
операції, які не реалізовані. Перевірити наданий review access. Приватний LAB,
службові ключі й тестові AI-персони не стають публічним продуктом через wrapper.

`DATA_SAFETY.md` і `CONTENT_RATING.md` — чернетки: затвердити їх після аудиту даних
і функцій. Для personal accounts, створених після 13.11.2023, Google зараз вимагає
**closed test: щонайменше 12 тестерів з безперервним opt-in 14 днів**, далі заявку
на production access. Internal testing цю умову не замінює; сам відлік не
гарантує approval. Вимоги конкретного акаунта звіряє Андрій.
[Офіційні вимоги до тестування](https://support.google.com/googleplay/android-developer/answer/14151465).

## 8. iPhone

Зараз: відкрити стабільну HTTPS PWA в Safari → Поділитись → На екран Додому;
перевірити на справжньому iPhone. Це PWA install, не App Store release.
TWA на iOS не працює. Для пізнішої нативної/Capacitor оболонки потрібні **Mac із
сумісною macOS та Xcode**, Apple Developer signing, реальний iPhone/TestFlight,
окремі privacy/rating матеріали і подання до App Store. Apple перевіряє
minimum functionality: проста перепакована вебсторінка може не пройти review.
[Xcode](https://developer.apple.com/xcode/), [App Review §4.2](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality).

## Межа перевірки цього пакета

```powershell
Set-Location C:/sw/synera-android
node --test android/*.test.mjs
```

Тест перевіряє поля шаблону, кольори, файли та розміри PNG, metadata limits і
негативні випадки. Він не запускає Bubblewrap/Gradle, не доводить signing,
maskable safe area, Google policy approval, DAL на сервері або поведінку телефону.
Невідомі домен, ключі й публічні URL лишаються явними release-блокерами.

Синтаксис звірено з [Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap/blob/0eb0671985d3f28eb2567a5463999046255fa3b8/packages/cli/README.md)
і [TwaManifestJson](https://github.com/GoogleChromeLabs/bubblewrap/blob/0eb0671985d3f28eb2567a5463999046255fa3b8/packages/core/src/lib/TwaManifest.ts#L587).
