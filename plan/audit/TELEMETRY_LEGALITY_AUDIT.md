# TELEMETRY LEGALITY AUDIT — «максимум легальних даних» vs диск (2026-09-23)

Картка F, виконана локально після `Add credits`. Метод: інвентаризація телеметричних поверхонь з диск-якорями.

## Канали, що Є на диску (аналітичні машини, всі детерміновані з тестами)

| Канал | Модуль | Що вимірює | Legality-гейт | Тести |
|---|---|---|---|---|
| Воронка кейсів | `web_launch/funnel-analytics.mjs` | Kaplan-Meier survival + Absorbing Markov по CASE_LIFECYCLE_STATES | агрегати, не сирі події | funnel-analytics.test.mjs |
| Вірусність | `web_launch/virality.mjs` | kFactor, timeToFirstPair, `publishableVirality(k=5)` | k-гейт на публікацію | virality.test.mjs |
| WTP (готовність платити) | `web_launch/wtp.mjs` | wtpCurve, viablePrice | **`consent !== true → CONSENT_REQUIRED`** (рядок 15 — згода окрема від участі, прямо в коді) + k=5 у кривій | wtp.test.mjs 6/6 |
| Публічна статистика | `web_launch/k-anon.mjs` | noisyCount (DP-шум), canPublish | **DEFAULT_K=5**; нижче k — не публікується | k-anon.test.mjs 6/6 |
| Адаптація UI | `web_launch/thompson.mjs` | bandit варіантів | guardrails у тестах | thompson.test.mjs |
| Самопокращення | `web_launch/ma4.test.mjs` | офлайн-реплей, holdout-ворота, append-only журнал рішень | без апрувалу не промотується | 5/5 |

## Legality-інфраструктура (реальна, на рівні БД)

- **RLS**: 28 policies у `neon/schema.proposal.sql` + 12 у `case-state.migration.sql` (перевірено case-insensitive — обережно, `create policy` в нижньому регістрі).
- **Згода в самій БД**: `cases_consent` — restrictive policy (`case-state.migration.sql:157-159`, 217): кейси недоступні без `pilot_consents.policy_version='2026-09-05-pilot-3'` — UI не може обійти.
- **Рівні аудиторії на поле**: `web_launch/field-audience.mjs` + soft-block **fail-closed** (P2 fix, коміт 4cb7dd3) — але enforcement поки клієнтський/композиційний (C04.L3 PARTIAL: `neon/` не споживає field-audience).
- **Конфіг демо закритий за замовчуванням**: worker генерує `/config.json` з серверних flags, «початково все закрито» (`docs/NEON_LAUNCH.uk.md:49`).
- **Cascade логи**: hash-chained immutable, без PII (privacy_audit 6/6, перевірка regex `consentState[`, `consentState.*=`).
- **GPS не запитується**: мапа OpenStreetMap opt-in з чесним попередженням про IP (`index.html:25`).

## Чесний вердикт: «легальний максимум» НЕ досягнутий — і це чесно задокументовано

1. **Серверного event-каналу немає**: `neon/worker.mjs` — вузький проксі (auth + config), нуль телеметричного логування. Аналітичні машини готові їсти події, але події ніхто не збирає. Це свідомо: збір подій має встати після Q3 (міграція) і за деревом метрик (C09.L4) — інакше збиратись буде шум без гейтів.
2. **C09.L4 PARTIAL**: north star + дерево метрик з guardrails — немає (PRODUCT_DNA поза репо). Без нього «максимум даних» = збір без цільової функції, що протилежно мудрості системи.
3. **C04.L3 PARTIAL**: enforcement рівнів аудиторії поки не серверний.
4. **Dark-pattern захист вбудований**: согласованість C10 «ріст під контролем користувача» — k-гейти, consent-gates, WTP тільки зі згодою; exploitation-стійкість зафіксована інваріант-тестами (no-consent-mutation у privacy_audit).

**Підсумок**: legality-фундамент (RLS 40 policies + consent-in-DB + k=5 + DP-noise + fail-closed privacy) — **справжній і сильний**; збір «максимуму легальних даних» — це фаза-9 (event-pipeline за деревом метрик), і робити його до Q3/юриста було б не мудро, а навпаки.

Evidence chain: кожен рядок таблиці має шлях:рядок або тест-прогон з цього ж дня; RLS-числа — case-insensitive rg по neon/*.sql.