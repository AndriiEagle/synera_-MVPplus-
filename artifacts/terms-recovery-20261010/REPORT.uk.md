# Synera — збереження умов після тимчасової відмови сервера, 10.10.2026

**Прийнято локально:** code `557a09f9cd9df6c1ea43a61330a4e47de0d8607a`. Заповнена форма умов більше не зникає після `503/data_unavailable`. Інші межі доступу не послаблено. Це один завершений крок пілота, не приймання всього продукту наживо.

## Інваріант і вузька зміна

Тимчасова відмова запису не доводить вихід з акаунта або відсутність самого запису. У того самого учасника й того самого epoch лишаються всі поля, вибір та первісна база compare-and-swap. Статус пояснює невизначеність і пропонує спершу оновити/перевірити домовленість. Немає автоматичного retry, дубля домовленості, автоматичної згоди або прихованого збереження приватної форми у браузерне сховище.

Catch додано тільки в `saveTerms` для `503` з кодом `data_unavailable` та збігом actor/epoch. `401`, `403`, warm feature-disabled, auth/session unavailable і cold config gate лишаються попередніми закритими станами з очищенням приватних полів. Запізніла відмова після logout не повертає форму й не замінює статус виходу. Generic `run`, SQL, Worker, consent, CAS і message replay не змінено. Current default, Atelier opt-in; чужа `journey-ui.mjs` не зачеплена.

## Фактичні докази

| Gate | Результат | Артефакт |
|---|---|---|
| Semantic RED до зміни продукту | Нова POST-форма й PATCH-редакція ховаються/стираються після 503; logout/401/403/cold gates проходять. Atelier case цього RED мав runner visibility timeout і не є доказом дефекту | `red-semantic/RESULT.json` |
| Проміжний WebKit | 7/7; ще до уточнення warm-disabled guard | `green-worktree/RESULT.json` |
| Targeted Node | 21/21 client + translation/material invariants; це не новий SQL proof | `NODE.tap` |
| Chrome після звуження guard | 8/8 | `review-chrome/RESULT.json` |
| Adversarial mutation | Вимкнення локального catch повертає loss у fresh POST, committed POST та PATCH; runner відхиляє mutant | `review-mutation/RESULT.json` |
| Точний новий candidate у WebKit 26.6 | 8/8 + окремий auth-unavailable 1/1; разом 9 різних сценаріїв | `final-webkit/RESULT.json`, `auth-webkit/RESULT.json` |
| Точний новий candidate у Chrome 154 | Ті самі 9 різних сценаріїв | `final-chrome/RESULT.json`, `auth-chrome/RESULT.json` |
| Source/manifest readback | 97 hashes; лише два public assets відрізняються від message-reload, інші 95 ідентичні | `BUILD.json`, `READBACK.json` |

Реальні кліки в desktop engines, viewport 320×568, UK/DE/EN, Current і добровільний Atelier. Форма зберігає 21/22 entries. Відмова до commit не змінює серверні fixture terms; явний retry працює. Якщо запис уже відбувся, refresh не надсилає нічого, а ручний retry зустрічає чинний CAS-конфлікт: лише одна домовленість і жодної самовільної згоди. Screenshots після відмови оглянуті: статус читається, кнопка збереження доступна, горизонтального overflow немає. Це fixture transport через справжній UI, не PostgreSQL/RLS/JWT.

Перші `red/` та `red-corrected/` — збережені setup failures: runner шукав UUID, якого немає у видимій картці, а потім закривав уже відкритий details. Після діагностики selector і open-state виправлено. Ці невдачі не зараховані як product RED. Пізніший visibility timeout одного Atelier RED не повторився в прийнятих Chromium/WebKit gates; theme реально перевіряється через `data-synera-atelier`.

## Два скінченні self-review

1. Перечитано actual diff проти інваріанта: широкий `503` звужено до `503/data_unavailable`, щоб недоступний auth або вимкнений пілот не зберігали активний UI. Усі поля/CAS лишаються у старих owners; ніяких нових систем чи сховищ.
2. Окремий read-only review не знайшов нового code defect. Виконано mutation, late logout і окрему auth/session 503 перевірку. Перемикання peer під час ручної pending-дії блокує чинний `state.busy`; штучний виклик private функції не видано за користувацький сценарій. Після приймання додатковий polishing зупинено.

## Кандидат і межі

`web_launch/dist-neon-terms-recovery-20261010`: 98 public files / 97 manifest rows, точні Git blobs з `557a09f`. Release SHA-256 **`003501f35f5d56ae3dd5730c6ae346a315984a8ed1ed7a29beaf241d1f28e227`**. Builder/readback recipes збережені тут. Dirty `journey-ui` SHA-256 **`68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b`** збережений; у candidate входить закомічений asset. PG18.4 receipt source hashes незмінні й звірені builder; SQL заново не виконувався.

GitHub readback у цьому проході: `6724682f5f43172e5732fa41b8a46e4baa6384e2`. Push не повторювався: попередній інструмент відхилив його з `approval required by policy, but AskForApproval is set to Never`; нових доказів зміни обмеження немає. Немає обходу через інший транспорт/чат. Новий пакет **не published/deployed**; production, secrets, provider/billing і глобальна пам'ять не змінювались.

Повна [карта систем та бажаного досвіду](../opus-pass3-webkit-20261010/REPORT.uk.md) лишається базою: цей крок покращує етап «заповнив умови → отримав відмову → відновив роботу». Людина має відчувати збережену працю й контроль; це UX-ціль, не вимір емоцій чи гормонів. Інші 15 пакетів не оголошені завершеними новим тестом.

**Відкрито:** exact production/recovery/cost/rollout; два живі акаунти зі справжнім JWT і accepted result; фізичні Android/iPhone; EN/DE entry/profile з іншої копії Opus; операційна privacy/support/recovery; first-cohort і sustained capacity. Google SDK, live advanced voice/L, OAuth posting і payment activation мають окремі відкриті gates. Старі докази для незмінених assets повторно не запускались; новий UI не названо повним повтором 144 кроків.

**NEXT, 15 хв:** освіжити metadata preconditions/recovery в [точному rollout review](../product-status-20261004/ROLLOUT_REVIEW.uk.md), потім погодити саме поточний candidate й набір `1, 1a, 2–6` перед живими змінами. До цього жодної production mutation.

Models used: none (provider calls=0, USD=$0.00). Внутрішній Codex review — не зовнішній provider receipt; subscription savings не виміряні.
