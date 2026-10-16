import { describe, expect, it } from 'vitest';
import { hotelSearchRequestSchema, listHotelsQuerySchema } from './routes.ts';

describe('hotelSearchRequestSchema', () => {
  const base = {
    location: { type: 'city', countryCode: 'pt', cityName: 'Lisbon' },
    checkin: '2027-05-12',
    checkout: '2027-05-16',
  };

  it('fills the sample trip defaults and upper-cases the country', () => {
    expect(hotelSearchRequestSchema.parse(base)).toEqual({
      ...base,
      location: { type: 'city', countryCode: 'PT', cityName: 'Lisbon' },
      adults: 2,
      childrenAges: [],
      currency: 'EUR',
      guestNationality: 'US',
      limit: 30,
    });
  });

  it('refuses a checkout that is not after checkin', () => {
    expect(
      hotelSearchRequestSchema.safeParse({ ...base, checkout: '2027-05-12' })
        .success,
    ).toBe(false);
  });

  it('refuses an unknown field (request bodies are strict)', () => {
    expect(
      hotelSearchRequestSchema.safeParse({ ...base, userId: 'x' }).success,
    ).toBe(false);
  });

  it('searches by the stops a trip visits, at least one', () => {
    const stops = (count: number) => ({
      ...base,
      location: {
        type: 'stops',
        stops: Array.from({ length: count }, () => ({ lat: 38.7, lng: -9.1 })),
      },
    });

    expect(hotelSearchRequestSchema.safeParse(stops(3)).success).toBe(true);
    expect(hotelSearchRequestSchema.safeParse(stops(0)).success).toBe(false);
  });
});

describe('listHotelsQuerySchema', () => {
  it('reads coordinates and paging from query strings', () => {
    expect(
      listHotelsQuerySchema.parse({
        type: 'coordinates',
        lat: '38.72',
        lng: '-9.14',
        limit: '10',
      }),
    ).toEqual({
      type: 'coordinates',
      lat: 38.72,
      lng: -9.14,
      radiusMeters: 5000,
      limit: 10,
      offset: 0,
    });
  });

  it('needs the fields of the chosen location type', () => {
    expect(
      listHotelsQuerySchema.safeParse({ type: 'city', countryCode: 'PT' })
        .success,
    ).toBe(false);
  });
});
