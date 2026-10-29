# Двоє людей: закритий пілот, до 30 хв після підготовки

Комплект 354287da3453d76ad954bc9aac3d881c11aacf02. Завантажувати лише `synera-pilot-354287da3453d76ad954bc9aac3d881c11aacf02.zip`. Нічого тут не запускає cloud API.
Час нижче — план, не виміряна тривалість. SQL і реальні телефони власник ще не прийняв.

## Перед стартом (обов'язково; якщо бракує — HOLD)

- Власник має доступ до двох кабінетів, дві різні email-адреси й два фізичні телефони.
- Neon: project **quiet-credit-94155104**, branch **production**, database **neondb**, AWS **us-east-2 (Ohio, США)**. Не створюй новий project.
- Збережи ID/URL останнього справного production deployment r8 і всі попередні environment values ПРИВАТНО. Не вставляй їх у git/чат.
- Neon: перевір наявну точку відновлення/backup і restore у disposable branch. Кнопки/доступність recovery залежать від акаунта; якщо restore не перевірений — зупинись. Це підготовка, не обіцянка 30 хв з нуля.
- Прочитай `env.md`, `changes-since-r8.uk.md`, `rollback.md`. До SQL закрий нові входи: SYNERA_REGISTRATION_ENABLED=false, Google/open registration=false.

## Власник: порядок 0–30 хв

1. **0–3 хв — інспекція.** Neon console → project synera → Branch production → **SQL Editor** → database neondb, owner role → встав увесь `00-inspect.sql` → Run. Один рядок на очікуваний об'єкт; present=true/false. Відсутні нові об'єкти допустимі, відсутні базові r8 або часткова міграція — HOLD. Збережи результат локально. Не запускай базовий schema.proposal.sql вдруге.
2. **3–7 хв — SQL.** Звір локальний receipt ../postgres-acceptance.json зі звітом лінії та manifest.json: source_commit і SHA 10-migrate/11-acceptance мають збігатися. Fixture suites вже перевірені локально з identity shim; на production їх не запускай. Якщо є підготовлений disposable clone, спершу виконай на ньому лише 10-migrate.sql. Якщо backup/restore ще не перевірені, відклади 30-хв вікно. Потім у production SQL Editor виконай увесь `10-migrate.sql`. Успіх: COMMIT і всі фінальні present=true; повторний запуск пропускає повні міграції. Помилка означає STOP: не запускай хвіст файлу окремо, виконай ROLLBACK за потреби.
3. **7–9 хв — один партнер.** Відкрий `20-add-member.sql`, заміни <PARTNER_EMAIL> лише локально на адресу партнера малими літерами, виконай увесь файл у production. Успіх: admitted=true. Власник уже має свій допуск r8; якщо ні, HOLD для окремого owner review. Не вставляй вигаданих Demo-людей.
4. **9–12 хв — environment.** Cloudflare dashboard → **Workers & Pages → synera-pilot → Settings → Variables and Secrets / Environment variables → Production**. Запиши попередні значення; вистав `env.md`. Список SYNERA_PILOT_EMAILS = попередня адреса власника + адреса партнера. URL Neon збережи чинними. Поки SYNERA_REGISTRATION_ENABLED=false. Google/open registration/GPS/rooms/erasure=false. Нові значення застосуються до НОВОГО deployment; вони не перемикають уже активний Worker.
5. **12–15 хв — ZIP.** Pages → **synera-pilot → Deployments → Create a new deployment / Upload → Production** → перетягни `synera-pilot-354287da3453d76ad954bc9aac3d881c11aacf02.zip` → Save and Deploy. Не Create application, не новий project. ZIP має _worker.js та index.html у корені; не завантажуй усю теку kit. Успіх: новий production deployment Success. Зафіксуй його ID. Dashboard підтримує _worker.js, але не компілює functions/.
6. **15–17 хв — read-only перевірка.** Відкрий https://synera-pilot.pages.dev/release.json у приватній вкладці: built_at=час commit (див. manifest.json), звір _worker.js sha256 з manifest.json (це відрізняє старий Worker). https://synera-pilot.pages.dev/config.json: backend=neon, realPilotEnabled=true, realJourneyEnabled=true, messageIntentsEnabled=true, caseOutcomesEnabled=true, meetingAddressEnabled=true, registrationEnabled=false; googleOAuthEnabled/liveLocationEnabled/groupRoomsEnabled/profileErasureEnabled=false. Перевір health у DevTools Console НА цьому origin готовим GET нижче. Має бути HTTP 200, backend=neon, authGateway=reachable. Це перевіряє Auth gateway, не RLS/схему.
7. **17–19 хв — відкрити вхід лише двом.** Приймай це лише після SQL/config/health перевірок; телефони A/B — наступний живий gate. Settings → Environment variables: SYNERA_REGISTRATION_ENABLED=true. Повторно Upload того самого ZIP у Production (env застосовується при deployment). /config.json тепер registrationEnabled=true; інші очікування кроку 6 зберігаються. Не підміняй SYNERA_OPEN_REGISTRATION.
8. **19–22 хв — телефони A і B.** На кожному Safari/iPhone або Chrome/Android відкрий https://synera-pilot.pages.dev/; закрий стару PWA/вкладку, онови, за потреби очисти дані саме цього сайту (локальні чернетки спершу збережи). Звір новий темний із золотим дизайн. Прочитай правила/дані, постав обидві згоди, введи СВОЮ адресу, отримай новий 6-значний код. Код не пересилай іншій людині. Після входу збережи власний профіль, онови сторінку: має повернутися саме твій профіль. Для видимості партнера кожен окремо свідомо вмикає discoverable; GPS не потрібен. Не використовуй Demo для реального шляху.
9. **22–27 хв — спільний шлях.** Відкрий https://synera-pilot.pages.dev/real-journey.html (Pages може прибрати .html). Вибери видимий профіль партнера. Спочатку узгодьте конкретні умови й створіть справу; кожна людина підтверджує ТУ САМУ версію окремо зі свого телефона. Після першої згоди друга лишається очікуваною. Потім надішли запрошення на зустріч, одержувач приймає на B; A не може прийняти за B. Порядок даних у чинному SQL: умови → дві згоди → запрошення/зустріч (не навпаки). Адреса, якщо потрібна, має окрему пропозицію/згоду; для швидкого проходу оберіть онлайн.
10. **27–30 хв — результат і межі.** Виконайте малий справжній результат, наприклад взаємний огляд одного екрана. Автор додає результат, лише одержувач перевіряє й приймає його; автор не приймає власну роботу. Онови обидва телефони: умови, незалежні згоди, зустріч і прийнятий результат збереглися. Вийди на одному телефоні: інший лишається своїм користувачем. Без входу приватний шлях недоступний; чужий прихований профіль/повідомлення не читаються. До цих перевірок статус LIVE_TWO_PERSON=HOLD.

Health GET (не вставляй коди/токени; пряме відкриття health у адресному рядку дає 403 без службового заголовка):

```js
const r = await fetch('/api/neon/health', {headers:{'X-Synera-Client':'1'}});
console.log(r.status, await r.json());
```

## ROLLBACK — ціль 2 хв для Worker

1. Pages → synera-pilot → Deployments → All deployments → **…** біля ЗБЕРЕЖЕНОГО попереднього production ID → **Rollback to this deployment** → Confirm. Preview не є rollback target.
2. /release.json та /config.json мають збігатися зі збереженим r8. Вийди з нової PWA/онови дані сайту на обох телефонах; service worker старої вкладки може показувати кеш.
3. Поверни збережені environment values для майбутніх deployment. Rollback deployment не означає видалення SQL/акаунтів. Для видалення саме нового admission: `21-remove-member.sql` і прибери тільки партнера із SYNERA_PILOT_EMAILS у НАСТУПНОМУ deployment. Старий r8 не має цього партнера у своєму env.
4. **Не DROP нові таблиці після використання.** Additive SQL лишається; raw down statements у `rollback.md` — лише для disposable clone або restore в перевірену точку за окремим рішенням власника. Відкат даних не має доведеної межі 2 хв.

Джерела UI/лімітів: [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [Cloudflare Rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/). Новий suite/receipt не є доказом живого проходу чи часу власника.
