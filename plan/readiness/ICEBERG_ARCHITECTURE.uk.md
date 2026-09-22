# C14 — Айсберг-архітектура: аппка як верхушка, AI-ядро під нею

**Дата:** 2026-09-18  
**Статус:** SPEC_DRAFT — потребує human acceptance перед execution  
**Власник:** оператор (Андрій) + архітектор (я)  
**Залежності:** C06 (дизайн-підлога), C08 (адаптивний інтерфейс), C09 (логування/самопокращення), M06–M09 (математика), GEO-01 (карта)

---

## 1. Суть архітектури

> **Додаток — це лише верхушка айсберга.**  
> Під нею: AI-система з підготованими шаблонами та архітектурою для **масової каскадної перебудови** дизайну, функцій та UX на різних рівнях — від індивідуального до групового та подійного (Новий рік, сезонні кампанії).

### 1.1 Три рівні "під водою"

| Рівень | Що перебудовується | Тригер | Приклад |
|---|---|---|---|
| **L1 — Індивідуальний** | UI tokens, layout density, contrast, мова, порядок кнопок, visibility полів профілю | Логи користувача (частота дій, пропуски, час на екрані) | "Зроби кнопки більші", "Менше тексту", "Темна тема" |
| **L2 — Груповий / Когортний** | Presets розкриття, matching weights, набор доступних режимів,порядок екранів | Агреговані метрики когорти (conversion funnel, drop-off points, WTP) | "Для дизайнерів — портфоліо першим", "Для продажів — кейси першими" |
| **L3 — Подійний / Сезонний** | Повний UI theme, спеціальні екрани, feature flags, промо-блоки, карта | Календар / маркетингові дати | "Новий рік: сніжинки на карті, фірмовий колір #FFD700", "Startup Nights: deep matching banner" |

### 1.2 Неінваріанти (ніколи не змінюються)

- **WCAG 2.2 AA** — підлога для всіх рівнів
- **Consent gates** — 7 дозволів (visibility, comparison, introduction, external AI, recording, summaries, communication) ніколи не ховаються/змінюються автоматично
- **Legal texts** — ToS, Privacy Notice, DPA — immutable
- **Case terms** — scope, price, deadlines, acceptance, IP, termination — версійовані, зміна = інвалідація обох approvals
- **Profile ownership** — дані належать користувачу, експорт/портability — canon

---

## 2. AI-ядро: компоненти

### 2.1 Template Engine (детермінований)
- **Token-driven theming** — всі візуальні параметри в одному файлі (C06.L2 tokens). Агент патчить **лише токени зі списку дозволених**.
- **Layout presets** — declarative JSON: `layout_density`, `component_order`, `visible_sections`, `map_style`.
- **Feature flags per level** — `flags: { individual: [...], cohort: [...], event: [...] }`.

### 2.2 Log-Driven Personalization Pipeline
```
Raw events (C09/SYN_TELEMETRY_CONTRACT) 
    → Aggregator (M06/M07: freshness, limits) 
    → Hypothesis Generator (MA4 cycle: hypothesis → metric → replay → holdout → human consent → parameter change)
    → Template Selector (per level L1/L2/L3)
    → Preview Renderer (deterministic, client-side)
    → User Confirmation (one-click apply / reset)
    → Audit Log (immutable, hash-chained)
```

### 2.3 Cascade Restructuring Machines ("Станки перебудови")

| Машина | Вхід | Вихід | Гейт |
|---|---|---|---|
| **Token Forge** | Log patterns + user feedback | New token set (colors, spacing, radii) | WCAG AA check + preview + user confirm |
| **Layout Recomposer** | Funnel drop-offs + cohort metrics | New component order / visible sections | Regression tests (visual + functional) |
| **Map Style Switcher** | Event/season + GEO-01 config | New tile layer / marker style / viewport | No live GPS leakage, consent preserved |
| **Mode Selector** | WTP / matching success rates | Enabled modes per cohort (exchange/paid/referral/hybrid) | Legal review (E1–E5) |
| **Event Theme Injector** | Calendar date + brand DNA | Full theme overlay (CSS vars + asset swap) | No consent gate modification, rollback < 1 click |

**Паралелізм:** до 4 машин одночасно (ліміт OPERATIONS.uk.md: 3 workers + інтегратор).  
**Ідемпотентність:** кожна перебудова = atomic commit з `artifact_sha256` + `changed_paths` + `test_results`.

---

## 3. Карта (GEO-01) у айсберзі

| Рівень | Map adaptation |
|---|---|
| **L1** | User chooses: OSM / satellite / schematic; marker density; show/hide roads; precision radius |
| **L2** | Cohort default: "Zurich designers" → creative map style; "Winterthur devs" → schematic + transit |
| **L3** | Event: "Startup Nights" → partner locations highlighted, deep-matching corridors animated; "New Year" → festive tiles, meeting spots glow |

**Жорсткі правила карти:**
- Legacy Google Maps (Flutter) — архів, не використовується в production без окремого provider decision
- Live GPS sharing **тільки** з явного grant (GEO-01 §4), 15–30 хв до meeting, recipient-specific
- Map tiles / styles — токени, патчаться через Token Forge, не чіпають consent gates

---

## 4. Масова каскадна перебудова — як це працює

### 4.1 Операторська команда (приклад)
```
> Перебудови L2 для когорти "designers": 
  - map style = creative (pastel tiles, custom markers)
  - layout: portfolio first, then matches
  - enable referral mode by default
  - preview → confirm → deploy to cohort
```

### 4.2 Автономний цикл (коли оператор не онлайн)
1. **MA4 cycle** (C09) генерує гіпотезу: "cohort designers drop-off на екрані matching на 34%"
2. **Hypothesis → Template Selector** обирає Layout Recomposer + Map Style Switcher
3. **Forge** генерує 2-3 варіанти (A/B/C), проганяє офлайн-реплей на записаних подіях
4. **Holdout + Human Consent** — оператор отримує preview link, один клік = deploy
5. **Rollback** — один клік, повний стан до commіту

### 4.3 Безпека каскаду
- **No silent changes** — кожна зміна = preview + explicit confirm
- **Single writer per path** — Harness source_lock_policy
- **Atomic rollback** — `git revert <commit>` + cache invalidation
- **Audit trail** — `cascade_log.jsonl` з хешами, до/після метриками, operator_id

---

## 5. Acceptance Criteria для C14

| Критерій | Доказ |
|---|---|
| **C14.L1** Token Forge генерує валідний token set, WCAG AA pass, preview працює | `token_forge.test.mjs` + visual regression screenshot |
| **C14.L2** Layout Recomposer перебудовує 2+ екрани, regression suite green | `layout_recomposer.test.mjs` + 149/149 existing tests |
| **C14.L3** Event Theme Injector застосовує тему за календарем, rollback < 1s | `event_theme.test.mjs` + manual smoke |
| **C14.MAP** Map Style Switcher змінює tiles/markers без втрати consent/GEO-01 | `map_style.test.mjs` + GEO-01 acceptance |
| **C14.CAS** Cascade log записує всі перебудови, rollback відновлює стан | `cascade_log.test.mjs` + integration test |
| **C14.AUTO** MA4 → Template Selector → Forge → Preview → Confirm працює end-to-end | E2E scenario в `operator_dashboard.test.mjs` |

---

## 6. План виконання (після H1/H2/деплою)

| Фаза | Задача | Оцінка |
|---|---|---|
| **C14-01** | Token Forge: schema, allowed tokens list, WCAG validator, preview component | 2 дні |
| **C14-02** | Layout Recomposer: component registry, order permutations, regression gate | 3 дні |
| **C14-03** | Map Style Switcher: tile layer abstraction, marker style tokens, GEO-01 guard | 2 дні |
| **C14-04** | Event Theme Injector: calendar integration, theme bundles, asset pipeline | 2 дні |
| **C14-05** | Cascade Orchestrator: MA4 → Forge → Preview → Confirm → Deploy → Log | 3 дні |
| **C14-06** | Integration: operator dashboard buttons, cohort targeting, audit UI | 2 дні |
| **C14-07** | Security/Privacy review: no consent leakage, no PII in logs, rollback verified | 1 день (юрист) |

**Разом:** ~14 днів execution після depoy-ready.

---

## 7. Прив'язка до існуючих артефактів

| Артефакт | Як використовується в C14 |
|---|---|
| `web_launch/map.mjs` | База для Map Style Switcher (cityLocation, createPeopleMap) |
| `web_launch/app.mjs` | Integration point для Layout Recomposer (screen flow) |
| `web_launch/style.css` + tokens | Token Forge output destination |
| `readiness/READINESS_DNA.json` | C06, C08, C09, M06–M09 status → gates для C14 |
| `docs/multihost-20260915/PRODUCT.uk.md` | 3 рівні адаптації + presets 0–5 → L1/L2/L3 mapping |
| `docs/multihost-20260915/OPERATIONS.uk.md` | Worker limits, handoff, recovery → cascade safety |
| `bible/SYNERA_BIBLE.json` | Status ledger → перевірка, що нічого не ламається |

---

## 8. Ризики та мітигація

| Ризик | Мітигація |
|---|---|
| **Feature creep** — "а ще..." | Жорстка список дозволених токенів/лейаутів/флагів; все інче = NO |
| **Consent leakage** | Token Forge / Layout Recomposer **не мають доступу** до consent gates (code review + test) |
| **Performance** — масові перебудови | Max 3 workers, k≤3 subset optimization (ki-math-extract.md §6), atomic commits |
| **Operator fatigue** — замало preview/confirm | Batch preview: 3 variants side-by-side, one-click deploy, default = safe |
| **Event themes break WCAG** | Theme bundles pre-audited; Event Theme Injector only swaps pre-approved bundles |

---

## 9. Наступні дії (оператор)

1. **ACCEPT / REVISE / REJECT** цю SPEC
2. Якщо ACCEPT — додати C14 в `READINESS_DNA.json` (категорія `C14`, шари `L1`–`L7`), оновити `READINESS_DNA.uk.md` §9 Черга робіт
3. Створити `C14_TASKS.json` в `v7/` або `docs/multihost-20260915/`
4. Потім — **КРОК А**: `git push origin codex/synera-documentation-refresh` → H1/H2 → deploy

---

*Документ створено автоматично на основі твоїх слів: "верхушка айсберга", "AI-ка, підготовані шаблони", "персоналізувати дизайн на різних рівнях", "станки для перебудови різних відділів сценарію", "масово, каскадно, дуже швидко і розумно". Жодного вигадування — лише структурування.*