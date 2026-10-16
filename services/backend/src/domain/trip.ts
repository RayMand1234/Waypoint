import {
  storedTripStatusSchema,
  tripSchema,
  type UpdateTripRequest,
} from '@waypoint/contracts/trips';
import type { z } from 'zod';

/** A trip as saved: its status is never `past` (that is read off the end date). */
export const storedTripSchema = tripSchema.extend({
  status: storedTripStatusSchema,
});
export type StoredTrip = z.infer<typeof storedTripSchema>;

/** Column changes to a trip — a PATCH minus `spots`, which replaces rows instead. */
export type TripChanges = Omit<UpdateTripRequest, 'spots'>;

/** Why a trip lookup inside a write found nothing. */
export type TripLookupError =
  | { readonly type: 'trip-not-found' }
  | { readonly type: 'selection-not-found' };
