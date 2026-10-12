Waypoint plans and books a whole trip (trip style, destination, spots, a day-by-day plan, flights and a place to sleep) in one guided flow that takes under five minutes, always steering to the best quality for the money. The interface is **calm and trustworthy**: Waypoint handles the stress, and the traveler just makes decisions. Every screen asks one clear question, shows the best-value answer first, and makes moving on effortless.

## Principles

- **One step, one decision.** The flow is always Trip style → Destination → Spots & dates → Day plan → Flights → Stay, then a Summary to book. Each screen has one `title-lg` question and one primary button.
- **Best value first, never hidden.** The top option on every list is the best value, marked with the sunshine badge and a savings delta. Cheaper or pricier options are still there, one scroll away.
- **Fast, not rushed.** The five-minute promise is something the app keeps, not a countdown. Never show timers, "time left" or urgency copy about the planning itself.
- **Prices are honest.** Always show the full price including fees, in tabular numerals, with the currency.

## Content fundamentals

- Voice: a calm, competent friend who has done this trip before. Speak to the traveler as "you" and to Waypoint as "we": "We found 3 direct flights."
- Casing: sentence case for titles and buttons ("Choose your flight", "Continue"). UPPERCASE only in `overline` badges ("BEST VALUE").
- Buttons say what happens next: "Continue to stay", "Book trip · € 880". Never "Submit" or "OK".
- Numbers: `€ 189` (currency, then a thin space), `2h 45m`, `12 May`. Savings: `−€84 vs avg` (with a real minus sign).
- Scarcity copy is only stated when it's true and verifiable ("Only 2 rooms left at this price"). No fake urgency.
- No emoji in the UI.

## Color

- The app background is `surface` (warm off-white). Cards, sheets and inputs are `surface-card`.
- Use `midnight-900` for the one primary action per screen, the header and the travelled part of the route. Put `on-midnight` text on it, and use `midnight-700` for hover/pressed.
- `sunshine-400` means **best value** and nothing else. It is only ever a fill with `ink` text on it. Never set sunshine as text or icon color on a light ground (it fails contrast). Tint the best-value card with `sunshine-100`.
- `savings` shows money saved and completed steps. `danger` shows errors and price increases. `warning` shows scarcity. Each is text on `surface-card` or on its own `-100` tint, and always comes with a word or icon, never color alone.
- Body text is `ink`. Secondary text is `ink-muted`. Decorative lines use `border`. Control outlines that people must find use `border-strong`.
- Focus: a solid 2px `focus` ring with a 2px offset on every interactive element.

## Typography

- One family: **Plus Jakarta Sans** (Google Fonts, weights 400–800), loaded by `components/bundle.css`. Use the `sans` stack.
- One `display` per screen at most. Step questions use `title-lg`, offer names use `subtitle`, and copy uses `body`.
- Every price uses `price` / `price-lg` with `font-variant-numeric: tabular-nums`, so totals line up in lists and don't jitter as they update.
- `overline` is for badges only.

## Spacing & layout

- 4px base, 8px rhythm: `space-1` through `space-12`. Don't use off-scale values.
- Mobile: a `space-4` side gutter, `space-4` card padding, `space-6` between cards, `space-8` between sections.
- Desktop: a single centered step column up to `content-max`, with the trip summary docked to the right or bottom.
- Anything tappable is at least `tap-min` (44px). Buttons and inputs are `control-h` (48px).

## Shape & depth

- Radii: `radius-sm` for inputs, `radius-md` for buttons, `radius-lg` for cards and sheets, `radius-full` for badges, chips and the route marker.
- Resting cards sit on `shadow-card` with a `border` hairline. The selected offer lifts to `shadow-raised`. The sticky summary bar uses `shadow-bar`.
- No gradients and no colored side-borders on cards.

## The flow

Entry: **Log in** (email link, Google or Apple, no password) → **Home**, which lists the traveler's waypoints (draft, booked, past) and offers one "Create a waypoint" card on `midnight-900`. A draft resumes at its current step.

Then six steps and a summary:

1. **Trip style.** A two-column grid of selectable style cards (Chill & slow, Trails & hikes, Beautiful views, Culture & history, Food & markets, Beaches, Nightlife, Family-friendly), several allowed, plus a Relaxed / Balanced / Packed pace control.
2. **Destination.** Suggestions matched to the styles, each with an estimated total for the whole trip. The best match for the money gets the `--value` badge. A search field covers travelers who already know where they're going.
3. **Spots & dates.** Dates, travelers, a length control (3 / 5 / 7 / 10 days) and a checklist of recommended spots with a "Fits in N days" check.
4. **Day plan.** Waypoint auto-plans each day from the chosen spots. Day tabs, then a timeline: time, stop card, travel time between stops. Fixed items (flights, check-in, transport) use a dashed outline and can't be swapped. Every other stop has a swap action.
5. **Flights.** Offer cards, best value first, with times that fit the plan.
6. **Stay.** A Cheapest / Best value / Top quality control re-ranks the options. Every card shows its average distance to the planned stops.
7. **Summary.** The trip, each part with its price and an Edit link back to its step, the savings line, and one "Book trip · € total" button.

On every step:

- The **Route** sits at the top: a dotted road with seven checkpoints (the six steps, then Book). The sunshine marker stands on the current checkpoint and its name sits above it. Passed checkpoints are filled `midnight-900` and labelled with what the traveler picked ("Views +2", "Lisbon", "5 days"), so the route reads as the trip so far. Tapping one goes back to that step. No time estimate.
- The **step question** is in `title-lg`, with an optional `body` line in `ink-muted` beneath it.
- From the day plan on, the **Trip summary bar** is pinned to the bottom with the running total and the single primary button. Steps 1–3 show only the primary button with a short selection summary.

## Motion

The trip should feel like a journey: every step is a move along the route.

- **On each step:** the marker glides from the previous checkpoint to the current one (0.9s, `cubic-bezier(.5,0,.2,1)`, 0.25s delay) while the road behind it turns solid `midnight-900`. The current step's name fades in after it lands (0.4s at 1s), then the marker keeps a soft sunshine pulse.
- **Between steps, the route moment:** after Continue, a full-screen `midnight-900` trip map shows the whole route winding down the screen. The finished checkpoint pops a check, the trail draws in `sunshine-400` to the next stop (1.2s), "Next stop" fades in beside it, and a small card rises with what comes next. The whole moment lasts about 2 seconds, then moves on by itself. It can be skipped with a tap.
- Motion is only for moving along the route and for feedback. Lists, cards and prices don't animate in.
- With `prefers-reduced-motion`, skip every animation and show the end state. The route moment becomes a plain cross-fade.

## Iconography

Waypoint has no icon set yet. Until it does, use a 1.75px-stroke outline set at 20/24px (for example Lucide), in `ink` or `ink-muted`, and in `on-midnight` on midnight fills. No logo has been supplied, so set the name "Waypoint" in `sans` 700 wherever a mark is needed.

## Components

Each component is plain HTML with the `wp-` classes from `components/bundle.css`, so it works in any framework. Button, Chip, Badge, Input, Route, OfferCard, TripSummaryBar.
