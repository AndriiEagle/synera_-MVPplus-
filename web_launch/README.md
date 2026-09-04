# Synera browser launch

This browser implementation covers profile → opt-in discovery → meeting requests. It accompanies the original Flutter source; it is not a completed Flutter migration.

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

The server binds to 127.0.0.1 and serves only four application assets plus public configuration. It does not serve source directories, SQL, .git, test files or credentials. A restart requires signing in again because sessions remain in memory; data successfully stored in Supabase is independent of that session.

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
node --test web_launch/data.test.mjs
node web_launch/health-check.mjs
node web_launch/build.mjs
```

- Nine local tests passed. Online adapter tests use mocked responses and do not prove real authentication.
- The SQL tests exercise owner and participant isolation, opt-in visibility, recipient responses, immutable final responses, duplicate requests and column grants.
- The health check is read-only, sends no password and makes no automatic retry. Exit 2 means the gateway is restricted/unavailable. A reachable result still does not claim launch readiness.
- The builder produces eight allowlisted static files in `web_launch/dist`. It refuses an unexpected existing file and never copies the parent repository. See [hosting](../docs/HOSTING.uk.md).

The browser has passed the synthetic A → B invitation / C isolation / B acceptance journey and literal rendering of HTML-like profile text. The configured launch must also display a clear unavailable state while keeping password submission disabled during the provider restriction.

## Acceptance still required after service recovery

1. Create dedicated synthetic test users using supported Supabase Auth administration, without emailing unrelated people. Use separate passwords and sessions.
2. Sign in independently as A/B/C; save private A, discoverable B and private C. Reload and sign in again to prove persistence.
3. A requests B; B accepts; A sees the accepted state after a fresh login; C and an anonymous REST client cannot read or alter it.
4. Verify wrong-password, expired-session, offline, duplicate-request, recipient-hidden and logout flows in the browser.
5. Test approved registration email delivery and callback URL on the actual host. Keep confirmation enabled.
6. Before collecting real data, finish account deletion/retention, reporting/blocking, operator contact/privacy wording and abuse controls, then run the full pilot checklist.

Maps, private journals, recordings, uploads, AI, full account deletion and moderation are outside this browser implementation. No old Firebase users or data were imported.
