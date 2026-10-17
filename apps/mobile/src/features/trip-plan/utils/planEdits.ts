import type {
  BuildPlanRequest,
  TripDay,
  TripStop,
} from '@waypoint/contracts/trips';

/** The plan as the traveler arranges it: each day's spots in order, and lunch's place among them, by date. */
export type Grouping = NonNullable<BuildPlanRequest['days']>;

type DayGrouping = Grouping[number];

/** Lunch's key among a day's draggable stops; spots go by their spot id. */
export const LUNCH_KEY = 'lunch';

/** The key a stop is dragged by: its spot, or lunch; fixed moments (flights, check-in) have none. */
export const dragKeyOf = (stop: TripStop): string | null => {
  if (stop.spotId !== null) return stop.spotId;

  return stop.kind === 'lunch' ? LUNCH_KEY : null;
};

/** The day's draggable stops in order: spots, and lunch among them. */
export const dragKeysOf = (day: TripDay): string[] =>
  day.stops.flatMap((stop) => dragKeyOf(stop) ?? []);

/** A day's grouping from its keys in order: lunch's place is how many spots come before it. */
const fromKeys = (
  date: DayGrouping['date'],
  keys: readonly string[],
): DayGrouping => {
  const lunch = keys.indexOf(LUNCH_KEY);
  const spotIds = keys.filter((key) => key !== LUNCH_KEY);

  return lunch === -1
    ? { date, spotIds }
    : { date, spotIds, lunchAfter: lunch };
};

/** The grouping a saved plan has. */
export const groupingOf = (days: readonly TripDay[]): Grouping =>
  days.map((day) => fromKeys(day.date, dragKeysOf(day)));

/** The day without the spot; lunch keeps its place among the rest. */
const dayWithout = (day: DayGrouping, spotId: string): DayGrouping => {
  const index = day.spotIds.indexOf(spotId);

  if (index === -1) return day;

  const spotIds = day.spotIds.filter((id) => id !== spotId);

  return day.lunchAfter === undefined
    ? { date: day.date, spotIds }
    : {
        date: day.date,
        spotIds,
        lunchAfter:
          index < day.lunchAfter ? day.lunchAfter - 1 : day.lunchAfter,
      };
};

/** Without the spot, wherever it was. */
export const withoutSpot = (grouping: Grouping, spotId: string): Grouping =>
  grouping.map((day) => dayWithout(day, spotId));

/** With the spot on `date` (and off any other day); the planner finds its place there. */
export const withSpotOn = (
  grouping: Grouping,
  spotId: string,
  date: string,
): Grouping =>
  withoutSpot(grouping, spotId).map((day) =>
    day.date === date ? { ...day, spotIds: [...day.spotIds, spotId] } : day,
  );

/** With `date`'s spots, and lunch, in the order of these keys. */
export const withDayOrder = (
  grouping: Grouping,
  date: DayGrouping['date'],
  keys: readonly string[],
): Grouping =>
  grouping.map((day) => (day.date === date ? fromKeys(date, keys) : day));

/** The items with the one at `from` moved to `to`. */
export const moveItem = <T>(
  items: readonly T[],
  from: number,
  to: number,
): T[] => {
  const item = items[from];

  if (item === undefined) return [...items];

  const rest = items.filter((_, index) => index !== from);

  return [...rest.slice(0, to), item, ...rest.slice(to)];
};

/**
 * The day with its stops shown in the traveler's new order while the plan is
 * re-timed: spots and lunch swap into each other's slots; the fixed moments
 * stay put.
 */
export const withStopsOrdered = (
  day: TripDay,
  keys: readonly string[],
): TripDay => {
  const byKey = new Map(
    day.stops.flatMap((stop): [string, TripStop][] => {
      const key = dragKeyOf(stop);

      return key === null ? [] : [[key, stop]];
    }),
  );
  const ordered = keys.flatMap((key) => byKey.get(key) ?? []);

  return {
    ...day,
    stops: day.stops.reduce<{
      readonly stops: TripStop[];
      readonly next: number;
    }>(
      (acc, stop) =>
        dragKeyOf(stop) === null
          ? { stops: [...acc.stops, stop], next: acc.next }
          : {
              stops: [...acc.stops, ordered[acc.next] ?? stop],
              next: acc.next + 1,
            },
      { stops: [], next: 0 },
    ).stops,
  };
};
