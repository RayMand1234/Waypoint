The trip summary bar is pinned to the bottom of every step. It shows the trip so far, the running total and the single primary action.

Markup: `wp-summary` holds `wp-summary__info` (`__trip` line, `__total` in price-lg, `__steps` with six `__dot` spans, `--done` for completed steps) and one `wp-btn wp-btn--primary`.

- The consumer provides the trip line (destination · dates · travelers), the total including everything chosen so far, the completed steps and the button label.
- The total updates live as options are picked. Use tabular numerals so it doesn't jitter.
- Tapping the info area opens the full breakdown in a bottom sheet.
- On desktop, dock it as a right-hand panel instead.
