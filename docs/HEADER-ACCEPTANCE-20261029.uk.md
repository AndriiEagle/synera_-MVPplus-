Status: PASS_LOCAL — header 12/12 cases, 108/108 checks; Playwright 39/39; Node 788 pass, 1 existing PG skip; Python 3/3.

# Synera: приймання спільної шапки, 29.10.2026

Працював лише в `C:/sw/synera-design`, гілка `claude/synera-design-20261029c`, незмінений HEAD/base `ef39b7d48e875eb88871cc2cfabf91344f1c7875`. Початкове дерево чисте; `git ls-remote origin refs/heads/main` повернув цей самий SHA. Commit, push, install і deploy не виконував. Junction `node_modules` лишився спрямованим на `C:/Users/Andrii/Desktop/synera-clone/node_modules`. Тимчасові адаптери й Playwright output розміщені на C: поза репозиторієм.

## Причина і зміни

CI запускає `node tools/header-layout-acceptance-20261013.mjs` без спеціальних env/flags на Ubuntu / Node 22 після встановлення bundled Chromium. Скрипт читає `SYNERA_TEST_MODULE_ROOT`, `SYNERA_TEST_WEB_ROOT`, `SYNERA_TEST_OUTPUT_ROOT`, підтримує `--webkit`, `--baseline`, `--mutant`; окремого Chrome channel override немає. `.github/workflows/ci.yml`, repo Playwright config і обидва specs залишилися незмінними.

Оригінальний скрипт відтворено до редагування: **12 failed / 0 passed**, усі через timeout старого `#lang-switcher [data-lang=...]`. [Baseline JSON](header-acceptance-20261029/baseline/RESULT.json), [лог](header-acceptance-20261029/baseline.txt).

`tools/header-layout-acceptance-20261013.mjs` тепер:

- обирає мову через `#site-language`, вигляд через `#style-preset` у «Мова і вигляд»;
- явно обирає `synera` для Current і `atelier` для Atelier, а також перемикає наявний Atelier preference layer відповідно до того самого boolean; новий Atelier default більше не підміняє Current-сценарії;
- вимірює закриту шапку та відкриту панель: бренд, summary, статус і окремі controls; контейнери не порівнюються зі своїми дочірніми елементами як незалежні об'єкти;
- перевіряє горизонтальні межі шапки й усіх видимих descendants панелі, overlap з тим самим допуском 0.5 px, `elementFromPoint` для `#back-login` у відкритій панелі та actionability через trial-click для мови, вигляду, обох Atelier choices і повернення до входу;
- зберігає **всі сім початкових перевірок**: overlap, viewport fit, unobstructed back-to-login, Import, експорт незбереженої чернетки, незмінність полів/permissions, відсутність account writes; додає дві перевірки застосованого стану й доступності налаштувань.

Матриця незмінна: **uk/de/en × Atelier off/on × 320/390 px = 12 випадків**. У кожному тепер дев'ять перевірок. Збережено synthetic draft, блокування зовнішніх запитів, service worker block, timeout 15 s, screenshot evidence та exit 1 при дефекті.

Після узгодження селекторів тест виявив продуктовий дефект: **DE / 320 px / обидва вигляди**. Німецький summary переносився на другий рядок і вирівнювався ліворуч; панель шириною 280 px отримувала **left = −90.203125 px**, хоча `document.scrollWidth` залишався 320. Також старі `grid-column/grid-row` кнопки входу створювали зайві колонки всередині нового меню Current. [Selector-only JSON](header-acceptance-20261029/candidate/RESULT.json), [лог](header-acceptance-20261029/selectors-only.txt).

Мінімальна правка `web_launch/site-shell.css`: повернуто `margin-left: auto` для `.header-preferences`; скинуто `grid-area` статусу та session controls лише всередині спільної панелі. У фінальному DE/320 панель має **left = 16 px, right = 296 px**. Власноруч переглянув знімки [Current](header-acceptance-20261029/final/candidate/de-current-320-preferences.png) і [Atelier](header-acceptance-20261029/final/candidate/de-atelier-320-preferences.png): панель у межах екрана, кнопки повернулися в одну колонку; вертикальний scroll панелі збережений.

## Фінальні результати

| Набір | Pass | Fail | Skip | Доказ |
|---|---:|---:|---:|---|
| Header matrix | 12 cases / 108 checks | 0 | 0 | [RESULT.json](header-acceptance-20261029/final/candidate/RESULT.json), [лог](header-acceptance-20261029/final.txt) |
| Main Node, 739 tests | 738 | 0 | 1 | [node-main-final.tap](header-acceptance-20261029/node-main-final.tap) |
| Simulation JS + PWA + i18n, 50 tests | 50 | 0 | 0 | [node-additional-final.tap](header-acceptance-20261029/node-additional-final.tap) |
| Обидва Playwright specs | 39 | 0 | 0 | [playwright-final.txt](header-acceptance-20261029/playwright-final.txt) |
| Python simulation provider | 3 | 0 | 0 | [python-simulation-final.txt](header-acceptance-20261029/python-simulation-final.txt) |

Усі фінальні команди повернули exit 0. Єдиний skip наявний: `SYNERA_ACCEPTANCE_PG` не заданий, disposable PostgreSQL integration-run пропущений. Нових skip або вилучених випадків немає. Node і Playwright повторено після фінальної CSS-правки. `git diff --check` — PASS.

```powershell
node --test web_launch/*.test.mjs web_launch/iceberg/*.test.mjs neon/*.test.mjs plan/v6/workflow/approval-boundary.test.mjs
node --test tools/simulation-server.test.mjs tools/simulation-runner.test.mjs tests/pwa/*.test.mjs tests/i18n_ch/*.test.mjs
py -3 -B -m unittest discover -s tools -p test_simulation_provider.py
node node_modules/@playwright/test/cli.js test --config C:/sw/task1601-pw-chrome.config.mjs --output C:/sw/task1601-e2e-final tests/browser-e2e.spec.mjs tests/studio-e2e.spec.mjs
$env:SYNERA_TEST_OUTPUT_ROOT='docs/header-acceptance-20261029/final'
node --require C:/sw/task1601-header-chrome.cjs tools/header-layout-acceptance-20261013.mjs
```

Локальний preload `C:/sw/task1601-header-chrome.cjs` змінює лише Chromium launch options:

```js
const { createRequire } = require('node:module');
const fromRepo = createRequire('C:/sw/synera-design/package.json');
const { chromium } = fromRepo('playwright');
const launch = chromium.launch.bind(chromium);
chromium.launch = options => launch({ ...options, channel: 'chrome' });
```

Тимчасовий Playwright config імпортує repo config, зберігає всі runner/use options, задає абсолютні `testDir`/`outputDir` та `use.channel: 'chrome'`. Точні тексти й SHA-256 усіх трьох локальних адаптерів, source-файлів і artifacts містить [evidence.json](header-acceptance-20261029/evidence.json). Для незмінених файлів окремо врахована лише різниця CRLF/LF між Windows checkout і Git blob. Копії логів `.txt`/`.tap` включаються звичайним Git add; вихідні `.log` збережені, але ігноруються глобальним repo pattern.

## Негативні перевірки

Фінальний, незмінений oracle зі старим CSS із точного base SHA через тимчасовий browser route: **2 failed / 10 passed**, обидва DE/320, `document fits viewport`, exit **1**, без page errors. Робочий CSS не відкочувався. [Reversal JSON](header-acceptance-20261029/reversal/baseline/RESULT.json), [лог](header-acceptance-20261029/reversal.txt).

`--mutant` оновлено для нового DOM: навмисний зсув бренду над summary на Current/320. Результат: **2 failed / 10 passed**, UK та EN, саме `header controls and status do not overlap`, exit **1**, без timeout/page errors. Німецький summary на іншому рядку, тому цей конкретний мутант його не перекриває. [Mutant JSON](header-acceptance-20261029/negative/mutant/RESULT.json), [лог](header-acceptance-20261029/mutant.txt). Ці прогони підтверджують чутливість геометричних перевірок; іншої моделі або зовнішнього експерта не залучав.

Локальне середовище: Node **24.16.0**, системний Chrome **156.0.8078.73**. Це приймання запитаного локального набору, а не новий GitHub CI run, bundled Chromium/Node 22, WebKit, фізичний телефон чи production readiness. Інші кроки повного CI поза запитаним набором не повторював. API `set_thread_title` тут недоступний; назву треду через API не змінював, номер 1601 повторно не резервував.

NEXT для Claude, 5–10 хв: переглянути два source diffs і докази, включити їх до свого commit/push та звірити новий GitHub CI run. До віддаленого green статус залишається `PASS_LOCAL`.

Models used: none (provider calls=0, USD=$0.00).
