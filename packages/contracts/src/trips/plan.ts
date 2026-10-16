import { z } from 'zod';
import {
  isoDateSchema,
  isoTimeSchema,
  latitudeSchema,
  longitudeSchema,
} from '../common/index.ts';

/**
 * What a stop is: a spot to visit, or one of the fixed moments around them —
 * landing, checking in, lunch, heading to the airport, flying home.
 */
export const stopKindSchema = z.enum([
  'spot',
  'arrival',
  'check-in',
  'lunch',
  'to-airport',
  'departure',
]);
export type StopKind = z.infer<typeof stopKindSchema>;

/** How you get to a stop from the one before: on foot, or by public transport. */
export const travelModeSchema = z.enum(['walk', 'transit']);
export type TravelMode = z.infer<typeof travelModeSchema>;

const stopShape = {
  id: z.uuid(),
  position: z.number().int().min(0),
  kind: stopKindSchema,
  /** The spot visited; `null` for the fixed moments. Stored by value, so the plan survives the spot source changing its ids. */
  spotId: z.string().min(1).nullable(),
  name: z.string().min(1),
  /** Where it is; `null` for a moment with no one place (lunch). */
  lat: latitudeSchema.nullable(),
  lng: longitudeSchema.nullable(),
  startsAt: isoTimeSchema,
  minutes: z.number().int().min(1),
  travelMinutesFromPrevious: z.number().int().min(0).nullable(),
  travelMode: travelModeSchema.nullable(),
  /** A stop the traveler pinned — the UI draws it dashed. */
  isFixed: z.boolean(),
};

const isWholeSpot = (stop: {
  readonly kind: StopKind;
  readonly spotId: string | null;
  readonly lat: number | null;
  readonly lng: number | null;
}): boolean =>
  stop.kind !== 'spot' ||
  (stop.spotId !== null && stop.lat !== null && stop.lng !== null);

const SPOT_NEEDS = {
  message: 'A spot stop needs its spotId, lat and lng.',
  path: ['spotId'],
};

/** One stop in a day. */
export const tripStopSchema = z
  .object(stopShape)
  .refine(isWholeSpot, SPOT_NEEDS);
export type TripStop = z.infer<typeof tripStopSchema>;

const dayShape = {
  id: z.uuid(),
  dayIndex: z.number().int().min(0),
  date: isoDateSchema,
  /** "Around Central Park", "Arrive & settle in"; `null` on plans saved before titles. */
  title: z.string().min(1).nullable(),
};

export const tripDaySchema = z.object({
  ...dayShape,
  // Matches tripDayInputSchema below: the API never accepts an empty day, so
  // the response type shouldn't claim to allow one either.
  stops: z.array(tripStopSchema).min(1),
});
export type TripDay = z.infer<typeof tripDaySchema>;

/**
 * The same shapes without the server-assigned ids, for `PUT /trips/:id/plan`.
 * Strict, like every request body: sending an `id` is a bug in the caller.
 */
export const tripStopInputSchema = z
  .strictObject(z.object(stopShape).omit({ id: true }).shape)
  .refine(isWholeSpot, SPOT_NEEDS);
export type TripStopInput = z.infer<typeof tripStopInputSchema>;

export const tripDayInputSchema = z.strictObject({
  ...z.object(dayShape).omit({ id: true }).shape,
  stops: z.array(tripStopInputSchema).min(1),
});
export type TripDayInput = z.infer<typeof tripDayInputSchema>;
