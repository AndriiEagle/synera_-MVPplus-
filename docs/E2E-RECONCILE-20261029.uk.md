# Synera: узгодження browser E2E після дизайн-проходу, 29.10.2026

Запитаний локальний набір зелений: **39/39 Playwright**, **738 Node + 43 PWA/i18n**, **0 fail**. У головному Node-наборі збережено **1 наявний skip** інтеграції з disposable PostgreSQL: `SYNERA_ACCEPTANCE_PG` не заданий. Нових skip, видалених тестів або послаблених axe/геометричних перевірок немає.

Worktree: `C:/sw/synera-design`, гілка `claude/synera-design-20261029c`, base/незмінений HEAD `ce7d629718b33229943b4423adfab0ca6fac2412`. Початковий worktree був чистий. Commit, push, install і deploy не виконувалися. Junction `node_modules` та його ціль не змінені. Усі тимчасові каталоги — на C:.

## Відтворення й вирішальні докази

Перший запуск був саме двома запитаними specs через тимчасовий Chrome config. Оскільки його виконання перетнулося з редагуванням spec, він є лише діагностичним, а не еталоном початкової кількості падінь. Для точного baseline окремо повторено **незмінені визначення тестів із HEAD** у тимчасовому каталозі: змінено лише шляхи import, а `/site-shell.css` підставлено точними байтами `git show HEAD:web_launch/site-shell.css`. Робочі файли для цього не відкочувалися. Результат: **19 failed, 20 passed**, як у повідомленому CI. [Baseline log](e2e-reconcile-20261029/baseline-pinned.log).

Після оновлення селекторів залишалися шість продуктових регресій. Їхні незмінені змістовні перевірки стали зеленими після CSS-виправлення: [6/6 repair log](e2e-reconcile-20261029/repair.log).

Негативна перевірка використовує **фінальні визначення тестів** і підставляє старий CSS із HEAD тільки через browser route, без зміни файлів продукту. Всі шість цільових перевірок знову падають: дві геометрії, N1–N6 і три axe-сценарії. Це очікуваний exit 1, **6 failed, 0 passed**: [CSS reversal log](e2e-reconcile-20261029/css-reversal.log). Отже, нові specs справді виявляють повернення дефектів.

## Кожне з 19 початкових падінь

Номери рядків нижче стосуються `tests/browser-e2e.spec.mjs` на початковому HEAD. 13 падінь стосувалися навмисно зміненого DOM/шляху; шість потребували виправлення продукту, подекуди разом з оновленням селектора.

| Початковий рядок / тест | Причина | Що змінено, яка гарантія збережена |
|---|---|---|
| 80 — бренд index | Селектор: `.brand` замінено спільним `.site-brand`. | Пошук доступного link `Synera` у `.site-header`; видимість, текст і `href=/`. |
| 104 — mobile first visit | DOM: зовнішній `#style-toggle` прибрано. | Закриті обидва селектори, прихований тур, закрите «Ще режими», scrollY=0; після відкриття меню можна обрати Noir. Чистий перший візит більше не маскується збереженим `tour=done`. |
| 120 — 320 px | DOM: helper чекав видалений toggle. | Helper відкриває меню й перевіряє доступні «Мова» та «Вигляд». Повні межі CTA, усіх видимих controls і відсутність горизонтального overflow перевіряються як раніше. |
| 120 — 375 px | Те саме. | Та сама сувора геометрія на 375 px. |
| 146 — Synera / Atelier / Web | Навмисна зміна: Atelier default, прямий селектор замість циклічної кнопки. | Усі три стилі обираються й повертаються; додатково кожен вибір та root attribute перевіряються після reload. |
| 163 — compact visual choices | DOM: більше немає toggle для повернення з Noir. | Вибір Noir і повернення до Synera через селектор; значення control та root style мають збігатися. |
| 173 — усі десять compact presets | DOM: старий helper. | Незмінені вимоги: 10 різних computed background, демонстрація лишається видимою. |
| 186 — compact preset на 375 px | DOM: старий helper. | Noir доступний і реально змінює computed surface; control видимий. |
| 209 — tour не блокує чернетку | DOM: старий helper. | Явний Tour із меню, видима підказка, доступна дія відкриття профілю та «Далі». |
| 219 — draft tour / back to login | DOM/flow: «До входу» тепер всередині меню, яке закривається після Tour. | Меню явно відкривається знову; усі кроки туру, usable demo і точний текст чернетки після повернення збережені. |
| 268 — перша дія профілю | **Продуктова регресія:** landing explanation, install і modes відсунули workspace; CTA починалася приблизно на 1304 px. | CSS приховує landing explanation у відкритій чернетці й ставить workspace перед другорядними modes/install. Початковий поріг bottom < 850 не змінено. |
| 280 — mobile nav/style | **Продуктова регресія + селектор:** nav bottom був 914.64 px при висоті 700; toggle прибрано. | Те саме виправлення порядку блоків; геометрія нового селектора. Пороги 320 px ширини / 700 px висоти не змінено. |
| 351 — wired tokens | DOM/default: toggle і стартова Synera більше не відповідають дизайну. | Стилі явно обираються перед читанням computed values. Ті самі точні три палітрові токени, нетривіальний фон і видима рамка. |
| 383 — a11y N1–N6 | **Продуктова регресія + DOM:** shell замінив enabled/disabled рамки декоративною `--ui-line`. Окремо дизайн навмисно ввів focus ring 3 px. | Відновлені semantic control/disabled tokens. Усі точні старі N1–N4/N6 значення збережено; N5 перевіряє справжній клавіатурний focus-visible нової оболонки: 3 px solid accent. |
| 482 — Night map | DOM: старий toggle. | Night через селектор і повернення до Synera. Незмінені порядок заголовка/CTA, повна CTA над fold та 0 running animations при reduced motion. |
| 503 — Presentation / phone access | DOM: `#access-language` замінено спільним `#site-language`. | Мова через «Мова і вигляд», додано EN → UK. Збережені обидві phone guides, exact live-app origin, відсутність checkout/store links і private requests, axe та overflow. |
| 552 — Triangle L journey | **Продуктова регресія:** темні fills старих кнопок отримали темний текст світлого shell; status text став блідим на світлих cards. | Кнопки Triangle та статуси використовують спільну палітру. Жоден vote/revision/timer/export/consent assertion або axe rule не вилучено. |
| 601 — Opportunity map | **Продуктова регресія:** темний текст на темних markers, бліді tags/results на світлих cards. | Світлий текст збережених темних markers; читабельні tags/results і кнопки. Незмінені layers, complementarity, minimax place, own limits, no origin та axe. |
| 617 — Free launch | **Продуктова регресія + навігація:** бліді cost/trust тексти; колишній heading link тепер інша головна дія. | Читабельні computed surfaces; до презентації йдемо через «Ще режими» → «Як працює Synera». Незмінені $144/$0 приклади, axe та перевірка цільового hero. |

## Мінімальні зміни продукту

Змінений **тільки `web_launch/site-shell.css`, +13 рядків**:

- три рядки для control/disabled рамок і поверхонь головної, включно з коментарем;
- шість рядків для контрасту Triangle, включно з коментарем; правило кнопок обмежено `.studio:not(.ecosystem)`, щоб не змінювати кнопки іншої Studio;
- чотири рядки для порядку workspace після відкриття чернетки, включно з коментарем.

Інші product файли, JS-логіка, assets, кеш-версії та repo Playwright config не змінювалися. `tests/studio-e2e.spec.mjs` також не потребував змін: усі його сім тестів проходять, включно з offline shell.

На незалежній браузерній пробі після `document.fonts.ready` та миттєвого повернення в scrollY=0 CTA має top **730.95**, bottom **779.25** при viewport **412×850**; scrollWidth **412**. [Geometry JSON](e2e-reconcile-20261029/geometry.json), [до](e2e-reconcile-20261029/profile-before.png), [після на початку сторінки](e2e-reconcile-20261029/profile-after-top.png). Це браузерне вимірювання й власний огляд знімків, не оцінка іншої моделі чи фізичного телефона.

## Фінальні команди та кількості

```powershell
node --test web_launch/*.test.mjs web_launch/iceberg/*.test.mjs neon/*.test.mjs plan/v6/workflow/approval-boundary.test.mjs
node --test tests/pwa/*.test.mjs tests/i18n_ch/*.test.mjs
npx --no-install playwright test --config C:/sw/pw-chrome.config.mjs tests/browser-e2e.spec.mjs tests/studio-e2e.spec.mjs
git diff --check
```

| Набір | Pass | Fail | Skip | Доказ |
|---|---:|---:|---:|---|
| Головний Node, 739 tests | 738 | 0 | 1 наявний PG | [node-main.log](e2e-reconcile-20261029/node-main.log) |
| PWA + i18n, 43 tests | 43 | 0 | 0 | [node-pwa-i18n.log](e2e-reconcile-20261029/node-pwa-i18n.log) |
| Playwright, обидва specs | 39 | 0 | 0 | [playwright-final.log](e2e-reconcile-20261029/playwright-final.log) |
| Разом, 821 tests | **820** | **0** | **1 наявний** | Усі три команди exit 0 |

Тимчасовий `C:/sw/pw-chrome.config.mjs` імпортує repo config, зберігаючи workers/retries/serviceWorkers, і задає лише абсолютні test/output paths та системний Chrome:

```js
import base from './synera-design/playwright.config.mjs';
export default {
  ...base,
  testDir: 'C:/sw/synera-design/tests',
  outputDir: 'C:/sw/task1600-e2e-results',
  use: { ...base.use, channel: 'chrome' },
};
```

Фінальний запуск додатково задає `--output C:/sw/task1600-e2e-final`, щоб не перезаписати діагностичні artifacts. Середовище: Node **24.16.0**, системний Chrome **156.0.8078.73**. GitHub використовує Node 22 / bundled Chromium; цей звіт доводить запитаний локальний набір, а не новий віддалений CI run чи production readiness. SHA файлів і логів зібрано в [evidence.json](e2e-reconcile-20261029/evidence.json).

NEXT для Claude: переглянути два source diffs і цей звіт, включити зміни до свого commit та дочекатися віддаленого CI. Codex не робив commit/push. API `set_thread_title` у цій сесії відсутній; нумерацію 1600 повторно не резервували.

Models used: none (provider calls=0, USD=$0.00).
