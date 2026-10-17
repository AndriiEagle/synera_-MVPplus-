# Synera Studio 04 — прийнятий результат і живий запуск

**Оновлення v5:** [повторна перевірка й approval](APPROVAL_AND_RISK_RECHECK.uk.md). Виправлено офлайн `/studio` на публічному host; 2 unit і 7 зачеплених browser тестів PASS, native deployment `succeeded`. Джерело v5 `e3ceecca3d7ba0272577efce0cae5c16cae34edb`, deployment `appgdep_6abfc2d042cc8191883269a24ebd99ab`. Нижче — збережене приймання v4. Вхід у Neon/Cloudflare вже підтверджений; production recovery/migrations/rollout ще ні.

## NOW: окремий встановлюваний локальний режим

[Studio 04](https://synera-summit-20261001.andypokr911.chatgpt.site/studio.html) опублікована у наявному Site, версія 4, deployment `appgdep_6abfae3b5f948191a5fc61e9abfdf709`, native `succeeded`. Site source: `62b074e019d7e53cf93a3f6684bf63a5b3a1d8d3`. Попередня презентація, Triangle L, Atlas та main workspace залишилися. Код лежить у `web_launch/studio*`, нові pure модулі зареєстровані в `assets.mjs`; серверний bilateral store не змінювався.

| Етап | Працює зараз | Межа |
|---|---|---|
| Знайомство | Пояснення give/need в обох напрямках, мови й добровільних побажань | Вигадані профілі, без semantic AI чи психологічної діагностики |
| Сесія | 2–3 людини як локальні labels, точні нотатки, пропозиція місця/дати, окремі відповіді | Один пристрій; імена не автентифіковані |
| Рішення | Current revision, явні yes/no; резервний вибір лише якщо людина заздалегідь його записала | Не бронювання, оплата, підтвердження участі або юридична угода; зміна очищує записи |
| Результат | Історія фактів, окремі підтвердження кожної поточної версії; revoke закриває draft | Підтвердження на спільному екрані не доводять правдивості чи незалежності осіб |
| Соціальний пакет | Приватна текстова чернетка, джерела фактів, SVG-картка, копіювання публічного посилання | Немає auto-post, чужих фото/тегів чи приватних session links |
| Пам’ять | Original text, source IDs, timestamps, переносний JSON/GZIP, digest, preview/import, exact-quote search | Пошук у поточній сесії; без автоматичного профілювання через інші сесії |
| Пристрій | Опційна копія в IndexedDB після окремого дозволу, відкрити/видалити, максимум 20 копій | Plaintext, може бути стертий браузером; не cloud backup, auto-save чи sync |
| Android / iPhone | Окремий PWA manifest `/studio.html`, narrower SW scope `/studio`, офлайн public shell | Без APK/IPA/store, фізичне встановлення ще не прийняте |

## Дані та економія

[DATA_AND_MATCHING_REALITY.uk.md](DATA_AND_MATCHING_REALITY.uk.md) зв’язує поточні ProfileStore/Neon/SQL контракти та оригінальний Firebase код. Новий Site не має бази акаунтів. У Studio поточні записи в пам’яті вкладки; після явного збереження — на пристрої. Файл містить originals/history, GZIP зберігає точні байти. Переклад чи резюме не називаються lossless. API/subscription token savings не виміряні.

## Приймання

- Canonical Node: **479 PASS, 1 SKIP, 0 FAIL** (`unit.txt`). SKIP — старий optional PG runner, не proof live DB.
- Browser: **36 PASS** (`browser.txt`), включно з preserved workspace/стилями, draft/revoke, exact archive roundtrip, broken digest refusal, opt-in device restore та offline reload.
- `tools/studio-acceptance.mjs`: 5 станів без WCAG axe violations, mobile/desktop screenshots inspected, 0 external requests; guard-removal mutation дозволяє unilateral draft і відхиляється незалежним оракулом.
- Public Site source/archive readback збігається з saved version 4. Локальний Neon ZIP — 67 файлів, SHA-256 `447d7a92a6533bc267475a3fdf73e0d76abba87cc945386cd5c8856fbb1fdc39`; **не deployed**.

Повторення потрібних перевірок:

```text
node --test web_launch/*.test.mjs web_launch/iceberg/*.test.mjs neon/*.test.mjs plan/v6/workflow/approval-boundary.test.mjs
node node_modules/@playwright/test/cli.js test tests/browser-e2e.spec.mjs tests/studio-e2e.spec.mjs
node tools/studio-acceptance.mjs
```

## PARKED: потрібні інтеграції для повноцінного продукту

1. Наявний Neon/Cloudflare: підтвердити доступ, фактично застосовані міграції та recovery point. Новий location package/KV/live rollout мають окремий план у `START_HERE.uk.md`; копія локального тесту не є production migration.
2. Google карта: потрібні реальний Cloud project ID, restricted key, увімкнені SDK/Routes й погоджений бюджет/quotas. Зараз лише схематична карта та власний клік Maps URL. Проєкт і бюджет ще не надані.
3. Груповий зал: серверна identity/ACL для 2–3 людей і гостей, синхронізація ревізій/таймерів, consent-aware media transport. Запис/публікація потребують окремих дозволів; автоматичне редагування голосу без власного preview не допускається.
4. AI асистент: погоджена provider/model/cap/data-boundary, receipt-backed runtime acceptance; жодних гарантованих emotion/lie detectors, hidden personality diagnosis чи неперевірених швидкостей. Поточні правила L не є підключеним AI.
5. LinkedIn/Instagram/Meetup: official scopes/app approval/source provenance, тільки дозволені дані, preview перед публікацією чи запрошенням. Готова чернетка не означає API інтеграцію.
6. Пошук по реальній спільноті: baseline hard gates + дозволені self-declared preferences; semantic candidate retrieval оцінити на permission-scoped held-out випадках. Приховані профілі та приватні поля не стають публічними від персоналізації.
7. Ціна: тимчасово CHF 0, без картки й auto-upgrade. Майбутні платні пакети — гіпотези у `L_DIRECTION_AND_ECONOMICS.uk.md`, не затверджені тарифи.

## NEXT — 10 хвилин на власному Android

Відкрий Studio у Chrome, встанови з меню, створи сесію для двох, внеси точну нотатку й факт, підтвердь обома локальними кнопками, експортуй архів, явно збережи копію та повторно відкрий її офлайн. Це перевіряє твій телефон; живу співпрацю незалежних акаунтів перевірятимемо окремо після конфігурації серверних інтеграцій.

Нових зовнішніх AI-provider викликів: 0, USD $0.00. Три паралельні внутрішні напрями роботи не є доказом нульового споживання підписки.
