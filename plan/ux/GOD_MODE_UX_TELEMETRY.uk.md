# God Mode UX + телеметрія — CNRA/Synera

Статус: `DESIGN_SPEC — фундамент для Wave A/G`
Дата: 2026-09-10. Ідея-якір: **сила користувача = телеметрія оператора**. Чим більше Ліна/Марко відчувають контроль — тим глибша згода і чистіші дані. Усі патерни етичні, усі метрики псевдонімні, весь стек локальний до явної згоди.

## 1. Сім принципів «God Mode»

| # | Принцип | Механізм | UI прояв | Метрика |
|---|---|---|---|---|
| 1 | Radical Clarity | зниження невизначеності → довіра | статус-степер пари (профіль→матч→кейс→умови→тріал→результат); версія умов і хто змінював; «чому я бачу цих кандидатів» простою мовою | time-to-understanding <3с; ≥85% пар без clarification |
| 2 | Agency First | самодетермінація | кожна мутація = явне «Я підтверджую» + скасування в 1 клік; система пропонує, людина вирішує | скасувань після 5хв <5% |
| 3 | Instant Mastery | прогресивне розкриття | 1-й екран = 1 з 3 режимів картками з прикладом результату; живе прев'ю профілю; дефолти з причиною | time-to-first-value <90с |
| 4 | Social Proof Without Pressure | інформаційний вплив без тиску | «Цього тижня в Цузі активні 7 професіоналів твоєї сфери. 3 пари завершили тріал.» Без рейтингів людей | конверсія +10% з блоком |
| 5 | Safety as Power | реактанс-менеджмент / endowment | 7 тумблерів згоди; Export/Delete завжди видимі; «Твої дані, твої правила» | ≥5 тумблерів увімкнено = довіра |
| 6 | Micro-Delight | Peak-End | celebration 300мс на approval (вимкнювано); confetti лише на завершенні тріалу; нуль gamification-валют | completion кроків після впровадження |
| 7 | Outcome Visibility | боротьба з delayed-feedback падінням мотивації | «Твій шлях до результату» з відміченими кроками + блок «Твої результати» посередині процесу | drop-off <20%/крок |

## 2. Вісім підсвідомих патернів (етичні)

| Патерн | Де в journey | Копірайт (UK) | UI |
|---|---|---|---|
| Commitment & Consistency | вибір режиму → профіль | «Обери один режим — і змінюй будь-коли. Це твій перший крок.» | картки режимів; прогресс-бар, що ніколи не показує 0% після першого поля |
| Loss Aversion | повернення з паузою | «Профіль готовий на 80%. Матчі, що чекають, можуть розійтися.» | soft-banner (не модалка), кількість матчів без імен |
| Social Proof | дашборд, запрошення | «7 професіоналів у Цузі активні цього тижня. 3 пари завершили тріал.» | анонімний блок зі СПРАВЖНІМИ числами телеметрії |
| Authority | умови, перший кандидат | «Спільнота Гілберта ручається — 3 завершені співпраці.» (лише факти) | бейдж community vouch з критерієм, без гарантій |
| Scarcity (етична) | запрошення в когорту | «У пілотній групі 3 місця. Це справжній ліміт.» | лічильник реальних місць; далі — чесний waitlist |
| Reciprocity | початок пілоту | «Дай 15 хвилин на бриф — отримай 10 підібраних кандидатів.» | дошка «твій внесок → що отримуєш», виконання обіцянки видиме |
| Endowment Effect | налаштування, згоди | «Твій профіль — твої правила. Експорт і видалення — завжди тут.» | мова власності всюди; перелік твоїх активів |
| Peak-End Rule | approval; підтвердження результату | «Схвалено! Ви — офіційна пара.» / «Результат зафіксовано. Це завершення пілоту — не кінець розмови.» | мікро-анімація 300мс; підсумкова картка з 3 досягненнями + «що далі» |

Обмеження: нічого з цього нестворює тиск на рішення про гроші/умови — інваріант §1.3 Біблії (ціну вписує людина). Патерни лише на onboarding/прогрес/завершення.

## 3. Telemetry schema

Правила: append-only; псевдонімно (pair_id/profile_id = hash); local-first (`events.jsonl`); sync — лише за окремою згодою; **NO PII, NO raw text, NO model outputs**; дедуп 10с; `analytics_consent` — окремий тумблер (Аніта з consent=false дає нуль подій, крім факту відмови).

Core events: `profile_started, profile_completed, mode_selected, candidate_viewed, case_created, approval_given, approval_withdrawn, terms_revised, intro_requested, trial_agreed, trial_completed, outcome_submitted, feedback_given, feedback_missing, dispute_opened, export_requested, delete_requested`

Properties кожної події: `pair_id(hash), profile_id(hash), mode, version, hash(dedup), source(real|synthetic), timestamp(UTC), duration_ms, user_agent, locale, step_origin, city_bucket`.

Funnel: конверсія кожного переходу + drop-off reasons + time-to-complete (median/p90).
Quality: `approval_revision_count, terms_change_count, dispute_rate, ghost_rate, feedback_latency_days, consent_withdrawal_rate, export_before_delete_ratio`.
Operator: `support_minutes_per_pair, clarification_count, moderation_actions, time_to_resolution, manual_intervention_rate`.

Зв'язка з існуючим контрактом: події реал/синтетика вже розділені в economics.mjs (CNR-012, `real_authorized` = caller-label, не доказ). Телеметрія — розширення того самого event contract, НЕ другий журнал.

## 4. Operator Cockpit (для Андрія)

Реалізація: один локальний `operator_dashboard.html` (+модуль), читає `events.jsonl` з диска. Без бекенду, без мережі, авто-refresh 60с, експорт CSV.

Панелі:
1. **Pilot Health** — активні пари, жива воронка, % missing feedback, відкриті диспути, середній час тріалу.
2. **Cohort Quality** — розподіл режимів/міст, ghost rate, legacy vs pilot профілі, real vs synthetic.
3. **Operator Load** — хвилини today/week: clarification / moderation / technical / dispute, тренд.
4. **Revenue Signals** — WTP-розподіл (без імен), accepted outcomes vs manual baseline, paid/referral пари.
5. **Alerts** — сплеск відкликань згоди (≥2/24год), відкритий диспут, ghost>25%, version mismatch, drop-off>30%.
6. Фільтри за когортами/містами (де саме болить: Цуг vs Вінтертур).

## 5. Атомарні UI-кроки G1–G8 (до SYNERA_BIBLE.json, Wave G)

Виправлено проти первинної пропозиції: **жодних нових ui/*.mjs модулів** — все вживається в наявні `app.mjs`/`index.html`/`economics.mjs` (інваріант «другого модуля немає»). Тести — нові `*.test.mjs`.

| Крок | Файли | Зміна | Маркер | Тест |
|---|---|---|---|---|
| G1-consent-panel | app.mjs, index.html, mobile-pilot.test.mjs | панель 7 тумблерів з мікрокопірайтом, default off, revoke → миттєвий ефект | SYN_CONSENT_PANEL_7 | revoke comparison → introduction blocked |
| G2-approval-moment | app.mjs, index.html | 300мс анімація на `approval_given`; нічого на withdraw; вимкнювач у налаштуваннях | SYN_APPROVAL_CELEBRATION | подія → анімація рівно раз |
| G3-terms-diff | app.mjs, index.html, business-case.test.mjs | notice «Марко оновив умови. Ось що змінилося» + diff було/стало, без червоного страху | SYN_TERMS_DIFF_SHOWN | 3 сценарії diff рендеряться |
| G4-outcome-card | app.mjs, index.html, real-pilot.test.mjs | підсумкова картка після trial_completed; outcome_submitted — окремо | SYN_OUTCOME_CARD | state machine trial→outcome |
| G5-data-portability | app.mjs, index.html, profile-portability.test.mjs | Export = повний JSON; Delete = 2 кроки; завжди видимі | SYN_EXPORT_DELETE_VISIBLE | export round-trip; delete очищає |
| G6-cold-start-logic | app.mjs | (доопрацювання A12) пояснення порожнього стану статусами priority-мапи | SYN_COLD_START_EXPLAINED | 5 статусів досяжні з UI |
| G7-telemetry-writer | economics.mjs, economics.test.mjs | append-only запис подій в events.jsonl за контрактом CNR-012; analytics_consent gate | SYN_TELEMETRY_CONTRACT | consent=off → 0 записів |
| G8-operator-dashboard | operator_dashboard.html (report-артефакт, не product) | cockpit 5 панелей + alerts з реального логу; 0 мережевих запитів | SYN_OPERATOR_COCKPIT | fixture-лог → панелі непусті |

Порядок: G1→G3→G4 після відповідних A-кроків; G7→G8 після B-хвилі; G5/G6 будь-коли після A12.
