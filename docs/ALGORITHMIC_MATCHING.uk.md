# Algorithmic matching у Synera

## Статус

`VERIFIED_LOCAL` для browser-модуля. Це локальний детермінований інструмент пошуку заявлених точок співпраці між двома профілями. Він не оцінює людину, довіру, компетентність, імовірність успіху, дохід або ціну послуги.

## Де працює

Єдиний comparator лишається в `web_launch/matching.mjs`. Функція `compareProfiles` виконує чинні Synera-gates: різні профілі, взаємна згода на порівняння, заповненість, актуальність, мови, формат, доступність, географія та конфіденційність. Лише після цього `evaluateAlgorithmicMatch` обчислює:

- покриття потреб A пропозиціями B та навпаки;
- harmonic mutual score і асиметрію двох напрямків;
- точні збіги tag-ів, до трьох тем для розмови та перші безпечні кроки;
- `provider_calls: 0` і `expected_value_usd: null`.

`profile-brief.mjs` є єдиним bridge для реальних Synera-профілів. До matcher-а потрапляють лише нормалізовані tags та умови; display name, email, контакти, вільний текст, щоденники, інструкції, підписка й billing не є частиною рішення або algorithmic result.

## Джерело й межі

Адаптація походить з локально переданого `algorithmic-machines-reference-v1` (ZIP SHA-256: `14158D7D431B4ABA0A6364D249067B011F2687488456A8F99A2C25FE50480A46`). У Synera перенесено лише pure matching semantics у наявний JS comparator, бо PWA виконується в браузері, а не в Python host.

`decide_intervention`, `plan_replications`, `render_worker_candidate` і `validate_factory_template` не підключені до Synera runtime. Для них у PWA немає дозволеного scheduler, durable state/CAS, worker queue чи host acceptance. Вони лишаються кандидатами для окремого контрольованого design review; цей модуль не спостерігає людину, не надсилає повідомлень і не запускає microagents.

## Локальна перевірка

```text
node --test web_launch/matching.test.mjs web_launch/real-pilot.test.mjs web_launch/business-case.test.mjs
node web_launch/build.mjs --offline
```

Static build створює тільки `dist-real-offline` і нічого не публікує. Реальні Auth, база даних, дві реальні згоди та production acceptance залишаються окремими gates.
