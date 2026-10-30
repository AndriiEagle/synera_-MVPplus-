# Ledger стирання — дизайн, без зовнішнього сховища

Статус: DESIGN + LOCAL TEST DOUBLE. Джерело ідеї: Part B `src/security.mjs`
(`deletionJob`, `assertNoResurrection`) і IMPLEMENTATION_PLAN_RU.md §6.

Звичайний tombstone у тій самій БД відкочується разом із PITR. Майбутній production
ledger має бути поза цією областю відновлення, під окремим доступом і ключем.
До руйнівних кроків записати intent із HMAC-SHA256(subject), версією ключа та
ідемпотентним request ID. Зберігати мінімум, без email, тексту профілю чи повідомлень.
HMAC — псевдонімізація персональних даних, не анонімізація. Ключ ledger окремий від
OTP і log keys; ротація мусить зберігати перевірку історичних маркерів.

Перед відкриттям відновленої гілки закрити трафік, отримати актуальний незалежний
ledger, повторно стерти знайдені subject та перевірити Auth/session/API. Pending
intent також блокує повернення: незавершене видалення не означає дозволу воскресити
акаунт. Недоступний/неповний ledger або невідомий ключ → HOLD, не порожній список.
Лише після readback усіх кроків позначити job завершеним; це не доказ фізичного
знищення backups. Авторизація видалення залишається за перевіреним subject і
чинними gates; ledger не приймає рішення, кого видаляти.

`tools/erasure-ledger.test-double.mjs` — окремий in-memory Map із тестовим ключем,
HMAC domain separation, ідемпотентним intent, pending/complete та restore guard.
Він перевіряє лише контракт на синтетичних Demo-ID. Немає мережі, R2/KV, scheduler,
production wiring, збереження після перезапуску або заяви `completed_live`.
Зберігання, обґрунтований TTL, роль оператора, reconciliation, гонки restore/delete,
відновлення ключа та реальний PITR-drill потрібні перед production інтеграцією.

Документальні `consent_events` у запропонованій міграції видаляються разом із
`pilot_consents` через FK: повне прикладне стирання не лишає нових текстів згоди.
Legacy RPC стирання профілю й minimal stale-session tombstone збережені.
