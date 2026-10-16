import {
  createTripResponseSchema,
  listTripsResponseSchema,
  type CreateTripRequest,
  type Trip,
  type TripListItem,
} from '@waypoint/contracts/trips';
import { z } from 'zod';
import { apiRequest } from '@/shared/utils/apiClient';

export const fetchTrips = async (): Promise<readonly TripListItem[]> =>
  (await apiRequest('/trips', listTripsResponseSchema)).trips;

/** Starts a draft. Fields left out take the backend's defaults (2 adults, balanced pace). */
export const createTrip = (input: Partial<CreateTripRequest>): Promise<Trip> =>
  apiRequest('/trips', createTripResponseSchema, {
    method: 'POST',
    body: input,
  });

/** Deletes a trip for good — its plan and picks with it. */
export const deleteTrip = async (tripId: string): Promise<void> => {
  await apiRequest(`/trips/${encodeURIComponent(tripId)}`, z.null(), {
    method: 'DELETE',
  });
};
