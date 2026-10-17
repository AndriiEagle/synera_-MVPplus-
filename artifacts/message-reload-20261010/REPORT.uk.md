# Synera — прийняте відновлення ручного повтору повідомлення

## Результат і кандидат

Код `d29bee34cf57cf805ccb6ac4ff6d66946a5a06ee`, 10.10.2026.
Після committed POST із загубленою відповіддю або невдалим readback явний повтор
того самого обрізаного тексту після reload тієї самої вкладки використовує той
самий UUID. Сам reload нічого не надсилає. Після підтвердженого send/readback
наступне свідоме надсилання того самого тексту має новий UUID.

**Candidate:** `web_launch/dist-neon-message-reload-20261010`, 98 public files /
97 manifest rows, release SHA-256
**`7b2d6f0e0c635aeef7322ae256d971890c2c5cbee7fcf4ec42234bc6d3acfa71`**.
[BUILD](BUILD.json) використовує точні Git-блоби `d29bee3`, виключає чужий dirty
`journey-ui.mjs`. [READBACK](READBACK.json) звіряє всі manifest hashes: проти pass3
змінені лише `real-journey-client.mjs` і `legal.html`. Решта 95 assets, включно
з Worker/CSS/перекладами, збігаються. [144 мовні кроки і 8 mobile profiles](../opus-pass3-webkit-20261010/REPORT.uk.md)
збережені як відповідний proof незміненої поверхні; client delta перевірений окремо.
Candidate unpublished; старі пакети та bundle збережені.

## Семантичне приймання

| Перевірка | Результат |
|---|---|
| [WebKit RED до виправлення](browser-red/RESULT.json) | Reload + явний повтор: 2 rows замість 1 |
| [Worker RED](RED-node.tap) | Reload oracle впав на попередньому коді |
| [Review RED](REVIEW-RED-node.tap) | Пізній digest після logout і паралельні перші unknown POST відтворили дефекти |
| [Worker final](REVIEW-GREEN-node.tap) | 16/16 PASS, включно з denied/corrupt storage, actor/meeting/text, sanitization і metadata churn |
| [Незалежний affected gate](FINAL-node.tap) | 40/40 PASS: retry/client, journey, material/translation/hash, message RPC |
| [WebKit 26.6](browser-webkit/RESULT.json) | 3/3: втрачена POST-відповідь, readback, logout; 8 явних POST / 6 очікуваних rows |
| [Chrome 154](browser-chrome/RESULT.json) | Ті самі 3/3; no auto-send, наступна явна дія збережена, HTML у тексті не виконується |
| [Browser mutation](browser-mutation/RESULT.json) | Вимкнений persisted lookup повернув 2 rows; runner відхилив результат |
| [Actor/epoch mutation](REVIEW-MUTATION-node.tap) | Вилучений guard відновив metadata після logout; guard повернуто |

Це synthetic HTTP fixtures через чинний gateway/клієнт і desktop engines,
не SQL/RLS, справжні JWT, реальні листи або телефони. SQL/RPC не змінено.
[PG18.4 receipt](../opus-review-20261009/pass3/PG18_SQL_ACCEPTANCE.json) має ті самі
12 звірених source hashes; production PG18.6 тут не протестована.

## Приватність і межі

`sessionStorage` містить лише version/salt/actor/meeting/fingerprint/intent UUID,
без тексту, профілю, credentials або outbox. Salted hash — не шифрування чи
анонімізація: actor/meeting IDs залишаються метаданими. Storage не є авторитетом;
серверні auth/consent/meeting/ack guards збережені.

Ключ очищується після ack/readback, logout, підтвердженої втрати сеансу або зміни
account. Мережева помилка restore не є logout. Actor/epoch перевіряються після
кожного async metadata-кроку; паралельні записи з'єднуються з актуальним станом.
Після трьох невдалих узгоджень змінного metadata — transient 503 **до POST**,
без нескінченного циклу; наступний ручний retry дозволений.

Denied/corrupt storage лишає RAM-only retry; cleanup best-effort за browser denial.
Текст після reload не відновлюється — людина сама вводить точний явний повтор.
Змінений текст — інший намір. Durable outbox/cross-tab/cross-device не прийняті.
Без `messageIntentsEnabled` лишається legacy lane. Пояснення додано до legal.html;
secrets, production flags, billing та зовнішні дозволи не змінено.

Два скінченні review joins фактичного diff та [WORKER report](WORKER.uk.md) прийняті.
Після 16/16 подальші агентні правки зупинені; root завершила 40/40, два браузери,
mutation і manifest readback. Після приймання додаткового polishing не проводилося.

Raw RED/mutation TAP збережено дослівно, включно з пробілами на порожніх
діагностичних рядках. Для proof commit whitespace gate виключає лише ці `.tap`;
вихідний код і решта документів проходять звичайний `git diff --check`.

GitHub readback досі `6724682`. Попередній push відхилений до запуску:
`approval required by policy, but AskForApproval is set to Never`.
Повтору чи обходу іншим транспортом не було; дозвіл Андрія на push уже є.

**NEXT, 15 хвилин:** пройти [точний rollout review](../product-status-20261004/ROLLOUT_REVIEW.uk.md)
нового hash: target/schema/recovery/вартість і scope activation. Після exact
approval — live rollout і один цикл двох погоджених людей. [Карта систем,
досвід людини й шість етапів запуску](../opus-pass3-webkit-20261010/REPORT.uk.md)
відділяє локальне приймання від живого продукту.

Models used: none (external provider calls=0, USD=$0.00). Внутрішні Codex agents
описані у pass3 report; їхню квоту й економію підписки не вимірювали.
