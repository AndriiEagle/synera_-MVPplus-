# Synera Google-вхід через Neon Auth — reviewable local package

## Реалізовано локально

`web_launch/neon-store.mjs` відкриває лише same-origin `/api/neon/oauth/google/start`.
`neon/worker.mjs` відкидає цей маршрут, доки `SYNERA_GOOGLE_OAUTH_ENABLED !== 'true'`, і тоді
перенаправляє тільки на pinned Neon Auth `/handler/sign-in` з єдиним return URL
`https://<SYNERA_SITE_URL>/?oauth=google`.

Важлива межа: цей локальний gateway відкриває керовану сторінку входу Neon Auth, але сам не
викликає документований provider-specific метод `signInWithOAuth('google')`. Тому назва кнопки
«Увійти з Google» прийнятна лише після live-перевірки, що налаштований Neon handler справді
показує й запускає Google, а cancel/return відновлює очікувану серверну сесію. До цього прапорець
`SYNERA_GOOGLE_OAUTH_ENABLED` має залишатися вимкненим.

Google authorization, `state`, PKCE verifier, code exchange, provider tokens і сесія належать
Neon Auth (managed Stack) і не передаються в browser JavaScript. Після повернення застосунок
відновлює тільки HttpOnly server session через наявний `/api/neon/session`; правила пілота
як і раніше вимагають окремого підтвердження перед першим збереженням профілю.

## Зовнішня дія оператора — ще не виконана

1. У Neon Console для **наявного production branch** `quiet-credit-94155104` увімкнути Google
   як OAuth provider і внести Google OAuth client ID/secret у Neon Auth. Не передавати секрет у
   репозиторій, чат або Cloudflare variables.
2. У Google Cloud OAuth client додати **рівно callback, який покаже Neon Auth setup**, і trusted
   Synera origin `https://synera-pilot.pages.dev`; не додавати wildcard, localhost або callback
   напряму в Cloudflare worker.
3. Перевірити в Neon Auth exact trusted domain / return URL для `https://synera-pilot.pages.dev`.
4. Лише після review worker package поставити Cloudflare secret-free flag
   `SYNERA_GOOGLE_OAUTH_ENABLED=true`; це не містить client secret. Інші чинні flags лишити без
   змін. Публікація пакета й будь-яка production mutation потребують окремого дозволу.
5. Приймання: новий дозволений тестовий учасник виконує initiation → Google consent/cancel →
   exact return → session restore → policy acceptance → logout. Зафіксувати тільки timestamp,
   фактичний provider, status і локальний результат; не логувати code/token/email.

## Межа доказу

Локально перевірено fail-closed routing і те, що gateway не робить upstream-запит/не отримує
токен. Це **не** доводить live Google login: provider configuration, Google redirect callback,
provider-specific initiation, реальна сесія та приймання користувачем ще відсутні.

## Джерело

Neon документує кастомну кнопку через `app.signInWithOAuth('google')`; Neon Auth використовує
managed Stack Auth. Офіційна інструкція: https://neon.com/docs/auth/guides/setup-oauth
