# Synera — безпечне повторне надсилання й перевірений розрив живого пілота

05.10.2026. Checkout `C:/Users/Andrii/Desktop/synera-premium-pwa-variant`, branch `codex/synera-product-20261002`, base `c026627`. Новий code commit — у наступному записі спільного STATUS/журналу.

**Прийнято локально:** після втраченої відповіді POST або невдалого читання ручне повторне надсилання тієї самої думки у відкритій сесії не створює дубль. Звичайне «Оновити» зберігає ключ доставки; після підтвердженого успіху новий клік із тим самим текстом створює нове повідомлення. Наступна чернетка не стирається. Немає автоматичного повтору, фонового надсилання чи нового керівного сервісу.

**Живий продукт не завершений.** [Свіжий каталог Neon](LIVE_SCHEMA_READBACK.json) показав: production/neondb має base profiles/consents/meetings/messages з RLS, але **немає всіх дев'яти перевірених нових таблиць** case/approvals/location/group/outcome/address. `auth.uid()` існує, identity — UUID. Це метадані; приватні рядки не читалися. Read-only BEGIN → SELECT → ROLLBACK завершився, міграції/flags не змінювалися. Новий candidate не опублікований. Не плутати owner-console з signed HTTP JWT двох учасників.

## Інваріант і реалізація

Одна невизначена спроба має один ключ; перекриті повтори повертають той самий immutable рядок. Ключ не дозволяє змінити автора, зустріч чи текст, не обходить block/consent/admission і не змушує клієнт повторювати POST самостійно.

- Чинний `RealJourneyStore` тримає тимчасові pending intents у RAM, без localStorage. Один body/actor/meeting повторює свій UUID до успішного send + readback. Інша думка має інший ключ. Logout/нова автентифікація їх прибирає; той самий акаунт після dashboard refresh їх зберігає. Auth epoch відхиляє запізнілу відповідь. ACK перевіряє id/actor/meeting/body/час.
- Чинний Neon gateway додає один gated `/messages/:meeting` POST до одного фіксованого RPC. Caller sender/JWT не приймаються; session identity приходить з Neon. Текст/body bounds, origin, cookie та sanitized errors збережені. Новий шлях не fallback-иться на старий POST при 503.
- Окрема `neon/message-intent.migration.sql` використовує наявний UUID PK повідомлення та transaction advisory lock. Повтор повертається до INSERT, тому не витрачає admission повторно. Новий запис проходить чинні trigger/RLS. SECURITY INVOKER, fixed search_path, transaction lock timeout; немає нового dedup table/ledger/queue.
- Новий readiness flag `SYNERA_MESSAGE_INTENTS_READY` за замовчуванням закритий, потребує pilot + real journey readiness. Його ввімкнення й нова SQL-міграція **не входили до попереднього незатвердженого запитання** про старий candidate.

Це доставка з ключем, не глобальна гарантія exactly-once. Reload/закриття сторінки втрачає RAM-key: перед повтором перевірити історію. Новий токен означає нову дію; умисні повтори іншим токеном не можуть бути заборонені без зміни продуктового контракту. Legacy lane з flag=false збережена та має попередню межу ambiguous duplication. RPC зберігає ключ у SQL як id рядка; durable offline outbox не реалізований.

## Самоперевірки й докази

1. [Перший semantic RED](RED.tap): втрата вже записаної відповіді + другий явний send дали два рядки; 16 перекритих повторів дали 18 замість двох різних думок. Це фактичний дефект старого client path, не literal/snapshot тест.
2. Перший review actual diff знайшов dashboard restore, який стирав pending key. [Окремий RED](REFRESH-RED.tap) відтворив дубль після «Оновити». Одна вузька правка розрізнила звичайний same-account refresh і auth change; auth epoch лишився.
3. [66 Node tests](UNIT.tap): нові recovery/auth/ACK/gates плюс legacy journey, gateway, outcome та bilateral address. Це конкретний набір, не весь репозиторій.
4. [Справжній локальний PG16.15](SQL.json): 16 окремих psql транзакцій дійшли до незафіксованої leader-транзакції; після release усі повернули один id/рядок. Immutable replay не збільшує counter, працює при exhausted daily quota; новий write тоді заборонено. Changed body/інший actor/outsider/empty/block/anonymous відхилені, writer не може змінювати body/created_at. DB у вже дозволеному локальному runtime, без видалення чи Windows service.
5. SQL mutation прибрала тільки transaction lock: усі 16 перекритих retries отримали duplicate-key failure. Canonical function відновлена, відповідний concurrent gate пройшов знову. Це перевірка race guard, **не throughput benchmark**.
6. Другий bounded review actual diff перевірив пряму server consent межу. Гіпотеза обходу не підтвердилася: [consent acceptance](CONSENT-GREEN.txt) показала, що чинна meetings RLS вже закриває replay, history read і legacy INSERT без consent. Base SQL не переписувався. Початкова спроба змінити фіксований policy_version відхилена check constraint; це [setup failure](CONSENT_SETUP_FAILURE.txt), не semantic RED. Валідна fixture лише всередині ROLLBACK переадресує consent іншому synthetic id.
7. [6 груп реального Chromium 390×844](browser/RESULT.json): actual UI clicks, synthetic accounts через actual gateway; lost POST/read + refresh + manual retry, unsent next draft, свідомий same-text send, Current/layout/private storage/Axe=0, logout. [Client mutation](mutation/RESULT.json) генерує новий UUID для retry й знову дає два рядки. Canonical source не змінений mutation; жодного зовнішнього request. Два locator setup failures збережені, виправлялися лише в runner після звірки HTML; вони не є продуктним RED.
8. [Closure](ACCEPTANCE.json): packaged Worker виконав synthetic gated RPC; defaults closed. 97 public files / 96 manifest rows. [Незалежний native PowerShell readback](INDEPENDENT_READBACK.json): 14 source/image hashes, manifest sizes/hashes, foreign journey-ui hash.

Числа груп перетинаються; SQL green/restoration повторюють той самий контракт. Це не 48 незалежних живих учасників і не 100 users/sec.

![Справжній локальний Chromium, synthetic chat](C:/Users/Andrii/Desktop/synera-premium-pwa-variant/artifacts/message-intent-20261005/browser/chat-390x844.png)

## Рівень масштабу: що встановлено, що ще відкрите

| Система | Факт / межа | Приймання для масового запуску |
|---|---|---|
| Admission / акаунти | Gateway allowlist максимум 10 emails; closed pilot, не mass launch | Погоджена модель реєстрації/anti-abuse; нові limits після workload/cost приймання |
| Приватний чат | Explicit send, bounded 100-history read, нова локальна replay safety; старі ліміти 100 messages/actor/day | Signed HTTP JWT + real DB + двоє людей; pagination довгої історії, connectivity/reload recovery |
| Одночасні записи | Одна intent-конкуренція доведена локально 16 перекритими транзакціями | Mix distinct users/keys, sustained нагрузка, tail latency, saturation/recovery на exact cloud target |
| Фонові читання | Existing visible-page 5-second polling, skip busy/overlap, separate fresh Auth/Data checks | Виміряти request amplification/cost; scalable realtime/push лише через наявні owners після доказу потреби |
| Дані / регіон | Live PG18.6, Free plan UI, Ohio, compute 0.25–2 CU; local SQL proof PG16.15 | Target-version review й свідомий вибір регіону/data policy для Zurich; UI plan не є bill/capacity receipt |
| Recovery / deployment | Earlier console snapshot absent; Pages No Git connection | Свіжий recovery point та перевірений повернення/previous Worker; exact candidate publication |
| AI / voice / tiers | Existing modules/local advisory; ніяких нових paid provider calls, live tier billing не прийняте | Exact provider/privacy/cap/receipt, concurrency/spend control, streaming/cancellation/fallback і customer quality |
| Physical UX | Current default; actual mobile-size desktop clicks, no new buttons/effects | Справжній Android login → двосторонній результат; reconnect, keyboard, background/offline з людиною |

Ціль «сотні людей на секунду» поки **не доведена**. Concurrency != RPS != одночасні користувачі. Код lock/admission не заміняє signed transport, тести capacity або підтвердження корисності з людьми. Не піднімати limits і не вмикати paid features тільки через хороший synthetic результат.

## Користувач на цьому кроці

| Крок | Перевірена поведінка | Бажане відчуття |
|---|---|---|
| Надсилаю | Один клік, один intent; нова думка лишається в полі | «Можна продовжувати думати» |
| Відповідь загубилась | Чернетка й чесний unknown status збережені; немає auto retry | «Система не прикидається, що знає» |
| Оновлюю й повторюю | Same-session key збережений; повертається оригінальний row | «Відновлююсь без дублю й зайвих пояснень» |
| Повторюю свідомо після успіху | Новий явний клік створює нову дію навіть з однаковим текстом | «Мій намір вирішує» |
| Виходжу | Private UI/RAM state очищені; late result не є новим success | «Контроль і приватність відчутні» |

Відчуття — дизайн-цілі, не виміряні емоції/гормони. [27 систем / 15 етапів](../product-status-20261004/STATUS.uk.md): 7 accepted locally in declared contracts, 16 partial, 4 incomplete; нова safety доробка не переводить увесь чат чи продукт у live-ready.

## Пакет і наступний крок

`web_launch/dist-neon-message-intent-20261005`, release SHA256 `efd4bc624a5aadb87d2676b036bff0a2e1d80f34182c32fce221460df82fdceb`, unpublished / gitignored. Accepted source/proofs у Git. Foreign `journey-ui.mjs` preserved SHA256 `68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b`; bundle взяв committed HEAD copy. Старі кандидати/дизайн не перезаписані. Push policy hold не обходився; production/secrets/global memory не змінені.

**NEXT, 15–20 хв після exact approval:** звірити актуальні schema/recovery/cost gates для наявного Neon production/neondb і candidate в [оновленому rollout review](../product-status-20261004/ROLLOUT_REVIEW.uk.md), створити/звірити recovery point, потім лише погоджений missing SQL + Pages publish. Увімкнення нового message flag — лише після відповідного gate. За mismatch/cost/recovery failure зупинити live зміну. Після запуску окремо прийняти два signed sessions та physical Android; платні/voice/Maps/OAuth функції паркуються до своїх дозволів.

Models used: none (provider calls=0, USD=$0.00).
