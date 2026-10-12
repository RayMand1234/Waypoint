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

**Status: proposed, not confirmed.** Before adding a framework, service or dependency that locks one of these in, ask.

- **Language:** TypeScript, `strict`, end to end.
- **App:** React Native (Expo).
- **Backend:** Fastify or Hono (not yet chosen). Functional style: route handlers are plain functions, no classes, no DI container, no NestJS.
- **Auth + database:** Supabase (Postgres) is the leading option; a fully custom server is still on the table.
- **Cache:** Upstash Redis (candidate).
- **Free-tier services first.**

## Architecture

- **Three layers:** mobile app → Waypoint backend → external services. **The app never calls outside sources directly.** Its only server is the Waypoint backend, through `apiRequest()` and React Query (SAPI `react-query-server-interaction`).
- **Backend domains:** accounts & trips, trip planner, search aggregator, value scoring, cache & background jobs. One folder per domain.
- **Provider adapters:** each data source sits behind one shared function signature, e.g. `searchFlights(query) → Promise<FlightOffer[]>`. Adding a source = one new adapter file + one line in the source list. Results from all sources are fetched with `Promise.allSettled`, deduplicated, kept at the lowest price per offer, then value-scored. One failing source never fails the search.
- **Adapters parse, never cast.** Every provider response is schema-validated into Waypoint's own types at the adapter boundary.
- **Day planning is hybrid:** a deterministic algorithm handles area grouping, opening hours and travel times; an LLM only picks spots for the traveler's styles and writes descriptions. Keep the two separate so the algorithm stays testable without the LLM.
- **Destinations at launch:** a curated list of 50–100 cities tagged by style.

## Data sources

- Travelpayouts (flights, hotels): realistic free start; much of its data is cached, not live.
- Booking.com Demand API, Skyscanner, Expedia Rapid: partner approval required. Not available yet.
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
