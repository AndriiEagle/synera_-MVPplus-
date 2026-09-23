# PARTIAL-аудит: C06.L1 + C09.L4 + C13.L4 (фаза 8, 2026-09-23)

Оркестратор-картка C. Метод: evidence з `plan/readiness/READINESS_DNA.json` (`$.categories[5].layers[0]`, `$.categories[8].layers[3]`, `$.categories[12].layers[3]`) → перевірка на диску → вердикт. Без правок DNA.

## Підсумкова таблиця

| Шар | Статус | Доказ на диску | Рекомендація |
|---|---|---|---|
| C06.L1 (Brand DNA: обіцянка, голос, 3 ключові слова, заборони) | PARTIAL | `web_launch/index.html`: intro-копі присутня (title «Synera — співпраця для солопідприємців», header brand `synera●`), `style.css` має brand-стиль. **«Next» підтверджено**: письмового brand-листа НЕМАЄ — `web_launch/brand*` відсутній, жоден md у `bible/`/`plan/` не є бренд-листом (згадки «brand» лише в READINESS/ICEBERG/EXECUTION/HANDOFF контекстах). | **Залишити PARTIAL** |
| C09.L4 (North star і дерево метрик) | PARTIAL | **«Лишається» підтверджено**: документа `PRODUCT_DNA` у репо НЕМАЄ (`glob **/*PRODUCT_DNA*` = 0 файлів) — evidence-посилання вказує на зовнішній план-док. Пошук дерева метрик з guardrails у `plan/`+`bible/` не знаходить окремого артефакту; монетизаційні розділи лише в READINESS-доках. Гейт «bilaterally confirmed useful outcomes per eligible case» не інструменталізований. | **Залишити PARTIAL** |
| C13.L4 (Дисципліна одного писача) | PARTIAL | Артефакти на диску верифіковані: `C:\Users\Andrii\.claude\tools\kilo_watch.py` (існує, `--help` виконується) + `session_preflight.py` (існує). **«Next» підтверджено**: per-tree lock-файл, що блокує і другий Claude/Kilo-сеанс, не реалізований у репо — захист поки на рівні Kilo-простого FM-011 контуру. | **Залишити PARTIAL** |

## Evidence-chain

### C06.L1
- Claim: intro copy в index.html є; письмовий brand-лист відсутній.
- Source/locator: `web_launch/index.html` (title/header), DNA `$.categories[5].layers[0].next = "brand sheet"`.
- Independent check: `Test-Path web_launch/brand*` → False; `rg -il brand` по md — релевантного бренд-листа немає.
- Verdict: PARTIAL чесний → **залишити**.

### C09.L4
- Claim: PRODUCT_DNA §Монетизація як evidence; next — дерево метрик з guardrail-метриками.
- Source/locator: DNA `$.categories[8].layers[3]`.
- Independent check: `**/*PRODUCT_DNA*` у репо → 0 файлів (док поза репо, не перевіряється локально); дерева метрик/guardrail-оракула в `plan/`+`bible/` немає.
- Verdict: PARTIAL чесний (evidence частково поза репо) → **залишити**.

### C13.L4
- Claim: kilo_watch.py + session_preflight.py у ~/.claude/tools; FM-011 на 62 surfaces; next — per-tree lock.
- Source/locator: `C:\Users\Andrii\.claude\tools\kilo_watch.py`, `C:\Users\Andrii\.claude\tools\session_preflight.py`.
- Independent check: обидва файли існують; `py -3 kilo_watch.py --help` виконується. Lock-файл на дерево в репо відсутній.
- Verdict: PARTIAL чесний → **залишити**.

Три шари: рекомендація — залишити PARTIAL. Підняття до DONE: (a) C06.L1 — бренд-лист одним файлом; (b) C09.L4 — дерево метрик з guardrail-метриками + локальна інструменталізація гейту; (c) C13.L4 — per-tree lock-файл у репо.