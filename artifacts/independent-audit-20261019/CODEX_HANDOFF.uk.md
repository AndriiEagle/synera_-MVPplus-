# Промпт передачі Synera для Codex

Цей текст призначений для наступного етапу після передачі Андрієм. Поточний аудит публікує результати й відтворення; продукт ним не виправлявся.

---

Ти продовжуєш Synera після незалежного аудиту. Працюй конкретно: відтвори перевірені проблеми, внеси найменші достатні виправлення у чинних owners, виконай змістовні позитивні й негативні перевірки, збережи докази та запуш перевірені результати у `main`. Не закінчуй лише планом. Не називай невиконані gates успішними.

## 1. Джерело й межі

- Єдиний репозиторій: `https://github.com/AndriiEagle/synera_-MVPplus-`.
- Єдина лінія розробки: `main`. Не створюй гілок, PR, issues, comments; не переходь у згадані старими handoff інші refs/репозиторії.
- **Аудитований baseline:** `7eaa952c6e0e498521cc325ab1cf24fec1e0f725`. Це джерело встановлених дефектів, а не наказ стерти новішу роботу.
- Спочатку прочитай `artifacts/independent-audit-20261019/REPORT.uk.md`, `ACCEPTANCE.json`, `REPRO_README.uk.md`, два repro scripts/JSON, `UX_EVIDENCE.uk.md`, `docs/PRODUCT_DNA.uk.md` і релевантні актуальні owners.
- Перевір, що baseline і commit цього аудиту є предками актуального `main`. Запиши фактичні HEAD/BASE_SHA, статус робочого дерева й runtime до тестів. Якщо зміст продукту після baseline змінився, покажи точний diff у релевантних owners; не приписуй baseline-результати новому коду й не відкочуй чужі зміни.
- Використовуй ізольовану тимчасову копію/checkout дозволеного main. Не роби reset/clean/discard у спільному dirty workspace. Аудит був connector snapshot із перевіреними blob hashes, не clone; не видавай його за Git HEAD.
- Production deploy/SQL, вмикання readiness flags, зміни secrets/access, реєстрації, повідомлення людям, payments і додаткові paid model/API calls не входять у цей етап. Для перевірок використовуй synthetic/local/disposable fixtures. Бюджет додаткових платних API — $0.

## 2. Що вже встановлено

Незалежний local run baseline: **692 PASS / 0 unresolved FAIL / 1 Docker SKIP**, 693 унікальних Node tests, 105 files. Node 24.19.0; кожен test file — новий процес. Два початкові loopback-bind failures пройшли після дозволеного sandbox escalation й не зараховані як нові cases. Це не Node 22 CI, live JWT, PostgreSQL чи physical device PASS.

Local Neon build: 105 файлів, 104 hashes/size entries збіглися; build не published. Historical SQL/browser receipts мають свою дату; два HTML hashes — exact LF/CRLF equivalence, не substantive drift. Нового browser/render proof аудит не отримав.

`technical-repros.mjs` і `paid-oneway-card-repro.mjs` до імпортів перевіряють 27 raw source hashes. Вони запускають **original code із synthetic transport**. Exit 0 означає відтворення дефектів baseline. Після fix не змінюй embedded hashes і не вимикай assertions заради PASS. Для виправленої поведінки потрібні окремі regression tests і новий source-bound receipt.

Безпечний replay із окремим exact snapshot:

```bash
SYNERA_AUDIT_SOURCE=/absolute/path/to/pinned-source node artifacts/independent-audit-20261019/technical-repros.mjs
SYNERA_AUDIT_SOURCE=/absolute/path/to/pinned-source node artifacts/independent-audit-20261019/paid-oneway-card-repro.mjs
```

Запускай копії audit scripts у тимчасовій папці, якщо не хочеш переписувати їхні сусідні result JSON у робочому дереві. Relative source override або drift мають відмовити до import. Не називай перезаписаний після fix output оригінальним audit receipt.

## 3. Порядок реалізації

### Крок 1 — TA-01 / P1 для erasure gate: правильний subject confirmation

Owners: `web_launch/app.mjs:606–625`, `web_launch/neon-store.mjs:40–52`, `neon/worker.mjs:167–184` на baseline.

Проблема: вкладка відображає A, інша вкладка входить B і змінює shared cookie, перша надсилає тільки `{confirm:'ERASE_APPLICATION_DATA'}`. Original worker dispatch-ить self-only erasure для verified B, а локальний A store приймає success. Це не SQL authorization bypass і не доведений live-інцидент; source gate default OFF, deployed значення не перевірялося.

Додай expected subject як **умову відповідності**, а не спосіб вибирати target. Worker порівнює його з verified subject цього ж POST перед RPC. Мismatch відхиляється, erasure RPC не викликається. Сам target лишається provider-derived. Fresh GET перед POST самостійно недостатній. Cross-tab invalidation допомагає UI, але не замінює server check. Перевір, чи потрібна opaque session/confirmation generation для нового входу того самого A; не використовуй frontend secret як security boundary.

Позитивні тести: звичайне own erasure, безпечний повтор, actor lock/tombstone/revocation збережені. Негативні: A-display/B-cookie, delayed responses, logout, відкликання, нова сесія того самого A; mismatch = **0 destructive RPC** і ясне повторне підтвердження. Browser proof має використовувати дві справжні вкладки і cookie через HTTP `Set-Cookie`, без production. Якщо він недоступний, прямо NOT RUN.

### Крок 2 — TA-03 / P2: стара помилка не знищує нову cookie

Owners: worker:164–165,263–264; `NeonStore.restore()`.

Проблема: delayed A401 або `/session {user:null}` після входу B повертає `Set-Cookie` із Max-Age=0. JS epoch не може скасувати обробку header браузером.

Узгодь invalidation: не очищуй нову shared cookie через stale read error або прив’яжи скидання до server generation. Збережи explicit logout, справжню відмову простроченому token і приватний UI purge у належному контексті. Перевір обидва порядки A/B responses, same-A re-login, null і 401, explicit logout. Не лікуй проблему прихованим повторним sign-in.

### Крок 3 — TA-04 / P2: meaningful one-way paid workflow

Owners: `profile-brief.mjs`, `matching.mjs:173–184`, `business-case.mjs:232–245`, `real-journey.html:29–30`, `real-journey-client.mjs:545–554,366–370`, `action-scoper.mjs:65–77`, `session-value.mjs`.

Проблема: valid paid buyer без offer tags проходить matching; canonical model допускає один supplier deliverable із явною компенсацією. Editor/scoper завжди вимагають два capability внески. Після canonical one-way paid acceptance через supported store API supplier card додатково падає з «Некоректний час.», бо adapter очікує accept event від кожного participant.

Виправ форму й helper за режимом, використовуючи чинну canonical модель. Buyer не повинен вигадувати навичку заради оплати. Card adapter має спиратися на справжнє receiver acceptance внеску автора, не створювати фіктивний accept від supplier. Не послаблюй exchange/joint_project. Для referral збережи окрему згоду третьої особи; meaningful fixtures не повинні бути однаковим barter shape з різним enum.

Acceptance: buyer без offer → supplier → явні сума/валюта/invoice/умови → дві незалежні approval → один supplier deliverable → buyer check/accept → private supplier card. Негативні: відсутня compensation не стає нулем, немає self-acceptance, нова revision скидає попередні згоди, card не сертифікує identity/правдивість, стороні без дозволу data недоступні.

**Розділяй три факти:** deliverable accepted; усі зобов’язання угоди, включно з компенсацією, виконані; оплата підписки Synera. Не будуй billing у цьому fix і не приписуй коштам між учасниками subscription revenue.

### Крок 4 — TA-02 / P2: єдиний bounded UTF-8 budget

Owners: `real-journey.html`, `business-case.mjs`, `materialFromEditor()/saveTerms()`, worker `readJson()`, `profile-store.mjs` ServiceError, відповідна UK/DE/EN copy.

Проблема: чотири дозволені поля по 500 українських символів дають валідний canonical material, але 7214-byte request отримує 413 через global 4096-byte cap. UI радить «спробуй пізніше». DB окремо обмежує material::text до 16384 bytes.

Узгодь editor/canonical/route-specific API/DB limits з JSON overhead і UTF-8. Не роби необмежений global cap для OTP. Зрозуміла 413 error має зберігати людський текст і пояснювати конкретну дію. Перевір ASCII, український текст, emoji, нижче/на/вище межі та actual PostgreSQL JSONB size. Часовий retry не лікує детермінований oversized request.

### Крок 5 — UX-01 лише після correctness

У чинному real journey зроби видимими прийняття результату й наступну дію з owner. Mode-aware progressive disclosure має зменшити зайву форму до доречного мінімуму; важливі умови лишаються доступними перед згодою. Empty state пропонує тільки реалізоване продовження, без вигаданих кандидатів/обіцянок. Не роби повний redesign.

Перед візуальними висновками відкрий actual Current і Atelier: 320/390/768/1440, UK/DE/EN, 200% text, keyboard, loading/empty/error/success. Збережи screenshots і click evidence. Якщо render blocked — NOT RUN із точним блокером, без score за уявний екран. Physical Android/iPhone лишаються окремим gate.

## 4. Незмінні інваріанти

Current default; Atelier/night opt-in; усі п’ять modes; повний manual шлях; людський оригінал; жодної автоматичної згоди, запрошення, публікації або платежу. CHF12 лишається гіпотезою; нових тарифів немає.

`SYNERA_PROFILE_ERASURE_READY` лишається default OFF і не вмикається цим етапом; provider deletion pending; shared records/tombstone/admission scope чесно описані. Зберегти actor lock ordering, точний SQL generator, version/hash/CAS, receiver-only acceptance, consent/session/text revalidation, result-card escaping/CSP, public cache allowlist, message-intent idempotency й metadata-only retry без hidden outbox. Не перезаписуй історичні migrations/receipts заради зеленого статусу.

## 5. Перевірка й завершення

Виконуй чинні цільові Node/store/worker/erasure/outcome tests і нові змістовні regression scenarios. Далі потрібні exact candidate build/hash closure, Node 22 CI-equivalent, disposable PostgreSQL locks/outcome/RLS-shim та browser cookie/editor/card flow. Позначай synthetic, historical, actual runtime і live окремо; не змішуй кількість test files із cases чи повторними executions. Не змінюй наявний oracle, щоб приховати падіння.

Source bugs можна виправити без production credentials. Якщо зовнішній gate недоступний, заверши всі дозволені fixes, збережи exact NOT RUN/blocked evidence, залиш flags OFF і продовжуй до reviewable deliverable. Не зупиняйся на загальному питанні «можна продовжити?». Незворотні або зовнішні операції цього prompt не розширюй.

Створи окремий `artifacts/audit-followup-<date>/RESULT.uk.md` та acceptance JSON: base/source/head, точні changed files, чому зміна потрібна, очікуване/фактичне по TA-01–04, commands/runtime/results, screenshots, source hashes, skipped/failed/unknown, збережені інваріанти й відкриті G-01/business gates. Людський пілот — план, доки його окремо не проведено за дозволом.

Перед push перечитай diff, перевір, що не потрапили credentials/приватні дані/згенерований шум і що актуальний main не змінився. Створи змістовний commit у дозволеній main-лінії, **без force push**, з expected head/fast-forward перевіркою. Якщо main просунувся, спочатку прочитай новий head і безпечно узгодь тільки свої зміни. Після push перевір remote SHA й перелік файлів. Якщо branch policy відхиляє дію, не обходь її новою гілкою/force: збережи готовий результат і поясни точний blocker.

Поверни Андрію українською: що виправлено, як перевірено, які gates лишилися, commit/посилання, конкретний NEXT. Чесність важливіша за напис «10/10»: нова технічна зелень не доводить попиту, оплати чи production readiness.
