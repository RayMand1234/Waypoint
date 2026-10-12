# Waypoint — architecture

Status: **draft v1**, October 2026. Nothing is built yet. Decisions recorded here match the root `CLAUDE.md`; when they disagree, `CLAUDE.md` wins and this file gets fixed.

## 1. Overview

Waypoint plans a whole trip in under five minutes: trip style → destination → spots & dates → day-by-day plan → flights → stay → summary, always steering to the best quality for the money.

In years 1–2 Waypoint **plans and compares only**. It never takes payment; each part is booked on the partner site through a deep link, and Waypoint earns through affiliate programs.

Rules that shape every part of the system:

- **No scraping.** Offer data comes only from official APIs and affiliate programs.
- **Best value, never "who pays more".** Ranking is value-based; anything paid is labelled "Sponsored".
- **Prices show their age.** Every price carries when it was checked ("checked 3h ago") and "final price confirmed on site".
- **The app never calls outside sources directly**, except Supabase Auth for sign-in.

## 2. System map

```mermaid
flowchart LR
  subgraph Phone
    APP["Waypoint app<br/>Expo · React Query · Unistyles"]
  end

  subgraph Services["Waypoint services (each deployed separately)"]
    TRIPS["trips<br/>profiles, trips, days, picks"]
    SEARCH["search<br/>hotels + flights, value scoring"]
    PLANNER["planner<br/>destinations, spots, day plans"]
    JOBS["jobs<br/>scheduled work, no public API"]
  end

  subgraph Supabase
    AUTH["Supabase Auth"]
    DB[("Postgres<br/>one schema per service")]
  end

  subgraph External["External providers"]
    LITE["liteAPI<br/>hotels"]
    AVIA["Aviasales Data API<br/>flights (cached)"]
    PLACES["OpenTripMap · OpenRouteService<br/>Open-Meteo"]
    LLM["LLM API<br/>spot picks + text"]
  end

  APP -- "sign in" --> AUTH
  APP -- "HTTPS + Bearer JWT" --> TRIPS
  APP -- "HTTPS + Bearer JWT" --> SEARCH
  APP -- "HTTPS + Bearer JWT" --> PLANNER

  PLANNER -- "price estimates" --> SEARCH
  JOBS -- "internal key" --> SEARCH
  JOBS -- "internal key" --> PLANNER

  TRIPS --> DB
  SEARCH --> DB
  PLANNER --> DB
  JOBS --> DB

  SEARCH --> LITE
  SEARCH --> AVIA
  PLANNER --> PLACES
  PLANNER --> LLM
```

**Stack:** TypeScript strict everywhere · Expo (React Native, dev builds) · Unistyles 3 · TanStack React Query · Express 5 · Prisma · Supabase (Postgres + Auth) · Zod · npm-workspaces monorepo.

**Repo:**

```
apps/mobile            Expo app
services/trips         Express service
services/search        Express service
services/planner       Express service
services/jobs          Express service (no public routes)
packages/contracts     @waypoint/contracts — Zod schemas + types for every API
packages/server-kit    @waypoint/server-kit — requireUser, requireService, service client, health/errors
```

## 3. Services

Every service: own `package.json`, own Express server, own deployment, own Postgres schema, `GET /health`. Services never import each other's code and never read each other's tables — they call each other's APIs.

### trips — the traveler's saved state

| | |
|---|---|
| **Owns** | `trips` schema: profiles, trips, picks, days, stops, selected offers |
| **Calls** | nothing |
| **Public routes** | `GET /me` · `PATCH /me` · `GET /trips` · `POST /trips` · `GET /trips/:id` · `PATCH /trips/:id` · `DELETE /trips/:id` · `PUT /trips/:id/plan` · `PUT /trips/:id/selections/:kind` · `PATCH /trips/:id/selections/:kind/booked` |

The single source of truth for a trip. Every step's picks are saved here as the traveler goes, so a draft survives closing the app. It stores *results* other services produced (the day plan, the chosen offer as a snapshot) — it never recomputes them.

### search — offers and value

| | |
|---|---|
| **Owns** | `search` schema: offer cache |
| **Calls** | liteAPI, Aviasales Data API (through provider adapters) |
| **Public routes** | `POST /flights/search` · `POST /hotels/search` |
| **Internal routes** | `GET /internal/estimates` (cheapest known flight + typical stay per night for a destination and month) · `POST /internal/cache/refresh` |

Runs the provider adapter contract (see `CLAUDE.md`): every provider behind one function signature, all called with `Promise.allSettled` and a timeout, results parsed into Waypoint's own `FlightOffer` / `HotelOffer`, merged when two providers return the same offer, ranked by value. A merged offer keeps every source, which feeds the "Where we found it" sheet:

```ts
// shape sketch — the real schema lives in @waypoint/contracts
type HotelOffer = {
  readonly hotel: { readonly name: string; readonly lat: number; readonly lng: number; readonly stars?: number }
  readonly bestPrice: Money
  readonly cancellation: 'free' | 'partial' | 'non-refundable'
  readonly sources: ReadonlyArray<{
    readonly provider: ProviderId
    readonly providerOfferId: string
    readonly price: Money
    readonly deepLink: string
    readonly checkedAt: string            // ISO timestamp
  }>
  readonly value: { readonly score: number; readonly savingsVsAverage: Money; readonly isBestValue: boolean }
  readonly distanceToStops?: { readonly averageMeters: number; readonly maxMeters: number }  // when stops were sent
}
```

Each adapter returns single-source offers (one `provider`, `providerOfferId`, `price`, `deepLink`, `checkedAt` each); `mergeSameHotel` folds offers for the same hotel into this shape.

`POST /hotels/search` takes the planned stops' coordinates so it can return distance to the plan and favour well-placed stays.

### planner — where to go and what to do

| | |
|---|---|
| **Owns** | `planner` schema: curated destinations, spots, travel times, generated text |
| **Calls** | `search` (`/internal/estimates`), OpenTripMap / Foursquare, OpenRouteService, Open-Meteo, the LLM API |
| **Public routes** | `GET /destinations?styles=&month=&origin=` · `GET /destinations/:id/spots?styles=&days=` · `POST /plans` · `POST /plans/swap` |

- **Destinations:** a curated list of 50–100 cities tagged by style. Suggestions are matched to the traveler's styles and month, with an estimated total from `search`.
- **Spots:** recommended spots for the destination and styles, with a "fits in N days" check.
- **Day plans — hybrid:** a deterministic algorithm groups spots by area, respects opening hours and travel times, and orders each day; the LLM only picks spots for the traveler's styles and writes descriptions. The algorithm is pure and testable without the LLM. `POST /plans/swap` returns alternatives for one stop.

### jobs — work nobody waits for

| | |
|---|---|
| **Owns** | `jobs` schema: job run log |
| **Calls** | `search` and `planner` internal routes, with the internal service key |
| **Public routes** | none (only `/health`) |

Scheduled work: refresh cached flight prices for popular routes, refresh spot data for curated destinations, delete expired cache rows. Runs as its own small process so background work never slows user requests.

## 4. The user flow → backend calls

Each step saves the traveler's picks to `trips`. The **route moment** between steps (the ~3s full-screen map) covers the slow call for the next step, so the next screen opens with its data ready.

| Step | Screen | Calls | During the route moment *after* this step |
|---|---|---|---|
| 0 | Log in / Home | Supabase Auth · `GET /me` · `GET /trips` | — |
| 1 | Trip style | `POST /trips` (draft) · `PATCH /trips/:id` | `GET /destinations` |
| 2 | Destination | `PATCH /trips/:id` | `GET /destinations/:id/spots` |
| 3 | Spots & dates | `PATCH /trips/:id` | `POST /plans` |
| 4 | Day plan | `POST /plans/swap` (on swap) · `PUT /trips/:id/plan` | `POST /flights/search` |
| 5 | Flights | `PUT /trips/:id/selections/flight` | `POST /hotels/search` (with stop coordinates) |
| 6 | Stay | `PUT /trips/:id/selections/stay` | — |
| 7 | Summary → Trip planned | `GET /trips/:id` · deep links open partner sites · `PATCH …/booked` per row | — |

```mermaid
sequenceDiagram
  autonumber
  actor U as Traveler
  participant A as App
  participant T as trips
  participant P as planner
  participant S as search
  participant X as Providers

  U->>A: picks styles + pace
  A->>T: POST /trips (draft)
  Note over A: route moment
  A->>P: GET /destinations?styles&month
  P->>S: GET /internal/estimates (forwarded user token)
  S-->>P: cheapest flight + typical night
  P-->>A: suggestions with estimated totals

  U->>A: picks Lisbon, dates, spots
  A->>T: PATCH /trips/:id
  Note over A: route moment
  A->>P: POST /plans
  P->>X: travel times, spot details, LLM text
  P-->>A: day-by-day plan
  A->>T: PUT /trips/:id/plan

  Note over A: route moment
  A->>S: POST /flights/search
  S->>X: all flight providers in parallel
  S-->>A: ranked offers (+ errors from any failed provider)
  U->>A: selects flight
  A->>T: PUT /trips/:id/selections/flight

  Note over A: route moment
  A->>S: POST /hotels/search (+ stop coordinates)
  S->>X: all hotel providers in parallel
  S-->>A: ranked offers with distance to stops
  U->>A: selects stay
  A->>T: PUT /trips/:id/selections/stay

  U->>A: opens summary, taps "book" per row
  A->>X: deep link to partner site (browser)
  A->>T: PATCH …/booked
```

The app orchestrates the flow; services stay independent. The only user-path call between services is `planner → search` for destination estimates.

## 5. Data model

One Supabase Postgres. Each service owns one schema and its own Prisma migrations. **No foreign keys cross schemas:** a trip stores a destination id or an offer snapshot by value, and the owning service stays free to change its tables.

### `trips` schema

```mermaid
erDiagram
  PROFILE ||--o{ TRIP : owns
  TRIP ||--o{ TRIP_SPOT : "chose"
  TRIP ||--o{ TRIP_DAY : "planned as"
  TRIP_DAY ||--o{ TRIP_STOP : contains
  TRIP ||--o{ TRIP_SELECTION : "selected"

  PROFILE {
    uuid user_id PK "= auth.users.id = JWT sub"
    text name
    text home_airport
    timestamptz created_at
  }
  TRIP {
    uuid id PK
    uuid user_id FK
    text status "draft | planned | booked | past"
    text_array styles
    text pace "relaxed | balanced | packed"
    text destination_id "planner id, by value"
    text destination_name
    date start_date
    date end_date
    int adults
    int children
    timestamptz updated_at
  }
  TRIP_SPOT {
    uuid trip_id FK
    text spot_id "planner id, by value"
    text name
  }
  TRIP_DAY {
    uuid id PK
    uuid trip_id FK
    int day_index
    date date
  }
  TRIP_STOP {
    uuid id PK
    uuid day_id FK
    int position
    text spot_id
    text name
    float lat
    float lng
    time starts_at
    int minutes
    int travel_minutes_from_previous
    boolean is_fixed "dashed in the UI"
  }
  TRIP_SELECTION {
    uuid trip_id FK
    text kind "flight | stay | ticket"
    jsonb offer_snapshot "the offer exactly as shown"
    text provider
    text deep_link
    int price_minor
    text currency
    timestamptz checked_at
    timestamptz booked_at "set when the traveler ticks booked"
  }
```

### `search` schema

```mermaid
erDiagram
  OFFER_CACHE {
    uuid id PK
    text kind "flight | hotel"
    text provider
    text query_hash "normalized query"
    jsonb offers "already parsed into Waypoint types"
    timestamptz checked_at
    timestamptz expires_at
  }
```

### `planner` schema

```mermaid
erDiagram
  DESTINATION ||--o{ SPOT : has
  SPOT ||--o{ TRAVEL_TIME : "from"

  DESTINATION {
    text id PK "e.g. lisbon"
    text name
    text country
    text airport_code
    float lat
    float lng
    text_array styles
    int_array best_months
  }
  SPOT {
    text id PK
    text destination_id FK
    text source "opentripmap | foursquare | ..."
    text source_id
    text name
    float lat
    float lng
    text category
    text_array styles
    int typical_minutes
    jsonb opening_hours
    timestamptz fetched_at
  }
  TRAVEL_TIME {
    text from_spot_id FK
    text to_spot_id FK
    text mode "walk | transit | drive"
    int minutes
    timestamptz fetched_at
  }
  GENERATED_TEXT {
    text key PK "hash of inputs"
    text text
    timestamptz created_at
  }
```

### `jobs` schema

`JOB_RUN (id, job_name, started_at, finished_at, status, error)` — one row per run, for debugging and for not running the same job twice.

Money is stored as integer minor units plus an ISO currency code, never as floats.

## 6. Cross-cutting concerns

### Auth

```mermaid
sequenceDiagram
  participant A as App
  participant SA as Supabase Auth
  participant S as Any service
  participant K as JWKS (public keys, cached)

  A->>SA: sign in (email code / Apple / Google ID token)
  SA-->>A: access JWT (~1h) + refresh token (single use)
  A->>S: request + Authorization: Bearer JWT
  S->>K: fetch public keys (first time, then cached)
  S->>S: jwtVerify: signature, expiry, issuer, audience
  S-->>A: data for user = JWT sub
  Note over A,SA: supabase-js refreshes before expiry, and each refresh token works once
```

- Every service uses `requireUser` from `@waypoint/server-kit`. Handlers trust only the verified `sub`.
- Service → service on a user's behalf: forward the same bearer token. `jobs` → service: internal service key, checked by `requireService`.
- Details: root `CLAUDE.md`, "Auth".

### Provider adapters

Every external offer source is one record of functions behind a shared type (`HotelProvider`, `FlightProvider`). Adding Booking.com or Agoda later = one adapter folder + one line in the provider list. Full contract: root `CLAUDE.md`, "Provider adapter contract".

### Price freshness and caching

| Data | Source freshness | Waypoint cache | Shown as |
|---|---|---|---|
| Flight prices (Aviasales Data API) | cached by the provider, up to 7 days | until the provider's `expires_at` | "checked Xh ago" from the provider's timestamp |
| Hotel rates (liteAPI) | live | short (proposed 15 min) per normalized query | "checked X min ago" |
| Destination estimates | derived | refreshed daily by `jobs` | "estimated" |
| Spots, travel times | slow-changing | days to weeks, refreshed by `jobs` | — |
| LLM descriptions | generated | by input hash, until inputs change | — |

Postgres is the cache to start with. Redis comes in only when measured load needs it.

### Failure handling

| What fails | What the traveler sees |
|---|---|
| One provider (e.g. liteAPI times out) | Results from the others, plus "one site didn't respond" |
| All providers for a step | Empty state with retry; picks so far stay saved in `trips` |
| `search` is down | Flights/stay step shows retry; the plan stays saved |
| `planner` is down | Can't create new plans; existing trips still open |
| `trips` is down | App can't save; it keeps the step locally and retries |
| LLM is down | Plan still built by the algorithm, with short default descriptions |

Expected failures are typed results, not thrown exceptions. Service-to-service calls always have a timeout.

### Observability

- Sentry in the app and every service; PostHog for product analytics in the app.
- Each request gets an `x-request-id` (created by the app, forwarded between services) so one traveler action can be traced across services.

### Testing

- Pure logic (value scoring, merging offers, day-plan algorithm) has plain unit tests.
- Every provider adapter passes one shared contract test.
- A **fake provider** returns the sample trip (Tel Aviv → Lisbon, 12–16 May, 2 adults), so the app and services run with no API keys.

### Local development

Development runs fully offline by default: a local Supabase stack plus fake providers. Cloud services are opt-in per service through env vars.

```mermaid
flowchart LR
  subgraph Laptop["Developer machine"]
    APPL["App<br/>simulator or phone on LAN"]
    subgraph Svc["Services (npm workspaces)"]
      TL["trips :4001"]
      SL["search :4002"]
      PL["planner :4003"]
      JL["jobs :4004"]
    end
    subgraph Docker["Supabase CLI (Docker)"]
      AUL["Auth :54321"]
      DBL[("Postgres :54322")]
      MAIL["Email inbox :54324"]
    end
    FAKE["Fake providers<br/>sample Lisbon trip"]
  end

  APPL -- "sign in (email code)" --> AUL
  AUL -- "login codes" --> MAIL
  APPL --> TL
  APPL --> SL
  APPL --> PL
  TL --> DBL
  SL --> DBL
  PL --> DBL
  JL --> DBL
  SL --> FAKE
  PL --> FAKE
```

| Piece | Offline | Online (opt-in) |
|---|---|---|
| Database | local Postgres, one schema per service | Supabase cloud |
| Auth | local Auth, email codes in the local inbox | Supabase cloud, plus Google and Apple sign-in |
| Hotels | `HOTEL_PROVIDERS=fake` | `liteapi` (sandbox key) |
| Flights | `FLIGHT_PROVIDERS=fake` | `aviasales` |
| Day-plan text | `LLM_PROVIDER=fake` | the real LLM API |

Commands: `npx supabase start` / `stop`, then each service with its own dev script. Prisma owns migrations (`prisma migrate dev` per service); the Supabase CLI only runs the database. A real phone reaches the services through the computer's local network IP, not `127.0.0.1`. Full rules: root `CLAUDE.md`, "Local development".

## 7. Phased roadmap

```mermaid
flowchart LR
  P0["Phase 0 · Foundation<br/>monorepo, contracts, server-kit,<br/>auth, trips service, design tokens"]
  P1["Phase 1 · MVP on fake + sandbox data<br/>all 6 steps end to end,<br/>fake providers, liteAPI sandbox,<br/>planner algorithm + LLM text"]
  P2["Phase 2 · Beta with real data<br/>liteAPI production, Aviasales Data API,<br/>jobs service, Sentry + PostHog,<br/>Supabase paid plan + backups"]
  P3["Phase 3 · Growth<br/>Booking.com / Agoda / Expedia adapters,<br/>live flight search, gateway,<br/>Redis if measured"]
  P0 --> P1 --> P2 --> P3
```

Apply to Booking.com, Agoda, Expedia, the Aviasales Search API and Kiwi.com **now**: approvals take time, and each one becomes a Phase 3 adapter.

## 8. Open questions

1. **Hosting** for the four services: Railway or Render. Both charge per running service.
2. **Cache durations:** the 15-minute hotel cache is a proposal; tune it after seeing liteAPI's terms and real traffic.
3. **Currency conversion:** Aviasales prices default to rubles, so the search service needs an exchange-rate source.
4. **LLM provider and model** for spot picks and descriptions.
5. **Spot data quality:** OpenTripMap at launch, or pay for Foursquare / Google Places from the start.
6. **liteAPI fair use:** confirm that search-heavy, booking-light usage is within their terms before launch.
7. **Gateway:** stay with direct app → service calls, or put one gateway in front when the service count or auth needs grow.
