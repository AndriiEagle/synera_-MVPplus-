# Карта серверних даних: P3/P4

Статус: REVIEW ONLY. Міграції не застосовані. Root підключив default-OFF endpoint
`POST /api/neon/privacy-erasure`; component-перевірка — `neon/privacy-endpoint.test.mjs`.
SQL behavioral acceptance у PostgreSQL та застосування на живому backend не підтверджені.

| Дані / таблиця | Персональні поля | P3 complete erasure | P4 retention |
|---|---|---|---|
| `profiles` | ім'я, місто, офери, потреби, brief | поля вже знеособлює legacy RPC; UUID лишається лише в tombstone/зв'язках | до повного стирання користувачем |
| `pilot_consents` | факт і час згоди | видаляється | до P3 |
| `meeting_requests`, `meeting_messages` | учасники, нотатка, адреса, імена | видаляється разом з каскадними повідомленнями/адресами/локаціями | pending із минулим `proposed_at`: щодня |
| `meeting_address_events` | точна адреса, snapshot, payload | каскадно видаляється з зустріччю | до P3/каскаду |
| `meeting_location_grants`, `location_consent_intents` | дозвіл, час, місце, intent | каскадно видаляються з зустріччю | незв'язані intents старші 30 днів: щодня |
| `match_cases`, `match_case_approvals`, `match_outcome_events` | учасники, матеріал, outcomes | case та залежні approvals/outcomes видаляються | до P3 |
| `group_rooms`, `group_room_members`, `group_room_messages`, `group_room_events` | title/goal, склад, текст, події | усі кімнати автора та залежні рядки видаляються; peer room із суб'єктом закривається, а його membership/message/event видаляються; peer content лишається | до P3 |
| `profile_blocks` | зв'язок між людьми | видаляється для суб'єкта | до P3 |
| `profile_reports` | reporter, detail | видаляються в обох напрямках: safety free text не сумісний із complete erasure | до P3 |
| `synera_write_limits` | UUID і ліміти | лишається захищеним anti-abuse технічним лічильником; не доступний клієнту | окрема policy review потрібна |
| `profile_erasures` | UUID, час, provider pending | лишається мінімальним tombstone проти stale JWT | до окремого provider deletion / security review |
| `synera_pilot_members` | email admission | legacy RPC видаляє email до P3 | до legacy erasure |
| `synera_privacy_ops_logs` | тільки `privacy.purge`, `privacy.erasure`, `privacy.error` та числові counters (`deleted_rows`, `failed_rows`, `runs`) | SQL shape не допускає email/free text | старші 90 днів: щодня |

## Невирішені залежності

- Neon Auth / Better Auth користувач не видаляється цією міграцією: `providerDeletion=pending`; G7 і `SYNERA_PROFILE_ERASURE_READY` лишаються OFF за замовчуванням.
- OTP живе в Neon Auth або Cloudflare KV, а не в SQL-схемі: SQL не створює вигаданих OTP-таблиць і не сертифікує їх очищення.
- Поточний edge OTP gate зберігає лише хешовані email/IP ключі й лічильники в наявному Cloudflare KV namespace; код живе 10 хвилин, anti-abuse window 15 хвилин, максимум 5 спроб. Це окремий owner/retention surface, не P3 SQL evidence.
- У production P3 endpoint потребує окремого root integration, exact reviewed deployment/configuration та явного enable; `SYNERA_PROFILE_ERASURE_READY` лишається OFF за замовчуванням. Ця SQL пропозиція не вмикає її.
- Backup/PITR, репліки, Cloudflare журнали та отримані іншою стороною копії не стираються цим RPC; потрібні окремі provider retention/DPA процедури.
- P4 функція не запускає scheduler: операторський `service_role` викликає її раз на добу. Pending invitation очищується після `proposed_at`, а legacy NULL `proposed_at` — після `created_at`; location intent 30+ днів лишається, якщо ще прив'язаний до живого grant. Звичайний `authenticated` не має EXECUTE.

## Review 1 — виправлена початкова прогалина

Початкова версія P3 лишала `profile_reports`, де суб'єкт був reported, та його
membership у peer room. Це не відповідало формулюванню complete erasure через
free-text report і UUID-зв'язок. Поточна міграція видаляє reports в обох
напрямках і всі room rows суб'єкта; кімнати, створені суб'єктом, видаляються з
усіма залежними rows. Мінімальний `profile_erasures.user_id` і
`synera_write_limits.user_id` лишаються лише для anti-stale-session/anti-abuse
контролю та не доступні `authenticated`. Peer room закривається перед видаленням
membership, щоби `turn_position` не вказував на вже стерту позицію.
