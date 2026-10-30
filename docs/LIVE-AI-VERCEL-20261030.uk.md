# Live AI на Vercel preview — 30.10.2026

Власник ключа — **Андрій**: створює окремий OpenRouter key скриптом, який дає Claude,
з `limit: 3`, `limit_reset: daily`. Claude додає його як `OPENROUTER_API_KEY` у Vercel
для **production + preview** та виконує deployment. Інших секретів, бази даних чи
Cloudflare-кабінету для цього маршруту не потрібно.

Лінія: `C:/sw/synera-liveai`, `claude/synera-liveai-vercel-20261030`.
База: `2f8bc71a95118b28d34ecb618ebe24701c04e953`.
Це локальна реалізація та перевірка; ключ не створювався, deployment і платний smoke не виконувалися.

## Що реалізовано

| Вимога | Реалізація й перевірка |
|---|---|
| V1 | `vercel/api/ai/persona-reply.js` → Node handler у `vercel/live-ai.mjs`. Повторно використані Worker validation, `personaPrompt`, fictional `BOT_PROFILES`, ops-log masking і перевірка ліміту ключа. Fake fetch перевіряє payload, masking, origin/consent, identity, truncation та cap. |
| V2 | Після GLM — один `typesafe/jev-1.14` через **`POST /api/alpha/decisions`**, не chat completions. `Choice` із рівно `yes/no`; лише валідний `yes` допускає відповідь. `no`, некоректна схема, інша identity або помилка судді дають сценарний fallback. Є fake тести parser та mutation-check вето. |
| V3 | Рівно один structured console log на кожну спробу inference. `GET /api/ai/spend` повертає денний UTC counter, `durable:false`, `scope:"instance"`. У bundle **один** `api/ai/[action].js` обслуговує reply/spend/health і спільний counter одного warm instance. |
| V4 | `tools/preview-bundle.mjs --live-ai` збирає static public assets, server source, єдиний function entry і `vercel.json`. Runtime health приховує switch без ключа. Notice uk/de/en називає OpenRouter, Z.ai GLM 5.3 Flash, TypeSafe Jev 1.14 та непідтверджену країну обробки. |
| V5 | `tools/live-ai-smoke.mjs --execute --origin=...` підтримує Vercel без operator token, зберігаючи Worker-режим із token. Один persona POST, сумарна вартість двох inference calls, ексклюзивний attempt-файл і відмова повторювати generation. Fake smoke перевірений через справжній handler. |

Request body збережено: `{persona, conversation, visitorText, locale}`. Передаються тільки
до восьми попередніх **visitor-typed** повідомлень цієї розмови й нове повідомлення;
картка профілю, локальний журнал та assistant introductions не передаються.
Email, телефони, credentials та URL маскуються в історії, новому повідомленні й результаті.
Формування persona prompt бере чинний контракт конкретного give/need і одного наступного
Demo-кроку; AI не підписує згоду персонажа й не створює реальну зустріч.

Результат містить `{text, model, requestId, costUsd, judged}` плюс `costStatus`, token counts
і, для fallback, `scripted:true`. При `judged:"rejected"` сервер ніколи не повертає GLM-текст,
а клієнт використовує чинний `personaRespond` без AI tag. Missing key:
HTTP 503 `live_ai_not_configured`; health — `liveAiReady:false`, switch приховано.

## Ліміти, суддя та квитанції

- Defaults: `SYNERA_LIVE_AI_MODEL=z-ai/glm-5.3-flash`, `SYNERA_LIVE_AI_DAILY_CAP_USD=3`.
  `SYNERA_LIVE_AI_PROVIDER` необов’язковий, задає `provider.only` лише для GLM.
  Інша модель потребує окремої перевірки notice: зараз вона вимикає readiness.
- GLM: `max_tokens:1000`, `stream:false`, `reasoning:{effort:'low'}` (інтеграція 30.10: OpenRouter відповідає 400 «Reasoning is mandatory for this endpoint» на `enabled:false`; перший smoke на Vercel саме так упав у 503). Попередній текст лінії: reasoning вимкнений, щоб він не витрачав малий
  бюджет видимого повідомлення. Один 20 s deadline охоплює metadata reads і обидва inference calls;
  function max duration — 25 s. Generation не повторюється автоматично.
- Перевіряється `GET /api/v1/key`: daily key limit не більше $3, позитивний remaining.
  Ціни обох моделей беруться з їхніх live `/endpoints`. До GLM резервуються обидва виклики
  за найбільшою ціною відповідних endpoints і консервативною UTF-8 межею входу.
  Цей резерв має поміщатися й у local cap, й у поточний key remaining.
- `usage.cost` має пріоритет; без нього зберігається резерв із `costStatus:"reserved"`,
  який **не є підтвердженою фактичною вартістю**. Ambiguous transport outcome або перевищення
  резерву зупиняє цей instance до наступного UTC дня; автоматичного retry немає.
- Jev отримує замасковану розмову, fictional persona, locale та draft. Rubric вимагає:
  persona/Demo, конкретні give і need, один наступний крок, відсутність реальних обіцянок
  та персональних даних, відповідну мову. Dated identity `typesafe/jev-1.14-YYYYMMDD` допускається.
- Обидва маршрути запитують `data_collection:"deny"`, `zdr:true`, без provider fallback
  і з `max_price`. Реальна доступність такого endpoint потребує owner live smoke.

Log-поля: `{at, requestId, model, promptTokens, completionTokens, costUsd, judged}`,
додатково `costStatus` і `providerRequestId`. GLM log має `judged:"pending"`, фінальний
вердикт є в Jev log з тим самим `requestId`. Тексти, IP, ключ і профіль не журналюються.
Claude збирає `vercel logs`, звіряє provider IDs/costStatus та імпортує витрати у чинний
fleet ledger. Reserved cost не перетворюється на actual cost без reconciliation.

**Жорстка стеля — dedicated OpenRouter key, не цей counter.** Різні warm instances,
cold start і restart мають окремі counter; GET spend не є глобальною бухгалтерією.
Retention Vercel logs залежить від налаштувань проєкту; ця лінія його не змінює.

## Передача Claude

```powershell
node tools/preview-bundle.mjs --live-ai --out=tmp/preview-live-ai-vercel-20261030
```

Цей output уже побудовано локально. Повторне складання в ту саму непорожню теку
навмисно відхиляється: для нового output вибрати новий `--out=tmp/...`.

Структура deployment root:

```text
public/                    # dist-real, config.json з liveAiReady:true
api/ai/[action].js          # єдина Vercel Function
vercel/                    # Node handler, ESM package і source entry
neon/live-ai.mjs            # спільний validation/prompt/masking
web_launch/                # лише server dependency closure, поза public
package.json               # ESM, Node 22, без нових dependencies
vercel.json                # outputDirectory=public, function duration, no-store
```

Static `_headers` перенесено також у Vercel headers; `/api/*` і `/config.json` — no-store.
Без `--live-ai` результат — побайтна копія `dist-real`, без функцій і без зміни config.
Пакувальник дозволяє тільки відомі public filenames, відхиляє чужі файли, directories
і symlinks у static input, обмежує output поточним worktree `tmp/`.
Нових public модулів не додано; SW cache names не змінено.

Після додавання ключа й deployment **Claude**, один раз:

```powershell
node tools/live-ai-smoke.mjs --execute --origin=https://synera-phone-preview.vercel.app --receipt=tmp/live-ai-vercel-owner-smoke.json
```

Smoke не потребує `SYNERA_OPERATOR_TOKEN` для цього Vercel bundle. Один persona POST
означає **два платні виклики**: GLM і Jev. Receipt містить total cost, verdict, request ID
та input/output hashes. Другий запуск із тим самим receipt відхиляється; при timeout
спершу зібрати existing logs/receipts, не видаляти attempt-файл і не обходити його новим ім’ям.

NEXT для власника, 5–15 хв: додати dedicated key у production + preview, розгорнути
цей bundle штатним Claude Vercel CLI шляхом, виконати один smoke й забрати дві log-квитанції.

## Локальне приймання

- Фінальний main Node + lane/tools/PWA/i18n: **896 passed, 1 штатний PostgreSQL skip**
  (`tmp/live-ai-vercel-final-node.txt`). Попередні два дефекти виправлені без послаблення тестів:
  table coverage нового privacy-тексту та відсутній у sparse checkout tracked `config/`.
- До зміни client обидва нові browser regressions були червоні; після — зелені:
  runtime missing key ховає switch; Jev reject не показує AI текст/tag.
- Mutation: bypass Jev veto → rejection oracle падає; original source незмінний
  (`tmp/live-ai-vercel-mutation-summary.txt`).
- Решта результатів, screenshots та точні evidence hashes — у локальному evidence-каталозі
  цієї лінії; фінальний підсумок перевірок записується у `DONE.md` після завершення.

Межі: fake fetch доводить контракти й deterministic guards, не художню/мовну якість Jev,
live ZDR routing, billing або розгорнутий preview. Chromium phone emulation не є фізичним
iPhone/Safari чи Pixel. Без owner deployment/live smoke жива робота лишається непідтвердженою.

## Першоджерела

- [OpenRouter Jev guide](https://openrouter.ai/docs/guides/community/jev): окремий Decisions API,
  structured decisions, та сама OpenRouter authentication/billing.
- [Decisions response schema](https://openrouter.ai/docs/guides/community/jev-tutorial):
  `answers`, dated model identity, `usage.input_tokens`, `output_tokens`, `cost`.
- [Provider routing](https://openrouter.ai/docs/guides/routing/provider-selection): privacy,
  `only`, `max_price`, fallback policy.
- [Reasoning/max_tokens](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens):
  reasoning також витрачає output budget.
- [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json) і
  [Node runtime](https://vercel.com/docs/functions/runtimes/node-js): root `api`, functions,
  output directory та headers.

Models used: none (provider calls=0, USD=$0.00).
