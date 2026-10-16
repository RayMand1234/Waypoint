import { z } from 'zod';
import {
  countryCodeSchema,
  latitudeSchema,
  longitudeSchema,
  moneySchema,
  offerSourceSchema,
  offerValueSchema,
} from '../common/index.ts';

/**
 * Where to look for hotels. `place` is a `placeId` from `GET /places`;
 * `coordinates` searches a radius around a point (e.g. the day plan's centre).
 * Numbers are coerced so the same schema reads a query string or a JSON body.
 */
export const hotelLocationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('place'), placeId: z.string().min(1) }),
  z.object({
    type: z.literal('city'),
    countryCode: countryCodeSchema,
    cityName: z.string().trim().min(1),
  }),
  z.object({
    type: z.literal('coordinates'),
    lat: z.coerce.number().pipe(latitudeSchema),
    lng: z.coerce.number().pipe(longitudeSchema),
    radiusMeters: z.coerce.number().int().min(1000).max(50_000).default(5000),
  }),
]);
export type HotelLocation = z.infer<typeof hotelLocationSchema>;

/** At most this many stops are weighed: a long trip's spots, with room to spare. */
export const MAX_STOPS = 60;

/** A place the trip visits — one of the traveler's picked spots. */
export const stopPointSchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
});
export type StopPoint = z.infer<typeof stopPointSchema>;

/**
 * Where to search for prices: any `hotelLocationSchema`, or `stops` — the
 * trip's picked spots. Hotels are then searched around the spots' middle and
 * ranked partly by how near they are to all of them (`stopsMinutes`).
 */
export const hotelSearchLocationSchema = z.discriminatedUnion('type', [
  ...hotelLocationSchema.options,
  z.object({
    type: z.literal('stops'),
    // A tuple with a rest element, so the type itself says "at least one".
    stops: z
      .tuple([stopPointSchema], stopPointSchema)
      .refine((stops) => stops.length <= MAX_STOPS, {
        message: `At most ${String(MAX_STOPS)} stops.`,
      }),
  }),
]);
export type HotelSearchLocation = z.infer<typeof hotelSearchLocationSchema>;

/** A hotel's static facts — enough for a list row or an offer card. */
export const hotelSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().nullable(),
  cityName: z.string().nullable(),
  countryCode: countryCodeSchema.nullable(),
  lat: latitudeSchema,
  lng: longitudeSchema,
  stars: z.number().min(0).max(5).nullable(),
  /** Guest rating out of 10. */
  rating: z.number().min(0).max(10).nullable(),
  reviewCount: z.number().int().min(0).nullable(),
  mainPhotoUrl: z.url().nullable(),
  thumbnailUrl: z.url().nullable(),
});
export type HotelSummary = z.infer<typeof hotelSummarySchema>;

export const hotelDetailSchema = hotelSummarySchema.extend({
  description: z.string().nullable(),
  imageUrls: z.array(z.url()),
  facilities: z.array(z.string()),
  chain: z.string().nullable(),
  checkinFrom: z.string().nullable(),
  checkoutUntil: z.string().nullable(),
});
export type HotelDetail = z.infer<typeof hotelDetailSchema>;

/**
 * `refundable` may still carry a penalty — the partner site has the terms.
 * `unknown` when the provider didn't say; never shown as non-refundable.
 */
export const cancellationSchema = z.enum([
  'refundable',
  'non-refundable',
  'unknown',
]);
export type Cancellation = z.infer<typeof cancellationSchema>;

/**
 * One hotel's cheapest room for the requested stay, with every source's
 * price in `sources` ("Where we found it"). `bestPrice` is the whole stay;
 * `pricePerNight` is `bestPrice / nights`, rounded.
 */
export const hotelOfferSchema = z.object({
  hotel: hotelSummarySchema,
  roomName: z.string().min(1),
  boardName: z.string().nullable(),
  cancellation: cancellationSchema,
  nights: z.number().int().min(1),
  bestPrice: moneySchema,
  pricePerNight: moneySchema,
  /** Metres from the searched point; `null` unless the search used coordinates or stops. */
  distanceMeters: z.number().int().min(0).nullable(),
  /**
   * Typical travel minutes to the trip's stops (the median, so one far spot
   * doesn't count against a central hotel); `null` unless searched by stops.
   */
  stopsMinutes: z.number().int().min(0).nullable(),
  /** Exactly one offer — the nearest to the stops — has it, when searched by stops. */
  isBestLocation: z.boolean(),
  sources: z.array(offerSourceSchema).min(1),
  value: offerValueSchema,
});
export type HotelOffer = z.infer<typeof hotelOfferSchema>;
