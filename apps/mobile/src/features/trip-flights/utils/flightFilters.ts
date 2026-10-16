import type { FlightOffer } from '@waypoint/contracts/flights';

/** Narrowing the fares found, as the design's chips do. */
export type FlightFilter = 'direct' | 'checked-bag' | 'morning' | 'flexible';

export const FLIGHT_FILTERS: readonly {
  readonly value: FlightFilter;
  readonly label: string;
}[] = [
  { value: 'direct', label: 'Direct only' },
  { value: 'checked-bag', label: 'Checked bag' },
  { value: 'morning', label: 'Morning out' },
  { value: 'flexible', label: 'Flexible' },
];

/** A way out that leaves before noon, local time. */
const MORNING_BEFORE_HOUR = 12;

const hourOf = (localDateTime: string): number =>
  Number(localDateTime.slice(11, 13));

const MATCHES: Readonly<Record<FlightFilter, (offer: FlightOffer) => boolean>> =
  {
    direct: (offer) => offer.legs.every((leg) => leg.stops === 0),
    'checked-bag': (offer) => offer.baggage.checked === true,
    morning: (offer) => {
      const out = offer.legs.find((leg) => leg.direction === 'outbound');

      return out !== undefined && hourOf(out.departAt) < MORNING_BEFORE_HOUR;
    },
    flexible: (offer) => offer.changeable === true || offer.refundable === true,
  };

/** The fares that pass every chosen filter, in the order given. */
export const filterFlights = (
  offers: readonly FlightOffer[],
  filters: readonly FlightFilter[],
): FlightOffer[] =>
  offers.filter((offer) => filters.every((filter) => MATCHES[filter](offer)));

/** The filters with `filter` added, or removed if it was on. */
export const toggleFilter = (
  filters: readonly FlightFilter[],
  filter: FlightFilter,
): FlightFilter[] =>
  filters.includes(filter)
    ? filters.filter((other) => other !== filter)
    : [...filters, filter];
