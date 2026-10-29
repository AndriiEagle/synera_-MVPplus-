# Production environment — 354287da3453d76ad954bc9aac3d881c11aacf02

Only exact string true enables a flag. Current dashboard values were NOT read. No credentials are bundled.

| Name / binding | Value for this walk | r8 evidence | Instructions |
|---|---|---|---|
| `ASSETS` | Pages automatic binding | automatic binding already used by r8 Pages Advanced mode | Pages supplies the static asset service |
| `SYNERA_CASE_OUTCOMES_READY` | true | new since documented r8; current dashboard presence UNVERIFIED | only after outcome SQL acceptance |
| `SYNERA_COMPLETE_ERASURE_READY` | false | new since documented r8; current dashboard presence UNVERIFIED | keep complete account erasure OFF until the identity-provider deletion (gate G7) is accepted live |
| `SYNERA_GOOGLE_OAUTH_READY` | false | new since documented r8; current dashboard presence UNVERIFIED | MUST STAY OFF until provider and callback configured and tested |
| `SYNERA_GROUP_ROOMS_READY` | false | new since documented r8; current dashboard presence UNVERIFIED | keep rooms OFF for this walk |
| `SYNERA_LOCATION_EPHEMERAL` | not required while GPS/open registration OFF | new since documented r8; current dashboard presence UNVERIFIED | KV binding with get/put/delete, only if those features later enabled |
| `SYNERA_LOCATION_READY` | false | new since documented r8; current dashboard presence UNVERIFIED | keep GPS OFF for this walk |
| `SYNERA_MEETING_ADDRESS_READY` | true | new since documented r8; current dashboard presence UNVERIFIED | only after address SQL acceptance |
| `SYNERA_MESSAGE_INTENTS_READY` | true | new since documented r8; current dashboard presence UNVERIFIED | only after message-intent SQL acceptance |
| `SYNERA_NEON_AUTH_URL` | owner fills | documented in r8 launch instructions; current dashboard value UNVERIFIED | copy current production Auth URL ending /neondb/auth; keep existing |
| `SYNERA_NEON_DATA_URL` | owner fills | documented in r8 launch instructions; current dashboard value UNVERIFIED | copy current production Data API URL ending /neondb/rest/v1; same branch/database |
| `SYNERA_OPEN_REGISTRATION` | false | new since documented r8; current dashboard presence UNVERIFIED | MUST STAY OFF: two-person closed pilot |
| `SYNERA_PILOT_EMAILS` | owner fills | documented in r8 launch instructions; current dashboard value UNVERIFIED | exact owner email,<PARTNER_EMAIL>; private, 2 distinct addresses, 1–10 supported |
| `SYNERA_PILOT_READY` | true | documented in r8 launch instructions; current dashboard value UNVERIFIED | only after SQL/backup/config checks |
| `SYNERA_PROFILE_ERASURE_READY` | false | new since documented r8; current dashboard presence UNVERIFIED | keep erasure OFF until separate live acceptance |
| `SYNERA_REAL_JOURNEY_READY` | true | new since documented r8; current dashboard presence UNVERIFIED | only after SQL acceptance; enables terms and two-party confirmations |
| `SYNERA_REGISTRATION_ENABLED` | true | documented in r8 launch instructions; current dashboard value UNVERIFIED | false during preparation; true for the two admitted people |
| `SYNERA_SITE_URL` | https://synera-pilot.pages.dev | documented in r8 launch instructions; current dashboard value UNVERIFIED | same HTTPS origin |

Closed OTP does not need KV. ASSETS is automatic in Pages Advanced mode; do not create a secret called ASSETS. No Google client secret belongs in this Worker. URLs and member emails stay in the owner's dashboard, outside git. New variables require a new deployment to take effect.

Worker source closure: `neon/case-outcome.mjs`, `neon/google-oauth.mjs`, `neon/group-room.mjs`, `neon/meeting-address.mjs`, `neon/meeting-location.mjs`, `neon/otp-abuse.mjs`, `neon/profile-erasure.mjs`, `neon/worker.mjs`, `web_launch/case-material-budget.mjs`, `web_launch/live-location.mjs`, `web_launch/pilot-policy.mjs`.
