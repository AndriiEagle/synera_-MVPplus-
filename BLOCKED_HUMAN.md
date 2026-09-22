# BLOCKED_HUMAN.md — точні питання до оператора (Андрія)

**Протокол відповіді:** відповідай прямо в цьому файлі (рядок `Відповідь:` під кожним питанням) або одним повідомленням у чаті з номером питання (Q1…Q11). Після відповіді оркестратор переносить вердикти в `bible/STATUS.md` і evidence у `plan/readiness/READINESS_DNA.json` — файл-джерело НЕ переписується заднім числом (FM-005: correction = revocation).
**Правило:** агент ніколи не підписує owner-approval сам (KI_STABILIZER §6); кожен факт нижче має локатор на диску; помічене NEEDS_INPUT — те, чого немає на диску.
**Стан:** 7 шарів BLOCKED_HUMAN (READINESS_DNA), 11 питань, зібрано 2026-09-22 (фаза 7).

| Шар | Питань | Суть рішення | Що розблокує |
|---|---|---|---|
| C03.L4 | 2 | Середовище приймання RLS + хто виконує | C03.L4 → DONE |
| C03.L7 | 2 | Approval на живу міграцію + backup/rollback | C03.L7 → DONE, шлях до C13.L6 |
| C05.L6 | 1 | Хто і що ревʼюить за 30 хв (H2 юрист) | D3 legal gate |
| C11.L4 | 2 | Платіжні рейки + кап першого платного кроку | Монетизація |
| C13.L6 | 1 | Пакетний деплой на Cloudflare Pages | C13 5/6 |
| C14.L5 | 1 | Яка саме «векторна база на NVIDIA» | C14.L5 → DONE |
| C15.L7 | 2 | Юридичний підпис + code review C15 машин | Фаза 5/7 вихід |

---

## C03.L4 — Приймання RLS на одноразовій базі

### Q1: На якій одноразовій базі запускати приймання RLS — A) локальний Docker Postgres чи B) ephemeral Neon branch?
- **Шар:** C03.L4 — gate: `case-state.acceptance.sql` PASS + receipt у `bible/STATUS.md` (`plan/readiness/READINESS_DNA.json:179-182`).
- **Статус на диску:** `neon/case-state.acceptance.sql:1` — «NOT RUN. Neon-only transactional case acceptance on a DISPOSABLE branch. Requires exact approval. Always ROLLBACK.»; `bible/STATUS.md:18` — тести ніколи не доводять RLS-поведінку, жоден statement ще не виконувався проти бази.
- **A) Docker Postgres ($0):** повний контроль і $0 витрат; мінус — наближення до Neon-оточення (схема `neon_auth`, ролі `authenticated`, вживані у `neon/case-state.acceptance.sql:2-17`) доведеться відтворити самостійно.
- **B) Neon ephemeral branch:** production-подобове середовище з уже готовими ролями і схемами; мінус — потрібен доступ до Neon проєкту і свідомо створена/видалена branch.
- **Що виконається в обох випадках:** `neon/case-state.acceptance.sql` (141 рядок: фікстури 3 юзерів → case lifecycle → примусовий ROLLBACK, `neon/case-state.acceptance.sql:1`).
- **Що розблокує:** C03.L4 → DONE, знімає один із двох запобіжників перед C03.L7 (жива міграція).
- **Власник рішення:** Андрій (оператор).
- **Відповідь:** ___

### Q2: Хто виконує acceptance-runbook і де фіксується receipt?
- **Пропозиція (needs your yes/no):** агент запускає SQL і збирає вивід PASS/ROLLBACK; оператор особисто підтверджує результат; receipt дописується в `bible/STATUS.md` поруч з існуючим записом про `schema.proposal.sql` (`bible/STATUS.md:23`).
- **Критерій PASS:** усі транзакції у файлі завершуються успішно і кожна завершується `ROLLBACK` (заголовок `neon/case-state.acceptance.sql:1` — «Always ROLLBACK»), жоден фікс-юсер не залишився в базі.
- **Альтернатива:** оператор виконує власноруч під наглядом — тоді receipt пише оператор.
- **Власник рішення:** Андрій (оператор).
- **Відповідь:** ___

## C03.L7 — Застосування міграції на живу базу

### Q3: Даєш exact approval на застосування `neon/case-state.migration.sql` до живої Neon бази?
- **Шар:** C03.L7 — gate: exact approval, backup, rollback plan (`plan/readiness/READINESS_DNA.json:200-203`).
- **Що буде застосовано:** `neon/case-state.migration.sql` — згенерований `neon/generate-schema.mjs`, «never edited by hand» (`bible/STATUS.md:13`); 141-рядковий acceptance-скрипт — окремо, тільки на disposable базі (див. Q1–Q2).
- **Дисципліна:** FM-013 (`C:\Users\Andrii\Desktop\KI\FLEET_MEMORY.md:165-168`) — джерело застосованої міграції — заморожена історія: після застосування файл не редагується, нові зміни = нова міграція.
- **Якщо «ні»:** міграція лишається в плані, жива база працює на замороженому `schema.proposal.sql` (`docs/NEON_LAUNCH.uk.md`: 106 statements, acceptance PASS); case-state функціонал не вмикається на проді.
- **Власник рішення:** Андрій (оператор).
- **Відповідь:** ___

### Q4: Чи приймаєш процедуру backup/rollback: snapshot → dry-run на копії → верифікований rollback → live?
- **Пропозиція кроків:** (1) Neon snapshot/branch-copy живої бази перед міграцією; (2) прогон міграції на копії з `case-state.acceptance.sql` PASS; (3) підготовлений і перевірений rollback SQL (відкат структур міграції) фіксується в `plan/blockers/` як частина approval; (4) тільки після (1)–(3) — live.
- **Що треба від тебе:** підтвердження вікна (коли можна торкати живу базу) і підтвердження, що snapshot-механіка Neon вважається достатнім backup для цього пілота.
- **Власник рішення:** Андрій (оператор).
- **Відповідь:** ___

## C05.L6 — Перевірка кваліфікованим юристом/фідуціаром (H2)

### Q5: Яка кваліфікована особа і який саме набір артефактів підлягає 30-хвилинному legal review, і що рахується як «зроблено»?
- **Шар:** C05.L6 — gate: 30-min review done (`plan/readiness/READINESS_DNA.json:289-292`).
- **Статус на диску:** `plan/legal/SWISS_LEGAL_LAYER.uk.md:3` — статус `LEGAL_ANALYSIS_DRAFT — needs qualified CH review before D3`; документ прямо заявляє, що не є formal legal opinion; генезис-план призначає H2 «Юрист/фідуціар 30 хв (MWST, договір, QR-bill) | Gilbert/Andrii» (`plan/GENESIS_SPEC.uk.md:75`).
- **Пропозиція scope ревʼю (файли з диска):** `plan/legal/SWISS_LEGAL_LAYER.uk.md` (правова матриця nFADP/OR-CO/UWG/StGB 179ter/PBV), майбутні Privacy Notice + ToS до D3, і підсумкова таблиця 7 дозволів (§2 того ж документа).
- **Критерій «done»:** підписана оператором відмітка «30-min review done» з імʼям ревʼювера і датою, записана в `bible/STATUS.md` + у READINESS_DNA evidence для C05.L6. Агент НЕ може сам підписати це приймання (правило «An agent never signs owner approvals» — KI_STABILIZER §6).
- **Власник рішення:** Андрій (оператор) — підтверджує особу ревʼювера (Gilbert? інший?) і дату.
- **Відповідь:** ___

## C11.L4 — Білінг (підписка, QR-bill/TWINT/картки)

### Q6: Які платіжні рейки вибираємо для першого платного кроку — QR-bill, TWINT чи картки?
- **Шар:** C11.L4 — gate: legal E-wave done; exact approval (`plan/readiness/READINESS_DNA.json:561-564`).
- **Що вже є на диску:** серверний леджер кредитів `web_launch/credit-ledger.mjs` — append-only, idempotencyKey, refund-механіка (`plan/readiness/READINESS_DNA.json:554-558`); тарифна матриця (`web_launch/economics/tier_matrix.mjs`) на диску ВІДСУТНЯ — є тільки `web_launch/wtp.mjs` — тобто платіжна інтеграція ще не почата (NEEDS_INPUT: де саме живе tier_matrix).
- **Юридичний контекст (диск):** H2-ревʼю вже охоплює MWST/договір/QR-bill (`plan/GENESIS_SPEC.uk.md:75`); PBV: B2C потребує ПДВ-розкриття цін, B2B без (`plan/legal/SWISS_LEGAL_LAYER.uk.md`, рядок PBV 942.211).
- **A) QR-bill:** без процесінгу і без карткових комісій, $0 інфраструктури, найшвидший шлях для CH-пілота; B) TWINT: зручний CH-ринок, потрібна інтеграція провайдера; C) картки: глобально, але процесор+PCI+fees.
- **Власник рішення:** Андрій (оператор).
- **Відповідь:** ___

### Q7: Даєш exact approval на перший платний інтеграційний крок — якому виконавцю, на який scope, з яким капом витрат?
- **Пропозиція:** approval видається на ОДИН крок (наприклад, тільки генерація QR-bill інвойсів без зовнішнього процесінгу — $0 зовнішніх витрат), наступні кроки (TWINT/картки) = окремі approvals.
- **Формат:** scope + кап + отримувач витрат фіксуються у відповіді оператора і додаються в `bible/STATUS.md` (підрядок з exact scope).
- **Власник рішення:** Андрій (оператор).
- **Відповідь:** ___

## C13.L6 — Деплой пакетом (UI+міграція+B2+worker)

### Q8: Даєш exact approval на пакетний деплой (UI + міграція + B2 + worker), і в якому порядку?
- **Шар:** C13.L6 — gate: exact approval (`plan/readiness/READINESS_DNA.json:650-653`).
- **Статус на диску:** пілот уже опублікований — `https://synera-pilot.pages.dev`, Cloudflare Pages `synera-pilot`, план Free/$0 (`docs/NEON_LAUNCH.uk.md:3,23`); CI не деплоїть — «Жодних deploy/publish/secrets» (`.github/workflows/ci.yml:2`), деплой лишається ручним кроком з exact approval.
- **Пропозиція порядку:** (1) CI зелений як передумова (зараз 299/299 локально; коміт 4cb7dd3); (2) міграція на живу базу — тільки після C03.L7 approval (не раніше); (3) UI-пакет на Cloudflare Pages; (4) B2-компонент і worker — окремими кроками з власними перевірками health.
- **Що це розблокує:** інфраструктурний шар C13 (зараз 4/6); залежність C03.L7 явно видима в порядку.
- **Власник рішення:** Андрій (оператор) — так/ні + підтвердження порядку.
- **Відповідь:** ___

## C14.L5 — Векторна база «на NVIDIA»

### Q9: Яку саме «векторну базу на NVIDIA» має на увазі оператор — підтвердити локальний TF-IDF, назвати конкретний NVIDIA-схов, чи відкласти?
- **Шар:** C14.L5 — gate: location confirmed (`plan/readiness/READINESS_DNA.json:690-693`).
- **Знайдено на диску:** `D:\AI_DEPOT\vector_db\context-gateway` існує: `vector-producer/` + `context-gateway.sqlite3` (локальний TF-IDF-шлях); NVIDIA CUDA lane є як пакунок `C:\Users\Andrii\Desktop\KI-distributed-factory\nvidia-cuda-lane\` (статус PRESENT_BUT_UNTESTED, живі виклики — тільки після exact approval капу).
- **Варіанти:** A) підтвердити локальний `D:\AI_DEPOT\vector_db\context-gateway` як фінальне сховище для пілота ($0, вже на диску); B) назвати конкретний NVIDIA-схов (NIM/vector DB), тоді — окремий approval на витрати і верифікацію лінії; C) відкласти шар до завершення фази 5.
- **Власник рішення:** Андрій (оператор).
- **Відповідь:** ___

## C15.L7 — Security/Privacy Review Iceberg-машин

### Q10: Хто підписує legal review (H2) для C15 і який артефакт підписується?
- **Шар:** C15.L7 — gate: legal review signed; code review of all C15 machines (`plan/readiness/READINESS_DNA.json:745-748`).
- **Статус на диску:** Iceberg-модулі (`web_launch/iceberg/`) ще НЕ реалізовані (фаза 5 pending), але каскадна поверхня вже існує: `web_launch/cascade.mjs`, `web_launch/server_cascade_api.mjs`, `web_launch/cascade_orchestrator.test.mjs`, `web_launch/iceberg-client.mjs` — тобто ревʼю має сенс визначити ЗАРАЗ, до реалізації фази 5.
- **Пропозиція:** той самий кваліфікований ревʼювер, що і C05.L6 (одна 30-хв сесія охоплює обидва шари — зменшує вартість), артефакт = `plan/legal/SWISS_LEGAL_LAYER.uk.md` + опис машин C15 з `plan/readiness/ICEBERG_ARCHITECTURE.uk.md`; підпис = відмітка в `bible/STATUS.md`.
- **Власник рішення:** Андрій (оператор) — підтвердити особу і формат підпису.
- **Відповідь:** ___

### Q11: Хто виконує code review усіх C15 машин і який формат вердикту?
- **Пропозиція:** код-ревʼю виконує агент (детермінований чекліст) + оператор підтверджує; чекліст: cascade logs не містять PII (цілі рядки логів без email/телефон/імʼя), consent-гейти не мутуються машинами, rollback аудит відтворюваний.
- **Формат вердикту:** чекліст-файл з шляхами до кожного каскадного модуля + рішення PASS/FAIL на рядок; зберігання: `plan/readiness/` + посилання з READINESS_DNA evidence.
- **Власник рішення:** Андрій (оператор) — так/ні по формату і виконавцю.
- **Відповідь:** ___

---

## Як відповідати (для оператора)

1. Пронумеровані рішення Q1–Q11 — мінімальний набір: на кожне достатньо «так/ні» або літери варіанта (A/B/C) плюс, де явно сказано, дата/особа/кап.
2. Жоден тутешній пункт не може бути підписаний агентом. Після твоїх відповідей оркестратор: (1) допише вердикт у `bible/STATUS.md`, (2) оновить evidence/статус шару в READINESS_DNA, (3) прибере шар з цього файлу (append-only історія: попередній стан залишається в git-історії).
3. Джерела кожного факту — локатори виду `шлях:рядок` у тексті питань. Якщо локатор застарів — це теж знайдена помилка: виправ README, а не підганяй факт.