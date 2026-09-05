# Synera browser launch

This browser implementation covers profile → opt-in discovery → meeting requests. It accompanies the original Flutter source; it is not a completed Flutter migration.

Updated 2026-09-05: [mobile pilot](../docs/MOBILE_PILOT.uk.md), ten labelled hourly demo personas, install manifest/icons/service worker, owned LinkedIn Profile.csv/GPT JSON import, map and versioned rules. Demo remains in memory and cannot create a real account.

## Run

Use the existing Node.js installation from the repository root:

```powershell
node web_launch/server.mjs
```

Open the printed localhost address. The configured project is `synera-demo`. Login stays disabled while the service is unreachable. **Переглянути демонстрацію** explicitly starts a synthetic in-memory scenario; it never claims to save those records to Supabase.

To run the synthetic demonstration without calling any external service:

```powershell
node web_launch/server.mjs --demo
```

The server binds to 127.0.0.1 and serves 21 public application assets plus public configuration. The server and builder share `assets.mjs` as their allowlist. It does not serve source directories, SQL, .git, test files or credentials. Online sessions default to memory; an explicit remember-device checkbox can persist only the rotating refresh token. Logout removes it even if the server request fails. Persistence tests use mocked Auth responses, not live accounts.

The PWA service worker caches explicit shell assets only. It never caches Auth/REST, query-string callbacks, map tiles or imported data. Offline config selects the synthetic demo with registration disabled. OpenStreetMap loads visible tiles only after an explicit UI action, uses browser caching and a per-image origin referrer, and shows attribution. The phone must use a published HTTPS origin; the PC's localhost URL is not a phone installation link.

The profile screen includes a local [profile portability](../docs/PROFILE_PORTABILITY.uk.md) workflow: users can paste their own profile text or Synera JSON, confirm that they have the right to use it, review the parsed fields, and apply it to the form. Sharing uses a manual text card, Web Share when available, and clipboard fallback. It does not fetch LinkedIn/Google/social profiles, copy third-party accounts, store external account IDs, or publish a profile without the existing discoverability checkbox.

## Collaboration laboratory

Open `/lab.html` for the standalone local [meeting prototype](../docs/meeting-gilbert/README.uk.md). It adds structured business-profile examples, reciprocal need coverage, hard constraints, consent checks, a simulated two-party review and an editable CHF subscription calculator. It makes no backend/model requests, uses no persistent storage and does not activate billing. The nearby list filters fictional opted-in city centres; it is not a full map. [Protocol and limits](../docs/meeting-gilbert/MEDIATOR.md).

## Backend state

The project and [schema](../supabase/schema.sql) were created/applied on 2026-09-04. Migration `20260904121759_synera_profiles_and_meeting_requests` is recorded in Supabase. Do not reapply the schema snapshot to that project.

The [database acceptance script](../supabase/acceptance.sql) passed on the actual database and rolled back its synthetic fixtures. Security and performance advisors reported zero findings. Post-test counts: zero Auth users, zero profiles, zero requests.

**The Auth and REST gateways return HTTP 402** because the existing organization is restricted for historical database-size quota. This is a provider restriction, separate from RLS or the SQL connection. No real password login or persistent browser journey has passed. See [current launch status](../docs/SUPABASE_LAUNCH.uk.md).

## Configuration and authentication

`config.public.json` contains only the new project's URL, its modern publishable client key, and a registration-UI setting. These public values are copied to the static release; [publishable keys are intended for clients](https://supabase.com/docs/guides/getting-started/api-keys). Never put a secret/service-role key there.

Optional process overrides are `SYNERA_SUPABASE_URL` and `SYNERA_SUPABASE_PUBLISHABLE_KEY`; provide both or neither. The key type and origin are checked before use.

The email/password adapter uses Supabase Auth's documented [REST endpoints](https://github.com/supabase/auth/blob/master/README.md), user JWTs for authenticated requests, and refresh coalescing. Passwords are cleared after submission. Tokens remain in memory, are not logged, and are cleared even when logout fails.

Email confirmation remains enabled and anonymous sign-in disabled in the project. No provider settings were weakened. `registrationEnabled: false` hides the unfinished signup entry in the UI; it is not an authorization boundary and does not change server Auth settings. Supabase's default email service is limited to organization-member addresses and currently two messages/hour. Configure and test approved SMTP or an approved OAuth provider before wider onboarding. [Supabase SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp).

## Verification

```powershell
node --test web_launch/data.test.mjs web_launch/matching.test.mjs web_launch/economics.test.mjs web_launch/profile-portability.test.mjs web_launch/mobile-pilot.test.mjs web_launch/server.test.mjs
node web_launch/health-check.mjs
node web_launch/build.mjs
```

- The test suite includes the original 33 checks plus 12 mobile-pilot checks. Online adapter tests use mocked responses and do not prove real authentication. See [mobile acceptance](../docs/MOBILE_PILOT.uk.md).
- The SQL tests exercise owner and participant isolation, opt-in visibility, recipient responses, immutable final responses, duplicate requests and column grants.
- The health check is read-only, sends no password and makes no automatic retry. Exit 2 means the gateway is restricted/unavailable. A reachable result still does not claim launch readiness.
- The builder produces 25 allowlisted/generated static files in `web_launch/dist` (or `dist-demo` with `--demo`). It refuses an unexpected existing file and never copies the parent repository. See [hosting](../docs/HOSTING.uk.md).

The browser has passed the synthetic A → B invitation / C isolation / B acceptance journey and literal rendering of HTML-like profile text. The configured launch must also display a clear unavailable state while keeping password submission disabled during the provider restriction.

## Acceptance still required after service recovery

1. Create dedicated synthetic test users using supported Supabase Auth administration, without emailing unrelated people. Use separate passwords and sessions.
2. Sign in independently as A/B/C; save private A, discoverable B and private C. Reload and sign in again to prove persistence.
3. A requests B; B accepts; A sees the accepted state after a fresh login; C and an anonymous REST client cannot read or alter it.
4. Verify wrong-password, expired-session, offline, duplicate-request, recipient-hidden and logout flows in the browser.
5. Test approved registration email delivery and callback URL on the actual host. Keep confirmation enabled.
6. Before collecting real data, finish account deletion/retention, reporting/blocking, operator contact/privacy wording and abuse controls, then run the full pilot checklist.

Maps, private journals, recordings, uploads, AI, full account deletion and moderation are outside this browser implementation. No old Firebase users or data were imported.
