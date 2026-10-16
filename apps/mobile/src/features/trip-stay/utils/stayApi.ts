import {
  getHotelResponseSchema,
  hotelSearchResponseSchema,
  type HotelDetail,
  type HotelSearchRequest,
  type HotelSearchResponse,
} from '@waypoint/contracts/hotels';
import {
  putSelectionResponseSchema,
  type PutSelectionRequest,
  type TripSelection,
} from '@waypoint/contracts/trips';
import { apiRequest } from '@/shared/utils/apiClient';

/** Live hotel prices, ranked best value first (location counts when searched by stops). */
export const searchStays = (
  request: HotelSearchRequest,
): Promise<HotelSearchResponse> =>
  apiRequest('/hotels/search', hotelSearchResponseSchema, {
    method: 'POST',
    body: request,
  });

/** A hotel's photos, facilities and check-in times, for its details sheet. */
export const fetchHotel = async (hotelId: string): Promise<HotelDetail> =>
  (
    await apiRequest(
      `/hotels/${encodeURIComponent(hotelId)}`,
      getHotelResponseSchema,
    )
  ).hotel;

export const saveStay = (
  tripId: string,
  selection: PutSelectionRequest,
): Promise<TripSelection> =>
  apiRequest(
    `/trips/${encodeURIComponent(tripId)}/selections/stay`,
    putSelectionResponseSchema,
    { method: 'PUT', body: selection },
  );
