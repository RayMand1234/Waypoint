/** Items by key. The map is a local accumulator, built here and never shared while being filled. */
export const groupBy = <T>(
  items: readonly T[],
  keyOf: (item: T) => string,
): ReadonlyMap<string, readonly T[]> =>
  items.reduce(
    (groups, item) =>
      groups.set(keyOf(item), [...(groups.get(keyOf(item)) ?? []), item]),
    new Map<string, readonly T[]>(),
  );
