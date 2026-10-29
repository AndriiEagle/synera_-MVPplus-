# INTEGRATE · 29.10.2026 · task 1607

**PASS_LOCAL_WITH_STATED_LIMITS — I1–I6 прийняті локально як інтеграційна лінія.** Локальна інтеграція для review,
без commit/push/deploy/install, production SQL, зміни rollout flags чи платних викликів.
Реальні акаунти не відкриті. Це не юридичний допуск до запуску.

Власник цієї лінії: Codex у `C:/sw/synera-adaptive`,
`claude/synera-agents-20261029`, HEAD/base `a0e17ee3fdc1eb933441f0aa8a493b9f1626d8bc`.
Три прийняті входи: privacy `d589f74`, agents `3a28ef4`, graphics `2d564d8`.
Вхідні звіти та PLAN зафіксовані в [inputs.json](integrate-20261029/inputs.json).
Ілюстрації/іконки не створювалися й не замінювалися. Ця лінія володіє cache bump
за прямим уточненням Андрія; ілюстраційна лінія в іншому worktree не змінювалася.

## Поведінка й докази I1–I6

| Вимога | Було → стало | Код / предметний oracle |
|---|---|---|
| I1 · центр даних | Спільна оболонка мала центр, simulation обходила його → видимі header/footer links у публічній симуляції та приватному LAB, мовні варіанти; усі served HTML мають доступ | `privacy-common.mjs:20`, `simulation.html`, `simulation-living-ui.mjs`; `privacy-e2e` every shared page + `integrate-e2e` direct simulation links |
| I1 · журнал | `synera.journal.v1` відновлював старий профіль і стан без expiry, centre казав «лише пам’ять» → точний ключ/формат у inventory; purge до load/restore й на спільних сторінках; 30 днів від `at`, читання не продовжує; явно збережений профіль/стан описані чесно | `privacy-retention.mjs:15`, `journal.mjs:7`, `privacy-content.mjs`; mocked-time test старий+свіжий+другий load, browser old profile denial; VM mutation відхилена |
| I1 · erase/export | Повний scoped device export/erase вже впізнавав префікс ключа, але не був інтегрований у потоки → JSON містить журнал і state, з profile draft також незбережені поля; erase скасовує таймери/відкладену відповідь і прибирає in-memory draft | `demo-device-controls.mjs:10`, `simulation-entry.mjs`, `app.mjs`, `simulation-living-ui.mjs`; browser download readback, confirm cancel/accept, 6 секунд fake clock без resurrection; foreign-app storage збережене |
| I1 · приватний runtime | Helper існував окремо → `sessions.json` атомарно очищається при старті та перед записом, зі збереженням queue/STOP/consent gates | `tools/simulation-server.mjs:47`, `tools/simulation-server.test.mjs` runtime restart test: expired видалений, fresh незмінний, другий restart не подовжує дату, `.pending` відсутній |
| I2 · шість умов | Фіктивність була неоднаково помітна, була широка фраза «нічого нікому не надсилається» → sticky DEMO біля fictional surfaces/портретів, локальний JIT до першого тексту, прямі JSON/erase у simulation й profile draft, добровільний end prompt, hosting metadata disclosure; live AI OFF, відповіді за сценарієм | `demo-device-controls.mjs`, `site-shell.mjs`, `simulation-copy.mjs`, `summit.html/.mjs`, `real-journey-i18n.mjs`; no-write browser oracle, download/erase без входу, end keep/cancel, наявні scripted consent/decline/regression tests |
| I3 · кеші | `argon1` / simulation `20261020-v1` → `synera-shell-20261029-gilbert1`, `synera-studio-20261029-gilbert1`, `synera-simulation-20261029-gilbert1`; точні pins та inventory оновлені, попередні імена збережені в regression lists | `sw.mjs`, `studio-sw.mjs`, `simulation-sw.mjs`, `style-switcher.test.mjs`, `integrate-gilbert.test.mjs`; install/public dependencies + activation deletes old family only, чужий cache живе |
| I3 · офлайн-closure | Direct simulation не забезпечувала root privacy/legal navigation → її вузький worker збережений, root shell теж реєструється; нові served файли в allowlist і всіх потрібних SW lists; `addAll` отримує unique URLs | Unit public-list oracle + реальна direct simulation → privacy → legal → pilot consent після offline; окремо fresh static build/cache-only runner із вимкненим origin |
| I4 · документи | Старі pilot rules з неповним notice → окремий DE primary draft із повними UK/EN, Terms essentials, Impressum placeholders; стару policy version залишено в архіві | `legal-documents.mjs:67`, `legal-documents.css`, `legal.html`; [10 MUST checklist](integrate-20261029/notice-must-checklist.json), positive + removed-controller/transfer/human-review negative unit test і DOM coverage у трьох мовах |
| I4 · участь | Сторінки не було → `/pilot-consent.html`: паперова участь, 3 мови, operator/address/email/deletion placeholders, роздільні не відмічені опції, нічого не збирається через онлайн-поля | Browser перевіряє відсутність form/input/textarea та non-GET, axe, по 1 A4 PDF у DE/UK/EN; друк переглянутий у Chrome PDF viewer |
| I5 · операції | Загальні процедури → точний high-risk trigger/термін/канал, DSV Art.15 a–g, DPIA-A01, DPA checklist; зустріч із німецьким текстом, забороненими обіцянками та owner gates «хто/де/як довго» | [Ops](PRIVACY-BY-DESIGN-20261029.uk.md), [зустріч 30.10](GILBERT-MEETING-20261030.uk.md), `legal-notice.test.mjs` ops/meeting source coverage |
| I6 · приймання | Три component lanes → повний локальний набір із cross-lane repairs, скриншотами й source hash freeze | [acceptance.json](integrate-20261029/acceptance.json), [served source hashes](integrate-20261029/served-source-sha256.json); фінальні native codes/counts нижче |

## Правові межі та розбіжності

[LEGAL-RECONCILIATION.uk.md](integrate-20261029/LEGAL-RECONCILIATION.uk.md) явно
порівнює REPORT_A, REPORT_C і PLAN 28.10: demo/public registration, GDPR,
DE primary draft vs старі UK rules, Ohio vs proposed Frankfurt, старий Neon DPA
vs Databricks package, provider statements vs active DPF evidence, Auth/backup
deletion, 72-hour confusion, DSV logging, DPIA та Atelier vs dark/gold.

Кожен новий блок правових тверджень у продукті має URL і NEEDS_REVIEW або
EXPERT_REQUIRED; перевірені загальні regulator facts окремо позначені VERIFIED.
У цій сесії незалежно прочитані EDÖB information duty, DataBreach/guide v1.2 та
SECO Onlinehandel. Fedlex віддав JS-заглушку, повну актуальну DSV-редакцію через PDF
не вдалося отримати; provider account/DPA/DPF не перевірялися. Тому тексти є чернетками.
Чекліст доводить покриття тем, **не чинний контакт, реального контролера, виконання
договорів або юридичну достатність**. POLICY_VERSION не підмінено чернеткою.

Браузерне стирання не охоплює server records/Auth, HttpOnly cookies, інші вкладки,
downloads, чужі копії та приватний LAB runtime. Пошкоджений журнал зберігає оригінал
для експорту/явного стирання; невідомий формат не переписується. Межі видимі в
продукті/ops docs; повне real-account erasure лишається gate G7.

## Що зламалося під час перевірок і як виправлено

- До змін новий unit oracle відхилив неприбраний 30-day journal, head load і старий
  cache pin. Evidence: `journal-cache-before.tap` у пакеті доказів.
- Після merge нові privacy/legal literals обходили i18n coverage → додані справжні
  еквівалентні DE/UK/EN rows, виправлені змішані кириличні placeholders у DE/EN.
- Дубльовані URL у `cache.addAll` ламали install → dedup перед addAll, без усунення
  жодного asset. Simulation activate очищає лише свою стару cache family.
- Друга довга JIT-підказка в sticky composer перекривала result button → повідомлення
  залишено перед першим текстом, textarea посилається на нього через aria-describedby.
  Незмінений agents result-click oracle тепер проходить.
- Новий legal h1/архів спочатку порушили один h1/24px gutter і сховали more-modes →
  збережено спільний h1 й доступну навігацію, новий notice має власний h2.
- `get.html` втратив видимі Studio/journey links у попередньому злитті → вони повернуті.
  Інформаційна сторінка не створює language record від читання/вибору мови. Старий
  access spec тепер використовує чинний спільний `#site-language`, відкриваючи меню;
  no-JS check вимагає точну фразу «Відгук добровільний» у чинній UK copy. Адреси, одна primary CTA,
  no payment/API/storage, axe та інші behavioral assertions збережені; skip не додано.
- Stronger offline test спочатку вимикав мережу після активації лише вузького SW →
  тепер додатково вимагає активного root SW перед реальною offline навігацією. Перевірку
  offline сторінок не прибрано, фіксованого sleep замість readiness не додано.
- `android/twa-manifest.json` не був матеріалізований sparse checkout → відновлені
  точні байти `git show HEAD:android/twa-manifest.json`. Файл не змінено й install не було.
- Зовнішній `C:/sw/pw-chrome.config.mjs` був прив’язаний до **synera-design**. Локальний
  config використовує цей worktree, ту саму system Chrome і незмінені runner defaults.

Самоперевірки diff — не незалежна модель. Приймання тут роблять Node/VM behavioral
oracles, Chrome/Playwright, axe й actual cache-only navigation; hosted reviewer не викликався.
Negative control вимикає purge лише в isolated VM і отримує відмову, не змінюючи файлів:
[negative-controls.json](integrate-20261029/negative-controls.json).

## Команди й кінцеві результати

Відтворення з кореня цього worktree:

```text
node tools/integrate-acceptance-20261029.mjs
node tools/integrate-negative-controls.mjs
```

Runner виконує requested Node globs як точний список файлів (без пропуску tests),
PWA+i18n, simulation з dependency hook, **весь Playwright set**, header, fresh build,
offline-shell та a11y. Receipt записує команди, PID процесу, початок/кінець, native
exit code, SHA log і served source hashes до/після. Скрипт не підписує owner approval.

| Набір | Кінцевий результат / native exit |
|---|---|
| Node web_launch + iceberg + neon + approval-boundary | **779 PASS, 1 існуючий PostgreSQL SKIP**, fail 0; exit 0 |
| PWA + i18n_ch | **43/43 PASS**; exit 0 |
| Simulation server + runner (dependency hook) | **8/8 PASS**; exit 0 |
| Увесь Playwright: browser, Studio, privacy, graphics, simulation, product-access, INTEGRATE | **91/91 PASS**; exit 0 |
| Header layout | **12 cases / 108 checks PASS**; exit 0 |
| Fresh `node neon/build.mjs dist-neon-ci` | PASS, published false; exit 0 |
| Cache-only offline shell | PASS_CACHE_ONLY_OFFLINE_STARTUP; exit 0 |
| a11y audit | index і catalogue: **0 violations**; exit 0; нові privacy/consent перевірені також у browser specs |
| Source freeze | всі served SHA-256 однакові до/після, `served_source_unchanged=true` |

[Фінальна квитанція](integrate-20261029/acceptance.json): усі вісім етапів exit 0.
Після повного прогону no-JS assertion уточнено до точної чинної української фрази;
ізольований повтор цього тесту — 1/1 PASS, served code не змінювався.
Єдиний skip — існуючий disposable PostgreSQL integration через відсутній local PG target;
SQL behavioral acceptance не заявлено. Node/UA/scope точно зафіксовані у receipt.


Додатково виконано всі шість інших browser CI scripts: location, case-social-draft,
profile-erasure, audit-session-cookie, audit-paid-journey, simulation-browser — усі
exit 0. Python `test_simulation_provider.py`: 3/3 PASS; provider calls у симуляції — 0.
Node версія і межі поточного середовища є у receipt; GitHub CI/Node22, production
PostgreSQL й фізичні телефони ця лінія не видає за локальні результати.

## Телефони, друк, збереження оригіналів

`docs/integrate-20261029/shots/`: 12 full-page screenshots, iPhone 13 і Pixel 7,
home, simulation із відповіддю, journal, privacy centre, legal, pilot consent.
Усі переглянуті; default dark/gold, підписи фіктивності, читабельні controls, немає
горизонтального overflow; sticky banner у кадрах нормалізований scroll-to-top.
Це **Chromium UA emulation**, не Safari й не фізичний пристрій.

`print/pilot-{de,uk,en}.pdf`: кожен по одній A4 сторінці; PDF viewer screenshots
також переглянуті, текст/порожні підписи не обрізані. Заповнення тільки на папері.
Тести, які штатно перезаписують старі lane screenshots/receipts, не змінюють прийняті
оригінали в підсумковому diff: нові результати збережені в зоні INTEGRATE/tmp,
оригінальні tracked artifacts повернуті точними HEAD-байтами.

Сервери запускаються тестами як дочірні процеси й закриваються через збережений
child PID у finally/afterAll; ні process-name kill, ні чужі сервери не використовуються.
Живий readback після фінального прогону записаний у пакеті доказів.

## Власнику перед показом / реальним акаунтом

**NEXT · 10–15 хв:** заповнити операторські ім’я/адресу/email, місце й конкретні
feedback/consent строки в паперовій участі; пройти з телефоном список зустрічі.
Юрист перевіряє тексти. До будь-якого real account залишаються DPA acceptance,
notice publication/readback, погоджена участь, перевірена ручна deletion/Auth/backup
процедура, transfer basis, DPIA decision та решта технічних rollout gates —
точні owner/where/how-long у [GILBERT-MEETING](GILBERT-MEETING-20261030.uk.md).

Models used: none (provider calls=0, USD=$0.00).
