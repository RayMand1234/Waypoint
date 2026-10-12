import { z } from 'zod'
import { isoDateTimeSchema } from '../common/index.ts'

/** A home airport as a 3-letter IATA code, e.g. `TLV`. Branded: only a parsed value is one. */
export const iataCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'expected a 3-letter IATA code')
  .brand<'IataCode'>()
export type IataCode = z.infer<typeof iataCodeSchema>

/**
 * Waypoint's own record of a traveler, keyed by the Supabase user id
 * (`userId` = `auth.users.id` = the JWT `sub`). Created by an upsert on the
 * user's first authenticated request; Waypoint never migrates Supabase's
 * `auth` schema.
 */
export const profileSchema = z.object({
  userId: z.uuid(),
  name: z.string().min(1).nullable(),
  homeAirport: iataCodeSchema.nullable(),
  createdAt: isoDateTimeSchema,
})
export type Profile = z.infer<typeof profileSchema>
