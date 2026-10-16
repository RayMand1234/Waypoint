import type { LatLng } from '../../lib/distance.ts';
import { travelLeg, type TravelLeg } from '../../lib/travel.ts';
import { at, minutesOf } from './clock.ts';
import type { DayFrame, PlanSpot } from './types.ts';

// Lays one day's spots, in order, on the clock: travel from the stay (or the
// last spot), wait for the doors to open, visit, and break for lunch around
// midday. Strictly, a day that runs over its budget or end, or reaches a
// closed spot, doesn't fit; loosely (a traveler's own edit) everything is
// placed and only waits for opening are kept.

/** Lunch fits between noon and 14:30, for an hour. */
const LUNCH_EARLIEST = at(12);
const LUNCH_DUE = at(12, 30);
const LUNCH_LATEST = at(14, 30);

export const LUNCH_MINUTES = 60;
/** Waiting at a closed door counts against a route, a little. */
const WAIT_COST = 0.5;
const MINUTES_PER_DAY = at(24);

export type Visit = {
  readonly spot: PlanSpot;
  readonly start: number;
  /** From the stay for the first visit, else from the spot before. */
  readonly travel: TravelLeg;
};

export type DaySchedule = {
  readonly visits: readonly Visit[];
  readonly lunchAt: number | null;
  readonly travelMinutes: number;
  readonly waitMinutes: number;
  /** Visiting plus travelling — what the budget counts. */
  readonly usedMinutes: number;
};

/** When a visit arriving at `arrive` can start: at once, or once it opens; `undefined` when it can't fit an opening that day. */
export const visitStart = (
  spot: PlanSpot,
  weekday: number,
  arrive: number,
): number | undefined => {
  const weekly = spot.openingHours?.weekly ?? null;

  if (weekly === null) return arrive;

  return weekly
    .filter((period) => period.day === weekday)
    .map((period) => {
      const opens = minutesOf(period.opens);
      const closes = minutesOf(period.closes);

      // Closing at or before opening means after midnight.
      return {
        opens,
        closes: closes <= opens ? closes + MINUTES_PER_DAY : closes,
      };
    })
    .map(({ opens, closes }) => {
      const start = Math.max(arrive, opens);

      return start + spot.visitMinutes <= closes ? start : undefined;
    })
    .reduce<number | undefined>(
      (earliest, start) =>
        start !== undefined && (earliest === undefined || start < earliest)
          ? start
          : earliest,
      undefined,
    );
};

type Running = DaySchedule & {
  readonly clock: number;
  readonly place: LatLng;
};

const lunchNow = (state: Running, nextArrive: number): boolean =>
  state.lunchAt === null &&
  nextArrive >= LUNCH_DUE &&
  state.clock < LUNCH_LATEST;

/**
 * The day's schedule for these spots in this order; `undefined` when, strictly,
 * they don't fit (over budget, past the day's end, or a spot closed).
 */
export const scheduleDay = (
  frame: DayFrame,
  home: LatLng,
  spots: readonly PlanSpot[],
  { strict }: { readonly strict: boolean },
): DaySchedule | undefined => {
  const initial: Running = {
    visits: [],
    lunchAt: null,
    travelMinutes: 0,
    waitMinutes: 0,
    usedMinutes: 0,
    clock: frame.start,
    place: home,
  };
  const final = spots.reduce<Running | undefined>((state, spot) => {
    if (state === undefined) return undefined;

    const travel = travelLeg(state.place, spot);
    const takesLunch =
      frame.start < LUNCH_DUE && lunchNow(state, state.clock + travel.minutes);
    const lunchAt = takesLunch
      ? Math.max(state.clock, LUNCH_EARLIEST)
      : state.lunchAt;
    const leaves = takesLunch ? (lunchAt ?? 0) + LUNCH_MINUTES : state.clock;
    const arrive = leaves + travel.minutes;
    const opensAt = visitStart(spot, frame.weekday, arrive);

    if (opensAt === undefined && strict) return undefined;

    const start = opensAt ?? arrive;
    const end = start + spot.visitMinutes;
    const usedMinutes = state.usedMinutes + travel.minutes + spot.visitMinutes;

    if (strict && (end > frame.end || usedMinutes > frame.budget))
      return undefined;

    return {
      visits: [...state.visits, { spot, start, travel }],
      lunchAt,
      travelMinutes: state.travelMinutes + travel.minutes,
      waitMinutes: state.waitMinutes + (start - arrive),
      usedMinutes,
      clock: end,
      place: spot,
    };
  }, initial);

  if (final === undefined) return undefined;

  // Done by early afternoon without a break: lunch after the last visit.
  const lunchAfter =
    final.lunchAt === null &&
    final.visits.length > 0 &&
    final.clock >= LUNCH_EARLIEST &&
    final.clock < LUNCH_LATEST
      ? final.clock
      : final.lunchAt;

  return {
    visits: final.visits,
    lunchAt: lunchAfter,
    travelMinutes: final.travelMinutes,
    waitMinutes: final.waitMinutes,
    usedMinutes: final.usedMinutes,
  };
};

/** What a day's route costs: its travel, and a little for waiting. */
export const scheduleCost = (schedule: DaySchedule): number =>
  schedule.travelMinutes + WAIT_COST * schedule.waitMinutes;
