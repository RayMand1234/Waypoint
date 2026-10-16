import type { IsoDate } from '@waypoint/contracts/common';
import type { LatLng } from '../../lib/distance.ts';
import { clamp } from '../../lib/stats.ts';
import { at, weekdayOf } from './clock.ts';
import type { DayFrame, Moment } from './types.ts';

// When each day leaves room for spots. A full day runs 09:30–21:00; the
// flights shorten the first and last days, and fill them with the fixed
// moments around landing and leaving.

const DAY_START = at(9, 30);
const DAY_END = at(21);
/** Off the plane, through passport control, bags. */
const ARRIVAL_MINUTES = 45;
/** Airport to the stay, and back. A rough city average; no airport coordinates yet. */
const TRANSFER_MINUTES = 60;
const CHECK_IN_MINUTES = 30;
/** Leave for the airport this long before the flight (transfer plus check-in and security). */
const LEAVE_BEFORE_FLIGHT = 180;

/** The trip as the day frames need it. */
export type TravelFrame = {
  readonly dates: readonly IsoDate[];
  /** Visiting plus travelling a full day allows, by pace. */
  readonly paceMinutes: number;
  readonly stay: { readonly name: string; readonly place: LatLng } | null;
  readonly arrival: {
    readonly date: IsoDate;
    readonly at: number;
    /** "John F. Kennedy (JFK)". */
    readonly airport: string;
  } | null;
  readonly departure: {
    readonly date: IsoDate;
    readonly at: number;
    readonly airport: string;
    readonly flightMinutes: number;
  } | null;
};

const arrivalMoments = (
  arrival: NonNullable<TravelFrame['arrival']>,
  stay: TravelFrame['stay'],
): readonly Moment[] => [
  {
    kind: 'arrival',
    name: `Land at ${arrival.airport}`,
    at: arrival.at,
    minutes: ARRIVAL_MINUTES,
    place: null,
  },
  {
    kind: 'check-in',
    name: stay === null ? 'Check in' : `Check in at ${stay.name}`,
    at: arrival.at + ARRIVAL_MINUTES + TRANSFER_MINUTES,
    minutes: CHECK_IN_MINUTES,
    place: stay?.place ?? null,
  },
];

const departureMoments = (
  departure: NonNullable<TravelFrame['departure']>,
): readonly Moment[] => [
  {
    kind: 'to-airport',
    name: `Head to ${departure.airport}`,
    at: departure.at - LEAVE_BEFORE_FLIGHT,
    minutes: TRANSFER_MINUTES,
    place: null,
  },
  {
    kind: 'departure',
    name: 'Fly home',
    at: departure.at,
    minutes: Math.max(1, departure.flightMinutes),
    place: null,
  },
];

const endOf = (moments: readonly Moment[]): number =>
  Math.max(...moments.map((moment) => moment.at + moment.minutes));

/** Each trip day's room for spots. A day spent flying (before landing, after leaving) has none. */
export const dayFrames = (trip: TravelFrame): DayFrame[] =>
  trip.dates.map((date) => {
    const { arrival, departure } = trip;
    const isArrival = arrival?.date === date;
    const isDeparture = departure?.date === date;
    const before = isArrival ? arrivalMoments(arrival, trip.stay) : [];
    const after = isDeparture ? departureMoments(departure) : [];
    const away =
      (arrival !== null && date < arrival.date) ||
      (departure !== null && date > departure.date);
    const start =
      before.length > 0 ? Math.max(DAY_START, endOf(before)) : DAY_START;
    const end =
      after[0] === undefined ? DAY_END : Math.min(DAY_END, after[0].at);
    const room = away ? 0 : Math.max(0, end - start);

    return {
      date,
      weekday: weekdayOf(date),
      start,
      end: away ? start : Math.max(start, end),
      budget: clamp(0, trip.paceMinutes, room),
      before,
      after,
    };
  });
