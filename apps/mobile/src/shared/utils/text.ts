// Small wording helpers shared by every feature's copy.

/** Lower case without accents, for matching what people type: "São" → "sao". */
export const fold = (text: string): string =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/** `1 night`, `4 nights` — `many` defaults to `one` + "s". */
export const plural = (count: number, one: string, many = `${one}s`): string =>
  `${String(count)} ${count === 1 ? one : many}`;

/** "views, culture and food". */
export const listOf = (words: readonly string[]): string =>
  words.length <= 1
    ? (words[0] ?? '')
    : `${words.slice(0, -1).join(', ')} and ${words.at(-1) ?? ''}`;

export const capitalised = (text: string): string =>
  `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
