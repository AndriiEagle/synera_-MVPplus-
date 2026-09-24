# Synera Google-вхід через Neon Auth — reviewable local package

## Реалізовано локально

`web_launch/neon-store.mjs` відкриває тільки same-origin
`/api/neon/oauth/google/start`. Якщо і тільки якщо
`SYNERA_GOOGLE_OAUTH_ENABLED === 'true'`, `neon/worker.mjs` робить
server-to-server `POST` до pinned Neon Auth
`/sign-in/social` з Better Auth body:

```json
{
  "provider": "google",
  "callbackURL": "https://<SYNERA_SITE_URL>/?oauth=google",
  "errorCallbackURL": "https://<SYNERA_SITE_URL>/?oauth=google-error",
  "disableRedirect": true
}
```

Gateway перенаправляє браузер лише після валідації відповіді Better Auth:
точний Google authorization origin/path, `response_type=code`, nonempty client ID,
точний Neon callback `/callback/google`, `state` і S256 PKCE challenge. Неповна,
підроблена або open-redirect відповідь завершується `503 google_oauth_unavailable`.
Ні verifier, ні OAuth code/token, ні provider cookie не потрапляють у JS або JSON-відповідь.

Локальна acceptance-перевірка в `neon/worker.test.mjs` спочатку падала на старому generic
`/handler/sign-in`, бо той не викликав `/sign-in/social`. Після зміни вона перевіряє exact
provider body, upstream endpoint та відхилення неправильного callback/відсутнього PKCE.

## Межа: initiation працює локально, сесія після callback ще не доведена

Це provider-specific Google **initiation**, але не чесний доказ повного live login. Better Auth
відправляє Google callback до Neon Auth. Звичайний browser cookie для домену Neon не може бути
прочитаний чи перенесений Cloudflare gateway на домен Synera; наявний worker створює
`__Host-synera-session` тільки у відповіді OTP verify. Тому після live callback він наразі не має
підтвердженого механізму відновити server-side Synera session. Не вмикати flag для користувачів,
доки Neon не надасть документований session-handoff/callback-bridge або не буде схвалено зміну
архітектури auth SDK/cookie model.

## Зовнішні блокери — не виконані

1. У Neon Console для потрібного branch налаштувати Google provider з client ID/secret. Секрет
   не потрапляє в repo, чат або Cloudflare variables.
2. У Google Cloud дозволити **рівно** callback, який покаже Neon Auth для цього branch, і
   trusted Synera origin. Не додавати wildcard, localhost або callback напряму в worker.
3. Перевірити в Neon Auth, що фактичний callback дорівнює
   `https://<neon-auth-endpoint>/.../auth/callback/google`, а Better Auth response проходить
   локальну сувору валідацію.
4. Знайти документований спосіб завершити Neon callback у server-owned Synera session без
   передачі cookie/token через JavaScript. Лише після цього окремо review/approve flag і live
   acceptance: initiation → Google consent/cancel → callback → `/api/neon/session` → policy → logout.

## Офіційні джерела

- Better Auth Google: https://www.better-auth.com/docs/authentication/google
- Better Auth social sign-in API: https://www.better-auth.com/docs/concepts/oauth
- Neon Auth / Better Auth setup: https://neon.com/docs/auth/overview

Жодного provider call, Console mutation, deploy, publish або secret access не виконано.
