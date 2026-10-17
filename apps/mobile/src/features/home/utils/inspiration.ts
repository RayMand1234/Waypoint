import type { TripListItem, TripStyle } from '@waypoint/contracts/trips';
import { STYLE_SHORT_NAMES } from '@/features/trip-flow';
import { listOf } from '@/shared/utils/text';

const SEASONS = [
  'winter',
  'winter',
  'spring',
  'spring',
  'spring',
  'summer',
  'summer',
  'summer',
  'autumn',
  'autumn',
  'autumn',
  'winter',
] as const;

/** "Worth the trip this autumn" — the season the month falls in (0 = January). */
export const inspirationTitle = (month: number): string =>
  `Worth the trip this ${SEASONS[month] ?? 'season'}`;

/** The styles to suggest places for: the most recently touched trip that has some. */
export const stylesToSuggest = (
  trips: readonly Pick<TripListItem, 'styles'>[],
): readonly TripStyle[] =>
  trips.find((trip) => trip.styles.length > 0)?.styles ?? [];

/** "Picked for your styles: views, food and culture", or a general line without any. */
export const inspirationLine = (styles: readonly TripStyle[]): string =>
  styles.length === 0
    ? 'A few places we love right now'
    : `Picked for your styles: ${listOf(
        styles.map((style) => STYLE_SHORT_NAMES[style].toLowerCase()),
      )}`;
