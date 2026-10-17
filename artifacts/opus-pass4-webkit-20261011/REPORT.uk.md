# Synera — незалежне приймання Opus pass4, 11.10.2026

**LOCAL_ACCEPTED_LIVE_HOLD.** Зміни Opus до `d3d85b0` перевірено; три відтворені дефекти виправлено в **`0f109afbdf502e4733bd13d469f78f655e74818c`**. Цей прохід не доводить готовність продукту до запуску людей. GitHub, production і фізичні телефони — окремі gates.

## Що прийнято й що виправлено

Opus зберіг власні слова людини в полях і чаті, додав DE/EN для входу, профілю й правил, пояснив локальний блок умов на головній. Код не відкочено. Юридичні переклади лишаються неофіційними, український текст — чинним. Current/default, Atelier та добровільні налаштування збережені.

| Відтворений дефект | Вузька зміна | Збережений інваріант |
| --- | --- | --- |
| За забороненого `localStorage` німецька/англійська картка вела на український шлях двох | `index-i18n.mjs` додає поточну мову до дозволених внутрішніх посилань, включно з намальованими пізніше | Явний вибір мови переживає реальний перехід; повернення до UK прибирає старий параметр. Інші query/hash та зовнішні посилання збережені |
| Getter `window.localStorage` або `getItem()` кидав помилку; перемикач дизайну не встановлювався | `style-switcher.mjs` читає сховище всередині `try`; недоступне сховище лишає вибір у сторінці | Current лишається default; добровільний цикл Current → Atelier → Web → Current працює; доступне сховище й далі пам'ятає вибір |
| Той самий getter зривав установлення вступного туру | `onboarding-tour.mjs` допускає недоступне сховище | Явний запуск, наступний крок та Escape працюють; тур не змінює згоди, чернетки або дані сервера |

Тести додають реальні кліки, спостереження помилок JavaScript та перевірку відсутності записів. `people-gate-browser.mjs` приймає параметр мови в тому самому внутрішньому посиланні; серверні й consent oracle не послаблено.

## Доказ і його межі

| Перевірка | Фактичний результат | Артефакт |
| --- | --- | --- |
| Регресія втрати мови до виправлення | 4 семантичні відмови; без помилки fixture | `link-red-webkit/RESULT.json` |
| Регресія сховища до виправлення | Мертвий перемикач і тур, помилки getter | `storage-red-webkit/RESULT.json`, `style-storage-red.tap` |
| Node, зачеплені модулі | **27/27**, без skip | `storage-node-green.tap` |
| Вхід/профіль, кінцевий WebKit 26.6 | **9/9 прогонів, 195 кроків**, 0 українських залишків у DE/EN, 0 проблем oracle; 5 позначок пропуску, окремі непройдені можливості перелічено в `notWalked` | `accepted-index-webkit/RESULT.json` |
| Заборонене сховище, кінцевий WebKit та Chrome 154 | **20/20 перевірок у кожному**, 0 JavaScript errors, 0 нових записів | `storage-green-webkit/RESULT.json`, `storage-green-chrome/RESULT.json` |
| Головна картка, два окремі входи, кінцевий Chrome | **7/7**; однакові умови, кожен бачить лише своє локальне підтвердження; 0 записів на сервер | `accepted-people-chrome/RESULT.json` |
| Навмисна поломка кінцевого пакета | Пропуск обробки мови лише для `real-journey` дає **6 очікуваних відмов**, 0 runtime errors | `accepted-mutation-webkit/RESULT.json`, `FINAL-MUTATION-SETUP.json` |
| Шлях двох, вихідний Opus HEAD, WebKit | **4/4, 144 кроки**, UK/DE/EN, 320/390 px, без overflow; однаковий hash умов | `journey-webkit/RESULT.json` |
| PostgreSQL 18.4 — повторне використання доказу Opus | **12 source hashes** незмінні; PostgreSQL у цьому проході не запускався | `BUILD.json`, `ACCEPTANCE.json`; попередній `opus-review-20261009/pass3/PG18_SQL_ACCEPTANCE.json` |

144-кроковий journey-прогін належить первинному пакету `b34eb742…`, а не кінцевому. Три кінцеві зміни зачіпають вхід/профіль, перемикач стилю й тур; модулі `real-journey*` та серверні файли незмінні. Нормальне читання збереженого стилю покриває Node-тест; роботу виправлених контролів — кінцеві браузерні receipts. Повний старий набір 562 тестів не повторювався: число Opus є історичним, новий доказ тут — 27 зачеплених тестів.

**Невдалий прогін не приховано.** Перший `index-webkit` на вихідному Opus HEAD закінчився 8/9: timeout звичайного кліку на «Уточнити деталі» (елемент знайдено, але не став actionability-ready). Один діагностичний UK-прогін без зміни коду/timeout пройшов 30 кроків; наступні повні WebKit-прогони також пройшли. Причину нестабільності не встановлено; це не твердження про виправлений продуктовий дефект. `index-webkit/RESULT.json` та `index-diagnostic/RESULT.json` збережені. Проміжні зелені language-прогони без `pageerror` не використано як доказ відсутності JS-помилок; саме доданий listener виявив storage-дефекти. Ранній `storage-red-chrome` мав помилку сценарію туру й не є основним RED-доказом.

Дві скінченні перевірки фактичного diff проти інваріантів виконано. Вони додали захист від malformed URL й перевірку реальної роботи туру/дизайну; незалежний read-only reviewer прийняв вузькі виправлення. Остаточна mutation відтворює втрату мови без інших runtime failures. Після приймання додаткові продуктові зміни зупинено.

## Точний локальний кандидат

- **`web_launch/dist-neon-opus-pass4-storage-20261011`**.
- SHA-256 `release.json`: **`c4bd66010354edfe969fda15837c8e052556d2d4f56992f01c58c429f3d43062`**.
- **103 public files / 102 manifest rows**; 100 public assets збігаються з Git blobs коду `0f109af`, два generated assets незмінні проти первинного exact-blob build.
- Лише `index-i18n.mjs`, `style-switcher.mjs`, `onboarding-tour.mjs` відрізняються від exact Opus HEAD build. Release metadata має новий timestamp; різні release hashes самі по собі не означають інший продуктовий код.
- Чужий `web_launch/journey-ui.mjs` з SHA-256 **`68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b`** не змінено, не staged і не включено в candidate. У пакеті — committed asset `3725f354…`.
- `ACCEPTANCE.json` та `readback.mjs` зв'язують source commit, manifest і кінцеві receipts. Candidate directories локальні/ignored; source і відтворення належать Git. Перебудова матиме інший `built_at` та release hash і потребуватиме власного manifest readback.
- Mutant навмисно має недійсний manifest; він є лише негативним тестом і ніколи не rollout target.

### Відтворення

З чистого checkout гілки, що містить `0f109af`, виконай `node neon/build.mjs dist-neon-opus-pass4-reproduction`. Не будуй із чужого dirty checkout. Node built-ins достатні для builder; для браузерних gate потрібні Playwright та відповідний engine, як описано в `docs/REVIEW_HANDOFF.uk.md`. Немає дозволу автоматично встановлювати залежності, робити provider calls або публікувати пакет.

```powershell
node --test web_launch/style-switcher.test.mjs web_launch/onboarding-tour.test.mjs web_launch/index-i18n.test.mjs web_launch/real-journey-i18n.test.mjs
$env:PLAYWRIGHT_BROWSERS_PATH='D:/SyneraQA/playwright-1.63.0'
$env:SYNERA_CHROMIUM='C:/Program Files/Google/Chrome/Application/chrome.exe'
node tools/index-language-browser.mjs --candidate=web_launch/dist-neon-opus-pass4-storage-20261011 --out=artifacts/<new-run>/index-webkit --engine=webkit
node tools/language-link-browser.mjs --candidate=web_launch/dist-neon-opus-pass4-storage-20261011 --out=artifacts/<new-run>/storage-webkit --engine=webkit
node tools/people-gate-browser.mjs --candidate=web_launch/dist-neon-opus-pass4-storage-20261011 --out=artifacts/<new-run>/people-chrome --engine=chromium
```

Локальні D:/Chrome paths — лише приклад цього Windows-середовища, не переносна залежність source. Для нового build підстав нове ім'я candidate. Не запускай наведені команди поверх прийнятих receipts. Readback існуючих локальних пакетів: `node artifacts/opus-pass4-webkit-20261011/readback.mjs`.

## Стан систем і досвід людини

Це короткий delta до [карти всіх систем](../product-status-20261004/STATUS.uk.md). Відчуття — ціль UX, не вимір гормонів, емоцій чи поведінки живих клієнтів.

| Крок / система | Перевірено | Що людина має відчувати | Відкрита межа |
| --- | --- | --- | --- |
| Вхід, профіль, приватність | UK/DE/EN, власний текст, мовна гонка, відмови в synthetic browser | «Я розумію екран, мої слова й вибір збережені» | Google/email delivery та живий акаунт |
| Пошук / Give–Take | Локальні картки й зрозуміле посилання до спільних умов | «Я бачу сенс обміну й наступну дію» | Якість добору на реальних профілях і попит |
| Умови → запрошення → чат → результат | Незмінний локальний journey; WebKit, попередні SQL oracle | «Ніхто не погоджується замість мене; невизначеність названа» | Справжній JWT, два живі акаунти, серверне підтвердження після rollout |
| Android / iPhone / дизайн | Desktop WebKit/Chrome, вузький екран, тур, Current/Atelier; попередня responsive matrix | «Керування доступне, інтерфейс спокійний і передбачуваний» | Фізичний Android/iPhone, PWA install/update/offline |
| Карта / місце зустрічі | Попередній локальний шлях місця/адреси; цей прохід його не змінює | «Я знаю, де зустрітися й що розкриваю» | Живі map tiles/Google SDK, геолокація й мобільні дозволи |
| AI / голос / Triangle / соціальні інтеграції | Локальні контракти й демо в попередніх звітах; нових provider calls немає | «Допомога добровільна; система ясно відділяє пораду від факту» | Живі provider/OAuth/voice/media acceptance, витрати й згода |
| Архів / репутація / монетизація / масштабування | Попередні локальні правила й модель пілота, без нової активації | «Результат чесний, ціна й контроль зрозумілі» | Recovery, telemetry/load evidence, платіжний і юридичний review; прогноз не є доходом |

Локальний блок умов на головній **збережено**, він пояснює межу й веде на єдиний серверний шлях. Opus пропонує прибрати його; власник ще не обрав цей варіант. Його не оголошено працездатним двостороннім workflow.

## GitHub, rollout і наступний крок

Канонічний remote: `AndriiEagle/synera_-MVPplus-`, гілка `codex/synera-product-20261002`. Свіжий `ls-remote` після source commit повернув **`6724682f5f43172e5732fa41b8a46e4baa6384e2`**. Це старий зріз без Opus pass4 і нових виправлень; remote handoff та fresh-clone acceptance **НЕ виконані**. Локальний commit не є опублікованим handoff.

Користувач прямо дозволив push. Проте runtime відхилив навіть `git push --dry-run origin HEAD:refs/heads/codex/synera-product-20261002` до виконання: **`approval required by policy, but AskForApproval is set to Never`**. [Точний receipt](PUSH_RECEIPT.json). Actual push не виконаний, альтернативного транспорту не було. Інші checkout/remotes не використовувалися для обходу.

**NEXT, 5–10 хвилин:** у своєму PowerShell виконай звичайний push цієї гілки та `git ls-remote` для перевірки SHA. Після збігу remote із локальним HEAD — readback файлів/чистий clone для зовнішнього handoff. Сам push не є deployment.

```powershell
git -C "C:\Users\Andrii\Desktop\synera-premium-pwa-variant" push origin HEAD:refs/heads/codex/synera-product-20261002
git -C "C:\Users\Andrii\Desktop\synera-premium-pwa-variant" ls-remote origin refs/heads/codex/synera-product-20261002
```

Для запуску людей далі потрібні точний погоджений production/recovery rollout із міграціями **1 → 1a → 2–6**, справжній HTTP JWT і цикл двох живих акаунтів. Спроба відправника прийняти власне запрошення має бути відхилена сервером; зафіксувати фактичний HTTP-статус Neon для `PT409`. Потім фізичне встановлення Android/iPhone. Не активувати неперевірені платні/голосові/соціальні можливості під виглядом завершених функцій; sustained capacity також потребує окремого доказу.

Models used: none (provider calls=0, USD=$0.00).
