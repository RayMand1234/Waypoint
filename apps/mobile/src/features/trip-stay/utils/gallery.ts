/** Which photo a sideways pager shows once it has settled at `offsetX` (pages `width` wide). */
export const pageAt = (
  offsetX: number,
  width: number,
  count: number,
): number =>
  width <= 0 || count === 0
    ? 0
    : Math.min(Math.max(Math.round(offsetX / width), 0), count - 1);
