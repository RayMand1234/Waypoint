import { z } from 'zod'
import { isoDateSchema, isoTimeSchema } from '../common/index.ts'

/**
 * One stop in a day. `planner` computed it; `trips` only stores the result, by
 * value, so the plan survives `planner` changing its spot ids.
 * `isFixed` is a stop the traveler pinned — the UI draws it dashed.
 */
export const tripStopSchema = z.object({
  id: z.uuid(),
  position: z.number().int().min(0),
  spotId: z.string().min(1),
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  startsAt: isoTimeSchema,
  minutes: z.number().int().min(1),
  travelMinutesFromPrevious: z.number().int().min(0).nullable(),
  isFixed: z.boolean(),
})
export type TripStop = z.infer<typeof tripStopSchema>

export const tripDaySchema = z.object({
  id: z.uuid(),
  dayIndex: z.number().int().min(0),
  date: isoDateSchema,
  stops: z.array(tripStopSchema),
})
export type TripDay = z.infer<typeof tripDaySchema>

/**
 * The same shapes without the server-assigned ids, for `PUT /trips/:id/plan`.
 * Strict, like every request body: sending an `id` is a bug in the caller.
 */
export const tripStopInputSchema = z.strictObject(tripStopSchema.omit({ id: true }).shape)
export type TripStopInput = z.infer<typeof tripStopInputSchema>

export const tripDayInputSchema = z.strictObject({
  ...tripDaySchema.omit({ id: true, stops: true }).shape,
  stops: z.array(tripStopInputSchema).min(1),
})
export type TripDayInput = z.infer<typeof tripDayInputSchema>
