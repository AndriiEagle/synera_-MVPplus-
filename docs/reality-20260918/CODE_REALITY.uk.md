# Що код робить насправді — виміряно, а не переказано

**Ревізія R4, 2026-09-18.** Джерело: modern source, коміт `2aa7fae6a4f002ed880cb97ec780de41e328af97` від 2026-09-13, локальний шлях `Documents/ChatGPT/DeskTopAugust/synera-docs-review-20260904/source`. Кожне число нижче отримане запуском у цій сесії, не читанням документів.

## Навіщо цей документ

Пакети R1, R2 і R3 писалися **без доступу до коду**. Кожен наступний виконавець читав проєкцію попередньої проєкції. Через це документи описують стан, який на місяць відстає від дійсності, і — гірше — називають зробленим-не-зробленим те, що зроблено.

Автор R3 (сесія Claude, 2026-09-17) пройшов той самий шлях: чотири кроки аудиту документів про код, який лежав на диску за один `robocopy`. Два висновки R3 виявилися хибними саме через це. Вони виправлені нижче.

## Виміряно

| Перевірка | Команда | Результат |
|---|---|---|
| Набір тестів | `node --test web_launch/*.test.mjs neon/worker.test.mjs operator_dashboard.test.mjs` | **148 / 148**, нуль падінь |
| Той самий набір до фіксу приймань | те саме | 140 / 140 |
| Offline build | `node web_launch/build.mjs --offline` | 27 файлів, `published: false` |
| Генерація Neon SQL | `node neon/generate-schema.mjs` | `case-state.migration.sql` перегенерувався **байт-у-байт ідентично** |
| Тести матчера | `matching.test.mjs` | 16 тестів |

Прогін робиться **з кореня репозиторію**, не зсередини `web_launch/`: три тести читають шляхи виду `web_launch/...` і `supabase/...`. Запуск із неправильної теки дає три фальшиві падіння.

## Що є в коді, чого немає в жодному документі пакета

- `operator_dashboard.mjs` (12 138 Б), `.html` (8 959 Б), `.test.mjs` (5 509 Б)
- `neon/`: `schema.proposal.sql` (23 998 Б), `case-state.migration.sql` (19 154 Б), `case-state.acceptance.sql` (13 119 Б), `worker.mjs` (13 211 Б), `worker.test.mjs` (18 136 Б), `generate-schema.mjs` (12 039 Б)
- `supabase/`: `case-state.proposal.sql` (18 432 Б), `case-state.acceptance.sql` (12 988 Б), `real-pilot.proposal.sql` (16 329 Б), `pilot-consent.proposal.sql`
- жива Neon-база вже виконує `neon/schema.proposal.sql` — 106 statements, acceptance PASS (`docs/NEON_LAUNCH.uk.md`, цитовано в `bible/STATUS.md`)
- `web_launch/server/local-profile-ai.mjs` + `profile-ai.schema.json` — AI-адаптер зі схемою
- `profile-import.mjs`, `profile-portability.mjs`, `chatgpt-transfer.mjs`, `legal.html`, PWA (`sw.mjs`, `manifest.webmanifest`)
- `docs/meeting-gilbert/` — пілотний пакет на сім файлів, близько 94 КБ

## Шість тверджень пакета, які код спростовує

### 1. P02 «PARTIAL, capacity task is not full mode implementation»

**Джерело:** `docs/context-20260916/CONTEXT.json`, `requirements[P02].gap_or_boundary`.

**Насправді:** усі п'ять режимів реалізовані в `web_launch/matching.mjs` — `reciprocalCandidate` (exchange, joint_project), `paidCandidate`, `referralCandidate`, `hybridCandidate`, диспетчер `evaluateModes`. З ролями (`buyer`/`supplier`, `introducer`/`seeker`), конфліктом ролей, станом `needs_information` при незаповнених полях і переліком незакритих умов (`amount`, `currency`, `invoice`, `acceptance`). Позитивні й негативні кейси — у `matching.test.mjs`, серед них: paid service вимагає явних buyer і supplier; referral не може вивести згоду третьої сторони; hybrid валиться без будь-якого названого компонента; одностороння вигода не видається за взаємну.

**Доказ різниці:** у снапшоті `code_snapshot/matching.mjs` від 2026-09-07 цих функцій немає взагалі, файл 9 243 Б; поточний — 21 142 Б.

### 2. G8 operator dashboard «Немає у V6», загублена

**Джерело:** `synera-gap-V4-V5-V6.md`, розділ 4c і підсумок 6.

**Насправді:** `operator_dashboard.mjs` існує разом із HTML і тестами, тести входять у 148, що проходять.

### 3. P04 «client transport defect remains open» — без назви дефекту

**Джерело:** `docs/context-20260916/CONTEXT.json`, `requirements[P04]`.

**Насправді:** дефект названий точно в `bible/STATUS.md` і локалізований у `web_launch/profile-store.mjs`, `saveCaseState`: метод приймав цілий JSON-блоб `state` разом із `approvals`, тому одна сторона могла записати приймання другої та статус `approved_for_next_step`. Відтворено: на провід ішло `approvals: ["u-2"]` від імені `u-1`.

Клієнтську частину закрито (`SYN_OWN_APPROVAL_ONLY` у `saveCaseState`, 8 нових тестів у `case-approval-guard.test.mjs`, шість із них падають на старому коді). **Серверна частина відкрита:** авторитетне забезпечення — `match_case_approvals` з RLS у `supabase/case-state.proposal.sql`, мітка `PRESENT_BUT_UNTESTED`, жоден statement не виконувався проти бази.

### 4. ADP-05 «HARD_COLLISION_NEEDS_OWNER_DECISION» — телеметрія проти мінімізації

**Джерело:** `docs/adaptive-20260917/CONTEXT_R3.json`, моя ж вимога.

**Насправді:** контракт телеметрії вже реалізований — `SYN_TELEMETRY_CONTRACT` у `web_launch/economics.mjs`: append-only `events.jsonl`, без згоди не пише нічого, відкидає PII, невідомі типи й осиротілі operator-хвилини, дедуплікація 10 секунд, шлях перевизначається для тестів, node-only. Три тести в `economics.test.mjs`. Колізія, яку R3 подавав як нерозв'язану й таку, що потребує рішення власника, розв'язана в коді саме тим способом, який R3 і рекомендував.

### 5. ADP-08 «потрібне рішення, яка з двох формул керує вибором пари»

**Джерело:** `docs/adaptive-20260917/ADP-08-DECISION.uk.md`.

**Насправді:** `evaluateAlgorithmicMatch` у `matching.mjs` уже рахує покриття в обидва боки, **гармонічний** `mutual_score` і окремо `asymmetry`, з `evidence_ids`, `reason_codes`, списком `ALGORITHMIC_NOT_SCORED`, `provider_calls: 0` і `expected_value_usd: null`. Гармонічне середнє має ту саму анти-односторонню властивість, що й запропонований R3 `min(u_ab, u_ba)` — нуль з одного боку обнуляє результат — але воно гладше й уже покрите тестами. Документ `docs/ALGORITHMIC_MATCHING.uk.md` описує це як `VERIFIED_LOCAL`.

R3 виводив гіршу версію наявного рішення з описів. Рішення ADP-08 лишається чинним лише як пояснення, **чому** односторонній нуль не можна ховати; вибір формули вже зроблений у коді.

### 6. «Modern source not published» — правда, але без інвентарю

**Джерело:** `docs/multihost-20260915/SOURCE_MANIFEST.json`, `modern_source_published: false`, `remote_base_gap: 12 commits / 116 files / 10 698 insertions`.

**Насправді:** твердження чинне — код досі не опублікований. Але жоден документ не казав, **що саме** в тих 10 698 рядках. Перелік вище закриває цю прогалину. Резервна копія всієї історії зроблена 2026-09-17 як `git bundle --all`, 4 788 об'єктів.

## Що з цього справді лишається зробити

`bible/STATUS.md` від 2026-09-11 називає це точно, і після фіксу приймань лишається три пункти:

1. `case-state.acceptance.sql` має пройти на одноразовій базі — Neon branch або локальний Docker Postgres. Потрібне окреме людське погодження. Нічого з цих файлів ще не бачило Postgres, навіть синтаксично.
2. `neon/worker.mjs` має дозволити `match_cases` і `match_case_approvals`; сьогодні в його наборі `TABLES` шість таблиць.
3. UI хвилі A має викотитись разом із міграцією: без нього база відхилить brief v2, а після неї `meetings_need_approved_case` заріже будь-яке запрошення без кейса, погодженого обома.

## Межі цього документа

Виміряно на Linux, Node v22.22.2, із копії робочої теки. Жодного звернення до бази, жодного deploy, жодної міграції. Браузерні сценарії, реальні дві згоди, платежі й production readiness не перевірялися й тут не стверджуються. Документ нічого не диспатчить: `dispatch_allowed` лишається `false`, авторизована стеля витрат — 0.
