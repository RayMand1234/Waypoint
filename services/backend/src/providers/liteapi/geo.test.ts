import { countryCodeSchema } from '@waypoint/contracts/common';
import { describe, expect, it } from 'vitest';
import { fakeFetch, silentLogger } from '../../testing/index.ts';
import { createLiteApiClient } from './client.ts';
import { createLiteApiGeo } from './geo.ts';

const geoWith = (body: unknown) => {
  const fake = fakeFetch(() => ({ body }));
  const client = createLiteApiClient({
    apiKey: 'k',
    baseUrl: 'https://api.test/v3.0',
    timeoutMs: 1000,
    fetch: fake.fetch,
  });

  return { ...fake, geo: createLiteApiGeo({ client, logger: silentLogger() }) };
};

const PT = countryCodeSchema.parse('PT');

describe('liteAPI geo', () => {
  it('lists countries sorted by name, skipping bad codes and duplicates', async () => {
    const { geo } = geoWith({
      data: [
        { code: 'PT', name: 'Portugal' },
        { code: 'IL', name: 'Israel' },
        { code: 'XXX', name: 'Nowhere' },
        { code: 'PT', name: 'Portugal' },
      ],
    });

    expect(await geo.countries()).toEqual({
      ok: true,
      value: [
        { code: 'IL', name: 'Israel' },
        { code: 'PT', name: 'Portugal' },
      ],
    });
  });

  it('lists a country’s cities once each, sorted', async () => {
    const { geo, calls } = geoWith({
      data: [
        { city: 'Porto' },
        { city: 'Lisbon' },
        { city: 'lisbon' },
        { city: ' ' },
      ],
    });

    const result = await geo.cities(PT);

    expect(calls[0]?.url.searchParams.get('countryCode')).toBe('PT');
    expect(result).toEqual({
      ok: true,
      value: [
        { name: 'Lisbon', countryCode: 'PT' },
        { name: 'Porto', countryCode: 'PT' },
      ],
    });
  });

  it('reads a place with its country and viewport', async () => {
    const { geo } = geoWith({
      data: {
        displayName: 'Lisbon',
        location: { latitude: 38.72, longitude: -9.14 },
        viewport: {
          high: { latitude: 38.8, longitude: -9.09 },
          low: { latitude: 38.69, longitude: -9.23 },
        },
        addressComponents: [
          { shortText: 'Lisbon', types: ['locality'] },
          { shortText: 'PT', types: ['country', 'political'] },
        ],
        types: ['locality'],
      },
    });

    expect(await geo.place('ChIJ-lisbon')).toEqual({
      ok: true,
      value: {
        placeId: 'ChIJ-lisbon',
        name: 'Lisbon',
        lat: 38.72,
        lng: -9.14,
        countryCode: 'PT',
        viewport: { north: 38.8, south: 38.69, east: -9.09, west: -9.23 },
        types: ['locality'],
      },
    });
  });

  it('flattens airport groups and keeps valid IATA codes only', async () => {
    const { geo } = geoWith({
      data: [
        {
          airports: [
            {
              iata: 'lis',
              name: 'Humberto Delgado',
              city: 'Lisbon',
              country: 'PT',
              lat: 38.77,
              lon: -9.13,
            },
            { iata: '', name: 'Heliport' },
          ],
        },
      ],
    });

    expect(await geo.airports('lis')).toEqual({
      ok: true,
      value: [
        {
          iata: 'LIS',
          name: 'Humberto Delgado',
          city: 'Lisbon',
          country: 'PT',
          lat: 38.77,
          lng: -9.13,
        },
      ],
    });
  });

  it('turns the city price index into USD money with an average', async () => {
    const { geo, calls } = geoWith({
      countryCode: 'PT',
      cityName: 'Lisbon',
      prices: [
        { day: '2027-05-12', avgPriceUsd: 150.5 },
        { day: '2027-05-13', avgPriceUsd: 160.5 },
      ],
    });

    const result = await geo.cityPrices({
      countryCode: PT,
      cityName: 'Lisbon',
      from: undefined,
      to: undefined,
    });

    expect(calls[0]?.url.searchParams.has('fromDate')).toBe(false);
    expect(result).toEqual({
      ok: true,
      value: {
        countryCode: 'PT',
        cityName: 'Lisbon',
        averagePerNight: { amountMinor: 15550, currency: 'USD' },
        days: [
          {
            date: '2027-05-12',
            averagePerNight: { amountMinor: 15050, currency: 'USD' },
          },
          {
            date: '2027-05-13',
            averagePerNight: { amountMinor: 16050, currency: 'USD' },
          },
        ],
      },
    });
  });
});
