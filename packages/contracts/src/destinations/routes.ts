import { z } from 'zod';
import { tripStyleSchema } from '../trips/index.ts';
import {
  destinationSchema,
  destinationSuggestionSchema,
} from './destination.ts';
import { spotRatingSchema, spotSchema } from './spot.ts';

/** `?styles=food,views` — comma-separated in a query string. */
const stylesQuery = z
  .string()
  .optional()
  .transform((value) =>
    value === undefined || value === '' ? [] : value.split(','),
  )
  .pipe(z.array(tripStyleSchema));

/* ── GET /destinations?styles= ─────────────────────────────────────────── */

export const listDestinationsQuerySchema = z.object({ styles: stylesQuery });
export type ListDestinationsQuery = z.infer<typeof listDestinationsQuerySchema>;

/** Best match first. */
export const listDestinationsResponseSchema = z.object({
  destinations: z.array(destinationSuggestionSchema),
});
export type ListDestinationsResponse = z.infer<
  typeof listDestinationsResponseSchema
>;

/* ── POST /destinations ────────────────────────────────────────────────── */

/**
 * A city the traveler found by search (`GET /places?type=locality`). Returns
 * the matching destination — a curated one, or one added for the search, with
 * no spots until it is researched.
 */
export const addDestinationBodySchema = z.object({
  placeId: z.string().trim().min(1).max(300),
});
export type AddDestinationBody = z.infer<typeof addDestinationBodySchema>;

/* ── GET /destinations/:destinationId ──────────────────────────────────── */

export const destinationParamsSchema = z.object({
  destinationId: destinationSchema.shape.id,
});
export type DestinationParams = z.infer<typeof destinationParamsSchema>;

export const getDestinationResponseSchema = z.object({
  destination: destinationSchema,
});
export type GetDestinationResponse = z.infer<
  typeof getDestinationResponseSchema
>;

/* ── GET /destinations/:destinationId/spots?styles= ────────────────────── */

export const listSpotsQuerySchema = z.object({ styles: stylesQuery });
export type ListSpotsQuery = z.infer<typeof listSpotsQuerySchema>;

/** Best fit for the styles first; popularity breaks ties. */
export const listSpotsResponseSchema = z.object({ spots: z.array(spotSchema) });
export type ListSpotsResponse = z.infer<typeof listSpotsResponseSchema>;

/* ── GET /spots/:spotId · GET /spots/:spotId/rating ────────────────────── */

export const spotParamsSchema = z.object({ spotId: z.uuid() });
export type SpotParams = z.infer<typeof spotParamsSchema>;

export const getSpotResponseSchema = z.object({ spot: spotSchema });
export type GetSpotResponse = z.infer<typeof getSpotResponseSchema>;

export const getSpotRatingResponseSchema = z.object({
  rating: spotRatingSchema,
});
export type GetSpotRatingResponse = z.infer<typeof getSpotRatingResponseSchema>;
