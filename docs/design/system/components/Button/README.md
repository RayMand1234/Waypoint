Buttons trigger the next action. Each screen has exactly one primary button.

Markup: `<button class="wp-btn wp-btn--primary">`. Variants: `--primary` (midnight-900 fill, on-midnight label), `--secondary` (midnight-100 fill), `--ghost` (text only). Add `--block` for full width on mobile. Use the `disabled` attribute when a step is incomplete.

- The consumer provides the label, which says what happens next ("Continue to hotels", "Book trip · €1,190").
- Height is `control-h` (48px) and the corners are `radius-md`. Focus shows a 2px `focus` ring.
- Don't place two primary buttons on one screen, and don't use sunshine as a button fill (sunshine only means best value).
