# Synera: виконання економними хвилями — V6, 15.09.2026

Оновлення після виконання V6-00: [повний workflow](workflow/WORKFLOW.uk.md), [свіжий звіт](workflow/REPORT.json). Усі 19 карток доповнені input/output/error/handoff contracts. Старий VALIDATION.json — попередній знімок; чинні hashes — у workflow/REPORT.json.

## 1. Результат і статус

Це доповнення плану, не реалізація нової версії застосунку. Власниця приймання: поточна операторка Codex. NOW: готовий до перевірки план завершення локального кандидата. Продуктова мета: соло-підприємець у Цюріху знаходить доречного партнера, розуміє взаємну користь, погоджує маленьку пробну співпрацю й підтверджує результат.

SENE/SNERO трактую як CNRA/Synera за знайденими артефактами. Джерела: `../README.uk.md`, `../HANDOFF_PROMPT_NEXT_CHAT.uk.md`, `../bible/SYNERA_BIBLE.json`, `../bible/MASTER_PLAN_ADDENDUM_V5.json`, `../readiness/MATH_AGENTS.uk.md`, `../import/AI_MEMORY_IMPORT.uk.md`. Оригінальну тригодинну транскрибацію в цій перевірці не перечитувала: використано її раніше підготовлену специфікацію. Нові висновки не приписуються транскрипту.

Корінь коду: `C:/Users/Andrii/Documents/ChatGPT/DeskTopAugust/synera-docs-review-20260904/source`.
Корінь плану: `C:/Users/Andrii/Documents/ChatGPT/DeskTopAugust/output/cnra-solo-rebuild-20260909`.

Перевірено зараз: git HEAD `2aa7fae`, чистий status у корені коду перед плануванням; усі 140 Node-тестів пройшли. `profile-store.mjs:120–132` досі відправляє `state` з погодженнями обох сторін одним JSON. Це розрив контракту між domain/store/SQL, який треба закрити до двостороннього пілоту. Старі 27 файлів білду, відсоток готовності та remote deployment не переперевірялися і не є свіжою оцінкою. README і handoff містять різні історичні числа; для нового запуску джерело — поточні тести й цільовий сценарій, не відсоток.

V6 уточнює порядок, математичні обмеження та економіку V5; не скасовує прийняті продуктові інваріанти. Старий master JSON — історія, `TASKS.json` — скінченне доповнення з посиланнями на старі задачі, не новий scheduler або ledger. Невідома назва Vuno 4 не підміняється іншим model ID. Handoff придатний для менш потужного виконавця, але не обіцяє ідеальне виконання.

## 2. Бізнес: що перевіряємо першим

Початковий сегмент: одна професійна спільнота Цюріха, соло-фахівці з поточною потребою, конкретною пропозицією і часом на мікропроєкт. Це гіпотеза сегмента. Організатор допомагає першій когорті; жодних автоматичних розсилок.

Продуктова обіцянка для тесту: «Знайди доречну співпрацю. Погодь невеликий перший результат. Зрозумій, чи це спрацювало». Пробна німецька версія: «Passende Zusammenarbeit finden. Einen kleinen ersten Schritt vereinbaren.» Носій DE-CH має перевірити природність.

Пріоритет за цінністю: (1) завершити реальну пару, (2) знизити час і непорозуміння, (3) перевірити попит, (4) додати диференціацію. Розпізнавання профілів і AI matching уже пропонують конкуренти, наприклад [b2match](https://www.b2match.com/value-adds/event-matchmaking). Тому «у нас AI» не є перевагою. Наша гіпотеза відмінності — пояснена взаємність, прозорі умови та підтверджений маленький результат; перевага над конкурентами ще не доведена.

Перед пілотом: п'ять добровільних usability-сесій на німецькому прототипі. Завдання: пояснити пропозицію, створити потребу, зрозуміти чому пара, змінити умову, відкликати згоду. Пропонований локальний критерій: 4/5 проходять без підказки; 5/5 розуміють, що запропонована співпраця ще не угода. Це критерій ітерації, не статистична валідація ринку.

Після двостороннього технічного приймання: зберегти запропоновані раніше 10 унікальних пар / 14 днів / 5 погоджених briefs / 3 прийнятих результати як навчальний пілот. Не називати це доведеним product-market fit. Вимірювати також відмови, невідповіді, повторний запит і хвилини оператора. Порівняння з ручним знайомством організатора — дослідницький baseline; без рандомізації не оголошувати причинний ефект.

North star: кількість результатів, які підтвердив отримувач, на всі сформовані пілотні кейси. Окремо — двостороннє підтвердження, missing feedback і спірні кейси. Не замінювати знаменник лише тими, хто відповів.

Економіка кейсу: `маржа = виручка − прямі витрати − хвилини підтримки × погодинна собівартість / 60 − інші змінні витрати`. Невідомі витрати залишаються невідомими. Прайсинг/WTP — наступний за реально отриманою користю окремий експеримент, без виставлення рахунків у цьому плані.

## 3. Дизайн для сучасного користувача

Впізнаваний елемент — двостороння картка «Мені потрібно ↔ Я можу допомогти», що переходить у картку спільного маленького результату. Один і той самий мотив у профілі, кандидатові, умовах і результаті. Brand DNA: зрозуміло, спокійно, предметно. Не копіювати чужі assets; зберегти власну назву/іконки до огляду чинного стилю.

Перший екран DE-CH: «Mein Bedarf», «Mein Angebot», «Zusammenarbeit». Один основний наступний крок; пояснення «Warum passt das?»; видимі невідомі поля та стан згоди. Додати EN, зберегти UK. Мову обирає користувач; не вгадувати її з етнічності чи міграційного статусу.

Ключові екрани: onboarding → кандидат із двома напрямами користі → умови і версія → статус двох погоджень → результат і feedback. На кожному: empty/loading/error/offline/revoked/expired; текстова причина і відновлення дії. Повільна мережа не повинна створювати повторне погодження; pending не показувати як persisted.

Design tokens у наявному CSS: кольори, контраст, типографіка, інтервали, focus, motion. Mobile 360/390 px і desktop 1280 px; клавіатура, 200% zoom, reduced motion, screen reader names. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — підлога; 24 CSS px target size має винятки, для основних touch-кнопок пропонуємо зручніші 44 px. Не оголошувати AA лише за автоматичним тестом: потрібні ручні перевірки focus, читання та помилок.

Спочатку стабільний інтерфейс і видимий контроль. Адаптація кольорів/щільності лише через allowlist із preview/reset. Експериментальна зміна навігації за кліками — PARKED до достатніх даних і перевірки доступності. «Сучасність» приймається через сценарії й людей, не думку моделі.

## 4. Автоматоми і математика

У старому каталозі вже 19 micro + 5 macro; 5 micro позначені як наявні. Це функції, не 24 окремі LLM-процеси. Наявні M01–M05 зберігаємо; кількість статусів зі старого каталогу не є новим аудитом усіх реалізацій. Для першого доповнення достатньо чотирьох функціональних зрізів: M06 свіжість, M07 обмеження навантаження, M12 лічильники воронки, M17 слоти. Нових контрольних служб потрібно нуль. Інші — за виміряною користю.

| Функція | Формула / метод | Прийняття і межі |
|---|---|---|
| M06 свіжість | `w=2^(-age_days/half_life_days)` | finite half_life>0; дата з майбутнього → needs_information; w у [0,1], монотонне згасання; явно показати дату. Вага не відкликає згоду й не оцінює людину. |
| M07 ліміти | max `Σ w_e x_e`, `Σ incident(v) x_e ≤ capacity_v`, x binary | Ребро тільки після eligibility. Для загального графа пар — general b-matching або bounded exhaustive reference; звичайний Hungarian не вирішує довільні квоти. Min-cost flow підходить після доведення двочастковості й коректності reduction. Для малої когорти brute-force oracle перевіряє оптимум і ties. |
| M12 воронка | distinct case IDs у фіксованому вікні; counts і denominators | duplicate event не збільшує count; missing явно; synthetic окремо. Марковська модель — пізніше після перевірки припущень стаціонарності/стану, не прогноз на 10 парах. |
| M17 календар | intersection of declared intervals, normalize instant to UTC | Відображення Europe/Zurich, DST gap/ambiguous time потребує явного вирішення; жодних слотів поза перетином. Не бронює автоматично. |
| M09 цикли ≤3 | directed cycles + vertex-disjoint set packing | Пізніший opt-in експеримент: відсутність 1:1 не дає згоди на 3 особи. Domain зараз двосторонній; потрібен окремий погоджений multi-party контракт. Не втискати трійку в pair-case. |

Виправлення меж старої математичної специфікації: Gale–Shapley потребує конкретної preference-моделі; стабільність і max-weight — різні цілі. Kaplan–Meier потребує коректного цензурування; застосовувати лише до часу відповіді, не «довіри». Beta-інтервал не є рейтингом людини; priors і одиниця спостереження явні. Thompson sampling не дорівнює повністю детермінованому UI; seed дає відтворюваність, але не прибирає випадковість. k≥5 і шум самі по собі не гарантують differential privacy: потрібні adjacency, sensitivity, epsilon і композиція. Публічну статистику малої когорти паркуємо. Не стверджувати, що циклів обміну немає в жодного конкурента: це не доведено.

## 5. Рої, які відкривають наступні хвилі

Ланцюг: `перевірений вузол → артефакт → локальне приймання → готові залежні вузли`. Worker може повернути пропозицію розбиття. Тільки Harness/оператор додає її після перевірки scope, DAG, ownership, ефектів, ціни та oracle. Нащадок успадковує обмеження; не створює власну суму грошей і не отримує credential.

Виконавчий план: `TASKS.json`; це дані для чинного Harness. Один власник файлу; три slots максимум для допустимих робіт; локальні ресурсні обмеження можуть знизити це до нуля. Два дослідники можуть читати паралельно; мутації спільних app.mjs/store/SQL інтегруються послідовно. На кожну задачу максимум одна корекція; після двох однакових відмов — діагностика/інший метод, не новий рій з тим самим prompt. Розбиття не обнуляє retry count батьківського deliverable.

Граф скінченний. Для заміни задачі підзадачами: лише підмножина її acceptance clauses, ті самі або вужчі owned paths, сума грошових reservations не росте, кількість вузлів лишається у плановій межі 24. Якщо дрібніше за самостійно тестований результат — робити локально. Після прийняття запланованих результатів завершити; не витрачати квоти заради квот.

Хвилі:

1. W0 — зафіксувати поточний код, oracle, матрицю вимог і live capacity.
2. W1 — незалежно: DE-CH словник/дизайн-специфікація; store/SQL contract; fixtures для математики. Hosted отримує тільки synthetic завдання.
3. W2 — послідовно закрити B2/C6/X6; окремо інтегрувати словник і дизайн через одного власника app.mjs.
4. W3 — M06/M07/M12/M17 і memory portability після стабільних контрактів, без дублювання існуючих модулів.
5. W4 — повний локальний journey двох synthetic sessions, adversarial cases, браузерний огляд.
6. W5 — лише після окремих зовнішніх дозволів: isolated DB, юрист, приватний пілот і потім бізнес-спостереження. Технічні gates не завершують людське приймання.

Розумна хвиля максимізує `Σ[p_i V_i − review_i − (1−p_i) failure_i]` за ресурсами й бюджетом. Величини в одних utility units; p — оцінений сценарій, не вигадана впевненість. Без вимірів лишаємо UNKNOWN і обираємо просту локальну послідовність. Використовувати `harness.dag_wave_advisor.propose_economic_wave`; не новий оптимізатор. Можлива порожня хвиля.

Нижня межа часу: `T ≥ max(critical_path, total_work / active_workers)`. Реальний час додає review, API wait, інтеграцію і переробки. Закон Амдала пояснює, чому більше моделей не прискорить послідовний store→worker→UI. Дати завершення без заміру task durations не обіцяємо.

## 6. Реальні провайдери та бюджет

**A RECOMMENDED:** локальні детерміновані інструменти, live-gated DOMOVYK за потреби, exact-zero Token Monster для корисного synthetic завдання. **B FALLBACK:** тільки `deepseek/deepseek-v4.1-flash` у межах уже наданих $0.50, після усунення блокувань існуючим шляхом. Інші платні моделі не дозволені цим cap.

| Маршрут | Свіже свідчення | Вердикт |
|---|---|---|
| OpenRouter Ling FIN | один завершений виклик; requested=actual; authoritative cost=0 | Транспорт/ціна перевірені. Якість часткова; не універсальний coder. |
| OpenRouter Ling SANTE | видно в live role-list | Кандидат, у цій задачі не викликався. |
| TokenRouter `z-ai/glm-5.3-free` | authenticated doctor READY_ZERO, promotion_allowed=false | Каталог/нульова ціна, не гарантія актуальної usage-квитанції. Не підміняти Flash. |
| NVIDIA `nvidia/nemotron-3-ultra-550b-a55b` | офіційна модель/hosted trial; локальний doctor бачить key і no-spend metadata | Прямий NIM не має доведеного тут canonical runtime receipt. У базовий throughput не включати. |
| DeepSeek V4.1 Flash | $0.15/M in, $0.60/M out; price preview | Платний маршрут; preflight BLOCK на старих plan schema errors. Не обходити й не ремонтувати чужі плани в цьому scope. |

Free doctor: 20 text models у поточному каталозі. Не 100 провайдерів і не 20 незалежних квот. [OpenRouter FAQ](https://openrouter.ai/docs/faq) описує спільні free-ліміти: 50/day або 1000/day після придбання мінімум $10 кредитів. Не купувати кредити для збільшення ліміту без окремого дозволу. [NVIDIA NIM FAQ](https://docs.api.nvidia.com/nim/docs/product) описує доступ для прототипування; щоденне відновлення кредитів для кожної моделі не підтверджено. [Nemotron model](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b/modelcard), [GLM free](https://www.tokenrouter.com/models/z-ai/glm-5.3-free/), [GLM Flash](https://www.tokenrouter.com/models/z-ai/glm-5.3-flash/), [DeepSeek price](https://openrouter.ai/deepseek/deepseek-v4.1-flash).

Спільний cap на задачу: `spent + unresolved_reserved + new_reservation ≤ 0.50 USD`, додатково чинний shared daily cap $10. Кожна хвиля отримує лише залишок cap; ніколи нові $0.50 на дочірній запуск. Плановий розподіл DeepSeek: $0.10 на synthetic contract review, $0.15 на складний isolated patch proposal, $0.15 на adversarial review, $0.10 резерв. Це максимуми, не мета витрат. Для input 2500/output 4000 quoted tokens: $0.002775, без гарантії такого output/reasoning. Якщо canonical runner не може обмежити сукупний cap між runs — paid waves HOLD.

Перед кожною хвилею refresh exact price/identity/quota, no fallback, privacy proof, spend preview, canonical reserve. HTTP 429 — повага retry-after і bounded fallback до іншого eligible маршруту; не rotation акаунтів. Unknown cost, truncated output або відсутній receipt — quarantine/reconcile; не retry генерації. `swarm.py --collect-only` відновлює вже завершений артефакт без нового inference.

Вимірювати $/accepted artifact, токени, wall time, review minutes, retries й причину відхилення. Підписка Codex і час людини не є $0 лише тому, що provider receipt нульовий.

## 7. Пам'ять і передача роботи

Два різні потоки. Робочий контекст розробки: Harness володіє задачами/прийманням, Context Gateway — source-linked retrieval, Token Monster — provider/cost, чинні KI transport — доставка. Немає другого vector-store, черги чи memory daemon. Капсула містить task_id, revision, state, owner, objective, exact owned paths, source hashes/locators, input/output/errors, acceptance, blockers і next action. Hard rules завжди inline. Summary не заміняє source; конфлікт/застарілий hash → перечитати конкретне джерело.

Продуктовий import: розвинути існуючі `profile-import.mjs`, `chatgpt-transfer.mjs`, `profile-portability.mjs`, не писати новий importer. Локально обрані дані → мінімальна чернетка → preview кожного поля → явне підтвердження → існуючий store. Перевірити archive limits, schema versions, prompt injection, third-party PII, duplicate import, revoke/export/delete. Regex із нульовими знахідками не доводить повну анонімність; raw chats і невідомі поля залишаються local_only. Немає автоматичного читання Claude/ChatGPT історії або hosted upload.

Cache reuse тільки за збігом task fingerprint, input/source hashes, artifact hash та oracle version. Прийнятий результат зберігати в наявному Harness claim ledger з source locator; V6 JSON не є журналом runtime-подій.

## 8. Контракт для менш потужного виконавця

Дати лише одну готову задачу з TASKS.json і потрібні джерела. Worker повертає `{task_id, input_hashes, changed_paths, artifact_path, tests_run, observations, unknowns, proposed_children}`. Не приймати його `PASS` як власний verdict. Матеріальні зміни чинного коду: відтворення дефекту → semantic test RED → вузька зміна → GREEN → mutation test на критичних gates → readback сценарію. Тести не зводити до наявності рядка чи маркера.

Негативні приклади: чужа approval у payload; приховане missing feedback; мережевий error з UI success; старий hash; worker child із новим бюджетом; import із приватними контактами; переклад, який прибрав заперечення зі згоди. У кожному випадку відхилити результат, зберегти причину, перейти до вузького виправлення.

Вхідні stop rules: без install/delete/commit/push/deploy/production migration/payment/external message; лише поточна окрема authority може це змінити. $0.50 дозволяє inference точного DeepSeek, не довільні покупки. Код цього turn не змінювався. Для майбутньої реалізації використовувати HANDOFF.uk.md.

## 9. Що виявила практична перевірка рою

`FREE_REVIEW.json` — незмінений output Ling; `FREE_REVIEW.json.receipt.json` — canonical receipt copy. Повний JSON, 228 prompt/2714 completion tokens, 15.08 s, $0.00. Із п'яти test-spec proposals локально: три корисні напрямки, два відхилені. Material race потребує конкретизації stale vote після edit; forged approval має перевіряти principal A→approval B; expiry test має починатись із двох валідних approvals, щоб не пройти через іншу причину.

Відхилено: `missing-feedback-denominator` прибирає missing зі знаменника; правильний fixture — 10 завершених кейсів, 6 прийнятих outcomes, 4 missing → 6/10 і missing=4, не 6/6. `recursive-worker-budget-escape` приймає proposal, що обходить cap; правильна реакція — reject violating child, no dispatch, unchanged reservation. Це test specifications, не вже реалізовані regression tests. Пакет не прийнято цілком; виправлення локальне, не заслуга worker.

## 10. Definition of done

План прийнятий, коли DAG ациклічний, кожна задача має owner/path/dependencies/oracle/rollback, всі джерела/посилання на код існують, небезпечні кроки лишаються gated і немає claims про готову апку. Реалізація D1 приймається лише після fresh suite/build/browser journey; D2 — isolated authenticated DB/RLS; D3 — дві реальні уповноважені людини; D4 — elapsed pilot evidence. Жоден нижчий рівень не закриває вищий.

V6-00 виконано: baseline 140/140, control PASS, approval invariant FAIL. Дефект відтворено, B2 не виправлено. NEXT, 15 хвилин: V6-03 — точний per-party persistence contract, після нього V6-04 з RED→GREEN. Production лишається PARKED.
