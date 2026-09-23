# DESIGN + MAP AUDIT — «краще, як в оригіналі, і трошки краще» (2026-09-23)

Картка H, виконана локально після `Add credits` (16/13 за сесію). Усі числа — з диску цього дня.

## Дизайн-система: original vs launch

| Вимір | Оригінал | Launch | Вердикт |
|---|---|---|---|
| CSS | `web_launch/style.css` — 1816 рядків сырого CSS, 200 класів-селекторів (`^\.[a-z]`) | `web_launch/tokens.css` — **162 семантичні custom properties** + **146 compat-токенів** (`SYN_TOKEN_COMPAT_RESTORED`, 2026-09-23, див. Cycle 4 нижче; разом 308 унікальних властивостей, 385 рядків) | Семантичний шар ≥ оригінал — але cycle 4 довів, що до 2026-09-23 шар **не був підключений до рендеру**; виправлено |
| Motion | — | `prefers-reduced-motion` у tokens.css і style.css (по 1 блоку) | accessibility-перевага, якої оригінал не мав свідомо |
| Компоненти | немає каталогу | `web_launch/catalogue.html` — компоненти зі станами (default/hover/focus/disabled/loading/error — фаза 1 verify_cmd) | краще |
| WCAG | ручний | `token_forge` WCAG AA guard **12/12** (прогін 10:57); `a11y_audit.mjs` (axe-core/puppeteer) — CI-крок `ci.yml:40` (локально потребує puppeteer-chrome — чесно не фейкиться) | краще машинно-контрольовано |
| Cascade-теми | немає | event_theme з rollback <1s + consent-invariant (`event_theme.mjs:120-124`) | краще — оригінал не мав взагалі |

**Вердикт: «рівно + трошки краще» підтверджено диском** (токенизація, машинальні WCAG-гейти, каталог, reduced-motion). Відкритий гап до субъективного «краще»: C06.L1 brand sheet (голос, 3 ключові слова, заборони — письмово) — без нього впізнаваність не має документа.

## Мапа: що є і чого бракує

**Є (диск):**
- Шар підкладок: OSM + satellite (Esri/Maxar) з attribution (`map_style.mjs:7-8`).
- Ієрархія стилю `user > event > cohort > default`; **GEO-01: груба межа міста — точність нижче 15 км заборонена; live GPS — ніколи без гранту** (`map_style.mjs:3,13`).
- Маркер-токени у бренд-палітрі (`--color-bg-map-marker: #254f3b`, satellite: `#94ad66` — рядки 37-38), guard забороняє ключі `consent.*`.
- Opt-in OSM у UI з чесним попередженням «OpenStreetMap отримає IP і область перегляду. GPS не запитується» (`index.html:25`), zoom/reset-Цюрих тули (`app.mjs:496`).
- Тести map_style 11/11 (прогон 10:56).

**Гапи до «трошки краще» (продуктові, не архітектурні):** кластеризація маркерів при щільності, event heat-оверлеї (тематичні події на мапі), dark-tiles варіант у бренд-палітрі, підписи «пара → місце зустрічі», безперервна товщина стилю з cascade (тема → мапа в одному каскаді вже є технічно через event_theme).

## Вердикт

Дизайн: **рівно на рівні оригіналу машинально і краще структурно** (токени + гейти + каталог); мапа — легально-консервативна база (GEO-01, opt-in) з 4 продуктова-гапами. Обидва гапи — фаза-9 робота, не блокери запуску.

Evidence chain: числа з `py`-підрахунків 2026-09-23 11:10 (162/1816/200 — реперехід після виявлення неправильної атрибутації паралельного виводу rg: початкова цифра «200 токенів» виявилась кількістю класів style.css; коміт 95f1fba несе застаріле число в message — це зафіксовано чесно тут), прогони token_forge 12/12 + map_style 11/11, рядкові якорі map_style.mjs і index.html.

## Cycle 4 (2026-09-23) — «семантичний шар ≥ оригінал» було правдою про ФАЙЛ, не про РЕНДЕР

**Знайдено (DeepSeek V4 Flash Vision піксель-скан + локальний статичний var-аналіз):** style.css тримає 146 var()-посилань на raw-імена (`--color-<hex>`, `--radius-N`) з коміту `d28cbc6`; семантичний перезапис tokens.css (`c4a4210`, Phase 1 foundation) витер усі raw-імена, залишивши 146 посилань висячими → invalid at computed-value time → фон білий, інпути без рамок, радіуси нульові, 0 пікселів бренд-зелені на рендері. До того ж index.html/lab.html/legal.html взагалі не підключали tokens.css (тільки catalogue.html). Дві попередні перевірки цього не бачили: вони перевіряли структуру файлів, а не computed-стилі рендеру.

**Виправлено (цим комітом):** 146 визначень відновлено байт-точно з `d28cbc6:web_launch/tokens.css` → compat-блок `SYN_TOKEN_COMPAT_RESTORED` у tokens.css; tokens.css підключено до index.html, lab.html, legal.html (перед style.css); E2E-регресійний тест `SYN_TOKEN_WIRED_E2E` пінить computed-стилі (фон не browser-дефолт, `--color-254f3b` розв'язується, інпут має рамку) — Playwright **10/10**.

**Доказ:** піксель-скан після фіксу — бренд-зелень фізично в рендері (index 118, catalogue 681 семплів проти 0 до); vision-verify: B1 порожній пароль-бенд, B2 email без рамки, B3 інвертована ієрархія контролів, B4 невидима Primary Button в каталозі, B5 стайр-кейс квадратних quiet-кнопок, B9 нуль зелені — усі RESOLVED.

**Known residuals (фаза-9 поліш, НЕ регресії фіксу; WCAG 1.4.3 exempt для disabled):** N1 «Забув пароль» label ~1.5:1 (disabled fieldset); N2 «Запам'ятати…» ~2.6:1; N3 рамки інпутів #DFE7E1 ~1.26:1 (non-text, нижче 3:1); N4 два різні disabled-токени (index vs catalogue); N5 hover/focus станів Primary піксельно нема; N6 quiet-pill межа на панелі #F5F7F4. TODO(C06): мігрувати style.css на семантичні токени і видалити compat-блок.

## Cycle 5 (2026-09-23) — фаза-9 поліш N1–N6 виконано

**Роутинг хвилі (режим 99):** батько-оркестратор рахує контраст-математика WCAG локально ($0, скрипт у task_log) → хвиля 1 паралельно: GLM-5.3-Flash сабагент (імплементація, append-only в style/tokens + рядок catalogue) ∥ DeepSeek V4 Flash 0731 сабагент (E2E-тест на дизʼюнктному файлі) → батьківський bash-verify якорів → гейти: unit 412+1/0, Playwright 11/11 → хвиля 2: DeepSeek V4 Flash Vision Exp піксель-ревʼю 7 скріншотів (playwright-знімальник у test-results/phase9/, gitignored) → N3 INCONCLUSIVE за насиченістю рамки → токен підсилений `#75907f→#6f8779` (3.88:1 vs #fff, 3.60:1 vs panel) + E2E-очікування оновлено → 11/11 повторно.

**Застосовано:**
- `tokens.css` `SYN_PHASE9_TOKENS`: 5 семантичних токенів — `--synera-border-control: #6f8779` (N3/N6), `--synera-disabled-bg: #e6ebe7`, `--synera-disabled-text: #4e5f50` (5.66:1 на поверхні, 6.34:1 на панелі), `--synera-disabled-border: #b3c1b6`, `--synera-focus-ring: #19513e` (8.52:1, N5).
- `style.css` `SYN_PHASE9_POLISH` (64 рядки append-only, 1816 існуючих не рухались): рамки контролів ≥3:1; `focus-visible` 2px кільця для button/a/input/[tabindex] + input:focus кільце #31805a; 150мс переходи ховера (reduced-motion покриває transition: none існуючим блоком); N1/N2/N4 — `fieldset:disabled { opacity: 1 }`, підписи залишаються чіткими (`--synera-disabled-text` 6.34:1 на панелі), контроли отримують єдину disabled-поверхню замість opacity-гасіння.
- `catalogue.html:18`: `.disabled-demo` без opacity 0.5 (N4: одна система disabled через токени).
- E2E `SYN_PHASE9_A11Y_E2E` пинить computed-стилі ОБОХ станів (enabled-рамка + disabled-поверхня інпута/кнопки/fieldset + клавіатурне focus-кільце після Tab).

**Vision-вердикт (7 скріншотів):** N1/N2/N5/N6 RESOLVED; wow 7/10 («довірливо і не мертво»); зауваження про «півпрозорість» disabled-submit — не дефект (E2E довів opacity=1; це читабельний disabled-text за дизайном), розбіжність 01-vs-05 — race знімка проти app-init, не CSS. Токен border-control підсилений після ревʼю (сінаптична петля: vision INCONCLUSIVE → детермінована EV дія).

**Доказ:** 414 pass + 1 skipped / 0 fail (канон 412 + 2 approval-boundary), Playwright 11/11 (SYN_TOKEN_WIRED + SYN_PHASE9 обидва пинять computed-стилі), git-рівень — append-only, старі рядки style.css не рухались.

**Бонус-фікси цієї хвилі (не дизайн):**
- `plan/v6/workflow/approval-boundary.test.mjs` був мертвий: імпорти тікали за репо в неіснуючий `synera-docs-review-20260904/source` (FM-021-патерн абсолютизованого шляху) → відносні `../../../web_launch/…`; контрольний тест актуалізовано під транспорт SYN_OWN_APPROVAL_ONLY (GET re-read defense-in-depth + РІВНО один write) — безпековий інваріант «A не пише чужого погодження» зелений і далі.
- or_catalog refresh: 455 моделей live (2026-09-23 15:07).

**Лишається фаза-9 (не блокери запуску):** TODO(C06) міграція style.css на семантичні токени + видалення compat-блоку; мап-гапи (кластеризація маркерів, heat-оверлеї, dark-tiles); «disabled до валідності» для submit — рішення app-логіки, не CSS.