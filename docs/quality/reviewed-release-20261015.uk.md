# Synera: перевірений source candidate — 15.10.2026

Продовжувати з гілки `codex/synera-reviewed-mobile-20261013` у canonical `AndriiEagle/synera_-MVPplus-`. Base `68ee2869eb678563198d3f8fba5c5ed31ea664f2` уже містить мобільний fix поверх product `a6be71a`. `main` та старий product checkout не підмінені цією гілкою.

## Що дороблено

- Перевірені раніше виправлення мобільних CTA/меню та перенесення кнопок профілю інтегровані в один source candidate.
- На екранах до 360 px статус чернетки займає окремий рядок і не перекриває кнопку входу. Збережені Current/default, Atelier opt-in, три мови, незбережені поля й дозволи.
- Публічна офлайн-оболонка кешує відсутні залежності. API, конфігурація, query URL та запис акаунта не потрапляють у публічний кеш. Повний серверний journey офлайн цим не обіцяється.
- Відмова видалення профілю 409 має власне повідомлення; діалог закривається, помилка видима, профіль і сесія зберігаються. Інші 409 та auth/server помилки зберігають свою семантику. Причина відмови не вгадується із санітизованого HTTP-коду. Room retention / повне видалення акаунта цим не виправлено.
- Існуючий 9-case gateway/client oracle перенесений у `neon/profile-delete.test.mjs`; CI також запускає реальний header та cache-only offline oracle. Нових залежностей немає.

## Перевірка

[Source hashes і acceptance](../../artifacts/reviewed-release-20261015/ACCEPTANCE.json): **668/669 Node PASS, 0 FAIL, 1 SKIP**. Пропущено лише disposable PostgreSQL integration-run без `SYNERA_ACCEPTANCE_PG`. **39/39 browser E2E**, 12 header cases / 84 checks на зібраному release; старий CSS повертає 3 очікувані відмови. **14/14 offline checks** із фізично зупиненим origin-сервером та очищеним HTTP cache; вилучення модуля з SW знову ламає запуск і дає ненульовий exit. Location workflow зі штучними акаунтами пройшов; existing accessibility audit не виявив critical/serious порушень.

Збірка `web_launch/dist-neon-reviewed-20261015`: 103 файли, 102 asset hashes перевірені; release SHA256 `f4ccbd81a7e9f61bf409112f4d546324c190f3f81abbf4ad1d079e9aafd470d9`. Generated release не комітиться, відтворюється `node neon/build.mjs dist-neon-reviewed-20261015`. Метадані наступної збірки можуть мати іншу дату; порівнюй asset hashes.

Для повторення після встановлених locked dependencies і Chromium:

```sh
node --test web_launch/*.test.mjs web_launch/iceberg/*.test.mjs neon/*.test.mjs plan/v6/workflow/approval-boundary.test.mjs
npx playwright test tests/browser-e2e.spec.mjs tests/studio-e2e.spec.mjs
node tools/header-layout-acceptance-20261013.mjs
node neon/build.mjs dist-neon-ci
node tools/offline-shell-acceptance.mjs --candidate=web_launch/dist-neon-ci
```

[Header 320](../../artifacts/reviewed-release-20261015/header-de-320.png) · [390](../../artifacts/reviewed-release-20261015/header-de-390.png). Поточний WebKit запуск не відбувся: очікуваний `webkit-2359` відсутній у налаштованій Playwright installation. Попередні WebKit receipts стосуються старих артефактів, не нового CSS.

## Китайські моделі й залишок роботи

[Фактична квитанція та прив'язка до прийнятого висновку](../../artifacts/reviewed-release-20261015/PROVIDER_READBACK.json), [незалежний розбір](../../artifacts/reviewed-release-20261015/PROVIDER_TRIAGE.uk.md). MiniMax M3 image review відновлений без регенерації; F1 підтверджена локально, F2 відхилена. Перевірені actual model, request/output hashes, два PNG, recorded cost, individual claim linkage; підміна на zero-call або text-only відхиляється. Це часткове приймання початкового visual review, не новий provider-review кінцевого render.

Загальна provider-хвиля **HOLD**: DeepSeek 429 без cost receipt; GLM started без terminal. Підтверджена відома сума з попередніми GLM/Qwen — **$0.00605802**, остаточна сума невідома. Нових provider calls у цьому продовженні 0; повтори не запускалися. Обов'язкова китайська робота не перейменована в optional і повне виконання всіма дочірніми чатами не заявляється.

## Перед запрошенням людей

**LIVE_ROLLOUT_HOLD.** Потрібні фактична production-схема й recovery, погоджений exact rollout, signed JWT / два живі акаунти та один реально прийнятий результат, фізичні Android/iPhone (install/update/resume/keyboard). Старий `/real-journey` 404 — спостереження 13.10, сьогодні live повторно не перевірявся. Для room cohorts залишається проблема FK/retention під час видалення; жодних production SQL/grants тут не застосовано.

NEXT, 15–20 хв: read-only звірка актуальної Neon schema/recovery й точного пакета для закритого пілота двох людей. Deployment та запрошення людей окремо не виконані.
