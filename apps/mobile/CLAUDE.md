# apps/mobile

**Role:** the Waypoint app (Expo SDK 57, React Native, Expo Router, Unistyles 3, React Query, React Hook Form). Built so far: design-system components, email-code sign-in (Google / Apple wired, shown only when configured), Home with the traveler's trips, Profile (name, home airport, currency), Explore placeholder, and all six planning steps (Trip style, Destination + departure airport, Spots & dates, Stay near the spots, Flights, Day plan). Summary and Trip planned are still placeholders.

**Must not:** call any outside service except Supabase Auth (sign-in only) — all data goes through `services/backend` via `apiRequest()`; call `fetch` anywhere but `src/shared/utils/apiClient.ts`; keep server data in `useState` (React Query only); hard-code a design value (colors, spacing, type, radii — use `theme.*`); use sunshine for anything but best value.

**Layout**

| Path | What |
|---|---|
| `app/` | Expo Router routes. Each file only re-exports one feature screen or layout. |
| `src/theme/` | `tokens.ts` mirrors `docs/design/system/tokens.json` name for name (+ a labelled group of component sizes the CSS uses but tokens.json doesn't name); `unistyles.ts` registers the theme. |
| `src/shared/components/` | Text, Button, Chip, Badge, Input, OfferCard, TripSummaryBar, Route, Screen. |
| `src/shared/{auth,utils,hooks,providers}` | Supabase client + session context, `apiRequest` / `ApiError` / query client / formatting, Route motion + geometry, app providers. |
| `src/features/<name>/{components,hooks,utils}` | `shell` (root stack with auth guards, fonts, splash, tab bar), `auth`, `home`, `profile`, `explore`, `trip-flow` (step model, `StepLayout` / `StepFooter`, `useTrip` / `useUpdateTrip`, step navigation, Route picks), one feature per built step (`trip-style`, `trip-destination`, `trip-spots`, `trip-stay`, `trip-flights`, `trip-plan`; steps run style → destination → spots → stay → flights → day plan), `route-moment` (the full-screen trip map between steps at `/trip/[id]/moment?step=N`; steps call `navigation.finish(step)`, the moment prefetches the next step's data and replaces itself with that step), `gallery` (dev only). Import a feature only through its `index.ts`. Step screens read the trip id with `useTripParams()` (checked, never assumed). Wording, dates and plurals come from `shared/utils/{text,dates,format}.ts`. |

**Data flow:** component → `use<X>` hook (`useQuery` / `useMutation`) → `utils/<x>Api.ts` → `apiRequest(path, contractSchema)` → backend. Every query key comes from `src/shared/utils/queryKeys.ts`. A resource read from more than one place has one `queryOptions` definition (`spotsQuery`, `destinationQuery`, `meQuery`, `staySearchQuery`, `flightSearchQuery`) that its hook and any prefetch share; a prefetch warms it with `warmQuery`. Missing ids use `skipToken`, not a dummy key with `enabled: false`. Mutations update the cache (`setQueryData` when the response is the fresh resource, else `invalidateQueries`). Sign-out clears the cache.

**Steps:** each step is a feature whose screen loads the trip (`useTrip`), then renders a form (React Hook Form + the step's Zod schema, defaults from the saved trip) inside `StepLayout`; Continue saves with `useUpdateTrip` and moves on with `useStepNavigation`. A step route is added to `app/trip/[id]/`, to `stepHref`, and to the guarded `RootStack`. Pickers open in the shared `Sheet`; dates use the in-app calendar (no native date picker → no rebuild).

**Auth:** `SessionProvider` holds `loading | signed-out | signed-in` (auth-client state, not React Query). `RootStack` uses `Stack.Protected` — signed out only reaches `sign-in`; signing in or out moves screens by itself. `apiRequest` sends the access token and an `x-request-id`.

**Rules of thumb:** components ≤ 250 lines and one job (screens orchestrate, the rest render props); logic in hooks; pure helpers in `utils/` with tests; forms are React Hook Form + the Zod schema in the feature's `utils/`.

**Run:** `cp .env.example .env.local` (fill the publishable key from `npx supabase status`), then a development build: `npx expo run:ios` (needs Xcode) or `eas build --profile development`, then `npx expo start`. Expo Go cannot run it (Unistyles ships native code). `/gallery` (Profile → Component gallery, dev builds only) shows every component.

**Tests:** `npm test` (jest-expo + Testing Library v14: `await render`, `userEvent`). Unistyles, Worklets and Reanimated are set up in `jest.config.js` / `jest.setup.ts`.

**Gotchas:**
- Keep the repo **outside iCloud Drive** (`~/Documents`, `~/Desktop` when synced). iCloud tags build output with extended attributes and Xcode's codesign fails with "resource fork, Finder information, or similar detritus not allowed".
- `expo-apple-authentication` always adds the Sign in with Apple entitlement, which makes even simulator builds need a signing certificate. `app.config.ts` strips it unless `EXPO_PUBLIC_APPLE_SIGN_IN=enabled`.
- Expo Go shows "NitroModules … could not be found" — expected; only the dev build works.
- React is pinned at the repo root to the Expo SDK's version so only one copy exists (npm `overrides` don't reach peer deps). TypeScript 6 doesn't auto-include `@types/*`, hence `"types": ["jest"]`. `expo-env.d.ts` is committed so lint/typecheck work before the first `expo start`.
