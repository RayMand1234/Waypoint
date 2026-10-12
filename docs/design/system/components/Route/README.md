The route is Waypoint's progress indicator: a winding dotted road with seven checkpoints (the six steps, then Book). A sunshine marker travels along it as the traveler moves through the plan.

Markup: a `wp-route` box (68px tall, full content width) holding:

- an `<svg class="wp-route__svg" aria-hidden="true">` with two paths that share the same `d`: the `wp-route__road` (dotted) and the `wp-route__trail` with `pathLength="100"` (solid). Then one `<circle>` per checkpoint, classed `wp-route__cp--done`, `--current` or `--next`. The last checkpoint is a little larger and has an inner dot, marking the finish.
- a `<span class="wp-route__marker">` whose inline style sets `offset-path: path("<the same d>")`, `--wp-from` and `--wp-to`;
- one `wp-route__label` per passed checkpoint (the traveler's pick), and one `wp-route__now` above the current checkpoint (the step name).

Put `role="progressbar"`, `aria-valuemin="1"`, `aria-valuemax="6"`, `aria-valuenow` and an `aria-label` such as "Step 3 of 6, Spots and dates" on the `wp-route` box.

**Geometry.** The road is built from congruent S-curves, one per gap between checkpoints, so every segment has the same length. Checkpoint *k* (0–6) therefore sits at exactly *k*/6 of the path: 0%, 16.667%, 33.333%, 50%, 66.667%, 83.333%, 100%.

- On a 358px-wide mobile route, the checkpoints are 55px apart at x = 12, 67 … 342, alternating between y = 28 and y = 42.
- On step *n*, the marker uses `--wp-from` = (*n*−2)/6 and `--wp-to` = (*n*−1)/6 as percentages.
- The trail uses `--wp-trail-from` / `--wp-trail-to` = 100 minus those same values.
- On step 1, the marker drops in instead of gliding.

The consumer provides the current step, the step name and the passed picks (keep each to 1–2 words: "Views +2", "Lisbon", "5 days", "16 stops", "TAP direct").

- It replaces any numbered progress bar. Never add a timer or "time left".
- Passed checkpoints may be tappable to jump back to that step.
- Motion: see the brand book's Motion section. With `prefers-reduced-motion`, the route shows its end state with no animation.
- Don't use sunshine for anything else on the route. The marker is the only sunshine element in the header.
