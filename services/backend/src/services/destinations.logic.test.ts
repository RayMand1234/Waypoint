import {
  destinationSchema,
  spotSchema,
  type Destination,
  type Spot,
} from '@waypoint/contracts/destinations';
import { describe, expect, it } from 'vitest';
import {
  matchedStyles,
  rankDestinations,
  rankSpots,
  searchedDestinationId,
} from './destinations.logic.ts';

const destination = (
  id: string,
  styles: string[],
  spotCount: number,
): Destination =>
  destinationSchema.parse({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    countryCode: 'PT',
    countryName: 'Portugal',
    airport: 'LIS',
    lat: 38.7,
    lng: -9.1,
    placeId: null,
    styles,
    photo: null,
    spotCount,
  });

const spot = (name: string, styles: string[], popularity: number): Spot =>
  spotSchema.parse({
    id: '6f0c6f3a-3c55-4b8e-9a8a-1f1b2c3d4e5f',
    destinationId: 'lisbon',
    name,
    category: 'landmark',
    styles,
    lat: 38.7,
    lng: -9.1,
    address: null,
    description: null,
    website: null,
    visitMinutes: 45,
    popularity,
    photo: null,
    openingHours: null,
    fee: { kind: 'unknown' },
    hasRating: false,
    checkedAt: '2027-04-01T10:00:00.000Z',
  });

describe('matchedStyles', () => {
  it('keeps the order the traveler asked in', () => {
    expect(
      matchedStyles(['culture', 'food', 'views'], ['views', 'beach', 'food']),
    ).toEqual(['views', 'food']);
  });
});

describe('rankDestinations', () => {
  it('puts the best style match first and marks only it', () => {
    const ranked = rankDestinations(
      [
        { destination: destination('porto', ['food'], 10), stayPerNight: null },
        {
          destination: destination('lisbon', ['food', 'views'], 40),
          stayPerNight: { amountMinor: 15000, currency: 'USD' },
        },
      ],
      ['views', 'food'],
    );

    expect(ranked.map((d) => [d.id, d.isBestMatch, d.matchedStyles])).toEqual([
      ['lisbon', true, ['views', 'food']],
      ['porto', false, ['food']],
    ]);
  });

  it('prefers the city with more to do when the styles match equally', () => {
    const ranked = rankDestinations(
      [
        { destination: destination('small', ['food'], 5), stayPerNight: null },
        { destination: destination('big', ['food'], 50), stayPerNight: null },
      ],
      ['food'],
    );

    expect(ranked[0]?.id).toBe('big');
  });
});

describe('rankSpots', () => {
  it('ranks by style fit, then popularity', () => {
    const ranked = rankSpots(
      [
        spot('Popular museum', ['culture'], 95),
        spot('Viewpoint', ['views', 'chill'], 60),
        spot('Castle', ['culture', 'views'], 80),
      ],
      ['views'],
    );

    expect(ranked.map((s) => s.name)).toEqual([
      'Castle',
      'Viewpoint',
      'Popular museum',
    ]);
  });

  it('falls back to popularity with no styles', () => {
    expect(
      rankSpots([spot('A', [], 10), spot('B', [], 90)], []).map((s) => s.name),
    ).toEqual(['B', 'A']);
  });
});

describe('searchedDestinationId', () => {
  it('slugs the name with the country', () => {
    expect(searchedDestinationId('São Paulo', 'BR', 'ChIJx')).toBe(
      'sao-paulo-br',
    );
    expect(searchedDestinationId('東京', 'JP', 'ChIJ_Ab9')).toBe('chij-ab9-jp');
  });
});
