import {
  hotelLocationSchema,
  hotelSearchRequestSchema,
} from '@waypoint/contracts/hotels';
import { describe, expect, it } from 'vitest';
import { fakeFetch, silentLogger } from '../../testing/index.ts';
import { rawRatesResponse } from '../../testing/sampleTrip.ts';
import { createLiteApiClient } from './client.ts';
import {
  createLiteApiHotelCatalog,
  createLiteApiHotelProvider,
} from './hotels.ts';

const WL = 'https://book.example/';
const NOW = new Date('2027-04-01T10:00:00.000Z');

const location = hotelLocationSchema.parse({
  type: 'city',
  countryCode: 'pt',
  cityName: 'Lisbon',
});
const request = {
  ...hotelSearchRequestSchema.parse({
    location,
    checkin: '2027-05-12',
    checkout: '2027-05-16',
  }),
  location,
};

const setup = (handler: Parameters<typeof fakeFetch>[0]) => {
  const fake = fakeFetch(handler);
  const client = createLiteApiClient({
    apiKey: 'test-key',
    baseUrl: 'https://api.test/v3.0',
    timeoutMs: 1000,
    fetch: fake.fetch,
  });
  const deps = {
    client,
    logger: silentLogger(),
    whitelabelUrl: WL,
    now: () => NOW,
  };

  return {
    ...fake,
    provider: createLiteApiHotelProvider(deps),
    catalog: createLiteApiHotelCatalog(deps),
  };
};

describe('liteAPI hotel provider', () => {
  it('sends the stay as liteAPI expects, with the key in a header', async () => {
    const { provider, calls } = setup(() => ({ body: rawRatesResponse }));

    await provider.searchHotels(request, AbortSignal.timeout(1000));

    const call = calls[0];

    expect(call?.url.toString()).toBe('https://api.test/v3.0/hotels/rates');
    expect(new Headers(call?.init.headers).get('x-api-key')).toBe('test-key');
    expect(call?.body).toMatchObject({
      countryCode: 'PT',
      cityName: 'Lisbon',
      checkin: '2027-05-12',
      checkout: '2027-05-16',
      occupancies: [{ adults: 2, children: [] }],
      currency: 'EUR',
      includeHotelData: true,
    });
  });

  it('maps each hotel to its cheapest room, dropping hotels with no data', async () => {
    const { provider } = setup(() => ({ body: rawRatesResponse }));

    const result = await provider.searchHotels(
      request,
      AbortSignal.timeout(1000),
    );

    expect(result.ok).toBe(true);

    if (!result.ok) return;

    expect(result.value.map((offer) => offer.providerOfferId)).toEqual([
      'offer-alfama-dbl',
      'offer-baixa-twin',
    ]);
    expect(result.value[0]).toMatchObject({
      provider: 'liteapi',
      roomName: 'Double room',
      boardName: 'Breakfast included',
      cancellation: 'refundable',
      price: { amountMinor: 52050, currency: 'EUR' },
      checkedAt: NOW.toISOString(),
      hotel: { id: 'lp-alfama', countryCode: 'PT', rating: 9.1, stars: 4 },
    });
    expect(result.value[1]?.cancellation).toBe('non-refundable');
  });

  it('builds a deep link to the hotel page with the stay filled in', async () => {
    const { provider } = setup(() => ({ body: rawRatesResponse }));

    const result = await provider.searchHotels(
      request,
      AbortSignal.timeout(1000),
    );
    const link = new URL(result.ok ? (result.value[0]?.deepLink ?? '') : '');

    expect(`${link.origin}${link.pathname}`).toBe(
      'https://book.example/hotels/lp-alfama',
    );
    expect(link.searchParams.get('checkin')).toBe('2027-05-12');
    expect(
      JSON.parse(
        Buffer.from(
          link.searchParams.get('occupancies') ?? '',
          'base64',
        ).toString(),
      ),
    ).toEqual([{ adults: 2, children: [] }]);
  });

  it('marks cancellation unknown when liteAPI gives no refundable tag — never non-refundable', async () => {
    const { provider } = setup(() => ({
      body: {
        data: [
          {
            hotelId: 'lp-alfama',
            roomTypes: [
              {
                offerId: 'o1',
                offerRetailRate: { amount: 300, currency: 'EUR' },
                rates: [{ name: 'Double' }],
              },
            ],
          },
        ],
        hotels: rawRatesResponse.hotels,
      },
    }));

    const result = await provider.searchHotels(
      request,
      AbortSignal.timeout(1000),
    );

    expect(result.ok ? result.value[0]?.cancellation : null).toBe('unknown');
  });

  it('treats "no availability" (no data) as no offers, not a failure', async () => {
    const { provider } = setup(() => ({
      body: { error: { code: 2001, message: 'no availability found' } },
    }));

    expect(
      await provider.searchHotels(request, AbortSignal.timeout(1000)),
    ).toEqual({ ok: true, value: [] });
  });
});

describe('liteAPI hotel catalog', () => {
  it('reads hotel details, preferring HD images and the plain description', async () => {
    const { catalog, calls } = setup(() => ({
      body: {
        data: {
          id: 'lp-alfama',
          name: 'Casa Alfama (sample)',
          normalizedDescription: 'A quiet house in Alfama.',
          hotelDescription: '<p>A quiet house in Alfama.</p>',
          location: { latitude: 38.7115, longitude: -9.1301 },
          starRating: 4,
          country: 'pt',
          hotelImages: [
            { url: 'https://img.example/2.jpg' },
            {
              url: 'https://img.example/1.jpg',
              urlHd: 'https://img.example/1-hd.jpg',
              defaultImage: true,
            },
          ],
          facilities: [{ name: 'Free WiFi' }, { name: '' }],
          checkinCheckoutTimes: { checkin_start: '15:00', checkout: '11:00' },
        },
      },
    }));

    const result = await catalog.hotel('lp-alfama');

    expect(calls[0]?.url.searchParams.get('hotelId')).toBe('lp-alfama');
    expect(result).toMatchObject({
      ok: true,
      value: {
        id: 'lp-alfama',
        description: 'A quiet house in Alfama.',
        imageUrls: [
          'https://img.example/1-hd.jpg',
          'https://img.example/2.jpg',
        ],
        facilities: ['Free WiFi'],
        stars: 4,
        countryCode: 'PT',
        checkinFrom: '15:00',
      },
    });
  });

  it('reads reviews and the summary, mapping traveller types and skipping unreadable ones', async () => {
    const { catalog, calls } = setup(() => ({
      body: {
        data: [
          {
            averageScore: 10,
            name: 'Charles',
            country: 'au',
            type: 'couple',
            date: '2026-10-14T00:00:00Z',
            headline: 'Perfect stay',
            language: 'en-gb',
            pros: 'Staff and location',
            cons: '',
            source: 'Nuitee',
          },
          {
            averageScore: 7,
            type: 'solo_traveller',
            date: 'not a date',
            language: 'en',
          },
          { name: 'no score' },
        ],
        total: 4557,
        sentimentAnalysis: {
          pros: ['Great location', ''],
          cons: ['Small rooms'],
        },
      },
    }));

    const result = await catalog.reviews('lpc0c60');

    expect(calls[0]?.url.pathname).toBe('/v3.0/data/reviews');
    expect(calls[0]?.url.searchParams.get('getSentiment')).toBe('true');
    expect(result).toEqual({
      ok: true,
      value: {
        total: 4557,
        likes: ['Great location'],
        dislikes: ['Small rooms'],
        reviews: [
          {
            score: 10,
            name: 'Charles',
            countryCode: 'AU',
            travelerType: 'couple',
            date: '2026-10-14T00:00:00Z',
            headline: 'Perfect stay',
            liked: 'Staff and location',
            disliked: null,
            language: 'en-gb',
          },
        ],
      },
    });
  });

  it('reads a 0 rating as no rating — liteAPI sends 0 for hotels it hasn’t rated', async () => {
    const { catalog } = setup(() => ({
      body: {
        data: {
          id: 'lp466fa',
          name: 'Hotel Trianon Rive Gauche',
          location: { latitude: 48.84, longitude: 2.34 },
          rating: 0,
          reviewCount: 5167,
          starRating: 4,
        },
      },
    }));

    expect(await catalog.hotel('lp466fa')).toMatchObject({
      ok: true,
      value: { rating: null, reviewCount: 5167, stars: 4 },
    });
  });
});
