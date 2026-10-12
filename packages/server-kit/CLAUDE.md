# @waypoint/server-kit

**Role:** the Express plumbing every Waypoint service wires up — environment parsing, auth middleware, request ids, the shared error and health handlers, and the typed client one service uses to call another.

**Must not:** hold business logic of any kind, touch a database, know what a trip or an offer is, or import from a service. Everything here is about transport and process boundaries. Code only moves in once two or more services need it.

**Connects to:**
- Every service's `app.ts` composes these: `requestId()` → routers → `notFound` → `errorHandler({ report })`, plus `healthRoute()` and `requireUser()` / `requireService()` on the routes that need them.
- `requireUser` verifies a Supabase access token against the project's JWKS and leaves the verified `sub` (branded `UserId`) in `res.locals.userId`; `requireUserId(res)` is the only way a handler should read it. The brand's constructor (`toUserId`, in `locals.ts`) is **not** re-exported from this package's `index.ts` — that's what stops a handler turning a body or query string into a `UserId`, not the brand alone.
- `createServiceClient` is how `planner` calls `search` and how `jobs` calls both — it takes the callee's own `@waypoint/contracts` schema and returns a `Result`. `service` and the error values' `service` field are the branded `ServiceName` (`'trips' | 'search' | 'planner' | 'jobs'`, from contracts), not a bare string.
- `parseEnv` is called once per service, in `index.ts`, before anything is built. Only imports from `@waypoint/contracts/common` — never the package root, which also re-exports `trips/` — so this package stays ignorant of what a trip is, per the rule above.

**Constraints:**
- **Auth is verified locally, never by asking Supabase per request.** That needs asymmetric (ES256) signing keys, because verification reads the project's JWKS. `jwtVerify` is called with `algorithms: ['ES256']` explicitly — never let the token's own header pick the algorithm. Every failure a caller can trigger — missing header, bad signature, wrong issuer, wrong audience, wrong algorithm, expired, no subject — is the same 401 with the same body, so nothing leaks about which check failed. A JWKS outage gets the same 401 but, unlike those, is reported through the optional `report` option — it's an infra problem, not a bad token. The internal API key is compared in constant time.
- **A failing dependency must degrade the caller, not crash it.** Every service call has a timeout, parses the response with a schema, and returns a typed `ServiceClientError` rather than throwing. A non-2xx response's body is a closed `ServiceErrorBody` (`none | unparseable | unrecognized | recognized`) — never a single optional field quietly standing in for three different reasons the callee told us nothing.
- **Dependencies are arguments, with no hidden fallback.** Every export is a factory taking what it needs (`now`, `fetchImpl`); `errorHandler`'s `report` is required, not defaulted to `console.error`, so a composition root always decides where errors go. No module-level singletons, no reading `process.env` outside `parseEnv`.
- `errorHandler` only ever sees programmer errors — expected failures come back as a `Result` and the route maps them to a status. So it reports and answers a 500 that leaks nothing.
- The handful of error codes this package itself returns live once, branded, in `errorCodes.ts` (`NOT_FOUND`, `UNAUTHORIZED`, `INTERNAL_ERROR`) — not as repeated string literals across `errors.ts`, `requireUser.ts` and `requireService.ts`.
