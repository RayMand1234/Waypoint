# @waypoint/contracts

**Role:** the single definition of every Waypoint API shape — Zod schemas, the types inferred from them, and the few pure helpers (`ok`, `err`, `assertNever`) that every service and the app share.

**Must not:** do any I/O, import a framework (no Express, no React), hold business logic, or know anything about a provider. liteAPI and Aviasales types live inside `services/search/src/**/providers/`, never here. Nothing in `common/` may import from a service folder.

**Connects to:** every service validates request input and response output against the schemas under its own folder (`trips/` → `services/trips`); the app's `apiRequest()` parses responses with the same schemas; the service client in `@waypoint/server-kit` parses service-to-service responses with them. `common/` is shared by all of them: `Result`, `Money`, `ProviderId`, the ISO date/time/time-of-day schemas, the one HTTP error body, and `GET /health`.

**Constraints:**
- **Shared and additive.** Other tracks build against these schemas in parallel, so adding a schema or an export is free; changing or removing an existing one breaks them. Add rather than edit, and ask before a breaking change.
- **Request bodies are strict** (`z.strictObject`), so an unknown field is a 400 and never silently ignored — a user id in a body is rejected outright, because a service trusts only the verified token. **Responses are not strict**, so a service adding a field never breaks an app build already on a phone.
- Money is integer minor units plus a currency, never a float. Dates cross the wire as ISO strings.
- Consumed as TypeScript source — no build step. Relative imports carry the `.ts` extension so tsc, tsx, tsup, Vitest and Metro all resolve the same real file.
- One folder per service area, each with its own `index.ts`; importers use the subpath export (`@waypoint/contracts/trips`), never a deep file path.
