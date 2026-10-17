# Synera: наступний серверний крок — 03.10.2026

**REVIEW ONLY. Не виконано.** Локальні SQL/RLS, 109 tests і мобільний UI прийняті. Жива схема прочитана в `BEGIN READ ONLY ... ROLLBACK`: [факти](LIVE_NEON_PREFLIGHT.json), [видимий результат](LIVE_NEON_PREFLIGHT.png). Поточний `/real-journey.html` на живому пілоті повертає 404.

## Один наступний крок на 20 хвилин

Створити **одну ізольовану review branch** `synera-real-journey-check-20261003` у наявному приватному Neon проєкті `synera` (`quiet-credit-94155104`), з production `br-dawn-field-axoxc3c4`, database `neondb`. Вона повторно використовує базову схему й фактичний PostgreSQL 18.6. До створення звірити тариф і показаний кошторис: дозволена сума **$0**, без paid upgrade. Якщо безкоштовність або межі копіювання не підтверджені — зупинити provisioning і повідомити конкретну причину.

Гілка є копією production у тому самому приватному проєкті. Не робити її публічною, не розширювати доступ, не читати реальні користувацькі рядки або секрети. Не публікувати її дані чи connection string. Точну створену branch ID прочитати назад і зберегти перед SQL; ім'я не замінює ідентичність цілі.

## SQL лише у review branch

Перед записом повторно звірити відсутність case/location/group таблиць, наявність потрібних базових функцій/ролей і справжній target. Якщо стан змінився — повторне застосування не допускається. Frozen `neon/schema.proposal.sql` не застосовувати заново. Не підміняти фактичний `auth.uid()` або іншу provider identity функцію локальною shim.

| Порядок | Міграція | SHA-256 прийнятого локального SQL |
|---|---|---|
| 1 | [case-state](../../neon/case-state.migration.sql) | `e205e64dbc4488110b9df8d54e4037a0fc4df080fc1c779b408fa62651a01993` |
| 2 | [meeting-location](../../neon/meeting-location.migration.sql) | `38215329f654807991472f97df75e8ac233f4616aaaa7ce584968a290e31277b` |
| 3 | [group-room](../../neon/group-room.migration.sql) | `58e85f7534871a40936c081960861cea569f68ffc69c157d988e2473778115da` |

Кожна міграція має власні BEGIN/COMMIT і precondition. Після кожної прочитати фактичні таблиці, функції, RLS і privileges. Case migration також змінює validator профілю та правило створення запрошень: нове запрошення потребує обох підтверджень актуального кейсу. Це зміна серверної поведінки, яку треба перевірити перед production.

На review branch виконати наявні `neon/acceptance.sql`, `neon/case-state.acceptance.sql`, `neon/meeting-location.acceptance.sql`, `neon/group-room.acceptance.sql`. Вони використовують явно синтетичні UUID/email і закінчуються ROLLBACK. Перед виконанням звірити, що fixture UUID/email не зайняті, без читання змісту реальних профілів. Після кожного тесту прочитати нуль залишених fixtures. Якщо справжній provider не підтримує fixture JWT — зафіксувати HOLD, не змінювати auth-функцію задля зеленого тесту. Навмисні expiry/grant мутації з локального runner у cloud не виконувати.

Оракул: ці чотири acceptance завершуються без помилок на справжньому PostgreSQL 18.6; fixtures не залишаються; виробничий branch ID/схема не змінені. Це приймання SQL/ролей, **не** доказ двох реальних login/JWT/Data API сесій. Зберегти лише метадані й статуси, без рядків користувачів. Review branch залишити для подальшої перевірки; її видалення окремо не дозволено.

## Після цього, ще не дозволено цим кроком

1. Production має лише 6-годинну history retention, snapshots немає. Потрібна конкретна збережена й перевірена точка відновлення перед production SQL. Наявність кнопки Restore не доводить успішне відновлення.
2. Production schema rollout і новий deployment кандидата з `CLOSEOUT.json` потребують окремого точного погодження. Сам commit/push не публікує сайт. Case/location/group gate залишаються закритими до відповідного приймання; KV, Google SDK, voice/video та social API цим кроком не активуються.
3. Зв'язаний шлях треба перевірити двома незалежними справжніми акаунтами через Auth/Data API; групову кімнату — трьома. Потім перевірити PWA install/relaunch та весь цикл на фізичному Android.

## Чому потрібне окреме погодження

Глобальний AGENTS.md власника: **“No install/delete/secrets/push/publish/deploy/production mutation/external message without exact approval.”** Отриманий дозвіл на PostgreSQL стосувався лише локального ZIP і тимчасової папки. Наступний крок розгортає схему в новій cloud review branch, тому його ціль, SQL і нульовий бюджет показані перед виконанням. Production в цьому наступному кроці залишається без змін.

Models used: none (provider calls=0, USD=$0.00). Основна підписка не вимірювалася.
