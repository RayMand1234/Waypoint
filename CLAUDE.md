# Waypoint

Mobile-first app that plans a whole trip in under five minutes: trip style → destination → spots & dates → day-by-day plan → flights → stay → summary, always steering to the best quality for the money.

Shared engineering rules come from SAPI, mounted at `.claude/` (git submodule). This file supplies what SAPI leaves to each app (see the last section of `.claude/CLAUDE.md`). On app-specific details this file wins; on work culture and the engineering baseline, SAPI wins.

## Product rules that shape the code

- **Plan and compare only (years 1–2).** Waypoint never takes payment or books anything. Each part is booked on the partner site via a deep link (flight → Skyscanner, stay → Booking.com, tickets → official sites).
- **No scraping** of Booking, Trivago, Skyscanner or similar. Data comes only from official APIs and affiliate programs.
- **Ranking is "best value", never "who pays more".** Anything paid is labelled "Sponsored".
- **Prices may be cached.** Every price shown carries its age ("checked 3h ago") and "final price confirmed on site".
- Sample data everywhere: Tel Aviv → Lisbon, 12–16 May, 2 adults. Prices and hotel names are placeholders.

## Stack

Items marked **decided** are settled. For anything marked **open**, ask before adding a framework, service or dependency that locks it in.

- **Language — decided:** TypeScript, `strict`, end to end.
- **App — proposed:** React Native (Expo).
- **Backend — decided:** Node + **Express** (v5). Route handlers are plain functions, no classes, no DI container. Validate request input with Zod at the handler boundary.
- **Database — decided:** **Supabase**-hosted Postgres, used as plain Postgres. **Prisma** is the data layer (schema file, generated client, plain-object results; no TypeORM, no decorator entities). Prisma uses Supabase's pooled URL at runtime and the direct URL for migrations. The free plan pauses idle projects and has no backups: fine for development, upgrade before real users.
- **Auth — open:** Supabase Auth (app logs in, Express verifies the token) vs. auth on our own server (e.g. Better Auth). Logins needed: email link, Google, Apple.
- **Cache — open:** Postgres first; add Redis (e.g. Upstash) only when measured load needs it.
- **Free-tier services first.**

## Architecture

- **Three layers:** mobile app → Waypoint backend → external services. **The app never calls outside sources directly.** Its only server is the Waypoint backend, through `apiRequest()` and React Query (SAPI `react-query-server-interaction`).
- **Backend domains:** accounts & trips, trip planner, search aggregator, value scoring, cache & background jobs. One folder per domain.
- **Provider adapters:** see the contract below. Swapping or adding a source never touches anything outside that source's adapter folder and the provider list.
- **Day planning is hybrid:** a deterministic algorithm handles area grouping, opening hours and travel times; an LLM only picks spots for the traveler's styles and writes descriptions. Keep the two separate so the algorithm stays testable without the LLM.
- **Destinations at launch:** a curated list of 50–100 cities tagged by style.

## Provider adapter contract (agreed)

Every external offer source (hotels, flights, later tickets) follows this shape. Shown for hotels; flights mirror it (`FlightProvider`, `searchAllFlights`).

```ts
// hotels/types.ts — Waypoint's own shapes; no provider type leaks past an adapter
export type HotelProvider = {
  readonly id: ProviderId
  readonly searchHotels: (query: HotelQuery, signal: AbortSignal) => Promise<ReadonlyArray<HotelOffer>>
}

// hotels/searchAllHotels.ts — the one entry point the rest of the backend calls
export const searchAllHotels =
  (providers: ReadonlyArray<HotelProvider>) =>
  async (query: HotelQuery): Promise<HotelSearchResult> => {
    const settled = await Promise.allSettled(
      providers.map((p) => p.searchHotels(query, AbortSignal.timeout(PROVIDER_TIMEOUT_MS)))
    )
    const { offers, errors } = collectResults(providers, settled)   // pure
    return { offers: rankByValue(mergeSameHotel(offers)), errors }  // pure
  }

// composition root — changing source = editing this list
const searchHotels = searchAllHotels([liteApiProvider])
```

Rules:

1. **A provider is a record of functions, not a class.** One folder per provider (`hotels/providers/liteapi/`), exporting one `HotelProvider` value.
2. **Adapters translate.** Each adapter Zod-parses the raw response and maps it to Waypoint's `HotelOffer` / `FlightOffer`. Nothing outside the adapter folder imports provider types, SDKs or field names. Adapters parse, never cast.
3. **I/O only in adapters.** Collecting results, matching the same hotel across providers (`mergeSameHotel`: normalized name + distance threshold), keeping the lowest price, and value scoring are pure functions with their own tests.
4. **One failing source never fails the search.** `Promise.allSettled` + a per-provider timeout; failures come back as typed `ProviderError`s beside the offers, so the UI can show partial results.
5. **Every offer carries** `provider`, `providerOfferId`, `checkedAt` (for "checked 3h ago") and `deepLink`.
6. **Shared contract test + fake provider.** One test suite every adapter must pass. A fake provider returns the sample trip (Tel Aviv → Lisbon, 12–16 May, 2 adults) so the app and tests run with no API keys.
7. **Search only, for now.** Waypoint is plan-only, so `HotelProvider` has no prebook/book. If in-app booking is added later, it's a separate `HotelBookingProvider` type implemented only by sources that support it.
8. **Provider order never affects ranking.** Ranking is value-based only; paid placement is labelled "Sponsored".
9. Extract the shared `allSettled` + timeout + error-collection helper once a second category (flights) duplicates it, not before.

## Data sources

- **Hotels — liteAPI (Nuitée):** the starting source. Aggregates 300+ suppliers into one API with live rates. Develop against the free sandbox key (test data, simulated bookings); production key needed before real users. Rate search is free under fair use — confirm their terms on search-heavy, booking-light usage before launch.
- **Flights — Travelpayouts / Aviasales Data API:** no approval needed. Data is **cached** from users' searches (kept up to 7 days, some endpoints only 48h), prices default to RUB and carry `expires_at` — convert currency and drop expired prices. Use for "from €X"; live search needs the Aviasales Search API (approval required).
- **Travelpayouts has no hotel data:** Hotellook closed in October 2025 and its API is disabled. Do not use it.
- **Apply for (approval/contract required):** Booking.com Demand API (managed affiliate), Agoda Demand API (meta-search model), Expedia Rapid, Aviasales Search API, Kiwi.com, Skyscanner (needs traffic). Each becomes one new adapter when approved.
- **Airbnb:** no public API — link-out only, no prices.
- **Amadeus Self-Service API shut down in July 2026. Do not use it.**
- Candidates: OpenTripMap / Foursquare (spots), OpenRouteService (travel times), MapLibre (maps), Open-Meteo (weather), GetYourGuide / Tiqets affiliate (tickets).

## Design

- Design system and MVP screens are claude.ai artifacts and the source of truth for visuals:
  - Design system: https://claude.ai/artifact/LnbFzgyfppQa7tCfgwSNjH
  - MVP canvas: https://claude.ai/artifact/Kx6eZ4tJXEX7g6JnFpGYiG
- Tokens: midnight `#1E2A5A` primary; sunshine `#FFC83D` only means "best value" (fill with ink text, never text on light); surface `#FAF8F4`; ink `#121726`; ink-muted `#5E5A55`; savings `#1D7A50`; danger `#C2362C`; warning `#A15C00`. Plus Jakarta Sans only; prices use tabular numerals. Spacing 4/8/12/16/24/32/48, radii 8/12/20/full, touch targets ≥ 44px.
- Voice: a competent friend ("we found…"), sentence case, no emoji. Light theme and English only for now.
- Respect reduce motion: route moments and step animations are skipped when it's on.

## Repo shape

Not created yet. Decide and record here (monorepo with `app/` and `server/`, or separate repos) before the first code lands.
