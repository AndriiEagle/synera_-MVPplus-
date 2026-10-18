# Детерміновані пропозиції: контракт інтеграції

Власність цього worker: лише `web_launch/action-scoper.mjs`, його тест і цей документ. UI, allowlist та service worker інтегрує координатор.

## API (узгоджений для інтеграції)

```js
import { draftActionScope, draftIntroOffer, EVIDENCE_TYPES } from './action-scoper.mjs';
draftActionScope({ language: 'uk', mode: 'exchange', subject: 'Тема користувача',
  dueOn: '2026-10-25', evidenceType: 'document', capabilityTag: 'design',
  declaredTags: ['design'], target: '', acceptanceCriteria: '' });
// { status: 'proposed'|'needs_input', proposal: {target, acceptance_criteria}|null,
//   missing: [...], boundary, binding:false, requiresReview:true, ... }
draftIntroOffer({ language: 'uk', mode: 'exchange', subject: 'Тема користувача',
  dueOn: '2026-10-25', giveTag: 'design', takeTag: 'automation',
  ownOfferTags: ['design'], peerOfferTags: ['automation'], currentFields: {} });
// { status, fields: {give_target,give_criteria,take_target,take_criteria}|null, ... }
```

Підтримані мови `uk/de/en`, fallback — `uk`. Типи доказу: `document`, `link`, `demo`, `checklist`, `conversation_note`. Дата лише явно введена, ISO day; жодної вигаданої дати/кількості/ціни/особи. Невідомий mode/tag/proof, незаявлена навичка, порожня тема або некоректна дата повертають `needs_input`, без часткової пропозиції.

Усі повернені значення — звичайний текст: відображати через `textContent`/textarea `.value`, ніколи `innerHTML`. Генерований текст залишається окремим preview до явної дії користувача. Непорожні людські target/criteria повертаються без зміни; UI має повторно звірити актуальні поля перед застосуванням. Модуль нічого не записує, не підтверджує, не надсилає, не створює material payload і не обходить актуальні bilateral/version/hash gates. `draftIntroOffer` повертає обидві ноги чинного редактора, але не обирає компенсацію, права, редакції або згоду.

Джерела: `docs/PRODUCT_DNA.uk.md`, `business-case.mjs`, `materialFromEditor` у `real-journey-client.mjs`, форма/saveTerms у `real-journey.mjs` та `real-journey.html`. Нормалізований `artifacts/gemini-review-20261017/REPORT.uk.md` відсутній під час першого читання, згодом з'явився та прочитаний повністю. Релевантний уривок початкового звіту прочитаний лише як дані. Жодного його скрипта/SQL не виконано.

## Реалізація та перевірки

Додано один модуль замість окремого intro-модуля: `action-scoper.mjs` і `action-scoper.test.mjs`. Існуючу поведінку не змінено: тільки нові чисті helpers. Успадковані файли не редагувалися. Інспектовані останні релевантні коміти: `557a09f` (збереження чернетки), `b46b9b6` (мови), `079c4e0` (наступний крок).

```powershell
node --test web_launch/action-scoper.test.mjs web_launch/business-case.test.mjs web_launch/real-journey-mode-editor.test.mjs
```

Результат: **36 pass, 0 fail, 0 skipped**; 21 тест нового helper. Перевірено UK/DE/EN × п'ять типів proof, усі п'ять mode через справжній `materialFromEditor` із явними людськими terms, незаявлені/невідомі tags, порожні/некоректні/Unicode/markup/control/instruction-shaped inputs, calendar rollover, обидві ноги, незмінність frozen input і людського багаторядкового тексту, відсутність автоматичних фінансових terms, блокування invitation після лише однієї згоди через `reviewCaseAction`. Початковий тест помилково імпортував неіснуючий `checkNextAction`; імпорт виправлено на реальний async `reviewCaseAction`, перевірка виконується й проходить.

Два in-memory mutation checks (жодної зміни робочого source): імпорт data-URL із тимчасовою підміною `tags.includes(tag)` → `true` дає очікуваний `ERR_ASSERTION` на незаявленій capability; видалення пріоритету людського `target` дає очікуваний `ERR_ASSERTION` на точному custom target. Обидва oracle виявили дефект; після них чинна suite повторно зелена. Звичайні позитивні приклади не підміняють ці negative checks.

SHA-256:

- `action-scoper.mjs`: `0e6f2453628d331972c07354c2e2cfd02096902b2d0d3f1366f08e907b62ed07`
- `action-scoper.test.mjs`: `40780cdc46207b4fa7d443c01aa02c89b0ed41b13c8d7b65a883c747f4e1eb9b`

Підготовка operator `prepare` повернула `NEEDS_REVIEW / RETRIEVAL_NOT_PASS / NEEDS_SCOPE` через snapshot `MANIFEST_SHA256_MISMATCH`. Це обмеження retrieved context, не provider outage. Верифікація виконана на цільових файлах checkout. A RECOMMENDED — локальний deterministic helper/tests; B FALLBACK provider lane у цьому worker не використовувалася.

Межа: шаблон не доводить компетентність, істинність доказу, юридичний ефект чи точність довільного людського критерію. Вказана тема і дата конкретизують proposal, але користувач має переглянути/дописати межі фактичної роботи. Жодного виміру конверсії або твердження «3×». Жодного hard cutoff чи автоматичної дати/кількості. Модуль використовує існуючі `matching.mjs` enums; залежності цього файла (`need-decay.mjs`, `b-matching.mjs`) уже належать public source closure, нових packages/API/config/secrets не потрібно.

Статус: **component-code complete / local tests pass**. Browser/PG/allowlist/SW та незалежне приймання координатором залишаються окремими gates. Provider calls цього worker: 0; Chinese requirement залишається на root. Commit/push/deploy не виконувалися.

NEXT для координатора (5–20 хв): додати preview і явне застосування proposals до terms UI; при застосуванні повторно звірити current peer/epoch та актуальні людські поля, зберегти review/save/approve/invite як окремі явні дії й виконати browser oracle на custom draft + logout/stale response.

## Окремий completion review 1/2

Результат: **NO_CHANGE source**. Повторно прочитані точний helper, чинний `materialFromEditor`/форма та GLM advisory `intro-scoper-contract.md`. Попередні тести й mutation-evidence збережені. Повторний запуск тієї самої трьохфайлової suite: **36 pass / 0 fail / 0 skipped**.

Додатковий виконаний stdin oracle через `node --input-type=module`: locale `__proto__/constructor/toString/object/null/number` безпечним чином обирає задокументований `uk`; невідомі mode/evidenceType/capabilityTag, включно з prototype-sensitive значеннями, повертають `needs_input`, null proposal та масив лише рядкових missing codes. Невалідні Gregorian rollover/non-leap dates відхилені; 2000-02-29 прийнято. HTML subject не проходить у proposal. Unicode та багаторядковий/табульований людський target/criteria зберігаються byte-for-byte. JSON із власними `__proto__`/`constructor` у currentFields не змінює prototype виходу/Object.prototype; повернуті лише чотири дозволені поля двох ніг. Paid-mode proposal лишається `financialAgreement:false` та не постачає компенсацію.

GLM triage: прийнята і перевірена по source вимога «helper тільки draft, unresolved terms не стають згодою, усі п'ять modes і roles/approval gates зберігаються». Запропонований GLM state/action permission-scoper — інша задача, не доданий поверх наявних guards. Його `disclosureAllowed:false` і metadata не копіювалися до material schema. Провайдерні receipts/actual identity/cost цього advisory тут незалежно не перевірені, тому цей review не закриває mandatory Chinese gate; він залишається в координатора. Актуальні API і два source/test SHA-256 вище **не змінилися**. Жодних commit/push/provider calls.

## Окремий completion review 2/2

**PASS scoped integration / NO_CHANGE helper і tests.** Редагований лише цей звіт. Прочитаний фактичний `draftTerms(kind)` у `real-journey.mjs:424` та форма `real-journey.html:27–31`; назви `give_target/give_criteria/take_target/take_criteria`, `mode`, `due_on`, `give_tag/take_tag` збігаються з API. Controls теми/доказу читаються за ID, їм не потрібні вигадані FormData names. Чистий helper не перетворюється на store/action permission-scoper.

Виконана команда `node --input-type=module` зі stdin oracle: Playwright імпортований з уже наявного `C:/Users/Andrii/Desktop/synera-premium-pwa-variant/node_modules/playwright/index.mjs`. Перший імпорт звичайного `playwright` у цьому checkout дав `ERR_MODULE_NOT_FOUND`; жодного install, зміни dependencies або твердження про глобальну відсутність runtime. Oracle завантажив реальний HTML (без bootstrap scripts/styles), створив native Chromium DOM/FormData, виконав точний source `draftTerms` і helper (тільки imports/exports адаптовані для function context) з реальними enums. `updateApprovalControls`, bootstrap та transport були заглушені; будь-який store method відхилявся Proxy-пасткою.

Результат: **10/10 mode × intro/scope scenarios pass**, реальні declared tags `automation/design`, збережені Unicode/багаторядковий custom target і custom criterion, заповнені тільки порожні поля, точні `amount=125.50/currency=CHF/invoice=yes/compensation_status=agreed_money` незмінні. Повторне використання зберігає FormData й початкову CAS-базу `termsBase`. Невалідна Gregorian date, незаявлений tag, HTML subject, busy та logout не змінюють форму. Store calls=0; save/approve/invite не викликалися. In-memory mutation, яка видалила UI guard порожнього поля, дозволила stale proposal перезаписати custom target: oracle виявив очікуваний дефект. Це не зміна робочого source.

Після цього повторно виконано `node --test web_launch/action-scoper.test.mjs web_launch/business-case.test.mjs web_launch/real-journey-mode-editor.test.mjs`: **36/36 pass**, `git diff --check` exit 0 (були лише сторонні CRLF→LF попередження для coordinator-owned файлів).

Readback SHA-256 UI: `real-journey.mjs` — `1e89b5adbd039fd2111755d8fa1e4dac86a58b6ae9b993298501f40c43057559`; HTML — `fb6c6dcdc444ea6e79c1dac1ccea8267ed6d904f56fa2a09cd9ca19550ed609a`. Helper/test hashes залишилися наведеними вище. Компонентний browser oracle не доводить повний app bootstrap, serviced public assets/cache, реальний backend/PG/JWT, загальну UI approval-state поведінку або physical device acceptance; ці gates в root. Помилок інтеграції для повернення за межами власності не відтворено. Mandatory Chinese receipts/acceptance, commit/push/deploy — не виконувалися цим worker.
