# Google-вхід: локальний адаптер, живий запуск ще закритий

Дата: 2026-09-26. Гілка: `codex/synera-first-ten-integration`.

## Що готове

- Кнопка «Продовжити з Google» відкриває наявне підтвердження правил. До підтвердження немає OAuth-запиту.
- Same-origin POST `/api/neon/oauth/google/start` зберігає перевірки Origin, custom header, поточної згоди та готовності приватного пілоту.
- Сервер звертається до Managed Neon Auth `/sign-in/social`, задає Google і фіксований callback. Перевіряє точну адресу Neon `/sign-in/social/init?token=…`; браузер спочатку відвідує Neon для встановлення provider-domain state, потім Google.
- Challenge-cookie має окрему HttpOnly/Secure/Lax `__Host-` назву. Канонічне та legacy написання Neon зберігаються окремо; неоднозначні cookies відхиляються.
- Callback приймає top-level GET без fetch-only custom header. Вимагає challenge і один verifier; сервер обмінює їх через `/get-session`. Сесію отримує тільки користувач із підтвердженим email у списку запрошених.
- У браузерний JSON не потрапляють session token, JWT чи challenge. OAuth init token є частиною очікуваної навігації до Neon, а не токеном сесії.
- Успіх відновлює наявну HttpOnly сесію Synera. Невдача очищає challenge та переводить на чисту сторінку входу з поясненням і можливістю отримати email-код. Кожний подальший authenticated request повторно перевіряє запрошений email.
- Пакет Cloudflare збирається без нових залежностей; підписаний SDK session-data cache не використовується.

## Межа доказу

**LOCAL_PROTOCOL_VERIFIED; LIVE_GOOGLE_NOT_VERIFIED.** Mock-server перевірки не доводять, що Google provider увімкнений у потрібному Neon branch. Новий `SYNERA_GOOGLE_OAUTH_READY` залишається невстановленим; legacy `SYNERA_GOOGLE_OAUTH_ENABLED` його не замінює. Публічний сайт не оновлено.

Живе приймання має перевірити справжні upstream cookie names/attributes, verifier/challenge pairing і повторне використання, перший та повторний Google-вхід, повільне підтвердження, скасування, дві паралельні вкладки, відхилену адресу, restore, RLS read та logout. Локальне очищення cookie не є доказом одноразовості upstream verifier.

Вендорський issue #227 повідомляє про перший повільний Google-вхід і втрату callbackURL. Це стороннє відтворення у репозиторії Neon, а не підтверджений дефект нашого розгортання. Наше поточне приймання не обходить цю невизначеність:
https://github.com/neondatabase/neon-js/issues/227

## Перевірка

- Семантичні тести клієнта були червоні перед зміною: згоди недостатньо, серверного POST не було. Після реалізації зелені.
- 26 focused auth tests: успіх, CSRF-відмови, неправильні/дубльовані challenge та verifier, не запрошений користувач, небезпечна init-адреса, відновлення сесії, OTP-регресії.
- Загальний Node прогін: 433 pass, 1 skipped, 0 fail.
- Playwright: 22/22; Google UX перевіряється через підставний gateway, реальний Google не натискався.
- Allowlist mutation: вилучення серверної перевірки дозволяло чужий account; тест відхилив цю мутацію.
- Збірка: 42 files, `published:false`; зібраний worker виконано локально, readiness=false не відкриває Google.

## Зовнішня перевірка та витрати

GLM `z-ai/glm-5.3-flash`, architecture review: requested=actual, cost receipt `$0.0021818`, 695 input / 4308 output tokens. Рекомендації перевірені локально; припущення не прийняті як факти.

Другий GLM review реалізації: `$0.00271545`, output_truncated, результат відхилено. Разом `$0.00489725` із дозволених `$0.50`. Квитанції в канонічному Token Monster ledger; звіти у workspace `reports/synera-google-20260926`.

## Офіційний контракт

- https://github.com/neondatabase/neon-js/blob/main/packages/auth/src/server/middleware/oauth.ts
- https://github.com/neondatabase/neon-js/blob/main/packages/auth/src/server/proxy/request.ts
- https://github.com/neondatabase/neon-js/blob/main/packages/auth/src/server/proxy/response.ts
- https://github.com/neondatabase/neon-js/blob/main/packages/auth/src/server/constants.ts

## NEXT — 15–20 хвилин

Після точного дозволу на зовнішні зміни: вибрати ізольований Neon branch, налаштувати його Google provider і точний Google callback, завантажити окремий Cloudflare Preview та пройти живий сценарій. Новий readiness flag допускається тільки після цього приймання. Production deployment і push цього пакета ще не дозволені.
