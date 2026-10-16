import { hotelOfferSchema } from '@waypoint/contracts/hotels';
import type { TripDetail } from '@waypoint/contracts/trips';
import { savedOffer } from '@/features/trip-flow';

/** The hotel of the stay already chosen for this trip, if any. */
export const chosenHotelId = (
  trip: Pick<TripDetail, 'selections'>,
): string | undefined => savedOffer(trip, 'stay', hotelOfferSchema)?.hotel.id;
