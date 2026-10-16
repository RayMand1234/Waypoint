import { z } from 'zod';
import {
  isoDateTimeSchema,
  jsonObjectSchema,
  moneySchema,
  providerIdSchema,
} from '../common/index.ts';
import { flightOfferSchema } from '../flights/flight.ts';
import { hotelOfferSchema } from '../hotels/hotel.ts';

/** The parts of a trip a traveler books, one selection each. */
export const selectionKindSchema = z.enum(['flight', 'stay', 'ticket']);
export type SelectionKind = z.infer<typeof selectionKindSchema>;

/**
 * What a selection's snapshot must be, per kind — checked when it is saved.
 * Saved snapshots are read back loosely (`jsonObjectSchema`): each keeps the
 * shape the app showed then, even after the offer schemas grow.
 */
export const offerSnapshotSchemas = {
  flight: flightOfferSchema,
  stay: hotelOfferSchema,
  // Tickets have no offer contract yet.
  ticket: jsonObjectSchema,
} as const satisfies Record<SelectionKind, z.ZodType>;

/**
 * The offer the traveler chose, snapshotted exactly as the app showed it, so the
 * summary keeps saying the same thing after the provider's price moves.
 * `checkedAt` drives "checked 3h ago"; the final price is always confirmed on the
 * partner site that `deepLink` opens. `bookedAt` is set when the traveler ticks
 * the row as booked — Waypoint never books anything itself.
 */
export const tripSelectionSchema = z.object({
  kind: selectionKindSchema,
  offerSnapshot: jsonObjectSchema,
  provider: providerIdSchema,
  deepLink: z.url(),
  price: moneySchema,
  checkedAt: isoDateTimeSchema,
  bookedAt: isoDateTimeSchema.nullable(),
});
export type TripSelection = z.infer<typeof tripSelectionSchema>;
