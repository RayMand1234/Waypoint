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
- **App — decided:** React Native (Expo), New Architecture, run as an Expo **development build** (not Expo Go — Unistyles ships native code).
- **Styling — decided:** **Unistyles 3**. No MUI, no Tamagui, no NativeWind, no third-party pre-styled component kits — Waypoint's components are our own, built from the design system. Rules in "Styling" below.
- **Backend — decided:** Node + **Express** (v5). Route handlers are plain functions, no classes, no DI container. Validate request input with Zod at the handler boundary.
- **Database — decided:** **Supabase**-hosted Postgres, used as plain Postgres. **Prisma** is the data layer (schema file, generated client, plain-object results; no TypeORM, no decorator entities). Prisma uses Supabase's pooled URL at runtime and the direct URL for migrations. The free plan pauses idle projects and has no backups: fine for development, upgrade before real users.
- **Auth — decided:** **Supabase Auth** — email, Google, Apple. Implementation in "Auth" below.
- **Cache — open:** Postgres first; add Redis (e.g. Upstash) only when measured load needs it.
- **Free-tier services first.**

## Architecture

- **Three layers:** mobile app → Waypoint backend → external services. **The app never calls outside sources directly** (sole exception: Supabase Auth sign-in, see Stack). Its only data server is the Waypoint backend, through `apiRequest()` and React Query (SAPI `react-query-server-interaction`).
- **Backend domains:** accounts & trips, trip planner, search aggregator, value scoring, cache & background jobs. One folder per domain.
- **Provider adapters:** see the contract below. Swapping or adding a source never touches anything outside that source's adapter folder and the provider list.
- **Day planning is hybrid:** a deterministic algorithm handles area grouping, opening hours and travel times; an LLM only picks spots for the traveler's styles and writes descriptions. Keep the two separate so the algorithm stays testable without the LLM.
- **Destinations at launch:** a curated list of 50–100 cities tagged by style.

## Auth (Supabase Auth — agreed implementation)

**App side**

- `shared/auth/supabase.ts` creates the one `supabase-js` client with the **publishable** key, `storage: AsyncStorage`, `autoRefreshToken`, `persistSession`, `detectSessionInUrl: false`, and starts/stops auto-refresh on `AppState` foreground/background. It is used for **auth calls only** — the single exception to "the app never calls outside sources directly". The app never reads or writes data through Supabase.
- **Email:** 6-digit code — `signInWithOtp({ email })` then `verifyOtp({ email, token, type: 'email' })`. No magic-link deep linking. (Email template must include `{{ .Token }}`.)
- **Apple / Google:** native sign-in (`expo-apple-authentication`, `@react-native-google-signin/google-signin`) returns an ID token, passed to `supabase.auth.signInWithIdToken({ provider, token })`. Apple sign-in is mandatory on iOS because Google is offered.
- Session state is a discriminated union (`loading | signed-out | signed-in`) from one `useSession` hook built on `getSession()` + `onAuthStateChange`. This is auth-client state, not server data, so it is not a React Query hook.
- `apiRequest()` reads the current session (`getSession()`) and sends `Authorization: Bearer <access_token>`.

**Server side**

- `requireUser` Express middleware verifies the token **locally** with `jose`: `createRemoteJWKSet(<SUPABASE_URL>/auth/v1/.well-known/jwks.json)` + `jwtVerify` checking issuer `<SUPABASE_URL>/auth/v1` and audience `authenticated`. Missing/invalid → 401. On success `res.locals.userId = payload.sub`.
- Handlers trust only `res.locals.userId`, never a user id from the body or query.
- The project must use **asymmetric JWT signing keys** (ES256), not the legacy shared secret.
- Supabase owns the `auth` schema; Prisma never migrates it. Waypoint's `Profile` is keyed by the Supabase user id (`userId` = `auth.users.id` = JWT `sub`) and is created with an `upsert` on the user's first authenticated request.
- Never ship the secret / `service_role` key in the app; only the publishable key goes in `EXPO_PUBLIC_*` env vars.
- Sign-out ends the session, but an issued access token stays valid until expiry (~1h). Acceptable for now; if instant revoke is needed, also check the token's `session_id` exists in `auth.sessions`.

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

## Styling (Unistyles 3)

- **Tokens are the theme.** `src/theme/tokens.ts` holds the design-system tokens as plain `as const` data (colors, space, radius, font). `src/theme/unistyles.ts` registers them with `StyleSheet.configure` and augments `UnistylesThemes` / `UnistylesBreakpoints` so the theme is fully typed. Only `light` exists for now; dark is added as a second theme object later.
- **Never hard-code a design value.** Colors, spacing, radii and font settings always come from `theme.*`. A literal hex code or spacing number in a component is a bug — add a token instead.
- **Styles live with their component**, via `StyleSheet.create((theme, rt) => ({ ... }))` imported from `react-native-unistyles` (not `react-native`).
- **Component states are variants**, activated with `styles.useVariants({...})`; variant names double as the prop's literal-union type. Use `compoundVariants` for combinations instead of conditional style merging.
- **Data-dependent styles are functions** inside the stylesheet (`card: (isSelected: boolean) => ({...})`), called as `styles.card(isSelected)`. No inline style objects built in render.
- **Device info comes from `rt`** (safe-area insets, font scale, screen) and breakpoints (`{ xs, md }`) inside the stylesheet — not from extra hooks in the component.
- **Accessibility:** touch targets ≥ 44 (`minHeight: 44`); font sizes respect `rt.fontScale` (cap where layout would break); prices use `theme.font.tabular`.
- **Shared design-system components** (Button, Chip, Badge, Input, Route, OfferCard, TripSummaryBar) live in `shared/components/`, each matching the design system artifact.

## Repo shape

Not created yet. Decide and record here (monorepo with `app/` and `server/`, or separate repos) before the first code lands.
