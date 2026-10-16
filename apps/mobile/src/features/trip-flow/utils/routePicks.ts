import {
  flightOfferSchema,
  type FlightOffer,
} from '@waypoint/contracts/flights';
import { hotelOfferSchema } from '@waypoint/contracts/hotels';
import type { TripDetail, TripStyle } from '@waypoint/contracts/trips';
import { tripDays } from '@/shared/utils/dates';
import { formatDateRange } from '@/shared/utils/format';
import { plural } from '@/shared/utils/text';
import { savedOffer } from './selections';

/** The one- or two-word name of each style on the Route. */
export const STYLE_SHORT_NAMES: Readonly<Record<TripStyle, string>> = {
  chill: 'Chill',
  trails: 'Trails',
  views: 'Views',
  culture: 'Culture',
  food: 'Food',
  beach: 'Beaches',
  night: 'Nightlife',
  family: 'Family',
};

const stylesPick = (styles: readonly TripStyle[]): string | undefined => {
  const [first, ...rest] = styles;

  if (first === undefined) return undefined;

  return rest.length === 0
    ? STYLE_SHORT_NAMES[first]
    : `${STYLE_SHORT_NAMES[first]} +${String(rest.length)}`;
};

/** A label is a word or two: the first word of a hotel or airline name. */
const firstWord = (name: string): string => name.split(/\s+/)[0] ?? name;

/** "Delta direct", "Lufthansa 1 stop". */
const flightPick = (offer: FlightOffer): string => {
  const airline =
    offer.legs[0]?.segments[0]?.carrier.name ??
    offer.legs[0]?.segments[0]?.carrier.code ??
    '';
  const stops = Math.max(...offer.legs.map((leg) => leg.stops));

  return `${firstWord(airline)} ${stops === 0 ? 'direct' : plural(stops, 'stop')}`;
};

/** What the traveler picked at each passed step, as the Route labels them: "Views +2", "Lisbon", "5 days", "Casa", "TAP direct". */
export const routePicks = (
  trip: Pick<
    TripDetail,
    'styles' | 'destinationName' | 'startDate' | 'endDate' | 'selections'
  >,
): string[] => {
  const stay = savedOffer(trip, 'stay', hotelOfferSchema);
  const flight = savedOffer(trip, 'flight', flightOfferSchema);
  const picks = [
    stylesPick(trip.styles),
    trip.destinationName ?? undefined,
    trip.startDate === null || trip.endDate === null
      ? undefined
      : plural(tripDays(trip.startDate, trip.endDate), 'day'),
    stay === undefined ? undefined : firstWord(stay.hotel.name),
    flight === undefined ? undefined : flightPick(flight),
  ];
  const firstGap = picks.indexOf(undefined);

  return (firstGap === -1 ? picks : picks.slice(0, firstGap)).flatMap((pick) =>
    pick === undefined ? [] : [pick],
  );
};

/** The step header's title: "New waypoint", then "Lisbon", then "Lisbon · 12–16 May". */
export const tripTitle = (
  trip: Pick<TripDetail, 'destinationName' | 'startDate' | 'endDate'>,
): string => {
  if (trip.destinationName === null) return 'New waypoint';

  return trip.startDate === null || trip.endDate === null
    ? trip.destinationName
    : `${trip.destinationName} · ${formatDateRange(trip.startDate, trip.endDate)}`;
};
