import { z } from 'zod';
import {
  countryCodeSchema,
  iataCodeSchema,
  isoDateSchema,
  latitudeSchema,
  longitudeSchema,
  moneySchema,
} from '../common/index.ts';

export const countrySchema = z.object({
  code: countryCodeSchema,
  name: z.string().min(1),
});
export type Country = z.infer<typeof countrySchema>;

export const citySchema = z.object({
  name: z.string().min(1),
  countryCode: countryCodeSchema,
});
export type City = z.infer<typeof citySchema>;

/** One autocomplete row. `placeId` feeds `GET /places/:placeId` and hotel search. */
export const placeSuggestionSchema = z.object({
  placeId: z.string().min(1),
  name: z.string().min(1),
  address: z.string(),
  types: z.array(z.string()),
});
export type PlaceSuggestion = z.infer<typeof placeSuggestionSchema>;

export const viewportSchema = z.object({
  north: latitudeSchema,
  south: latitudeSchema,
  east: longitudeSchema,
  west: longitudeSchema,
});
export type Viewport = z.infer<typeof viewportSchema>;

export const placeSchema = z.object({
  placeId: z.string().min(1),
  name: z.string().min(1),
  lat: latitudeSchema,
  lng: longitudeSchema,
  countryCode: countryCodeSchema.nullable(),
  viewport: viewportSchema.nullable(),
  types: z.array(z.string()),
});
export type Place = z.infer<typeof placeSchema>;

export const airportSchema = z.object({
  iata: iataCodeSchema,
  name: z.string().min(1),
  city: z.string().nullable(),
  country: z.string().nullable(),
  lat: latitudeSchema.nullable(),
  lng: longitudeSchema.nullable(),
});
export type Airport = z.infer<typeof airportSchema>;

/**
 * Average hotel price per night across a city, for one check-in day. Comes
 * from the provider's historical index, so it is an estimate ("from €X"),
 * never a bookable price.
 */
export const cityNightPriceSchema = z.object({
  date: isoDateSchema,
  averagePerNight: moneySchema,
});
export type CityNightPrice = z.infer<typeof cityNightPriceSchema>;

export const cityPriceIndexSchema = z.object({
  countryCode: countryCodeSchema,
  cityName: z.string().min(1),
  /** Mean of `days`; `null` when the provider has no data for the range. */
  averagePerNight: moneySchema.nullable(),
  days: z.array(cityNightPriceSchema),
});
export type CityPriceIndex = z.infer<typeof cityPriceIndexSchema>;
