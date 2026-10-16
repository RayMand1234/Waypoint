import { z } from 'zod';
import {
  currencySchema,
  iataCodeSchema,
  isoDateTimeSchema,
} from '../common/index.ts';

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
  /** Every price is searched and shown in this currency. */
  currency: currencySchema,
  createdAt: isoDateTimeSchema,
});
export type Profile = z.infer<typeof profileSchema>;
