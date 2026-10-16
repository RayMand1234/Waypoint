import { z } from 'zod';

/** A 3-letter IATA airport or city code, e.g. `TLV`. Branded: only a parsed value is one. */
export const iataCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'expected a 3-letter IATA code')
  .brand<'IataCode'>();
export type IataCode = z.infer<typeof iataCodeSchema>;
