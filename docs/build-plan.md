# Waypoint — build plan (Phase 0 and Phase 1)

How to build the first version with several Claude Code agents working in parallel. Each **track** is one agent's job: it owns a set of paths, has a clear done-state, and merges on its own. Tick the boxes as tracks merge.

Read first, every track: `CLAUDE.md` → `docs/architecture.md` → `docs/design/README.md` (UI tracks) → this file's section for your track.

## Rules for parallel agents

1. **One agent = one track = one git worktree + branch** named `track/<id>` (e.g. `track/p0-b-trips`). Start from the latest `main`.
2. **Edit only the paths your track owns.** Need something in another track's paths? Stop and say what you need; don't edit it.
3. **`packages/contracts` is shared and additive.** Add new schemas and exports freely in your own area (`contracts/src/<service>/`). Changing or removing an existing schema breaks other tracks: stop and ask.
4. **Root files** (`package.json`, `package-lock.json`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc`, `supabase/`) belong to track P0-A. Other tracks add dependencies only to their own workspace: `npm i <pkg> -w <workspace>`. On a lockfile merge conflict, take `main`'s `package-lock.json` and run `npm install` again.
5. **Contracts before consumers.** A service track merges its `contracts/src/<service>/` schemas first, as a small PR, so UI tracks can build against them (and against the fake data) right away.
6. **Done means:** `npm run typecheck`, `npm run lint` and `npm test` pass from the root; `/quality-check` has run on the diff and its findings are fixed or listed in the PR; the folder's context file is created or updated (SAPI `feature-context`); `docs/architecture.md` is updated in the same PR if a route, table or service call changed; the box below is ticked.
7. **Small PRs, merged often.** Rebase on `main` before opening one.
8. **Offline by default.** Local Supabase + fake providers (`CLAUDE.md`, "Local development"). No track needs a real API key.

**Prompt to start an agent on a track:**

> Read `CLAUDE.md`, `docs/architecture.md` and `docs/build-plan.md`. You are working on track **<id>** only, in branch `track/<id>`. Follow that track's scope, owned paths and done-state exactly. Plan first, then build, then run the done checks and open a PR.

---

## Phase 0 — Foundation

**Goal:** on a simulator, a traveler logs in with an email code against local Supabase, lands on Home, and sees their trips loaded from the `trips` service. Every later track builds on this.

```
P0-A ──► P0-B (trips service)
     └─► P0-C1 (app scaffold) ──► P0-C2 (design-system components)
                              └─► P0-C3 (auth + home)
```

### P0-A · Repo foundation — one agent, merges first, blocks everything

- [x] Root: `package.json` (workspaces `apps/*`, `services/*`, `packages/*`; root scripts per `CLAUDE.md` Toolchain), `.nvmrc`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc`, `.editorconfig`, `.gitignore` (env files, `dist`, `node_modules`, Expo and TypeORM build artifacts).
- [x] `npx supabase init`: `supabase/config.toml` with email OTP sign-in on and the email template including `{{ .Token }}`; note asymmetric signing keys.
- [x] `packages/contracts` (`@waypoint/contracts`): `common/` — `Result`, `ok`, `err`, `assertNever`, `Money`, `ProviderId`, ISO date schema, the HTTP error body; `trips/` — `Profile`, `Trip`, trip status, picks, `TripDay`, `TripStop`, `TripSelection`, and every request/response schema for the trips routes in `docs/architecture.md` §3.
- [x] `packages/server-kit` (`@waypoint/server-kit`): `parseEnv(schema)`, `requireUser` (jose + JWKS, per `CLAUDE.md` Auth), `requireService` (`INTERNAL_API_KEY`), `requestId` (`x-request-id` in and forwarded), `errorHandler`, `notFound`, `healthRoute`, `createServiceClient` (timeout + Zod parse + `Result`, forwards bearer token and request id).
- [x] Tests: server-kit's `requireUser` against a locally generated ES256 key served as a JWKS stub; `serviceClient` timeout and parse-failure paths.
- **Owns:** root files, `supabase/`, `packages/**`.
- **Done when:** `npm install && npm run typecheck && npm run lint && npm test` pass on a clean clone.

### P0-B · `trips` service — after P0-A

- [ ] `services/trips` per `CLAUDE.md` Code conventions; port 4001; `.env.example` with local defaults.
- [ ] TypeORM entities for the `trips` schema exactly as `docs/architecture.md` §5 (Profile, Trip, TripSpot, TripDay, TripStop, TripSelection); first migration.
- [ ] Routes from `docs/architecture.md` §3 (`/me`, `/trips`, `/trips/:id`, `/plan`, `/selections/:kind`, `…/booked`), all behind `requireUser`, every query scoped to `res.locals.userId`. `GET /me` upserts the profile on first call.
- [ ] Tests: pure logic (status transitions, ownership checks); routes via supertest with signed test tokens; another user's trip returns 404, never 403.
- **Owns:** `services/trips/**`; may add to `packages/contracts/src/trips/` additively.
- **Done when:** with local Supabase running, a token from the local email login can create, read, update and delete a trip.

### P0-C1 · App scaffold — after P0-A

- [ ] `apps/mobile`: Expo app (New Architecture, development build), Expo Router routes for every screen in `docs/design/README.md` (placeholders except where later tracks fill them): login, home, steps 1–6, route moment, summary, trip planned.
- [ ] Theme: `src/theme/tokens.ts` mirroring `docs/design/system/tokens.json` name for name; `src/theme/unistyles.ts` (typed theme, breakpoints). Plus Jakarta Sans loaded (400–800).
- [ ] React Query provider; `src/shared/utils/apiClient.ts` — `apiRequest(service, path, schema, init)` with base URLs from `EXPO_PUBLIC_*_URL`, bearer token, `x-request-id`, Zod parse, typed error.
- [ ] `.env.example` with local URLs; jest-expo configured with one passing smoke test.
- **Owns:** `apps/mobile/**` except `src/shared/components/**`, `src/features/auth/**`, `src/features/home/**`.
- **Done when:** the dev build launches on the iOS simulator and every route renders its placeholder.

### P0-C2 · Design-system components — after P0-C1

- [ ] `src/shared/components/`: Button, Chip, Badge, Input, OfferCard, TripSummaryBar, Route — each from `docs/design/system/components/<Name>/` (guideline + preview + `bundle.css`), Unistyles variants, tokens only, ≥ 44 pt touch targets, accessibility roles and labels.
- [ ] Route: the 7-checkpoint road with labels for passed steps and the marker animation; reduce motion shows the end state.
- [ ] A dev-only gallery screen showing every component in every variant (sample data), for visual review.
- [ ] Tests: each component renders each variant; Badge `value` and OfferCard `isBestValue` follow their rules.
- **Owns:** `apps/mobile/src/shared/components/**`, the gallery route.
- **Done when:** the gallery matches the previews in `docs/design/system/components/*/preview.html` side by side.

### P0-C3 · Auth and Home — after P0-C1 (in parallel with P0-C2; uses plain placeholders until C2 merges)

- [ ] `src/shared/auth/supabase.ts`, `useSession` (discriminated union), sign-in screen: email → 6-digit code (per `CLAUDE.md` Auth); Google and Apple buttons wired to native sign-in (can be tested online only).
- [ ] Root layout routes by session state: signed-out → login, signed-in → home.
- [ ] Home per `docs/design/screens/Home.dc.html`: "Create a waypoint" card (creates a draft trip, goes to step 1), list of the user's trips from `trips` (draft / booked / past), draft resumes at its step.
- **Owns:** `apps/mobile/src/features/auth/**`, `src/features/home/**`, `src/shared/auth/**`, and the login/home route files.
- **Done when:** the Phase 0 goal above works end to end on the simulator, offline.

---

## Phase 1 — MVP on fake + sandbox data

**Goal:** the whole flow — style → destination → spots & dates → day plan → flights → stay → summary → trip planned — works end to end with fake providers, and switching `HOTEL_PROVIDERS=liteapi` shows real sandbox hotels.

```
Phase 0 merged
  ├─► P1-A search  (contracts first) ─┐
  ├─► P1-B planner (contracts first) ─┼─► P1-D steps 1–3 + route moment
  │                                   ├─► P1-E steps 4–6
  │                                   └─► P1-F summary + trip planned
  └─► P1-C jobs (last, smallest)
```

### P1-A · `search` service

- [ ] Contracts first (`contracts/src/search/`): `HotelQuery`, `FlightQuery`, `ProviderHotelOffer`, `ProviderFlightOffer`, `HotelOffer`, `FlightOffer` (with `sources`, `bestPrice`, `value`, `distanceToStops`), `ProviderError`, search request/response, estimates. Merge as its own PR.
- [ ] Hotels: `HotelProvider` contract, `fake/` (sample Lisbon stays, two pseudo-providers so "Where we found it" has rows), `liteapi/` adapter against the sandbox, `searchAllHotels`, `mergeSameHotel`, `rankByValue` (pure, tested), distance to stops, `POST /hotels/search`.
- [ ] Flights: same shape — `fake/`, `aviasales/` (Data API; RUB→EUR conversion behind a `fxRates` dependency, fake rates in dev), `POST /flights/search`.
- [ ] Shared provider contract test every adapter runs; offer cache in the `search` schema; `GET /internal/estimates`.
- **Owns:** `services/search/**`, `packages/contracts/src/search/**`.

### P1-B · `planner` service

- [ ] Contracts first (`contracts/src/planner/`): destinations, spots, plan request/response, swap.
- [ ] Curated destinations seed (start with 10 cities including Lisbon, tagged by style and best months).
- [ ] Spots with `fake/` provider (OpenTripMap adapter optional); travel times with a fake (straight-line distance ÷ walking speed) behind the same interface as OpenRouteService.
- [ ] Day-plan algorithm, pure and heavily tested: group by area, respect opening hours and pace, order stops, travel time between them, fixed items. LLM text step behind `LLM_PROVIDER` with a `fake/` returning fixed descriptions.
- [ ] Routes from `docs/architecture.md` §3; destinations call `search` `/internal/estimates` via the service client (degrade to "no estimate" on failure).
- **Owns:** `services/planner/**`, `packages/contracts/src/planner/**`.

### P1-C · `jobs` service

- [ ] Scheduler process with `/health`, `requireService` calls to `search` and `planner` internal routes, `JobRun` log table. Tasks: refresh popular flight prices, refresh spots, delete expired cache rows.
- **Owns:** `services/jobs/**`. Lowest priority; can start any time after P1-A and P1-B contracts merge.

### P1-D · App: steps 1–3 and the route moment

- [ ] Step 1 Trip style, step 2 Destination, step 3 Spots & dates per their `docs/design/screens/*.dc.html`; each step saves picks to `trips` (`PATCH /trips/:id`).
- [ ] Route moment (`RouteMoment.dc.html`): full-screen map, three task lines ticking, Continue when the next step's query has resolved; it prefetches the next step with React Query; reduce motion = no animation.
- **Owns:** `src/features/{trip-style,destination,spots-dates,route-moment}/**` and their route files.

### P1-E · App: steps 4–6

- [ ] Day plan (tabs, timeline, swap, fixed items dashed), Flights (offer cards, filter chips, details sheet with "Where we found it" and price age), Stay (Cheapest / Best value / Top quality, distance to stops, details sheet with gallery).
- [ ] "Where we found it" hidden when an offer has a single source.
- **Owns:** `src/features/{day-plan,flights,stay,offer-details}/**` and their route files.

### P1-F · App: summary and trip planned

- [ ] Summary per `Summary.dc.html` with the "Go to booking" change from `docs/design/README.md`; Trip planned per `Booked.dc.html`: each part's deep link (opens the partner site), the booked tick saved to `trips`, price age and "final price confirmed on site".
- **Owns:** `src/features/{summary,trip-planned}/**` and their route files.

**Phase 1 done when:** a fresh simulator, offline, can go from login to Trip planned for the sample Lisbon trip; with `HOTEL_PROVIDERS=liteapi` and a sandbox key, the Stay step shows real sandbox hotels merged with the fake ones.
