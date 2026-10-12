import { z } from 'zod'
import { isoDateSchema } from '../common/index.ts'
import { tripDayInputSchema, tripDaySchema } from './plan.ts'
import { iataCodeSchema, profileSchema } from './profile.ts'
import { selectionKindSchema, tripSelectionSchema } from './selection.ts'
import {
  tripPaceSchema,
  tripSchema,
  tripSpotSchema,
  tripStatusSchema,
  tripStyleSchema,
} from './trip.ts'

// Request bodies are strict: an unknown field is a bug in the caller, not
// something to silently ignore. Responses are not, so adding a field to a
// response never breaks an app build that is already in the wild.

/** A trip with everything hanging off it — what `GET /trips/:id` returns. */
export const tripDetailSchema = tripSchema.extend({
  spots: z.array(tripSpotSchema),
  days: z.array(tripDaySchema),
  selections: z.array(tripSelectionSchema),
})
export type TripDetail = z.infer<typeof tripDetailSchema>

/* ── GET /me · PATCH /me ───────────────────────────────────────────────── */

export const getMeResponseSchema = profileSchema
export type GetMeResponse = z.infer<typeof getMeResponseSchema>

/**
 * `null` clears a field; an absent field is left alone. `z.exactOptional`
 * (not plain `.optional()`) is what makes that distinction real under
 * `exactOptionalPropertyTypes`: a plain optional's inferred value type still
 * includes `| undefined`, so `{ name: undefined }` would type-check as if it
 * meant "leave alone" while actually sending an explicit `undefined` over the
 * wire. `exactOptional` keeps the key itself optional but refuses a literal
 * `undefined` value, so "leave alone" can only be expressed by omitting the key.
 */
export const updateMeRequestSchema = z.strictObject({
  name: z.exactOptional(z.string().min(1).nullable()),
  homeAirport: z.exactOptional(iataCodeSchema.nullable()),
})
export type UpdateMeRequest = z.infer<typeof updateMeRequestSchema>

export const updateMeResponseSchema = profileSchema
export type UpdateMeResponse = z.infer<typeof updateMeResponseSchema>

/* ── GET /trips · POST /trips ──────────────────────────────────────────── */

export const listTripsResponseSchema = z.object({ trips: z.array(tripSchema) })
export type ListTripsResponse = z.infer<typeof listTripsResponseSchema>

/**
 * Step 1 creates the draft. The defaults are the sample trip's party size, so a
 * traveler who taps straight through still gets a usable draft.
 */
export const createTripRequestSchema = z.strictObject({
  styles: z.array(tripStyleSchema).default([]),
  pace: tripPaceSchema.default('balanced'),
  adults: z.number().int().min(1).default(2),
  children: z.number().int().min(0).default(0),
})
export type CreateTripRequest = z.infer<typeof createTripRequestSchema>

export const createTripResponseSchema = tripSchema
export type CreateTripResponse = z.infer<typeof createTripResponseSchema>

/* ── GET · PATCH · DELETE /trips/:id ───────────────────────────────────── */

export const tripParamsSchema = z.object({ id: z.uuid() })
export type TripParams = z.infer<typeof tripParamsSchema>

export const getTripResponseSchema = tripDetailSchema
export type GetTripResponse = z.infer<typeof getTripResponseSchema>

/**
 * Every step's picks go through here as the traveler moves, so a draft survives
 * closing the app. `status` is accepted but the service decides whether the
 * transition is legal. See `updateMeRequestSchema` above for why clearable
 * fields use `z.exactOptional` rather than plain `.optional()`.
 */
export const updateTripRequestSchema = z.strictObject({
  status: z.exactOptional(tripStatusSchema),
  styles: z.exactOptional(z.array(tripStyleSchema)),
  pace: z.exactOptional(tripPaceSchema),
  destinationId: z.exactOptional(z.string().min(1).nullable()),
  destinationName: z.exactOptional(z.string().min(1).nullable()),
  startDate: z.exactOptional(isoDateSchema.nullable()),
  endDate: z.exactOptional(isoDateSchema.nullable()),
  adults: z.exactOptional(z.number().int().min(1)),
  children: z.exactOptional(z.number().int().min(0)),
  spots: z.exactOptional(z.array(tripSpotSchema)),
})
export type UpdateTripRequest = z.infer<typeof updateTripRequestSchema>

export const updateTripResponseSchema = tripSchema
export type UpdateTripResponse = z.infer<typeof updateTripResponseSchema>

/* ── PUT /trips/:id/plan ───────────────────────────────────────────────── */

/** Replaces the whole plan: `planner` built it, `trips` stores it as given. */
export const putPlanRequestSchema = z.strictObject({
  days: z.array(tripDayInputSchema).min(1),
})
export type PutPlanRequest = z.infer<typeof putPlanRequestSchema>

export const putPlanResponseSchema = z.object({ days: z.array(tripDaySchema) })
export type PutPlanResponse = z.infer<typeof putPlanResponseSchema>

/* ── PUT /trips/:id/selections/:kind · PATCH …/booked ──────────────────── */

export const selectionParamsSchema = z.object({
  id: z.uuid(),
  kind: selectionKindSchema,
})
export type SelectionParams = z.infer<typeof selectionParamsSchema>

/**
 * The chosen offer, snapshotted as shown. `kind` comes from the path, not the
 * body — derived from `tripSelectionSchema` by omitting `kind` and the
 * server-set `bookedAt`, so the two shapes cannot drift apart.
 */
export const putSelectionRequestSchema = z.strictObject(
  tripSelectionSchema.omit({ kind: true, bookedAt: true }).shape,
)
export type PutSelectionRequest = z.infer<typeof putSelectionRequestSchema>

export const putSelectionResponseSchema = tripSelectionSchema
export type PutSelectionResponse = z.infer<typeof putSelectionResponseSchema>

/** The traveler ticking a row as booked on the partner site, or unticking it. */
export const patchSelectionBookedRequestSchema = z.strictObject({ booked: z.boolean() })
export type PatchSelectionBookedRequest = z.infer<typeof patchSelectionBookedRequestSchema>

export const patchSelectionBookedResponseSchema = tripSelectionSchema
export type PatchSelectionBookedResponse = z.infer<typeof patchSelectionBookedResponseSchema>
