# Зміни для власника web_launch — НЕ застосовано

Ця lane не змінює `web_launch/`. Нижче точний patch до файлів бази
`ce7d629718b33229943b4423adfab0ca6fac2412`. Якщо сусідня lane їх уже змінила,
узгодити hunks із її актуальними файлами, не перезаписувати її роботу.

## Потрібний маршрут

`GET` і `HEAD https://<approved-app-host>/.well-known/assetlinks.json` повинні
повертати HTTP 200, `Content-Type: application/json`, без auth/redirect/SPA fallback.
`package_name` має збігатися з остаточним application ID. Значення
`__PLAY_APP_SIGNING_CERTIFICATE_SHA256__` замінити на справжній **Play app-signing**
SHA-256: 32 hex-байти через двокрапку. Порожній/шаблонний відбиток не публікувати.
Не передавати keystore. Для локальної APK перевірки її окремий відбиток можна
додати другим елементом масиву лише за потреби.

`server.mjs` уже будує allowlist із `PUBLIC_ASSETS`: запис у registry відкриває
маршрут без зміни сервера. `build.mjs` нині очікує плоскі файли: потрібне створення
вкладеної директорії; guard зберігає відмову на невідомі файли, зокрема всередині
`.well-known`. Статичний hosting має зберігати dot-directory. Service worker не
повинен підміняти цей URL HTML-сторінкою.

## Patch для web lane

Це пропозиція для інтеграції власником після заповнення fingerprint, не deploy.

```diff
diff --git a/web_launch/assets.mjs b/web_launch/assets.mjs
--- a/web_launch/assets.mjs
+++ b/web_launch/assets.mjs
@@ -39,1 +39,2 @@
+  '.well-known/assetlinks.json': 'application/json',
   'manifest.webmanifest': 'application/manifest+json', 'pwa.mjs': 'text/javascript', 'sw.mjs': 'text/javascript',
diff --git a/web_launch/build.mjs b/web_launch/build.mjs
--- a/web_launch/build.mjs
+++ b/web_launch/build.mjs
@@ -15,1 +15,6 @@
-if (existing.some(file => ![...assets, ...generated].includes(file))) throw new Error('Неочікуваний файл у релізній директорії; перевірте перед продовженням.');
+const expectedTopLevel = new Set([...assets, ...generated].map(name => name.split('/')[0]));
+if (existing.some(file => !expectedTopLevel.has(file))) throw new Error('Неочікуваний файл у релізній директорії; перевірте перед продовженням.');
+if (existing.includes('.well-known')) {
+  const links = await fs.readdir(path.join(destination, '.well-known'));
+  if (links.some(file => file !== 'assetlinks.json')) throw new Error('Неочікуваний файл у .well-known; перевірте перед продовженням.');
+}
@@ -18,2 +23,3 @@
   const data = await fs.readFile(path.join(root, asset));
+  await fs.mkdir(path.dirname(path.join(destination, asset)), { recursive: true });
   await fs.writeFile(path.join(destination, asset), data);
diff --git a/web_launch/.well-known/assetlinks.json b/web_launch/.well-known/assetlinks.json
new file mode 100644
--- /dev/null
+++ b/web_launch/.well-known/assetlinks.json
@@ -0,0 +1,10 @@
+[
+  {
+    "relation": ["delegate_permission/common.handle_all_urls"],
+    "target": {
+      "namespace": "android_app",
+      "package_name": "ch.synera.app",
+      "sha256_cert_fingerprints": ["__PLAY_APP_SIGNING_CERTIFICATE_SHA256__"]
+    }
+  }
+]
```

## Приймання власником web lane

1. Після узгодження source SHA перевірити та застосувати patch у власній lane,
   перевірити JSON і відсутність placeholders. Не змінювати manifest ID `/`,
   start URL, палітру чи наявні іконки через цей patch.
2. Запустити відповідні тести server/assets/build і потрібну web suite.
   Перевірити, що build на чистому виході копіює `.well-known/assetlinks.json`,
   повторний build проходить, а зайвий файл у `.well-known` спричиняє відмову.
3. На локальному сервері та зібраному hosting перевірити GET і HEAD, MIME та JSON;
   негативно перевірити неіснуючий `.well-known/other.json` (404), відсутність
   directory listing і path traversal. Приватні ключі/інші файли не відкривати.
4. Лише після дозволу на deploy перевірити зовнішній HTTPS URL: HTTP 200 без
   redirect і login, правильний package ID та Play fingerprint. Сам curl не
   доводить DAL: встановити саме Play build і перевірити trusted fullscreen.

Джерела: [TWA signing / asset links](https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2),
[App Links association](https://developer.android.com/training/app-links/configure-assetlinks).

**Неперевірене:** `git apply --check` не виконано: автоматична перевірка відхилила
комбіновану команду підготовки й dry-run з причиною `blocked by policy`.
Patch не застосовано; код web lane, HTTP route, build і live origin тут не
запускались і не змінювались. Власник має перевірити застосовність до своєї версії.
