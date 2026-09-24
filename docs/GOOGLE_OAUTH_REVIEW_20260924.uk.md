# Synera Google-вхід через Neon Auth — reviewable local package

## Вердикт: Google OAuth вимкнено fail-closed

Provider-specific `POST /sign-in/social` **не можна** безпечно запускати server-to-server через
цей worker. Better Auth створює `state`, PKCE verifier та ставить OAuth state cookie у відповіді
на старт; callback `/callback/google` потім перевіряє той cookie на домені Neon. Cloudflare
gateway не може передати Set-Cookie з server fetch у browser jar Neon-домену. Попередній варіант
відкидав цей cookie і міг відкрити Google flow, який неминуче зламає state validation.

Тому `web_launch/neon-store.mjs` завжди відмовляє Google start, `/api/neon/oauth/google/start`
повертає `404`, і `/config.json` завжди видає `googleOAuthEnabled: false` — навіть якщо legacy
environment flag випадково встановлено. Немає upstream OAuth call, redirect, токена, code або
cookie у browser JavaScript чи gateway.

`neon/worker.test.mjs` спершу падала проти unsafe provider-start реалізації: вона вимагала 404 і
нуль upstream calls при активному legacy flag. Після fail-closed зміни ця semantic regression
перевірка проходить; клієнтський тест також доводить, що forged config flag не відкриває навігацію.

## Зовнішні блокери — не виконані

1. У Neon Console для потрібного branch налаштувати Google provider з client ID/secret. Секрет
   не потрапляє в repo, чат або Cloudflare variables.
2. У Google Cloud дозволити **рівно** callback, який покаже Neon Auth для цього branch, і
   trusted Synera origin. Не додавати wildcard, localhost або callback напряму в worker.
3. Отримати від Neon документований browser-domain-safe спосіб запуску social sign-in, який
   зберігає Better Auth state cookie, і окремий server-owned Synera session handoff без передачі
   cookie/token через JavaScript.
4. Лише після окремого review/approval реалізувати новий adapter і live acceptance:
   initiation → Google consent/cancel → callback → `/api/neon/session` → policy → logout.

## Офіційні джерела

- Better Auth Google: https://www.better-auth.com/docs/authentication/google
- Better Auth social sign-in API: https://www.better-auth.com/docs/concepts/oauth
- Better Auth state implementation: https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/state.ts
- Neon Auth / Better Auth setup: https://neon.com/docs/auth/overview

Жодного provider call, Console mutation, deploy, publish або secret access не виконано.
