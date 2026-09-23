# Swiss legal layer — Synera private B2B pilot

Статус: `LEGAL_PREPARATION_DRAFT — EXPERT_REQUIRED before live registration`
Перевірено: 2026-09-23. Це робочий комплаєнс-артефакт, не legal opinion, не сертифікація і не підпис Гілберта чи іншого юриста.

## Межа рішення

**Підготовлено:** коротка чернетка notice/terms, вихідні джерела, локальний acceptance-check і перелік розривів.
**Не доведено:** фактичний Neon/Cloudflare account, країни субпроцесорів і backup, DPA/SCC, підстава для кожної обробки, статус сторін, роль посередника, GDPR/AI Act scope для майбутніх EU-сценаріїв.
**Висновок:** `HOLD` для реальних реєстрацій, зовнішнього AI, запису, авто-публікації та QR-bill activation. Поточний default `registrationEnabled: false` зберігається.

## Виправлені правові межі

| Claim | Офіційне джерело і locator | Зіставлення з кодом | Verdict |
|---|---|---|---|
| Notice має бути доступним до/коли збираються дані, стислим і прозорим; має пояснювати одержувачів та країни передачі. | [FDPIC, Duty to provide information](https://www.edoeb.admin.ch/en/duty-to-provide-information): “in advance”, “concise, transparent, clear and readily accessible”; [FDPIC, Privacy statements](https://www.edoeb.admin.ch/en/privacy-statements-on-the-internet): Art. 19 FADP. | `web_launch/legal.html` §§1,3,4,6; login opens notice before `consentRecord`. | `PRESENT_IN_DRAFT`; юрист має звірити фінальний операторський notice з фактичною обробкою. |
| FADP не дозволяє розкривати дані за кордон, якщо приватність серйозно ризикує; за відсутності adequate protection потрібні застосовні safeguards. | [FDPIC, Cross-border transfer](https://www.edoeb.admin.ch/en/cross-border-transfer-of-personal-data): Art. 16 FADP, SCC/BCR guidance; [FDPIC, Outsourcing](https://www.edoeb.admin.ch/en/outsourcing-of-data-processing). | `legal.html` §3 прямо маркує Neon/Cloudflare account, DPA, маршрути, retention як непідтверджені; зовнішній AI заборонений до цих gates. | `HOLD — provider/account evidence and contract review required`. |
| GDPR scope не можна звести до “ми в CH”. Він охоплює, зокрема, пропозицію товарів/послуг людям у Union або моніторинг їхньої поведінки; Art. 13 визначає відомості при зборі; Art. 44 — transfers. | [GDPR consolidated text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679), Arts. 3, 13, 44. | `legal.html` не заявляє, що GDPR “не тригерований”; вимагає expert scope-check перед EU expansion. | `NEEDS_REVIEW per actual targeting, people and processing`. |
| EU AI Act має територіальний scope: Union market/use, Union deployer, або output, що використовується в Union; він не скасовує GDPR. | [AI Act](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689), Art. 2(1), 2(7), 2(8). | `legal.html` §2 зберігає AI вимкненим; UI consent сам по собі не дозволяє provider transfer. | `NEEDS_REVIEW before any embedded external AI or EU-facing use`. |
| Neon пропонує DPA, але це не підтверджує, що конкретний оператор підписав/активував відповідний документ або регіон. | [Neon DPA](https://neon.com/pdf/DPA.pdf), opening + definition of Customer Data; [Neon Security](https://neon.com/security), DPA/cross-border support. | Source currently names US East 2; немає live account inspection у цій задачі. | `UNVERIFIED — do not call the pilot contract-ready`. |
| Cloudflare data-localization controls є окремими конфігураціями; без account evidence не можна обіцяти Swiss/EU-only processing. | [Cloudflare DLS](https://developers.cloudflare.com/data-localization/), Features; [Region support](https://developers.cloudflare.com/data-localization/region-support/), default CMB boundary absent. | `legal.html` §3 замінює бездоказову гарантію на disclosure + hold. | `UNVERIFIED — account and product entitlement review required`. |
| Existing Swiss QR-bill generator begins `SPD`, while the current SIX QR-bill specification requires the `SPC` header and other structured fields. The feature is flag-off. | [SIX QR-bill](https://www.six-group.com/en/products-services/banking-services/payment-standardization/standards/qr-bill.html), current implementation guidelines; source audit supplied for this task. | `web_launch/economics/qr_bill.mjs` is not modified by this legal scope; `legal.html` calls activation not-ready. | `HOLD — no activation claim; use a manually issued invoice only after real terms/payee review`. |

## Згода, а не blanket permission

Базове прийняття Terms + Privacy Notice потрібне для admission і вже передається як `policy_version`, `terms_accepted`, `privacy_acknowledged` у `web_launch/pilot-policy.mjs` та `web_launch/neon-store.mjs`.

| Операція | Статус у цій версії | Мінімальна умова до реального використання |
|---|---|---|
| Видимість профілю | private-by-default; окремий UI toggle | окремий відкличний вибір і перевірка фактичного persistence. |
| Матчинг / введення | окремі UI toggles; двостороннє введення має власний flow | не називати UI-toggle повним журналом згод, поки збереження/revocation не перевірено. |
| Зовнішній AI | `OFF/HOLD` | provider identity, data map, DPA/transfer mechanism, redaction, окремий informed opt-in, local acceptance. |
| Запис зустрічей | вимкнений у UI й коді | окремий правовий review та усвідомлена згода всіх учасників; поза поточним пілотом. |
| Авто-публікація | відсутня/`OFF` | окремий продуктовый flow, recipient/scope, consent, terms і contracts; поза поточним пілотом. |
| QR-bill | `OFF/HOLD` | незалежна перевірка актуальної SIX-специфікації, payee, сум, currency та умов; поза поточним пілотом. |

## Версія та реальний login flow

`POLICY_VERSION` дорівнює `2026-09-05-pilot-3`; `consentRecord()` включає її у login/signup payload, а Neon schema має `pilot_consents`. Це **підтверджує лише базовий version field**, не прийняття нової чернетки. Новий текст має ідентифікатор `2026-09-23-legal-draft`; реєстрація не може бути увімкнена, поки оператор не:

1. затвердить остаточний текст з кваліфікованим CH/EU юристом;
2. прив'яже незмінний текст/хеш до нової `POLICY_VERSION` і запише час прийняття;
3. вимагатиме повторного прийняття при матеріальній зміні;
4. локально перевірить відмову без обох базових acknowledgment і збереже доказ у дозволеному середовищі.

Ці кроки не виконувались у цій задачі, бо власність обмежена `plan/legal/*` і `web_launch/legal.html`; `pilot-policy.mjs`, server, DB, QR-bill і deployment не змінювалися.

## Питання для кваліфікованого юриста

1. Controller/processor roles, applicable lawful basis per purpose, retention and handling of rights requests.
2. FADP transfer assessment for the actual Neon/Cloudflare account, subprocessor chain, US route/backups and AI provider; DPA/SCC/other safeguard where applicable.
3. GDPR territorial scope for the concrete pilot audience and any EU-targeting or monitoring.
4. EU AI Act applicability, operator role and any required controls if output is used in Union.
5. Swiss contractual, referral, labour-intermediation, consumer/price, payment and recording implications of the selected business model.

## Two independent passes

- **Pass A — public-law/regulator, 2026-09-23:** FADP transparency/transfers via FDPIC; GDPR and AI Act consolidated texts via EUR-Lex. Result: earlier categorical “not triggered” language is unsafe; exact scope is fact-dependent.
- **Pass B — service/configuration, 2026-09-23:** current official Neon DPA/security and Cloudflare DLS docs, then source inspection of `legal.html`, `app.mjs`, `pilot-policy.mjs`, `neon-store.mjs`; current SIX QR-bill condition was added as bounded audit evidence. Result: current code carries basic policy version at admission, separate in-memory UI controls exist, recording is locked off; live provider contracts/configuration, durable records for each granular consent, and QR-bill conformance remain unproven.
