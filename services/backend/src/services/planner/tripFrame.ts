import { DAILY_VISIT_MINUTES } from '@waypoint/contracts/destinations';
import type { Destination } from '@waypoint/contracts/destinations';
import {
  flightOfferSchema,
  type FlightLeg,
  type FlightSegment,
} from '@waypoint/contracts/flights';
import { hotelOfferSchema } from '@waypoint/contracts/hotels';
import type { TripDetail } from '@waypoint/contracts/trips';
import { isoDateSchema } from '@waypoint/contracts/common';
import { datesBetween } from '../../lib/dates.ts';
import type { LatLng } from '../../lib/distance.ts';
import { minutesOf } from './clock.ts';
import type { TravelFrame } from './frames.ts';

// What the planner needs from a trip: its days and pace, where the traveler
// sleeps (the chosen stay, else the city centre), and when the chosen flights
// land and leave. Pure.

export type TripPlanInput = {
  readonly frame: TravelFrame;
  /** Where each day starts: the stay, or the destination's centre. */
  readonly home: LatLng;
};

const snapshotOf = (trip: TripDetail, kind: 'stay' | 'flight'): unknown =>
  trip.selections.find((selection) => selection.kind === kind)?.offerSnapshot;

/** "John F. Kennedy International Airport" → "John F. Kennedy (JFK)". */
const airportName = (name: string | null, code: string): string =>
  name === null
    ? code
    : `${name.replace(/\s+(International\s+)?Airport$/i, '')} (${code})`;

const legOf = (
  legs: readonly FlightLeg[],
  direction: FlightLeg['direction'],
): FlightLeg | undefined => legs.find((leg) => leg.direction === direction);

const landing = (
  leg: FlightLeg,
  last: FlightSegment,
): TravelFrame['arrival'] => ({
  date: isoDateSchema.parse(leg.arriveAt.slice(0, 10)),
  at: minutesOf(leg.arriveAt.slice(11, 16)),
  airport: airportName(last.toName, last.to),
});

const leaving = (
  leg: FlightLeg,
  first: FlightSegment,
): TravelFrame['departure'] => ({
  date: isoDateSchema.parse(leg.departAt.slice(0, 10)),
  at: minutesOf(leg.departAt.slice(11, 16)),
  airport: airportName(first.fromName, first.from),
  flightMinutes: leg.durationMinutes,
});

/** The planner's input for a trip; `undefined` until it has dates. */
export const tripPlanInput = (
  trip: TripDetail,
  destination: Pick<Destination, 'lat' | 'lng'>,
): TripPlanInput | undefined => {
  if (trip.startDate === null || trip.endDate === null) return undefined;

  const stay = hotelOfferSchema.safeParse(snapshotOf(trip, 'stay'));
  const flight = flightOfferSchema.safeParse(snapshotOf(trip, 'flight'));
  const outbound = flight.success
    ? legOf(flight.data.legs, 'outbound')
    : undefined;
  const inbound = flight.success
    ? legOf(flight.data.legs, 'inbound')
    : undefined;
  const lastOut = outbound?.segments.at(-1);
  const firstBack = inbound?.segments[0];
  const home = stay.success
    ? { lat: stay.data.hotel.lat, lng: stay.data.hotel.lng }
    : { lat: destination.lat, lng: destination.lng };

  return {
    home,
    frame: {
      dates: datesBetween(trip.startDate, trip.endDate),
      paceMinutes: DAILY_VISIT_MINUTES[trip.pace],
      stay: stay.success ? { name: stay.data.hotel.name, place: home } : null,
      arrival:
        outbound === undefined || lastOut === undefined
          ? null
          : landing(outbound, lastOut),
      departure:
        inbound === undefined || firstBack === undefined
          ? null
          : leaving(inbound, firstBack),
    },
  };
};
