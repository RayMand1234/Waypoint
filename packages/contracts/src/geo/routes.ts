import { z } from 'zod';
import { countryCodeSchema, isoDateSchema } from '../common/index.ts';
import {
  airportSchema,
  citySchema,
  cityPriceIndexSchema,
  countrySchema,
  placeSchema,
  placeSuggestionSchema,
} from './geo.ts';

// Query strings and path params are not strict: an extra query parameter (a
// cache buster, a tracking tag) is harmless and never a 400.

/* ── GET /countries ────────────────────────────────────────────────────── */

export const listCountriesResponseSchema = z.object({
  countries: z.array(countrySchema),
});
export type ListCountriesResponse = z.infer<typeof listCountriesResponseSchema>;

/* ── GET /countries/:countryCode/cities ────────────────────────────────── */

export const countryParamsSchema = z.object({ countryCode: countryCodeSchema });
export type CountryParams = z.infer<typeof countryParamsSchema>;

export const listCitiesResponseSchema = z.object({
  cities: z.array(citySchema),
});
export type ListCitiesResponse = z.infer<typeof listCitiesResponseSchema>;

/* ── GET /countries/:countryCode/cities/:cityName/prices ───────────────── */

export const cityParamsSchema = z.object({
  countryCode: countryCodeSchema,
  cityName: z.string().trim().min(1),
});
export type CityParams = z.infer<typeof cityParamsSchema>;

/** Both optional: the provider defaults to today → one year ahead. */
export const cityPricesQuerySchema = z.object({
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
});
export type CityPricesQuery = z.infer<typeof cityPricesQuerySchema>;

export const cityPricesResponseSchema = cityPriceIndexSchema;
export type CityPricesResponse = z.infer<typeof cityPricesResponseSchema>;

/* ── GET /places?q= · GET /places/:placeId ─────────────────────────────── */

export const searchPlacesQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
  /** Comma-separated place types, e.g. `locality,airport`. */
  type: z.string().trim().min(1).optional(),
});
export type SearchPlacesQuery = z.infer<typeof searchPlacesQuerySchema>;

export const searchPlacesResponseSchema = z.object({
  places: z.array(placeSuggestionSchema),
});
export type SearchPlacesResponse = z.infer<typeof searchPlacesResponseSchema>;

export const placeParamsSchema = z.object({ placeId: z.string().min(1) });
export type PlaceParams = z.infer<typeof placeParamsSchema>;

export const getPlaceResponseSchema = z.object({ place: placeSchema });
export type GetPlaceResponse = z.infer<typeof getPlaceResponseSchema>;

/* ── GET /airports?q= ──────────────────────────────────────────────────── */

export const searchAirportsQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
});
export type SearchAirportsQuery = z.infer<typeof searchAirportsQuerySchema>;

export const searchAirportsResponseSchema = z.object({
  airports: z.array(airportSchema),
});
export type SearchAirportsResponse = z.infer<
  typeof searchAirportsResponseSchema
>;
