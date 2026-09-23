# PARTIAL-аудит: C01.L6 + C04.L3 (фаза 8, 2026-09-23)

Оркестратор-картка B. Метод: evidence з `plan/readiness/READINESS_DNA.json` → перевірка на диску (файли, тести, git) → вердикт. Без правок DNA.

## Підсумкова таблиця

| Шар | Статус | Доказ на диску | Рекомендація |
|---|---|---|---|
| C01.L6 (стани доказів self_declared→evidence_supplied→checked_with_scope→outcome_confirmed) | PARTIAL | `web_launch/proof-state.mjs` (3362B, коміт f2b3265), тести `node web_launch/proof-state.test.mjs` → **3/3 pass, 0 fail**. FSM-ланцюг повний (рядки 7, 13–15), перехід у `checked_with_scope` вимагає `scope_notes` (рядки 51–52), двосторонні переходи + скидання на materiальну зміну. **«Лишається» підтверджено на диску**: полів `source/date/author/scope/expiry` на кожну перевірку НЕМАЄ — лише `scope_notes` (рядки 25, 64). | **Залишити PARTIAL** |
| C04.L3 (рівні аудиторії на поле: public/community/після зустрічі/лише я) | PARTIAL | `web_launch/field-audience.mjs` (3629B, коміт 936c380): `filterProfileForAudience` (рядок 60), `canViewField` (рядок 84); тести `node web_launch/field-audience.test.mjs` → **6/6 pass, 0 fail**; використання в `web_launch/soft-block.mjs` (рядок 7: import) та e2e-тесті. **«Лишається» підтверджено на диску**: серверного застосування НЕМАЄ — grep `field-audience\|audience` у `neon/worker.mjs` = 0 збігів, у `web_launch/privacy/` = 0 збігів. Застосування поки лише на композиційному/клієнтському рівні. | **Залишити PARTIAL** |

## Evidence-chain

### C01.L6
- Claim: FSM станів доказів повний, 3/3 тестів; бракує source/date/author/scope/expiry.
- Source/locator: `web_launch/proof-state.mjs`, `web_launch/proof-state.test.mjs`, READINESS_DNA `$.categories[0].layers[5]`.
- Independent check: запуск `node web_launch/proof-state.test.mjs` (3 pass/0 fail); grep по файлу — поля `source|date|author|expiry` відсутні, є тільки `scope_notes`.
- Verdict: PARTIAL чесний → **залишити**.

### C04.L3
- Claim: рівні аудиторії на полі реалізовані, тести проходять; бракує серверного застосування.
- Source/locator: `web_launch/field-audience.mjs`, `web_launch/field-audience.test.mjs`, READINESS_DNA `$.categories[3].layers[2]`.
- Independent check: запуск `node web_launch/field-audience.test.mjs` (6 pass/0 fail); grep по `neon/` (worker) і `web_launch/privacy/` — серверного споживача немає; єдиний споживач — `web_launch/soft-block.mjs`.
- Verdict: PARTIAL чесний → **залишити**.

Обидва шари: рекомендація — залишити PARTIAL; підняття до DONE потребує відповідно (a) полів provenance (source/date/author/scope/expiry) на кожну перевірку, (b) серверного enforcement на кожне поле в `neon/` worker-шарі.