# @waypoint/contracts

**Role:** the single definition of every Waypoint API shape — Zod schemas, the types inferred from them, and the few pure helpers (`ok`, `err`, `assertNever`) that every service and the app share.

**Must not:** do any I/O, import a framework (no Express, no React), hold business logic, or know anything about a provider. liteAPI and Aviasales types live inside `services/search/src/**/providers/`, never here. Nothing in `common/` may import from a service folder.

**Connects to:** every service validates request input and response output against the schemas under its own folder (`trips/` → `services/trips`); the app's `apiRequest()` parses responses with the same schemas; the service client in `@waypoint/server-kit` parses service-to-service responses with them. `common/` is shared by all of them: `Result`, `Money`, `ProviderId`, `ServiceName`, the ISO date/time/time-of-day schemas, the one HTTP error body (`httpErrorBody` + the branded `HttpErrorCode`), and `GET /health`.

**Constraints:**
- **Shared and additive.** Other tracks build against these schemas in parallel, so adding a schema or an export is free; changing or removing an existing one breaks them. Add rather than edit, and ask before a breaking change.
- **Request bodies are strict** (`z.strictObject`), so an unknown field is a 400 and never silently ignored — a user id in a body is rejected outright, because a service trusts only the verified token. **Responses are not strict**, so a service adding a field never breaks an app build already on a phone.
- **A clearable field is `z.exactOptional`, never plain `.optional()`.** Under `exactOptionalPropertyTypes`, a plain optional's value type still includes `| undefined`, so `{ name: undefined }` type-checks as if it meant "leave this alone" while actually sending an explicit `undefined`. `exactOptional` keeps the key itself optional but refuses a literal `undefined` value — "leave alone" can only be expressed by omitting the key, "clear it" by sending `null`. See `trips/routes.ts`'s `updateMeRequestSchema` / `updateTripRequestSchema`.
- **Validated primitives are branded** (`.brand<'X'>()`): `IsoDate`, `IsoDateTime`, `IsoTime`, `IataCode`, `HttpErrorCode`. A bare string literal can't be assigned to one — the only way to get one is to parse it (or, for `HttpErrorCode`, call `toHttpErrorCode`). This is what makes "every value of this type was validated" actually true, not just true at the one call site that happened to validate it.
- Money is integer minor units plus a currency, never a float. Dates cross the wire as ISO strings.
- Consumed as TypeScript source — no build step. Relative imports carry the `.ts` extension so tsc, tsx, tsup, Vitest and Metro all resolve the same real file.
- One folder per service area, each with its own `index.ts`; importers use the subpath export (`@waypoint/contracts/trips` or `/common`), never a deep file path. The root `index.ts` re-exports both explicitly (no `export *`), so a name collision between areas is a compile error here, not a silently dropped export.
