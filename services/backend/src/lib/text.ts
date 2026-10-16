/** Lower-case, trimmed and without accents — for matching names ("Málaga" = "malaga"). */
export const fold = (text: string | null): string =>
  (text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
