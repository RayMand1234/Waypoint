import type { TripDayInput, TripStopInput } from '@waypoint/contracts/trips';
import type { LatLng } from '../../lib/distance.ts';
import { assignSpots, orderDay } from './assign.ts';
import { timeOf } from './clock.ts';
import { LUNCH_MINUTES, scheduleDay, type DaySchedule } from './schedule.ts';
import type { DayFrame, Moment, PlanSpot } from './types.ts';

// The day plan as stops: the fixed moments, the visits with how to get there,
// and lunch — each day titled by its best-known spot.

type Item = Omit<TripStopInput, 'position'>;

const momentStop = (moment: Moment): Item => ({
  kind: moment.kind,
  spotId: null,
  name: moment.name,
  lat: moment.place?.lat ?? null,
  lng: moment.place?.lng ?? null,
  startsAt: timeOf(moment.at),
  minutes: moment.minutes,
  travelMinutesFromPrevious: null,
  travelMode: null,
  isFixed: false,
});

const lunchStop = (at: number): Item => ({
  kind: 'lunch',
  spotId: null,
  name: 'Lunch break',
  lat: null,
  lng: null,
  startsAt: timeOf(at),
  minutes: LUNCH_MINUTES,
  travelMinutesFromPrevious: null,
  travelMode: null,
  isFixed: false,
});

const visitStops = (schedule: DaySchedule): Item[] => {
  const visits = schedule.visits.map(
    ({ spot, start, travel }): Item & { readonly at: number } => ({
      kind: 'spot',
      spotId: spot.id,
      name: spot.name,
      lat: spot.lat,
      lng: spot.lng,
      startsAt: timeOf(start),
      minutes: spot.visitMinutes,
      travelMinutesFromPrevious: travel.minutes,
      travelMode: travel.mode,
      isFixed: false,
      at: start,
    }),
  );
  const lunch =
    schedule.lunchAt === null
      ? []
      : [{ ...lunchStop(schedule.lunchAt), at: schedule.lunchAt }];

  return [...visits, ...lunch]
    .sort((a, b) => a.at - b.at)
    .map(({ at: _at, ...item }) => item);
};

/** "Around Central Park" — the day's most popular spot; or what the day is for. */
const titleOf = (frame: DayFrame, route: readonly PlanSpot[]): string => {
  const top = [...route].sort((a, b) => b.popularity - a.popularity)[0];

  if (top !== undefined) return `Around ${top.name}`;

  if (frame.before.length > 0) return 'Arrive & settle in';

  return frame.after.length > 0 ? 'Head home' : 'A free day';
};

const dayOf = (
  frame: DayFrame,
  dayIndex: number,
  route: readonly PlanSpot[],
  schedule: DaySchedule | undefined,
): TripDayInput | undefined => {
  const items = [
    ...frame.before.map(momentStop),
    ...(schedule === undefined ? [] : visitStops(schedule)),
    ...frame.after.map(momentStop),
  ];

  if (items.length === 0) return undefined;

  return {
    dayIndex,
    date: frame.date,
    title: titleOf(frame, route),
    stops: items.map((item, position) => ({ ...item, position })),
  };
};

const toDays = (
  frames: readonly DayFrame[],
  home: LatLng,
  routes: readonly (readonly PlanSpot[])[],
  strict: boolean,
): TripDayInput[] =>
  frames.flatMap((frame, index) => {
    const route = routes[index] ?? [];
    const schedule =
      route.length === 0
        ? undefined
        : scheduleDay(frame, home, route, { strict });
    const day = dayOf(frame, index, route, schedule);

    return day === undefined ? [] : [day];
  });

export type BuiltPlan = {
  readonly days: readonly TripDayInput[];
  /** Spots that didn't fit, most popular first. */
  readonly droppedIds: readonly string[];
};

/** The whole plan, from the spots: the planner groups them into days itself. */
export const buildPlan = (
  frames: readonly DayFrame[],
  home: LatLng,
  spots: readonly PlanSpot[],
): BuiltPlan => {
  const { routes, dropped } = assignSpots(frames, home, spots);

  return {
    days: toDays(frames, home, routes, true),
    droppedIds: dropped.map((spot) => spot.id),
  };
};

/**
 * A plan the traveler grouped by hand (spots removed or moved): each day keeps
 * its spots, ordered and timed; nothing is dropped, even past the budget.
 */
export const arrangePlan = (
  frames: readonly DayFrame[],
  home: LatLng,
  spotsByDate: ReadonlyMap<string, readonly PlanSpot[]>,
): TripDayInput[] =>
  toDays(
    frames,
    home,
    frames.map((frame) =>
      orderDay(frame, home, spotsByDate.get(frame.date) ?? []),
    ),
    false,
  );
