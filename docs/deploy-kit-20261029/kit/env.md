# Production environment — 0364294ce32d978e7f3b40570fe887fb8bc8e360

Only exact string true enables a flag. Current dashboard values were NOT read. No credentials are bundled.

| Name / binding | Value for this walk | r8 evidence | Instructions |
|---|---|---|---|
| `ASSETS` | Pages automatic binding | automatic binding already used by r8 Pages Advanced mode | Pages supplies the static asset service |
| `OPENROUTER_API_KEY` | owner secret | new since documented r8; current dashboard presence UNVERIFIED | Cloudflare SECRET created by the owner with a $3/day limit; never a var, TOML or git |
| `SYNERA_CASE_OUTCOMES_READY` | true | new since documented r8; current dashboard presence UNVERIFIED | only after outcome SQL acceptance |
| `SYNERA_COMPLETE_ERASURE_READY` | false | new since documented r8; current dashboard presence UNVERIFIED | keep application erasure OFF until SQL, safety-hold basis/term, daily purge and live acceptance are verified; provider deletion stays separate |
| `SYNERA_GOOGLE_OAUTH_READY` | false | new since documented r8; current dashboard presence UNVERIFIED | MUST STAY OFF until provider and callback configured and tested |
| `SYNERA_GROUP_ROOMS_READY` | false | new since documented r8; current dashboard presence UNVERIFIED | keep rooms OFF for this walk |
| `SYNERA_LIVE_AI_BUDGET` | owner binding | new since documented r8; current dashboard presence UNVERIFIED | service binding to the LiveAiBudget Durable Object Worker (neon/live-ai-budget-worker.mjs); absent = AI OFF |
| `SYNERA_LIVE_AI_DAILY_CAP_USD` | 3 | new since documented r8; current dashboard presence UNVERIFIED | public var; OpenRouter inference cap per UTC day, set the same limit on the key itself |
| `SYNERA_LIVE_AI_HMAC_SECRET` | owner secret | new since documented r8; current dashboard presence UNVERIFIED | random >= 32 chars, Cloudflare SECRET; pseudonymises visitor ids in KV |
| `SYNERA_LIVE_AI_MODEL` | z-ai/glm-5.3-flash | new since documented r8; current dashboard presence UNVERIFIED | public var; model shown to the person in the notice |
| `SYNERA_LIVE_AI_PROVIDER` | owner fills | new since documented r8; current dashboard presence UNVERIFIED | exact OpenRouter provider slug after checking ZDR/countries; empty keeps AI OFF |
| `SYNERA_LIVE_AI_READY` | false | new since documented r8; current dashboard presence UNVERIFIED | live AI stays OFF until the notice, provider route and secrets are accepted |
| `SYNERA_LOCATION_EPHEMERAL` | required for OTP in both registration modes | new since documented r8; current dashboard presence UNVERIFIED | KV binding with get/put/delete; required before opening closed-pilot OTP as well |
| `SYNERA_LOCATION_READY` | false | new since documented r8; current dashboard presence UNVERIFIED | keep GPS OFF for this walk |
| `SYNERA_MEETING_ADDRESS_READY` | true | new since documented r8; current dashboard presence UNVERIFIED | only after address SQL acceptance |
| `SYNERA_MESSAGE_INTENTS_READY` | true | new since documented r8; current dashboard presence UNVERIFIED | only after message-intent SQL acceptance |
| `SYNERA_NEON_AUTH_URL` | owner fills | documented in r8 launch instructions; current dashboard value UNVERIFIED | copy current production Auth URL ending /neondb/auth; keep existing |
| `SYNERA_NEON_DATA_URL` | owner fills | documented in r8 launch instructions; current dashboard value UNVERIFIED | copy current production Data API URL ending /neondb/rest/v1; same branch/database |
| `SYNERA_OPEN_REGISTRATION` | false | new since documented r8; current dashboard presence UNVERIFIED | MUST STAY OFF: two-person closed pilot |
| `SYNERA_OPERATOR_TOKEN` | owner secret | new since documented r8; current dashboard presence UNVERIFIED | random Cloudflare SECRET; authorises GET /api/ai/spend only |
| `SYNERA_PILOT_EMAILS` | owner fills | documented in r8 launch instructions; current dashboard value UNVERIFIED | exact owner email,<PARTNER_EMAIL>; private, 2 distinct addresses, 1–10 supported |
| `SYNERA_PILOT_READY` | true | documented in r8 launch instructions; current dashboard value UNVERIFIED | only after SQL/backup/config checks |
| `SYNERA_PROFILE_ERASURE_READY` | false | new since documented r8; current dashboard presence UNVERIFIED | keep erasure OFF until separate live acceptance |
| `SYNERA_REAL_JOURNEY_READY` | true | new since documented r8; current dashboard presence UNVERIFIED | only after SQL acceptance; enables terms and two-party confirmations |
| `SYNERA_REGISTRATION_ENABLED` | true | documented in r8 launch instructions; current dashboard value UNVERIFIED | false during preparation; true for the two admitted people |
| `SYNERA_SITE_URL` | https://synera-pilot.pages.dev | documented in r8 launch instructions; current dashboard value UNVERIFIED | same HTTPS origin |

Closed OTP does not need KV. ASSETS is automatic in Pages Advanced mode; do not create a secret called ASSETS. No Google client secret belongs in this Worker. URLs and member emails stay in the owner's dashboard, outside git. New variables require a new deployment to take effect.

Worker source closure: `neon/case-outcome.mjs`, `neon/google-oauth.mjs`, `neon/group-room.mjs`, `neon/live-ai.mjs`, `neon/meeting-address.mjs`, `neon/meeting-location.mjs`, `neon/otp-abuse.mjs`, `neon/profile-erasure.mjs`, `neon/worker.mjs`, `web_launch/case-material-budget.mjs`, `web_launch/live-location.mjs`, `web_launch/ops-log.mjs`, `web_launch/pilot-policy.mjs`, `web_launch/simulation-personas.mjs`.

## Worker invocation logs

In the owner-reviewed Wrangler configuration set:

```toml
[observability.logs]
invocation_logs = false
```

Invocation logs may contain request URLs. For dashboard-uploaded Pages, verify the equivalent platform setting and read back after deployment. This kit does not apply a Wrangler file or change the dashboard. Keep custom logs sanitised; this is not a separate DSV Art.4 audit archive.
