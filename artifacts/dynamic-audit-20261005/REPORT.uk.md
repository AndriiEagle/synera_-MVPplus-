# Synera — повторний аудит динамічного досвіду, 05.10.2026

**Висновок:** локальний шлях має зрозумілу логіку й контроль учасників, але ще не є цілісним публічним продуктом. Критичний наступний доказ — дві живі людини на Android. Прикрашання не замінює цей крок.

Код `f01cdf1ed11896667736409525a363415e0dd94a`, гілка `codex/synera-product-20261002`. Current збережений початковим; Atelier і спокійний рух добровільні. Чужий `journey-ui.mjs` не змінений: SHA256 `68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b`.

## Прийнята доробка

**Інваріант:** читання незмінної видимої історії не знищує текстове виділення користувача й не надсилає його чернетку. Новий/змінений текст, автор і час продовжують відображатися; вихід прибирає приватну історію.

До правки реальний Chromium повернув порожнє виділення після refresh. Після вузької правки `renderTranscript` незмінний видимий текст лишається на місці. Порівнюються всі видимі повідомлення, автори й час; перевірка не зводиться до кількості. Додаткові копії приватної історії не зберігаються. Період polling, права, форми, CSS, API та SQL не змінені. **При новій/зміненій історії повне перемальовування ще можливе; збереження позиції в цьому випадку не заявляємо.**

Два скінченні self-review: фактичний diff перевірено на межу одного renderer; потім mutation прибрала guard у served copy й знову знищила виділення. Exact comparison доводить незмінність решти controller. Продуктові правки після приймання зупинені.

## Кроки користувача і здоров'я досвіду

Почуття тут — цілі дизайну, не вимірювання емоцій чи гормонів. Висновки з екранів — експертна оцінка; автоматична доступність не є повним WCAG-прийманням.

| № | Крок | Свіжий стан / тертя | Відчуття, якого прагнемо |
|---|---|---|---|
| 1 | Публічний перший екран | Чітка головна дія й видима позначка demo; не обіцяє реального співрозмовника | «Розумію користь і знаю, що пробую» |
| 2 | Get / установлення | IAB click не завантажив сторінку, ERR_FAILED; HTTP-перевірка дала 200. Причина браузерного збою невідома. Physical install не прийнятий | «Почати просто; бачу, що встановлюю» |
| 3 | Люди / вибір | Локальний список показує Give–Take й одну дію; використані тестові акаунти. Жива карта в цьому проході не приймалася | «Розумію взаємну користь, можу вибрати» |
| 4 | Спільні умови | Обидві згоди незалежні; form/review довгі. Екран після власної згоди може ще показувати старий статус партнера до refresh | «Ми однаково розуміємо внесок і результат» |
| 5 | Запрошення / очікування | Accepted invitation перед чатом перевірено. До чату відповідь партнера потребує «Оновити»; кнопка — реальний контроль, але додаткове тертя | «Знаю, хто має зробити наступний крок» |
| 6 | Чат / динаміка | Незмінні ручні й фонові reads зберігають виділення/чернетку. Зміни відображаються; відмови доставки чесні. Manual resend може дублювати запис | «Думка не губиться, читання не переривається» |
| 7 | Результат / спір / приймання | Подання, перевірка, спір і дві receiver acceptances пройшли. Людина не приймає власний внесок за іншу | «Мою роботу видно; можу чесно погодитись чи ні» |
| 8 | Current / Atelier / спокійний рух | Перемикання зворотне, reduced motion, Axe=0 та overflow=0 у перевірених станах. Художня якість і зручність для втомлених людей не виміряні | «Стримано, читабельно, контрольовано» |
| 9 | Архів / поширення / новий цикл | Незмінені архів/чернетки мають попереднє локальне приймання; цей прохід не є новою перевіркою експорту/нового циклу або живого постингу | «Маю опору й хочу повернутися за корисним результатом» |

## Свіжі екрани

Усі наведені файли відкриті й візуально перевірені. Публічний екран — Codex IAB; локальні — реальний desktop Chromium 390×844 із synthetic accounts/transport. Це не запис із фізичного телефона. Крок 2 має названий blocker; його успішного screenshot немає.

### 1. Публічний вхід

![Публічна Synera: головна дія й позначка preview](/C:/Users/Andrii/Desktop/synera-premium-pwa-variant/artifacts/dynamic-audit-20261005/01-public-entry.jpg)

### 3. Вибір людини

![Локальний список людей і взаємної користі](/C:/Users/Andrii/Desktop/synera-premium-pwa-variant/artifacts/dynamic-audit-20261005/green/03-local-start.png)

### 4. Умови після власної згоди, до оновлення відповіді партнера

![Огляд умов і власне підтвердження](/C:/Users/Andrii/Desktop/synera-premium-pwa-variant/artifacts/dynamic-audit-20261005/green/04-terms-reviewed.png)

### 5–6. Прийняте запрошення відкриває приватну розмову

![Приватна розмова двох тестових учасників](/C:/Users/Andrii/Desktop/synera-premium-pwa-variant/artifacts/dynamic-audit-20261005/green/05-private-chat.png)

### 6. Виділення й наступна чернетка залишилися після фонового читання

![Незмінне оновлення не руйнує читання](/C:/Users/Andrii/Desktop/synera-premium-pwa-variant/artifacts/dynamic-audit-20261005/green/06-reading-preserved.png)

### 7. Приймання кожною стороною

![Результати: усі прийняті одержувачами](/C:/Users/Andrii/Desktop/synera-premium-pwa-variant/artifacts/dynamic-audit-20261005/outcome/outcome-current-390x844.png)

![Повна панель підтверджень та згорнуті додаткові функції](/C:/Users/Andrii/Desktop/synera-premium-pwa-variant/artifacts/dynamic-audit-20261005/outcome/outcome-confirmed-panel.png)

### 8. Добровільний Atelier і повернення до Current

![Atelier: той самий зміст і критерії приймання](/C:/Users/Andrii/Desktop/synera-premium-pwa-variant/artifacts/dynamic-audit-20261005/outcome/outcome-atelier-390x844.png)

![Current після зворотного перемикання](/C:/Users/Andrii/Desktop/synera-premium-pwa-variant/artifacts/dynamic-audit-20261005/green/07-current-after-atelier.png)

## Докази та межі

[RED](RED.json) → [18 груп чатового Chromium](GREEN.json) → [mutation rejection](MUTATION.json). [Окремі 17 груп outcome flow](outcome/CASE_OUTCOME_BROWSER.json) охопили дві згоди, accepted invitation, retry з тим самим intent, заборону self-accept, історію спору, відкликання й private purge після logout/пізніх reads. Групи перетинаються: це не 35 незалежних тестів. Layout/Axe checks стосуються саме цих synthetic станів.

[Closure](ACCEPTANCE.json) та [незалежний PowerShell readback](INDEPENDENT_READBACK.json): 28 source/image hashes, 96 рядків manifest, 97 public files. Candidate `web_launch/dist-neon-dynamic-audit-20261005`; release SHA256 `b2faaeae1ed075afbb0f5ba7314d9fc547d315ff1cef9930c57690ac51bd643e`; **unpublished**. Worker та всі шари поза renderer збережені. Package використовує committed journey-ui, не чужу робочу правку.

Для відтворення oracle попередній exact-hash generated runner тепер збережений у Git: `artifacts/product-status-20261004/draft-continuity/runner.mjs`. Він використовується в канонічному checkout `C:/Users/Andrii/Desktop/synera-premium-pwa-variant`; fixture imports у цьому історичному runner абсолютні. Доступний Chrome вибраний process-local env, пакети не встановлювалися. Незмінені PG/SQL/full-unit suites не повторювались.

[Публічний readback 05.10](PUBLIC_READBACK.json): презентація/get HTTP200, registration=false; окремий Neon pilot config200/registration=true; новий real-journey HTTP404 на обох. HTTP200 не приймає browser install/login. Публічний сайт і база не змінені; push hold не обходився, heartbeat не поновлювався.

Canonical serious-preflight повернув FileNotFoundError через відсутній D:; повтор не робився. Застосований дозволений bounded local fallback. Local reuse adviser запропонував generic skill-creator без сумісного asset — не використаний; фактично перевикористаний exact-hash Chromium oracle. Product Design context file відсутній. Дані з пам'яті застосовані для збереження попередніх меж, не як свіжий UX-доказ.

## Пріоритети

1. **Живий двосторонній цикл:** target/schema/recovery review → точне погодження міграцій/rollout → дві людини на physical Android. Це сильніше за додатковий декор.
2. **Очікування партнера:** окремо додати актуальний read-only status до чату, без автоматичного погодження/відправлення. Зараз чесно показувати потребу в refresh.
3. **Умови й основна дія:** поступове заповнення як добровільний режим, збережений повний огляд. Не прибирати потрібні домовленості заради короткого екрана.

Живі Google SDK/voice/video/OAuth/payment, п'ять режимів довіри, психологічний matcher, радари й anti-abuse reputation не переведені у «готово». [Повна таблиця 27 систем і 15 UX-етапів](../product-status-20261004/STATUS.uk.md) зберігає свої межі; цей аудит прийняв лише зазначену доробку.

**NEXT — 15–20 хв:** read-only звірка target/schema/recovery за [точним rollout review](../product-status-20261004/ROLLOUT_REVIEW.uk.md). Production SQL/deployment та живі account/phone кроки мають окреме погодження й приймання.

Models used: none (provider calls=0, USD=$0.00). Public HTTP reads виконані; subscription savings та почуття користувачів не виміряні.
