# Waypoint design — repo copy

These files are copied from the two claude.ai artifacts so Claude Code (and anyone without access to them) can build from the real design:

- `system/` — the **Waypoint design system** (brand book, tokens, component guidelines and HTML previews), from https://claude.ai/artifact/LnbFzgyfppQa7tCfgwSNjH.
- `screens/` — the **Waypoint MVP** canvas (every screen as an HTML artboard), from https://claude.ai/artifact/Kx6eZ4tJXEX7g6JnFpGYiG.

Copied 12 October 2026. If the artifacts change, re-copy and note the date here.

## How to use these files

| Need | Read |
|---|---|
| Colors, type styles, spacing, radii, shadows, sizes | `system/tokens.json` — exact values with a usage note per token. `apps/mobile/src/theme/tokens.ts` must mirror it, name for name. |
| Voice, principles, flow, motion, layout rules | `system/README.md` (the brand book) |
| A component's rules | `system/components/<Name>/README.md` |
| A component's exact look | `system/components/<Name>/preview.html` + the `.wp-*` rules in `system/components/bundle.css` |
| A screen's layout, copy and states | `screens/<Screen>.dc.html` (index below) |

The previews and screens are **web markup** (HTML + CSS, `wp-*` classes, inline styles). They are the visual spec, not code to port: rebuild each in React Native with Unistyles and the theme tokens. Read measurements, colors, copy, order and states from them; never copy CSS or `px` literals into components — map every value to a token (`#1e2a5a` → `theme.colors['midnight-900']`, `16px` → `theme.space[4]`, and so on). A value with no matching token is a question, not a new literal.

`screens/*.dc.html` files reference `./support.js` and `ds/waypoint/…` stylesheets that are not in the repo; that's expected, they are read as source, not opened.

## Screen index

Phone frame 390 × 844 for every screen.

| Screen | File | Shows |
|---|---|---|
| Log in | `Main.dc.html` | Email, Google, Apple |
| Home — my waypoints | `Home.dc.html` | Greeting, "Create a waypoint" card, draft / booked / past trips, bottom tab bar |
| 1 · Trip style | `Style.dc.html` | Route header, 8 style cards (multi-select), pace control, "N styles selected" + Continue |
| 2 · Destination | `Destination.dc.html` | Search field, suggested destinations with estimated total and best-value badge, chosen destination in footer |
| 3 · Spots, length & dates | `Spots.dc.html` | Dates, travelers, length 3/5/7/10, recommended spots checklist, "fits in N days" |
| 4 · Where to sleep | `Stay.dc.html` | Cheapest / Best value / Top quality control, distance to stops, details sheet with gallery and "Where we found it" |
| 5 · Flights | `Flights.dc.html` | Offer cards best value first, filter chips, details sheet with "Where we found it", "checked just now" |
| 6 · Day plan | `Plan.dc.html` | Day tabs, timeline of stops with travel times, fixed items dashed, swap action, trip summary bar |

The app runs the steps in this order (stay right after the spots, day plan last); the frames' own step numbers and Route labels predate the change.
| Summary | `Summary.dc.html` | Each part with price and Edit link, savings line, primary action |
| Trip planned | `Booked.dc.html` | Arched midnight header with check, list of parts each with a deep-link button to its site and a "booked" tick |
| Route moment | `RouteMoment.dc.html` (+ `route-moment.css`) | Full-screen midnight trip map between steps; `step` 1–6 sets the copy and the three tasks. `Go1.dc.html` shows how a screen embeds it (`Go2`–`Go6` are the same with steps 2–6). |
| Canvas layout | `canvas.json` | Board titles and order |

## Where newer decisions override these files

The design was made before some product and engineering decisions. When a design file and the root `CLAUDE.md` disagree, **`CLAUDE.md` wins**. Known differences:

1. **Plan only, no booking in the app.** The brand book says Waypoint "plans and books". In years 1–2 it plans and compares only; booking happens on partner sites (`Booked.dc.html` is the correct end state).
2. **Summary button.** `Summary.dc.html` uses "Book trip · € 880". Use **"Go to booking · € 880"** — it leads to the Trip planned screen, which links out to each partner.
3. **Deep-link targets.** The screens hard-code Skyscanner and Booking.com. The real link always goes to the provider that supplied the chosen offer (its `deepLink`), labelled with that site's name.
4. **Email login.** The login copy says "we'll send you a sign-in link". Waypoint uses a **6-digit code**: copy becomes "No password needed — we'll email you a code."
5. **Route moment timing.** The brand book's Motion section says about 2 seconds and moves on by itself. The canvas's `RouteMoment` is newer and wins: about 3 seconds, three "building your trip" tasks tick off, and **Continue** appears when they're done. In the app the moment waits for the real backend call for the next step; with reduce motion on, no animation.
6. **Prices and names are placeholders** (€ 880, Casa do Miradouro, TAP …). Real values come from the services.
7. **Icons.** No icon set is decided; the brand book suggests a 1.75 px outline set such as Lucide. Use `lucide-react-native` unless told otherwise.
