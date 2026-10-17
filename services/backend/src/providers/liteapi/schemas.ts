import { z } from 'zod';

// liteAPI's raw response shapes — only the fields Waypoint reads. Nothing
// outside this folder imports from here. Lists are parsed loosely here
// (`z.array(z.unknown())`) and item by item with `parseEach`, so one bad row
// never fails a whole response.

const optionalString = z.string().nullish();
const optionalNumber = z.number().nullish();

/** `{ "data": [...] }`, with `data` missing when liteAPI has nothing (e.g. no availability). */
export const listEnvelope = z.object({ data: z.array(z.unknown()).nullish() });

/* ── /data/countries · /data/cities ─────────────────────────────────────── */

export const rawCountry = z.object({
  code: z.string(),
  name: z.string().min(1),
});
export const rawCity = z.object({ city: z.string().trim().min(1) });

/* ── /data/places · /data/places/{placeId} ─────────────────────────────── */

export const rawPlaceSuggestion = z.object({
  placeId: z.string().min(1),
  displayName: z.string().min(1),
  formattedAddress: optionalString,
  types: z.array(z.string()).nullish(),
});

const rawLatLng = z.object({ latitude: z.number(), longitude: z.number() });

export const rawPlaceEnvelope = z.object({
  data: z.object({
    displayName: z.string().min(1),
    location: rawLatLng,
    viewport: z.object({ high: rawLatLng, low: rawLatLng }).nullish(),
    types: z.array(z.string()).nullish(),
    addressComponents: z
      .array(
        z.object({
          shortText: optionalString,
          types: z.array(z.string()).nullish(),
        }),
      )
      .nullish(),
  }),
});

/* ── /data/flights/airports ────────────────────────────────────────────── */

export const rawAirportGroup = z.object({
  airports: z.array(z.unknown()).nullish(),
});

export const rawAirport = z.object({
  iata: z.string(),
  name: z.string().min(1),
  city: optionalString,
  country: optionalString,
  lat: optionalNumber,
  lon: optionalNumber,
});

/* ── /prices/city ──────────────────────────────────────────────────────── */

export const rawCityPrices = z.object({
  prices: z
    .array(z.object({ day: z.string(), avgPriceUsd: z.number() }))
    .nullish(),
});

/* ── /data/hotels · /data/hotel ────────────────────────────────────────── */

export const rawHotel = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: optionalString,
  city: optionalString,
  country: optionalString,
  latitude: z.number(),
  longitude: z.number(),
  stars: optionalNumber,
  rating: optionalNumber,
  reviewCount: optionalNumber,
  main_photo: optionalString,
  thumbnail: optionalString,
});

export const rawHotelDetailEnvelope = z.object({
  data: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    hotelDescription: optionalString,
    normalizedDescription: optionalString,
    markdownDescription: optionalString,
    address: optionalString,
    city: optionalString,
    country: optionalString,
    location: rawLatLng,
    starRating: optionalNumber,
    rating: optionalNumber,
    reviewCount: optionalNumber,
    main_photo: optionalString,
    thumbnail: optionalString,
    chain: optionalString,
    hotelImages: z
      .array(
        z.object({
          url: optionalString,
          urlHd: optionalString,
          defaultImage: z.boolean().nullish(),
        }),
      )
      .nullish(),
    facilities: z.array(z.object({ name: optionalString })).nullish(),
    hotelFacilities: z.array(z.string()).nullish(),
    checkinCheckoutTimes: z
      .object({ checkin_start: optionalString, checkout: optionalString })
      .nullish(),
  }),
});

/* ── POST /hotels/rates ────────────────────────────────────────────────── */

const rawAmount = z.object({ amount: z.number(), currency: z.string() });

/** The spec documents an array; responses have also been seen as a single object. Accept both. */
const rawAmountOrList = z.union([
  rawAmount,
  z.tuple([rawAmount], rawAmount).transform(([first]) => first),
]);

/* ── /data/reviews ─────────────────────────────────────────────────────── */

export const rawReview = z.object({
  averageScore: z.number(),
  name: optionalString,
  country: optionalString,
  type: optionalString,
  date: z.string().min(1),
  headline: optionalString,
  language: optionalString,
  pros: optionalString,
  cons: optionalString,
});

export const rawReviewsEnvelope = z.object({
  data: z.array(z.unknown()).nullish(),
  total: optionalNumber,
  sentimentAnalysis: z
    .object({
      pros: z.array(z.string()).nullish(),
      cons: z.array(z.string()).nullish(),
    })
    .nullish(),
});

export const rawRateHotel = z.object({
  hotelId: z.string().min(1),
  roomTypes: z
    .array(
      z.object({
        offerId: z.string().min(1),
        offerRetailRate: rawAmountOrList,
        rates: z
          .array(
            z.object({
              name: optionalString,
              boardName: optionalString,
              cancellationPolicies: z
                .object({ refundableTag: optionalString })
                .nullish(),
            }),
          )
          .nullish(),
      }),
    )
    .min(1),
});

export const rawRateHotelData = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: optionalString,
  city_name: optionalString,
  country_code: optionalString,
  latitude: z.number(),
  longitude: z.number(),
  stars: optionalNumber,
  rating: optionalNumber,
  review_count: optionalNumber,
  main_photo: optionalString,
  thumbnail: optionalString,
});

export const rawRatesEnvelope = z.object({
  data: z.array(z.unknown()).nullish(),
  hotels: z.array(z.unknown()).nullish(),
});

/* ── POST /flights/rates ───────────────────────────────────────────────── */

const rawDuration = z.object({ minutes: z.number().int().min(0) });

export const rawFlightSegment = z.object({
  direction: optionalString,
  originCode: z.string().min(1),
  originName: optionalString,
  destinationCode: z.string().min(1),
  destinationName: optionalString,
  departureTime: z.string().min(16),
  arrivalTime: z.string().min(16),
  carrier: z.object({
    marketingCode: z.string().min(1),
    marketingName: optionalString,
    marketingLogo: optionalString,
  }),
  flight: z.object({ marketingNumber: z.string().min(1) }),
  duration: rawDuration,
});

export const rawJourney = z.object({
  journeyKey: z.string().min(1),
  cheapestOffer: z.object({
    offerId: z.string().min(1),
    expiration: optionalString,
    pricing: z.object({
      display: z.object({ total: z.number(), currency: z.string() }),
    }),
    terms: z
      .object({
        refundable: z.boolean().nullish(),
        changeable: z.boolean().nullish(),
      })
      .nullish(),
    baggage: z
      .object({
        hasCarryOnBag: z.boolean().nullish(),
        hasCheckedBag: z.boolean().nullish(),
      })
      .nullish(),
    fare: z.object({ seatsRemaining: z.number().int().nullish() }).nullish(),
  }),
  segments: z.array(rawFlightSegment).min(1),
  legDurations: z
    .array(z.object({ direction: optionalString, duration: rawDuration }))
    .nullish(),
});

export const rawFlightRatesEnvelope = z.object({
  data: z
    .array(z.object({ journeys: z.array(z.unknown()).nullish() }))
    .nullish(),
});
