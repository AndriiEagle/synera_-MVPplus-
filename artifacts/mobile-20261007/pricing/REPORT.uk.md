# Доступ і ціновий сценарій Synera — 07.10.2026

**LOCAL_UI_ACCEPTED_WITH_RUNNER_LIMITS.** Одна основна кнопка відкриває чинний пілот; локальні демо відокремлені. Зараз — CHF 0 без картки. CHF 12/місяць і 10 AI-запитів показані тільки як майбутній сценарій, який не продається. EN/DE/UK; без checkout, донатів, форми відгуку чи прихованого надсилання.

## Результат для Гілберта

1. Біля основного входу видно нинішню безкоштовність. Studio більше не перехоплює головний вхід; обидва демопосилання збережені.
2. Окрема картка пояснює сценарій CHF 12/місяць: до 10 AI-запитів для уточнення потреб/чернетки співпраці, явний вибір після повних умов, без автоматичного переходу/продовження/списання. Запропонована межа витрат — CHF 12; після ліміту пауза без доплат, новий бюджет потребує нового вибору. Це текст майбутніх умов, **не працюючий billing/AI guard**.
3. Ціна походить із `artifacts/zurich-pilot-model-20261005/inputs.json`: `basic_price_month=12`; 10 = `free_user_ai_requests_month=2` + `basic_extra_ai_requests_month=8`. Попередні `pilot-wave-20261005/REPORT.uk.md` і `COHORT_DECISION.uk.md` прочитані. Немає підтвердженого попиту, доведених витрат чи гарантії клієнтів/зустрічей/доходу.
4. Відгук добровільний і обговорюється особисто. На сторінці немає форми, збору або надсилання відповіді. Android-only Studio wording прибрано; телефон/комп’ютер, Android/iPhone та demo/live розділені.

## Докази

- [GREEN_C_DRIVE.txt](GREEN_C_DRIVE.txt): **12/12 PASS**, 57.3 s, один worker. Дев’ять комбінацій EN/DE/UK × 320/390/1440; новий no-JS test; дві раніше наявні access regressions.
- Перевірено один primary entry, порядок основного входу перед demo, точний pilot origin і перехід кліком у перехоплений fixture, обидва install-details, відсутність horizontal overflow, порожніх перекладів, form/checkout/iframe, local/session storage writes та неочікуваних API/зовнішніх запитів. Axe WCAG2/2.1 AA violations = 0 на дев’яти станах.
- [RED.txt](RED.txt): до правки той самий семантичний інваріант відхилив три primary links замість одного.
- [MUTATION.json](MUTATION.json): навмисне повернення primary-class для Studio через HTML interception відхилено: **Expected 1 / Received 2**. Product source не мутувався.
- [FINAL_RECEIPT.json](FINAL_RECEIPT.json): поточні source/орacle/screenshot SHA256, branch/head, незмінний hash чужого journey-ui, git diff --check PASS. Git попереджає лише про LF/CRLF.
- Знімки у [regression](regression/): 9 мовно-розмірних станів. Візуально переглянуті DE320, UK390 та EN1440: читабельні картки й перенос рядків, без обрізання/горизонтального виходу. Перші `screens/` залишені як попередній runtime proof; остаточні screenshots — `regression/` (перед axe, з фокусом і scroll у звичайному стані читання).

## Runtime recovery і скінченні review

Перший review перевірив фактичний diff, origin/links, demo/live boundary й відсутність auth/consent/Current/Atelier changes. Другий review перевірив screenshots, semantic mutation та зв’язок ціни/ліміту з моделлю; вузька поправка торкнулася лише screenshot capture (фокус/scroll до axe). Окремо виправлено case-sensitive regex самого тесту; початковий failure збережений у `FAILURE.json`.

Перші прогони зависали: parent встановив, що типовий Playwright cache є посиланням на недоступний D:. Локально перевірено lstat C: Chrome та C: temp, застосовано `cmd.exe`, `login:false`, explicit executablePath і TMP/TEMP тільки в test runner. Канонічний `web_launch/server.mjs --demo` збережено. Тести не використовують профіль користувача чи default browser cache. Початковий недовершений звіт збережено як [HOLD_REPORT.uk.md](HOLD_REPORT.uk.md); він історичний і не є поточним статусом.

`runtime-recovery.py` читає command line через Windows API та допускає завершення тільки node з exact owned runner або Chrome з dedicated test profile. Початковий аудит із limited query rights не давав достатнього доказу відсутності процесів; виправлений аудит отримав status=0 для 128/144 command lines, не виводячи чужих команд. Повторний `--stop-owned` не знайшов своїх runner/browser processes для завершення; прямий GREEN runner згодом повернув exit 0, початковий regex failure — exit 1. Жодного широкого kill, installs або зміни D: не виконано.

## Ownership і повтор

Checkout: `C:/Users/Andrii/Desktop/synera-premium-pwa-variant`; початковий HEAD `a284a1eda34a85b658cf03ec2dd3a1fbfcb2cad8`; branch `codex/synera-product-20261002`.

Owned files: `web_launch/get.html`, `web_launch/product-access.mjs`, **лише доданий `.access-page` CSS block** у `web_launch/summit.css`, `tests/product-access.spec.mjs`, `tests/product-access-checks.mjs`, ця `artifacts/mobile-20261007/pricing/` директорія. Інші dirty/untracked не змінювала. Root task_log лишено parent для одного спільного outcome record.

Із цього checkout через cmd.exe / login:false, послідовно:

```text
py -3 artifacts/mobile-20261007/pricing/runtime-recovery.py
node artifacts/mobile-20261007/pricing/run-c-drive.mjs
node artifacts/mobile-20261007/pricing/run-c-drive.mjs --mutation
py -3 artifacts/mobile-20261007/pricing/finalize.py
```

GREEN очікує exit 0; mutant — exit 1 і конкретну відмову primary-count. Живий pilot destination перехоплюється локальним fixture: це не перевірка live login, API або двох людей. Responsive Chrome — не фізичний Android/iPhone install. Ціна/ліміти — сценарій, не платіжний продукт чи acceptance попиту. Commit/push/deploy не виконувалися.

**NEXT (5–10 хв):** parent переглядає DE320/UK390/EN1440 і `FINAL_RECEIPT.json`, приймає owned diff до свого спільного commit. Додаткове косметичне редагування після acceptance припинено.

Models used: none (provider calls=0, USD=$0.00). Економія підписки Codex не вимірювалася.


## Фінальна перевірка зауваження parent про CTA

Parent помітив «Skip to app access» на попередньому `screens/access-uk-390.png`. Початкові screenshots виконувалися після axe й зберігали змінений focus/scroll. Product HTML/CSS через це зауваження **не змінювалися**. Перед фінальними знімками oracle повертає звичайний стан читання кліком по заголовку та scrollTo(0,0), перевіряє точний локалізований CTA і `document.elementFromPoint` у його центрі: очікується саме `open-live-app`. Після screenshot axe і фактичний клік основного посилання все ще перевіряються.

Фінальний український знімок: [visual-proof/access-uk-390](visual-proof/product-access-Access-journey-uk-at-390/access-uk-390.png). На ньому видно «Відкрити Synera ↗», без skip-link поверх кнопки. Додатково зняті DE320, EN390, DE390, EN1440. [VISUAL_PROOF.txt](VISUAL_PROOF.txt) містить **5 passed**, але команда повернула **exit 1** через дві помилки поза тестами: timeout suite/teardown. Це не повністю зелений повтор; п’ять tests перекривають попередні 12 й не додаються до них як незалежне покриття.

[MUTATION.txt](MUTATION.txt): semantic rejection Expected 1 / Received 2 підтверджена у MUTATION.json, але wrapper згодом повернув **exit 2 / ETIMEDOUT**, а не очікуваний чистий exit 1. Причину cleanup timeout остаточно не доведено. Попередній повний `GREEN_C_DRIVE.txt` лишається штатним **12 passed / exit 0**. Браузерні дії доведені в цьому обмеженому контракті; надійність завершення всіх runner-процесів ще має runtime limitation.

Команда вузького повтору: `node artifacts/mobile-20261007/pricing/run-c-drive.mjs --visual-proof`. Sessions `77486` (mutation) і `66162` (visual proof) повернули terminal results; нових прогонів після цього не запускали. Parent змінює інші Summit scopes паралельно: FINAL_RECEIPT.json фіксує прочитані байти всього summit.css, а не право ownership на чужі правила. Перед commit parent звіряє останній спільний CSS diff.
