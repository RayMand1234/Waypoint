import { err, isoDateTimeSchema, ok } from '@waypoint/contracts/common';
import {
  hotelSearchRequestSchema,
  hotelSummarySchema,
} from '@waypoint/contracts/hotels';
import { describe, expect, it, vi } from 'vitest';
import type {
  HotelCatalog,
  HotelProvider,
  ProviderHotelOffer,
  ProviderHotelReviews,
} from '../providers/types.ts';
import { silentLogger } from '../testing/index.ts';
import { LISBON } from '../testing/sampleTrip.ts';
import type { Cached } from './cache.service.ts';
import { createHotelsService } from './hotels.service.ts';

const checkedAt = isoDateTimeSchema.parse('2027-04-01T10:00:00.000Z');

const offer = (
  id: string,
  rating: number | null,
  reviewCount: number | null,
): ProviderHotelOffer => ({
  provider: 'liteapi',
  providerOfferId: `offer-${id}`,
  hotel: hotelSummarySchema.parse({
    id,
    name: `Hotel ${id}`,
    address: null,
    cityName: 'Lisbon',
    countryCode: 'PT',
    lat: LISBON.lat,
    lng: LISBON.lng,
    stars: 4,
    rating,
    reviewCount,
    mainPhotoUrl: null,
    thumbnailUrl: null,
  }),
  roomName: 'Double room',
  boardName: null,
  cancellation: 'non-refundable',
  price: { amountMinor: 50_000, currency: 'EUR' },
  deepLink: `https://book.example/hotels/${id}`,
  checkedAt,
});

const scored = (scores: readonly number[]): ProviderHotelReviews => ({
  total: 5167,
  likes: [],
  dislikes: [],
  reviews: scores.map((score, day) => ({
    score,
    name: null,
    countryCode: null,
    travelerType: 'couple',
    date: isoDateTimeSchema.parse(
      `2027-03-${String(day + 1).padStart(2, '0')}T00:00:00Z`,
    ),
    headline: null,
    liked: null,
    disliked: null,
    language: 'de',
  })),
});

/** No cache: every call loads. */
const passThrough: Cached = (request) => request.load();

const request = hotelSearchRequestSchema.parse({
  location: { type: 'coordinates', lat: LISBON.lat, lng: LISBON.lng },
  checkin: '2027-05-12',
  checkout: '2027-05-16',
});

const setup = (reviews: HotelCatalog['reviews']) => {
  const catalogReviews = vi.fn(reviews);
  const provider: HotelProvider = {
    id: 'liteapi',
    searchHotels: () =>
      Promise.resolve(
        ok([offer('unrated', null, 5167), offer('rated', 8, 900)]),
      ),
  };
  const catalog: HotelCatalog = {
    id: 'liteapi',
    listHotels: () => Promise.resolve(ok([])),
    hotel: () => Promise.resolve(err({ type: 'not-found' })),
    reviews: catalogReviews,
  };
  const hotels = createHotelsService({
    catalog,
    providers: [provider],
    cached: passThrough,
    logger: silentLogger(),
  });

  return { hotels, catalogReviews };
};

const ratingOf = async (
  hotels: ReturnType<typeof setup>['hotels'],
  hotelId: string,
) => {
  const result = await hotels.search(request);

  if (!result.ok) throw new Error('search failed');

  const hotel = result.value.offers.find((o) => o.hotel.id === hotelId)?.hotel;

  return { rating: hotel?.rating, ratedFrom: hotel?.ratedFrom };
};

describe('hotel search ratings', () => {
  it("rates a hotel the source left unrated by its reviews' average", async () => {
    const { hotels, catalogReviews } = setup(() =>
      Promise.resolve(ok(scored([8, 9, 10, 7]))),
    );

    expect(await ratingOf(hotels, 'unrated')).toEqual({
      rating: 8.5,
      ratedFrom: 4,
    });
    expect(await ratingOf(hotels, 'rated')).toEqual({
      rating: 8,
      ratedFrom: null,
    });
    // Only the unrated hotel's reviews are read.
    expect(catalogReviews.mock.calls.map(([id]) => id)).not.toContain('rated');
  });

  it('leaves it unrated when its reviews can’t be read', async () => {
    const { hotels } = setup(() => Promise.resolve(err({ type: 'timeout' })));

    expect(await ratingOf(hotels, 'unrated')).toEqual({
      rating: null,
      ratedFrom: null,
    });
  });
});
