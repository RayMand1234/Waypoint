# services/backend

**Role:** Waypoint's one HTTP API for the app. Owns profiles, trips (picks, day plan, selected offers), reference geo data (countries, cities, places, airports, city price index), hotel catalog and live hotel/flight prices — all external data through liteAPI.

**Must not:** take payment or book anything (plan-only; offers carry a partner `deepLink`); let a liteAPI type or field name leave `src/providers/liteapi/`; read a user id from anywhere but `res.locals.userId`; read env outside `src/env.ts` / `src/index.ts`; touch Supabase's `auth` schema.

**Layers** (one direction only: routes → controllers → services → repositories / providers):

| Folder | Job |
|---|---|
| `routes/` | path + method → controller handler. `routes/index.ts` puts every API router behind `requireUser`. |
| `controllers/` | parse input with the `@waypoint/contracts` schema (`http/validate.ts`), call one service, `sendResult` (maps `ServiceError` → status in `http/respond.ts`). No logic. |
| `services/` | orchestration + rules. Returns `Result<T, ServiceError>`, never HTTP. Pure rules in `*.logic.ts` / `value.ts` (no I/O, `now` passed in). |
| `repositories/` | TypeORM only; every trip query scoped to the user id; returns contract types (parsed), never entities. |
| `providers/` | `types.ts` = Waypoint's provider interfaces (`GeoSource`, `HotelCatalog`, `HotelProvider`, `FlightProvider`; providers take `HotelSearchQuery`, never a `stops` location — the service resolves it first); `liteapi/` = the only adapter (client, raw Zod schemas, mappers, deep links); `searchAcross.ts` = all providers in parallel, per-provider timeout, failures as `ProviderError`s. |
| `observability/` | request context (AsyncLocalStorage), winston logger, traced fetch. |
| `middleware/` | request id, access log, `requireUser` (jose + JWKS, ES256), 404 + error handler. |
| `entities/`, `db/` | TypeORM entities, data source, migrations (`npm run migrate`). |

**Tracing:** `requestContext` takes the app's `x-request-id` (or makes one), echoes it, and runs the request inside an AsyncLocalStorage context; `requireUser` adds `userId`. Every log line — service logs, `upstream call` (liteAPI), DB errors/slow queries, `http request` access line, `unhandled error` — carries both. `LOG_FORMAT=json` in deployed envs.

**Destinations and spots:** our own data in `destinations` / `spots` / `spot_sources`, filled by `src/research/` (`npm run research -- <city>` drafts, `-- <city> --publish` publishes). Research reads Wikidata, OpenStreetMap (Overpass — needs a neutral `Accept` header and retries), Wikimedia Commons and Wikipedia page views; every fact keeps its source and licence. The API serves `published` rows, plus `searched` destinations — cities a traveler picked from search (`POST /destinations`), stored with their airport and no spots; they are never suggested. One destination per Google place id. Google ratings: only the place id is stored; `GET /spots/:id/rating` fetches live and is off without `GOOGLE_PLACES_API_KEY`.

**Caching:** `services/cache.service.ts` (`cached`) is a read-through cache over the `cache_entries` table. Reference data 30 days (Places costs per call), hotel catalog 7 days, city price index 1 day, hotel/flight rates 15 minutes. Failures and partial searches are never stored. Expired rows are not swept yet (`CacheRepository.deleteExpired` exists for a future job).

**Ranking:** `services/value.ts` `rankByValue` — quality ÷ (price ÷ median price); hotels use guest rating → stars → neutral (scaled by nearness to the trip's spots when searched by `stops`, see `hotelLocation.logic.ts`), flights use duration vs fastest and stops. Never provider order or commission.

**Adding a source:** new folder under `providers/`, implement the type from `providers/types.ts`, add it to the list in `src/index.ts`, add its id to `providerIdSchema`. Merging the same hotel across sources goes in `toHotelOffers` when that happens.

**Tests:** `npm test` — pure logic, each adapter against a fake `fetch` (`testing/fakeFetch.ts`, sample data in `testing/sampleTrip.ts`), the cache, `requireUser` against a local JWKS, and the whole HTTP surface with supertest + fake services (`app.test.ts`). Repositories are exercised end to end against local Supabase, not in the unit suite.
