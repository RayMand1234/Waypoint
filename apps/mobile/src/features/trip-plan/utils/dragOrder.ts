// Where a dragged stop lands among the day's spots. Runs on the UI thread
// while the finger moves, hence the worklet directive.

/**
 * The index the stop dragged from `from` takes once dropped, given each spot
 * row's vertical centre and how far the finger has moved: one past every
 * other row whose centre it is below.
 */
export const dropIndex = (
  centers: readonly number[],
  from: number,
  dy: number,
): number => {
  'worklet';

  const dragged = (centers[from] ?? 0) + dy;

  return centers.filter((center, index) => index !== from && center < dragged)
    .length;
};

/**
 * How far a card that isn't dragged moves to make room while the one from
 * `from` hovers over `to`: the cards in between slide one slot towards where
 * it came from (to the next card's bottom edge); the rest stay.
 */
export const makeRoomShift = (
  bottoms: readonly number[],
  from: number,
  to: number,
  index: number,
): number => {
  'worklet';

  const here = bottoms[index] ?? 0;

  if (from < 0 || index === from) return 0;

  if (from < to && index > from && index <= to)
    return (bottoms[index - 1] ?? here) - here;

  if (from > to && index >= to && index < from)
    return (bottoms[index + 1] ?? here) - here;

  return 0;
};
