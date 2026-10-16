# @waypoint/contracts

**Role:** the single definition of every Waypoint API shape — Zod schemas, the types inferred from them, and the few pure helpers (`ok`, `err`, `assertNever`) that every service and the app share.

**Must not:** do any I/O, import a framework (no Express, no React), hold business logic, or know anything about a provider. liteAPI types live inside `services/backend/src/providers/liteapi/`, never here. Nothing in `common/` may import from an area folder.

**Connects to:** `services/backend` validates request input against these schemas and returns these types; the app's `apiRequest()` parses responses with the same schemas. Areas: `common/` (`Result`, `Money`, `ProviderId`, `CountryCode`, `IataCode`, ISO date/time schemas incl. `IsoLocalDateTime` for flight times, the HTTP error body, `OfferSource` / `OfferValue` / `ProviderError`, pagination, `GET /health`), `trips/` (profile, trips, plan, selections), `geo/` (countries, cities, places, airports, city price index), `hotels/` (catalog, `HotelOffer`, search), `flights/` (`FlightOffer`, search).

**Constraints:**

- **Shared and additive.** Other tracks build against these schemas in parallel, so adding a schema or an export is free; changing or removing an existing one breaks them. Add rather than edit, and ask before a breaking change.
- **Request bodies are strict** (`z.strictObject`), so an unknown field is a 400 and never silently ignored — a user id in a body is rejected outright, because a service trusts only the verified token. **Responses are not strict**, so a service adding a field never breaks an app build already on a phone.
- **A clearable field is `z.exactOptional`, never plain `.optional()`.** Under `exactOptionalPropertyTypes`, a plain optional's value type still includes `| undefined`, so `{ name: undefined }` type-checks as if it meant "leave this alone" while actually sending an explicit `undefined`. `exactOptional` keeps the key itself optional but refuses a literal `undefined` value — "leave alone" can only be expressed by omitting the key, "clear it" by sending `null`. See `trips/routes.ts`'s `updateMeRequestSchema` / `updateTripRequestSchema`.
- **Validated primitives are branded** (`.brand<'X'>()`): `IsoDate`, `IsoDateTime`, `IsoTime`, `IsoLocalDateTime`, `IataCode`, `CountryCode`, `HttpErrorCode`. A bare string literal can't be assigned to one — the only way to get one is to parse it (or, for `HttpErrorCode`, call `toHttpErrorCode`). This is what makes "every value of this type was validated" actually true, not just true at the one call site that happened to validate it.
- Money is integer minor units plus a currency, never a float. Dates cross the wire as ISO strings.
- Consumed as TypeScript source — no build step. Relative imports carry the `.ts` extension so tsc, tsx, tsup, Vitest and Metro all resolve the same real file.
- One folder per API area, each with its own `index.ts`; importers use the subpath export (`@waypoint/contracts/trips`, `/geo`, `/hotels`, `/flights`, `/common`), never a deep file path. The root `index.ts` re-exports every area explicitly (no `export *`), so a name collision between areas is a compile error here, not a silently dropped export.
