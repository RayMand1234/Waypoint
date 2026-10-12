An offer card is a single bookable option (a flight, hotel, insurance plan or extra) in one shared layout so every step reads the same way.

Markup: `<button class="wp-offer" aria-pressed="false">` with three rows: `wp-offer__head` (badges), the title (`wp-offer__title`) with `wp-offer__meta`, and `wp-offer__foot` (`wp-offer__price` with `wp-offer__unit`, and a `wp-delta`). Add `--best` to the best-value option. Set `aria-pressed="true"` on the selected one.

- The consumer provides the title, a one-line meta, the price including all fees, the unit ("per person", "per night", "whole trip"), the delta and the badges.
- List best value first. Only that card gets `--best` (sunshine-100 tint) and the `--value` badge.
- The delta compares against the average (`−€84 vs avg`, savings color) or against the best value (`+€25 vs best`, `--up`).
- Keep the meta to one line. Put details in a bottom sheet, not on the card.
