import {
  err,
  ok,
  type Currency,
  type IataCode,
  type Result,
} from '@waypoint/contracts/common';
import type { FlightSearchRequest } from '@waypoint/contracts/flights';
import type { TripDetail } from '@waypoint/contracts/trips';

/** How many fares to compare. */
const FLIGHT_LIMIT = 30;
/** Children under this age fly as infants (on a lap). */
const INFANT_UNDER = 2;

/**
 * The round trip for a trip: from its departure airport to the
 * destination's, on its first and last day, for its whole party. Fails with
 * what's still missing, said for the traveler.
 */
export const flightRequest = (
  trip: Pick<
    TripDetail,
    'originAirport' | 'startDate' | 'endDate' | 'adults' | 'childrenAges'
  >,
  destinationAirport: IataCode,
  currency: Currency,
): Result<FlightSearchRequest, string> => {
  if (trip.originAirport === null)
    return err('Choose where you fly from in step 2.');

  if (trip.startDate === null || trip.endDate === null)
    return err('Set your dates in step 3.');

  if (trip.originAirport === destinationAirport)
    return err('You fly from the same airport you are going to.');

  const infants = trip.childrenAges.filter((age) => age < INFANT_UNDER).length;

  return ok({
    origin: trip.originAirport,
    destination: destinationAirport,
    departDate: trip.startDate,
    returnDate: trip.endDate,
    adults: trip.adults,
    children: trip.childrenAges.length - infants,
    infants,
    cabinClass: 'economy',
    currency,
    maxStops: null,
    limit: FLIGHT_LIMIT,
  });
};
