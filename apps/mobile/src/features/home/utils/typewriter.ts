import type { ColorName } from '@/theme/tokens';

/** One run of the headline in one colour. */
export type TypedSegment = { readonly text: string; readonly color: ColorName };

/** A segment split at the typing point: what's typed so far, and what's still to come. */
export type TypedPart = {
  readonly shown: string;
  readonly hidden: string;
  readonly color: ColorName;
};

/** The segments with the first `count` characters typed. */
export const typedParts = (
  segments: readonly TypedSegment[],
  count: number,
): TypedPart[] =>
  segments.reduce<{ readonly parts: TypedPart[]; readonly start: number }>(
    ({ parts, start }, { text, color }) => {
      const cut = Math.min(Math.max(count - start, 0), text.length);

      return {
        parts: [
          ...parts,
          { shown: text.slice(0, cut), hidden: text.slice(cut), color },
        ],
        start: start + text.length,
      };
    },
    { parts: [], start: 0 },
  ).parts;

/** How long to wait after typing `char`: a beat longer at a line break, as a person would. */
export const typingDelay = (
  char: string | undefined,
  {
    perChar,
    lineBreak,
  }: { readonly perChar: number; readonly lineBreak: number },
): number => (char === '\n' ? lineBreak : perChar);
