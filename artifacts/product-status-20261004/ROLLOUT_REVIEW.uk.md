# Synera — конкретний review наступного закритого пілота

Нічого не застосовує. Код `564fa9aad1c764ac0480e70bd7ee60ab0e5c8ab0`, candidate `web_launch/dist-neon-draft-continuity-20261004`, 97 public files; release SHA256 `b63391269c3c66625fb994e9b97514a05d1bd3da1837ee129b28f8486bd46a40`.

Історичний target: Neon `synera` / `production` / `neondb`, Cloudflare Pages `synera-pilot`, `https://synera-pilot.pages.dev`. Перед зміною заново прочитати його identity, applied schema й recovery point. HTTP config або вхід у панель цього не доводять. Точне питання production activation лишилося без погодження; дозвіл commit/push не є його заміною.

| Порядок | Відсутній SQL для review | Межа |
|---|---|---|
| 0 | Наявний base | `schema.proposal.sql` не повторювати на існуючій базі. Зберегти справжню provider identity. |
| 1 | `neon/case-state.migration.sql` | Лише якщо відсутній. Якщо старий case-state застосований, окремо розглядати `case-expiry-repair.migration.sql`, не rerun всієї міграції. |
| 2 | `neon/meeting-location.migration.sql` | Після case-state. SQL — лише consent/час/точність; GPS activation потребує окремого ephemeral KV binding. |
| 3 | `neon/group-room.migration.sql` | Після base/case; admission helper потрібний для наступних RPC. Voice/video цим не вмикається. |
| 4 | `neon/case-outcome.migration.sql` | Після case/group. Append-only attestations, receiver acceptance; виходить за старе питання лише про три міграції. |
| 5 | `neon/meeting-address-agreement.migration.sql` | Після location/group. Legacy direct address PATCH закритий; оновлений consumer уже в candidate. |

Exact source hashes/local SQL receipts: [outcome](../overnight-20261004/CASE_OUTCOME_SQL.json), [address](../overnight-20261004/MEETING_ADDRESS_SQL.json). Це не доказ applied production; при іншому target/schema/precondition — HOLD.

1. Read-only target/applied-state перевірка без приватних рядків користувачів. Перед production SQL — збережена й перевірена recovery point; старі дані про 6-годинне вікно не доводять поточний restore.
2. Погодити точний набір відсутніх міграцій, target і candidate. Нові платні resources, credentials або увімкнення всіх функцій не входять у дозвіл за замовчуванням. Зберегти попередній manifest/Worker для повернення.
3. Review acceptance, потім лише погоджені міграції та readback functions/roles/RLS. У cloud не підміняти auth.uid shim і не запускати destructive mutation oracle.
4. Flags/bindings звірити з server readiness. Journey/outcomes/address закриті до відповідних gates; GPS не вмикати лише від наявності address SQL. Registration scope окремий; JWT server-side.
5. Два живі акаунти й справжній HTTP JWT → gateway → Data API/SQL. Потім Android: профіль → Give–Take → одна редакція умов → дві згоди → invitation/acceptance → чат → двостороння адреса → evidence/check/receiver acceptance → export. Перевірити next draft, revision/revoke/logout і late responses.
6. Config200, push/deploy success — не acceptance живого циклу. Зберегти factual receipt/proof limits без приватного вмісту.

Не входять: Google SDK/Places/Routes, передовий voice/video, live AI Triangle, LinkedIn/Instagram OAuth/постинг, checkout, нові analytics/ads services. Це окремі capability/consent/budget/acceptance кроки. Persistent message idempotency також ще відсутня; manual resend після невідомої доставки може дублювати запис.
