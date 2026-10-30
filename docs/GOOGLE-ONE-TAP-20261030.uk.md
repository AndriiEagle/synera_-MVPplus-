# Google-вхід Synera: 10 хвилин власника

Ціль: `https://synera-pilot.pages.dev`. Це інструкція для власника доступів, а не
звіт про виконаний деплой. Час — орієнтир після приймання Neon schema/admission/RLS,
backup/restore, юридичних сторінок та чинного deploy kit. Новий підтверджений email
має отримувати власний профіль без ручного внесення в SQL-список: один прапорець
`SYNERA_OPEN_REGISTRATION` цього не забезпечує. Дивись також
[попередні ворота відкритої реєстрації](OPEN-REGISTRATION-20261029.uk.md).

## 0–3 хв: Google Cloud → Google Auth Platform → Clients

Обери OAuth client типу **Web application**, який належить Synera.

| Поле | Точне значення |
|---|---|
| Authorized JavaScript origins | `https://synera-pilot.pages.dev` — без шляху |
| Authorized redirect URIs | **Точний Provider callback / Redirect URL, скопійований із Neon Auth → Google provider** |
| Client ID | Скопіюй повний ID `….apps.googleusercontent.com`; той самий ID потрібен Neon і Pages |

Neon provider callback є адресою на домені Neon. Його конкретне значення для
живої production-гілки тут **не підтверджене**; не підставляй демонстраційний
endpoint і не вгадуй URL. Google звіряє фактичний `redirect_uri` точно.
`https://synera-pilot.pages.dev/api/neon/oauth/google/callback` — повернення **в Synera
після Neon**, а не заміна callback провайдера у Google Cloud. Це уточнює старий
приклад у документі OPEN-REGISTRATION.

Перевір Branding/Audience: Synera, правильні адреси сайту й повідомлення про дані;
для Google-app у Testing потрібні дозволені test users. Публічна аудиторія та
можлива перевірка Google — окрема передумова, її не можна гарантувати за 10 хв.

Джерело: [Google OAuth для web server](https://developers.google.com/identity/protocols/oauth2/web-server).

## 3–5 хв: Neon Auth → Google provider

На правильному production branch увімкни Google provider. Встав той самий client ID
і client secret **лише в Neon**. Secret не потрапляє до Git, Pages public vars чи
клієнтського bundle. Скопіюй показаний Neon callback у Google Cloud і збережи.
Дозволь trusted origin `https://synera-pilot.pages.dev` та повернення
`https://synera-pilot.pages.dev/api/neon/oauth/google/callback` у налаштуваннях Neon.
Обробник помилок застосунку: `https://synera-pilot.pages.dev/?signin=google-error`.

Додаток використовує наявний Neon social flow, без нового Google SDK чи popup:
`/api/neon/oauth/google/start` → Neon `/sign-in/social/init?token=…` → Google →
**Neon provider callback** → **Synera callback**. Challenge і verifier перевіряє
існуючий серверний адаптер; cookie сесії лишається HttpOnly.

## 5–8 хв: Cloudflare Pages → synera-pilot → Settings

Збережи попередній deployment ID та значення середовища для відкату. Використай
переглянутий свіжий kit цієї версії; старий r8 не містить новий маршрут.

1. Звір `SYNERA_SITE_URL=https://synera-pilot.pages.dev`, чинні
   `SYNERA_NEON_AUTH_URL` і `SYNERA_NEON_DATA_URL` для однієї production-бази.
   `SYNERA_GOOGLE_CLIENT_ID=<точний client ID із Google Cloud>` — **публічна**
   змінна для перевірки smoke, не secret.
2. Після schema/admission/backup перевірок: `SYNERA_PILOT_READY=true`.
3. Після перевірки поштового входу: `SYNERA_REGISTRATION_ENABLED=true`.
4. Після налаштування Google/Neon: `SYNERA_GOOGLE_OAUTH_READY=true`.
5. Для всіх нових людей потрібен окремо прийнятий admission/RLS і
   `SYNERA_OPEN_REGISTRATION=true`. Для контрольного закритого проходу залиш
   `false` та чинні дозволені адреси. Сам Google READY не відкриває SQL-доступ.
6. Власник публікує новий production deployment з цими vars і звіряє `/release.json`.

Увімкнення — лише точний рядок `true`. `/config.json` має показати `backend=neon`,
`pilotSafetyEnabled=true`, `realPilotEnabled=true`, `registrationEnabled=true`,
`googleOAuthEnabled=true`, `googleOauthReady=true`, точний `googleOAuthInitUrl`
і `googleOAuthClientId`. До цього Google-кнопка не повинна з'являтися.

## 8–10 хв: smoke, потім окремий живий прохід

Із кореня цієї версії репозиторію:

```powershell
node tools/google-signin-smoke.mjs --origin=https://synera-pilot.pages.dev
```

Очікування: `PASS_REDIRECT_ONLY`, `signedIn:false`, точний client ID та фактичний
Neon provider callback. За потреби незалежно закріпи ID аргументом
`--client-id=<ID із Google Cloud>`: він мусить збігатися з public config і redirect.
Smoke виконує лише GET config/start/Neon init, забороняє довільні хости й редиректи,
зупиняється **до запиту сторінки Google**, не входить і не записує згоду/профіль.
Він не друкує state, init token, verifier чи cookie. Закритий прапорець, невідомий
client ID, неправильний клієнт або відсутній redirect дають `HOLD`, exit 1.

Після smoke відкрий установлену PWA на фізичних Android та iPhone: іконка →
«Продовжити з Google» → вибір акаунта → редагована приватна чернетка з ім'ям,
без email у display name. Це **3 натискання до редагування** за одного вибору
акаунта; повторний пароль, 2FA чи додаткові екрани Google можуть додати натискання.
Згода з правилами/повідомленням — окремі порожні прапорці й явне підтвердження;
вона не входить у заяву «до редагованої чернетки». Збереження — ще окрема дія.
Перевір скасування Google → повідомлення й email; повторне відкриття → своя сесія
без натискання; меню → «Вийти» → після reload сесії немає. На спільному пристрої
завжди виходь. Без цього живе приймання та фізичні телефони лишаються HOLD.

## Що має нести новий `tools/pilot-deploy-kit.mjs`

- Свіжий `_worker.js` з `google-oauth.mjs`, GET-start, callback/error redirect,
  сесією з безпечним ім'ям та public config з readiness/client ID.
- Свіжі `index.html`, `app.mjs`, `neon-store.mjs`, `site-shell.css`,
  `index-i18n-table.mjs`, `config.mjs`, `google-sans.ttf` і його `google-sans-OFL.txt`;
  uk/de/en, штатний asset manifest і SW.
  Назви кешів bump-ає інтегратор хвилі один раз.
- Цей runbook, smoke та його тести у source/owner-частині комплекту;
  `google-signin.spec.mjs`, оновлені Google/worker/browser тести й їхні результати.
  Smoke — Node-інструмент, його не треба додавати до публічних web assets.
- Перелік vars із `SYNERA_GOOGLE_CLIENT_ID` та порядком ввімкнення. У старого kit
  Google/Open registration за замовчуванням OFF: цей патч не відкриває їх сам.
- Нові SHA/manifest і зафіксований rollback deployment ID; жодних OAuth secret,
  cookie, приватних адрес, кодів або акаунтів у комплекті. Перед видачею
  згенерований комплект ще потребує інтеграційного приймання.

Відкат: `SYNERA_GOOGLE_OAUTH_READY=false` + deployment прибирає Google-вхід;
email лишається окремим шляхом. `SYNERA_REGISTRATION_ENABLED=false` закриває
нові входи. Відкат не означає видалення provider-акаунтів чи даних.
