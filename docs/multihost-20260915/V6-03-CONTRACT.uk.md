# V6-03: per-party persistence contract proposal

**DRAFT_FOR_SOURCE_REVIEW.** Це конкретна пропозиція контракту, не виконана V6-03 і не новий endpoint. Вона має бути відображена на чинний store/worker/Data API/canonical SQL після source review. Не додавати RPC, якщо існуючий transactional шлях забезпечує ті самі invariants.

## Дані й операції

Case material: `case_id`, незмінна pair identity, `version`, `terms_hash`, `material`, `expires_at`, `status`. Approval: `case_id`, `party_id`, `approved_version`, `approved_terms_hash`, `approved_at`, `withdrawn_at`. Actor визначається перевіреною server session; supplied actor/party не може розширювати права. `terms_hash` — canonical domain material hash; DB/JS normalization мають збігатися на golden vectors.

| Операція | Запит (логічний, не HTTP route) | Success/readback | Відмова |
|---|---|---|---|
| Read case | case_id | current version/material і дозволені own/peer approvals | unauthenticated/outsider не отримують case |
| Create/revise material | case_id, expected_version (для revision), material, expiry, request key | persisted new version/hash, старі approvals нечинні | stale version, missing consent, invalid schema, peer impersonation |
| Approve own | case_id, expected_version, expected_terms_hash, request key | approval verified server principal для current material | foreign actor, stale hash/version, revoked/expired, missing permission |
| Withdraw own approval | case_id, expected approval/version, request key | withdrawn timestamp, introduction unavailable | foreign approval target або source conflict |
| Revoke case/permission | resource, expected revision, request key | authoritative revoked state; dependent effects invalid | unauthorized principal/resource |

Запит не містить `approvals` обох сторін і не приймає довільний `state` blob. Patch schema має allowlist і reject unknown privileged fields. Client data не визначає approved_at чи identity. Revoke/withdraw не видаляють доказ того, що раніше було явно погоджено, без окремої records policy.

## Atomicity і readback

Material revision, expected-version compare, permission check і invalidation виконуються однією server transaction або еквівалентним proven compare-and-set. Approval перевіряє current case version/hash/status/expiry та own principal в тій самій transaction. Introduction effect повторно читає current authoritative permissions; cached match не дає права на контакт. Parallel approve/revise/revoke повинні мати визначений linearization order.

UI response mapping proposal: auth failure → login required; forbidden → permission error; conflict → reload/review changes; validation → field error; transport failure → pending/offline; server failure → retryable only after readback. HTTP коди 401/403/409/422/5xx — adapter proposal, чинний backend mapping ще не прийнятий. Не повідомляти success після local optimistic state без persisted version readback.

Повтор того самого request key і payload повертає попередній result; key collision із іншим payload — conflict. Offline approval не стає чинним до server acceptance. Якщо schema/backend не підтримує atomic conditions, V6-04/V6-05 залишаються HOLD до reviewed canonical adaptation; UI guard сам по собі недостатній.

## Семантичні приклади приймання

1. Auth A, current v7: own approve → persisted A/v7; B відсутній; reload іншої дозволеної session показує саме це.
2. Auth A передає B approval → reject або payload не відправляється; жодного B record. Control own A повинен працювати, щоб catch-all reject не був «виправленням».
3. Auth A read v7; B revises v8; A approves v7 → conflict; після readback v8 жоден старий approval не чинний.
4. A/B approved v7; матеріальний edit → v8, обидва approvals invalid; introduction unavailable.
5. Revoke/expiry і approve одночасно → outcome відповідає server order; жодного introduction після revoke/expiry.
6. Timeout after commit → readback same key/version, без дубля. Offline failed write → UI pending/error, не success.
7. Unauthenticated і outsider → немає read/write case; malformed body/forged actor → reject.
8. Canonical SQL → generator → Neon output збігаються; disposable DB with actual auth identities доводить enforcement окремо від mocks.

**Відкриті передумови:** exact Data API operation mapping; authoritative transaction/CAS support; hash normalization parity; resolved auth principal mapping; separate source publication; незалежний contract review. Жодна з них не приховується позначкою «schema існує».
