import {
  countryCodeSchema,
  iataCodeSchema,
  latitudeSchema,
  longitudeSchema,
} from '@waypoint/contracts/common';
import { tripStyleSchema } from '@waypoint/contracts/trips';
import { z } from 'zod';

/**
 * The curated launch cities. Adding a city here, then running
 * `npm run research -- <id>`, drafts its spots for review.
 */
const cityDefinitionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  countryCode: countryCodeSchema,
  countryName: z.string().min(1),
  airport: iataCodeSchema,
  lat: latitudeSchema,
  lng: longitudeSchema,
  /** How far from the centre spots may be, in km. */
  radiusKm: z.number().positive(),
  /** What the city is known for, for destination suggestions. */
  styles: z.array(tripStyleSchema).min(1),
});

export type CityDefinition = z.infer<typeof cityDefinitionSchema>;

export const CITIES: readonly CityDefinition[] = z
  .array(cityDefinitionSchema)
  .parse([
    {
      id: 'lisbon',
      name: 'Lisbon',
      countryCode: 'PT',
      countryName: 'Portugal',
      airport: 'LIS',
      lat: 38.7223,
      lng: -9.1393,
      radiusKm: 8,
      styles: ['culture', 'views', 'food', 'night', 'chill'],
    },
    {
      id: 'paris',
      name: 'Paris',
      countryCode: 'FR',
      countryName: 'France',
      airport: 'CDG',
      lat: 48.8566,
      lng: 2.3522,
      radiusKm: 8,
      styles: ['culture', 'food', 'views', 'night'],
    },
    {
      id: 'london',
      name: 'London',
      countryCode: 'GB',
      countryName: 'United Kingdom',
      airport: 'LHR',
      lat: 51.5074,
      lng: -0.1278,
      radiusKm: 10,
      styles: ['culture', 'food', 'night', 'views'],
    },
    {
      id: 'rome',
      name: 'Rome',
      countryCode: 'IT',
      countryName: 'Italy',
      airport: 'FCO',
      lat: 41.9028,
      lng: 12.4964,
      radiusKm: 8,
      styles: ['culture', 'food', 'views'],
    },
    {
      id: 'barcelona',
      name: 'Barcelona',
      countryCode: 'ES',
      countryName: 'Spain',
      airport: 'BCN',
      lat: 41.3874,
      lng: 2.1686,
      radiusKm: 8,
      styles: ['beach', 'culture', 'food', 'night'],
    },
    {
      id: 'new-york',
      name: 'New York',
      countryCode: 'US',
      countryName: 'United States',
      airport: 'JFK',
      lat: 40.7484,
      lng: -73.9857,
      radiusKm: 12,
      styles: ['culture', 'food', 'night', 'views'],
    },
    {
      id: 'tokyo',
      name: 'Tokyo',
      countryCode: 'JP',
      countryName: 'Japan',
      airport: 'HND',
      lat: 35.6812,
      lng: 139.7671,
      radiusKm: 12,
      styles: ['culture', 'food', 'night', 'views'],
    },
    {
      id: 'bangkok',
      name: 'Bangkok',
      countryCode: 'TH',
      countryName: 'Thailand',
      airport: 'BKK',
      lat: 13.7563,
      lng: 100.5018,
      radiusKm: 10,
      styles: ['food', 'culture', 'night'],
    },
    {
      id: 'dubai',
      name: 'Dubai',
      countryCode: 'AE',
      countryName: 'United Arab Emirates',
      airport: 'DXB',
      lat: 25.2048,
      lng: 55.2708,
      radiusKm: 20,
      styles: ['beach', 'views', 'night', 'family'],
    },
    {
      id: 'istanbul',
      name: 'Istanbul',
      countryCode: 'TR',
      countryName: 'Türkiye',
      airport: 'IST',
      lat: 41.0082,
      lng: 28.9784,
      radiusKm: 10,
      styles: ['culture', 'food', 'views'],
    },
    {
      id: 'singapore',
      name: 'Singapore',
      countryCode: 'SG',
      countryName: 'Singapore',
      airport: 'SIN',
      lat: 1.2903,
      lng: 103.852,
      radiusKm: 15,
      styles: ['family', 'food', 'views', 'culture'],
    },
  ]);

export const findCity = (id: string): CityDefinition | undefined =>
  CITIES.find((city) => city.id === id);
