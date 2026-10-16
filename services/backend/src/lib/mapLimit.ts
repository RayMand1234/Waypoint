/**
 * `Promise.all` with at most `limit` calls in flight — polite to public APIs.
 * Results keep the input order.
 */
export const mapLimit = async <T, R>(
  items: readonly T[],
  limit: number,
  run: (item: T) => Promise<R>,
): Promise<R[]> => {
  const chunks = Array.from(
    { length: Math.ceil(items.length / limit) },
    (_, i) => items.slice(i * limit, (i + 1) * limit),
  );

  return chunks.reduce<Promise<R[]>>(
    async (done, chunk) => [
      ...(await done),
      ...(await Promise.all(chunk.map(run))),
    ],
    Promise.resolve([]),
  );
};
