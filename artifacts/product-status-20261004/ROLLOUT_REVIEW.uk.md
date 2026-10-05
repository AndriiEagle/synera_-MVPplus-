# Synera — конкретний review наступного закритого пілота

## Актуальний пакет — 05.10.2026

[Message-intent acceptance](../message-intent-20261005/REPORT.uk.md): `web_launch/dist-neon-message-intent-20261005`, **97 public files / 96 manifest rows**, release SHA256 `efd4bc624a5aadb87d2676b036bff0a2e1d80f34182c32fce221460df82fdceb`. Ручний resend після unknown delivery зберігає один UUID у відкритій сесії, включно зі звичайним dashboard refresh. Після підтвердженого send/read нова явна дія має новий UUID. 66 targeted Node tests, 6 actual Chromium groups, 16 overlapping SQL retries на PG16.15; client/SQL mutations відхилені, незалежний hash readback. Це не RPS benchmark. Reload втрачає RAM-key; legacy lane з flag=false зберігає старе обмеження. Candidate unpublished, build gitignored; старий partner-status candidate збережений як історичний.

[Свіжий read-only каталог](../message-intent-20261005/LIVE_SCHEMA_READBACK.json): Neon `synera` (`quiet-credit-94155104`) / `production` (`br-dawn-field-axoxc3c4`) / `neondb`. Base profiles/consents/meetings/messages існують з RLS; усі дев'ять перевірених нових case/location/group/outcome/address таблиць відсутні. `synera_send_message` також відсутня. `auth.uid()` є, identity UUID. Це BEGIN READ ONLY → metadata SELECT → ROLLBACK, без приватних рядків чи мутацій. Повні base columns/grants/policy bodies/source identity ще не звірені; catalog presence їх не доводить.

Live target — **PG18.6, AWS Ohio, Free plan UI, compute 0.25–2 CU**, history 6 годин. Локальний SQL proof — PG16.15. UI Free не є cost receipt або гарантією безкоштовного recovery. [Попередній target readback](../partner-status-20261005/LIVE_TARGET_READBACK.json): snapshot немає, restore не прийнятий; Pages `synera-pilot`, **No Git connection**, старий deployment `fb29ee5e`. Цього разу Pages/recovery state не переперевірявся. Push не є deployment. Поточний пілот лишається в наявному регіоні; масовий Zürich запуск потребує окремого рішення щодо даних/регіону й capacity acceptance.

**Точний дозвіл pending:** recovery point для вказаної production branch з попередньою перевіркою типу/вартості/повернення; лише відсутні SQL 1–6 нижче після exact base/grants та PG18 review; upload цього exact candidate в **наявний** Pages `synera-pilot`; readiness flags `SYNERA_REAL_JOURNEY_READY`, `SYNERA_CASE_OUTCOMES_READY`, `SYNERA_MEETING_ADDRESS_READY`, **`SYNERA_MESSAGE_INTENTS_READY`** лише після відповідних gates. Нова message SQL/flag/candidate не входили до попереднього unanswered питання про старий release. Нуль нових платних resources/provider calls; без credentials/secrets/voice/Google SDK/OAuth/checkout/GPS activation. За невідомої вартості, schema mismatch або неперевіреного recovery — HOLD саме живої зміни. Commit/push authorization не замінює production/deploy approval.

## Історичний пакет і порядок review міграцій

Нічого не застосовує. Код `564fa9aad1c764ac0480e70bd7ee60ab0e5c8ab0`, candidate `web_launch/dist-neon-draft-continuity-20261004`, 97 public files; release SHA256 `b63391269c3c66625fb994e9b97514a05d1bd3da1837ee129b28f8486bd46a40`.

Історичний target: Neon `synera` / `production` / `neondb`, Cloudflare Pages `synera-pilot`, `https://synera-pilot.pages.dev`. Перед зміною заново прочитати його identity, applied schema й recovery point. HTTP config або вхід у панель цього не доводять. Точне питання production activation лишилося без погодження; дозвіл commit/push не є його заміною.

| Порядок | Відсутній SQL для review | Межа |
|---|---|---|
| 0 | Наявний base | `schema.proposal.sql` не повторювати на існуючій базі. Зберегти справжню provider identity. |
| 1 | `neon/case-state.migration.sql` | Case tables відсутні за свіжим catalog. Звірити preconditions перед apply; expiry repair зараз не потрібний. Якщо стан змінився — новий review, не rerun. |
| 2 | `neon/meeting-location.migration.sql` | Після case-state. SQL — лише consent/час/точність; GPS activation потребує окремого ephemeral KV binding. |
| 3 | `neon/group-room.migration.sql` | Після base/case; admission helper потрібний для наступних RPC. Voice/video цим не вмикається. |
| 4 | `neon/case-outcome.migration.sql` | Після case/group. Append-only attestations, receiver acceptance; виходить за старе питання лише про три міграції. |
| 5 | `neon/meeting-address-agreement.migration.sql` | Після location/group. Legacy direct address PATCH закритий; оновлений consumer уже в candidate. |
| 6 | `neon/message-intent.migration.sql` | Новий SECURITY INVOKER RPC; id column INSERT grant, immutable UUID replay, чинні RLS/trigger/admission. Function відсутня за catalog; target PG18 review і gates до readiness. Не запускати local mutation oracle у production. |

Exact source hashes/local SQL receipts: [outcome](../overnight-20261004/CASE_OUTCOME_SQL.json), [address](../overnight-20261004/MEETING_ADDRESS_SQL.json). Це не доказ applied production; при іншому target/schema/precondition — HOLD.

1. Read-only exact base columns/grants/policies/preconditions без приватних рядків; target PG18 review. SQL editor відновлює старі чернетки: починати з нового порожнього query, звірити target і весь SQL до Run. Свіжий catalog уже прийнятий, незмінений повтор не є новим доказом. Перед production SQL — збережена й перевірена recovery point; старі дані про 6-годинне вікно не доводять поточний restore.
2. Погодити точний набір відсутніх міграцій, target і candidate. Нові платні resources, credentials або увімкнення всіх функцій не входять у дозвіл за замовчуванням. Зберегти попередній manifest/Worker для повернення.
3. Review acceptance, потім лише погоджені міграції та readback functions/roles/RLS. У cloud не підміняти auth.uid shim і не запускати destructive mutation oracle.
4. Flags/bindings звірити з server readiness. Journey/outcomes/address/message-intent закриті до відповідних gates; GPS не вмикати лише від наявності address SQL. Наявний closed-pilot allowlist максимум 10 — не розширювати цим rollout. JWT server-side.
5. Два живі акаунти й справжній HTTP JWT → gateway → Data API/SQL. Потім Android: профіль → Give–Take → одна редакція умов → дві згоди → invitation/acceptance → чат → двостороння адреса → evidence/check/receiver acceptance → export. Перевірити next draft, ручний unknown-delivery recovery, revision/revoke/logout і late responses. Не створювати прихованих акаунтів чи замінювати людей ботами.
6. Config200, push/deploy success — не acceptance живого циклу. Зберегти factual receipt/proof limits без приватного вмісту.

Не входять: Google SDK/Places/Routes, передовий voice/video, live AI Triangle, LinkedIn/Instagram OAuth/постинг, checkout, нові analytics/ads services, mass registration або заява про сотні users/sec. Це окремі capability/consent/budget/acceptance кроки. Новий message replay локально прийнятий лише для same-session intent: reload/offline outbox/cross-device retry не завершені. Сотні користувачів за секунду потребують distinct-user sustained workload, latency/saturation/recovery та фактичної cloud вартості; 16 overlapping retries цього не доводять.
