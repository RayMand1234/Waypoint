# Home — photo redesign (supersedes `../Home.dc.html`)

**Status:** approved concept, 17 October 2026. **Built 17 October 2026** (`apps/mobile/src/features/home/`). Where the build differs from this brief:

- Trip photos are joined at read, not snapshotted: `TripListItem.destinationPhoto` is the destination's current photo (no migration).
- Inspiration tiles show **no prices** until a real trip estimate (with its `checkedAt`) exists, so there's no price-age line. The single best match carries a white **"Best match"** pill — sunshine stays reserved for "best value".
- The postcard's top-right code is the destination's first three letters (the trip list has no airport yet), shown only over a photo.
- A been-there stamp opens the trip's summary step (no read-only trip view exists yet).
- The status bar is white over the hero and turns dark once the hero scrolls away.
**Visual spec:** [`HomePhotos.html`](HomePhotos.html) — open it in a browser. Left phone is the first screen (390 × 844), right phone is the whole page scrolled. Its sample photos (`img/`: Wikimedia Commons lead images of Lisbon, Barcelona, Kyoto, Amalfi Coast, Reykjavík, Dubrovnik, Paris, Rome and Oia) are **not in the repo** — put them in `img/` locally (it's git-ignored) and serve the folder (`npx serve .` or `python3 -m http.server`) to see them.

## Why

The old Home had the right colours but felt lifeless: one column of equal-weight white cards on flat cream, nothing that said *travel*. It read like a trip-management tool. The goal now is that Home makes people **want to go somewhere** — and that it still gets them back into a half-planned trip in one tap.

Keep: midnight / sunshine / surface palette, Plus Jakarta Sans, the 6-segment progress, status pills, voice and copy rules. Change: layout, imagery, hierarchy.

## Layout, top to bottom

### 1. Hero — photo under a midnight wash

- Full-bleed destination photo, ~420 tall, extends under the status bar (safe-area top inset is padding, not a gap).
- Over it, a vertical midnight gradient: midnight-900 at ~55% opacity at the top, ~25% in the middle, ~92% at the bottom — so text is readable top and bottom and the photo shows through in the middle. Brand colour stays in charge.
- Top row: "Good evening, Ray" (greeting from `useGreeting` + name, white at ~85%) left; avatar right (frosted: white 18% fill, white 35% hairline, initial in bold white) → opens Profile.
- Headline: "Where to" / "**next?**" on two lines, "next?" in sunshine-400. Bigger than `title-lg`: 38/42, weight 800, tracking −1.
- Primary action: the existing sunshine "Start planning" button (+ icon), wired to `useStartPlanning().startNew`, same busy / error handling as `CreateWaypointCard` today.
- Small photo credit bottom-right of the hero (place name; full licence credit must be reachable — see Photos).
- Hero photo choice: the user's current/next trip's destination if there is one, otherwise a rotating curated destination.

### 2. "Your waypoints" — photo postcards overlapping the hero

- Section header sits **inside the bottom of the hero** (white text): "Your waypoints" left, "N in progress" right.
- A horizontal, snapping carousel that overlaps the hero's bottom edge by ~70. Cards 236 × 300, radius ~24, **lifted** shadow (see Background and depth). A horizontal scroll view clips anything outside its bounds, so give the list ~36 bottom padding or the shadows get cut off.
- Each card: destination photo full-bleed, dark gradient from ~35% down to the bottom. Top-left status pill (DRAFT = sunshine fill / ink text; READY TO BOOK = white fill / midnight text; reuse the status logic in `toTripCard`). Top-right: airport code, small, bold, letter-spaced. Bottom: city (26, weight 800), "dates · travellers", the 6-segment progress (done = sunshine-400, rest = white 30%), and the action line ("Continue · Flights →" / "See summary →") from `card.action`.
- Last item: dashed "+ New waypoint" card (150 wide, white, dashed `border-strong`, midnight circle with +), same action as the hero button.
- Drafts keep **delete**, but move it off the card face: long-press → action sheet with "Delete draft" (destructive) — reuse `useDeleteTrip().askToDelete`. Make it discoverable via the card's accessibility actions too.
- Past trips do **not** go in this rail (see section 4).
- Empty state (no trips): hide the rail, keep the header with copy "Your first trip is one tap away" and only the dashed new-waypoint card.

### 3. "Worth the trip this winter" — bento of places

- Header "Worth the trip this <season>" + "See all" (→ Explore tab). Sub line: "Picked for your styles: views, food and culture" (styles from the profile / last trip; generic line if none).
- Two-column grid, rows ~160, gap 12, radius ~22. Pattern for 4 tiles: one **wide** (spans 2), then one **tall** (spans 2 rows) beside two squares. Repeatable if there are more.
- Each tile: photo, bottom gradient, city name (18 / wide 24, weight 800), one meta line (matched style or "N days"), a white price pill top-right "€410". The best one gets the sunshine **"Best value · from €640"** pill (exactly one — `isBestMatch`). Optional style tag top-left on the wide tile (frosted dark pill, e.g. CULTURE).
- Under the grid, the price-age line required by product rules: "Estimated prices, checked 3h ago · final price confirmed on site".
- Tapping a tile starts a new trip pre-set to that destination (skips/prefills the Destination step).

### 4. "Been there" — past trips as photo stamps

- 64 round photos with a white ring + hairline outer ring, slightly desaturated; city + month/year under each. Horizontal row. Tap opens the past trip read-only. Hidden when there are none.

### 5. Tab bar

Unchanged — keep whatever the shell currently renders (it's mid-change on `feature/spot-photo-cards`). The mockup's floating pill is only for context. Add bottom content padding so the last section clears it.

## Background and depth

Decided 17 Oct 2026 after comparing nine backgrounds and four shadow strengths (`HomePhotos.html` shows the result).

**Background below the hero** — three layers on `surface`, scrolling with the content, starting where the hero ends:

1. **Dot grid**: 1.3 radius dots every 16, in `border-strong` at ~22% opacity. Faint on purpose — it should read as paper texture, not graph paper.
2. **Sunshine glow**: a large soft radial of `sunshine-100` fading to transparent, anchored top-right just under the hero.
3. **Midnight glow**: the same in `midnight-100`, anchored left, about 900 below the hero.

Build it with `react-native-svg` (already a dependency): a `<Pattern>` with one `<Circle>` for the dots, two `<RadialGradient>`s for the glows, in one absolutely-positioned `<Svg>` behind the scroll content. No image assets. It's decoration: `pointerEvents="none"`, hidden from screen readers.

**Card shadow — "lifted"**: a tight contact shadow plus a long soft one, on postcards, bento tiles, the new-waypoint card and the been-there stamps (stamps keep their 3 white ring as the first layer):

```
0 2px 4px rgba(18,23,38,.08), 0 14px 30px rgba(18,23,38,.20)
```

React Native's New Architecture reads this string as `boxShadow` directly. A view with `overflow: 'hidden'` (needed for the photo's rounded corners) clips its own shadow — put the shadow on an outer view and the clipping on an inner one.

## Where the data comes from

| UI | Source | Gap |
|---|---|---|
| Trip postcards | `GET /trips` → `TripListItem` (existing `useTrips`) | **No photo on `TripListItem`.** Trips store destination by value — add a `destinationPhoto: Photo \| null` snapshot to the trip when the destination is picked (trips service + `@waypoint/contracts/trips`, additive). Fallback while missing: midnight-100 tile with the airport code as type art (the old `TripThumb` look). |
| Hero photo | next trip's `destinationPhoto`, else first inspiration tile | — |
| Inspiration bento | planner `GET /destinations?styles=&month=` → `DestinationSuggestion[]` (`photo`, `matchedStyles`, `isBestMatch`, `stayPerNight`) | "from €X" needs a total estimate (flight + stay). Until planner returns one, show `stayPerNight` as "from €X / night", or omit the price. Never invent a price. |
| Price age | the estimate's `checkedAt` | Add if the suggestion doesn't carry one. |
| Been there | trips with status `past` | Same photo snapshot as postcards. |

## Photos

- Use the existing `Photo` type (`@waypoint/contracts/destinations`) — it carries `author`, `license`, `licenseUrl`, `sourceUrl`. **Credit is a licence requirement**, not decoration: show at least the place on the image and make the full credit reachable (e.g. info button on the hero, credit line in the destination details).
- Request card-sized thumbnails, not originals — follow `cardPhotoUrl` in `features/trip-spots/utils/spotRowModel.ts` (Wikimedia `/<w>px-` rewrite; Wikimedia only serves its standard widths, e.g. 960). Hero ~1280, postcards/tiles ~640, stamps ~240.
- Every photo has a non-photo fallback (midnight-100 + airport code), and a loading state that isn't a blank white box (midnight-100 fill).
- `SpotCard` uses React Native's `Image`. For Home's many large images, consider `expo-image` (disk cache, placeholder, fade-in) — **a new dependency, so confirm with the user before adding it.**
- The mockup photos in `img/` are Wikimedia Commons lead images (Lisbon, Barcelona, Kyoto, Amalfi Coast, Reykjavík, Dubrovnik, Paris, Rome, Oia) for the concept only — do not ship them as assets.

## Tokens — map, don't hard-code

Repo rule: no literals in components; a value with no token is a question. Mapping:

| Mockup value | Token |
|---|---|
| `#1E2A5A`, `#33437F`, `#E7EAF5` | `midnight-900`, `midnight-700`, `midnight-100` |
| `#FFC83D`, `#FFF3D1` | `sunshine-400`, `sunshine-100` |
| `#FAF8F4`, `#E6E1D8`, `#121726`, `#5E5A55`, `#8C857A` | `surface`, `border`, `ink`, `ink-muted`, `border-strong` |
| radius 22–24 | `radius.lg` (20) — use it, don't add 24 |
| 14 / 24 padding | `space[3]`/`space[4]` + `space[6]` |
| card shadow | new `shadow.lifted` (below) — not `shadow.raised` |
| dot colour / glows | `border-strong` @ .22, `sunshine-100`, `midnight-100` |

**New tokens to add** (to `docs/design/system/tokens.json` first, then `tokens.ts`, per the existing rule):

- Type `display-xl` — 38/42, 800, −0.03em (hero headline). Type for city on postcard (26, 800) and tile (18/24, 800): consider `title-lg` at weight 800 instead of new tokens.
- Sizes: `home-hero-h` (420), `postcard-w` (236), `postcard-h` (300), `postcard-overlap` (70), `bento-row-h` (160), `stamp` (64), `dot-grid-gap` (16), `dot-r` (1.3).
- Shadow: `shadow.lifted` — `0 2px 4px rgba(18,23,38,0.08), 0 14px 30px rgba(18,23,38,0.20)`.
- Colour: `dot` — `border-strong` (#8C857A) at 0.22 alpha.
- Overlays (component colours, like `scrim`): `photo-wash-top` (midnight-900 @ .55), `photo-wash-mid` (@ .25), `photo-wash-bottom` (@ .92), `photo-fade` (ink @ .85 bottom → transparent), `on-photo-muted` (white @ .85), `frost-fill` (white @ .18), `frost-border` (white @ .35), `on-photo-track` (white @ .30).
- Gradients: React Native has no CSS gradient on `View`. Use `experimental_backgroundImage` (New Architecture supports `linear-gradient` strings) if it works on the current RN version, otherwise `expo-linear-gradient` (**new dependency — ask first**).

## Code shape (follow `CLAUDE.md` conventions)

Inside `apps/mobile/src/features/home/`:

```
components/
  HomeScreen.tsx        orchestrator only — ScrollView (no Screen padding), sections in order
  HomeHero.tsx          photo + wash + greeting + avatar + headline + Start planning
  TripsRail.tsx         header + horizontal FlatList (snap) of TripPostcard + NewWaypointCard
  TripPostcard.tsx      one trip (replaces TripCard / TripThumb on Home)
  NewWaypointCard.tsx
  InspirationBento.tsx  header + grid layout + price-age line
  InspirationTile.tsx   one destination (variant: wide | tall | square)
  BeenThere.tsx         past-trip stamps
hooks/
  useInspiration.ts     React Query over the planner destinations call
utils/
  bentoLayout.ts        pure: suggestions → tiles with wide/tall/square slots (tested)
  tripCardModel.ts      extend with photo + tone; split past trips out (tested)
```

- A photo-with-gradient surface is used by postcard, tile and hero → one shared `PhotoSurface` component (`shared/components/` once a second feature needs it; start in `features/home/components/` until then).
- Delete `CreateWaypointCard`, `TripCard`, `TripThumb`, `HomeHeader` once nothing imports them; keep `TripProgress` but give it an `onPhoto` variant (sunshine done / white-30 todo).

## Accessibility and motion

- Text on photos must hold 4.5:1 — that's what the washes are for; check the lightest photos (Oia, Reykjavík) on device.
- Postcard: one button, label "Lisbon, 16–20 Nov, 2 travellers, draft, 4 of 6 steps. Continue: flights." Delete via accessibility action. Rail is a horizontal list with `accessibilityRole="list"`.
- Tiles: "Kyoto, best value, from €640, culture."
- Decorative photos are hidden from screen readers; the credit isn't.
- Respect reduce motion: no parallax or auto-advancing hero.
- Dynamic type: city names `numberOfLines={1}`, cards grow in height before text clips.

## Out of scope here

Explore tab redesign, Profile, trip-flow screens, backend changes beyond the additive photo snapshot.

## Done when

- Home matches `HomePhotos.html` on the iOS simulator (first screen and scrolled), with the user's real trips.
- Works with: no trips, only drafts, only past, photos missing, inspiration call failing (section hides, rest of Home works).
- `npm run typecheck`, `npm run lint`, `npm test` pass; new pure utils have tests.
