import type { Currency } from '@waypoint/contracts/common';
import type { Destination, Spot } from '@waypoint/contracts/destinations';
import {
  DEFAULT_GUEST_NATIONALITY,
  MAX_STOPS,
  type HotelSearchRequest,
  type StopPoint,
} from '@waypoint/contracts/hotels';
import type { TripDetail } from '@waypoint/contracts/trips';
import { tripDays } from '@/shared/utils/dates';
import { plural } from '@/shared/utils/text';

/** How many stays to compare. */
const STAY_LIMIT = 20;
/** Around the city centre when the trip has no spots. */
const CITY_RADIUS_M = 5000;

/** Where the picked spots are; the most popular first when there are more than we weigh. */
export const pickedStops = (
  trip: Pick<TripDetail, 'spots'>,
  spots: readonly Spot[],
): StopPoint[] => {
  const picked = new Set(trip.spots.map((spot) => spot.spotId));

  return spots
    .filter((spot) => picked.has(spot.id))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, MAX_STOPS)
    .map(({ lat, lng }) => ({ lat, lng }));
};

/**
 * The stay search for a trip: around its picked spots, or around the city
 * centre when it has none. Nights run from the first day to the last (the
 * last is the day home). `undefined` until there is at least one night.
 */
export const stayRequest = (
  trip: Pick<
    TripDetail,
    'startDate' | 'endDate' | 'adults' | 'childrenAges' | 'spots'
  >,
  spots: readonly Spot[],
  destination: Pick<Destination, 'lat' | 'lng'>,
  currency: Currency,
): HotelSearchRequest | undefined => {
  if (
    trip.startDate === null ||
    trip.endDate === null ||
    trip.endDate <= trip.startDate
  )
    return undefined;

  const [first, ...rest] = pickedStops(trip, spots);

  return {
    location:
      first === undefined
        ? {
            type: 'coordinates',
            lat: destination.lat,
            lng: destination.lng,
            radiusMeters: CITY_RADIUS_M,
          }
        : { type: 'stops', stops: [first, ...rest] },
    checkin: trip.startDate,
    checkout: trip.endDate,
    adults: trip.adults,
    childrenAges: [...trip.childrenAges],
    currency,
    // Some rates depend on it; the traveler's own isn't asked for yet.
    guestNationality: DEFAULT_GUEST_NATIONALITY,
    limit: STAY_LIMIT,
  };
};

/** Under the question: how many nights, and what the stays are near. */
export const stayHint = (
  trip: Pick<TripDetail, 'destinationName'>,
  request: HotelSearchRequest | undefined,
): string | undefined => {
  if (request === undefined) return undefined;

  // Days count both ends; nights are the gaps between them.
  const nights = tripDays(request.checkin, request.checkout) - 1;
  const where =
    request.location.type === 'stops'
      ? `near your ${plural(request.location.stops.length, 'spot')}`
      : `in ${trip.destinationName ?? 'the city'}`;

  return `${plural(nights, 'night')} ${where}, best value first.`;
};
