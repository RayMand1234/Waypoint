# @waypoint/server-kit

**Role:** the Express plumbing every Waypoint service wires up — environment parsing, auth middleware, request ids, the shared error and health handlers, and the typed client one service uses to call another.

**Must not:** hold business logic of any kind, touch a database, know what a trip or an offer is, or import from a service. Everything here is about transport and process boundaries. Code only moves in once two or more services need it.

**Connects to:**
- Every service's `app.ts` composes these: `requestId()` → routers → `notFound` → `errorHandler()`, plus `healthRoute()` and `requireUser()` / `requireService()` on the routes that need them.
- `requireUser` verifies a Supabase access token against the project's JWKS and leaves the verified `sub` in `res.locals.userId`; `requireUserId(res)` is the only way a handler should read it.
- `createServiceClient` is how `planner` calls `search` and how `jobs` calls both — it takes the callee's own `@waypoint/contracts` schema and returns a `Result`.
- `parseEnv` is called once per service, in `index.ts`, before anything is built.

**Constraints:**
- **Auth is verified locally, never by asking Supabase per request.** That needs asymmetric (ES256) signing keys, because verification reads the project's JWKS. Every failure — missing header, bad signature, wrong issuer, wrong audience, expired, unreachable JWKS — is the same 401 with the same body, so nothing leaks about which check failed. The internal API key is compared in constant time.
- **A failing dependency must degrade the caller, not crash it.** Every service call has a timeout, parses the response with a schema, and returns a typed `ServiceClientError` rather than throwing.
- **Dependencies are arguments.** Every export is a factory taking what it needs (`now`, `report`, `fetchImpl`), so tests swap in fakes; no module-level singletons, no reading `process.env` outside `parseEnv`.
- `errorHandler` only ever sees programmer errors — expected failures come back as a `Result` and the route maps them to a status. So it reports and answers a 500 that leaks nothing.
