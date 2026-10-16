import {
  flightSearchResponseSchema,
  type FlightSearchRequest,
  type FlightSearchResponse,
} from '@waypoint/contracts/flights';
import { apiRequest } from '@/shared/utils/apiClient';

/** Live fares, ranked best value first (price against duration and stops). */
export const searchFlights = (
  request: FlightSearchRequest,
): Promise<FlightSearchResponse> =>
  apiRequest('/flights/search', flightSearchResponseSchema, {
    method: 'POST',
    body: request,
  });
