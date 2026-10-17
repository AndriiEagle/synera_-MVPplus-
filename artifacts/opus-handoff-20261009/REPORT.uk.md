# Synera: пакет незалежного Claude Opus review

09.10.2026. **LOCAL_HANDOFF_ACCEPTED / GITHUB_SYNC_PENDING.** Це доробка документації й перевірка відтворення, не нова функція застосунку чи production release.

## Що підготовлено

- `docs/PRODUCT_DNA.uk.md`: аудиторія, обіцянка, головний цикл, дизайн/відчуття, карта, L, trust/privacy, проєкти/радари/social, економіка й критерії «шедевра». Задум відділений від фактичної реалізації.
- `docs/REVIEW_HANDOFF.uk.md`: branch/owners, дати доказів, 10 непереданих на початку комітів, P0/P1/P2 backlog, інваріанти, portable commands, legacy/security/privacy і production gates.
- `docs/CLAUDE_OPUS_REVIEW_PROMPT.uk.md`: готове завдання незалежно перевірити claims і відразу виправити відтворену локальну проблему; без повторного захоплення dirty роботи чи підміни acceptance.
- Дев'ять existing entrypoints мають нові короткі prefixes. Увесь попередній текст/байти збережені як suffix: README, CLAUDE, START_HERE, plan README/Bible/readiness/old prompt, web_launch README та systems STATUS.

Історичні артефакти не видалені. Старі runtime/paths/counts/NEXT позначені як історичні; source-linked current handoff має пріоритет для поточного review. Нова таблиця почуттів не видається за виміряні гормони/емоції.

## Незалежне локальне приймання

Source export: `git archive HEAD web_launch neon tools package.json`, база `7f2f217`. ZIP 1,066,784 bytes. Розпаковано в новий ізольований temp-каталог; локальний dirty `journey-ui.mjs`, node_modules, auth/browser state і databases у цю копію не ввійшли.

- Команда з handoff: 4 Node test files, **59 PASS / 0 FAIL / 0 SKIP**; raw `NODE_TESTS.txt`.
- `node neon/build.mjs dist-neon-opus-review-20261009` у новому каталозі: exit 0. Незалежно прочитані й перехешовані всі **96 manifest assets**, рівно **97 files**. `PORTABLE_BUILD.json` містить hash і scope.
- Новий review build не названий exact replica dated Windows candidate: generated metadata й checkout newline bytes можуть відрізнятися. Немає publication, browser або live acceptance цього build.
- `VALIDATION.json` фіксує local Markdown link closure, наявність documented test paths, privacy-pattern check, збереження оригіналів і negative case для broken-link detector. Це структурне приймання handoff, не повний security audit history.

Finite review 1: фактичний diff — лише docs/context/receipts, product behavior не змінений; старі originals збережені. Виявлена під час перевірки відсутня test filename замінена правильною, після чого documented команда реально виконана. Finite review 2: clean-source reconstruction, independent hashes і deliberate missing-link negative check. Після приймання додатковий polishing припинено.

Чужий `web_launch/journey-ui.mjs` збережений із SHA256 `68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b`. У commit включаються лише owned documentation/proofs. Private Console/auth screenshots, cookies, токени, фінансові/міграційні дані й приватні бізнес-ідеї не додавались.

## GitHub: перевірений факт, не обіцянка

Read-only `gh api`: repository public, default `main`. PR #1 merged, head `codex/synera-multihost-plan-20260915`; це не current product PR. Read-only `git ls-remote`: product branch `codex/synera-product-20261002` = `6724682f5f43172e5732fa41b8a46e4baa6384e2` до підготовки пакета. Latest local source тоді `7f2f217`, **10 commits ahead**.

Попередня автоматична перевірка відхилила push до виконання: `approval required by policy, but AskForApproval is set to Never`. User authorization на push є; зміна цього platform restriction не доведена. Не було повторного push, GitHub API upload, іншого checkout/transport чи force push для обходу. Тому **пакет підготовлений локально; до manual push не весь поточний контекст на GitHub**.

NEXT, 2–5 хв: виконати один стандартний user-run push продуктового commit, вказаного у фінальній відповіді; після цього read-only порівняти remote SHA з цим commit і лише тоді давати GitHub branch Claude Opus. До production apply/deployment цей push не належить.

Models used: none (provider calls=0, USD=$0.00).
