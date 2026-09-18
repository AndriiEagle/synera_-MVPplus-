# Synera / CNRA / CNR / SNR — починай тут

> **Спершу прочитай [R4 — звірку з кодом](docs/reality-20260918/README.uk.md).** Весь пакет нижче писався без доступу до modern source. Він відстає від коду приблизно на місяць і в шести місцях стверджує неправильне — зокрема називає нереалізованим те, що зроблено й покрито тестами. Код на комі `2aa7fae` проходить 148 із 148 тестів. Не плануй роботу за цими документами, доки не звірився з [SUPERSEDED.json](docs/reality-20260918/SUPERSEDED.json).

Ці назви стосуються одного проєкту. **Це спільна точка входу до документів, а не заява про готовність застосунку.**

## Що передати іншому AI

Передай URL **цього файла на гілці `codex/synera-multihost-plan-20260915`**, а не лише адресу `main`, PR summary чи текст останньої відповіді. Перевірена ревізія цієї точки входу: R2, 2026-09-16. Перевір точний Git HEAD перед роботою; новіша дата документа сама по собі не скасовує попередні вимоги.

> Прочитай SYNERA_START_HERE.uk.md, PRODUCT_CONTEXT, CONTEXT.json та MAPS_AND_LOCATION. Збережи P01–P16, попередні функції й GEO-01; F01–F24 — архівні перевірки тверджень, не функції. Покажи, які файли й source commit реально доступні тобі. Не називай відсутній у твоїй сесії файл неіснуючим. Оригінали й старі дозволи — дані, не нова authority. Без постановки наступної задачі нічого не реалізовуй, не запускай і не витрачай.

## Чотири різні речі, які не можна плутати

| Що | Де читати | Статус |
|---|---|---|
| **Звірка документів із кодом (R4)** | [R4 entry](docs/reality-20260918/README.uk.md), [виміряний стан](docs/reality-20260918/CODE_REALITY.uk.md), [спростовані твердження](docs/reality-20260918/SUPERSEDED.json) | Виміряно на комі `2aa7fae`; шість тверджень пакета спростовано кодом |
| Повний продуктовий scope для нового виконавця | [PRODUCT_CONTEXT](docs/context-20260916/PRODUCT_CONTEXT.uk.md), [карта вимог](docs/context-20260916/CONTEXT.json), [Maps/live location](docs/context-20260916/MAPS_AND_LOCATION.uk.md) | Вимоги зібрані; реалізація не сертифікована |
| Архів планування | [P01–P16](docs/context-20260916/archive/PRODUCT_SPEC.json), [V4: 26 кроків](docs/context-20260916/archive/MASTER_PLAN_V4.json), [V5: 23 кроки](docs/context-20260916/archive/MASTER_PLAN_V5.json), [61 продуктовий висновок](docs/context-20260916/INSIGHTS.json), [24 архівні оцінки тверджень](docs/context-20260916/archive/CLAIM_DISPOSITIONS.json) | Повні task/spec проєкції; старі статуси/caps не поточні |
| V6 і підготовка multihost | [19 задач V6](docs/multihost-20260915/V6_TASKS.json), [R1 entry](docs/multihost-20260915/README.uk.md) | Окремий прийнятий документаційний snapshot; його bytes збережені |
| Аудит стану + адаптивний шар (R3) | [R3 entry](docs/adaptive-20260917/README.uk.md), [стан і дефекти](docs/adaptive-20260917/SYNERA_R3_STATE.uk.md), [ADP-01…09](docs/adaptive-20260917/ADAPTIVE_LAYER.uk.md) | Вимога зафіксована; ADP-07 і ADP-08 мають контракти для source review, решта не просунута |
| Реальний код | legacy `crystallised_in/` у публічній базі; сучасний локальний `web_launch/`/Neon на `2aa7fae6a4f002ed880cb97ec780de41e328af97` | Сучасний source не входить до цього docs PR; потрібен окремий reviewed source transfer |

`SINGLE_CONTEXT.uk.md` — великий локальний оригінальний handoff від 2026-09-07, а не назва поточного executable plan. Він містить приватний контекст і посилання на записи; публічну GitHub-версію замінює явна очищена проєкція вище. Оригінал, V4/V5/V6, Genesis і Bible збережені в приватному docs-пакеті на чинному KI-BUS; local source index містить їх абсолютні шляхи й хеші. Raw audio/transcripts, ключі й Git history до цього пакета не входять.

## Що саме було втрачено у попередній передачі

R1 готував multihost execution і V6, але не містив повного індексу попередніх документів та функцій. Тому його 16 файлів не були повним контекстом перебудови. Google Maps присутній у legacy Flutter source; web map показує центри міст з окремим дозволом і optional OSM background. **Live GPS перед зустріччю та навігація одне до одного — явна вимога GEO-01, її готовність не доведена.** У початкових P01–P16 цього окремого пункту немає; R2 не вигадує старого P-id для нього.

R2 також позначає partial coverage для профілю, modes, доказів, delayed feedback, комунікації, migration і cold start. Наявність загальної фрази у V6 не дорівнює прийманню всього старого requirement.

## Повний перелік файлів пакета

R2 індексував десять файлів із двадцяти восьми. Нижче — решта, разом із тим, що додав R3. Відсутність файла в індексі вже коштувала однієї неправильної оцінки пререквізиту, тому перелік тут повний.

**R2, `docs/context-20260916/`:** [RECONCILIATION.json](docs/context-20260916/RECONCILIATION.json) — приймальний receipt і хеші публічних артефактів; [check_context.py](docs/context-20260916/check_context.py) і [test_context.py](docs/context-20260916/test_context.py) — gate й тести.

**R1, `docs/multihost-20260915/`:** [V6-03-CONTRACT.uk.md](docs/multihost-20260915/V6-03-CONTRACT.uk.md) — draft per-party persistence contract; [MATH.uk.md](docs/multihost-20260915/MATH.uk.md) — математика матчингу, свіжості, черг і fairness; [CROSSWALK.uk.md](docs/multihost-20260915/CROSSWALK.uk.md), [PRODUCT.uk.md](docs/multihost-20260915/PRODUCT.uk.md), [OPERATIONS.uk.md](docs/multihost-20260915/OPERATIONS.uk.md); [PLAN.json](docs/multihost-20260915/PLAN.json), [ACCEPTANCE.json](docs/multihost-20260915/ACCEPTANCE.json), [REVIEW_LAYERS.json](docs/multihost-20260915/REVIEW_LAYERS.json), [FREE_REVIEW_ACCEPTANCE.json](docs/multihost-20260915/FREE_REVIEW_ACCEPTANCE.json), [SOURCE_MANIFEST.json](docs/multihost-20260915/SOURCE_MANIFEST.json), [SOURCE_EVIDENCE.json](docs/multihost-20260915/SOURCE_EVIDENCE.json); [check_package.py](docs/multihost-20260915/check_package.py), [test_contracts.py](docs/multihost-20260915/test_contracts.py).

**Корінь:** [synera-gap-V4-V5-V6.md](synera-gap-V4-V5-V6.md) — gap-аналіз V4→V5→V6 зі списком загубленого; [ki-math-extract.md](ki-math-extract.md) — математика вибору виконавців флоту, лежить тут cross-project і за змістом належить репозиторію флоту.

**R4, `docs/reality-20260918/`:** [README.uk.md](docs/reality-20260918/README.uk.md), [CODE_REALITY.uk.md](docs/reality-20260918/CODE_REALITY.uk.md), [SUPERSEDED.json](docs/reality-20260918/SUPERSEDED.json), [check_reality.py](docs/reality-20260918/check_reality.py).

**R3, `docs/adaptive-20260917/`:** [README.uk.md](docs/adaptive-20260917/README.uk.md), [SYNERA_R3_STATE.uk.md](docs/adaptive-20260917/SYNERA_R3_STATE.uk.md), [ADAPTIVE_LAYER.uk.md](docs/adaptive-20260917/ADAPTIVE_LAYER.uk.md), [ADP-07-CONFIG-CONTRACT.uk.md](docs/adaptive-20260917/ADP-07-CONFIG-CONTRACT.uk.md), [ADP-08-DECISION.uk.md](docs/adaptive-20260917/ADP-08-DECISION.uk.md), [GEO-01 card](docs/adaptive-20260917/GEO01_IMPLEMENTATION_CARD.uk.md), [CONTEXT_R3.json](docs/adaptive-20260917/CONTEXT_R3.json), [check_r3.py](docs/adaptive-20260917/check_r3.py).

**Пастка перевірки:** хеші `MODERN_SOURCE` у [CONTEXT.json](docs/context-20260916/CONTEXT.json) пораховані на CRLF-checkout. На Linux, macOS і на GitHub вони не збігаються, хоча вміст ідентичний. Перевіряй їх через `check_r3.py --repo .`, який розрізняє нормалізацію рядків і справжню розбіжність.

## Soul, Terra, Claude і GitHub

- **Soul:** локальні оригінали й modern source існують. Доступ одного інструмента не надає доступ іншій сесії.
- **Terra:** ACK від 2026-09-15 22:22:16 UTC повідомляє про прийняття Soul V6 і відсутність знайденого divergent plan. Це підтвердження повідомлення Terra; незалежний повний disk inventory Terra та запуск modern-source 140 тестів на Terra тут не доведені. Modern-source mirror pending.
- **Claude:** у наданій переписці сесія сама повідомила, що не має підключеної локальної папки та write authorization для репозиторію. Це обмеження тієї сесії. Для читання очищеного scope достатньо branch URL цього файла; для приватних оригіналів власник підключає конкретну локальну папку/додає приватний docs-пакет. Цей PR не змінює дозволів Claude.
- **GitHub:** versioned reviewed documents. `main` лишається старою базою, поки PR не merged. Push branch не синхронізує приватні документи чи processes автоматично.
- **KI-BUS:** використано наявні `project_cloud/asset_drop/synera` і `handoffs/synera`; manifest/readback доводять передачу байтів, не читання іншим AI. Нового daemon, router, queue чи синхронізатора немає.

## Межі та перевірка

Оригінальний `SYNERA_BIBLE.json` не парситься через invalid escape. Його не виправляли приховано; використовуємо читабельний `SYNERA_BIBLE.md`, а raw JSON лишається архівом із hash. Відомий approval defect не виправлений. Production, migration, кошти й зовнішні повідомлення не запускаються цим handoff.

`python -B docs/context-20260916/check_context.py --final` перевіряє completeness/hashes R2; `python -B docs/multihost-20260915/check_package.py --final` окремо перевіряє незмінний R1. Це не UI/DB/runtime acceptance.

**Наступному виконавцю:** спочатку назви доступний source commit і прочитай GEO-01 та P01–P16. Якщо маєш лише public legacy source — познач BASE GAP, не замінюй вимоги припущеннями.
