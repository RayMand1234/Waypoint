import { z } from 'zod';
import {
  isoDateSchema,
  isoTimeSchema,
  latitudeSchema,
  longitudeSchema,
} from '../common/index.ts';

/**
 * One stop in a day, stored by value, so the plan survives the spot source
 * changing its ids.
 * `isFixed` is a stop the traveler pinned — the UI draws it dashed.
 */
export const tripStopSchema = z.object({
  id: z.uuid(),
  position: z.number().int().min(0),
  spotId: z.string().min(1),
  name: z.string().min(1),
  lat: latitudeSchema,
  lng: longitudeSchema,
  startsAt: isoTimeSchema,
  minutes: z.number().int().min(1),
  travelMinutesFromPrevious: z.number().int().min(0).nullable(),
  isFixed: z.boolean(),
});
export type TripStop = z.infer<typeof tripStopSchema>;

export const tripDaySchema = z.object({
  id: z.uuid(),
  dayIndex: z.number().int().min(0),
  date: isoDateSchema,
  // Matches tripDayInputSchema below: the API never accepts an empty day, so
  // the response type shouldn't claim to allow one either.
  stops: z.array(tripStopSchema).min(1),
});
export type TripDay = z.infer<typeof tripDaySchema>;

/**
 * The same shapes without the server-assigned ids, for `PUT /trips/:id/plan`.
 * Strict, like every request body: sending an `id` is a bug in the caller.
 */
export const tripStopInputSchema = z.strictObject(
  tripStopSchema.omit({ id: true }).shape,
);
export type TripStopInput = z.infer<typeof tripStopInputSchema>;

export const tripDayInputSchema = z.strictObject({
  ...tripDaySchema.omit({ id: true, stops: true }).shape,
  stops: z.array(tripStopInputSchema).min(1),
});
export type TripDayInput = z.infer<typeof tripDayInputSchema>;
