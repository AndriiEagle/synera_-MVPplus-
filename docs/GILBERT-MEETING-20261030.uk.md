# Зустріч із Gilbert · 30.10.2026

**NEEDS_REVIEW: умовний допуск лише локального демо. Реальні акаунти — NO-GO.**
Джерела: REPORT_C §0, §4.4–4.5, §5–6; REPORT_A §6,8–12. Вхідні SHA в
`integrate-20261029/inputs.json`; розбіжності з PLAN — `LEGAL-RECONCILIATION.uk.md`.
Правові тексти — чернетки до юриста; цей файл не запускає жодного зовнішнього процесу.

## Три хвилини: показ і пояснення німецькою

1. На власному телефоні партнера відкрити PWA → показати постійне DEMO й десять вигаданих людей.
2. До введення показати повідомлення про локальні чернетки; запропонувати вигадані дані.
3. Показати коротку сценарну відповідь, журнал, прямий JSON і центр даних.
4. Відкрити DE notice та паперову участь; не збирати підпис до заповнення реквізитів і строків.
5. Наприкінці запропонувати «Очистити дані на цьому телефоні». Не натискати підтвердження за партнера.

Нижче збережено **саме німецький текст REPORT_C §5.2**, це сценарій виступу, не юридичний висновок:

Vielen Dank, dass Sie sich heute Zeit nehmen.

Ich zeige Ihnen eine frühe Demo von Synera. Die zehn Personen in dieser Demo sind erfunden. Ihre Antworten sind vorbereitet. Sie sprechen heute also nicht mit echten Nutzern.

Wir erstellen heute kein Benutzerkonto. Wenn Sie etwas eingeben, kann der Browser diese Eingaben auf Ihrem Gerät speichern. Diese Demo-Eingaben werden nicht an unsere Datenbank gesendet. Beim Laden der Website können aber technische Daten beim Hosting-Anbieter anfallen.

Hier ist unser Datenschutzbereich. Sie können sehen, welche Daten lokal gespeichert werden. Sie können diese Daten herunterladen und löschen, sofern die Funktionen in dieser Version verfügbar sind.

Wir fragen nicht nach Ihrem GPS-Standort. Die Live-KI ist ausgeschaltet. Externe Karten öffnen wir nur, wenn Sie das möchten.

Sie können den Test jederzeit beenden. Wenn Sie uns Feedback geben möchten, ist das freiwillig. Wir speichern Ihre Kontaktdaten nicht ohne einen klar erklärten Zweck.

Ist das für Sie verständlich? Gibt es etwas, das Sie ändern würden?

## Що не обіцяти

| Не казати | Точне пояснення |
|---|---|
| «Нічого не йде в інтернет» | Demo-тексти локальні, але хостинг отримує технічні запити/IP. |
| «Справжні люди/AI відповідають» | Персонажі вигадані, відповіді за сценарієм; live AI OFF. |
| «Усе лише у Швейцарії / в ЄС» | Ohio — зі старого плану; поточний регіон і доступ не підтверджені. |
| «DPF/DPA вже вирішені» | Заява постачальника не є доказом договору конкретного акаунта або active Swiss-U.S. scope. |
| «Стерто все назавжди» | Кнопка стирає браузерні дані Synera; сервер, Auth, cookies, копії, downloads і чужі вкладки мають інший scope. |
| «72 години можна чекати» | Швейцарський high-risk інцидент повідомляється якнайшвидше. |
| «Це перевірена законом згода / гарантований договір» | Паперова участь і нові документи — EXPERT_REQUIRED; два підтвердження не доводять правової кваліфікації угоди. |
| «GDPR ніколи не застосовується» | Залежить від фактичної діяльності й аудиторії. |

Джерела й статуси: [DSG Art.9,16–24,25–32](https://www.fedlex.admin.ch/eli/cc/2022/491/de)
**NEEDS_REVIEW**; [EDÖB DataBreach](https://www.edoeb.admin.ch/de/databreach)
**VERIFIED** для тригера/каналу, не для конкретного інциденту;
[GDPR Art.3,27](https://eur-lex.europa.eu/eli/reg/2016/679/oj) **EXPERT_REQUIRED** щодо Synera;
[DPF registry](https://www.dataprivacyframework.gov/list) **NEEDS_REVIEW**;
[SECO](https://www.seco.admin.ch/de/onlinehandel) **VERIFIED** загальна вимога ідентифікації,
**EXPERT_REQUIRED** застосування до цієї моделі.

## GO / NO-GO

| Сценарій | Допуск | Власник рішення / докази |
|---|---|---|
| Демо з вигаданими даними без входу | Умовний GO, NEEDS_REVIEW | Оператор переглядає поведінку I1–I6, заповнює паперові поля, підтверджує реальний HTTPS host і власний телефон. Chromium емуляція не дорівнює Safari/фізичному телефону. |
| Добровільний відгук / контакт | HOLD до поясненого scope і строку | Оператор: окремий добровільний вибір, визначене місце зберігання й дата видалення. Відмова не закриває перегляд демо. |
| Реальний акаунт навіть одного партнера | NO-GO | Усі gates таблиці нижче + юридичний/технічний review. |
| Публічна реєстрація, точна локація, live AI | NO-GO | Окремі deployment, audience, transfer, DPIA/AI acceptance gates. |

Це продуктова рекомендація REPORT_C §0, **NEEDS_REVIEW**, не сертифікація законності.
[DSG Art.7,19](https://www.fedlex.admin.ch/eli/cc/2022/491/de).

## До будь-якого реального акаунта: хто, де, як і строк

Усі дії нижче — **не виконані цією лінією**. Вони не є дозволом на production/зовнішнє повідомлення.

| Крок | Хто | Де / як довести | Коли / як довго зберігати |
|---|---|---|---|
| Прийняти застосовний DPA: Neon/Databricks Postgres + Auth + OTP; Cloudflare CDN/Workers/KV; інші фактичні процесори | Оператор акаунтів, юрист перевіряє | Vendor account/договір; точне юрлицо, версія, дата, scope, підпис/acceptance receipt у закритому сховищі оператора, не public git | До першого real account; доказ протягом договору й обґрунтованого строку після нього [ВИЗНАЧИТИ З ЮРИСТОМ], не вигадані роки |
| Опублікувати звірене повідомлення й Impressum зі своїми ім’ям, законною адресою та чинним email; Terms; нова версія згоди | Оператор + юрист; maintainer лише після дозволу | `/legal.html` DE/UK/EN; кожне placeholder заповнене, реальні країни/послуги/строки, readback опублікованого SHA | До збору email/реальних даних; чинна версія доступна весь час, попередні — за документованим строком |
| Підписана участь для цього запланованого пілоту, окремий добровільний feedback/contact вибір | Учасник сам + оператор | Роздрукована `/pilot-consent.html`; заповнені оператор, місце, дата, feedback deletion date, consent retention; паперовий оригінал у захищеній шафі/закритий скан із обмеженим доступом | До початку погодженої real-участі; [КОНКРЕТНИЙ СТРОК / КРИТЕРІЙ] вписати до підпису. Це gate даного пілоту, не універсальний закон про обов’язковий підпис кожного користувача |
| Перевірити ручне повне видалення, заблокувати стару сесію й доступ | Maintainer у disposable test, оператор приймає, юрист оцінює винятки | Application tables, `neon_auth`, sessions/OAuth, API/JWT, branches/snapshots/PITR; provider procedure/receipt; повторне стирання після restore. G7 pending не є виконанням | До real account; відповідати на DSAR як правило за 30 днів, виняток/продовження пояснити в цей строк; provider backup строк отримати письмово |
| Підтвердити підставу кожного передавання, включно з віддаленим доступом | Оператор + юрист | Registry Active, exact entity, Swiss-U.S. DPF/Non-HR/services; або застосовні SCC зі Swiss adaptations / інша перевірена підстава. DPA не замінюється DPF | До передавання; зберегти dated proof, перевіряти при зміні постачальника, scope чи статусу |
| Заповнити retention matrix і DPIA screening/outline; за високого залишкового ризику Art.23 | Оператор + maintainer + юрист | Ops doc, фактична data map, відповіді постачальників, позитивні/негативні SQL/RLS/erase перевірки | До real account; перегляд при зміні AI, локації, аудиторії, масштабу; строк DPIA за DSV Art.14 звіряє юрист |
| Incident owner, канал FDPIC, доступ до мінімальних фактів і rehearsal | Оператор + призначений maintainer | Закритий incident register, портал FDPIC, provider contacts, відпрацьоване tabletop-навчання | До real account; повідомлення при voraussichtlich hohes Risiko — so rasch als möglich; документація/строки за DSV Art.15 окремо |
| Реальний backend і пристрої | Оператор приймає; maintainer виконує тільки з дозволом | Дві реальні особи/JWT, правильні RLS, restore, consent/withdrawal, фізичний Android + iPhone/Safari, стабільний HTTPS; свіжі receipts | До rollout. Прапорці й локальні component tests цього не доводять |

Правові підстави/контракти: **EXPERT_REQUIRED** щодо прийнятності конкретного пілоту,
[DSG Art.9,16–24](https://www.fedlex.admin.ch/eli/cc/2022/491/de),
[Neon Schedule](https://neon.com/platform-terms), [Databricks DPA](https://www.databricks.com/legal/dpa),
[Cloudflare DPA](https://www.cloudflare.com/cloudflare-customer-dpa/),
[DSV Art.14–19](https://www.fedlex.admin.ch/eli/cc/2022/568/de).

## Проста перевірка в кінці зустрічі

Партнер сам пояснює: хто тут вигаданий; що лишається на телефоні; як скачати й стерти.
Якщо відповідь неясна — повернутися до екрану й пояснити, не тиснути згодою.
Після зустрічі оператор вручну виконує лише погоджені feedback/contact строки; фонового збору немає.
