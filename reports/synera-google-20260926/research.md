# Synera × Managed Neon Auth Google OAuth — read-only protocol evidence

> Discovery snapshot before the custom no-cache bridge was implemented. Current implementation and verification limits: ../../docs/GOOGLE_OAUTH_REVIEW_20260926.uk.md. Local mock acceptance does not establish live Google compatibility.

Date checked: 2026-09-26. Scope: current Managed Better Auth / Neon SDK only; no live endpoint,
secret, install, feature edit, provider request, deploy, or production mutation was performed.

## Verdict

**VERIFIED — a supported same-origin proxy contract exists.** It is the framework-agnostic
`@neondatabase/auth/server` adapter, not raw Better Auth or legacy Stack endpoints. It owns cookie
rewriting, verifier exchange and signed session-data caching. The SDK surface is beta and requires
a `cookieSecret`; this checkout has no `@neondatabase/auth` dependency or lockfile entry. Therefore
there is **no verified zero-new-install path** to safely convert a Google result into the existing
`__Host-synera-session` cookie.

## Exact current flow

1. The browser client calls `signIn.social({ provider: 'google', callbackURL })` through a
   same-origin `/api/auth/sign-in/social` route. This is the documented Managed Auth API.
2. The route delegates verbatim body text to `handleAuthProxyRequest`. The request helper composes
   `<NEON_AUTH_URL>/<path>`, preserves the incoming query string, forwards only `user-agent`,
   `authorization`, `referer`, `content-type`, derives `Origin`, forwards only cookies whose names
   begin `__Secure-neon-auth`, and adds `x-neon-auth-middleware: true`.
3. The proxy response forwards an allowlist of response headers including every `Set-Cookie` and
   `set-auth-jwt`. For each upstream cookie it strips `Partitioned`, forces `Secure`, sets the
   configured domain if any, and uses configured `SameSite` (default `Lax`). If upstream emits a
   session token, it additionally mints a signed, HttpOnly
   `__Secure-neon-auth.local.session_data` cookie using the server-only `cookieSecret`.
4. Managed social start supplies an OAuth-init navigation. The browser must visit that Neon Auth
   URL so the provider-domain state is created normally; the application must not manufacture an
   authorization URL or carry state via a server fetch.
5. After Google -> Neon callback, the app callback URL receives
   `neon_auth_session_verifier=<opaque value>`. The same-origin middleware requires that query
   value **and** either `__Secure-neon-auth.session_challenge` or legacy
   `__Secure-neon-auth.session_challange` browser cookie. It issues a body-less `GET` to
   `<NEON_AUTH_URL>/get-session?neon_auth_session_verifier=...`, using the filtered auth cookies
   and derived Origin above.
6. On successful upstream response, `handleAuthResponse` forwards/mints the cookies, removes the
   verifier from the callback URL, and returns `redirect_oauth`. The host adapter must append every
   returned Set-Cookie to that 302. On missing verifier/challenge or non-OK exchange, it does not
   synthesize a session.

## Primary source locators

- SDK public contract and beta caveat:
  https://github.com/neondatabase/neon-js/blob/main/packages/auth/README.md
  (OAuth `signIn.social`; `@neondatabase/auth/server` toolkit).
- Adapter flow, route handler and middleware mapping:
  https://github.com/neondatabase/neon-js/blob/main/packages/auth/BUILDING-AN-ADAPTER.md
  (sections “Mount the proxy handler” and “Add middleware”).
- Upstream URL, request headers and filtered cookies:
  https://github.com/neondatabase/neon-js/blob/main/packages/auth/src/server/proxy/request.ts#L27-L156
- Multi-cookie response handling, `Secure`/`Lax`/`Partitioned` policy and session-data minting:
  https://github.com/neondatabase/neon-js/blob/main/packages/auth/src/server/proxy/response.ts#L21-L78
- Canonical cookie names:
  https://github.com/neondatabase/neon-js/blob/main/packages/auth/src/server/constants.ts#L0-L12
- Verifier exchange endpoint, method, gate and redirect cleanup:
  https://github.com/neondatabase/neon-js/blob/main/packages/auth/src/server/middleware/oauth.ts#L33-L113
- Middleware result contract and application of `redirect_oauth` cookies:
  https://github.com/neondatabase/neon-js/blob/main/packages/auth/src/server/middleware/processor.ts#L69-L123

## Boundary to Synera's current worker

The current worker owns a custom `__Host-synera-session` holding the provider session token and
uses manual `/get-session` requests. The documented adapter instead uses Neon-auth-prefixed
cookies plus a signed session-data cache. Rewriting only the start endpoint is insufficient:
without the verifier exchange and challenge cookie the callback is fail-closed; copying a provider
cookie into `__Host-synera-session` cannot substitute the SDK's protocol.

## Bounded implementation proposal — not authorized or implemented

1. Approve one precisely pinned `@neondatabase/auth` version and provision a new server-only
   `NEON_AUTH_COOKIE_SECRET`; do not reuse user, OAuth-client, JWT or Cloudflare credentials.
2. Add a narrow Cloudflare Worker adapter using `handleAuthProxyRequest` for `/api/auth/*` and
   `processAuthMiddleware` before protected-route handling. The SDK claims Web-standards/Edge
   compatibility, but its beta surface requires a local Worker compatibility test.
3. Decide explicitly whether to migrate the current gateway to the SDK's auth-cookie model or
   implement a separately reviewed server-side bridge into `__Host-synera-session` only after the
   SDK exchange returns a validated session. Browser JavaScript must receive neither token nor
   cookie value.
4. Test only on an isolated Neon branch: first Google consent, cancel, callback, verifier removal,
   reload/session restoration, RLS data request and logout. Capture redacted status/cookie-name
   assertions only.

## Current risk

**NEEDS_REVIEW:** published SDK issue #227 reports first-time Google consent can exceed an
upstream flow-state TTL, failing verifier exchange despite a valid challenge cookie. Treat the
vendor flow as unaccepted until an isolated-branch test covers a slow first-consent journey:
https://github.com/neondatabase/neon-js/issues/227
