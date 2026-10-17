import {
  assertNever,
  countryCodeSchema,
  isoDateTimeSchema,
  ok,
  type CountryCode,
} from '@waypoint/contracts/common';
import type {
  Cancellation,
  HotelLocation,
  HotelSummary,
  TravelerType,
} from '@waypoint/contracts/hotels';
import { z } from 'zod';
import { toMoney } from '../../lib/money.ts';
import type { Logger } from '../../observability/logger.ts';
import type {
  HotelCatalog,
  HotelProvider,
  HotelSearchQuery,
  ProviderHotelOffer,
} from '../types.ts';
import type { LiteApiClient } from './client.ts';
import { hotelDeepLink } from './deepLinks.ts';
import { checkedAtFrom, logDropped, parseEach } from './parse.ts';
import {
  listEnvelope,
  rawHotel,
  rawHotelDetailEnvelope,
  rawRateHotel,
  rawRateHotelData,
  rawRatesEnvelope,
  rawReview,
  rawReviewsEnvelope,
} from './schemas.ts';

/** liteAPI takes the location as flat fields on the query or body. */
const locationFields = (
  location: HotelLocation,
): Record<string, string | number> => {
  switch (location.type) {
    case 'place':
      return { placeId: location.placeId };
    case 'city':
      return { countryCode: location.countryCode, cityName: location.cityName };
    case 'coordinates':
      return {
        latitude: location.lat,
        longitude: location.lng,
        radius: location.radiusMeters,
      };
    default:
      return assertNever(location);
  }
};

const nonEmpty = (value: string | null | undefined): string | null =>
  value === undefined || value === null || value.trim() === '' ? null : value;

/** liteAPI ratings are out of 10; stars 0–5. Anything outside is treated as unknown. */
const inRange = (
  value: number | null | undefined,
  max: number,
): number | null =>
  value === undefined || value === null || value < 0 || value > max
    ? null
    : value;

/** A real http(s) URL, or `null` — the app shows these as images. */
const webUrl = (value: string | null | undefined): string | null => {
  const url = z.url({ protocol: /^https?$/ }).safeParse(nonEmpty(value));

  return url.success ? url.data : null;
};

const countryCodeOf = (
  value: string | null | undefined,
): CountryCode | null => {
  const code = countryCodeSchema.safeParse(nonEmpty(value));

  return code.success ? code.data : null;
};

/** How many of the latest reviews are read (liteAPI's largest page); the best and most critical are picked from these. */
const REVIEWS_READ = 1000;

/** liteAPI's traveller groups as Waypoint's. */
const TRAVELER_TYPES: Readonly<Record<string, TravelerType>> = {
  solo_traveller: 'solo',
  couple: 'couple',
  family_with_children: 'family',
  family_with_young_children: 'family',
  family_with_older_children: 'family',
  group: 'group',
  extended_group: 'group',
  group_of_friends: 'group',
  business_traveller: 'business',
};

/** One review as Waypoint's; `undefined` when its date can't be read. */
const toReview = (raw: z.output<typeof rawReview>) => {
  const date = isoDateTimeSchema.safeParse(raw.date);

  if (!date.success) return undefined;

  return {
    score: Math.min(Math.max(raw.averageScore, 0), 10),
    name: nonEmpty(raw.name),
    countryCode: countryCodeOf(raw.country),
    travelerType: TRAVELER_TYPES[raw.type ?? ''] ?? 'other',
    date: date.data,
    headline: nonEmpty(raw.headline),
    liked: nonEmpty(raw.pros),
    disliked: nonEmpty(raw.cons),
    language: nonEmpty(raw.language),
  };
};

const nonEmptyAll = (values: readonly string[] | null | undefined): string[] =>
  (values ?? []).flatMap((value) => nonEmpty(value) ?? []);

const toSummary = (raw: z.output<typeof rawHotel>): HotelSummary => ({
  id: raw.id,
  name: raw.name,
  address: nonEmpty(raw.address),
  cityName: nonEmpty(raw.city),
  countryCode: countryCodeOf(raw.country),
  lat: raw.latitude,
  lng: raw.longitude,
  stars: inRange(raw.stars, 5),
  rating: inRange(raw.rating, 10),
  reviewCount: raw.reviewCount ?? null,
  mainPhotoUrl: webUrl(raw.main_photo),
  thumbnailUrl: webUrl(raw.thumbnail),
});

const rateHotelToSummary = (
  raw: z.output<typeof rawRateHotelData>,
): HotelSummary =>
  toSummary({
    ...raw,
    city: raw.city_name,
    country: raw.country_code,
    reviewCount: raw.review_count,
  });

/** Hotel lists and details (static data, no prices). */
export const createLiteApiHotelCatalog = ({
  client,
  logger,
}: {
  readonly client: LiteApiClient;
  readonly logger: Logger;
}): HotelCatalog => ({
  id: 'liteapi',

  listHotels: async ({ location, limit, offset }) => {
    const response = await client.get(
      '/data/hotels',
      { ...locationFields(location), limit, offset },
      listEnvelope,
    );

    if (!response.ok) return response;

    const { items, dropped } = parseEach(rawHotel, response.value.data ?? []);

    logDropped(logger, 'hotels', dropped, items.length);

    return ok(items.map(toSummary));
  },

  hotel: async (hotelId) => {
    const response = await client.get(
      '/data/hotel',
      { hotelId },
      rawHotelDetailEnvelope,
    );

    if (!response.ok) return response;

    const { data } = response.value;
    const images = (data.hotelImages ?? [])
      .toSorted(
        (a, b) =>
          Number(b.defaultImage ?? false) - Number(a.defaultImage ?? false),
      )
      .flatMap((image) => {
        const url = webUrl(image.urlHd) ?? webUrl(image.url);

        return url === null ? [] : [url];
      });
    const facilities = [
      ...(data.facilities ?? []).flatMap((facility) => {
        const name = nonEmpty(facility.name);

        return name === null ? [] : [name];
      }),
      ...(data.hotelFacilities ?? []),
    ];

    return ok({
      ...toSummary({
        ...data,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        stars: data.starRating,
      }),
      description:
        nonEmpty(data.normalizedDescription) ??
        nonEmpty(data.markdownDescription) ??
        nonEmpty(data.hotelDescription),
      imageUrls: [...new Set(images)],
      facilities: [...new Set(facilities)],
      chain: nonEmpty(data.chain),
      checkinFrom: nonEmpty(data.checkinCheckoutTimes?.checkin_start),
      checkoutUntil: nonEmpty(data.checkinCheckoutTimes?.checkout),
    });
  },

  reviews: async (hotelId) => {
    const response = await client.get(
      '/data/reviews',
      { hotelId, limit: REVIEWS_READ, getSentiment: true },
      rawReviewsEnvelope,
    );

    if (!response.ok) return response;

    const { items, dropped } = parseEach(rawReview, response.value.data ?? []);
    const reviews = items.flatMap((item) => toReview(item) ?? []);

    logDropped(logger, 'reviews', dropped, reviews.length);

    return ok({
      total: response.value.total ?? reviews.length,
      likes: nonEmptyAll(response.value.sentimentAnalysis?.pros),
      dislikes: nonEmptyAll(response.value.sentimentAnalysis?.cons),
      reviews,
    });
  },
});

/** Shown when liteAPI gives a rate no room name. */
const DEFAULT_ROOM_NAME = 'Room';

/** liteAPI's refundable tags. Anything else — or nothing — is `unknown`, never "non-refundable". */
const cancellationOf = (tag: string | null | undefined): Cancellation => {
  if (tag === 'RFN') return 'refundable';

  if (tag === 'NRFN') return 'non-refundable';

  return 'unknown';
};

const cheapestRoom = (hotel: z.output<typeof rawRateHotel>) =>
  hotel.roomTypes.reduce((best, room) =>
    room.offerRetailRate.amount < best.offerRetailRate.amount ? room : best,
  );

/** Live hotel rates, one cheapest offer per hotel, as Waypoint offers. */
export const createLiteApiHotelProvider = ({
  client,
  logger,
  whitelabelUrl,
  now,
}: {
  readonly client: LiteApiClient;
  readonly logger: Logger;
  readonly whitelabelUrl: string;
  readonly now: () => Date;
}): HotelProvider => ({
  id: 'liteapi',

  searchHotels: async (query: HotelSearchQuery, signal) => {
    const response = await client.post(
      '/hotels/rates',
      {
        ...locationFields(query.location),
        occupancies: [{ adults: query.adults, children: query.childrenAges }],
        checkin: query.checkin,
        checkout: query.checkout,
        currency: query.currency,
        guestNationality: query.guestNationality,
        maxRatesPerHotel: 1,
        includeHotelData: true,
        limit: query.limit,
      },
      rawRatesEnvelope,
      signal,
    );

    if (!response.ok) return response;

    const checkedAt = checkedAtFrom(now);
    const rates = parseEach(rawRateHotel, response.value.data ?? []);
    const hotels = parseEach(rawRateHotelData, response.value.hotels ?? []);
    const hotelById = new Map(
      hotels.items.map((hotel) => [hotel.id, rateHotelToSummary(hotel)]),
    );

    const offers = rates.items.flatMap((rate): ProviderHotelOffer[] => {
      const hotel = hotelById.get(rate.hotelId);
      const room = cheapestRoom(rate);
      const price = toMoney(
        room.offerRetailRate.amount,
        room.offerRetailRate.currency,
      );
      const detail = room.rates?.[0];

      // No hotel facts to show, or a price in a currency we didn't ask for.
      if (hotel === undefined || price?.currency !== query.currency) return [];

      return [
        {
          provider: 'liteapi',
          providerOfferId: room.offerId,
          hotel,
          roomName: nonEmpty(detail?.name) ?? DEFAULT_ROOM_NAME,
          boardName: nonEmpty(detail?.boardName),
          cancellation: cancellationOf(
            detail?.cancellationPolicies?.refundableTag,
          ),
          price,
          deepLink: hotelDeepLink(whitelabelUrl, rate.hotelId, query),
          checkedAt,
        },
      ];
    });
    const dropped =
      rates.dropped + hotels.dropped + rates.items.length - offers.length;

    logDropped(logger, 'hotel rates', dropped, offers.length);

    return ok(offers);
  },
});
