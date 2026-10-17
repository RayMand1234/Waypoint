import { z } from 'zod';
import {
  countryCodeSchema,
  iataCodeSchema,
  latitudeSchema,
  longitudeSchema,
  moneySchema,
  photoSchema,
} from '../common/index.ts';
import { tripStyleSchema } from '../trips/index.ts';

/** A city Waypoint plans trips to — curated, with its main airport. */
export const destinationSchema = z.object({
  /** A readable slug, e.g. `lisbon`. */
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  countryCode: countryCodeSchema,
  countryName: z.string().min(1),
  airport: iataCodeSchema,
  lat: latitudeSchema,
  lng: longitudeSchema,
  /** Google place id of the city — hotel search takes it as the location. */
  placeId: z.string().min(1).nullable(),
  styles: z.array(tripStyleSchema),
  photo: photoSchema.nullable(),
  /** Published spots. */
  spotCount: z.number().int().min(0),
});
export type Destination = z.infer<typeof destinationSchema>;

/** A destination suggested for a trip's styles, with what we can estimate up front. */
export const destinationSuggestionSchema = destinationSchema.extend({
  /** The trip's styles this destination is known for. */
  matchedStyles: z.array(tripStyleSchema),
  /** Average hotel price per night (from the city price index) — an estimate. */
  stayPerNight: moneySchema.nullable(),
  /** Exactly one suggestion — the best match — has it. */
  isBestMatch: z.boolean(),
});
export type DestinationSuggestion = z.infer<typeof destinationSuggestionSchema>;
