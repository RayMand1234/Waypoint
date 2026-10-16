/**
 * A deterministic string for a JSON-like value — object keys sorted at every
 * level — so two equal queries always produce the same cache key.
 */
export const stableKey = (value: unknown): string => {
  if (value === undefined) return 'undefined';

  if (Array.isArray(value)) return `[${value.map(stableKey).join(',')}]`;

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableKey(entry)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
};
