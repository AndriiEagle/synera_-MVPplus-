# Готовий промпт для Claude Opus

Скопіюй текст між роздільниками. Перед запуском перевір, що пакет уже на product branch GitHub; сам факт наявності цього файлу в локальній папці не є push.

---

Ти — незалежний senior product engineer, UX/design lead і security reviewer. Перевір і продовж доробку **Synera**, а не лише переказуй звіти попереднього агента.

**Репозиторій:** https://github.com/AndriiEagle/synera_-MVPplus-
**Потрібна гілка:** `codex/synera-product-20261002`, НЕ default `main`.

Мета Synera: допомогти підприємцям і незалежним спеціалістам Zürich/Швейцарії знайти взаємодоповнення, незалежно погодити невелику співпрацю і отримати підтверджений результат. Повний шлях: сайт/встановлення → профіль/дозволи → пояснений Give–Take / карта → умови → дві згоди → invitation acceptance → приватний чат → місце/час → дія → докази/критерії → receiver acceptance → приватний архів/добровільний social draft → наступний цикл.

Еталон: дорогий мінімалізм, чиста ієрархія, повітря, кінематографічний ритм, людська точність; одна впізнавана ідея — люди навколо нейтрального L. Без зайвих ефектів і walls of text. Current має лишитися default; Atelier/спокійний режим — добровільними. Зберігай попередні версії; новий дизайн додавай перемикачем. Голосова персоналізація має управляти підготовленими, перевіреними параметрами, не рухати controls під пальцем. Ніякого hidden manipulation або вигаданих гормональних вимірювань.

## Спочатку віднови реальний стан

1. Перевір branch, HEAD, dirty/staged state і історію; збережи чужу роботу. Не reset/clean/force checkout. Якщо product branch або `docs/REVIEW_HANDOFF.uk.md` недоступні, скажи точний remote SHA й відсутні файли; не уявляй, що остання доробка вже на GitHub.
2. Прочитай `docs/REVIEW_HANDOFF.uk.md`, `docs/PRODUCT_DNA.uk.md`, `START_HERE.uk.md`, `artifacts/mobile-webkit-20261009/REPORT.uk.md`, `artifacts/product-status-20261004/STATUS.uk.md`, `artifacts/product-status-20261004/ROLLOUT_REVIEW.uk.md`.
3. Відокрем поточні requirements від історичних `plan/`/старих README checkpoints. Не вимагай старого числа тестів чи готовності 33%; не відновлюй старі вже виправлені дефекти лише зі старого промпта.
4. Прочитай фактичні owners у `web_launch/`, `neon/`, `supabase/`, відповідні тести/генератори. Всі авторські claims — гіпотези до незалежного приймання, навіть якщо report має PASS.

## Проведи незалежний аудит і зроби корисну доробку

- Простеж два незалежні actor identities через профіль → зміна редакції → дві згоди → запрошення → чат → місце → evidence → receiver acceptance. Знайди unsupported live gates, dead controls, privilege/consent bypass, stale-response leakage, draft loss, duplicate delivery, unclear state і broken recovery.
- Перевір дизайн фактичними screenshots і кліками, якщо browser tool доступний: вузькі/звичайні/великі екрани, landscape, enlarged text, Current/Atelier, loading/error/empty, keyboard/focus. Не оцінюй сторінку, яку не бачив. Експертний score 1–100 можливий лише з явною рубрикою; це не виміряний user satisfaction.
- Перевір джерело canonical SQL, migration preconditions, grants/RLS, JWT/session/admission/readiness flags, public-asset packaging та архівну приватність. Не читаючи приватних production rows.
- Дай короткий ранжований P0/P1/P2 список із `claim → file/locator → independent check → verdict`. Відразу виправ одну найціннішу локальну проблему, яку можеш відтворити й перевірити; не зупиняйся на плані, якщо ремонт уже дозволений і безпечний. Після її приймання можеш взяти наступну незалежну вузьку задачу, а не безкінечно полірувати ту саму.
- Перед зміною чинної поведінки сформулюй збережений інваріант. Семантичний regression guard має зловити реальний дефект, пройти після fix і знову впасти на mutation/revert. Literal/snapshot/wording checks не замінюють поведінковий доказ. Документації не потрібні штучні тести.
- На стабільному diff зроби два скінченні review: реальна зміна проти інваріанта; один adversarial/mutation case. Перевір artifact/actual render після зміни. Не повторюй незмінені full suites лише заради counts; вибирай gates за dependency surface.

## Критичні межі, які не можна підміняти

- Наявний новий release локально accepted, unpublished. Desktop WebKit/Chromium і fixtures не є фізичними Android/iPhone, встановленням PWA, двома live акаунтами, справжнім HTTP JWT/RLS чи підтвердженим результатом клієнта.
- Збережи дві незалежні згоди, revision invalidation, receiver-only acceptance, CAS, private purge, late-read/logout guards, наступну чернетку та same-session explicit retry semantics. Мовчання не означає згоду на гроші/зустріч/публікацію.
- У локальному Windows checkout чужий dirty `web_launch/journey-ui.mjs` мав SHA256 `68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b`; не захоплюй його в свій commit. У чистому clone dirty payload відсутній.
- Історичний FlutterFlow/Firebase не є current PWA backend. Embedded Maps, live AI voice/video/Triangle, OAuth/social posting, checkout і сотні users/sec не прийняті. Не маскуй stub/скриптову відповідь під живий AI або ботів під користувачів.
- Google QA `synera-qa-20261009` створений; no billing підтверджено власником, API Console мала load failure. Chrome launch через ADB відхилений інструментом `blocked by policy`. Не повторюй і не обходь це іншим shell, transport, reservation чи новим проєктом без доказу зміни обмеження.
- Push історично відхилений через approval policy; не обходь його GitHub API/іншим checkout/upload. Новий точний дозвіл користувача не є доказом зміни platform policy. GitHub HEAD перевіряй read-only.
- Локальна реалізація, docs, regressions і owned commits — scope цієї роботи. Production SQL, recovery apply, deploy/publish, secret changes, install, deletion, paid provider calls, legal terms acceptance, повідомлення людям і розширення live registration потребують чинного точного дозволу відповідного середовища. Не вигадуй його з цього промпта. Зовнішній spend cap за замовчуванням $0.

## Відтворення й результат

Команди, portable build path, browser prerequisites та відомі Windows-only обмеження — у `docs/REVIEW_HANDOFF.uk.md`. Датовані `dist-neon-*` не входять до Git; побудуй новий окремий review candidate з source. Новий `built_at` означає новий release hash; перевір assets, а не підганяй hash до старої квитанції. Не послаблюй oracle, consent або readiness, щоб отримати зелений тест.

Залиш один компактний source-linked звіт у власному `artifacts/opus-review-<date>/`: що перевірив незалежно, відтворені дефекти, що виправив, actual tests/command exits, diff/source hashes, unresolved gates та один конкретний NEXT. Commit лише власні перевірені файли, якщо current environment/user authorization це дозволяє. Онови наявні shared entrypoints і `task_log.jsonl`; не додавай router/queue/ledger/daemon або іншу систему управління.

Відповідай українською прямо: **що реально стало краще; який доказ; що ще не працює; що потрібно від Андрія**. Не називай весь продукт market-ready без живого двостороннього циклу, phone acceptance, recovery і точного rollout acceptance. Якщо є тільки зовнішній blocker, заверши незалежну локальну роботу й опиши саме його.

---
