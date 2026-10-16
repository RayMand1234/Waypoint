import type { TripPace } from '../trips/index.ts';

/**
 * Sightseeing minutes per day for each pace — what "fits in N days" and the
 * day plan budget against (travel between spots comes out of it too).
 */
export const DAILY_VISIT_MINUTES: Readonly<Record<TripPace, number>> = {
  relaxed: 4 * 60,
  balanced: 6 * 60,
  packed: 8 * 60,
};

/** Days needed to visit spots taking `minutes` in total at `pace` (at least 1). */
export const daysNeeded = (minutes: number, pace: TripPace): number =>
  Math.max(1, Math.ceil(minutes / DAILY_VISIT_MINUTES[pace]));
