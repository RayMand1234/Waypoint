import { airportSchema, type Airport } from '@waypoint/contracts/geo';
import { describe, expect, it } from 'vitest';
import { cityAirport, rankAirports } from './geo.logic.ts';

const airport = (
  iata: string,
  city: string,
  name: string,
  where: { country?: string; lat?: number; lng?: number } = {},
): Airport =>
  airportSchema.parse({
    iata,
    name,
    city,
    country: where.country ?? null,
    lat: where.lat ?? null,
    lng: where.lng ?? null,
  });

describe('rankAirports', () => {
  it("puts the typed city's airports first, keeping the provider's order", () => {
    const ranked = rankAirports(
      [
        airport('ROM', 'Rome', 'Rome - All Airports'),
        airport(
          'SAL',
          'San Salvador',
          'El Salvador International Airport Saint Óscar Arnulfo Romero',
        ),
        airport(
          'FCO',
          'Rome',
          'Rome–Fiumicino Leonardo da Vinci International Airport',
        ),
        airport(
          'YQM',
          'Moncton',
          'Greater Moncton Roméo LeBlanc International Airport',
        ),
      ],
      'Rome',
    );

    expect(ranked.map((a) => a.iata)).toEqual(['ROM', 'FCO', 'SAL', 'YQM']);
  });

  it('matches the code and ignores accents and case', () => {
    const ranked = rankAirports(
      [
        airport('CAT', 'New Bight', 'Cascais Airport'),
        airport('TLV', 'Tel Aviv', 'Ben Gurion'),
      ],
      'tlv',
    );

    expect(ranked[0]?.iata).toBe('TLV');
  });
});

describe('cityAirport', () => {
  const rome = { name: 'Rome', countryCode: 'IT', lat: 41.9, lng: 12.48 };

  it("takes the first airport listed under the city's name, in its country", () => {
    const picked = cityAirport(
      [
        airport('AAX', 'Araxa', 'Romeu Zema Airport', { country: 'BR' }),
        airport('ROM', 'Rome', 'Rome - All Airports', { country: 'IT' }),
        airport('FCO', 'Rome', 'Fiumicino', {
          country: 'IT',
          lat: 41.8,
          lng: 12.25,
        }),
      ],
      rome,
    );

    expect(picked?.iata).toBe('ROM');
  });

  it('otherwise takes the nearest airport in the country, within reach', () => {
    const tivoli = { name: 'Tivoli', countryCode: 'IT', lat: 41.96, lng: 12.8 };
    const airports = [
      airport('NAP', 'Naples', 'Naples', {
        country: 'IT',
        lat: 40.88,
        lng: 14.29,
      }),
      airport('CIA', 'Rome', 'Ciampino', {
        country: 'IT',
        lat: 41.8,
        lng: 12.59,
      }),
      airport('MXP', 'Milan', 'Malpensa', {
        country: 'IT',
        lat: 45.63,
        lng: 8.72,
      }),
    ];

    expect(cityAirport(airports, tivoli)?.iata).toBe('CIA');
    expect(cityAirport(airports.slice(2), tivoli)).toBeUndefined();
  });
});
