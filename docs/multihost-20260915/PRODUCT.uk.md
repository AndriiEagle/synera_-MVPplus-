# Продукт, дизайн та дані

## Незмінне ядро

Перша користь — двоє солопідприємців знаходять взаємокорисну співпрацю і явно погоджують конкретну пробну роботу. Режими: exchange, paid_service, referral, hybrid, joint_project; barter не обов’язковий. Оплата, строки, deliverables, acceptance, IP/licensing, confidentiality, revision/cancellation terms явні. Запропонована робота не означає погоджену, здана — не означає прийняту; не вигадувати ставки чи результати.

Pair contract зберігається. Тристороння модель пізніше має окремі ролі, approvals, компенсацію та failure semantics; не додавати третього учасника в нинішній pair-case.

AI-помічник доступний біля конкретної функції: пояснити порівняння, запропонувати чернетку умов, показати missing information, допомогти імпортувати профіль. Він не погоджує умови за сторони, не відкриває контакти, не підписує, не ранжує цінність людей і не приймає чужі jobs. Кожна capability має allowlist inputs/effects, малий context, schema validation і відкат чернетки.

## Пропозиція дизайну для DE-CH

Спокійний світлий інтерфейс із чіткою типографічною ієрархією, достатнім повітрям і одним основним action на крок. Кольори — нейтральний фон, темний текст, стриманий синьо-зелений accent; стан ніколи не передається лише кольором. Це direction, не прийняті візуальні assets. Потрібні реальні макети та human review у V6-02/V6-08.

П’ять головних екранів: профіль → пояснення pair proposal → узгодження trial → стан виконання/приймання → результат/відкликання/експорт. Для кожного: loading, empty, validation error, offline, stale, expired, revoked, partial permission. Матеріальні зміни інвалідують погодження обох сторін. UI показує success лише після persisted readback актуальної версії.

Короткі чернетки тону: «Diese Angaben fehlen noch», «Bedingungen prüfen», «Freigabe widerrufen», «Änderung noch nicht gespeichert». Native DE-CH review не проведений. Прямота допомагає зробити наступну дію; без сорому, тиску, діагнозів, прихованого впливу чи використання особистих одкровень. Easter eggs опційні, вимикаються, не з’являються в consent, оплаті, помилках чи кризових повідомленнях.

Ціль accessibility — WCAG 2.2 AA з keyboard journey, visible/unobscured focus, 200% zoom, narrow viewport, reduced motion і перевіреними contrast ratios. [W3C: Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum) є джерелом focus criterion; automated scan не замінює ручну keyboard/assistive technology перевірку. Поточний пакет не заявляє WCAG conformance.

## Три рівні адаптації

| Рівень | Дозволена майбутня зміна | Захист |
|---|---|---|
| Персональний вигляд | layout density, contrast/theme, locale, reduced motion | Локальна настройка, preview/reset, не змінює дані інших |
| Профіль і аватар | user-confirmed поля та явна audience | Preview «що бачать інші», granular permission, rollback draft |
| Глобальний продукт | versioned presentation/schema allowlist | Compatibility contract, review, regression gates, окремий release |

AI не вставляє довільний runtime code, scripts, event handlers, remote URLs або змінені consent gates. Невідомі schema fields відхиляються/потребують підтвердження. Version mismatch не виправляється мовчазним downgrade. Prompt injection в імпорті залишається даними.

## Presets розкриття 0–5

Це пропозиція UX ярликів над незалежними permissions, а не scalar «рівень довіри». Користувач може вимкнути будь-який permission окремо; це не має позбавляти базової якості. Збільшення кількості даних не гарантує кращого match. Зміна preset показує точний diff і потребує підтвердження; не дає згоди заднім числом.

| Preset | Visibility | Comparison/matching | Introduction | External AI | Telemetry | Records |
|---|---|---|---|---|---|---|
| 0 Чернетка | тільки власник | off | off | off | off | локальна чернетка |
| 1 Мінімальний | псевдонім, підтверджені категорії | explicit opt-in minimal fields | off | off | off | мінімум для обраної функції |
| 2 Пошук | обрана audience | той самий opt-in | окреме рішення для кожної пари | off | off | case records за умовами |
| 3 Співпраця | тільки погоджена пара | тільки погоджена мета | bilateral, version-bound | off | off | мінімальні погоджені terms/outcomes |
| 4 Показ портфоліо | окремо обрані підтверджені приклади | без розширення автоматично | окремо на кожну пару | off | off | explicit audience/retention |
| 5 Власний набір | кожне поле окремо | окрема мета | окрема пара | окремий opt-in + provider/payload preview | окремий opt-in | окремі цілі та строки |

Псевдонім не гарантує анонімність: server/account/network metadata може залишатися. Contact visibility і matching permission різні. Revoked/expired permissions блокують нову обробку/інтро; cached UI та in-flight work повинні повторно перевірити актуальний grant перед effect. Вже розкриті іншій людині дані неможливо «забрати з пам’яті»; UI чесно пояснює межу.

`records` не дає одного blanket consent на все: визначаються purpose, fields, legal basis, controller/processor, retention, export/delete process, backups та можливі обов’язкові строки зберігання. Це питання privacy/legal review до pilot, не твердження про поточну юридичну відповідність. Export має перевіряти identity і не розкривати приватні дані іншої сторони. Delete/revoke має давати явний статус і перевірку dependent stores; не обіцяти миттєве стирання backup.

Matcher використовує minimal structured fields; імена, контакти і raw free text не потрібні. Import reuse: profile-import, chatgpt-transfer, profile-portability; archive bounds, field confirmation, duplicate semantics і no-network-before-consent. Economics reuse: consent-gated pseudonymous appendEvent, distinct case IDs; synthetic/real дані ніколи не змішуються.

## Майбутній agent-to-agent freelance

Окремо погоджений job → явні scope/terms/право делегувати/licenses/acceptance/compensation → bounded sandbox execution → незалежне приймання → дозволений compensation flow. До роботи перевіряються права на дані й код та сторона, уповноважена погоджувати. AI не підміняє людину-підписанта, не обіцяє дохід і не залучає названих людей без їхньої згоди. Цей напрям PARKED; в R1 немає marketplace integration, job acceptance, outreach чи оплати.

## Навчальний пілот

Після технічних, privacy/legal та людських gates: 10 distinct eligible pairs, elapsed 14 days, 5 mutually agreed briefs, 3 recipient-accepted trial outcomes — proposed learning target. Реальні denominators, missing feedback, support time і ручний baseline оголошуються до спостереження. Відсутність відповіді не знижує «якість людини». WTP досліджується після перевіреної користі; результат може спростувати бізнес-гіпотезу.
