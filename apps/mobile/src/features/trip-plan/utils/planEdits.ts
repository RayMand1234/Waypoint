import type { BuildPlanRequest, TripDay } from '@waypoint/contracts/trips';

/** The plan as the traveler groups it: each day's spots, by date. */
export type Grouping = NonNullable<BuildPlanRequest['days']>;

/** The grouping a saved plan has. */
export const groupingOf = (days: readonly TripDay[]): Grouping =>
  days.map((day) => ({
    date: day.date,
    spotIds: day.stops.flatMap((stop) =>
      stop.spotId === null ? [] : [stop.spotId],
    ),
  }));

/** Without the spot, wherever it was. */
export const withoutSpot = (grouping: Grouping, spotId: string): Grouping =>
  grouping.map((day) => ({
    ...day,
    spotIds: day.spotIds.filter((id) => id !== spotId),
  }));

/** With the spot on `date` (and off any other day). */
export const withSpotOn = (
  grouping: Grouping,
  spotId: string,
  date: string,
): Grouping =>
  withoutSpot(grouping, spotId).map((day) =>
    day.date === date ? { ...day, spotIds: [...day.spotIds, spotId] } : day,
  );
