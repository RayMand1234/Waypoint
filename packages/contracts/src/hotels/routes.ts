import { z } from 'zod';
import {
  adultsSchema,
  childAgeSchema,
  countryCodeSchema,
  MAX_CHILDREN,
  currencySchema,
  isoDateSchema,
  paginationQuerySchema,
  providerErrorSchema,
} from '../common/index.ts';
import {
  hotelDetailSchema,
  hotelLocationSchema,
  hotelOfferSchema,
  hotelReviewsSchema,
  hotelSearchLocationSchema,
  hotelSummarySchema,
} from './hotel.ts';

/* ── GET /hotels?type=…&limit=&offset= ─────────────────────────────────── */

/** `?type=city&countryCode=PT&cityName=Lisbon`, `?type=place&placeId=…`, … */
export const listHotelsQuerySchema = z.intersection(
  hotelLocationSchema,
  paginationQuerySchema,
);
export type ListHotelsQuery = z.infer<typeof listHotelsQuerySchema>;

export const listHotelsResponseSchema = z.object({
  hotels: z.array(hotelSummarySchema),
});
export type ListHotelsResponse = z.infer<typeof listHotelsResponseSchema>;

/* ── GET /hotels/:hotelId ──────────────────────────────────────────────── */

export const hotelParamsSchema = z.object({ hotelId: z.string().min(1) });
export type HotelParams = z.infer<typeof hotelParamsSchema>;

export const getHotelResponseSchema = z.object({ hotel: hotelDetailSchema });
export type GetHotelResponse = z.infer<typeof getHotelResponseSchema>;

/* ── GET /hotels/:hotelId/reviews ──────────────────────────────────────── */

/** What guests say, for the stay's details sheet. */
export const getHotelReviewsResponseSchema = z.object({
  reviews: hotelReviewsSchema,
});
export type GetHotelReviewsResponse = z.infer<
  typeof getHotelReviewsResponseSchema
>;

/* ── POST /hotels/search ───────────────────────────────────────────────── */

/** Used until the app knows the traveler's own nationality. */
export const DEFAULT_GUEST_NATIONALITY = countryCodeSchema.parse('US');

/**
 * Live prices for a stay. Defaults are the sample trip's party (2 adults);
 * `guestNationality` changes some rates, so the app should send the
 * traveler's own when it knows it.
 */
export const hotelSearchRequestSchema = z
  .strictObject({
    location: hotelSearchLocationSchema,
    checkin: isoDateSchema,
    checkout: isoDateSchema,
    adults: adultsSchema.default(2),
    childrenAges: z.array(childAgeSchema).max(MAX_CHILDREN).default([]),
    currency: currencySchema.default('EUR'),
    guestNationality: countryCodeSchema.default(DEFAULT_GUEST_NATIONALITY),
    limit: z.number().int().min(1).max(100).default(30),
  })
  .refine((request) => request.checkout > request.checkin, {
    message: 'checkout must be after checkin',
    path: ['checkout'],
  });
export type HotelSearchRequest = z.infer<typeof hotelSearchRequestSchema>;

/** Ranked best value first. `errors` lists sources that failed this time. */
export const hotelSearchResponseSchema = z.object({
  offers: z.array(hotelOfferSchema),
  errors: z.array(providerErrorSchema),
});
export type HotelSearchResponse = z.infer<typeof hotelSearchResponseSchema>;
