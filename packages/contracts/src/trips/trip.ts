import { z } from 'zod';
import {
  childAgeSchema,
  iataCodeSchema,
  isoDateSchema,
  isoDateTimeSchema,
  MAX_CHILDREN,
} from '../common/index.ts';

/**
 * `draft` — still being planned, resumes at its step.
 * `planned` — every step done, nothing ticked as booked yet.
 * `booked` — the traveler ticked at least one part as booked on the partner site.
 * `past` — the end date has gone by.
 */
export const tripStatusSchema = z.enum(['draft', 'planned', 'booked', 'past']);
export type TripStatus = z.infer<typeof tripStatusSchema>;

/** The statuses a trip is saved with. `past` is never stored — it is read off the end date. */
export const storedTripStatusSchema = tripStatusSchema.exclude(['past']);
export type StoredTripStatus = z.infer<typeof storedTripStatusSchema>;

/** How full a day the day-plan algorithm should build. */
export const tripPaceSchema = z.enum(['relaxed', 'balanced', 'packed']);
export type TripPace = z.infer<typeof tripPaceSchema>;

/** The trip styles of step 1, in the order `docs/design/screens/Style.dc.html` shows them. */
export const tripStyleSchema = z.enum([
  'chill',
  'trails',
  'views',
  'culture',
  'food',
  'beach',
  'night',
  'family',
]);
export type TripStyle = z.infer<typeof tripStyleSchema>;

/** A spot the traveler picked in step 3. `spotId` is the spot source's id, stored by value. */
export const tripSpotSchema = z.object({
  spotId: z.string().min(1),
  name: z.string().min(1),
});
export type TripSpot = z.infer<typeof tripSpotSchema>;

/** A trip's own fields, without its plan, spots or selections. */
export const tripSchema = z.object({
  id: z.uuid(),
  status: tripStatusSchema,
  styles: z.array(tripStyleSchema),
  pace: tripPaceSchema,
  destinationId: z.string().min(1).nullable(),
  destinationName: z.string().min(1).nullable(),
  startDate: isoDateSchema.nullable(),
  endDate: isoDateSchema.nullable(),
  /** Where the flights leave from — picked in the Destination step. */
  originAirport: iataCodeSchema.nullable(),
  adults: z.number().int().min(1),
  /** One age per child; searches need each child's age, not just a count. */
  childrenAges: z.array(childAgeSchema).max(MAX_CHILDREN),
  updatedAt: isoDateTimeSchema,
});
export type Trip = z.infer<typeof tripSchema>;
