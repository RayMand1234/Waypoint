import { z } from 'zod';

/** Children are 0–17 on the travel dates; 0–1 fly as infants. */
export const MAX_CHILD_AGE = 17;
/** At most this many adults per trip (what hotel and flight searches accept). */
export const MAX_ADULTS = 9;

/** A child's age in years on the travel dates. */
export const childAgeSchema = z.number().int().min(0).max(MAX_CHILD_AGE);
export const adultsSchema = z.number().int().min(1).max(MAX_ADULTS);
export type ChildAge = z.infer<typeof childAgeSchema>;

/** At most this many children per trip (what hotel and flight searches accept). */
export const MAX_CHILDREN = 6;
