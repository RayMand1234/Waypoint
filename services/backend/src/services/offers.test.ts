import {
  isoDateTimeSchema,
  isoLocalDateTimeSchema,
} from '@waypoint/contracts/common';
import { flightSearchRequestSchema } from '@waypoint/contracts/flights';
import {
  hotelSearchRequestSchema,
  hotelSummarySchema,
} from '@waypoint/contracts/hotels';
import { describe, expect, it } from 'vitest';
import type {
  ProviderFlightOffer,
  ProviderHotelOffer,
} from '../providers/types.ts';
import { LISBON } from '../testing/sampleTrip.ts';
import { toFlightOffers } from './flights.service.ts';
import {
  hotelQuality,
  resolveSearch,
  toHotelOffers,
} from './hotels.service.ts';

const checkedAt = isoDateTimeSchema.parse('2027-04-01T10:00:00.000Z');

const hotelOffer = (
  id: string,
  totalMinor: number,
  rating: number | null,
  stars: number | null,
  at: { readonly lat: number; readonly lng: number } = {
    lat: 38.7115,
    lng: -9.1301,
  },
): ProviderHotelOffer => ({
  provider: 'liteapi',
  providerOfferId: `offer-${id}`,
  hotel: hotelSummarySchema.parse({
    id,
    name: `Hotel ${id}`,
    address: null,
    cityName: 'Lisbon',
    countryCode: 'PT',
    ...at,
    stars,
    rating,
    reviewCount: null,
    mainPhotoUrl: null,
    thumbnailUrl: null,
  }),
  roomName: 'Double room',
  boardName: null,
  cancellation: 'non-refundable',
  price: { amountMinor: totalMinor, currency: 'EUR' },
  deepLink: `https://book.example/hotels/${id}`,
  checkedAt,
});

describe('toHotelOffers', () => {
  const request = hotelSearchRequestSchema.parse({
    location: { type: 'coordinates', lat: LISBON.lat, lng: LISBON.lng },
    checkin: '2027-05-12',
    checkout: '2027-05-16',
    limit: 2,
  });

  it('ranks by value, prices per night, measures distance and keeps the source', () => {
    const offers = toHotelOffers(
      [
        hotelOffer('pricey', 120_000, 9.5, 5),
        hotelOffer('good', 52_000, 9.0, 4),
        hotelOffer('poor', 40_000, 5.0, 2),
      ],
      request,
      resolveSearch(request),
    );

    expect(offers.map((o) => o.hotel.id)).toEqual(['good', 'poor']);
    expect(offers[0]).toMatchObject({
      nights: 4,
      bestPrice: { amountMinor: 52_000, currency: 'EUR' },
      pricePerNight: { amountMinor: 13_000, currency: 'EUR' },
      value: { isBestValue: true },
      sources: [
        { provider: 'liteapi', providerOfferId: 'offer-good', checkedAt },
      ],
    });
    expect(offers[0]?.distanceMeters).toBeGreaterThan(1000);
    expect(offers[0]?.distanceMeters).toBeLessThan(2000);
    expect(offers[0]).toMatchObject({
      stopsMinutes: null,
      isBestLocation: false,
    });
  });

  it('searched by stops, looks around them and ranks the nearer of equal hotels first', () => {
    // Three spots around Baixa, Lisbon.
    const stops = [
      { lat: 38.7107, lng: -9.1365 },
      { lat: 38.7139, lng: -9.1334 },
      { lat: 38.7081, lng: -9.1393 },
    ];
    const byStops = hotelSearchRequestSchema.parse({
      location: { type: 'stops', stops },
      checkin: '2027-05-12',
      checkout: '2027-05-16',
    });
    const search = resolveSearch(byStops);
    const offers = toHotelOffers(
      [
        hotelOffer('far', 52_000, 9.0, 4, { lat: 38.7369, lng: -9.1427 }),
        hotelOffer('near', 52_000, 9.0, 4, { lat: 38.7112, lng: -9.1362 }),
      ],
      byStops,
      search,
    );

    expect(search.query.location).toMatchObject({ type: 'coordinates' });
    expect(offers.map((o) => o.hotel.id)).toEqual(['near', 'far']);
    expect(offers[0]?.isBestLocation).toBe(true);
    expect(offers[1]?.isBestLocation).toBe(false);
    expect(offers[0]?.stopsMinutes).toBeLessThan(offers[1]?.stopsMinutes ?? 0);
  });

  it('falls back from rating to stars to a neutral quality', () => {
    expect(hotelQuality(hotelOffer('a', 1, 8, 2))).toBeCloseTo(0.8);
    expect(hotelQuality(hotelOffer('b', 1, null, 4))).toBeCloseTo(0.8);
    expect(hotelQuality(hotelOffer('c', 1, null, null))).toBeCloseTo(0.6);
  });
});

describe('toFlightOffers', () => {
  const at = (time: string) =>
    isoLocalDateTimeSchema.parse(`2027-05-12T${time}:00`);
  const flight = (
    id: string,
    priceMinor: number,
    minutes: number,
    stops: number,
  ): ProviderFlightOffer => ({
    provider: 'liteapi',
    providerOfferId: `fare-${id}`,
    itineraryId: id,
    legs: [
      {
        direction: 'outbound',
        departAt: at('06:00'),
        arriveAt: at('10:00'),
        durationMinutes: minutes,
        stops,
        segments: [
          {
            from: 'TLV',
            fromName: null,
            to: 'LIS',
            toName: null,
            departAt: at('06:00'),
            arriveAt: at('10:00'),
            carrier: { code: 'TP', name: null, logoUrl: null },
            flightNumber: 'TP1386',
            durationMinutes: minutes,
          },
        ],
      },
    ],
    price: { amountMinor: priceMinor, currency: 'EUR' },
    refundable: false,
    changeable: false,
    baggage: { carryOn: true, checked: false },
    seatsRemaining: null,
    expiresAt: null,
    deepLink: `https://book.example/booking?offerId=fare-${id}`,
    checkedAt,
  });

  it('weighs stops and duration against price', () => {
    const request = flightSearchRequestSchema.parse({
      origin: 'TLV',
      destination: 'LIS',
      departDate: '2027-05-12',
    });
    const offers = toFlightOffers(
      [
        flight('long-cheap', 40_000, 900, 2),
        flight('direct', 48_000, 355, 0),
        flight('one-stop', 45_000, 480, 1),
      ],
      request,
    );

    expect(offers.map((o) => o.id)).toEqual([
      'direct',
      'one-stop',
      'long-cheap',
    ]);
    expect(offers[0]?.value.isBestValue).toBe(true);
  });
});
