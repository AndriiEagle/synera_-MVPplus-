# Synera: реалізація прийнятих рекомендацій аудиту

18.10.2026. Вихідний main — `9437e0e5836368679ba44cd1dd240270156e0595`. Зміни в ізольованій task branch; оригінали, історичні міграції й сторонній dirty journey-ui не перезаписані. [Попередня перевірка рекомендацій](../gemini-review-20261017/REPORT.uk.md) пояснює, чому запропонований зовнішньою моделлю SQL не можна було виконувати.

## Що реалізовано

| Рекомендація | Результат |
|---|---|
| Безпечне стирання профілю замість обходу FK | Нова self-only операція стирає поля профілю й копії імен, відкликає location grants та email admission, залишає приватний UUID tombstone. Захищені stale JWT, повторний запит, rollback, late restore і concurrency. [Контракт, retention і source transitions](ERASURE.uk.md). Старий deleteProfile/409-контракт збережено. |
| Полегшити першу пропозицію | Детерміністична чернетка розмови й підказки дії/перевірки в наявному редакторі. Доповнюються лише порожні поля; тема, строки й навички походять від учасників. Гроші, збереження, дві згоди та запрошення — окремі явні дії. [Scoper](SCOPER.uk.md). |
| Матеріальний результат після прийняття | Приватна оформлена HTML-картка з авторським редагованим текстом, escaping і CSP. Завантаження свіжо перевіряє домовленість/результат і скасовується при відкликаній згоді, зміні сесії чи тексту. Немає автоматичної публікації, чужих ID або твердження про незалежну сертифікацію. |
| Реальна SQL перевірка у CI | До наявного disposable PostgreSQL job додані full-stack erasure, усі surfaces/lifecycle, outcome concurrency та чотири UPSERT lock сценарії. Публічні assets/cache замкнені; нові controls включені в браузерні gates. |
| Ціна, конверсія, перші користувачі | Замість неперевіреної зміни тарифів підготовлено [план перевірки продуктових гіпотез](../../plan/launch/AUDIT_PILOT_CHECKS_20261018.uk.md). Безплатний пілот, наявна CHF12-гіпотеза й усі п'ять режимів збережені. CHF49/249 та «3×» не подаються як результат. |

Дизайн Current і добровільний Atelier збережені. Нові тексти UK/DE/EN не переписують людський текст. Нових залежностей, білінгу, router/ledger/daemon не створено.

## Вирішальні докази

[LOCAL_ACCEPTANCE.json](LOCAL_ACCEPTANCE.json) звіряє hashes фактичних source з остаточними receipts. Для SQL використовуються тільки REVIEW2_FINAL/VERIFIED: попередні зелені та червоні результати збережено як історію, а не приймання нового коду.

- PostgreSQL16.15 на окремому loopback runtime: **12/12** основних SQL checks, **3/3** outcome concurrency/authorization, **4/4** actual UPSERT/erasure lock сценарії. Усі source hashes перевірені. Це identity shim, не справжні підписані JWT Neon.
- Реальний Chromium із синтетичними акаунтами: **10** перевірок journey/card, **4** erasure UI checks; escaping, редагування, відкликання, збереження форми після помилки, очищення destructive confirmation після logout. Зовнішніх provider/API дій у цих fixtures немає.
- Загальний локальний Node прогін: **692 pass, 0 fail, 1 skip**. Skip — окремий Docker-gated SQL suite; фактичний локальний PostgreSQL прийнятий наведеними вище незалежними runners. Remote CI перевіряється окремо перед merge.
- Cache-only fresh-document startup: PASS. Мобільні screenshots: [приватна картка](result-card-390x844.png), [стиральний control](profile-erasure-390x844.png). Responsive browser не заміняє фізичний телефон.
- Два додаткові Codex implementation chats пройшли початкову роботу й два окремі targeted completion reviews. Знайдені concurrency, FOUND, restore, UPSERT і lifecycle дефекти відтворені до ремонту; попередні докази збережені. GLM findings проходять [незалежний triage](PROVIDER_TRIAGE.uk.md); модельна впевненість не є acceptance.

## Межі готовності

Новий erasure gate за замовчуванням **OFF**. Provider-account deletion має **pending**. Спільні тексти, домовленості, повідомлення, адреси, safety records, backups та чужі копії можуть містити персональні дані; їхнє повне видалення і юридична відповідність не заявляються.

У цій роботі не виконуються production SQL/deploy, запрошення людей, зміна видимості репозиторію чи оплата. Після GitHub review потрібне окреме приймання реального rollout із двома акаунтами й підписаними JWT, provider deletion procedure та фізичними Android/iPhone. До цього не називати кандидата повністю готовим до відкритого запуску.
