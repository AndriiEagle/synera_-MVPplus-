# Графіка Synera · 29.10.2026

Результати створені лише вбудованим Codex `image_gen`: п'ять диптихів (10 різних вигаданих дорослих), одна сцена й одна зміна палітри існуючої іконки. Всього 7 викликів. Точний underlying model і USD інструмент не повернув. Викликів платних спеціалістів через Token Monster не було.

- `contact-sheet.png` — усі десять портретів із ключами.
- `sources/persona-*-640.png` — квадратні 640×640 майстри. `web_launch/persona-*.webp` — 320×320 для застосунку.
- `sources/synera-thread-master.png` — оригінальна сцена; WebP 768×512 і 1536×1024.
- `sources/icon-master.png` — нова темно-золота іконка. `sources/before-*.png` — збережені старі зелені іконки.
- `asset-evidence.json` — фактичні SHA-256 і байти майстрів та served-файлів.
- `shots/` — екрани iPhone 13 і Pixel 7, desktop, кожен портрет у картці.
- `review-portraits.png`, `review-screens.png` — аркуші для перевірки всіх скриншотів.
- `runtime-evidence.json` — справжня offline-навігація, декодування, maskable safe zone і негативний контроль старою зеленою іконкою.

Портретні crops — QA-прев'ю кожного з десяти файлів у справжній Summit person-card. Прив'язка десяти зображень до simulation UI належить agents lane; її файли не редагувалися. Реально інтегровані тут: Mira/Leo в Summit і Марія/Олексій у домашньому Demo.

Це Chromium із профілями viewport/UA/DPR, не Safari і не фізичні телефони. `get.html` знято як справжню сторінку інструкції; це не доказ встановлення PWA чи native splash.

Відтворити WebP з включених майстрів без генерації: `node docs/graphics-20261029/prepare-assets.mjs` (потрібен наявний FFmpeg із libwebp). Нових візуальних елементів цей скрипт не створює: лише crop/resize/encoding. Оригінали генератора збережені без видалення; для повторного encoding вони не потрібні.

Браузерні перевірки: `tests/graphics-e2e.spec.mjs`; незалежний runtime readback: `node --require C:/sw/task1601-header-chrome.cjs docs/graphics-20261029/qa.mjs`. QA запускає власний сервер і закриває його в `finally`.
