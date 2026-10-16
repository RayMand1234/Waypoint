// Small numeric helpers. Each takes values in any order and never mutates them.

const ascending = (values: readonly number[]): number[] =>
  [...values].sort((a, b) => a - b);

/** The middle value (the mean of the two middle ones for an even count); 0 for none. */
export const median = (values: readonly number[]): number => {
  const sorted = ascending(values);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;

  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? upper) + upper) / 2
    : upper;
};

/** The value at or below which `share` (0–1) of `values` fall, by nearest rank; 0 for none. */
export const percentile = (
  values: readonly number[],
  share: number,
): number => {
  const sorted = ascending(values);

  return sorted[Math.max(0, Math.ceil(share * sorted.length) - 1)] ?? 0;
};

export const clamp = (min: number, max: number, value: number): number =>
  Math.min(max, Math.max(min, value));
