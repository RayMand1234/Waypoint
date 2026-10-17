import type { Spot } from '@waypoint/contracts/destinations';
import { STYLE_SHORT_NAMES } from '@/features/trip-flow';
import { formatDuration } from '@/shared/utils/format';
import { photoAtWidth } from '@/shared/utils/photoUrl';

const TOP_PICKS = 3;
const STYLES_IN_META = 2;

/** "Views · Culture · 2h". */
export const spotMeta = (spot: Pick<Spot, 'styles' | 'visitMinutes'>): string =>
  [
    ...spot.styles
      .slice(0, STYLES_IN_META)
      .map((style) => STYLE_SHORT_NAMES[style]),
    formatDuration(spot.visitMinutes),
  ].join(' · ');

/** The ids of the most popular spots, badged "Top pick". */
export const topPickIds = (
  spots: readonly Pick<Spot, 'id' | 'popularity'>[],
): ReadonlySet<string> =>
  new Set(
    [...spots]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, TOP_PICKS)
      .map((spot) => spot.id),
  );

/** Top picks first; each group keeps the list's order (best fit for the styles). */
export const topPicksFirst = <T extends Pick<Spot, 'id'>>(
  spots: readonly T[],
  topPicks: ReadonlySet<string>,
): T[] => [
  ...spots.filter((spot) => topPicks.has(spot.id)),
  ...spots.filter((spot) => !topPicks.has(spot.id)),
];

/** The photo at card size: sharp in a two-column card, a fraction of the full photo. */
export const cardPhotoUrl = (url: string): string => photoAtWidth(url, 500);

/** The ids with `id` added, or removed if it was there. */
export const toggleId = (ids: readonly string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id];
