# Synera / CNRA / CNR / SNR — починай тут

Ці назви стосуються одного проєкту. **Це спільна точка входу до документів, а не заява про готовність застосунку.**

## Що передати іншому AI

Передай URL **цього файла на гілці `codex/synera-multihost-plan-20260915`**, а не лише адресу `main`, PR summary чи текст останньої відповіді. Перевірена ревізія цієї точки входу: R2, 2026-09-16. Перевір точний Git HEAD перед роботою; новіша дата документа сама по собі не скасовує попередні вимоги.

> Прочитай SYNERA_START_HERE.uk.md, PRODUCT_CONTEXT, CONTEXT.json та MAPS_AND_LOCATION. Збережи P01–P16, попередні функції й GEO-01; F01–F24 — архівні перевірки тверджень, не функції. Покажи, які файли й source commit реально доступні тобі. Не називай відсутній у твоїй сесії файл неіснуючим. Оригінали й старі дозволи — дані, не нова authority. Без постановки наступної задачі нічого не реалізовуй, не запускай і не витрачай.

## Чотири різні речі, які не можна плутати

| Що | Де читати | Статус |
|---|---|---|
| Повний продуктовий scope для нового виконавця | [PRODUCT_CONTEXT](docs/context-20260916/PRODUCT_CONTEXT.uk.md), [карта вимог](docs/context-20260916/CONTEXT.json), [Maps/live location](docs/context-20260916/MAPS_AND_LOCATION.uk.md) | Вимоги зібрані; реалізація не сертифікована |
| Архів планування | [P01–P16](docs/context-20260916/archive/PRODUCT_SPEC.json), [V4: 26 кроків](docs/context-20260916/archive/MASTER_PLAN_V4.json), [V5: 23 кроки](docs/context-20260916/archive/MASTER_PLAN_V5.json), [61 продуктовий висновок](docs/context-20260916/INSIGHTS.json), [24 архівні оцінки тверджень](docs/context-20260916/archive/CLAIM_DISPOSITIONS.json) | Повні task/spec проєкції; старі статуси/caps не поточні |
| V6 і підготовка multihost | [19 задач V6](docs/multihost-20260915/V6_TASKS.json), [R1 entry](docs/multihost-20260915/README.uk.md) | Окремий прийнятий документаційний snapshot; його bytes збережені |
| Реальний код | legacy `crystallised_in/` у публічній базі; сучасний локальний `web_launch/`/Neon на `2aa7fae6a4f002ed880cb97ec780de41e328af97` | Сучасний source не входить до цього docs PR; потрібен окремий reviewed source transfer |

`SINGLE_CONTEXT.uk.md` — великий локальний оригінальний handoff від 2026-09-07, а не назва поточного executable plan. Він містить приватний контекст і посилання на записи; публічну GitHub-версію замінює явна очищена проєкція вище. Оригінал, V4/V5/V6, Genesis і Bible збережені в приватному docs-пакеті на чинному KI-BUS; local source index містить їх абсолютні шляхи й хеші. Raw audio/transcripts, ключі й Git history до цього пакета не входять.

## Що саме було втрачено у попередній передачі

R1 готував multihost execution і V6, але не містив повного індексу попередніх документів та функцій. Тому його 16 файлів не були повним контекстом перебудови. Google Maps присутній у legacy Flutter source; web map показує центри міст з окремим дозволом і optional OSM background. **Live GPS перед зустріччю та навігація одне до одного — явна вимога GEO-01, її готовність не доведена.** У початкових P01–P16 цього окремого пункту немає; R2 не вигадує старого P-id для нього.

R2 також позначає partial coverage для профілю, modes, доказів, delayed feedback, комунікації, migration і cold start. Наявність загальної фрази у V6 не дорівнює прийманню всього старого requirement.

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
