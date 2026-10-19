# Відтворення незалежного аудиту Synera

Baseline: `7eaa952c6e0e498521cc325ab1cf24fec1e0f725`. Це audit-only scripts; вони не виправляють продукт і не викликають реальний Auth/Data API.

## Запуск

Потрібен Node 24. Зовнішніх бібліотек, `npm install`, ключів і браузера цим двом scripts не потрібно.

Якщо файли розміщені в `<repo>/artifacts/independent-audit-20261019/`, source root визначається автоматично:

```bash
node artifacts/independent-audit-20261019/technical-repros.mjs
node artifacts/independent-audit-20261019/paid-oneway-card-repro.mjs
```

Для окремого pinned checkout або connector snapshot передай **абсолютний** шлях:

```bash
SYNERA_AUDIT_SOURCE=/absolute/path/to/pinned-source node artifacts/independent-audit-20261019/technical-repros.mjs
SYNERA_AUDIT_SOURCE=/absolute/path/to/pinned-source node artifacts/independent-audit-20261019/paid-oneway-card-repro.mjs
```

PowerShell:

```powershell
$env:SYNERA_AUDIT_SOURCE = 'C:\absolute\path\to\pinned-source'
node artifacts/independent-audit-20261019/technical-repros.mjs
node artifacts/independent-audit-20261019/paid-oneway-card-repro.mjs
```

JSON-result записується поряд із відповідним script. Вихідні файли продукту не змінюються. У цьому аудиті portable scripts виконано через override на `synera-pinned`, а default repository layout окремо перевірено на disposable копії.

## Що означає результат

Перед dynamic import продукту кожен script звіряє **27 raw SHA256**: усі прямі/транзитивні module imports, fixtures та релевантні HTML/app bytes. Hash manifest закріплено всередині script. Зміна хоча б одного модуля або відсутній файл дає `PINNED_REPLAY_REFUSED`, `productCodeImported:false`, `findingsReplayed:false`. Relative override також відхиляється.

Перевіряються exact baseline bytes; автоматичної EOL normalization немає. Це source-content provenance для переліченої closure, а не нова перевірка Git ancestry всього checkout. Ancestry/blob provenance вихідного аудиту описані основним звітом.

**Exit 0 тут означає, що відомі дефекти baseline відтворені**, а не що продукт безпечний чи виправлений. `technical-repros` перевіряє TA-01/02/03. `paid-oneway-card-repro` показує TA-04 як одну послідовність: валідний buyer без offer tags → eligible paid candidate → editor/scoper rejection → окремо canonical one-way material через store API → accepted buyer outcome → supplier card rejection.

Обидва використовують original executable functions, але synthetic provider transport. Вони не виконують PostgreSQL, не перевіряють справжні JWT, browser cookies чи фізичні телефони. TA-03 записує actual worker `Set-Cookie` і явно моделює його наслідок у cookie jar. TA-01 записує actual bearer subject, dispatch-нутий до synthetic erasure RPC; жодні реальні дані не стиралися.

Після виправлень **не змінюй embedded baseline hashes**, щоб назвати новий код цим самим pinned replay. Збережи ці scripts як immutable evidence; для виправленої поведінки створи окремі regression tests з іншим source pin/receipt та очікуванням відмови неправильному запиту.

## Самоперевірка audit runner

`preflight-validation.json` містить шість targeted checks: default layout, одна змінена module у disposable копії та relative override — для кожного script. Єдину мутацію зроблено в тимчасовій копії `neon/worker.mjs`; pinned snapshot не змінювався. Негативні receipts названі `*-intentional-drift-rejection.json`, щоб їх не сприймали як product failures.

Під час розробки нового TA-04 probe перший запуск спинився через неточний очікуваний текст exception: canonicalizer перевіряє `outcomes` раніше за `deliverables`. Assertion виправлено на фактичну, source-підтверджену помилку «Некоректний власник результату або здатність». Це правка нового audit harness; product source і наявні tests не змінювалися. Остаточні JSON і log походять від повторного успішного виконання того самого substantive rejection сценарію.
