import {
  getTripResponseSchema,
  updateTripResponseSchema,
  type Trip,
  type TripDetail,
  type UpdateTripRequest,
} from '@waypoint/contracts/trips';
import { apiRequest } from '@/shared/utils/apiClient';

export const fetchTrip = (tripId: string): Promise<TripDetail> =>
  apiRequest(`/trips/${encodeURIComponent(tripId)}`, getTripResponseSchema);

/** Saves a step's picks. Returns the trip's own fields (not its spots, plan or selections). */
export const updateTrip = (
  tripId: string,
  changes: UpdateTripRequest,
): Promise<Trip> =>
  apiRequest(`/trips/${encodeURIComponent(tripId)}`, updateTripResponseSchema, {
    method: 'PATCH',
    body: changes,
  });
