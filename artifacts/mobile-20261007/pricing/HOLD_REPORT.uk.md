# Доступ і ціновий сценарій Synera — 07.10.2026

**IMPLEMENTED / BROWSER_ACCEPTANCE_INCOMPLETE.** Поточний bounded прохід завершено за вказівкою parent через системне зависання локальних процесів. Після правки немає завершеного GREEN, screenshot acceptance або mutation acceptance. Не публікувати цей пакет як перевірений мобільний реліз.

Source chat: `01a115a3-4a6e-7b71-9993-f68760e454af`, title `94. Synera: доступ і ціновий сценарій для Гілберта — 07.10.2026`.
Checkout `C:/Users/Andrii/Desktop/synera-premium-pwa-variant`, branch `codex/synera-product-20261002`, inspected starting HEAD `a284a1eda34a85b658cf03ec2dd3a1fbfcb2cad8`.

## Реалізований результат

- `web_launch/get.html`: один основний вхід у наявний пілот; CHF 0 і відсутність картки поряд із входом. Studio та повний демоцикл збережені окремими другорядними посиланнями. Android-only Studio wording прибрано.
- `web_launch/product-access.mjs`: нові блоки англійською, німецькою й українською. Наявні ключі й логіка перемикання мов збережені. Статичний HTML має повний англійський fallback без JavaScript.
- `web_launch/summit.css`: лише додані правила з префіксом `.access-page`; чинні shared правила не переписано.
- Поточний безкоштовний доступ та **майбутній сценарій, який не продається**, розділені. CHF 12/місяць; до 10 AI-запитів на людину; окремий явний вибір після умов; без автоматичного продовження чи списань; сценарна межа витрат CHF 12, пауза після ліміту без доплат; додатковий бюджет потребує нового вибору.
- Відгук добровільний, пропонується особисто обговорити корисність/ціну. Форми, відправлення відповіді, checkout, донатів, нових API-викликів або сховища не додано.

## Походження сценарію й межі

Прочитано `artifacts/pilot-wave-20261005/REPORT.uk.md`, `COHORT_DECISION.uk.md` та пов'язаний `artifacts/zurich-pilot-model-20261005/REPORT.uk.md` і `inputs.json`.

`economics.basic_price_month=12`; allowance = `free_user_ai_requests_month=2` + `basic_extra_ai_requests_month=8` = **10**. Ці числа є припущеннями попередньої моделі, не затвердженими тарифами, доведеними витратами, готовою AI-функцією або підтвердженим попитом. Новий текст про ліміт/паузу описує запропоновані майбутні умови, а не реалізований billing guard. Модельний CHF29 рівень не перенесено на сторінку, щоб один приклад залишався зрозумілим. Грошові та live gates не змінені.

## Перевірено / не перевірено

1. **Semantic RED до зміни**: `RED.txt` і `red/product-access-Access-journey-en-at-320/error-context.md`. Справжній Chromium через наявний `web_launch/server.mjs --demo` знайшов **3** primary links замість **1**. Це дефект ієрархії, не snapshot нового тексту.
2. **Перший bounded review**: переглянуто фактичний diff і origins/links; один primary live link, демо й live розділені; не змінено auth/consent/Current/Atelier. `git diff --check` для трьох продуктових файлів завершився без whitespace errors (лише Git LF/CRLF warnings).
3. **Preservation readback після правок**: `web_launch/journey-ui.mjs` SHA256 = `68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b`, збігається з наданим parent. Чужі untracked не редагувалися. Commit/push/deploy не виконувалися.
4. **GREEN не завершений**: `GREEN.txt` містить тільки запуск 10 tests / 1 worker. Процес перервано після зависання до браузера; це не PASS.
5. **Обмежений probe**: команда нижче повернула `Timed out waiting 45s for the test suite to run`, потім teardown timeout; `1 did not run`. `probe/.last-run.json` збережений. Немає підстав називати це дефектом сторінки або підтвердженим root cause.
6. **Змінений спосіб запуску**: `browser-acceptance.mjs` використовує той самий canonical server і той самий oracle `tests/product-access-checks.mjs`, але в одному Node-процесі без Playwright worker. Перший старт мав помилку relative import; шлях виправлено. Повтор не повернув результату під час системного зависання; він теж не PASS. Окремий діагностичний import canonical server раніше надрукував локальний URL, після чого його власний процес завершено.
7. **Другий review / mutation**: semantic mutant `demo-primary` підготовлений у спільному oracle (повертає демо primary-class через interception HTML), але **не виконаний** через той самий незавершений runtime. Немає завершеного adversarial proof після зміни.

Тести підготовлені для EN/DE/UK × 320/390/1440, розкриття обох інструкцій, відсутності horizontal overflow, порожніх перекладів, storage/API/external sends, відсутності checkout/form, axe WCAG2/2.1 AA, переходу основною кнопкою в локально перехоплений pilot fixture та no-JS fallback. Це перелік oracle, **не результати**. Навіть майбутній PASS не доводитиме фізичний Android, live login, оплату чи попит.

## Точні команди для parent

У зазначеному checkout, після відновлення локального runtime, лише один прогін за раз:

```powershell
node artifacts/mobile-20261007/pricing/browser-acceptance.mjs
# Очікуваний output: ACCEPTANCE.json + screens/access-{en,de,uk}-{320,390,1440}.png.
# Потрібен фактичний перегляд знімків перед acceptance.

$env:SYNERA_ACCESS_MUTATION = 'demo-primary'
node artifacts/mobile-20261007/pricing/browser-acceptance.mjs
Remove-Item Env:SYNERA_ACCESS_MUTATION
# Очікуваний exit 1 з MUTATION.json: primary count 2 замість 1.

node node_modules/@playwright/test/cli.js test tests/browser-e2e.spec.mjs --grep 'Presentation leads to real app access|Phone access stays functional' --output artifacts/mobile-20261007/pricing/regression --global-timeout 90000
```

Альтернативний стандартний runner того самого oracle:

```powershell
node node_modules/@playwright/test/cli.js test tests/product-access.spec.mjs --output artifacts/mobile-20261007/pricing/green-rerun --global-timeout 150000
```

Виконаний failed probe:

```powershell
node node_modules/@playwright/test/cli.js test tests/product-access.spec.mjs --grep 'Access journey en at 320' --output artifacts/mobile-20261007/pricing/probe --timeout 20000 --global-timeout 45000
```

Ownership для parent commit: три продуктові файли вище, `tests/product-access.spec.mjs`, `tests/product-access-checks.mjs`, `artifacts/mobile-20261007/pricing/`. Root task_log не змінювала через обмежений ownership; parent може включити цей результат в один загальний запис.

Canonical serious-preflight: NEEDS_REVIEW / MANIFEST_SHA256_MISMATCH / NEEDS_SCOPE, hosted dispatch=false. Використано вузькі локальні source reads; глобальний cache не переписувався. IMDP не застосовувався: задача не відповідає контракту малого Python edit.

**NEXT (10–15 хв після відновлення runtime):** один браузерний прогін, перегляд mobile/desktop screenshots, mutant, дві наявні access regression groups; лише після цього parent приймає/комітить scope.

На момент фіналізації Ctrl+C надіслано власним exec sessions `58036` (single-process browser runner), `1738` (process/readback query), `34828` (diff/check query). Завершення цих трьох процесів інструмент ще не підтвердив. Не дублювати runner до reconciliation. Раніші sessions `66333`, `28988` завершилися після Ctrl+C, `86654` завершилася exit 1 за timeout; `63436`, `41137` завершилися exit 0. Це session IDs інструмента, не OS PIDs.

Models used: none (provider calls=0, USD=$0.00). Codex subscription savings не вимірювались.
