# Handoff: почни з одного вузла

Доповнення: [повний робочий процес](workflow/WORKFLOW.uk.md). V6-00 вже відтворено: baseline 140/140, окремий client approval probe 1 PASS / 1 FAIL. Це RED для майбутнього B2; дефект ще не виправлено. Перед новим виконанням звір REPORT.json і поточні hashes; не повторюй baseline без зміни стану/ризику. Наступний вузол контракту — V6-03, потім V6-04. 

Прочитай EXECUTION_PLAN.uk.md і TASKS.json у цій папці. Це доповнення до CNRA/Synera, не новий продукт. Перед змінами звір поточне user authorization: попередній запит закривав план, а не deployment чи всю реалізацію.

Корінь коду: C:/Users/Andrii/Documents/ChatGPT/DeskTopAugust/synera-docs-review-20260904/source.
Корінь планів: C:/Users/Andrii/Documents/ChatGPT/DeskTopAugust/output/cnra-solo-rebuild-20260909.

1. Прочитай git status, git log -3, чинні AGENTS і попередній HANDOFF_PROMPT_NEXT_CHAT.uk.md. Перевір source hashes. Не затирай dirty work. Запусти `py -3 -X utf8 C:/Users/Andrii/.claude/tools/kilo_watch.py synera-docs-review`; активний писач означає іншу ownership lane, не паралельне редагування того ж файлу.
2. Запусти з кореня source:

```powershell
$t = @(Get-ChildItem '.','./web_launch','./neon' -Filter '*.test.mjs' -File).FullName
node --test $t
```

Останній свіжий baseline: 140/140 на 15.09.2026, HEAD 2aa7fae. Відмінне число спочатку поясни. Не вимагай навічно рівно 140 після додавання тестів.

3. Якщо реалізацію дозволено, бери V6-03 — per-party persistence contract. V6-00 вже має proof у workflow/REPORT.json. Для наступного вузла повинні бути прийняті dependencies, а не просто worker reports. Code ownership і oracle є в TASKS.json; proposed paths позначені явно. Заморозь конкретні fixtures перед hosted worker; expected answers залиш локальному checker.
4. Стан: INPUT → INSPECT → PREFLIGHT → EXECUTE → ACCEPT. Missing proof = HOLD. Provider output не може сам дати ACCEPT. Максимум одна корекція, потім зміна підходу. Не розширюй scope/cap і не запускай нащадків від імені worker.
5. Локальний пакет local_only не відправляти провайдеру. Synthetic worker отримує лише штучний контракт. Ціна/умови/контакти/згода не генеруються моделлю як факти. Free route exact ID + receipt $0 + no fallback. DeepSeek exact ID deepseek/deepseek-v4.1-flash, total cap $0.50 мінус фактичні витрати й reservations; зараз він не викликався, але старий preflight BLOCK треба перевірити знову. Не обходь його.
6. Перед зміною поведінки тест має відтворити реальний дефект; після правки relevant tests + перевірка сценарію. На критичних gates mutation має спричинити падіння тесту. Збережи old/new hash, вузький diff і rollback через reverse own patch; ніякого blanket reset.
7. Звіт: один стан, owner, артефакт, independently observed acceptance, невідоме, один NEXT. Не називай app готовою через завершений план, зелений unit suite або нульову квитанцію.

Незмінні інваріанти: одна сторона не погоджує за іншу; material edit інвалідує обидва approvals; expired/revoked не відкриває introduction; missing feedback видимий у знаменниках; ціни від людей; жодних рейтингів людей; synthetic не потрапляє в real store. Не змінюй поточний pair contract для трьох осіб. Неможлива вимога → HOLD із конкретною причиною, а не вигаданий результат.
