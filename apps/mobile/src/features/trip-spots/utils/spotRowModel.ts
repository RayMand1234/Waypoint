import type { Spot } from '@waypoint/contracts/destinations';
import { STYLE_SHORT_NAMES } from '@/features/trip-flow';

const TOP_PICKS = 3;
const STYLES_IN_META = 2;

/** "45m", "2h", "1h 30m". */
export const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${String(rest)}m`;

  return rest === 0
    ? `${String(hours)}h`
    : `${String(hours)}h ${String(rest)}m`;
};

/** "Views · Culture · 2h". */
export const spotMeta = (spot: Pick<Spot, 'styles' | 'visitMinutes'>): string =>
  [
    ...spot.styles
      .slice(0, STYLES_IN_META)
      .map((style) => STYLE_SHORT_NAMES[style]),
    formatMinutes(spot.visitMinutes),
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

/** The ids with `id` added, or removed if it was there. */
export const toggleId = (ids: readonly string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id];
