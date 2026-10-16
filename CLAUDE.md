# Waypoint

Mobile-first app that plans a whole trip in under five minutes: trip style → destination → spots & dates → day-by-day plan → flights → stay → summary, always steering to the best quality for the money.

**Architecture doc:** `docs/architecture.md` — system map, each service's routes and data, the user flow → backend calls, data model, failure handling, roadmap. Read it before adding a service, route or table, and update it in the same commit when one changes.

**Current phase: Phase 0 — Foundation.** What to build, in which order, and how several agents split the work: `docs/build-plan.md`. Work on one track at a time and stay inside its owned paths.

Shared engineering rules come from SAPI, mounted at `.claude/` (git submodule). This file supplies what SAPI leaves to each app (see the last section of `.claude/CLAUDE.md`). On app-specific details this file wins; on work culture and the engineering baseline, SAPI wins.

## Product rules that shape the code

- **Plan and compare only (years 1–2).** Waypoint never takes payment or books anything. Each part is booked on the partner site via a deep link: the chosen offer's own `deepLink`, from whichever provider supplied it (liteAPI's white-label site for flights and stays today), labelled with that site's name. Tickets link to official sites.
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
- **Database — decided:** **Supabase**-hosted Postgres, used as plain Postgres. **TypeORM** is the data layer: one `DataSource` per service, `@Entity` classes mapping its tables. Entity classes are the one deliberate exception to "no classes" — TypeORM's decorator mapping requires them — but nothing else about them is exceptional: a repository module (`repositories/*.repository.ts`) still takes the `DataSource` as a plain function argument and still returns plain objects, never an entity instance, past that file. TypeORM uses Supabase's pooled URL at runtime and the direct URL for migrations. The free plan pauses idle projects and has no backups: fine for development, upgrade before real users.
- **Auth — decided:** **Supabase Auth** — email, Google, Apple. Implementation in "Auth" below.
- **Cache — open:** Postgres first; add Redis (e.g. Upstash) only when measured load needs it.
- **Free-tier services first.**

## Architecture

- **Three layers:** mobile app → Waypoint backend → external services. **The app never calls outside sources directly** (sole exception: Supabase Auth sign-in, see Stack). Its only data server is the Waypoint backend, through `apiRequest()` and React Query (SAPI `react-query-server-interaction`).
- **Backend — one service:** `services/backend` (Express 5) serves the app: profiles, trips, geo reference data, hotels, flights. Layered routes → controllers → services → repositories / providers (see "Code conventions"). Split into more services only when a measured need appears. See "Repo shape".
- **Provider adapters:** see the contract below. Swapping or adding a source never touches anything outside that source's adapter folder and the provider list.
- **Day planning is deterministic:** the backend planner (`services/backend/src/services/planner/`) groups spots by area, respects opening hours, the pace and the flights, and times each day. An LLM may later write descriptions or make soft choices; keep it out of the algorithm so the algorithm stays testable without it.
- **Destinations at launch:** a curated list of 50–100 cities tagged by style.

## Auth (Supabase Auth — agreed implementation)

**App side**

- `shared/auth/supabase.ts` creates the one `supabase-js` client with the **publishable** key, `storage: AsyncStorage`, `autoRefreshToken`, `persistSession`, `detectSessionInUrl: false`, and starts/stops auto-refresh on `AppState` foreground/background. It is used for **auth calls only** — the single exception to "the app never calls outside sources directly". The app never reads or writes data through Supabase.
- **Email:** 6-digit code — `signInWithOtp({ email })` then `verifyOtp({ email, token, type: 'email' })`. No magic-link deep linking. (Email template must include `{{ .Token }}`.)
- **Apple / Google:** native sign-in (`expo-apple-authentication`, `@react-native-google-signin/google-signin`) returns an ID token, passed to `supabase.auth.signInWithIdToken({ provider, token })`. Apple sign-in is mandatory on iOS because Google is offered.
- Session state is a discriminated union (`loading | signed-out | signed-in`) from one `useSession` hook built on `getSession()` + `onAuthStateChange`. This is auth-client state, not server data, so it is not a React Query hook.
- `apiRequest()` reads the current session (`getSession()`) and sends `Authorization: Bearer <access_token>`.

**Server side**

- `requireUser` (`services/backend/src/middleware/requireUser.ts`) verifies the token **locally** with `jose`: `createRemoteJWKSet(<SUPABASE_URL>/auth/v1/.well-known/jwks.json)` + `jwtVerify` checking issuer `<SUPABASE_URL>/auth/v1` and audience `authenticated`. Missing/invalid → 401. On success `res.locals.userId = payload.sub`, and the user id joins the request's log context.
- Handlers trust only `res.locals.userId`, never a user id from the body or query.
- The project must use **asymmetric JWT signing keys** (ES256), not the legacy shared secret.
- Supabase owns the `auth` schema; TypeORM never migrates it. Waypoint's `Profile` is keyed by the Supabase user id (`userId` = `auth.users.id` = JWT `sub`) and is created with an `upsert` on the user's first authenticated request.
- Never ship the secret / `service_role` key in the app; only the publishable key goes in `EXPO_PUBLIC_*` env vars.
- Sign-out ends the session, but an issued access token stays valid until expiry (~1h). Acceptable for now; if instant revoke is needed, also check the token's `session_id` exists in `auth.sessions`.

## Provider adapter contract (agreed)

Every external offer source (hotels, flights, later tickets) follows this shape. Shown for hotels; flights mirror it (`FlightProvider`, same `searchAcross`).

```ts
// Waypoint's own shapes live in @waypoint/contracts; no provider type leaks past an adapter.
// ProviderHotelOffer = one offer from ONE provider (adapter output).
// HotelOffer        = one hotel after merging, with every provider's price in `sources` (API output).
// services/backend/src/providers/types.ts
export type HotelProvider = {
  readonly id: ProviderId
  readonly searchHotels: (query: HotelSearchRequest, signal: AbortSignal) => ProviderResult<readonly ProviderHotelOffer[]>
}  // ProviderResult<T> = Promise<Result<T, ProviderFailure>> — expected failures are returned, not thrown

// services/hotels.service.ts
const { offers, errors } = await searchAcross({ providers, call: (p, signal) => p.searchHotels(request, signal), timeoutMs, logger })
return ok({ offers: toHotelOffers(offers, request), errors })   // pure: ranked HotelOffer[]

// composition root (src/index.ts) — changing source = editing this list
providers: [createLiteApiHotelProvider(liteApiDeps)]
```

Rules:

1. **A provider is a record of functions, not a class.** One folder per provider (`src/providers/liteapi/`), exporting factory functions that return the types in `providers/types.ts` (`GeoSource`, `HotelCatalog`, `HotelProvider`, `FlightProvider`).
2. **Adapters translate.** Each adapter Zod-parses the raw response and maps it to Waypoint's `ProviderHotelOffer` / `ProviderFlightOffer`. Nothing outside the adapter folder imports provider types, SDKs or field names. Adapters parse, never cast.
3. **I/O only in adapters.** Mapping to offers, value scoring (`services/value.ts`) and — once a second source exists — matching the same hotel across providers (normalized name + distance threshold, lowest price wins) are pure functions with their own tests.
4. **One failing source never fails the search.** `searchAcross`: `Promise.allSettled` + a per-provider timeout; failures come back as typed `ProviderError`s beside the offers, so the UI can show partial results. Partial results are never cached.
5. **Two offer shapes, never mixed up.** Every `ProviderHotelOffer` / `ProviderFlightOffer` carries `provider`, `providerOfferId`, `price`, `checkedAt` (for "checked 3h ago") and `deepLink`. Merging turns them into `HotelOffer` / `FlightOffer`, which keep each provider's entry in `sources` (feeds "Where we found it") plus `bestPrice` and `value`. Only the merged shapes leave the service.
6. **Adapters are tested against a fake `fetch`** returning the sample trip (Tel Aviv → Lisbon, 12–16 May, 2 adults) in the provider's raw shape (`src/testing/sampleTrip.ts`), so tests need no API key. Running the server needs a liteAPI key (the sandbox key is free).
7. **Search only, for now.** Waypoint is plan-only, so `HotelProvider` has no prebook/book. If in-app booking is added later, it's a separate `HotelBookingProvider` type implemented only by sources that support it.
8. **Provider order never affects ranking.** Ranking is value-based only; paid placement is labelled "Sponsored".
9. Hotels and flights share `searchAcross`; geo lookups and the hotel catalog are single-source calls through the same liteAPI client.

## Data sources

- **Hotels — liteAPI (Nuitée):** the only hotel source for now. Aggregates 300+ suppliers into one API with live rates. Develop against the free sandbox key (test data, simulated bookings); production key needed before real users. Rate search is free under fair use — confirm their terms on search-heavy, booking-light usage before launch.
- **Flights — liteAPI Flights (Nuitée Connect):** live fares through `POST /flights/rates`, same key as hotels. Access is not on by default — ask Nuitée to enable it, for the sandbox too. The white-label deep-link format for flights is not documented yet; `offerCheckoutLink` uses the hotel `/booking?offerId=` entry until confirmed.
- **Geo — liteAPI data endpoints:** countries, cities of a country, places (Google Places, **paid per call** — always cached), airports, and the city hotel price index (`/prices/city`, USD, an estimate).
- **liteAPI is the only source for now.** Travelpayouts / Aviasales is not used.
- **Travelpayouts has no hotel data:** Hotellook closed in October 2025 and its API is disabled. Do not use it.
- **Apply for (approval/contract required):** Booking.com Demand API (managed affiliate), Agoda Demand API (meta-search model), Expedia Rapid, Aviasales Search API, Kiwi.com, Skyscanner (needs traffic). Each becomes one new adapter when approved.
- **Airbnb:** no public API — link-out only, no prices.
- **Amadeus Self-Service API shut down in July 2026. Do not use it.**
- Candidates: OpenTripMap / Foursquare (spots), OpenRouteService (travel times), MapLibre (maps), Open-Meteo (weather), GetYourGuide / Tiqets affiliate (tickets).

## Design

- **The design lives in the repo: `docs/design/`.** Start with `docs/design/README.md` — it says which file answers what, indexes every screen, and lists where newer decisions override the design.
  - `docs/design/system/` — brand book (`README.md`), `tokens.json` (every token with a usage note), and per-component guidelines + HTML previews.
  - `docs/design/screens/` — every MVP screen as an HTML artboard (layout, copy, states).
  - The originals are claude.ai artifacts (design system https://claude.ai/artifact/LnbFzgyfppQa7tCfgwSNjH, canvas https://claude.ai/artifact/Kx6eZ4tJXEX7g6JnFpGYiG); the repo copy is what you build from.
- The design files are **web markup**: a visual spec to rebuild in React Native, never CSS to port.
- Key tokens: `midnight-900` `#1E2A5A` primary; `sunshine-400` `#FFC83D` only means "best value" (a fill with `ink` text, never text on light); `surface` `#FAF8F4`; `ink` `#121726`; `ink-muted` `#5E5A55`; `savings` `#1D7A50`; `danger` `#C2362C`; `warning` `#A15C00`. Plus Jakarta Sans only; prices use tabular numerals. Full set and usage: `docs/design/system/tokens.json`.
- Voice: a competent friend ("we found…"), sentence case, no emoji. Light theme and English only for now.
- Respect reduce motion: route moments and step animations are skipped when it's on.

## Styling (Unistyles 3)

- **Tokens are the theme.** `src/theme/tokens.ts` mirrors `docs/design/system/tokens.json` name for name (colors, type styles, space, radius, shadow, size) as plain `as const` data. `src/theme/unistyles.ts` registers them with `StyleSheet.configure` and augments `UnistylesThemes` / `UnistylesBreakpoints` so the theme is fully typed. Only `light` exists for now; dark is added as a second theme object later.
- **Never hard-code a design value.** Colors, spacing, radii and font settings always come from `theme.*`. A literal hex code or spacing number in a component is a bug — add a token instead.
- **Styles live with their component**, via `StyleSheet.create((theme, rt) => ({ ... }))` imported from `react-native-unistyles` (not `react-native`).
- **Component states are variants**, activated with `styles.useVariants({...})`; variant names double as the prop's literal-union type. Use `compoundVariants` for combinations instead of conditional style merging.
- **Data-dependent styles are functions** inside the stylesheet (`card: (isSelected: boolean) => ({...})`), called as `styles.card(isSelected)`. No inline style objects built in render.
- **Device info comes from `rt`** (safe-area insets, font scale, screen) and breakpoints (`{ xs, md }`) inside the stylesheet — not from extra hooks in the component.
- **Accessibility:** touch targets ≥ 44 (`minHeight: 44`); font sizes respect `rt.fontScale` (cap where layout would break); prices use `theme.font.tabular`.
- **Shared design-system components** (Button, Chip, Badge, Input, Route, OfferCard, TripSummaryBar) live in `shared/components/`, each built from `docs/design/system/components/<Name>/` (guidelines + preview). Variants and props follow the guideline's names (`kind: 'primary' | 'secondary' | 'ghost'`, `--best` → `isBestValue`, …). Pieces two offer steps share (OfferSources for "Where we found it", DetailRows for an offer's terms) live there too, made from the screen frames.
- **Icons:** `lucide-react-native`, 1.75 stroke, 20/24 px, in `ink` / `ink-muted` (`on-midnight` on midnight fills). No emoji.


## Repo shape (decided: monorepo, one backend service for now)

```
waypoint/
  .claude/                SAPI submodule (shared Claude Code config)
  CLAUDE.md               this file
  docs/                   architecture.md · build-plan.md · design/ (design system + screens)
  supabase/               local Supabase stack config (CLI)
  package.json            npm workspaces: apps/*, services/*, packages/*
  apps/
    mobile/               Expo app (React Native, Unistyles, React Query)
      src/features/<name>/{components,hooks,utils}
      src/shared/         cross-feature components/hooks/utils, apiClient, auth
      src/theme/          tokens.ts + unistyles.ts
  services/
    backend/              the one Express 5 API: profiles, trips, geo, hotels, flights, liteAPI adapter
  packages/
    contracts/            @waypoint/contracts — Zod schemas + inferred types for every API shape
```

**Backend**

- **One service, `services/backend`**, deployed on its own, exposing an HTTP API and nothing else. Its own `CLAUDE.md` has the layer map.
- Auth, request ids, logging and error handling live inside it (`middleware/`, `observability/`, `http/`). If a second service is ever added, move the shared plumbing into a package then — not before.
- `GET /health` is public; every other route is behind `requireUser`.

**Data**

- One Supabase Postgres; the backend uses its own schema (`DATABASE_SCHEMA`, default `backend`) with its own TypeORM entities and migrations (`npm run migrate -w services/backend`). Supabase's `auth` schema belongs to Supabase.
- Provider answers are cached in the `cache_entries` table (Postgres first; Redis only when measured load needs it).

**Packages**

- `@waypoint/contracts` is the single definition of every API shape, per area (`common`, `trips`, `geo`, `hotels`, `flights`). The backend validates against it; the app's `apiRequest()` parses responses with it. Pure: Zod schemas, types and tiny pure helpers (`ok`, `err`, `assertNever`); no I/O, no framework imports.
- Provider-specific types (liteAPI) live only inside `services/backend/src/providers/liteapi/` — never in `packages/`.
- Code moves into a package only once two or more services/apps need it.

**App ↔ backend**

- The app calls `services/backend` directly (`EXPO_PUBLIC_API_URL`). `apiRequest(path, schema, init)` attaches the bearer token and an `x-request-id`, parses with the contract, and throws a typed `ApiError` otherwise.

**Tooling & deployment**

- **npm workspaces** only. No Turborepo/Nx until build times prove a need.
- The backend builds with `tsup` (bundling `@waypoint/contracts`) into `dist/` and deploys on its own (Railway/Render). Run `migrate:prod` before starting a new version. Every running service costs money — keep it at one until a split is clearly justified.
- Paths in other sections (e.g. `src/theme/`, `hotels/`) are relative to the app or service they belong to.

## Local development (default: fully offline)

Development runs against a **local Supabase stack** and the **liteAPI sandbox** (free key, test data).

- **Supabase CLI** is a root dev dependency (`npx supabase …`); config lives in `supabase/config.toml`. Docker must be running.
  - `npx supabase start` starts Postgres, Auth, Studio and a local email inbox. `npx supabase stop` stops it and keeps the data.
  - Default local addresses: API + Auth `http://127.0.0.1:54321` · Postgres `postgresql://postgres:postgres@127.0.0.1:54322/postgres` · Studio `http://127.0.0.1:54323` · email inbox `http://127.0.0.1:54324`. Take keys from `npx supabase status`, never hard-code them.
- **Database:** `DATABASE_URL` points at local Postgres, `DATABASE_SCHEMA=backend`. Migrations are TypeORM's, run with `npm run migrate -w services/backend` (creates the schema if missing); the Supabase CLI runs the database but does not own Waypoint's migrations.
- **Auth:** email login codes land in the local inbox, not real email. `requireUser` works unchanged — only `SUPABASE_URL` differs (local Auth serves its own JWKS). Google and Apple sign-in need the internet; use email login offline.
- **Providers:** liteAPI only — `LITEAPI_KEY` (sandbox key locally) and `LITEAPI_WHITELABEL_URL` (the white-label booking site deep links open — optional outside production, where links fall back to a placeholder; required in production). Tests never call liteAPI; they use a fake `fetch`.
- **Env:** the backend and the app each have a committed `.env.example` with the local defaults; real `.env` / `.env.local` files are git-ignored. Env vars are parsed with Zod at startup (`services/backend/src/env.ts`), and the backend refuses to start with a missing or invalid value.
- **Phone vs simulator:** the iOS simulator can use `127.0.0.1`. A real phone can't — point `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_API_URL` at the computer's local network IP.
- **Port:** the backend listens on 4002 locally (`.env.example`).

## Toolchain (decided defaults — change here, not ad hoc)

- **Node 24 LTS** (`.nvmrc`), **npm workspaces**, ESM everywhere (`"type": "module"`).
- **TypeScript:** root `tsconfig.base.json` with SAPI's strict flags (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`). Services and packages extend it (`module`/`moduleResolution: NodeNext`); the app extends `expo/tsconfig.base` and adds the same strict flags.
- **Packages are consumed as TypeScript source** (no build step for `packages/*`); Metro and the services' bundler compile them.
- **Services:** run in dev with `tsx watch`; built for deploy with `tsup` (bundles workspace packages) into `dist/`. HTTP tests with `supertest` against `createApp(deps)` (no port).
- **Tests:** **Vitest** for services and packages; **jest-expo** + `@testing-library/react-native` for the app. Tests sit next to the file (`logic.test.ts`).
- **Lint/format:** ESLint 9 flat config with `typescript-eslint` (strict, type-checked) at the root, Prettier for formatting. Lint never fights Prettier (`eslint-config-prettier`).
- **App navigation:** **Expo Router** (file-based, `apps/mobile/app/`).
- **Validation:** Zod everywhere (contracts, env, provider responses).
- **Root scripts:** `npm run dev` (all services + local Supabase check, via `concurrently`), `npm run typecheck`, `npm run lint`, `npm test`, `npm run format`. Each workspace has the same script names so `npm run <script> --workspaces --if-present` works.
- Use the latest stable version of each tool at setup time and pin it exactly in `package.json`. For the app, take versions from `npx expo install` (SDK-compatible), then pin.
- **One React copy:** `react` / `react-dom` are pinned at the root to the Expo SDK's version — npm hoists peer dependencies to the newest release otherwise, and two Reacts break hooks.
- **TypeScript 6** no longer includes every `@types/*` package by default; list what a workspace needs in `types`.

## Code conventions

**Inside the backend** (`services/backend/`) — layered, one direction only:

```
src/
  index.ts          composition root ONLY: parseEnv → logger → DataSource → liteAPI adapters → services → createApp(deps) → listen
  app.ts            createApp(deps): middleware, health, API routers, 404, error handler — no listen, no env reads (tests use it)
  env.ts            Zod env schema
  routes/           <area>.routes.ts — path + method → controller handler; index.ts puts the API behind requireUser
  controllers/      <area>.controller.ts — parse input with the contract schema → call one service → sendResult. No logic.
  services/         <area>.service.ts — orchestration, returns Result<T, ServiceError> (never HTTP);
                    *.logic.ts / value.ts — pure rules: no I/O, no Date.now() (pass `now` in), fully unit-tested
  repositories/     TypeORM reads/writes only; returns contract types, never an entity instance
  providers/        types.ts (Waypoint's provider interfaces), searchAcross.ts, one folder per provider (liteapi/)
  entities/ db/     TypeORM entities, data source, migrations
  middleware/ http/ observability/   auth, request context, access log, errors, validation, logger, traced fetch
  lib/              small pure helpers (money, dates, distance, stable keys)
  testing/          test-only helpers (fake fetch, test JWKS, log capture, sample data)
  *.test.ts         next to what they test
```

- **Dependencies are function arguments**, never module-level singletons or a container: `createTripsService({ trips, now })`, `createTripsController(tripsService)`. That's how tests swap in fakes.
- `ServiceError` (`services/errors.ts`) → HTTP status happens in one place: `http/respond.ts`.
- **Logging:** use the injected `logger`; never pass request ids by hand — the request context adds `requestId` / `userId` to every line. Log an `Error` through `serializeError`. Never log tokens, keys, query strings or bodies.

**Inside the app** (`apps/mobile/`):

```
app/                         Expo Router routes — thin, each renders one feature screen
src/features/<feature>/
  components/                presentational + the feature's screen orchestrator
  hooks/                     use<Feature>.ts — React Query hooks (server data) and local UI state
  utils/                     <feature>Api.ts (typed calls via apiRequest) + pure helpers
src/shared/{components,hooks,utils,auth}
src/theme/{tokens.ts,unistyles.ts}
```

**Result type** — the one way to return an expected failure (SAPI `clean-code-fp-principles` §5). Lives in `@waypoint/contracts` (`common/result.ts`) and is used by every service and the app:

```ts
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })
```

- Error types are discriminated unions with a `type` field (`{ type: 'not-found' } | { type: 'provider-timeout'; provider: ProviderId }`); every `switch` on them ends in `assertNever`.
- `throw` only for programmer errors and broken invariants; the backend's error handler (`middleware/errorHandler.ts`) turns those into a 500 and logs them with the request id.
- **HTTP error body**, defined in contracts and used by every service: `{ "error": { "code": "<kebab-case>", "message": "<human sentence>" } }`. Routes map each error `type` to a status explicitly.
- **Money** is `{ amountMinor: number; currency: 'EUR' | … }` (integer minor units), never a float. **Dates** cross the wire as ISO strings, validated by Zod.

## Context map

One `CLAUDE.md` per module, at that module's own root, saying what it is responsible for, what it must not do, and what crosses its boundaries. Read the one for the module you're touching instead of the whole repo — and update it in the same commit when its role, boundaries or connections change.

- `packages/contracts/` — every API shape, as Zod schemas plus the shared `Result` / `Money` / error-body primitives. → its own `CLAUDE.md`.
- `services/backend/` — the one API: layers, tracing, caching, ranking, liteAPI adapter. → its own `CLAUDE.md`.
- `apps/mobile/` — the app: routes, theme, shared design-system components, features, data flow. → its own `CLAUDE.md`.
