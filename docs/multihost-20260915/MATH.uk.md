# Математика: припущення, приклади, спростування

Ці моделі пояснюють обмеження й формують falsifiable tests. Вони не є вимірами ноутбуків, прогнозом доходу чи доказом автономності. `test_contracts.py` — локальні приклади специфікації, не distributed runtime і не production matcher.

## Час і throughput

Для DAG з виміряними тривалостями `d_i`: `W = Σ d_i`, `CP = max_path Σ d_i`; при N однакових workers без overhead нижня межа `T ≥ max(CP, W/N)`. Для неоднакових машин `W/N` непридатне без нормалізації ресурсів; review, retries, transfer, integration й memory pressure збільшують час. Позитивні placeholder durations у topology validation не є вимірами.

Амдал: `speedup(N) ≤ 1 / (s + (1-s)/N)` за фіксованої роботи, serial fraction s і однакової швидкості parallel workers. Synthetic s=0.4: N=2 дає 1.429×, N=3 — 1.667×; це не 3×. При s=1 будь-яке N дає 1×. Конкретний CP приклад: A=4; B=6 після A; C=3 після A; D=2 після B,C. W=15, CP=12; при N=3 lower bound 12, не 5.

Нехай середній worker service time `T_w`, один інтегратор витрачає `T_i` на результат, незалежний reviewer `T_r`, transport rate `μ_t`. За стабільних однотипних jobs upper bound:

`throughput ≤ min(N/T_w, 1/T_i, 1/T_r, μ_t, provider_limit)`.

Якщо частина цих ресурсів спільна, bound може бути ще нижчою. Synthetic N=3, T_w=30min, T_i=2min, T_r=5min → worker bottleneck 0.1/min. N=3, T_w=2min, T_i=10min, T_r=1min → integrator bottleneck 0.1/min. Сам факт serial integrator не означає, що він завжди bottleneck. Попередню формулу worker з per-worker λ без N відхилено.

## Queue/backpressure

Для одного bottleneck зі стаціонарними середніми arrival λ і service μ необхідна умова стабільності `λ < μ`; це не гарантія bounded tail latency. При λ≥μ backlog росте без bound у нескінченному потоці. Little: `L = λ Wq_system` застосовується до узгоджених long-run stable averages, де Wq_system тут весь час у визначеній системі. Не підставляти короткий burst чи лише queue wait у system count.

Прихід 6 jobs/min і сервіс 4/min за 10 хв synthetic fluid model додає 20 jobs backlog. Це причина призупиняти admission, а не додавати нові логічні задачі. Реальний finite DAG має максимум 24 nodes; нова хвиля відкривається лише після acceptance і resource readback. Queue thresholds потребують вимірів; unbounded free quotas не припущення.

## Leases, fencing, retries

Safety — жодного stale/unauthorized effect. Liveness — eventually progress за відновленої authority/доступних ресурсів. Під час partition обидві властивості одночасно не припускаються; обираємо HOLD для effects.

Lease expiry не зупиняє процес і не скасовує уже надісланий effect. Необхідні authoritative epoch і compare-at-effect, durable idempotency та reconciliation. [Redis distributed locks: Disclaimer about consistency](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/#disclaimer-about-consistency) також рекомендує fencing для тривалих процесів; це джерело принципу, не рішення встановлювати Redis.

Held-out cases у локальних tests: epoch 12 після takeover 13 відхиляється; identical retry повертає попередній receipt; same key/changed payload — conflict; два disjoint jobs зі спільним source hash допустимі; heartbeat loss не звільняє process slot; process stop acknowledgment звільняє. Для production ці самі traces мають відбутися на фактичному effect sink із crash/restart/partition, а не лише в pure Python прикладі.

## Корисність хвилі та невідомі величини

`U_i = p_i V_i - review_i - (1-p_i) failure_i - execution_i`, усі члени в однакових utility units. Не складати долари з хвилинами без явно погодженого conversion. Unknown p/V/cost лишається UNKNOWN; можна показати сценарії та чутливість, не вигадувати confidence. Вибирати підмножину з урахуванням DAG, resources, ownership і спільного budget через чинний `harness.dag_wave_advisor.propose_economic_wave`. Порожня хвиля допустима; цей пакет не створює optimizer.

Порівняння економії: той самий task/input/oracle, accepted outcomes, retries, latency, input/output tokens і receipt-backed USD для обох routes. Менше retrieval characters не доводить економію primary subscription tokens. Попередній exact-zero review — один historical receipt, не постійна capacity.

## Reciprocal matching і fairness

Eligibility і permissions — hard constraints перед optimization. Якщо обидві сторони явно надали порівнювані task utility estimates, консервативна candidate edge utility `w_ab = min(u_ab, u_ba)` не приховує односторонній нуль. Це proposed experiment; unknown utility не 0 і не повинен автоматично виключати людину. UI повертає needs_information або дозволений ручний шлях; не вигадує рівень довіри.

Для eligible graph: max `Σ w_ab x_ab`, `Σ incident(v) x_ab ≤ capacity_v`, x binary. Загальний граф пар не обов’язково bipartite: Hungarian algorithm не загальний розв’язок. Для малої когорти — bounded exhaustive oracle, для масштабування тільки перевірений general b-matching solver/коректне reduction. Stable matching за preference lists і max-weight allocation — різні цілі; не обіцяти обидві одночасно.

Counterexample greedy: AB=9, AC=8, BD=8, capacity кожного=1. Greedy AB дає 9; optimum AC+BD дає 16. Знижена eligible capacity не може збільшити feasible set. Без permission ребро заборонене незалежно від weight. Tie policy має бути відтворюваною; постійне сортування за ID може створювати нерівну exposure, тому fairness перевіряється окремо, не називається доведеною детермінізмом.

Fairness evaluation до rollout: визначити legitimate eligible cohort/window, exposure count на eligible opportunity, missing-data bucket, capacity constraints, зрозумілі причини відмови й право виправити дані. Не збирати чутливі атрибути лише для красивої метрики. Не оголошувати causal fairness або кращий match через більше розкриття. Multi-party cycles — окремий future contract, не цей pair optimizer.

Freshness: `w(age)=2^(-age/half_life)` для finite age≥0, half_life>0; future/invalid timestamps → needs_information. w(0)=1, w(half_life)=0.5; freshness не надає і не відкликає consent.

Funnel: eligible distinct cases у заздалегідь визначеному вікні. 10 completed cases, 6 accepted, 4 missing → 6/10 із missing=4, а не 6/6. Повтор event id не змінює counts. Synthetic outcomes відділені від реальних.

Calendar: тільки перетин явно наданих інтервалів у UTC. Local Europe/Zurich ambiguous/nonexistent time потребує явного offset/fold choice; не створювати слот поза доступністю. Це не auto-booking.

Квантова механіка, «резонанс» і декоративні формули не є evidence ефективності; без task-shaped виграшу вони не входять до implementation.
