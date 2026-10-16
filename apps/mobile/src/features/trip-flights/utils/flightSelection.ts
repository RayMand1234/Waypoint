import { flightOfferSchema } from '@waypoint/contracts/flights';
import type { TripDetail } from '@waypoint/contracts/trips';
import { savedOffer } from '@/features/trip-flow';

/** The itinerary of the flight already chosen for this trip, if any. */
export const chosenFlightId = (
  trip: Pick<TripDetail, 'selections'>,
): string | undefined => savedOffer(trip, 'flight', flightOfferSchema)?.id;
