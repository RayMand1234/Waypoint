import {
  getTripResponseSchema,
  putSelectionResponseSchema,
  updateTripResponseSchema,
  type PutSelectionRequest,
  type SelectionKind,
  type Trip,
  type TripDetail,
  type TripSelection,
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

/** Saves the offer chosen for one part of the trip (its flight, its stay). */
export const saveSelection = (
  tripId: string,
  kind: SelectionKind,
  selection: PutSelectionRequest,
): Promise<TripSelection> =>
  apiRequest(
    `/trips/${encodeURIComponent(tripId)}/selections/${kind}`,
    putSelectionResponseSchema,
    { method: 'PUT', body: selection },
  );
