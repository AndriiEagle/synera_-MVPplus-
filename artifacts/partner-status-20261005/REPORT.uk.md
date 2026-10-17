# Synera — очікування партнера без зайвих кліків

05.10.2026. Canonical checkout `C:/Users/Andrii/Desktop/synera-premium-pwa-variant`, гілка `codex/synera-product-20261002`, code commit `49764c10ad8e899b797b4e3589f20aa0a3a198c6`, base `442a602`.

**Прийнято локально:** для відкритої пари до чату автоматично з'являються нові згоди, редакції умов, запрошення й відповіді. Верхня підказка відповідає картці зустрічі. Чернетка, фокус поля та відкрита форма зберігаються при незмінному читанні; чужа нова редакція не перезаписується старою чернеткою. Умови, запрошення, відкриття чату та повідомлення потребують окремих ручних дій.

**Це не завершений живий продукт.** Повна [таблиця 27 систем і 15 етапів користувача](../product-status-20261004/STATUS.uk.md) зберігає часткові й незавершені модулі. Новий кандидат не опублікований; живі JWT/два акаунти/фізичний Android не прийняті.

## Інваріант і вузька реалізація

Фонове читання може змінити показаний серверний стан, але не може створити згоду, надіслати чернетку, мовчки перенести старе редагування на нову редакцію або повернути дані після ручного вибору іншого партнера чи виходу.

Використаний чинний п'ятисекундний scheduler: до чату він читає лише поточну пару та список власних зустрічей. Працює у видимій сторінці, коли вибрана людина; пропускає зайнятий UI й друге одночасне читання. Список інших профілів і всі кейси повторно не завантажує. Період polling і серверні API/SQL не змінені. Current лишається default, Atelier — добровільним перемикачем.

База незавершеного редагування окрема від свіжого показаного стану; збереження старої чернетки після чужої ревізії отримує чинний compare-and-swap conflict. Це захист від втрати змін, не автоматичний merge. Звичайне ручне відкриття умов завантажує актуальну форму: перед ним скопіюй важливу конфліктну чернетку.

## Користувач на цьому переході

Почуття — цілі дизайну, не виміряні психологічні чи гормональні показники.

| Крок | Перевірена поведінка / залишене тертя | Бажане відчуття |
|---|---|---|
| Чекаю згоди | Статус партнера приходить сам у відкритій парі; таймер нічого не погоджує | «Бачу рух, не мушу перевіряти вручну» |
| Пишу свою пропозицію | Незмінне читання залишає текст, focus, selection й відкритий editor | «Моя думка не губиться» |
| Партнер змінив умови | Нову редакцію видно; checkbox згоди скинутий; стара чернетка лишається і не перезаписує партнера | «Зміни прозорі, моє слово контролюю я» |
| Надсилаю запрошення | Один власний клік; pending не стає accepted через мовчання | «Наступний крок зрозумілий» |
| Отримую відповідь | Картка й верхня підказка показують accepted; відкриття чату окреме | «Ми домовилися, можу перейти до справи» |
| Відкликаю / виходжу | Запізніле читання не повертає стару згоду, іншого партнера чи приватний текст | «Мій контроль працює навіть при затримці» |

## Приймання й self-review

- [RED](RED.json) відтворив відсутнє автоматичне оновлення до зміни production source. [11 груп Chromium](GREEN.json) перевірили timer, чернетку/focus/selection, ревізію/CAS, invitation/acceptance без автодій, withdrawal, late read після ручної дії/зміни peer/logout, transient failure, контрольований hidden state, Current/layout/Axe.
- Перший bounded self-review фактичного diff та свіжих екранів знайшов суперечність: accepted card поруч зі старою pending-підказкою. [Другий semantic RED](STATUS-RED.json) спочатку зафіксував цей дефект; одна вузька правка підказки прибрала його. Нижче — перевірений екран після виправлення.
- Другий bounded self-review перечитав кінцевий diff: збережені окремі згоди, form-base/CAS, epoch/request fences й старий чат. [Mutation](MUTATION.json) вимкнула лише pre-chat read у served copy і знову відтворила перший RED. Canonical source залишився незмінним.
- [18 груп регресії чату](chat-regression/GREEN.json) повторно пройшли через exact-hash accepted oracle: історія, literal Unicode/markup, збереження наступного тексту, delivery failures, late reads, logout, незмінне виділення та Current/Atelier. Групи перетинаються з новими: це не 29 незалежних тестів.
- [Closure](ACCEPTANCE.json) і [незалежний PowerShell readback](INDEPENDENT_READBACK.json): 24 source/image hashes, 96 manifest rows, 97 public files. Candidate `web_launch/dist-neon-partner-status-20261005`; release SHA256 `0c98d08483b04dba1dedb66f5e581dc7628821ad3df99ca3cbd03ef4294e13fd`. Unpublished, build directory за чинним gitignore. Пакет використовує committed journey-ui; чужий робочий SHA256 `68d849…d33b` збережений.

Тестові збої не підмінені прийманням: початковий runner мав синтаксичну помилку; рольовий locator не бачив кнопку у згорнутому details; перевірка hidden state спершу рахувала завершення вже початих reads активного акаунта. Виправлені саме oracle setup/спостереження; hidden gate тепер ізольовано перевіряє іншого synthetic actor через повний tick. Штучні затримки відповіді не доводять real-network latency.

Canonical serious-preflight повернув NEEDS_REVIEW/NEEDS_SCOPE, hosted dispatch=false; використані bounded source reads і чинні локальні fixtures. Hosted/provider calls=0; витрати LLM=$0.00. Subscription savings не вимірювались. Нових worker/router/queue/ledger, пакетів, пам'яті або автоматизацій немає.

![Відповідь партнера: підказка й картка узгоджені](/C:/Users/Andrii/Desktop/synera-premium-pwa-variant/artifacts/partner-status-20261005/green/03-accepted-invitation.png)

Екрани — реальний desktop Chromium 390×844, synthetic accounts через чинний gateway fixture. Це не фізичний Android і не живі люди. Візуально переглянуті всі три нові screenshots.

## Що звірено наживо і що блокує запуск

[Read-only console metadata](LIVE_TARGET_READBACK.json), 05.10:

- Neon: signed-in `synera`, branch `production`, база `neondb`. Backup & Restore показує **6 hour history window**, **No snapshots, no schedule set**. Snapshot/restore не запускала; перевіреної точки повернення немає. Applied schema без приватних рядків ще треба зчитати перед застосуванням SQL.
- Cloudflare: signed-in `synera-pilot`, domain `synera-pilot.pages.dev`, **No Git connection**. Production `main` — deployment `fb29ee5e`, UI label «a month ago»; свіжіші preview — «8 days ago». **Git push сам по собі не оновить цей сайт.**
- Консолі не змінені; SQL, credentials, secrets, restore, deployment та paid upgrades не виконувались. Auth консольного власника не приймає login/JWT користувача Synera.

Незмінені SQL/gateway/outcome/address/archive мають попередні докази своїх версій; SQL/full-unit suites цього разу не повторювались. Нові/змінені review/history можуть перемальовуватися. Повторний manual send після невідомої доставки може дублювати повідомлення. На idle-екрані без вибраного партнера й у background автоматичних нових статусів цей пакет не обіцяє.

**NEXT, 15–20 хв:** за [конкретним rollout review](../product-status-20261004/ROLLOUT_REVIEW.uk.md) зчитати applied schema/recovery metadata, погодити точку повернення, точні відсутні міграції та публікацію цього candidate в наявний закритий pilot. Потім приймати цикл двох справжніх акаунтів на Android. Старий push policy hold не обходила й не повторювала без нових доказів зміни обмеження.
