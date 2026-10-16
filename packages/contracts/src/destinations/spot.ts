import { z } from 'zod';
import {
  isoDateTimeSchema,
  isoTimeSchema,
  latitudeSchema,
  longitudeSchema,
  moneySchema,
} from '../common/index.ts';
import { tripStyleSchema } from '../trips/index.ts';

/** What kind of place a spot is. Drives its icon, styles and typical visit length. */
export const spotCategorySchema = z.enum([
  'landmark',
  'museum',
  'church',
  'palace',
  'castle',
  'monument',
  'viewpoint',
  'park',
  'garden',
  'neighbourhood',
  'square',
  'market',
  'beach',
  'aquarium',
  'zoo',
  'bridge',
]);
export type SpotCategory = z.infer<typeof spotCategorySchema>;

/**
 * A photo we may show, with the credit its licence requires (most are
 * Creative Commons from Wikimedia Commons). `sourceUrl` is the photo's page.
 */
export const photoSchema = z.object({
  url: z.url(),
  author: z.string().nullable(),
  license: z.string().min(1),
  licenseUrl: z.url().nullable(),
  sourceUrl: z.url(),
});
export type Photo = z.infer<typeof photoSchema>;

/** One opening period. `day` is ISO: 1 = Monday … 7 = Sunday. */
export const openingPeriodSchema = z.object({
  day: z.number().int().min(1).max(7),
  opens: isoTimeSchema,
  closes: isoTimeSchema,
});
export type OpeningPeriod = z.infer<typeof openingPeriodSchema>;

/**
 * Opening hours as researched. `text` is the source's own wording
 * (OpenStreetMap syntax, e.g. "Tu-Su 10:00-18:00"); `weekly` is the plain
 * weekly schedule when `text` is simple enough to read reliably — seasonal or
 * holiday rules leave it `null`, and the app shows `text` instead.
 */
export const openingHoursSchema = z.object({
  text: z.string().min(1),
  weekly: z.array(openingPeriodSchema).nullable(),
});
export type OpeningHours = z.infer<typeof openingHoursSchema>;

/** Entry fee. `unknown` is never shown as free. */
export const feeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('free') }),
  z.object({ kind: z.literal('paid'), price: moneySchema.nullable() }),
  z.object({ kind: z.literal('unknown') }),
]);
export type Fee = z.infer<typeof feeSchema>;

/** A place worth visiting, researched and reviewed by Waypoint. */
export const spotSchema = z.object({
  id: z.uuid(),
  destinationId: z.string().min(1),
  name: z.string().min(1),
  category: spotCategorySchema,
  styles: z.array(tripStyleSchema),
  lat: latitudeSchema,
  lng: longitudeSchema,
  address: z.string().nullable(),
  description: z.string().nullable(),
  website: z.url().nullable(),
  /** Typical time a visit takes, for "fits in N days" and the day plan. */
  visitMinutes: z.number().int().min(1),
  /** 0–100 within its destination (Wikipedia interest), for ranking and "Top pick". */
  popularity: z.number().int().min(0).max(100),
  photo: photoSchema.nullable(),
  openingHours: openingHoursSchema.nullable(),
  fee: feeSchema,
  /** Whether `GET /spots/:id/rating` can fetch a Google rating for it. */
  hasRating: z.boolean(),
  /** When its facts (hours, fee) were last checked. */
  checkedAt: isoDateTimeSchema,
});
export type Spot = z.infer<typeof spotSchema>;

/**
 * A spot's Google rating, fetched live and never stored (Google's terms).
 * Show it with the Google Maps attribution and a link to `googleMapsUri`.
 */
export const spotRatingSchema = z.object({
  rating: z.number().min(0).max(5),
  ratingCount: z.number().int().min(0),
  googleMapsUri: z.url(),
});
export type SpotRating = z.infer<typeof spotRatingSchema>;
