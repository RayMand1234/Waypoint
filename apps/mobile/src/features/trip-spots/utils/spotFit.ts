import {
  DAILY_VISIT_MINUTES,
  daysNeeded,
  type Spot,
} from '@waypoint/contracts/destinations';
import type { TripPace } from '@waypoint/contracts/trips';
import { plural } from '@/shared/utils/text';

/** Leave a fifth of each day for getting between spots, meals and rest. */
const PLANNABLE_SHARE = 0.8;

export const totalMinutes = (
  spots: readonly Pick<Spot, 'visitMinutes'>[],
): number => spots.reduce((sum, spot) => sum + spot.visitMinutes, 0);

/** Whether the picked spots fit the trip's days at its pace. */
export const fitsIn = (
  spots: readonly Pick<Spot, 'visitMinutes'>[],
  days: number,
  pace: TripPace,
): boolean => daysNeeded(totalMinutes(spots) / PLANNABLE_SHARE, pace) <= days;

/** "Fits in 5 days" / "Too many for 5 days". */
export const fitLabel = (
  spots: readonly Pick<Spot, 'visitMinutes'>[],
  days: number,
  pace: TripPace,
): string =>
  fitsIn(spots, days, pace)
    ? `Fits in ${plural(days, 'day')}`
    : `Too many for ${plural(days, 'day')}`;

/**
 * A first pick for a new trip: the best-ranked spots, in order, while they
 * still fit the days. The traveler adjusts from there.
 */
export const suggestedSpotIds = (
  rankedSpots: readonly Spot[],
  days: number,
  pace: TripPace,
): string[] => {
  const budget = days * DAILY_VISIT_MINUTES[pace] * PLANNABLE_SHARE;

  return rankedSpots
    .reduce<{ readonly ids: readonly string[]; readonly minutes: number }>(
      (picked, spot) =>
        picked.minutes + spot.visitMinutes <= budget
          ? {
              ids: [...picked.ids, spot.id],
              minutes: picked.minutes + spot.visitMinutes,
            }
          : picked,
      { ids: [], minutes: 0 },
    )
    .ids.slice();
};
