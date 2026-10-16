import { z } from 'zod';

/**
 * An ISO 3166-1 alpha-2 country code, e.g. `PT`. Lower case input is accepted
 * and upper-cased, so `/countries/pt/cities` and `/countries/PT/cities` agree.
 */
export const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, 'expected a 2-letter ISO country code')
  .brand<'CountryCode'>();
export type CountryCode = z.infer<typeof countryCodeSchema>;
